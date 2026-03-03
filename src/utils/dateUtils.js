/**
 * Pure date utilities.
 * All comparisons are calendar-day-based (ignore time).
 * No side effects. No global state.
 */

/** Parse "YYYY-MM-DD" → Date at midnight local time. Returns null for falsy input. */
export function fromYMD(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Format Date → "YYYY-MM-DD" */
export function toYMD(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Today as "YYYY-MM-DD" */
export function todayYMD() {
  return toYMD(new Date());
}

/** Number of days in a given year/month (0-indexed month). */
export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Day-of-week of the 1st of month, Monday-based (0 = Monday … 6 = Sunday).
 * JS Date.getDay() uses 0 = Sunday, so we convert.
 */
export function getFirstDayOfWeek(year, month) {
  const day = new Date(year, month, 1).getDay(); // 0=Sun
  return (day + 6) % 7; // Convert to Mon=0
}

/** True if two Date objects represent the same calendar date. */
export function isSameDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** True if calendar date a is strictly before calendar date b. */
export function isBefore(a, b) {
  if (!a || !b) return false;
  const [ay, am, ad] = [a.getFullYear(), a.getMonth(), a.getDate()];
  const [by, bm, bd] = [b.getFullYear(), b.getMonth(), b.getDate()];
  if (ay !== by) return ay < by;
  if (am !== bm) return am < bm;
  return ad < bd;
}

/** True if calendar date a is strictly after calendar date b. */
export function isAfter(a, b) {
  return isBefore(b, a);
}

/** True if the given Date is today. */
export function isToday(date) {
  return isSameDay(date, new Date());
}

/** Format "YYYY-MM-DD" → "Mar 15, 2026". Returns '' for falsy input. */
export function formatDisplayDate(ymd) {
  if (!ymd) return '';
  return fromYMD(ymd).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Format year + 0-indexed month → "March 2026". */
export function formatMonthYear(year, month) {
  return new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}
