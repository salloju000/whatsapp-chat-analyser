import pandas as pd
import re
from io import StringIO
import unicodedata
import urllib.parse
from datetime import datetime
import warnings

# Suppress pandas warnings
warnings.filterwarnings('ignore')

def clean_text(text):
    """
    Enhanced text cleaning to prevent URI encoding errors and improve processing
    """
    if not isinstance(text, str):
        text = str(text)
    
    # Remove or replace problematic characters
    # Remove null bytes and control characters
    text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)
    
    # Remove common WhatsApp artifacts
    text = text.replace('\u202f', ' ').replace('\u200e', '').replace('\u200f', '')
    
    # Normalize Unicode characters
    try:
        text = unicodedata.normalize('NFKC', text)
    except:
        # If normalization fails, encode/decode to clean
        text = text.encode('utf-8', errors='ignore').decode('utf-8')
    
    # Test if the text can be URI encoded
    try:
        urllib.parse.quote(text)
    except:
        # If it can't be encoded, clean it more aggressively
        text = ''.join(char for char in text if ord(char) < 65536 and (char.isprintable() or char.isspace()))
    
    return text.strip()

def detect_date_format(lines):
    """
    Detect the date format used in the WhatsApp export
    """
    date_patterns = [
        r'^\d{1,2}/\d{1,2}/\d{2}, \d{1,2}:\d{2} [AP]M',      # MM/DD/YY, H:MM AM/PM
        r'^\d{1,2}/\d{1,2}/\d{4}, \d{1,2}:\d{2} [AP]M',      # MM/DD/YYYY, H:MM AM/PM
        r'^\d{1,2}/\d{1,2}/\d{2}, \d{2}:\d{2}',              # MM/DD/YY, HH:MM (24h)
        r'^\d{1,2}/\d{1,2}/\d{4}, \d{2}:\d{2}',              # MM/DD/YYYY, HH:MM (24h)
        r'^\[\d{1,2}/\d{1,2}/\d{2}, \d{1,2}:\d{2} [AP]M\]',  # [MM/DD/YY, H:MM AM/PM]
        r'^\d{1,2}\.\d{1,2}\.\d{2}, \d{1,2}:\d{2}',          # DD.MM.YY, HH:MM
        r'^\d{4}-\d{2}-\d{2}, \d{2}:\d{2}:\d{2}',            # YYYY-MM-DD, HH:MM:SS
    ]
    
    format_strings = [
        '%m/%d/%y, %I:%M %p',
        '%m/%d/%Y, %I:%M %p', 
        '%m/%d/%y, %H:%M',
        '%m/%d/%Y, %H:%M',
        '%m/%d/%y, %I:%M %p',  # For bracketed format
        '%d.%m.%y, %H:%M',
        '%Y-%m-%d, %H:%M:%S'
    ]
    
    for pattern, fmt in zip(date_patterns, format_strings):
        for line in lines[:20]:  # Check first 20 lines
            if re.match(pattern, line):
                return pattern, fmt
    
    # Default format
    return r'^\d{1,2}/\d{1,2}/\d{2}, \d{1,2}:\d{2} [AP]M', '%m/%d/%y, %I:%M %p'

def preprocess(uploaded_file):
    """
    Enhanced WhatsApp chat preprocessing with better error handling and format detection
    
    Args:
        uploaded_file: Streamlit UploadedFile object or file path string
    
    Returns:
        pandas.DataFrame: Processed WhatsApp chat data
    """
    
    try:
        # Handle different file input types with multiple encoding attempts
        raw_lines = []
        
        if hasattr(uploaded_file, 'read'):
            # It's a Streamlit UploadedFile object
            content = uploaded_file.read()
            if isinstance(content, bytes):
                # Try multiple encodings
                for encoding in ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252', 'iso-8859-1']:
                    try:
                        content = content.decode(encoding)
                        break
                    except UnicodeDecodeError:
                        continue
                else:
                    # If all fail, use utf-8 with error handling
                    content = content.decode('utf-8', errors='replace')
            raw_lines = content.splitlines()
        else:
            # It's a file path string
            for encoding in ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252', 'iso-8859-1']:
                try:
                    with open(uploaded_file, 'r', encoding=encoding) as file:
                        raw_lines = file.readlines()
                    break
                except (UnicodeDecodeError, FileNotFoundError):
                    continue
            else:
                # If all fail, use utf-8 with error handling
                try:
                    with open(uploaded_file, 'r', encoding='utf-8', errors='replace') as file:
                        raw_lines = file.readlines()
                except FileNotFoundError:
                    print(f"File not found: {uploaded_file}")
                    return pd.DataFrame()

        if not raw_lines:
            return pd.DataFrame()

        # Clean and normalize lines
        normalized_lines = []
        for line in raw_lines:
            clean_line = clean_text(line)
            if clean_line and len(clean_line.strip()) > 0:
                normalized_lines.append(clean_line)

        if not normalized_lines:
            return pd.DataFrame()

        # Detect date format
        date_pattern, date_format = detect_date_format(normalized_lines)
        
        # Group multi-line messages
        grouped_messages = group_messages(normalized_lines, date_pattern)
        
        if not grouped_messages:
            return pd.DataFrame()

        # Extract structured data
        data = extract_message_data(grouped_messages, date_pattern, date_format)
        
        if not data['date']:
            return pd.DataFrame()

        # Create DataFrame
        df = pd.DataFrame(data)

        # Clean and enhance the DataFrame
        df = enhance_dataframe(df)
        
        return df
        
    except Exception as e:
        print(f"Error in preprocessing: {e}")
        return pd.DataFrame()

