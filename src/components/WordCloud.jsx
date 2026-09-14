import { Type } from 'lucide-react';
import PropTypes from 'prop-types';
import EmptyState from './common/EmptyState';
import SectionHeader from './common/SectionHeader';

const TEXT_COLORS = [
  'text-purple-500',
  'text-pink-500',
  'text-rose-500',
  'text-orange-500',
  'text-amber-500',
  'text-violet-400',
  'text-fuchsia-400',
  'text-red-400',
];

const WordCloud = ({ analytics }) => {
  const { topWords } = analytics;
  const maxCount = topWords[0]?.[1] || 1;

  // Clamped against the viewport so a long top word can't overflow its
  // container on a narrow screen.
  const fontSizeFor = (count) => {
    const rem = (count / maxCount) * 2 + 1;
    return `clamp(1rem, ${rem.toFixed(2)}rem, 9vw)`;
  };

  return (
    <div className="glass-card p-8 animate-slide-up">
      <SectionHeader
        icon={Type}
        title="Our Language"
        subtitle="Most frequently used words"
        tint="from-indigo-500/20 to-purple-500/20"
        iconClass="text-indigo-400"
      />

      {topWords.length > 0 ? (
        <ul className="flex flex-wrap gap-x-6 gap-y-4 justify-center items-baseline p-4">
          {topWords.map(([word, count], index) => (
            <li key={word} style={{ fontSize: fontSizeFor(count) }}>
              {/* The count lives in the accessible name as well as the
                  visual size, so it isn't hover-only. */}
              <span
                className={`font-bold ${TEXT_COLORS[index % TEXT_COLORS.length]} leading-none`}
                title={`${word} — used ${count} times`}
              >
                {word}
                <span className="sr-only"> — used {count} times</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState emoji="📝" message="No words to display" />
      )}
    </div>
  );
};

WordCloud.propTypes = {
  analytics: PropTypes.shape({
    topWords: PropTypes.array.isRequired,
  }).isRequired,
};

export default WordCloud;
