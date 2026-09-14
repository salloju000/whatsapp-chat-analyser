import { describe, expect, it } from 'vitest';
import { canonicalEmoji, extractEmojis, isEmojiCluster, splitEmojis } from '../utils/emoji';

// Every case runs through both the Intl.Segmenter path and the regex fallback
// used by browsers without Intl.Segmenter.
const PATHS = [
  ['segmenter', { useSegmenter: true }],
  ['fallback', { useSegmenter: false }],
];

describe.each(PATHS)('emoji extraction (%s)', (_, options) => {
  const count = (text) => extractEmojis(text, options).length;
  const list = (text) => extractEmojis(text, options);

  describe('basic and repeated emoji', () => {
    it('counts a single emoji', () => {
      expect(list('😂')).toEqual(['😂']);
    });

    it('counts repeated emoji individually', () => {
      expect(list('😂😂😂')).toEqual(['😂', '😂', '😂']);
    });

    it('counts repeated emoji separated by spaces and text', () => {
      expect(count('lol 😂 ok 😂 fine 😂')).toBe(3);
    });

    it('counts emoji added in recent Unicode versions', () => {
      expect(list('🫶 🫠 🫨')).toEqual(['🫶', '🫠', '🫨']);
    });
  });

  describe('multi-code-point sequences count once', () => {
    it('family (ZWJ, 7 code points)', () => {
      expect(list('👨‍👩‍👧‍👦')).toEqual(['👨‍👩‍👧‍👦']);
    });

    it('family of three', () => {
      expect(list('👩‍👩‍👦')).toEqual(['👩‍👩‍👦']);
    });

    it('profession with skin tone (base + modifier + ZWJ + object)', () => {
      expect(list('👩🏽‍💻')).toEqual(['👩🏽‍💻']);
    });

    it('profession without skin tone', () => {
      expect(list('🧑‍🚀')).toEqual(['🧑‍🚀']);
    });

    it('gendered activity with variation selector', () => {
      expect(list('🏃‍♀️')).toEqual(['🏃‍♀️']);
    });

    it('gendered gesture with skin tone', () => {
      expect(list('🤷🏻‍♂️')).toEqual(['🤷🏻‍♂️']);
    });

    it('heart on fire (text-default heart + FE0F + ZWJ + fire)', () => {
      expect(list('❤️‍🔥')).toEqual(['❤️‍🔥']);
    });

    it('couple with heart and skin tones', () => {
      expect(list('👩🏻‍❤️‍👨🏾')).toEqual(['👩🏻‍❤️‍👨🏾']);
    });
  });

  describe('skin tones', () => {
    it('keeps each modifier attached to its base', () => {
      expect(list('👍🏻👍🏼👍🏽👍🏾👍🏿')).toEqual(['👍🏻', '👍🏼', '👍🏽', '👍🏾', '👍🏿']);
    });

    it('treats different tones as different emoji', () => {
      const emojis = list('👍 👍🏽');
      expect(emojis).toEqual(['👍', '👍🏽']);
      expect(new Set(emojis).size).toBe(2);
    });

    it('counts a text-default base with a modifier', () => {
      expect(list('✌🏽')).toEqual(['✌🏽']);
    });

    it('counts a lone swatch typed straight after a letter on its own', () => {
      const { emojis, rest } = splitEmojis('hi🏽there', options);
      expect(emojis).toEqual(['🏽']);
      expect(rest.replace(/\s+/g, ' ')).toBe('hi there');
    });

    it('splits consecutive swatches and a duplicated tone', () => {
      expect(list('🏽🏽')).toEqual(['🏽', '🏽']);
      expect(list('👍🏽🏽')).toEqual(['👍🏽', '🏽']);
    });

    it('does not glue a tone onto a symbol that cannot take one', () => {
      expect(list('™🏽')).toEqual(['🏽']);
    });
  });

  describe('flags', () => {
    it('counts a country flag once', () => {
      expect(list('🇮🇳')).toEqual(['🇮🇳']);
    });

    it('splits adjacent flags correctly', () => {
      expect(list('🇮🇳🇺🇸🇯🇵')).toEqual(['🇮🇳', '🇺🇸', '🇯🇵']);
    });

    it('counts a subdivision tag-sequence flag once', () => {
      expect(list('🏴󠁧󠁢󠁳󠁣󠁴󠁿')).toEqual(['🏴󠁧󠁢󠁳󠁣󠁴󠁿']);
    });

    it('does not count a lone regional indicator letter', () => {
      expect(count('🇮')).toBe(0);
    });
  });

  describe('variation selectors and keycaps', () => {
    it('counts a text-default symbol with the emoji selector', () => {
      expect(list('❤️ ☺️ ✔️')).toEqual(['❤️', '☺️', '✔️']);
    });

    it('does not count a symbol forced to text with U+FE0E', () => {
      expect(count('❤︎')).toBe(0);
    });

    it('counts keycap sequences once', () => {
      expect(list('1️⃣ #️⃣ *️⃣')).toEqual(['1️⃣', '#️⃣', '*️⃣']);
    });

    it('does not count plain digits, # or *', () => {
      expect(count('Call me at #1 *now* 555')).toBe(0);
    });

    // Keyboards differ on U+FE0F; the same emoji must land under one key.
    it('counts every U+FE0F spelling of an emoji under its fully-qualified form', () => {
      expect(list('😂 😂️')).toEqual(['😂', '😂']);
      expect(list('1⃣ 1️⃣')).toEqual(['1️⃣', '1️⃣']);
      expect(list('❤‍🔥 ❤️‍🔥')).toEqual(['❤️‍🔥', '❤️‍🔥']);
      expect(list('🏳‍🌈 🏳️‍🌈')).toEqual(['🏳️‍🌈', '🏳️‍🌈']);
      expect(list('👁️‍🗨 👁️‍🗨️')).toEqual(['👁️‍🗨️', '👁️‍🗨️']);
    });
  });

  describe('symbols that are not displayed as emoji', () => {
    it('ignores trademark, copyright and registered signs', () => {
      expect(count('Brand™ © 2024 Acme®')).toBe(0);
    });

    it('ignores text-style check marks, arrows and play symbols', () => {
      expect(count('done ✔ next → ↔ ▶ ★ ✓ •')).toBe(0);
    });

    it('ignores a bare heart written without the emoji selector', () => {
      expect(count('I ❤ you')).toBe(0);
    });
  });

  describe('mixed and non-Latin text', () => {
    it('finds emoji inside words and punctuation', () => {
      expect(list('hi😂there👍🏽!')).toEqual(['😂', '👍🏽']);
    });

    it('returns nothing for plain text', () => {
      expect(count('just text, nothing else')).toBe(0);
    });

    it('returns nothing for Arabic, Hindi and CJK text', () => {
      expect(count('مرحبا नमस्ते 你好')).toBe(0);
    });

    it('handles emoji next to right-to-left text', () => {
      expect(list('مرحبا 😂')).toEqual(['😂']);
    });

    it('handles empty and missing input', () => {
      expect(count('')).toBe(0);
      expect(count(undefined)).toBe(0);
    });
  });
});

