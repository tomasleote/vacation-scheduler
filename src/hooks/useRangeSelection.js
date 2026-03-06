import { useState, useCallback, useMemo } from 'react';
import { getDatesBetween } from '../utils/overlap';

/**
 * Hook for multi-range calendar selection.
 * Click an unselected date → starts a new range (or single-day select).
 * Click a second unselected date → completes the range, adds all days to selection.
 * Click a selected date → deselects that single day.
 * Multiple non-contiguous ranges accumulate additively.
 * Output is always a flat sorted array of ISO date strings.
 */
export function useRangeSelection(allowedDateRange, initialDays = []) {
  const [selectedSet, setSelectedSet] = useState(() => new Set(initialDays));
  const [rangeStart, setRangeStart] = useState(null);

  const allowedSet = useMemo(() => new Set(allowedDateRange), [allowedDateRange]);

  const selectedDays = useMemo(() => [...selectedSet].sort(), [selectedSet]);

  const handleDayClick = useCallback((dateStr) => {
    if (!allowedSet.has(dateStr)) return;

    // Clicking an already-selected day → deselect it
    if (selectedSet.has(dateStr)) {
      setSelectedSet(prev => {
        const next = new Set(prev);
        next.delete(dateStr);
        return next;
      });
      // If this was the pending range start, clear it
      if (rangeStart === dateStr) {
        setRangeStart(null);
      }
      return;
    }

    // No pending range start → begin a new range
    if (rangeStart === null) {
      setRangeStart(dateStr);
      setSelectedSet(prev => new Set(prev).add(dateStr));
      return;
    }

    // Second click → complete the range
    const [normStart, normEnd] = rangeStart <= dateStr
      ? [rangeStart, dateStr]
      : [dateStr, rangeStart];
    const rangeDays = getDatesBetween(normStart, normEnd).filter(d => allowedSet.has(d));

    setSelectedSet(prev => {
      const next = new Set(prev);
      for (const d of rangeDays) next.add(d);
      return next;
    });
    setRangeStart(null);
  }, [allowedSet, selectedSet, rangeStart]);

  const syncFromSaved = useCallback((savedDays) => {
    if (!savedDays || savedDays.length === 0) {
      setSelectedSet(new Set());
      setRangeStart(null);
      return;
    }
    setSelectedSet(new Set(savedDays));
    setRangeStart(null);
  }, []);

  return {
    selectedDays,
    rangeStart,
    handleDayClick,
    syncFromSaved,
  };
}
