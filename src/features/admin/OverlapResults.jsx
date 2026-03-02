import React from 'react';
import SlidingOverlapCalendar from '../../components/SlidingOverlapCalendar';

function OverlapResults({ group, participants, overlaps, durationFilter, onDurationChange }) {
  if (!overlaps?.length) return null;

  return (
    <div className="mb-8">
      <SlidingOverlapCalendar
        startDate={group.startDate}
        endDate={group.endDate}
        participants={participants}
        duration={durationFilter}
        overlaps={overlaps}
        onDurationChange={onDurationChange}
      />
    </div>
  );
}

export default OverlapResults;
