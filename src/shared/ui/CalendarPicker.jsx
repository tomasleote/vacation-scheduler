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
      <input type="hidden" name={id} value={value} />

      {/* Calendar grid */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-dark-900 border border-dark-700 rounded-xl p-3 animate-fade-in z-50 shadow-lg"
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
