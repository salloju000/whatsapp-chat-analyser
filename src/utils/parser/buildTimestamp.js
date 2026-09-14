// Dates are built from numeric components, never from a string. `new Date(str)`
// is implementation-defined for anything that isn't strict ISO-8601, and
// "2024-3-12 2:05 pm" is not — it happens to work in V8 and fails elsewhere.

const expandYear = (year) => {
  if (year >= 1000) return year;
  // WhatsApp 2-digit years are always recent; 70+ would be a 19xx date, which
  // predates the app entirely, so the cutoff is only defensive.
  return year >= 70 ? 1900 + year : 2000 + year;
};

const to24Hour = (hour, meridiem) => {
  if (!meridiem) return hour;
  const isPm = meridiem.toLowerCase() === 'p';
  if (isPm) return hour === 12 ? 12 : hour + 12;
  return hour === 12 ? 0 : hour;
};

export const buildTimestamp = (match, dateOrder) => {
  const first = Number(match[1]);
  const second = Number(match[2]);
  const year = expandYear(Number(match[3]));

  const day = dateOrder === 'MDY' ? second : first;
  const month = dateOrder === 'MDY' ? first : second;

  const hour = to24Hour(Number(match[4]), match[7]);
  const minute = Number(match[5]);
  const secs = match[6] ? Number(match[6]) : 0;

  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) {
    return null;
  }

  const date = new Date(year, month - 1, day, hour, minute, secs);

  // Rejects real-world impossibilities like 31/02 that the Date constructor
  // would silently roll forward into March.
  if (date.getMonth() !== month - 1 || date.getDate() !== day) return null;

  return date;
};