def group_messages(lines, date_pattern):
    """
    Enhanced message grouping that handles various WhatsApp formats
    """
    grouped = []
    current_msg = ""
    
    pattern = re.compile(date_pattern)

    for line in lines:
        # Check if line starts with a timestamp
        if pattern.match(line):
            if current_msg:
                grouped.append(current_msg)
            current_msg = line
        else:
            # Continuation of previous message
            if current_msg:
                current_msg += " " + line
            else:
                # Orphaned line, skip it
                continue

    # Don't forget the last message
    if current_msg:
        grouped.append(current_msg)

    return grouped

def extract_message_data(grouped_messages, date_pattern, date_format):
    """
    Enhanced data extraction with better pattern matching
    """
    data = {
        'date': [],
        'user': [],
        'message': []
    }

    # Create comprehensive pattern for message parsing
    # Handle different formats: with/without brackets, different separators
    patterns = [
        r'^(\d{1,2}/\d{1,2}/\d{2}), (\d{1,2}:\d{2} [AP]M) - (?:(.*?): )?(.*)$',
        r'^(\d{1,2}/\d{1,2}/\d{4}), (\d{1,2}:\d{2} [AP]M) - (?:(.*?): )?(.*)$',
        r'^(\d{1,2}/\d{1,2}/\d{2}), (\d{2}:\d{2}) - (?:(.*?): )?(.*)$',
        r'^\[(\d{1,2}/\d{1,2}/\d{2}), (\d{1,2}:\d{2} [AP]M)\] (?:(.*?): )?(.*)$',
        r'^(\d{1,2}\.\d{1,2}\.\d{2}), (\d{1,2}:\d{2}) - (?:(.*?): )?(.*)$',
        r'^(\d{4}-\d{2}-\d{2}), (\d{2}:\d{2}:\d{2}) - (?:(.*?): )?(.*)$',
    ]

    for entry in grouped_messages:
        entry = clean_text(entry)
        matched = False
        
        for pattern in patterns:
            match = re.match(pattern, entry)
            if match:
                date_part = clean_text(match.group(1))
                time_part = clean_text(match.group(2))
                user = clean_text(match.group(3)) if match.group(3) else None
                message = clean_text(match.group(4)) if match.group(4) else ""

                # Handle different date formats
                full_datetime = f"{date_part}, {time_part}"
                
                data['date'].append(full_datetime)
                data['user'].append(user if user else 'system_notification')
                data['message'].append(message)
                matched = True
                break
        
        if not matched:
            # Handle edge cases - system messages, notifications, etc.
            data['date'].append('unknown')
            data['user'].append('unknown')
            data['message'].append(clean_text(entry))

    return data

