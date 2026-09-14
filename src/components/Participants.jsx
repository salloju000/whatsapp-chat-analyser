import { Users } from 'lucide-react';
import PropTypes from 'prop-types';
import AnimatedCounter from './AnimatedCounter';
import ProgressBar from './common/ProgressBar';
import SectionHeader from './common/SectionHeader';
import { formatPercent, percentOf } from '../utils/format';

const ACCENTS = [
  { chip: 'from-indigo-500 to-indigo-600', bar: 'from-indigo-500 to-indigo-600' },
  { chip: 'from-pink-500 to-pink-600', bar: 'from-pink-500 to-pink-600' },
  { chip: 'from-emerald-500 to-emerald-600', bar: 'from-emerald-500 to-emerald-600' },
  { chip: 'from-amber-500 to-amber-600', bar: 'from-amber-500 to-amber-600' },
  { chip: 'from-violet-500 to-violet-600', bar: 'from-violet-500 to-violet-600' },
];

const accentFor = (index) => ACCENTS[index % ACCENTS.length];

// Two participants get the full side-by-side treatment. Larger groups get a
// ranked list instead — the previous slice(0, 2) silently dropped everyone
// else while still counting their messages in the percentages.
const PairView = ({ users, analytics }) => (
  <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
    {users.map((user, index) => {
      const count = analytics.messagesByUser[user];
      const accent = accentFor(index);

      return (
        <div
          key={user}
          className="bg-surface-card rounded-2xl p-8 border border-edge hover:border-indigo-500/50 transition-colors"
        >
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="min-w-0">
              <h3 className="text-2xl font-bold text-content-primary break-words">{user}</h3>
              <p className="text-sm text-content-muted">Participant</p>
            </div>
            <div
              className={`w-14 h-14 shrink-0 rounded-xl flex items-center justify-center bg-gradient-to-br ${accent.chip}`}
            >
              <Users className="w-7 h-7 text-white" aria-hidden="true" />
            </div>
          </div>

          <div className="mb-6">
            <div className="text-5xl font-bold text-content-primary mb-2">
              <AnimatedCounter end={count} />
            </div>
            <p className="text-content-muted">messages sent</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-content-muted">Contribution</span>
              <span className="font-semibold text-content-primary">
                {formatPercent(count, analytics.totalMessages)}
              </span>
            </div>
            <ProgressBar
              value={percentOf(count, analytics.totalMessages)}
              gradient={accent.bar}
              label={`${user} contribution`}
            />
          </div>
        </div>
      );
    })}
  </section>
);

const GroupView = ({ users, analytics }) => (
  <section className="bg-surface-card rounded-2xl p-8 mb-8 border border-edge">
    <SectionHeader
      icon={Users}
      title="Participants"
      subtitle={`${users.length} people in this chat, ranked by messages sent`}
      tint="from-emerald-500/20 to-teal-500/20"
      iconClass="text-emerald-400"
    />

    <ol className="space-y-4">
      {users.map((user, index) => {
        const count = analytics.messagesByUser[user];
        const accent = accentFor(index);

        return (
          <li key={user}>
            <div className="flex items-baseline justify-between gap-4 mb-2">
              <div className="flex items-baseline gap-3 min-w-0">
                <span className="text-sm font-mono text-content-muted shrink-0">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="font-semibold text-content-primary truncate">{user}</span>
              </div>
              <div className="flex items-baseline gap-3 shrink-0">
                <span className="text-content-secondary">{count.toLocaleString()}</span>
                <span className="text-sm text-content-muted w-14 text-right">
                  {formatPercent(count, analytics.totalMessages)}
                </span>
              </div>
            </div>
            <ProgressBar
              value={percentOf(count, analytics.totalMessages)}
              gradient={accent.bar}
              label={`${user} contribution`}
              height="h-1.5"
            />
          </li>
        );
      })}
    </ol>
  </section>
);

const Participants = ({ analytics }) => {
  const { users } = analytics;
  if (users.length === 0) return null;
  return users.length <= 2 ? (
    <PairView users={users} analytics={analytics} />
  ) : (
    <GroupView users={users} analytics={analytics} />
  );
};

const shape = {
  users: PropTypes.arrayOf(PropTypes.string).isRequired,
  messagesByUser: PropTypes.object.isRequired,
  totalMessages: PropTypes.number.isRequired,
};

PairView.propTypes = { users: PropTypes.array.isRequired, analytics: PropTypes.shape(shape).isRequired };
GroupView.propTypes = { users: PropTypes.array.isRequired, analytics: PropTypes.shape(shape).isRequired };
Participants.propTypes = { analytics: PropTypes.shape(shape).isRequired };

export default Participants;
