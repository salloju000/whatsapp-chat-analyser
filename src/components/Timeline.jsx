import { Calendar, Heart } from 'lucide-react';
import PropTypes from 'prop-types';
import SectionHeader from './common/SectionHeader';
import { formatDate, formatTime } from '../utils/format';

const Endpoint = ({ label, message, tone, emoji }) => (
  <div className={`rounded-xl p-6 text-center border ${tone.box}`}>
    <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${tone.label}`}>{label}</p>
    <p className="text-2xl font-bold text-content-primary mb-1">
      {formatDate(message?.timestamp)}
    </p>
    <p className="text-sm text-content-muted mb-3">{formatTime(message?.timestamp)}</p>
    <div className="text-3xl" aria-hidden="true">
      {emoji}
    </div>
  </div>
);

Endpoint.propTypes = {
  label: PropTypes.string.isRequired,
  message: PropTypes.object,
  tone: PropTypes.object.isRequired,
  emoji: PropTypes.string.isRequired,
};

const Timeline = ({ analytics }) => {
  const { firstMessage, lastMessage } = analytics;
  if (!firstMessage || !lastMessage) return null;

  return (
    <section className="bg-surface-card rounded-2xl p-8 mb-8 border border-edge">
      <SectionHeader
        icon={Calendar}
        title="Timeline"
        subtitle="Your conversation journey"
        tint="from-purple-500/20 to-pink-500/20"
        iconClass="text-purple-400"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <Endpoint
          label="First Message"
          message={firstMessage}
          emoji="💌"
          tone={{
            box: 'border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-purple-500/10',
            label: 'text-indigo-400',
          }}
        />

        <div className="hidden md:flex items-center justify-center" aria-hidden="true">
          <div className="relative w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-surface-card rounded-full flex items-center justify-center border-2 border-pink-500">
              <Heart className="w-4 h-4 text-pink-400" fill="currentColor" />
            </div>
          </div>
        </div>

        <Endpoint
          label="Latest Message"
          message={lastMessage}
          emoji="💝"
          tone={{
            box: 'border-pink-500/20 bg-gradient-to-br from-pink-500/10 to-rose-500/10',
            label: 'text-pink-400',
          }}
        />
      </div>
    </section>
  );
};

Timeline.propTypes = {
  analytics: PropTypes.shape({
    firstMessage: PropTypes.object,
    lastMessage: PropTypes.object,
  }).isRequired,
};

export default Timeline;
