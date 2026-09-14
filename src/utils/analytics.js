import { splitEmojis } from './emoji';
import { MEDIA_TYPES } from './parser/content';
import { ENGLISH_STOPWORDS } from './stopwords';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MS_PER_DAY = 86_400_000;
const TOP_EMOJI_COUNT = 10;
const TOP_WORD_COUNT = 20;
const TOP_USER_EMOJI_COUNT = 5;
const MIN_WORD_LENGTH = 2;

// A word starts with a letter or digit, may carry combining marks (Indic vowel
// signs and viramas are Marks — without them "नमस्ते" splits apart), and may
// contain inner apostrophes ("don't"). Emoji are removed before this runs, so
// U+FE0F / U+20E3 can no longer be mistaken for word characters.
const WORD_PATTERN = /[\p{L}\p{N}][\p{L}\p{N}\p{M}]*(?:['’][\p{L}\p{N}][\p{L}\p{N}\p{M}]*)*/gu;
const URL_PATTERN = /\bhttps?:\/\/[^\s<>"]+|\bwww\.[^\s<>"]+/gi;

const dayKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const increment = (map, key, by = 1) => map.set(key, (map.get(key) ?? 0) + by);

const topN = (map, n) =>
  [...map.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))).slice(0, n);

const emptyMediaCounts = () => Object.fromEntries(MEDIA_TYPES.map((type) => [type, 0]));

const isValidDate = (date) => date instanceof Date && !Number.isNaN(date.getTime());

// Older message objects (and hand-built test data) have no `text`/`media`;
// derive the same shape so every consumer reads one model.
const normalize = (message) => ({
  ...message,
  text: message.text ?? (message.isMedia || message.isDeleted ? '' : message.message ?? ''),
  media: message.media ?? (message.isMedia ? [{ type: 'unknown', evidence: 'legacy', confidence: 'unknown' }] : []),
  urls: message.urls ?? [],
});

