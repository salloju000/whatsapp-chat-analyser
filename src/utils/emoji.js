// Emoji are counted as whole grapheme clusters, never as code points: a family
// is 7 code points joined by ZWJ, a flag is 2 regional indicators, a keycap is
// digit + U+FE0F + U+20E3, and a skin-toned emoji is a base plus a modifier.
// Intl.Segmenter keeps each of those together; the rules below then decide
// whether a cluster is actually displayed as an emoji.
//
// A cluster is an emoji when it:
//   - is exactly one pair of regional indicators (a country flag), or
//   - is a keycap sequence (1️⃣ #️⃣ *️⃣), or
//   - contains a pictographic character AND any of: a character that defaults
//     to emoji presentation (😂 👍 🔥), the emoji variation selector U+FE0F
//     (❤️ ☺️), or a skin-tone modifier directly after a base that takes one (✌🏽), or
//   - is a lone skin-tone swatch (🏽).
//
// Deliberately NOT counted: symbols that default to text presentation when
// written without U+FE0F (© ® ™ ✔ ↔ ▶ and a bare ❤), anything carrying the
// text variation selector U+FE0E, lone regional indicator letters, and plain
// digits, # or *. Counting every \p{Extended_Pictographic} character — the
// previous behaviour — turned trademark signs and arrows into "emoji".

const PICTOGRAPHIC = /\p{Extended_Pictographic}/u;
const PRESENTATION = /\p{Emoji_Presentation}/u;
const MODIFIER = /\p{Emoji_Modifier}/u;
const LONE_MODIFIER = /^\p{Emoji_Modifier}$/u;
const BASE = /^\p{Emoji_Modifier_Base}$/u;
const TONED = /\p{Emoji_Modifier_Base}\uFE0F?\p{Emoji_Modifier}/u;
// A tone that doesn't directly follow a base that takes one ("hi🏽", "🏽🏽").
const STRAY_MODIFIER = /(?<!\p{Emoji_Modifier_Base}\uFE0F?)\p{Emoji_Modifier}/u;
const KEYCAP_BASE = /^[#*0-9]$/;
const REGIONAL_INDICATOR = /^\p{Regional_Indicator}$/u;
const KEYCAP = /^[#*0-9]️?⃣$/u;
const TEXT_SELECTOR = '︎';
const EMOJI_SELECTOR = '️';

// Cheap pre-check: text with none of these code points cannot contain an emoji,
// which lets ordinary text skip grapheme segmentation entirely.
const MAY_CONTAIN_EMOJI = /[©®‼-㊙⃣️\u{1F000}-\u{1FFFF}]/u;

export const isEmojiCluster = (cluster) => {
  if (!cluster || cluster.includes(TEXT_SELECTOR)) return false;

  const codePoints = [...cluster];
  if (codePoints.every((cp) => REGIONAL_INDICATOR.test(cp))) return codePoints.length === 2;
  if (KEYCAP.test(cluster)) return true;
  if (LONE_MODIFIER.test(cluster)) return true;
  if (!PICTOGRAPHIC.test(cluster) || STRAY_MODIFIER.test(cluster)) return false;

  return PRESENTATION.test(cluster) || cluster.includes(EMOJI_SELECTOR) || TONED.test(cluster);
};

// Keyboards disagree on U+FE0F: one sends 😂 and another 😂+FE0F, one sends
// ❤️‍🔥 and another drops the selector inside the sequence. Both look identical,
// so each emoji is rewritten to its fully-qualified spelling — otherwise the
// same emoji is counted under two keys and loses its rank. FE0F belongs after
// a text-default pictograph unless a skin tone follows, and inside a keycap.
export const canonicalEmoji = (cluster) => {
  const codePoints = [...cluster].filter((cp) => cp !== EMOJI_SELECTOR);
  let result = '';
  codePoints.forEach((cp, i) => {
    result += cp;
    const next = codePoints[i + 1];
    const needsSelector =
      (PICTOGRAPHIC.test(cp) && !PRESENTATION.test(cp) && !(next && MODIFIER.test(next))) ||
      (KEYCAP_BASE.test(cp) && next === '⃣');
    if (needsSelector) result += EMOJI_SELECTOR;
  });
  return result;
};

// Adds a candidate's emoji to `emojis` and returns the text it leaves behind.
// A skin-tone swatch sent straight after a letter (or another swatch) is glued
// to that character's cluster, so stray tones are split off and counted alone.
const takeCluster = (cluster, emojis) => {
  if (!cluster) return '';
  if (isEmojiCluster(cluster)) {
    emojis.push(canonicalEmoji(cluster));
    return ' ';
  }
  if (!STRAY_MODIFIER.test(cluster)) return cluster;

  let rest = '';
  let pending = '';
  let previous = '';
  for (const cp of cluster) {
    if (MODIFIER.test(cp) && !BASE.test(previous)) {
      rest += takeCluster(pending, emojis);
      emojis.push(cp);
      rest += ' ';
      pending = '';
    } else {
      pending += cp;
    }
    if (cp !== EMOJI_SELECTOR) previous = cp;
  }
  return rest + takeCluster(pending, emojis);
};

const segmenter =
  typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null;

// Approximates grapheme clusters for emoji only, for browsers without
// Intl.Segmenter. Candidates still go through isEmojiCluster.
const FALLBACK_CANDIDATE =
  /\p{Regional_Indicator}{2}|[#*0-9]️?⃣|\p{Extended_Pictographic}[︎️]?\p{Emoji_Modifier}?[\u{E0020}-\u{E007F}]*(?:‍\p{Extended_Pictographic}[︎️]?\p{Emoji_Modifier}?)*|\p{Emoji_Modifier}/gu;

const EMPTY = Object.freeze([]);

// Splits text into its emoji and the remaining text (emoji replaced by a space
// so they can't glue neighbouring words together, and can't be tokenized as
// words themselves — U+FE0F and U+20E3 are Unicode "marks").
export const splitEmojis = (text, { useSegmenter = true } = {}) => {
  if (!text || !MAY_CONTAIN_EMOJI.test(text)) return { emojis: EMPTY, rest: text ?? '' };

  const emojis = [];

  if (segmenter && useSegmenter) {
    let rest = '';
    for (const { segment } of segmenter.segment(text)) rest += takeCluster(segment, emojis);
    return { emojis, rest };
  }

  const rest = text.replace(FALLBACK_CANDIDATE, (candidate) => takeCluster(candidate, emojis));
  return { emojis, rest };
};

export const extractEmojis = (text, options) => splitEmojis(text, options).emojis.slice();
