// Every format regex captures the same 8 groups so one code path handles all of them:
//   1=first date part, 2=second date part, 3=year,
//   4=hour, 5=minute, 6=second (optional), 7=a|p (optional), 8=remainder after the header
//
// Whether group 1 is the day or the month is NOT decided here — it is inferred
// from the whole file by detectFormat, because a single line is often ambiguous.

const DATE = String.raw`(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})`;
const TIME = String.raw`(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([ap])\.?\s?m\.?)?`;

export const FORMATS = [
  {
    id: 'ios',
    label: 'iOS',
    // [12/03/2024, 2:05:03 PM] Sender: message
    header: new RegExp(String.raw`^\[${DATE},?\s+${TIME}\s*\]\s?(.*)$`, 'i'),
  },
  {
    id: 'android',
    label: 'Android',
    // 12/03/2024, 14:32 - Sender: message
    header: new RegExp(String.raw`^${DATE},?\s+${TIME}\s+[-–—]\s+(.*)$`, 'i'),
  },
];
