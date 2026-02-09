export const calculateOverlap = (participants, startDate, endDate, durationDays) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
  
  if (totalDays < durationDays) return [];

  const results = [];
  let currentDate = new Date(start);

  while (currentDate <= new Date(end.getTime() - (durationDays - 1) * 24 * 60 * 60 * 1000)) {
    const periodEnd = new Date(currentDate.getTime() + (durationDays - 1) * 24 * 60 * 60 * 1000);
    
    if (periodEnd > end) break;

    const availableCount = countAvailable(participants, currentDate, periodEnd);
    const availabilityPercent = participants.length > 0 
      ? Math.round((availableCount / participants.length) * 100) 
      : 0;

    results.push({
      startDate: new Date(currentDate),
      endDate: new Date(periodEnd),
      availableCount,
      totalParticipants: participants.length,
      availabilityPercent,
      dayCount: durationDays
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return results.sort((a, b) => b.availabilityPercent - a.availabilityPercent);
};

const countAvailable = (participants, startDate, endDate) => {
  return participants.filter(p => {
    if (!p.availableDays || p.availableDays.length === 0) return false;
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (!p.availableDays.includes(dateStr)) return false;
    }
    return true;
  }).length;
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
