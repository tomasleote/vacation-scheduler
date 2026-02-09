import Papa from 'papaparse';

export const exportToCSV = (group, participants, overlaps) => {
  const data = [];
  
  data.push(['Vacation Scheduler Export']);
  data.push(['Group:', group.name]);
  data.push(['Date Range:', `${group.startDate} to ${group.endDate}`]);
  data.push(['Created:', new Date(group.createdAt).toLocaleString()]);
  data.push([]);
  
  data.push(['PARTICIPANTS']);
  data.push(['Name', 'Email', 'Duration', 'Available Days']);
  participants.forEach(p => {
    data.push([
      p.name || 'N/A',
      p.email || 'N/A',
      `${p.duration} days`,
      (p.availableDays || []).join(', ') || 'None'
    ]);
  });
  
  data.push([]);
  data.push(['TOP OVERLAP PERIODS']);
  data.push(['Start Date', 'End Date', 'Duration', 'Available Count', 'Total Participants', 'Availability %']);
  overlaps.slice(0, 10).forEach(o => {
    data.push([
      o.startDate.toISOString().split('T')[0],
      o.endDate.toISOString().split('T')[0],
      `${o.dayCount} days`,
      o.availableCount,
      o.totalParticipants,
      `${o.availabilityPercent}%`
    ]);
  });
  
  const csv = Papa.unparse(data);
  downloadCSV(csv, `vacation-scheduler-${group.id}.csv`);
};

const downloadCSV = (csv, filename) => {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};
