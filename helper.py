from urlextract import URLExtract
from wordcloud import WordCloud
import pandas as pd 
from collections import Counter
import emoji
import re
import numpy as np
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import seaborn as sns

extract = URLExtract()

def fetch_stats(selected_user, df): 
    """Enhanced statistics fetching with additional metrics"""
    if selected_user != "All Users":
        df = df[df['user'] == selected_user]
       
    # fetch number of messages
    num_messages = df.shape[0]

    # fetch total number of words
    words = []
    for message in df['message']:
        if isinstance(message, str):
            words.extend(message.split())

    # fetch number of media messages
    num_media_messages = df[df['message'] == '<Media omitted>\n'].shape[0]

    # fetch number of links 
    links = []
    for message in df['message']:
        if isinstance(message, str):
            links.extend(extract.find_urls(message))

    return num_messages, len(words), num_media_messages, len(links)

def get_advanced_stats(selected_user, df):
    """Get advanced statistics for enhanced analytics"""
    if selected_user != "All Users":
        df = df[df['user'] == selected_user]
    
    stats = {}
    
    # Basic stats
    stats['total_messages'] = df.shape[0]
    stats['unique_days'] = df['only_date'].nunique()
    stats['date_range'] = (df['date'].max() - df['date'].min()).days
    
    # Message patterns
    stats['avg_messages_per_day'] = stats['total_messages'] / max(stats['unique_days'], 1)
    stats['avg_words_per_message'] = sum(len(str(msg).split()) for msg in df['message']) / max(stats['total_messages'], 1)
    
    # Time patterns
    stats['most_active_hour'] = df['hour'].mode().iloc[0] if not df['hour'].empty else 0
    stats['most_active_day'] = df['day_name'].mode().iloc[0] if not df['day_name'].empty else 'N/A'
    stats['most_active_month'] = df['month'].mode().iloc[0] if not df['month'].empty else 'N/A'
    
    # Message types
    stats['media_percentage'] = (df[df['message'] == '<Media omitted>\n'].shape[0] / max(stats['total_messages'], 1)) * 100
    
    # Emoji count
    emoji_count = 0
    for message in df['message']:
        if isinstance(message, str):
            emoji_count += sum(1 for c in message if emoji.is_emoji(c))
    stats['total_emojis'] = emoji_count
    stats['emojis_per_message'] = emoji_count / max(stats['total_messages'], 1)
    
    return stats

def get_response_times(df):
    """Calculate response times between messages"""
    if df.empty:
        return pd.DataFrame()
    
    df_sorted = df.sort_values('date').copy()
    response_times = []
    
    for i in range(1, len(df_sorted)):
        current_user = df_sorted.iloc[i]['user']
        prev_user = df_sorted.iloc[i-1]['user']
        
        if current_user != prev_user and current_user != 'group_notification':
            time_diff = (df_sorted.iloc[i]['date'] - df_sorted.iloc[i-1]['date']).total_seconds() / 60
            if time_diff < 1440:  # Less than 24 hours
                response_times.append({
                    'user': current_user,
                    'response_time_minutes': time_diff,
                    'responding_to': prev_user
                })
    
    return pd.DataFrame(response_times)

def get_message_sentiment(selected_user, df):
    """Basic sentiment analysis using word patterns"""
    if selected_user != "All Users":
        df = df[df['user'] == selected_user]
    
    # Simple sentiment keywords (can be enhanced with proper NLP libraries)
    positive_words = ['good', 'great', 'awesome', 'excellent', 'amazing', 'love', 'like', 'happy', 
                     'wonderful', 'fantastic', 'perfect', 'best', 'nice', '😊', '😄', '😍', '❤️', '👍']
    negative_words = ['bad', 'awful', 'terrible', 'hate', 'dislike', 'sad', 'angry', 'worst', 
                     'horrible', 'disgusting', '😢', '😠', '😡', '💔', '👎']
    
    sentiments = []
    for message in df['message']:
        if isinstance(message, str):
            message_lower = message.lower()
            positive_count = sum(1 for word in positive_words if word in message_lower)
            negative_count = sum(1 for word in negative_words if word in message_lower)
            
            if positive_count > negative_count:
                sentiments.append('Positive')
            elif negative_count > positive_count:
                sentiments.append('Negative')
            else:
                sentiments.append('Neutral')
    
    return pd.Series(sentiments).value_counts()

