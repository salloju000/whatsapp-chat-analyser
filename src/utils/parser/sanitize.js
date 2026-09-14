// Direction and formatting marks that iOS (and RTL locales) embed in exports.
// They break ^-anchored matching, so they are removed — but iOS also puts a
// U+200E immediately before text WhatsApp itself generated ("‎image omitted",
// "‎Alice added Bob"), so where they sat is recorded as evidence.
const MARK = /[‎‏‪-‮⁦-⁩﻿]/;
const MARKS = /[‎‏‪-‮⁦-⁩﻿]/g;

// WhatsApp uses U+202F (narrow no-break space) before AM/PM in newer exports,
// and U+00A0 in some locales. Normalize them so one regex handles every variant.
const EXOTIC_SPACES = /[   ]/g;

const NO_MARKS = new Set();

export const normalizeLine = (line) => line.replace(EXOTIC_SPACES, ' ').replace(/\r$/, '');

// Returns the line without marks, plus the indexes (in the stripped text) of
// characters that were directly preceded by a mark.
export const stripMarks = (line) => {
  if (!MARK.test(line)) return { text: line, markedAt: NO_MARKS };

  let text = '';
  const markedAt = new Set();
  let pending = false;
  for (const ch of line) {
    if (MARK.test(ch)) {
      pending = true;
      continue;
    }
    if (pending) {
      markedAt.add(text.length);
      pending = false;
    }
    text += ch;
  }
  return { text, markedAt };
};

export const sanitizeLine = (line) => normalizeLine(line).replace(MARKS, '');

export const splitLines = (text) => text.split('\n');