def enhance_dataframe(df):
    """
    Enhanced DataFrame processing with additional features
    """
    if df.empty:
        return pd.DataFrame()

    # Remove unknown entries
    df = df[df['date'] != 'unknown'].copy()
    
    if df.empty:
        return pd.DataFrame()

    # Enhanced date parsing with multiple format attempts
    def parse_date_flexible(date_str):
        """Try multiple date formats"""
        formats = [
            '%m/%d/%y, %I:%M %p',    # 12/31/23, 11:59 PM
            '%d/%m/%y, %I:%M %p',    # 31/12/23, 11:59 PM
            '%m/%d/%Y, %I:%M %p',    # 12/31/2023, 11:59 PM
            '%d/%m/%Y, %I:%M %p',    # 31/12/2023, 11:59 PM
            '%m/%d/%y, %H:%M',       # 12/31/23, 23:59
            '%d/%m/%y, %H:%M',       # 31/12/23, 23:59
            '%d.%m.%y, %H:%M',       # 31.12.23, 23:59
            '%Y-%m-%d, %H:%M:%S',    # 2023-12-31, 23:59:59
        ]
        
        for fmt in formats:
            try:
                return pd.to_datetime(date_str, format=fmt)
            except:
                continue
        
        # If all specific formats fail, try pandas' general parser
        try:
            return pd.to_datetime(date_str)
        except:
            return pd.NaT

    # Apply flexible date parsing
    df['date'] = df['date'].apply(parse_date_flexible)
    
    # Remove rows with failed date parsing
    df = df.dropna(subset=['date']).copy()
    
    if df.empty:
        return pd.DataFrame()

    # Sort by date
    df = df.sort_values('date').reset_index(drop=True)

    # Add comprehensive time-based columns
    df['year'] = df['date'].dt.year
    df['month'] = df['date'].dt.month_name()
    df['month_num'] = df['date'].dt.month
    df['day'] = df['date'].dt.day
    df['hour'] = df['date'].dt.hour
    df['minute'] = df['date'].dt.minute
    df['only_date'] = df['date'].dt.date
    df['day_name'] = df['date'].dt.day_name()
    df['week_of_year'] = df['date'].dt.isocalendar().week
    df['day_of_year'] = df['date'].dt.dayofyear
    df['quarter'] = df['date'].dt.quarter
    
    # Create time periods for analysis
    def get_time_period(hour):
        """Categorize hours into time periods"""
        if 5 <= hour < 12:
            return 'Morning'
        elif 12 <= hour < 17:
            return 'Afternoon'
        elif 17 <= hour < 21:
            return 'Evening'
        else:
            return 'Night'
    
    df['time_period'] = df['hour'].apply(get_time_period)
    
    # Create period column for heatmap (hour-based)
    df['period'] = df['hour'].apply(lambda x: f"{x:02d}-{(x+1)%24:02d}")
    
    # Clean user names
    df['user'] = df['user'].fillna('system_notification')
    df['user'] = df['user'].apply(lambda x: clean_text(str(x)) if x else 'system_notification')
    
    # Clean messages
    df['message'] = df['message'].fillna('')
    df['message'] = df['message'].apply(lambda x: clean_text(str(x)) if x else '')
    
    # Add message metadata
    df['message_length'] = df['message'].str.len()
    df['word_count'] = df['message'].str.split().str.len()
    df['is_media'] = df['message'].str.contains('<Media omitted>', na=False)
    df['is_deleted'] = df['message'].str.contains('This message was deleted', na=False)
    
    # Extract URLs
    def extract_urls(text):
        """Extract URLs from text"""
        if not isinstance(text, str):
            return 0
        url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
        return len(re.findall(url_pattern, text))
    
    df['url_count'] = df['message'].apply(extract_urls)
    df['has_url'] = df['url_count'] > 0
    
    # Extract emojis count
    def count_emojis(text):
        """Count emojis in text"""
        if not isinstance(text, str):
            return 0
        try:
            import emoji
            return len([c for c in text if emoji.is_emoji(c)])
        except ImportError:
            # Fallback: simple emoji detection using Unicode ranges
            emoji_pattern = re.compile(
                "[\U0001F600-\U0001F64F"  # emoticons
                "\U0001F300-\U0001F5FF"  # symbols & pictographs
                "\U0001F680-\U0001F6FF"  # transport & map symbols
                "\U0001F1E0-\U0001F1FF"  # flags (iOS)
                "\U00002702-\U000027B0"
                "\U000024C2-\U0001F251"
                "]+", flags=re.UNICODE)
            return len(emoji_pattern.findall(text))
    
    df['emoji_count'] = df['message'].apply(count_emojis)
    df['has_emoji'] = df['emoji_count'] > 0
    
    # Add conversation metadata
    df['is_weekend'] = df['date'].dt.dayofweek.isin([5, 6])  # Saturday=5, Sunday=6
    df['is_business_hours'] = df['hour'].between(9, 17)
    
    # Final cleaning pass
    string_columns = ['user', 'message', 'month', 'day_name', 'time_period']
    for col in string_columns:
        if col in df.columns:
            df[col] = df[col].astype(str).apply(clean_text)
    
    return df