def get_chat_streaks(df):
    """Find the longest chat streaks (consecutive days with messages)"""
    if df.empty:
        return {'longest_streak': 0, 'current_streak': 0}
    
    daily_activity = df.groupby('only_date').size().sort_index()
    dates = daily_activity.index
    
    max_streak = 0
    current_streak = 1
    
    for i in range(1, len(dates)):
        if (dates[i] - dates[i-1]).days == 1:
            current_streak += 1
        else:
            max_streak = max(max_streak, current_streak)
            current_streak = 1
    
    max_streak = max(max_streak, current_streak)
    
    # Current streak
    today = datetime.now().date()
    current_active_streak = 0
    for date in reversed(dates):
        if (today - date).days <= current_active_streak:
            current_active_streak += 1
        else:
            break
    
    return {'longest_streak': max_streak, 'current_streak': current_active_streak}
                
def fetch_busy_users(df):
    """Enhanced busy users analysis"""
    # Filter out notifications
    df_clean = df[~df['user'].isin(['group_notification', 'notification', 'Group notification', 'unknown'])]
    
    busy_users = df_clean['user'].value_counts().head()
    percentage_df = round(df_clean['user'].value_counts()/df_clean.shape[0]*100, 2).reset_index()
    percentage_df.columns = ['User', 'Percentage']
    
    return busy_users, percentage_df

def create_wordcloud(selected_user, df):
    """Enhanced word cloud generation with better preprocessing"""
    try:
        # Try to load stop words, create default if file not found
        try:
            stop_words = pd.read_csv("Tinglish_words.csv")['word'].str.lower().tolist()
        except:
            # Default stop words if file not found
            stop_words = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 
                         'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
                         'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'will', 'would',
                         'media', 'omitted', 'message', 'deleted']

        if selected_user != 'All Users':
            df = df[df['user'] == selected_user]

        # Clean data
        temp = df[df['user'] != 'group_notification'].copy()
        temp = temp[temp['message'] != '<Media omitted>\n']
        temp = temp[temp['message'] != 'This message was deleted']

        def remove_stop_words(message):
            if not isinstance(message, str):
                return ""
            
            # Remove URLs, mentions, and special characters
            message = re.sub(r'http\S+', '', message.lower())
            message = re.sub(r'@\w+', '', message)
            message = re.sub(r'[^\w\s]', ' ', message)
            
            words = []
            for word in message.split():
                if len(word) > 2 and word not in stop_words:
                    words.append(word)
            return " ".join(words)

        # Apply preprocessing
        temp['cleaned_message'] = temp['message'].apply(remove_stop_words)
        text = ' '.join(temp['cleaned_message'].tolist())
        
        if not text.strip():
            text = "No meaningful text found"

        wc = WordCloud(
            width=800, 
            height=400, 
            min_font_size=10, 
            background_color='white',
            colormap='viridis',
            max_words=100,
            relative_scaling=0.5
        )
        
        df_wc = wc.generate(text)
        return df_wc
        
    except Exception as e:
        print(f"Error in create_wordcloud: {e}")
        # Return a simple wordcloud with error message
        wc = WordCloud(width=400, height=200, background_color='white')
        return wc.generate("Error generating wordcloud")

def most_common_words(selected_user, df):
    """Enhanced most common words analysis"""
    try:
        # Try to load stop words
        try:
            stop_words = pd.read_csv("Tinglish_words.csv")['word'].str.lower().tolist()
        except:
            stop_words = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 
                         'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
                         'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'will', 'would',
                         'media', 'omitted', 'message', 'deleted', 'http', 'https', 'www']

        if selected_user != 'All Users':
            df = df[df['user'] == selected_user]

        # Clean data
        temp = df[df['user'] != 'group_notification'].copy()
        temp = temp[temp['message'] != '<Media omitted>\n']
        temp = temp[temp['message'] != 'This message was deleted']

        words = []
        for message in temp['message']:
            if isinstance(message, str):
                # Clean message
                clean_message = re.sub(r'http\S+', '', message.lower())
                clean_message = re.sub(r'[^\w\s]', ' ', clean_message)
                
                for word in clean_message.split():
                    if len(word) > 2 and word not in stop_words:
                        words.append(word)

        if not words:
            return pd.DataFrame([['No words found', 0]], columns=[0, 1])

        most_common_df = pd.DataFrame(Counter(words).most_common(20))
        return most_common_df
        
    except Exception as e:
        print(f"Error in most_common_words: {e}")
        return pd.DataFrame([['Error', 0]], columns=[0, 1])

def emoji_helper(selected_user, df):
    """Enhanced emoji analysis"""
    if selected_user != 'All Users':
        df = df[df['user'] == selected_user]

    emojis = []
    for message in df['message']:
        if isinstance(message, str):
            emojis.extend([c for c in message if emoji.is_emoji(c)])

    if not emojis:
        return pd.DataFrame([['No emojis found', 0]], columns=[0, 1])

    emoji_df = pd.DataFrame(Counter(emojis).most_common(len(Counter(emojis))))
    return emoji_df

