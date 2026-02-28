import { calculateOverlap, getBestOverlapPeriods, formatDateRange, getDatesBetween } from './overlap';

describe('getDatesBetween', () => {
  test('returns all dates in a range (inclusive)', () => {
    const result = getDatesBetween('2024-06-01', '2024-06-05');
    expect(result).toEqual([
      '2024-06-01', '2024-06-02', '2024-06-03', '2024-06-04', '2024-06-05'
    ]);
  });

  test('returns single date when start equals end', () => {
    const result = getDatesBetween('2024-06-01', '2024-06-01');
    expect(result).toEqual(['2024-06-01']);
  });

  test('returns empty array when start > end', () => {
    const result = getDatesBetween('2024-06-05', '2024-06-01');
    expect(result).toEqual([]);
  });

  test('handles month boundaries', () => {
    const result = getDatesBetween('2024-01-30', '2024-02-02');
    expect(result).toEqual(['2024-01-30', '2024-01-31', '2024-02-01', '2024-02-02']);
  });

  test('handles year boundaries', () => {
    const result = getDatesBetween('2024-12-30', '2025-01-02');
    expect(result).toEqual(['2024-12-30', '2024-12-31', '2025-01-01', '2025-01-02']);
  });

  test('handles leap year Feb 29', () => {
    const result = getDatesBetween('2024-02-28', '2024-03-01');
    expect(result).toEqual(['2024-02-28', '2024-02-29', '2024-03-01']);
  });

  test('handles non-leap year Feb', () => {
    const result = getDatesBetween('2023-02-27', '2023-03-01');
    expect(result).toEqual(['2023-02-27', '2023-02-28', '2023-03-01']);
  });
});