// One accumulator fed message-by-message, so the worker never needs the whole
// message array in memory at once.
export const createAccumulator = () => {
  const perUser = new Map();
  const perDay = new Map();
  const emojiCounts = new Map();
  const wordCounts = new Map();
  const emojiByMonth = new Map();
  const messagesByMonth = new Map();
  const mediaByType = emptyMediaCounts();
  const mediaByConfidence = { confirmed: 0, inferred: 0, unknown: 0 };
  const activityByHour = new Array(24).fill(0);
  const activityByDayIndex = new Array(7).fill(0);

  let totalMessages = 0;
  let totalWords = 0;
  let totalEmojis = 0;
  let textMessageChars = 0;
  let textMessageCount = 0;
  let mediaCount = 0;
  let mediaMessageCount = 0;
  let deletedCount = 0;
  let editedCount = 0;
  let locationCount = 0;
  let linkCount = 0;
  let firstMessage = null;
  let lastMessage = null;

  const statsFor = (sender) => {
    let stats = perUser.get(sender);
    if (!stats) {
      stats = {
        messages: 0,
        words: 0,
        chars: 0,
        emojis: 0,
        emojiCounts: new Map(),
        media: 0,
        mediaByType: emptyMediaCounts(),
        deleted: 0,
        links: 0,
      };
      perUser.set(sender, stats);
    }
    return stats;
  };

  const add = (rawMessage) => {
    const message = normalize(rawMessage);
    const { sender, timestamp, media, isDeleted, isLocation, isEdited, urls, text } = message;
    const stats = statsFor(sender);
    const validTime = isValidDate(timestamp);

    totalMessages++;
    stats.messages++;

    if (isDeleted) {
      deletedCount++;
      stats.deleted++;
    }
    if (isEdited) editedCount++;
    if (isLocation) locationCount++;

    linkCount += urls.length;
    stats.links += urls.length;

    if (media.length > 0) {
      mediaMessageCount++;
      for (const { type, confidence } of media) {
        mediaCount++;
        stats.media++;
        mediaByType[type]++;
        stats.mediaByType[type]++;
        mediaByConfidence[confidence]++;
      }
    }

    // Words, characters and emoji come only from what the person wrote —
    // captions included, WhatsApp's own placeholders and deleted notices not.
    if (text) {
      const { emojis, rest } = splitEmojis(text);

      if (emojis.length > 0) {
        totalEmojis += emojis.length;
        stats.emojis += emojis.length;
        for (const emoji of emojis) {
          increment(emojiCounts, emoji);
          increment(stats.emojiCounts, emoji);
        }
        if (validTime) increment(emojiByMonth, monthKey(timestamp), emojis.length);
      }

      const words = rest.replace(URL_PATTERN, ' ').toLowerCase().match(WORD_PATTERN);
      if (words) {
        totalWords += words.length;
        stats.words += words.length;
        for (const word of words) {
          if ([...word].length > MIN_WORD_LENGTH && !ENGLISH_STOPWORDS.has(word)) increment(wordCounts, word);
        }
      }

      const length = [...text].length;
      stats.chars += length;
      if (media.length === 0 && !isLocation) {
        textMessageChars += length;
        textMessageCount++;
      }
    }

    if (validTime) {
      activityByHour[timestamp.getHours()]++;
      activityByDayIndex[timestamp.getDay()]++;
      increment(perDay, dayKey(timestamp));
      increment(messagesByMonth, monthKey(timestamp));

      if (!firstMessage || timestamp < firstMessage.timestamp) firstMessage = rawMessage;
      if (!lastMessage || timestamp > lastMessage.timestamp) lastMessage = rawMessage;
    }
  };

  const finish = () => {
    if (totalMessages === 0) return null;

    const users = [...perUser.keys()].sort((a, b) => perUser.get(b).messages - perUser.get(a).messages);

    const messagesByUser = {};
    const userStats = {};
    const emojisByUser = {};
    const mediaByUser = {};
    for (const [user, stats] of perUser) {
      const { emojiCounts: userEmojiCounts, ...rest } = stats;
      messagesByUser[user] = stats.messages;
      userStats[user] = { ...rest, uniqueEmojis: userEmojiCounts.size };
      emojisByUser[user] = {
        total: stats.emojis,
        unique: userEmojiCounts.size,
        top: topN(userEmojiCounts, TOP_USER_EMOJI_COUNT),
        share: totalEmojis > 0 ? stats.emojis / totalEmojis : 0,
      };
      mediaByUser[user] = { total: stats.media, byType: stats.mediaByType };
    }

    const peakHour = activityByHour.reduce((best, count, hour) => (count > activityByHour[best] ? hour : best), 0);

    let daysChatting = 1;
    if (firstMessage && lastMessage) {
      const start = new Date(firstMessage.timestamp).setHours(0, 0, 0, 0);
      const end = new Date(lastMessage.timestamp).setHours(0, 0, 0, 0);
      daysChatting = Math.floor((end - start) / MS_PER_DAY) + 1;
    }

    const months = [...messagesByMonth.keys()].sort();

    return {
      totalMessages,
      totalWords,
      messagesByUser,
      userStats,
      users,
      participantCount: users.length,
      mostActiveDay: topN(perDay, 1)[0] ?? null,
      activityByHour,
      activityByDay: DAY_NAMES.map((day, i) => ({ day, messages: activityByDayIndex[i] })),
      mostActiveHour: peakHour,
      topWords: topN(wordCounts, TOP_WORD_COUNT),
      avgMessageLength: textMessageCount > 0 ? Math.round(textMessageChars / textMessageCount) : 0,
      firstMessage,
      lastMessage,
      daysChatting: Math.max(daysChatting, 1),
      activeDays: perDay.size,

      totalEmojis,
      uniqueEmojis: emojiCounts.size,
      topEmojis: topN(emojiCounts, TOP_EMOJI_COUNT),
      emojisByUser,
      emojiTrend: months.map((month) => ({
        month,
        emojis: emojiByMonth.get(month) ?? 0,
        messages: messagesByMonth.get(month),
      })),

      mediaCount,
      mediaMessageCount,
      mediaByType,
      mediaByConfidence,
      mediaByUser,
      deletedCount,
      editedCount,
      locationCount,
      linkCount,
    };
  };

  return { add, finish };
};

export const analyzeChat = (messages) => {
  if (!messages || messages.length === 0) return null;
  const acc = createAccumulator();
  for (const message of messages) acc.add(message);
  return acc.finish();
};
