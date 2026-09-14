import { describe, expect, it } from 'vitest';
import { analyzeChat } from '../utils/analytics';
import { parseWhatsAppChat } from '../utils/parser';
import { classifyRemainder } from '../utils/parser/classifyLine';
import {
  ANDROID_GROUP_NO_MEDIA,
  ANDROID_INDIVIDUAL_WITH_MEDIA,
  IOS_GROUP_NO_MEDIA,
  IOS_INDIVIDUAL_WITH_MEDIA,
} from './fixtures/exports';

const run = (text) => {
  const parsed = parseWhatsAppChat(text);
  return { parsed, analytics: analyzeChat(parsed.messages) };
};

const nonZero = (counts) => Object.fromEntries(Object.entries(counts).filter(([, n]) => n > 0));

describe('user messages that read like system events are kept', () => {
  // Regression: these were previously discarded as system messages.
  it.each([
    'Alice: I added sugar to it',
    'Sam: we joined',
    'Bob: I left early',
    'Meera: I left my charger at yours btw',
    'Omar: I removed the old photos',
  ])('"%s"', (remainder) => {
    expect(classifyRemainder(remainder).type).toBe('message');
  });

  it('treats a line with no "Name:" prefix as a system event (Android)', () => {
    expect(classifyRemainder('Priya added Rahul')).toMatchObject({ type: 'system', kind: 'event' });
  });

  it('needs iOS\'s U+200E mark before calling a body with a sender an event', () => {
    const marked = classifyRemainder('Book Club: Nadia added Omar', () => true);
    const unmarked = classifyRemainder('Book Club: Nadia added Omar', () => false);
    expect(marked.type).toBe('system');
    expect(unmarked.type).toBe('message');
  });

  it('recognizes the encryption notice even with a sender and no mark', () => {
    expect(classifyRemainder('Bob: Messages and calls are end-to-end encrypted. No one outside').type).toBe('system');
  });

  it('records a missed call as a call event with its caller, not as text', () => {
    expect(classifyRemainder('Omar: Missed voice call')).toMatchObject({ type: 'system', kind: 'call', sender: 'Omar' });
  });
});

describe('Android group export without media', () => {
  const { parsed, analytics } = run(ANDROID_GROUP_NO_MEDIA);

  it('detects format and date order', () => {
    expect(parsed.format).toBe('android');
    expect(parsed.dateOrder).toBe('DMY');
  });

  it('separates system events from messages', () => {
    expect(parsed.systemMessages.map((s) => s.text)).toEqual([
      expect.stringMatching(/^Messages and calls are end-to-end encrypted/),
      'Priya created group "Weekend Trip"',
      'Priya added Rahul',
      'Priya added Meera',
      'Meera left',
      'Priya changed the subject from "Weekend Trip" to "Goa 🌴"',
    ]);
    expect(analytics.users.sort()).toEqual(['Meera', 'Priya', 'Rahul']);
  });

  it('keeps a real message that contains "left"', () => {
    expect(parsed.messages.some((m) => m.text === 'I left my charger at yours btw')).toBe(true);
  });

  it('counts both "<Media omitted>" as unknown type — never guessed', () => {
    expect(analytics.mediaCount).toBe(2);
    expect(nonZero(analytics.mediaByType)).toEqual({ unknown: 2 });
    expect(analytics.mediaByConfidence).toEqual({ confirmed: 0, inferred: 0, unknown: 2 });
  });

  it('counts deleted, edited, location and links separately', () => {
    expect(analytics.deletedCount).toBe(1);
    expect(analytics.editedCount).toBe(1);
    expect(analytics.locationCount).toBe(1);
    expect(analytics.linkCount).toBe(1);
  });

  it('counts emoji as whole sequences', () => {
    // 🏖️ 🙌🏽 · 😂 😂 😂 · 👨‍👩‍👧‍👦 🇮🇳 1️⃣  (the 🌴 is inside a system event)
    expect(analytics.totalEmojis).toBe(8);
    expect(analytics.uniqueEmojis).toBe(6);
    expect(analytics.topEmojis[0]).toEqual(['😂', 3]);
  });

  it('attributes emoji to the person who sent them', () => {
    expect(analytics.emojisByUser.Rahul.total).toBe(6);
    expect(analytics.emojisByUser.Priya.total).toBe(2);
    expect(analytics.emojisByUser.Meera.total).toBe(0);
  });

  it('excludes placeholders, deletions and the edited marker from words', () => {
    const words = analytics.topWords.map(([w]) => w);
    for (const leaked of ['media', 'omitted', 'deleted', 'edited', 'maps', 'google']) {
      expect(words).not.toContain(leaked);
    }
  });
});