def get_hourly_activity(selected_user, df):
    """Get hourly activity distribution"""
    if selected_user != 'All Users':
        df = df[df['user'] == selected_user]
    
    hourly_activity = df['hour'].value_counts().sort_index()
    return hourly_activity

def monthly_timeline(selected_user, df):
    """Enhanced monthly timeline"""
    if selected_user != 'All Users':
        df = df[df['user'] == selected_user]
    
    if df.empty:
        return pd.DataFrame(columns=['time', 'message'])
    
    timeline = df.groupby(['year', 'month_num', 'month']).count()['message'].reset_index()
    time = []
    for i in range(timeline.shape[0]):
        time.append(timeline['month'][i] + "-" + str(timeline['year'][i]))
    
    timeline['time'] = time
    return timeline

def daily_timeline(selected_user, df):
    """Enhanced daily timeline"""
    if selected_user != 'All Users':
        df = df[df['user'] == selected_user]
    
    if df.empty:
        return pd.DataFrame(columns=['only_date', 'message'])
    
    daily_timeline = df.groupby('only_date').count()['message'].reset_index()
    return daily_timeline

def week_activity_map(selected_user, df):
    """Enhanced weekly activity mapping"""
    if selected_user != 'All Users':
        df = df[df['user'] == selected_user]
    
    if df.empty:
        return pd.Series(dtype='int64')
    
    return df['day_name'].value_counts()

def month_activity_map(selected_user, df):
    """Enhanced monthly activity mapping"""
    if selected_user != 'All Users':
        df = df[df['user'] == selected_user]
    
    if df.empty:
        return pd.Series(dtype='int64')
    
    return df['month'].value_counts()

def activity_heatmap(selected_user, df):
    """Enhanced activity heatmap with better error handling"""
    if selected_user != 'All Users':
        df = df[df['user'] == selected_user]
    
    if df.empty:
        return pd.DataFrame()
    
    try:
        user_heatmap = df.pivot_table(index='day_name', columns='period', values='message', aggfunc='count').fillna(0)
        return user_heatmap
    except Exception as e:
        print(f"Error in activity_heatmap: {e}")
        # Return empty dataframe on error
        return pd.DataFrame()

def get_conversation_starters(df):
    """Identify users who start conversations most often"""
    df_sorted = df.sort_values(['only_date', 'date']).copy()
    
    conversation_starters = []
    current_date = None
    
    for idx, row in df_sorted.iterrows():
        if row['only_date'] != current_date:
            # New day, this user started a conversation
            if row['user'] not in ['group_notification', 'notification']:
                conversation_starters.append(row['user'])
            current_date = row['only_date']
        else:
            # Check if there's a significant time gap (more than 2 hours)
            prev_idx = df_sorted.index[df_sorted.index.get_loc(idx) - 1]
            time_diff = (row['date'] - df_sorted.loc[prev_idx, 'date']).total_seconds() / 3600
            
            if time_diff > 2 and row['user'] not in ['group_notification', 'notification']:
                conversation_starters.append(row['user'])
    
    return pd.Series(conversation_starters).value_counts()

def get_night_owls(df):
    """Identify users who send messages late at night"""
    night_messages = df[(df['hour'] >= 22) | (df['hour'] <= 5)]
    night_messages = night_messages[~night_messages['user'].isin(['group_notification', 'notification'])]
    
    return night_messages['user'].value_counts()

def get_early_birds(df):
    """Identify users who send messages early in the morning"""
    morning_messages = df[(df['hour'] >= 5) & (df['hour'] <= 8)]
    morning_messages = morning_messages[~morning_messages['user'].isin(['group_notification', 'notification'])]
    
    return morning_messages['user'].value_counts()

def get_message_length_stats(selected_user, df):
    """Get statistics about message lengths"""
    if selected_user != 'All Users':
        df = df[df['user'] == selected_user]
    
    # Calculate message lengths
    df_clean = df[df['message'] != '<Media omitted>\n'].copy()
    df_clean['message_length'] = df_clean['message'].astype(str).str.len()
    df_clean['word_count'] = df_clean['message'].astype(str).str.split().str.len()
    
    stats = {
        'avg_message_length': df_clean['message_length'].mean(),
        'median_message_length': df_clean['message_length'].median(),
        'avg_words_per_message': df_clean['word_count'].mean(),
        'longest_message': df_clean['message_length'].max(),
        'shortest_message': df_clean['message_length'].min()
    }
    
    return stats