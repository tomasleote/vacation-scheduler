import {
  fromYMD, toYMD, todayYMD,
  getDaysInMonth, getFirstDayOfWeek,
  isSameDay, isBefore, isAfter, isToday,
  formatDisplayDate, formatMonthYear,
} from './dateUtils';

describe('fromYMD / toYMD', () => {
  test('fromYMD parses YYYY-MM-DD to local Date', () => {
    const d = fromYMD('2026-03-15');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2);   // 0-indexed
    expect(d.getDate()).toBe(15);
  });

  test('fromYMD returns null for empty string', () => {
    expect(fromYMD('')).toBeNull();
    expect(fromYMD(null)).toBeNull();
  });

  test('toYMD formats a Date to YYYY-MM-DD', () => {
    expect(toYMD(new Date(2026, 2, 15))).toBe('2026-03-15');
  });

  test('toYMD zero-pads month and day', () => {
    expect(toYMD(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  test('todayYMD returns a valid YYYY-MM-DD string', () => {
    expect(todayYMD()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('getDaysInMonth', () => {
  test('returns 31 for January', () => {
    expect(getDaysInMonth(2026, 0)).toBe(31);
  });

  test('returns 28 for Feb in a non-leap year', () => {
    expect(getDaysInMonth(2026, 1)).toBe(28);
  });

  test('returns 29 for Feb in a leap year', () => {
    expect(getDaysInMonth(2024, 1)).toBe(29);
  });

  test('returns 30 for April', () => {
    expect(getDaysInMonth(2026, 3)).toBe(30);
  });
});

describe('getFirstDayOfWeek (Monday=0)', () => {
  // March 1, 2026 is a Sunday → index 6
  test('returns 6 for March 2026 (starts on Sunday)', () => {
    expect(getFirstDayOfWeek(2026, 2)).toBe(6);
  });

  // January 1, 2026 is a Thursday → index 3
  test('returns 3 for January 2026 (starts on Thursday)', () => {
    expect(getFirstDayOfWeek(2026, 0)).toBe(3);
  });

  // February 1, 2027 is a Monday → index 0
  test('returns 0 for February 2027 (starts on Monday)', () => {
    expect(getFirstDayOfWeek(2027, 1)).toBe(0);
  });
});

describe('isSameDay', () => {
  test('returns true for identical dates', () => {
    expect(isSameDay(new Date(2026, 2, 15), new Date(2026, 2, 15))).toBe(true);
  });

  test('returns true even with different times', () => {
    const a = new Date(2026, 2, 15, 8, 0, 0);
    const b = new Date(2026, 2, 15, 23, 59, 59);
    expect(isSameDay(a, b)).toBe(true);
  });

  test('returns false for different days', () => {
    expect(isSameDay(new Date(2026, 2, 15), new Date(2026, 2, 16))).toBe(false);
  });

  test('returns false when either is null', () => {
    expect(isSameDay(null, new Date())).toBe(false);
    expect(isSameDay(new Date(), null)).toBe(false);
  });
});

describe('isBefore', () => {
  test('returns true when a is before b', () => {
    expect(isBefore(new Date(2026, 2, 14), new Date(2026, 2, 15))).toBe(true);
  });

  test('returns false when a equals b (same calendar day)', () => {
    expect(isBefore(new Date(2026, 2, 15), new Date(2026, 2, 15))).toBe(false);
  });

  test('returns false when a is after b', () => {
    expect(isBefore(new Date(2026, 2, 16), new Date(2026, 2, 15))).toBe(false);
  });

  test('returns false when either is null', () => {
    expect(isBefore(null, new Date())).toBe(false);
    expect(isBefore(new Date(), null)).toBe(false);
  });
});

describe('isAfter', () => {
  test('returns true when a is after b', () => {
    expect(isAfter(new Date(2026, 2, 16), new Date(2026, 2, 15))).toBe(true);
  });

  test('returns false for same day', () => {
    expect(isAfter(new Date(2026, 2, 15), new Date(2026, 2, 15))).toBe(false);
  });
});

describe('formatDisplayDate', () => {
  test('formats YYYY-MM-DD to readable string', () => {
    const result = formatDisplayDate('2026-03-15');
    expect(result).toContain('2026');
    expect(result).toContain('15');
    expect(result).toMatch(/Mar/);
  });

  test('returns empty string for empty input', () => {
    expect(formatDisplayDate('')).toBe('');
    expect(formatDisplayDate(null)).toBe('');
  });
});

describe('formatMonthYear', () => {
  test('formats year and 0-indexed month to readable string', () => {
    expect(formatMonthYear(2026, 2)).toBe('March 2026');
  });

  test('formats December correctly', () => {
    expect(formatMonthYear(2026, 11)).toBe('December 2026');
  });
});