describe('Android one-on-one export with media', () => {
  const { parsed, analytics } = run(ANDROID_INDIVIDUAL_WITH_MEDIA);

  it('detects MM/DD from the dates and parses 12-hour times with U+202F', () => {
    expect(parsed.dateOrder).toBe('MDY');
    const christmas = parsed.messages.find((m) => m.text === 'Merry Christmas ❤️🎅🏾');
    expect(christmas.timestamp.getMonth()).toBe(11);
    expect(christmas.timestamp.getDate()).toBe(25);
    expect(christmas.timestamp.getHours()).toBe(0);
  });

  it('distinguishes every media type the filenames reveal', () => {
    expect(nonZero(analytics.mediaByType)).toEqual({
      image: 1,
      video: 1,
      voice: 1,
      sticker: 1,
      audio: 1,
      document: 1,
      contact: 1,
    });
  });

  it('separates confirmed (WhatsApp prefix) from inferred (extension only)', () => {
    expect(analytics.mediaByConfidence).toEqual({ confirmed: 5, inferred: 2, unknown: 0 });
  });

  it('counts media per person', () => {
    expect(analytics.mediaByUser.Sam).toEqual({
      total: 3,
      byType: expect.objectContaining({ image: 1, sticker: 1, audio: 1, video: 0 }),
    });
    expect(analytics.mediaByUser.Alex.total).toBe(4);
  });

  it('keeps the photo caption as text, including its emoji', () => {
    const photo = parsed.messages.find((m) => m.isMedia && m.text);
    expect(photo.text).toBe('Christmas tree is up 🎄');
    expect(analytics.topEmojis.map(([e]) => e)).toContain('🎄');
  });

  it('counts emoji with skin tones and new emoji correctly', () => {
    // 🎄 · ❤️ 🎅🏾 · 🥹 🤶🏻
    expect(analytics.totalEmojis).toBe(5);
    expect(analytics.uniqueEmojis).toBe(5);
  });
});

describe('iOS group export without media', () => {
  const { parsed, analytics } = run(IOS_GROUP_NO_MEDIA);

  it('drops the group name that iOS uses as the sender of system events', () => {
    expect(analytics.users.sort()).toEqual(['Nadia', 'Omar']);
    expect(parsed.systemMessages.filter((s) => s.kind === 'event')).toHaveLength(4);
  });

  it('keeps "I added some notes" as a real message', () => {
    expect(parsed.messages.some((m) => m.text === 'I added some notes to the doc')).toBe(true);
  });

  it('records the missed call as a call event, not a message', () => {
    expect(parsed.systemMessages.filter((s) => s.kind === 'call')).toEqual([
      expect.objectContaining({ sender: 'Omar', text: 'Missed voice call' }),
    ]);
    expect(parsed.messages.some((m) => /missed voice call/i.test(m.message))).toBe(false);
  });

  it('distinguishes the media types iOS placeholders name', () => {
    expect(nonZero(analytics.mediaByType)).toEqual({
      image: 1,
      gif: 1,
      sticker: 1,
      audio: 1,
      video: 1,
      document: 1,
      contact: 1,
    });
    expect(analytics.mediaByConfidence.confirmed).toBe(7);
  });

  it('counts the deletion and the emoji', () => {
    expect(analytics.deletedCount).toBe(1);
    // 🤔 · 👋🏼 ☀️
    expect(analytics.totalEmojis).toBe(3);
  });
});

describe('iOS one-on-one export with media', () => {
  const { parsed, analytics } = run(IOS_INDIVIDUAL_WITH_MEDIA);

  it('parses M/D/YY dates with seconds and AM/PM', () => {
    expect(parsed.format).toBe('ios');
    expect(parsed.dateOrder).toBe('MDY');
    expect(parsed.messages.at(-1).timestamp.getHours()).toBe(20);
  });

  it('distinguishes GIF from video using the iOS filename token', () => {
    expect(nonZero(analytics.mediaByType)).toEqual({ image: 1, gif: 1, sticker: 1, audio: 1, video: 1, document: 1 });
    expect(analytics.mediaByConfidence).toEqual({ confirmed: 5, inferred: 1, unknown: 0 });
  });

  it('counts ZWJ sequences once and repeated emoji individually', () => {
    // 🧑🏽‍🚀 🚀 🚀 · 🏃‍♀️ 💨 ❤️‍🔥
    expect(analytics.totalEmojis).toBe(6);
    expect(analytics.topEmojis[0]).toEqual(['🚀', 2]);
    expect(analytics.emojisByUser.Lena.top).toEqual(expect.arrayContaining([['🧑🏽‍🚀', 1]]));
  });
});
