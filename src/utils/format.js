const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

export const formatDate = (date) =>
  date instanceof Date && !Number.isNaN(date.getTime()) ? dateFormatter.format(date) : '—';

export const formatTime = (date) =>
  date instanceof Date && !Number.isNaN(date.getTime()) ? timeFormatter.format(date) : '—';

export const formatDayKey = (key) => {
  if (!key) return '—';
  const [y, m, d] = key.split('-').map(Number);
  return formatDate(new Date(y, m - 1, d));
};

export const formatHour = (hour) => {
  if (!Number.isInteger(hour)) return '—';
  return timeFormatter.format(new Date(2000, 0, 1, hour, 0));
};

export const formatPercent = (part, total, digits = 1) =>
  total > 0 ? `${((part / total) * 100).toFixed(digits)}%` : '0%';

export const percentOf = (part, total) => (total > 0 ? (part / total) * 100 : 0);

export const formatNumber = (value) =>
  Number.isFinite(value) ? value.toLocaleString() : '—';

export const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
