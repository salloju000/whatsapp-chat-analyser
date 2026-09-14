import { FORMATS } from './formats';
import { sanitizeLine } from './sanitize';

const SNIFF_LINES = 500;

// Which format matches the most lines in the sample. Ties go to the earlier
// entry in FORMATS, which is fine — iOS and Android headers are disjoint.
export const detectFormat = (lines) => {
  const sample = lines.slice(0, SNIFF_LINES).map(sanitizeLine);
  let best = null;
  let bestHits = 0;

  for (const format of FORMATS) {
    let hits = 0;
    for (const line of sample) {
      if (format.header.test(line)) hits++;
    }
    if (hits > bestHits) {
      best = format;
      bestHits = hits;
    }
  }

  return bestHits > 0 ? best : null;
};

// A single date like 03/05/2024 is ambiguous. Scanning the whole file usually
// isn't: one first-part > 12 proves MM/DD is impossible, and vice versa.
// When the file genuinely never disambiguates, fall back to DD/MM, which is
// what WhatsApp uses everywhere except the US.
export const inferDateOrder = (lines, format) => {
  let firstOverTwelve = false;
  let secondOverTwelve = false;

  for (const raw of lines) {
    const m = format.header.exec(sanitizeLine(raw));
    if (!m) continue;
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a > 12) firstOverTwelve = true;
    if (b > 12) secondOverTwelve = true;
    if (firstOverTwelve && secondOverTwelve) break;
  }

  // Both over 12 means the file is internally inconsistent; trust neither and
  // use the global default rather than silently picking one.
  if (firstOverTwelve && secondOverTwelve) return { order: 'DMY', confident: false };
  if (firstOverTwelve) return { order: 'DMY', confident: true };
  if (secondOverTwelve) return { order: 'MDY', confident: true };
  return { order: 'DMY', confident: false };
};
