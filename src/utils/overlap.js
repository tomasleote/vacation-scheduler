export const calculateOverlap = (participants, startDate, endDate, durationDays) => {
  if (!participants?.length) return [];

  // Pre-generate all date strings in the range once (O(D) time and space)
  const rangeDates = getDatesBetween(startDate, endDate);
  const totalDays = rangeDates.length;

  if (totalDays < durationDays) return [];

  // Pre-process participants: convert availableDays to O(1) lookup Sets
  // Complexity: O(N * D) where N is participants, D is their configured available days
  const pSets = participants.map(p => ({
    availableSet: new Set(p.availableDays || [])
  }));

  const results = [];

  // Track each participant's available days count within the current sliding window
  const windowCounts = new Array(pSets.length).fill(0);

  // Initialize the first window (0 to durationDays - 1)
  for (let i = 0; i < durationDays; i++) {
    const dStr = rangeDates[i];
    for (let pIdx = 0; pIdx < pSets.length; pIdx++) {
      if (pSets[pIdx].availableSet.has(dStr)) {
        windowCounts[pIdx]++;
      }
    }
  }

  // Push result for the very first window
  let availableCount = windowCounts.filter(count => count === durationDays).length;
  results.push({
    startDate: new Date(rangeDates[0]),
    endDate: new Date(rangeDates[durationDays - 1]),
    availableCount,
    totalParticipants: participants.length,
    availabilityPercent: Math.round((availableCount / participants.length) * 100),
    dayCount: durationDays
  });

  // Slide the window forward 1 day at a time
  // Complexity: O(D * N) total
  for (let i = durationDays; i < totalDays; i++) {
    const dayLeaving = rangeDates[i - durationDays];
    const dayEntering = rangeDates[i];

    availableCount = 0;

    for (let pIdx = 0; pIdx < pSets.length; pIdx++) {
      const pSet = pSets[pIdx].availableSet;
      if (pSet.has(dayLeaving)) windowCounts[pIdx]--;
      if (pSet.has(dayEntering)) windowCounts[pIdx]++;

      if (windowCounts[pIdx] === durationDays) {
        availableCount++;
      }
    }

    results.push({
      startDate: new Date(rangeDates[i - durationDays + 1]),
      endDate: new Date(dayEntering),
      availableCount,
      totalParticipants: participants.length,
      availabilityPercent: Math.round((availableCount / participants.length) * 100),
      dayCount: durationDays
    });
  }

  return results.sort((a, b) => b.availabilityPercent - a.availabilityPercent);
};

export const getBestOverlapPeriods = (overlaps, limit = 5) => {
  return overlaps.slice(0, limit);
};

export const formatDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const options = { month: 'short', day: 'numeric' };

  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.toLocaleDateString('en-US', options)} - ${end.getDate()}`;
  }
  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
};

export const getDatesBetween = (startDate, endDate) => {
  const dates = [];
  const current = new Date(startDate);

  while (current <= new Date(endDate)) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
};
