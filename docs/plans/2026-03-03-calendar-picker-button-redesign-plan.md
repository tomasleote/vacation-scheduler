# CalendarPicker + Admin Button Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace native `<input type="date">` fields with a custom `CalendarPicker` component, and fix Admin page buttons to use the shared `Button` component.

**Architecture:** Single `CalendarPicker` in `shared/ui/` backed by pure date utilities in `utils/dateUtils.js`. Parent components wire constraints via `minDate` / `maxDate` props. Admin button fixes are mechanical swaps requiring no new components.

**Tech Stack:** React 18, Tailwind CSS 3, lucide-react (icons already installed), framer-motion available but Tailwind `animate-fade-in` keyframe sufficient.

---

## Task 1: Date Utilities

**Files:**
- Create: `src/utils/dateUtils.js`
- Create: `src/utils/dateUtils.test.js`

---

**Step 1: Write the failing tests**

Create `src/utils/dateUtils.test.js`:

```js
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
```

**Step 2: Run tests — expect ALL to fail** (module not found)

```
npm test -- --testPathPattern=dateUtils --watchAll=false
```

Expected: FAIL — `Cannot find module './dateUtils'`

---

**Step 3: Implement `src/utils/dateUtils.js`**

```js
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
```

**Step 4: Run tests — expect ALL to pass**

```
npm test -- --testPathPattern=dateUtils --watchAll=false
```

Expected: PASS (all tests green)

---

## Task 2: CalendarPicker Component

**Files:**
- Create: `src/shared/ui/CalendarPicker.jsx`
- Create: `src/shared/ui/CalendarPicker.test.jsx`
- Modify: `src/shared/ui/index.js`

---

**Step 1: Write the failing tests**

Create `src/shared/ui/CalendarPicker.test.jsx`:

```jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CalendarPicker from './CalendarPicker';

// Suppress console errors from missing context if any
beforeAll(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
afterAll(() => console.error.mockRestore());

const renderPicker = (props = {}) =>
  render(
    <CalendarPicker
      label="Test Date"
      id="test-date"
      value=""
      onChange={jest.fn()}
      placeholder="Pick a date"
      {...props}
    />
  );

describe('CalendarPicker — rendering', () => {
  test('renders the label', () => {
    renderPicker();
    expect(screen.getByText('Test Date')).toBeInTheDocument();
  });

  test('shows placeholder when no value', () => {
    renderPicker();
    expect(screen.getByText('Pick a date')).toBeInTheDocument();
  });

  test('shows formatted date when value is set', () => {
    renderPicker({ value: '2026-06-15' });
    // Should show something like "Jun 15, 2026"
    expect(screen.getByText(/Jun.*15.*2026/)).toBeInTheDocument();
  });

  test('calendar grid is hidden initially', () => {
    renderPicker();
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });
});

describe('CalendarPicker — open/close', () => {
  test('opens calendar on trigger click', () => {
    renderPicker();
    fireEvent.click(screen.getByRole('button', { name: /pick a date/i }));
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  test('closes calendar when Escape is pressed', () => {
    renderPicker();
    fireEvent.click(screen.getByRole('button', { name: /pick a date/i }));
    expect(screen.getByRole('grid')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });

  test('calendar shows correct month header', () => {
    // Render with a minDate to control which month opens to
    renderPicker({ minDate: '2026-06-01', value: '2026-06-15' });
    fireEvent.click(screen.getByRole('button', { name: /jun.*15.*2026/i }));
    expect(screen.getByText('June 2026')).toBeInTheDocument();
  });
});

describe('CalendarPicker — day selection', () => {
  test('calls onChange with YYYY-MM-DD when a day is clicked', () => {
    const onChange = jest.fn();
    // Open to June 2026
    renderPicker({ onChange, value: '2026-06-01', minDate: '2026-06-01' });
    fireEvent.click(screen.getByRole('button', { name: /jun.*1.*2026/i }));

    // Click day 15
    const day15 = screen.getByRole('gridcell', { name: /june 15, 2026/i });
    fireEvent.click(day15);

    expect(onChange).toHaveBeenCalledWith('2026-06-15');
  });

  test('closes calendar after selecting a day', () => {
    const onChange = jest.fn();
    renderPicker({ onChange, value: '2026-06-01', minDate: '2026-06-01' });
    fireEvent.click(screen.getByRole('button', { name: /jun.*1.*2026/i }));

    const day15 = screen.getByRole('gridcell', { name: /june 15, 2026/i });
    fireEvent.click(day15);

    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });

  test('selected day has aria-label including "selected"', () => {
    renderPicker({ value: '2026-06-15', minDate: '2026-06-01' });
    fireEvent.click(screen.getByRole('button', { name: /jun.*15.*2026/i }));

    const selectedDay = screen.getByRole('gridcell', { name: /selected/i });
    expect(selectedDay).toBeInTheDocument();
  });
});

describe('CalendarPicker — disabled days', () => {
  test('days before minDate are disabled', () => {
    renderPicker({ value: '2026-06-10', minDate: '2026-06-05' });
    fireEvent.click(screen.getByRole('button', { name: /jun.*10.*2026/i }));

    const day3 = screen.getByRole('gridcell', { name: /june 3, 2026/i });
    expect(day3).toBeDisabled();
    expect(day3).toHaveAttribute('aria-disabled', 'true');
  });

  test('disabled days are not clickable', () => {
    const onChange = jest.fn();
    renderPicker({ onChange, value: '2026-06-10', minDate: '2026-06-05' });
    fireEvent.click(screen.getByRole('button', { name: /jun.*10.*2026/i }));

    const day3 = screen.getByRole('gridcell', { name: /june 3, 2026/i });
    fireEvent.click(day3);

    expect(onChange).not.toHaveBeenCalled();
  });

  test('days on or after minDate are not disabled', () => {
    renderPicker({ value: '2026-06-10', minDate: '2026-06-05' });
    fireEvent.click(screen.getByRole('button', { name: /jun.*10.*2026/i }));

    const day5 = screen.getByRole('gridcell', { name: /june 5, 2026/i });
    expect(day5).not.toBeDisabled();
  });
});

describe('CalendarPicker — month navigation', () => {
  test('next month button advances the view', () => {
    renderPicker({ value: '2026-06-01', minDate: '2026-01-01' });
    fireEvent.click(screen.getByRole('button', { name: /jun.*1.*2026/i }));
    expect(screen.getByText('June 2026')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /next month/i }));
    expect(screen.getByText('July 2026')).toBeInTheDocument();
  });

  test('prev month button goes back', () => {
    renderPicker({ value: '2026-07-01', minDate: '2026-01-01' });
    fireEvent.click(screen.getByRole('button', { name: /jul.*1.*2026/i }));

    fireEvent.click(screen.getByRole('button', { name: /previous month/i }));
    expect(screen.getByText('June 2026')).toBeInTheDocument();
  });

  test('prev month button is disabled when all prev month days are before minDate', () => {
    // minDate is June 1 — prev month (May) is entirely before minDate
    renderPicker({ value: '2026-06-15', minDate: '2026-06-01' });
    fireEvent.click(screen.getByRole('button', { name: /jun.*15.*2026/i }));

    const prevBtn = screen.getByRole('button', { name: /previous month/i });
    expect(prevBtn).toBeDisabled();
  });
});
```

**Step 2: Run tests — expect ALL to fail**

```
npm test -- --testPathPattern=CalendarPicker --watchAll=false
```

Expected: FAIL — `Cannot find module './CalendarPicker'`

---

**Step 3: Implement `src/shared/ui/CalendarPicker.jsx`**

```jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Label } from './Input';
import {
  fromYMD, toYMD, todayYMD,
  getDaysInMonth, getFirstDayOfWeek,
  isSameDay, isBefore, isAfter, isToday,
  formatDisplayDate, formatMonthYear,
} from '../../utils/dateUtils';

const DAY_NAMES = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function CalendarPicker({
  label,
  id,
  value = '',
  onChange,
  minDate = '',
  maxDate = '',
  required = false,
  placeholder = 'Select a date',
  className = '',
}) {
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function onMouseDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      // Jump view to selected date, or minDate, or today
      const jumpTo =
        (value ? fromYMD(value) : null) ||
        (minDate ? fromYMD(minDate) : null) ||
        new Date();
      setViewYear(jumpTo.getFullYear());
      setViewMonth(jumpTo.getMonth());
    }
    setIsOpen((o) => !o);
  };

  const handleSelect = useCallback(
    (day) => {
      onChange(toYMD(new Date(viewYear, viewMonth, day)));
      setIsOpen(false);
    },
    [viewYear, viewMonth, onChange]
  );

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const minDateObj = minDate ? fromYMD(minDate) : null;
  const maxDateObj = maxDate ? fromYMD(maxDate) : null;
  const selectedDate = value ? fromYMD(value) : null;

  // Disable prev if last day of previous month is before minDate
  const isPrevDisabled =
    !!minDateObj && isBefore(new Date(viewYear, viewMonth, 0), minDateObj);

  // Disable next if first day of next month is after maxDate
  const isNextDisabled =
    !!maxDateObj && isAfter(new Date(viewYear, viewMonth + 1, 1), maxDateObj);

  const isDayDisabled = (day) => {
    const date = new Date(viewYear, viewMonth, day);
    if (minDateObj && isBefore(date, minDateObj)) return true;
    if (maxDateObj && isAfter(date, maxDateObj)) return true;
    return false;
  };

  const getDayAriaLabel = (day) => {
    const date = new Date(viewYear, viewMonth, day);
    let label = date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    if (isToday(date)) label += ', today';
    if (selectedDate && isSameDay(date, selectedDate)) label += ', selected';
    return label;
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayOffset = getFirstDayOfWeek(viewYear, viewMonth);

  return (
    <div ref={containerRef} className={`relative${className ? ` ${className}` : ''}`}>
      {label && <Label htmlFor={id}>{label}</Label>}

      {/* Trigger button */}
      <button
        type="button"
        id={id}
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="grid"
        aria-label={value ? formatDisplayDate(value) : placeholder}
        className={
          'w-full px-3 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-left ' +
          'flex items-center justify-between gap-2 transition-colors ' +
          'focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 ' +
          'hover:border-gray-600'
        }
      >
        <span className={value ? 'text-gray-50 text-sm' : 'text-gray-500 text-sm'}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <Calendar size={15} className="text-gray-500 shrink-0" />
      </button>

      {/* Hidden input for form integration */}
      <input type="hidden" name={id} value={value} required={required} />

      {/* Calendar grid */}
      {isOpen && (
        <div
          className="mt-1 bg-dark-900 border border-dark-700 rounded-xl p-3 animate-fade-in"
          role="grid"
          aria-label={formatMonthYear(viewYear, viewMonth)}
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              disabled={isPrevDisabled}
              aria-label="Previous month"
              className="p-1 rounded-md text-gray-400 hover:text-gray-100 hover:bg-dark-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-gray-200">
              {formatMonthYear(viewYear, viewMonth)}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              disabled={isNextDisabled}
              aria-label="Next month"
              className="p-1 rounded-md text-gray-400 hover:text-gray-100 hover:bg-dark-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1" role="row">
            {DAY_NAMES.map((d) => (
              <div
                key={d}
                role="columnheader"
                className="text-center text-[11px] font-medium text-gray-500 py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-0.5" role="rowgroup">
            {/* Empty offset cells */}
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} role="gridcell" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const disabled = isDayDisabled(day);
              const dayDate = new Date(viewYear, viewMonth, day);
              const selected = selectedDate && isSameDay(dayDate, selectedDate);
              const todayMark = isToday(dayDate);
              const ariaLabel = getDayAriaLabel(day);

              let cellClass =
                'w-full aspect-square text-sm rounded-lg flex items-center justify-center transition-colors ';

              if (disabled) {
                cellClass += 'text-gray-700 cursor-not-allowed opacity-30';
              } else if (selected) {
                cellClass += 'bg-brand-500 text-white font-semibold';
              } else if (todayMark) {
                cellClass +=
                  'ring-1 ring-brand-400/60 text-brand-400 hover:bg-dark-700';
              } else {
                cellClass +=
                  'text-gray-300 hover:bg-dark-700 hover:text-gray-100';
              }

              return (
                <button
                  key={day}
                  type="button"
                  role="gridcell"
                  aria-label={ariaLabel}
                  aria-disabled={disabled}
                  disabled={disabled}
                  onClick={() => handleSelect(day)}
                  className={cellClass}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarPicker;
```

