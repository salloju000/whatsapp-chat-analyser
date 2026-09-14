import { describe, expect, it } from 'vitest';
import { analyzeChat } from '../utils/analytics';
import { extractEmojis } from '../utils/emoji';
import { parseWhatsAppChat } from '../utils/parser';

const analyze = (text) => analyzeChat(parseWhatsAppChat(text).messages);

describe('analyzeChat basics', () => {
  it('returns null for no messages', () => {
    expect(analyzeChat([])).toBeNull();
    expect(analyzeChat(null)).toBeNull();
  });

  it('counts messages per user in a group', () => {
    const text = [
      '12/03/2024, 10:00 - Alice: a',
      '12/03/2024, 10:01 - Bob: b',
      '12/03/2024, 10:02 - Alice: c',
      '12/03/2024, 10:03 - Carol: d',
      '12/03/2024, 10:04 - Dave: e',
      '12/03/2024, 10:05 - Eve: f',
    ].join('\n');
    const a = analyze(text);

    expect(a.participantCount).toBe(5);
    expect(a.messagesByUser).toEqual({ Alice: 2, Bob: 1, Carol: 1, Dave: 1, Eve: 1 });
    expect(a.users[0]).toBe('Alice'); // sorted by volume
  });

  it('excludes system-message pseudo-users from participants', () => {
    const text = [
      '12/03/2024, 10:00 - Alice: hi',
      '12/03/2024, 10:01 - Alice added Bob',
      '12/03/2024, 10:02 - Bob: hey',
    ].join('\n');
    expect(analyze(text).users.sort()).toEqual(['Alice', 'Bob']);
  });
});

describe('hour bucketing', () => {
  // C2 regression: AM/PM was ignored, so evening messages landed in the morning.
  it('respects PM when bucketing by hour', () => {
    const a = analyze('12/03/2024, 9:30 PM - Alice: evening');
    expect(a.activityByHour[21]).toBe(1);
    expect(a.activityByHour[9]).toBe(0);
    expect(a.mostActiveHour).toBe(21);
  });

  it('separates 2 AM from 2 PM', () => {
    const text = ['12/03/2024, 2:00 AM - A: x', '12/03/2024, 2:00 PM - A: y'].join('\n');
    const a = analyze(text);
    expect(a.activityByHour[2]).toBe(1);
    expect(a.activityByHour[14]).toBe(1);
  });

  it('exposes mostActiveHour', () => {
    const text = [
      '12/03/2024, 20:00 - A: x',
      '12/03/2024, 20:30 - A: y',
      '12/03/2024, 08:00 - A: z',
    ].join('\n');
    expect(analyze(text).mostActiveHour).toBe(20);
  });
});

describe('daysChatting', () => {
  // C4 regression: a same-day chat gave 0, which rendered as Infinity upstream.
  it('is 1 for a single-day chat, never 0', () => {
    const text = ['12/03/2024, 10:00 - A: x', '12/03/2024, 23:00 - A: y'].join('\n');
    const a = analyze(text);
    expect(a.daysChatting).toBe(1);
    expect(Number.isFinite(a.totalMessages / a.daysChatting)).toBe(true);
  });

  it('counts inclusive day boundaries', () => {
    const text = ['01/03/2024, 10:00 - A: x', '03/03/2024, 10:00 - A: y'].join('\n');
    expect(analyze(text).daysChatting).toBe(3);
  });

  it('tracks active days separately from the span', () => {
    const text = ['01/03/2024, 10:00 - A: x', '10/03/2024, 10:00 - A: y'].join('\n');
    const a = analyze(text);
    expect(a.daysChatting).toBe(10);
    expect(a.activeDays).toBe(2);
  });
});

