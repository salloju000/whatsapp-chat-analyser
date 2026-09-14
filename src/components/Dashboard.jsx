import { ArrowLeft, Calendar, Heart, TrendingUp } from 'lucide-react';
import PropTypes from 'prop-types';
import ActivityChart from './ActivityChart';
import AnimatedCounter from './AnimatedCounter';
import LogoMark from './common/LogoMark';
import EmojiAnalysis from './EmojiAnalysis';
import MessageStats from './MessageStats';
import Participants from './Participants';
import Timeline from './Timeline';
import WordCloud from './WordCloud';
import { formatDayKey } from '../utils/format';

const FORMAT_LABELS = { ios: 'iOS', android: 'Android' };

const Dashboard = ({ analytics, meta, onReset }) => {
  const { mostActiveDay, daysChatting, activeDays, participantCount } = analytics;

  return (
    <div className="min-h-screen bg-surface-base">
      <header className="sticky top-0 z-40 bg-surface-card/80 backdrop-blur-xl border-b border-edge">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <LogoMark className="h-9 w-9" />
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-content-primary truncate">Chat Analyzer</h1>
                <p className="text-xs text-content-muted truncate">
                  {meta?.format ? `${FORMAT_LABELS[meta.format] ?? meta.format} export` : 'Conversation insights'}
                  {participantCount > 0 && ` · ${participantCount} participants`}
                </p>
              </div>
            </div>

            <button
              onClick={onReset}
              aria-label="Analyze a different chat"
              className="flex items-center gap-2 shrink-0 px-4 py-2 bg-content-primary/5 hover:bg-content-primary/10 text-content-secondary hover:text-content-primary font-medium rounded-lg border border-edge"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-pink-500/20 rounded-2xl mb-6 border border-indigo-500/20">
            <Heart className="w-10 h-10 text-pink-400" fill="currentColor" aria-hidden="true" />
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-content-primary mb-4">
            Your Story in <span className="gradient-text">Numbers</span>
          </h2>

          <p className="text-lg text-content-muted max-w-2xl mx-auto mb-6">
            Every conversation, every emoji, every word — analyzed entirely on your device
          </p>

          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-6 py-3 bg-content-primary/5 rounded-full border border-edge">
            <Calendar className="w-5 h-5 text-indigo-400" aria-hidden="true" />
            <span className="text-content-secondary font-medium">
              <AnimatedCounter end={daysChatting} /> days together
            </span>
            <span className="text-content-muted">·</span>
            <span className="text-content-muted">{activeDays?.toLocaleString()} with messages</span>
          </div>

          {meta?.dateOrderConfident === false && (
            <p className="mt-4 text-xs text-content-muted max-w-md mx-auto">
              Dates in this export are ambiguous, so they were read as day/month.
            </p>
          )}
        </section>

        <Participants analytics={analytics} />

        <section className="mb-8">
          <MessageStats analytics={analytics} />
        </section>

        <Timeline analytics={analytics} />

        <section className="space-y-8 mb-8">
          <ActivityChart analytics={analytics} />
          <EmojiAnalysis analytics={analytics} />
          <WordCloud analytics={analytics} />
        </section>

        {mostActiveDay && (
          <section className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-2xl p-8 text-center border border-orange-500/20 mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl mb-4">
              <TrendingUp className="w-8 h-8 text-white" aria-hidden="true" />
            </div>

            <h3 className="text-2xl font-bold text-content-primary mb-3">Most Active Day</h3>

            <div className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400 mb-2">
              {formatDayKey(mostActiveDay[0])}
            </div>

            <p className="text-lg text-content-secondary">
              <span className="font-semibold text-content-primary">
                <AnimatedCounter end={mostActiveDay[1]} />
              </span>{' '}
              messages exchanged
            </p>
          </section>
        )}
      </main>

      <div className="h-16" />
    </div>
  );
};

Dashboard.propTypes = {
  analytics: PropTypes.shape({
    users: PropTypes.array.isRequired,
    daysChatting: PropTypes.number.isRequired,
    activeDays: PropTypes.number,
    participantCount: PropTypes.number,
    messagesByUser: PropTypes.object.isRequired,
    totalMessages: PropTypes.number.isRequired,
    mostActiveDay: PropTypes.array,
  }).isRequired,
  meta: PropTypes.object,
  onReset: PropTypes.func.isRequired,
};

export default Dashboard;