def validate_dataframe(df):
    """
    Enhanced DataFrame validation with comprehensive checks
    """
    if df.empty:
        return df, []
    
    validation_issues = []
    
    # Check for required columns
    required_columns = ['date', 'user', 'message']
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        validation_issues.append(f"Missing required columns: {missing_columns}")
        return df, validation_issues
    
    # Check date column
    if df['date'].isna().all():
        validation_issues.append("All dates are invalid")
        return df, validation_issues
    
    # Check for URI encoding issues
    for col in df.select_dtypes(include=['object']):
        try:
            # Test a sample of values
            sample_values = df[col].dropna().astype(str).head(10)
            for val in sample_values:
                urllib.parse.quote(str(val))
        except Exception as e:
            validation_issues.append(f"Column '{col}' contains characters that may cause URI errors")
            # Clean the entire column
            df[col] = df[col].astype(str).apply(clean_text)
    
    # Data quality checks
    total_messages = len(df)
    valid_dates = df['date'].notna().sum()
    valid_users = df['user'].notna().sum()
    
    if valid_dates / total_messages < 0.8:
        validation_issues.append(f"Low date validity: {valid_dates}/{total_messages}")
    
    if valid_users / total_messages < 0.8:
        validation_issues.append(f"Low user validity: {valid_users}/{total_messages}")
    
    # Check for reasonable date range
    if not df.empty and df['date'].notna().any():
        date_range = (df['date'].max() - df['date'].min()).days
        if date_range > 3650:  # More than 10 years
            validation_issues.append(f"Unusually large date range: {date_range} days")
        elif date_range < 0:
            validation_issues.append("Invalid date range (negative)")
    
    return df, validation_issues

def get_preprocessing_stats(df):
    """
    Get statistics about the preprocessing results
    """
    if df.empty:
        return {
            'total_messages': 0,
            'date_range': 'N/A',
            'users_found': 0,
            'processing_success': False
        }
    
    stats = {
        'total_messages': len(df),
        'valid_dates': df['date'].notna().sum(),
        'date_range': f"{df['date'].min().strftime('%Y-%m-%d')} to {df['date'].max().strftime('%Y-%m-%d')}" if df['date'].notna().any() else 'N/A',
        'users_found': df['user'].nunique(),
        'media_messages': df['is_media'].sum() if 'is_media' in df.columns else 0,
        'deleted_messages': df['is_deleted'].sum() if 'is_deleted' in df.columns else 0,
        'messages_with_urls': df['has_url'].sum() if 'has_url' in df.columns else 0,
        'messages_with_emojis': df['has_emoji'].sum() if 'has_emoji' in df.columns else 0,
        'processing_success': True
    }
    
    return stats

def create_sample_data():
    """
    Create sample data for testing purposes
    """
    import random
    from datetime import datetime, timedelta
    
    users = ['Alice', 'Bob', 'Charlie', 'Diana']
    messages = [
        'Hello everyone!',
        'How are you doing?',
        'Great meeting today',
        'Thanks for the update',
        'See you tomorrow',
        'Have a great day!',
        '😊 Sounds good',
        'Let me know if you need anything',
        'Perfect!',
        '<Media omitted>'
    ]
    
    data = []
    start_date = datetime.now() - timedelta(days=30)
    
    for i in range(100):
        random_date = start_date + timedelta(
            days=random.randint(0, 30),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59)
        )
        
        data.append({
            'date': random_date,
            'user': random.choice(users),
            'message': random.choice(messages)
        })
    
    df = pd.DataFrame(data)
    return enhance_dataframe(df)

# Utility functions for debugging and testing

def test_preprocessing():
    """
    Test the preprocessing functions with sample data
    """
    print("Testing preprocessing functions...")
    
    # Test with sample data
    sample_text = """12/31/23, 11:59 PM - Alice: Happy New Year everyone! 🎉
1/1/24, 12:01 AM - Bob: Happy New Year! 
1/1/24, 12:02 AM - Charlie: <Media omitted>
1/1/24, 8:30 AM - Alice: Good morning!"""
    
    # Simulate file-like object
    class MockFile:
        def __init__(self, content):
            self.content = content
        
        def read(self):
            return self.content.encode('utf-8')
    
    mock_file = MockFile(sample_text)
    result_df = preprocess(mock_file)
    
    print(f"Processed {len(result_df)} messages")
    print("Sample data:")
    print(result_df.head())
    
    # Validation
    df_validated, issues = validate_dataframe(result_df)
    if issues:
        print("Validation issues found:")
        for issue in issues:
            print(f"  - {issue}")
    else:
        print("✅ All validation checks passed")
    
    # Stats
    stats = get_preprocessing_stats(result_df)
    print("Preprocessing stats:")
    for key, value in stats.items():
        print(f"  {key}: {value}")

if __name__ == "__main__":
    test_preprocessing()