describe('word counting', () => {
  it('does not count empty messages as a word', () => {
    const messages = [{ sender: 'A', message: '', timestamp: new Date(), urls: [] }];
    expect(analyzeChat(messages).totalWords).toBe(0);
  });

  it('excludes media placeholders from words and characters', () => {
    const text = [
      '12/03/2024, 10:00 - A: hello world',
      '12/03/2024, 10:01 - A: <Media omitted>',
    ].join('\n');
    const a = analyze(text);
    expect(a.totalWords).toBe(2);
    expect(a.mediaCount).toBe(1);
    expect(a.topWords.map(([w]) => w)).not.toContain('media');
  });

  it('excludes deleted messages', () => {
    const text = [
      '12/03/2024, 10:00 - A: hello world',
      '12/03/2024, 10:01 - A: This message was deleted',
    ].join('\n');
    const a = analyze(text);
    expect(a.deletedCount).toBe(1);
    expect(a.topWords.map(([w]) => w)).not.toContain('deleted');
  });

  it('does not tokenize urls into the word cloud', () => {
    const text = '12/03/2024, 10:00 - A: check https://youtube.com/watch?v=abcdef out';
    const a = analyze(text);
    expect(a.linkCount).toBe(1);
    expect(a.topWords.map(([w]) => w)).not.toContain('httpsyoutubecomwatchvabcdef');
  });

  it('keeps non-Latin scripts', () => {
    const text = [
      '12/03/2024, 10:00 - A: नमस्ते दोस्तों',
      '12/03/2024, 10:01 - A: नमस्ते फिर',
    ].join('\n');
    const words = analyze(text).topWords.map(([w]) => w);
    expect(words).toContain('नमस्ते');
  });

  it('keeps accented Latin intact', () => {
    const a = analyze('12/03/2024, 10:00 - A: café café año');
    const words = a.topWords.map(([w]) => w);
    expect(words).toContain('café');
    expect(words).not.toContain('caf');
  });
});

describe('emoji counting', () => {
  it('counts a ZWJ family as one emoji', () => {
    expect(extractEmojis('👨‍👩‍👧‍👦')).toEqual(['👨‍👩‍👧‍👦']);
  });

  it('counts a skin-toned emoji as one', () => {
    expect(extractEmojis('👍🏽')).toEqual(['👍🏽']);
  });

  it('counts a flag as one emoji', () => {
    expect(extractEmojis('🇮🇳')).toEqual(['🇮🇳']);
  });

  it('preserves the variation selector on ❤️', () => {
    expect(extractEmojis('❤️')).toEqual(['❤️']);
  });

  it('matches emoji added after Unicode 12', () => {
    expect(extractEmojis('🫶')).toEqual(['🫶']);
  });

  it('ignores plain text', () => {
    expect(extractEmojis('hello world')).toEqual([]);
  });

  it('aggregates top emojis across messages', () => {
    const text = [
      '12/03/2024, 10:00 - A: 😂😂',
      '12/03/2024, 10:01 - B: 😂❤️',
    ].join('\n');
    const a = analyze(text);
    expect(a.topEmojis[0]).toEqual(['😂', 3]);
  });

  it('ranks one emoji once however each keyboard spelled it', () => {
    const text = [
      '12/03/2024, 10:00 - A: 😂 🔥 🔥',
      '12/03/2024, 10:01 - B: 😂️ 😂️ ❤‍🔥',
      '12/03/2024, 10:02 - A: ❤️‍🔥',
    ].join('\n');
    const a = analyze(text);
    expect(a.topEmojis).toEqual([['😂', 3], ['❤️‍🔥', 2], ['🔥', 2]]);
    expect(a.uniqueEmojis).toBe(3);
  });

  it('counts only what people wrote, not names, system events, deletions or media markers', () => {
    const text = [
      '12/03/2024, 09:15 - Mom ❤️ created group "Family 👨‍👩‍👧‍👦"',
      '12/03/2024, 09:16 - Mom ❤️: Good morning 😊',
      '12/03/2024, 09:17 - Sam 🔥: <Media omitted>',
      '12/03/2024, 09:18 - Sam 🔥: This message was deleted',
      '12/03/2024, 09:19 - Sam 🔥: IMG-20240312-WA0001.jpg (file attached)',
      'look 👀',
      '12/03/2024, 09:20 - Mom ❤️: ok 👍🏽 <This message was edited>',
    ].join('\n');
    const a = analyze(text);
    expect(a.totalEmojis).toBe(3);
    expect(a.topEmojis.map(([emoji]) => emoji).sort()).toEqual(['👀', '👍🏽', '😊'].sort());
  });
});

describe('derived stats', () => {
  it('picks the most active day', () => {
    const text = [
      '01/03/2024, 10:00 - A: x',
      '02/03/2024, 10:00 - A: y',
      '02/03/2024, 11:00 - A: z',
    ].join('\n');
    expect(analyze(text).mostActiveDay).toEqual(['2024-03-02', 2]);
  });

  it('reports first and last message chronologically regardless of file order', () => {
    const text = [
      '05/03/2024, 10:00 - A: later',
      '01/03/2024, 10:00 - A: earlier',
    ].join('\n');
    const a = analyze(text);
    expect(a.firstMessage.message).toBe('earlier');
    expect(a.lastMessage.message).toBe('later');
  });

  it('measures average length in code points, not UTF-16 units', () => {
    const a = analyze('12/03/2024, 10:00 - A: 😂😂');
    expect(a.avgMessageLength).toBe(2);
  });

  it('buckets by day of week', () => {
    // 12 March 2024 was a Tuesday.
    const a = analyze('12/03/2024, 10:00 - A: x');
    expect(a.activityByDay.find((d) => d.day === 'Tuesday').messages).toBe(1);
  });
});

