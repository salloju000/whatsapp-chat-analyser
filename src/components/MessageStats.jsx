import { Clock, Image, Link2, MessageSquare, Trash2, Type, Zap } from 'lucide-react';
import PropTypes from 'prop-types';
import StatCard from './common/StatCard';
import { formatHour } from '../utils/format';
import { MEDIA_LABELS, MEDIA_TYPES } from '../utils/parser/content';

// e.g. "12 images · 3 voice notes · 40 of unknown type" — known types by count,
// unknown always last so it reads as a caveat rather than a category.
const describeMedia = (mediaByType = {}) =>
  MEDIA_TYPES.filter((type) => type !== 'unknown' && mediaByType[type] > 0)
    .sort((a, b) => mediaByType[b] - mediaByType[a])
    .concat(mediaByType.unknown > 0 ? ['unknown'] : [])
    .map((type) => {
      const count = mediaByType[type];
      const label = MEDIA_LABELS[type];
      return `${count.toLocaleString()} ${count === 1 ? label.one : label.many}`;
    })
    .join(' · ');

const MessageStats = ({ analytics }) => {
  const {
    totalMessages,
    totalWords,
    daysChatting,
    mostActiveHour,
    avgMessageLength,
    mediaCount,
    mediaByType,
    deletedCount,
    linkCount,
  } = analytics;

  const unknownMedia = mediaByType?.unknown ?? 0;

  const stats = [
    {
      icon: MessageSquare,
      label: 'Total Messages',
      value: totalMessages,
      iconClass: 'text-blue-400',
      tint: 'from-blue-500/20 to-cyan-500/20',
    },
    {
      icon: Clock,
      label: 'Average per Day',
      value: Math.round(totalMessages / Math.max(daysChatting, 1)),
      iconClass: 'text-emerald-400',
      tint: 'from-green-500/20 to-emerald-500/20',
    },
    {
      icon: Zap,
      label: 'Most Active Hour',
      value: formatHour(mostActiveHour),
      animate: false,
      iconClass: 'text-amber-400',
      tint: 'from-orange-500/20 to-amber-500/20',
    },
    {
      icon: Type,
      label: 'Words Written',
      value: totalWords,
      footer: `~${avgMessageLength} characters per message`,
      iconClass: 'text-violet-400',
      tint: 'from-violet-500/20 to-purple-500/20',
    },
    {
      icon: Image,
      label: 'Media Shared',
      value: mediaCount,
      footer: mediaCount > 0 ? describeMedia(mediaByType) : undefined,
      iconClass: 'text-pink-400',
      tint: 'from-pink-500/20 to-rose-500/20',
    },
    {
      icon: Link2,
      label: 'Links Shared',
      value: linkCount,
      iconClass: 'text-teal-400',
      tint: 'from-teal-500/20 to-cyan-500/20',
    },
  ];

  if (deletedCount > 0) {
    stats.push({
      icon: Trash2,
      label: 'Deleted Messages',
      value: deletedCount,
      iconClass: 'text-zinc-400',
      tint: 'from-zinc-500/20 to-slate-500/20',
    });
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
      {unknownMedia > 0 && (
        <p className="mt-4 text-sm text-content-muted">
          {unknownMedia === mediaCount ? 'The type of shared media' : `The type of ${unknownMedia.toLocaleString()} media items`} isn’t recorded in
          the export, so it is shown as unknown rather than guessed. Android chats exported “without media”, for
          example, only say “&lt;Media omitted&gt;”; exporting with media, or from an iPhone, records the type.
        </p>
      )}
    </>
  );
};

MessageStats.propTypes = {
  analytics: PropTypes.shape({
    totalMessages: PropTypes.number.isRequired,
    totalWords: PropTypes.number.isRequired,
    daysChatting: PropTypes.number.isRequired,
    mostActiveHour: PropTypes.number,
    avgMessageLength: PropTypes.number,
    mediaCount: PropTypes.number,
    mediaByType: PropTypes.object,
    deletedCount: PropTypes.number,
    linkCount: PropTypes.number,
  }).isRequired,
};

export default MessageStats;
