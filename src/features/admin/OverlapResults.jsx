import React from 'react';
import SlidingOverlapCalendar from '../../components/SlidingOverlapCalendar';
import { isSingleDayEvent } from '../../utils/eventTypes';

function OverlapResults({ group, participants, overlaps, durationFilter, onDurationChange }) {
  if (!group || !group.startDate || !group.endDate || !overlaps?.length) return null;

  return (
    <div className="mb-8">
      <SlidingOverlapCalendar
        startDate={group.startDate}
        endDate={group.endDate}
        participants={participants}
        duration={durationFilter}
        overlaps={overlaps}
        onDurationChange={onDurationChange}
        singleDay={isSingleDayEvent(group?.eventType)}
      />
    </div>
  );
}

export default OverlapResults;