**Step 4: Add export to `src/shared/ui/index.js`**

Add this line after the existing exports:

```js
export { default as CalendarPicker } from './CalendarPicker';
```

**Step 5: Run CalendarPicker tests — expect ALL to pass**

```
npm test -- --testPathPattern=CalendarPicker --watchAll=false
```

Expected: PASS (all tests green)

---

## Task 3: Wire CalendarPicker into CreateGroupForm

**Files:**
- Modify: `src/features/home/CreateGroupForm.jsx`

No new tests needed — the component-level tests cover behavior.

---

**Step 1: Update imports**

Replace the existing import line:
```js
import { Input, Textarea, Label, Button, Card, LocationInput } from '../../shared/ui';
```
With:
```js
import { Input, Textarea, Label, Button, Card, LocationInput, CalendarPicker } from '../../shared/ui';
import { todayYMD } from '../../utils/dateUtils';
```

**Step 2: Add empty-date validation in `handleSubmit`**

Insert before the `endDate < startDate` check:

```js
if (!startDate || !endDate) {
  addNotification({ type: 'error', message: 'Please select both start and end dates.' });
  return;
}
```

**Step 3: Replace the date input grid**

Replace the entire `<div className="grid grid-cols-2 gap-3">` block (lines 131–150 of the current file) with:

```jsx
<div className="grid grid-cols-2 gap-3">
  <CalendarPicker
    label="Start Date"
    id="start-date"
    value={startDate}
    onChange={(v) => {
      setStartDate(v);
      // Reset end date if it's now before the new start date
      if (endDate && v && endDate < v) setEndDate('');
    }}
    minDate={todayYMD()}
    required
    placeholder="Start date"
  />
  <CalendarPicker
    label="End Date"
    id="end-date"
    value={endDate}
    onChange={setEndDate}
    minDate={startDate || todayYMD()}
    required
    placeholder="End date"
  />
</div>
```

**Step 4: Run the full test suite to confirm nothing broken**

```
npm test -- --watchAll=false
```

Expected: PASS (all existing tests pass, no regressions)

---

## Task 4: Wire CalendarPicker into GroupSettings

**Files:**
- Modify: `src/features/admin/GroupSettings.jsx`

---

**Step 1: Update imports**

Add `CalendarPicker` and `Button` to imports (Button is not currently imported here):

```js
import { CopyButton, ReadOnlyInput, TruncatedText, Input, Label, Card, LocationInput, LocationDisplay, CalendarPicker, Button } from '../../shared/ui';
import { todayYMD } from '../../utils/dateUtils';
```

**Step 2: Replace date inputs in the editing block**

Replace this existing block (lines 161–181):
```jsx
<div className="grid grid-cols-2 gap-4">
  <div>
    <Label size="compact">Start Date</Label>
    <Input
      type="date"
      size="compact"
      value={editData.startDate}
      onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
    />
  </div>

  <div>
    <Label size="compact">End Date</Label>
    <Input
      type="date"
      size="compact"
      value={editData.endDate}
      onChange={(e) => setEditData({ ...editData, endDate: e.target.value })}
    />
  </div>
</div>
```