describe('emoji totals and shares', () => {
  const text = [
    '01/03/2024, 10:00 - A: 😂😂😂',
    '01/03/2024, 10:01 - B: 👨‍👩‍👧‍👦 and 🇮🇳',
    '15/04/2024, 10:02 - A: 👍🏽 👍',
    '15/04/2024, 10:03 - B: no emoji here © ™',
  ].join('\n');
  const a = analyze(text);

  it('totals every emoji, not just the top ten', () => {
    expect(a.totalEmojis).toBe(7);
    expect(a.uniqueEmojis).toBe(5);
  });

  it('reports top emoji over all occurrences', () => {
    expect(a.topEmojis[0]).toEqual(['😂', 3]);
    expect(a.topEmojis.reduce((sum, [, n]) => sum + n, 0)).toBe(a.totalEmojis);
  });

  it('gives per-person emoji totals whose shares sum to 100%', () => {
    expect(a.emojisByUser.A).toMatchObject({ total: 5, unique: 3 });
    expect(a.emojisByUser.B).toMatchObject({ total: 2, unique: 2 });
    const shareSum = Object.values(a.emojisByUser).reduce((sum, u) => sum + u.share, 0);
    expect(shareSum).toBeCloseTo(1, 10);
  });

  it('tracks emoji use per month alongside message volume', () => {
    expect(a.emojiTrend).toEqual([
      { month: '2024-03', emojis: 5, messages: 2 },
      { month: '2024-04', emojis: 2, messages: 2 },
    ]);
  });

  it('has zero shares, not NaN, when a chat has no emoji', () => {
    const plain = analyze('01/03/2024, 10:00 - A: hello there');
    expect(plain.totalEmojis).toBe(0);
    expect(plain.emojisByUser.A.share).toBe(0);
    expect(plain.topEmojis).toEqual([]);
  });
});

describe('emoji never leak into word statistics', () => {
  it('counts zero words for emoji-only messages, including keycaps and FE0F emoji', () => {
    const a = analyze('01/03/2024, 10:00 - A: ❤️❤️❤️ 1️⃣ 👍🏽');
    expect(a.totalWords).toBe(0);
    expect(a.topWords).toEqual([]);
    expect(a.totalEmojis).toBe(5);
  });

  it('counts words around emoji normally', () => {
    const a = analyze("01/03/2024, 10:00 - A: can't wait😂see you👋🏼tomorrow");
    expect(a.totalWords).toBe(5);
    expect(a.topWords.map(([w]) => w)).toEqual(expect.arrayContaining(["can't", 'wait', 'see', 'tomorrow']));
  });

  it('does not count a lone apostrophe as a word', () => {
    expect(analyze("01/03/2024, 10:00 - A: ' ok '").totalWords).toBe(1);
  });
});

describe('media and share calculations', () => {
  const text = [
    '01/03/2024, 10:00 - A: IMG-20240301-WA0001.jpg (file attached)',
    'nice view',
    '01/03/2024, 10:01 - A: <Media omitted>',
    '01/03/2024, 10:02 - B: PTT-20240301-WA0002.opus (file attached)',
    '01/03/2024, 10:03 - B: hello',
  ].join('\n');
  const a = analyze(text);

  it('counts media items by type and by person', () => {
    expect(a.mediaCount).toBe(3);
    expect(a.mediaByType).toMatchObject({ image: 1, unknown: 1, voice: 1 });
    expect(a.mediaByUser.A.total).toBe(2);
    expect(a.mediaByUser.B.byType.voice).toBe(1);
  });

  it('per-type counts add up to the media total', () => {
    expect(Object.values(a.mediaByType).reduce((s, n) => s + n, 0)).toBe(a.mediaCount);
  });

  it('counts caption words but averages length over text-only messages', () => {
    expect(a.totalWords).toBe(3); // "nice view" + "hello"
    expect(a.avgMessageLength).toBe(5); // only "hello"
  });

  it('message shares still sum to 100%', () => {
    const total = Object.values(a.messagesByUser).reduce((s, n) => s + n, 0);
    expect(total).toBe(a.totalMessages);
  });
});