describe('splitEmojis', () => {
  it('removes emoji from the remaining text so they are never tokenized as words', () => {
    const { emojis, rest } = splitEmojis('ok❤️❤️ 1️⃣done');
    expect(emojis).toEqual(['❤️', '❤️', '1️⃣']);
    expect(rest).not.toMatch(/[️⃣]/);
    expect(rest.replace(/\s+/g, ' ').trim()).toBe('ok done');
  });

  it('leaves text without emoji untouched', () => {
    expect(splitEmojis('plain words')).toEqual({ emojis: [], rest: 'plain words' });
  });
});

describe('canonicalEmoji', () => {
  it.each([
    ['😂️', '😂'],
    ['❤', '❤️'],
    ['1⃣', '1️⃣'],
    ['🕵‍♀', '🕵️‍♀️'],
    ['✌️🏽', '✌🏽'],
    ['🤦🏽‍♂', '🤦🏽‍♂️'],
    ['👨‍👩‍👧‍👦', '👨‍👩‍👧‍👦'],
    ['🇮🇳', '🇮🇳'],
  ])('%s → %s', (input, expected) => {
    expect(canonicalEmoji(input)).toBe(expected);
  });

  // Every RGI emoji the runtime knows, with U+FE0F removed, must round-trip.
  it('restores the fully-qualified spelling of every single and toned RGI emoji', () => {
    const rgi = /^\p{RGI_Emoji}$/v;
    const tones = ['🏻', '🏼', '🏽', '🏾', '🏿'];
    let checked = 0;
    for (let cp = 0x20; cp <= 0x1faff; cp++) {
      if (cp >= 0xd800 && cp <= 0xdfff) continue;
      const c = String.fromCodePoint(cp);
      for (const candidate of [c, `${c}️`, ...tones.map((t) => c + t)]) {
        if (!rgi.test(candidate)) continue;
        expect(canonicalEmoji(candidate.replaceAll('️', ''))).toBe(candidate);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(1500);
  });
});

describe('isEmojiCluster', () => {
  it.each([
    ['😂', true],
    ['🇮🇳', true],
    ['1️⃣', true],
    ['❤️', true],
    ['©', false],
    ['™', false],
    ['a', false],
    ['1', false],
    ['❤︎', false],
    ['🏽', true],
    ['i🏽', false],
    ['🏽🏽', false],
    ['™🏽', false],
    ['', false],
  ])('%s → %s', (cluster, expected) => {
    expect(isEmojiCluster(cluster)).toBe(expected);
  });
});
