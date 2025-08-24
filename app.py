import streamlit as st
import pandas as pd
import helper
import preprocessor
import matplotlib.pyplot as plt
import seaborn as sns

# Set page configuration
st.set_page_config(
    page_title="WhatsApp Chat Analyzer",
    page_icon="💬",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Enhanced modern CSS styling
st.markdown("""
<style>
    /* Import Google Fonts */
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

    /* Main app styling */
    .stApp {
        background: linear-gradient(135deg, #121212 0%, #1e1e2e 50%, #252545 100%);
        font-family: 'Poppins', sans-serif;
        color: #e0e0e0;
    }

    /* Sidebar styling */
    .css-1d391kg {
        background: linear-gradient(180deg, #1e1e2e 0%, #2a2a4a 100%);
        border-right: 1px solid rgba(59, 130, 246, 0.2);
    }

    /* Title styling */
    .stMarkdown h1 {
        background: linear-gradient(90deg, #3b82f6, #8b5cf6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-align: center;
        font-size: 2.5rem;
        margin-bottom: 1rem;
    }

    .stMarkdown h2, .stMarkdown h3 {
        color: #60a5fa;
        font-weight: 500;
        margin: 1rem 0;
    }

    /* File uploader styling */
    .stFileUploader > div {
        border: 2px dashed #3b82f6;
        border-radius: 12px;
        padding: 2rem;
        background: linear-gradient(135deg, rgba(30, 30, 46, 0.85) 0%, rgba(37, 37, 69, 0.85) 100%);
        backdrop-filter: blur(10px);
        text-align: center;
        transition: all 0.3s ease;
    }

    .stFileUploader > div:hover {
        border-color: #60a5fa;
        background: linear-gradient(135deg, rgba(30, 30, 46, 0.95) 0%, rgba(37, 37, 69, 0.95) 100%);
    }

    /* Selectbox and button styling */
    .stSelectbox > div > div, .stButton > button {
        background: linear-gradient(135deg, #1e1e2e 0%, #2a2a4a 100%);
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 10px;
        color: #e0e0e0 !important;
        font-weight: 500;
        transition: all 0.3s ease;
    }

    .stButton > button:hover {
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        border-color: #60a5fa;
    }

    /* Metric containers */
    [data-testid="metric-container"] {
        background: linear-gradient(135deg, #1e1e2e 0%, #2a2a4a 100%);
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.25);
        backdrop-filter: blur(8px);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    [data-testid="metric-container"]:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
    }

    [data-testid="metric-container"] > div > div > div {
        color: #e0e0e0 !important;
        font-weight: 500;
    }

    /* Section containers */
    .section-container {
        background: linear-gradient(135deg, rgba(30, 30, 46, 0.7) 0%, rgba(37, 37, 69, 0.7) 100%);
        border: 1px solid rgba(59, 130, 246, 0.25);
        border-radius: 12px;
        padding: 2rem;
        margin: 1.5rem 0;
        backdrop-filter: blur(10px);
    }

    /* Alert styling */
    .stSuccess, .stError, .stInfo {
        border-radius: 10px;
        padding: 1rem;
        backdrop-filter: blur(10px);
    }

    .stSuccess {
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(74, 222, 128, 0.1) 100%);
        border-left: 4px solid #22c55e;
        color: #a7f3d0;
    }

    .stError {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(248, 113, 113, 0.1) 100%);
        border-left: 4px solid #ef4444;
        color: #fecaca;
    }

    .stInfo {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 197, 253, 0.1) 100%);
        border-left: 4px solid #3b82f6;
        color: #bfdbfe;
    }

    /* Dataframe styling */
    .stDataFrame {
        background: linear-gradient(135deg, #1e1e2e 0%, #2a2a4a 100%);
        border-radius: 10px;
        border: 1px solid rgba(59, 130, 246, 0.3);
        color: #e0e0e0;
    }

    /* Scrollbar styling */
    ::-webkit-scrollbar {
        width: 10px;
        height: 10px;
    }

    ::-webkit-scrollbar-track {
        background: #1e1e2e;
        border-radius: 12px;
    }

    ::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        border-radius: 12px;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, #60a5fa, #a78bfa);
    }
</style>
""", unsafe_allow_html=True)

def configure_plot_style():
    """Configure matplotlib and seaborn for consistent dark theme"""
    plt.style.use('dark_background')
    sns.set_style("darkgrid", {
        "axes.facecolor": "#1e1e2e",
        "figure.facecolor": "#1e1e2e",
        "axes.edgecolor": "#3b82f6",
        "axes.labelcolor": "#e0e0e0",
        "text.color": "#e0e0e0",
        "xtick.color": "#e0e0e0",
        "ytick.color": "#e0e0e0",
        "grid.color": "#3b82f6",  # Changed from rgba to hex
        "grid.alpha": 0.2         # Added separate alpha parameter
    })
    
    # Additional matplotlib rcParams for better styling
    plt.rcParams.update({
        'figure.facecolor': '#1e1e2e',
        'axes.facecolor': '#1e1e2e',
        'savefig.facecolor': '#1e1e2e',
        'axes.edgecolor': '#3b82f6',
        'axes.labelcolor': '#e0e0e0',
        'text.color': '#e0e0e0',
        'xtick.color': '#e0e0e0',
        'ytick.color': '#e0e0e0',
        'grid.color': '#3b82f6',
        'grid.alpha': 0.2
    })

def main():
    # Title and description
    with st.container():
        st.title("💬 WhatsApp Chat Analyzer")
        st.markdown("Upload your WhatsApp chat export to uncover fascinating conversation insights!")

    # Sidebar for file upload and user selection
    with st.sidebar:
        st.header("📁 Upload Chat File")
        uploaded_file = st.file_uploader(
            "Choose a WhatsApp chat file",
            type=["txt", "csv"],
            help="Upload a valid WhatsApp chat export in .txt or .csv format"
        )

    # Main content
    if uploaded_file is not None:
        try:
            with st.spinner("🔄 Processing chat data..."):
                st.sidebar.success("File uploaded successfully!")
                df = preprocessor.preprocess(uploaded_file)

            # Check if DataFrame is empty
            if df.empty:
                st.error("❌ No valid messages found. Please verify the file format.")
                return

            st.success(f"✅ Processed {len(df):,} messages successfully!")

            # User selection
            with st.sidebar:
                st.header("👤 User Selection")
                user_list = df['user'].unique().tolist()
                notification_names = ['group_notification', 'notification', 'Group notification']
                user_list = [user for user in user_list if user not in notification_names and pd.notna(user)]
                user_list.sort()
                user_list.insert(0, "All Users")
                selected_user = st.selectbox("Select User", user_list, key="user_selector")

            # Analysis trigger
            if st.sidebar.button("Show Analysis", key="analyze_button"):
                with st.container():
                    configure_plot_style()
                    # Get statistics
                    num_messages, words, num_media_messages, num_links = helper.fetch_stats(selected_user, df)

                    # Display statistics
                    st.markdown("## 📊 Key Statistics")
                    col1, col2, col3, col4 = st.columns(4)
                    with col1:
                        st.metric("Total Messages", f"{num_messages:,}", help="Total messages sent")
                    with col2:
                        st.metric("Total Words", f"{words:,}", help="Total words exchanged")
                    with col3:
                        st.metric("Media Shared", f"{num_media_messages:,}", help="Images, videos, documents")
                    with col4:
                        st.metric("Links Shared", f"{num_links:,}", help="URLs shared")

                    st.markdown("---")

                    # Monthly Timeline
                    with st.container():
                        st.markdown("## 📈 Monthly Timeline")
                        timeline = helper.monthly_timeline(selected_user, df)
                        if not timeline.empty:
                            fig, ax = plt.subplots(figsize=(10, 4))
                            ax.plot(timeline['time'], timeline['message'], color='#3b82f6', linewidth=2)
                            ax.set_xlabel("Time")
                            ax.set_ylabel("Messages")
                            plt.xticks(rotation=25)
                            fig.patch.set_facecolor('#1e1e2e')
                            st.pyplot(fig)
                            plt.close()
                        else:
                            st.info("📈 No monthly timeline data available")

                    # Daily Timeline
                    with st.container():
                        st.markdown("## 📅 Daily Timeline")
                        daily_timeline = helper.daily_timeline(selected_user, df)
                        if not daily_timeline.empty:
                            fig, ax = plt.subplots(figsize=(10, 4))
                            ax.plot(daily_timeline['only_date'], daily_timeline['message'], color='#8b5cf6', linewidth=2)
                            ax.set_xlabel("Date")
                            ax.set_ylabel("Messages")
                            plt.xticks(rotation=25)
                            fig.patch.set_facecolor('#1e1e2e')
                            st.pyplot(fig)
                            plt.close()
                        else:
                            st.info("📅 No daily timeline data available")

                    # Activity Map
                    with st.container():
                        st.markdown("## 🗓️ Activity Map")
                        col1, col2 = st.columns(2)
                        with col1:
                            st.markdown("### Most Active Day")
                            busy_day = helper.week_activity_map(selected_user, df)
                            if not busy_day.empty:
                                fig, ax = plt.subplots(figsize=(6, 4))
                                ax.bar(busy_day.index, busy_day.values, color='#22c55e')
                                ax.set_xlabel("Day")
                                ax.set_ylabel("Messages")
                                plt.xticks(rotation=15)
                                fig.patch.set_facecolor('#1e1e2e')
                                st.pyplot(fig)
                                plt.close()
                            else:
                                st.info("🗓️ No weekly activity data available")
                        with col2:
                            st.markdown("### Most Active Month")
                            busy_month = helper.month_activity_map(selected_user, df)
                            if not busy_month.empty:
                                fig, ax = plt.subplots(figsize=(6, 4))
                                ax.bar(busy_month.index, busy_month.values, color='#f59e0b')
                                ax.set_xlabel("Month")
                                ax.set_ylabel("Messages")
                                plt.xticks(rotation=15)
                                fig.patch.set_facecolor('#1e1e2e')
                                st.pyplot(fig)
                                plt.close()
                            else:
                                st.info("📊 No monthly activity data available")

                    # Most Busy Users (Group Level)
                    if selected_user == 'All Users':
                        with st.container():
                            st.markdown("## 👥 Most Active Users")
                            busy_users, new_df = helper.fetch_busy_users(df)
                            if not busy_users.empty:
                                col1, col2 = st.columns([2, 1])
                                with col1:
                                    fig, ax = plt.subplots(figsize=(8, 4))
                                    ax.bar(busy_users.index, busy_users.values, color='#ef4444')
                                    ax.set_xlabel("Users")
                                    ax.set_ylabel("Messages")
                                    plt.xticks(rotation=15)
                                    fig.patch.set_facecolor('#1e1e2e')
                                    st.pyplot(fig)
                                    plt.close()
                                with col2:
                                    st.markdown("### User Activity Breakdown")
                                    st.dataframe(new_df, use_container_width=True)
                            else:
                                st.info("👥 No user activity data available")

                    # WordCloud
                    with st.container():
                        st.markdown("## ☁️ Word Cloud")
                        df_wc = helper.create_wordcloud(selected_user, df)
                        if df_wc:
                            fig, ax = plt.subplots(figsize=(10, 5))
                            ax.imshow(df_wc, interpolation='bilinear')
                            ax.axis('off')
                            fig.patch.set_facecolor('#1e1e2e')
                            st.pyplot(fig)
                            plt.close()
                        else:
                            st.info("☁️ No word cloud data available")

                    # Most Common Words
                    with st.container():
                        st.markdown("## 🔤 Most Common Words")
                        try:
                            common_words = helper.most_common_words(selected_user, df)
                            if not common_words[0].empty:
                                fig, ax = plt.subplots(figsize=(10, 5))
                                ax.barh(common_words[0], common_words[1], color='#10b981')
                                ax.set_xlabel("Frequency")
                                ax.set_ylabel("Words")
                                fig.patch.set_facecolor('#1e1e2e')
                                st.pyplot(fig)
                                plt.close()
                            else:
                                st.info("🔤 No common words data available")
                        except Exception as e:
                            st.error(f"❌ Error generating common words: {str(e)}")
                            st.info("Please verify the most_common_words function in helper.py")

                    # Emoji Analysis
                    with st.container():
                        st.markdown("## 😊 Emoji Analysis")
                        try:
                            emoji_df = helper.emoji_helper(selected_user, df)
                            if not emoji_df.empty:
                                col1, col2 = st.columns([1, 2])
                                with col1:
                                    st.markdown("### Top Emojis")
                                    st.dataframe(emoji_df, use_container_width=True)
                                with col2:
                                    fig, ax = plt.subplots(figsize=(6, 6))
                                    ax.pie(emoji_df[1].head(), labels=emoji_df[0].head(), autopct="%0.2f%%", colors=['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444'])
                                    fig.patch.set_facecolor('#1e1e2e')
                                    st.pyplot(fig)
                                    plt.close()
                            else:
                                st.info("😊 No emoji data available")
                        except Exception as e:
                            st.error(f"❌ Error generating emoji analysis: {str(e)}")
                            st.info("Please verify the emoji_helper function in helper.py")

                    # Monthly Activity Heatmap
                    with st.container():
                        st.markdown("## 🔥 Monthly Activity Heatmap")
                        user_heatmap = helper.activity_heatmap(selected_user, df)
                        if not user_heatmap.empty:
                            fig, ax = plt.subplots(figsize=(10, 5))
                            sns.heatmap(user_heatmap, cmap="Blues", ax=ax)
                            ax.set_xlabel("Hour")
                            ax.set_ylabel("Day")
                            fig.patch.set_facecolor('#1e1e2e')
                            st.pyplot(fig)
                            plt.close()
                        else:
                            st.info("🔥 No activity heatmap data available")

        except Exception as e:
            st.error(f"❌ Error processing file: {str(e)}")
            with st.expander("🔍 Detailed Error Information"):
                import traceback
                st.code(traceback.format_exc())

    else:
        # Instructions when no file is uploaded
        with st.container():
            st.markdown("## 📋 How to Get Started")
            st.info("👆 Upload a WhatsApp chat file (.txt or .csv) from the sidebar to begin analysis.")
            st.markdown("""
            ### Steps to Export WhatsApp Chat:
            1. Open WhatsApp and go to the desired chat
            2. Tap the menu (⋮) > More > Export Chat
            3. Choose "Without Media" and save as .txt or .csv
            4. Upload the file in the sidebar
            """)

if __name__ == "__main__":
    main()