describe('calculateOverlap', () => {
  const makeParticipant = (name, days) => ({
    name,
    availableDays: days,
    duration: days.length
  });

  test('returns empty when duration > total days in range', () => {
    const participants = [makeParticipant('Alice', ['2024-06-01', '2024-06-02'])];
    const result = calculateOverlap(participants, '2024-06-01', '2024-06-02', 5);
    expect(result).toEqual([]);
  });

  test('returns empty when no participants', () => {
    const result = calculateOverlap([], '2024-06-01', '2024-06-10', 3);
    expect(result).toEqual([]);
  });

  test('returns empty when participants is null', () => {
    const result = calculateOverlap(null, '2024-06-01', '2024-06-10', 3);
    expect(result).toEqual([]);
  });

  test('returns empty when participants is undefined', () => {
    const result = calculateOverlap(undefined, '2024-06-01', '2024-06-10', 3);
    expect(result).toEqual([]);
  });

  test('calculates 100% overlap when all participants available for entire range', () => {
    const participants = [
      makeParticipant('Alice', ['2024-06-01', '2024-06-02', '2024-06-03']),
      makeParticipant('Bob', ['2024-06-01', '2024-06-02', '2024-06-03'])
    ];
    const result = calculateOverlap(participants, '2024-06-01', '2024-06-03', 3);
    expect(result.length).toBe(1);
    expect(result[0].availabilityPercent).toBe(100);
    expect(result[0].availableCount).toBe(2);
  });

  test('calculates partial overlap correctly', () => {
    const participants = [
      makeParticipant('Alice', ['2024-06-01', '2024-06-02', '2024-06-03']),
      makeParticipant('Bob', ['2024-06-02', '2024-06-03', '2024-06-04'])
    ];
    const result = calculateOverlap(participants, '2024-06-01', '2024-06-04', 2);
    // Results should be sorted by availability descending
    expect(result[0].availabilityPercent).toBe(100);
  });

  test('returns 0% when no participant has availability', () => {
    const participants = [
      makeParticipant('Alice', []),
      makeParticipant('Bob', [])
    ];
    const result = calculateOverlap(participants, '2024-06-01', '2024-06-05', 1);
    result.forEach(r => {
      expect(r.availabilityPercent).toBe(0);
    });
  });

  test('results are sorted by availabilityPercent descending', () => {
    const participants = [
      makeParticipant('Alice', ['2024-06-01', '2024-06-02']),
      makeParticipant('Bob', ['2024-06-03', '2024-06-04'])
    ];
    const result = calculateOverlap(participants, '2024-06-01', '2024-06-04', 1);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].availabilityPercent).toBeGreaterThanOrEqual(result[i].availabilityPercent);
    }
  });

  test('handles single-day duration', () => {
    const participants = [
      makeParticipant('Alice', ['2024-06-01', '2024-06-03']),
      makeParticipant('Bob', ['2024-06-01', '2024-06-02'])
    ];
    const result = calculateOverlap(participants, '2024-06-01', '2024-06-03', 1);
    expect(result.length).toBe(3);
    // June 1 should be 100% (both available)
    const june1 = result.find(r => r.startDate.toISOString().split('T')[0] === '2024-06-01');
    expect(june1.availabilityPercent).toBe(100);
  });

  test('handles participant with no availableDays field', () => {
    const participants = [{ name: 'NoData' }];
    const result = calculateOverlap(participants, '2024-06-01', '2024-06-03', 1);
    result.forEach(r => {
      expect(r.availableCount).toBe(0);
    });
  });

  test('handles participant with empty availableDays array', () => {
    const participants = [makeParticipant('Empty', [])];
    const result = calculateOverlap(participants, '2024-06-01', '2024-06-03', 1);
    result.forEach(r => {
      expect(r.availableCount).toBe(0);
    });
  });

  test('day count matches requested duration', () => {
    const participants = [
      makeParticipant('Alice', ['2024-06-01', '2024-06-02', '2024-06-03', '2024-06-04', '2024-06-05'])
    ];
    const result = calculateOverlap(participants, '2024-06-01', '2024-06-05', 3);
    result.forEach(r => {
      expect(r.dayCount).toBe(3);
    });
  });

  test('totalParticipants reflects actual count', () => {
    const participants = [
      makeParticipant('Alice', ['2024-06-01']),
      makeParticipant('Bob', ['2024-06-01']),
      makeParticipant('Charlie', ['2024-06-01'])
    ];
    const result = calculateOverlap(participants, '2024-06-01', '2024-06-01', 1);
    expect(result[0].totalParticipants).toBe(3);
  });

  // BUG: countAvailable mutates the startDate parameter via d.setDate()
  // This test documents the mutation bug in countAvailable
  test('date mutation bug: countAvailable iterates via setDate on loop variable', () => {
    // countAvailable uses `for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1))`
    // The issue: `d.setDate()` mutates `d` in-place. While this works for iteration,
    // the `startDate` parameter passed to countAvailable could be affected if JS engine
    // optimizes differently. More critically, it relies on date mutation side-effects.
    const participants = [
      makeParticipant('Alice', ['2024-06-01', '2024-06-02', '2024-06-03'])
    ];
    const result = calculateOverlap(participants, '2024-06-01', '2024-06-03', 3);
    expect(result[0].availableCount).toBe(1);
  });

  test('large number of participants', () => {
    const participants = Array.from({ length: 50 }, (_, i) =>
      makeParticipant(`P${i}`, ['2024-06-01', '2024-06-02', '2024-06-03'])
    );
    const result = calculateOverlap(participants, '2024-06-01', '2024-06-03', 3);
    expect(result[0].availableCount).toBe(50);
    expect(result[0].availabilityPercent).toBe(100);
  });

  test('long date range performance (30 days)', () => {
    const days = getDatesBetween('2024-06-01', '2024-06-30');
    const participants = [
      makeParticipant('Alice', days),
      makeParticipant('Bob', days.slice(5, 20))
    ];
    const start = Date.now();
    const result = calculateOverlap(participants, '2024-06-01', '2024-06-30', 5);
    const elapsed = Date.now() - start;
    expect(result.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(5000); // Should complete in under 5s
  });
});

describe('getBestOverlapPeriods', () => {
  test('returns top N results', () => {
    const overlaps = Array.from({ length: 10 }, (_, i) => ({
      availabilityPercent: (10 - i) * 10
    }));
    const result = getBestOverlapPeriods(overlaps, 3);
    expect(result.length).toBe(3);
  });

  test('defaults to 5 results', () => {
    const overlaps = Array.from({ length: 10 }, (_, i) => ({
      availabilityPercent: (10 - i) * 10
    }));
    const result = getBestOverlapPeriods(overlaps);
    expect(result.length).toBe(5);
  });

  test('returns all if fewer than limit', () => {
    const overlaps = [{ availabilityPercent: 100 }, { availabilityPercent: 50 }];
    const result = getBestOverlapPeriods(overlaps, 5);
    expect(result.length).toBe(2);
  });

  test('returns empty for empty input', () => {
    const result = getBestOverlapPeriods([], 5);
    expect(result).toEqual([]);
  });
});

describe('formatDateRange', () => {
  test('formats same-month range', () => {
    const result = formatDateRange('2024-06-01', '2024-06-15');
    expect(result).toContain('Jun');
    expect(result).toContain('15');
  });

  test('formats cross-month range', () => {
    const result = formatDateRange('2024-06-25', '2024-07-05');
    expect(result).toContain('Jun');
    expect(result).toContain('Jul');
  });

  test('formats same day range', () => {
    const result = formatDateRange('2024-06-01', '2024-06-01');
    // Same month, so uses short format
    expect(result).toContain('Jun');
    expect(result).toContain('1');
  });
});
