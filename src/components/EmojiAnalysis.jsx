import { Smile } from 'lucide-react';
import PropTypes from 'prop-types';
import EmptyState from './common/EmptyState';
import ProgressBar from './common/ProgressBar';
import SectionHeader from './common/SectionHeader';
import { formatPercent, percentOf } from '../utils/format';

const RANK_GRADIENTS = [
  'from-yellow-400 to-orange-500',
  'from-zinc-300 to-zinc-400',
  'from-orange-400 to-orange-600',
];
const MEDALS = ['🥇', '🥈', '🥉'];

const gradientFor = (index) => RANK_GRADIENTS[index] ?? 'from-purple-400 to-pink-500';

const EmojiAnalysis = ({ analytics }) => {
  // Shares are of every emoji in the chat, not just the ones shown here.
  const { topEmojis, totalEmojis = 0, uniqueEmojis = 0 } = analytics;

  return (
    <div className="glass-card p-8 animate-slide-up">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <SectionHeader
          icon={Smile}
          title="Favorite Emojis"
          subtitle="Most used · skin tones, flags and combined emoji count once"
          tint="from-yellow-400/20 to-orange-500/20"
          iconClass="text-amber-500"
        />
        {totalEmojis > 0 && (
          <div className="text-right">
            <div className="text-3xl font-bold gradient-text">
              {totalEmojis.toLocaleString()}
            </div>
            <p className="text-xs text-content-muted">
              emoji sent · {uniqueEmojis.toLocaleString()} different
            </p>
          </div>
        )}
      </div>

      {topEmojis.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {topEmojis.map(([emoji, count], index) => (
            <div key={emoji} className="relative">
              {index < 3 && (
                <div className="absolute -top-2 -right-1 z-10 text-2xl" aria-hidden="true">
                  {MEDALS[index]}
                </div>
              )}

              <div className={`bg-gradient-to-br ${gradientFor(index)} p-[2px] rounded-2xl h-full`}>
                <div className="bg-surface-card rounded-2xl p-5 text-center h-full flex flex-col">
                  <div className="text-4xl sm:text-5xl mb-3" aria-hidden="true">
                    {emoji}
                  </div>
                  <div className="text-2xl font-bold text-content-primary mb-1">{count}</div>
                  <div className="text-xs font-medium text-content-muted mb-3">
                    {formatPercent(count, totalEmojis)}
                  </div>
                  <div className="mt-auto">
                    <ProgressBar
                      value={percentOf(count, totalEmojis)}
                      gradient={gradientFor(index)}
                      height="h-1"
                      label={`${emoji} used ${count} times`}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState emoji="😶" message="No emojis found in this chat" />
      )}
    </div>
  );
};

EmojiAnalysis.propTypes = {
  analytics: PropTypes.shape({
    topEmojis: PropTypes.array.isRequired,
    totalEmojis: PropTypes.number,
    uniqueEmojis: PropTypes.number,
  }).isRequired,
};

export default EmojiAnalysis;