With:
```jsx
<div className="grid grid-cols-2 gap-4">
  <CalendarPicker
    label="Start Date"
    id="edit-start-date"
    value={editData.startDate}
    onChange={(v) => {
      const next = { ...editData, startDate: v };
      if (editData.endDate && v && editData.endDate < v) next.endDate = '';
      setEditData(next);
    }}
    minDate={todayYMD()}
    placeholder="Start date"
  />
  <CalendarPicker
    label="End Date"
    id="edit-end-date"
    value={editData.endDate}
    onChange={(v) => setEditData({ ...editData, endDate: v })}
    minDate={editData.startDate || todayYMD()}
    placeholder="End date"
  />
</div>
```

**Step 3: Replace Save/Cancel raw buttons (lines 222–235)**

Replace:
```jsx
<div className="flex gap-2 pt-4">
  <button
    onClick={onSaveEdit}
    className="flex-1 bg-brand-500 hover:bg-brand-400 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
  >
    <Save size={18} /> Save
  </button>
  <button
    onClick={() => setEditing(false)}
    className="flex-1 bg-dark-800 hover:bg-dark-700 text-gray-300 font-bold py-2 px-4 rounded-lg border border-dark-700 transition-colors"
  >
    Cancel
  </button>
</div>
```

With:
```jsx
<div className="flex gap-2 pt-4">
  <Button variant="primary" fullWidth onClick={onSaveEdit}>
    <Save size={18} className="inline mr-1.5" /> Save
  </Button>
  <Button variant="secondary" fullWidth onClick={() => setEditing(false)}>
    Cancel
  </Button>
</div>
```

**Step 4: Run the full test suite to confirm nothing broken**

```
npm test -- --watchAll=false
```

Expected: PASS

---

## Task 5: Fix Admin Page Action Buttons

**Files:**
- Modify: `src/features/admin/AdminPage.jsx`

---

**Step 1: Confirm `Button` is already imported**

Check line 12 of `AdminPage.jsx` — `Button` is already in the import from `../../shared/ui`. No change needed.

**Step 2: Replace the 3 raw buttons in the Actions panel**

Locate the `<div className="space-y-2">` block (lines 236–258) and replace it entirely with:

```jsx
<div className="space-y-2">
  <Button
    variant="secondary"
    fullWidth
    onClick={handleExport}
    disabled={!participants || participants.length === 0}
  >
    <Download size={16} className="inline mr-1.5" /> Export CSV
  </Button>
  <Button
    variant="primary"
    fullWidth
    onClick={handleSendReminder}
    disabled={reminderSending || !participants?.some(p => p?.email && p.email.trim() !== '')}
    title={!participants?.some(p => p?.email && p.email.trim() !== '') ? 'No participants have an email address' : ''}
  >
    <Mail size={16} className="inline mr-1.5" />
    {reminderSending ? 'Sending...' : 'Send Reminder'}
  </Button>
  <Button
    variant="danger"
    fullWidth
    onClick={() => setShowDeleteConfirm(true)}
  >
    Delete Group
  </Button>
</div>
```

**Step 3: Run the full test suite one final time**

```
npm test -- --watchAll=false
```

Expected: PASS — all tests green, no regressions.

---

## Summary of Files

| Action | File |
|---|---|
| Create | `src/utils/dateUtils.js` |
| Create | `src/utils/dateUtils.test.js` |
| Create | `src/shared/ui/CalendarPicker.jsx` |
| Create | `src/shared/ui/CalendarPicker.test.jsx` |
| Modify | `src/shared/ui/index.js` — add CalendarPicker export |
| Modify | `src/features/home/CreateGroupForm.jsx` — replace date inputs |
| Modify | `src/features/admin/GroupSettings.jsx` — replace date inputs + buttons |
| Modify | `src/features/admin/AdminPage.jsx` — replace 3 action buttons |
