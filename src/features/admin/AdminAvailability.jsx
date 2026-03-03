import React, { useState } from 'react';
import CalendarView from '../../components/CalendarView';
import { isSingleDayEvent } from '../../utils/eventTypes';

function AdminAvailability({
  group,
  adminParticipantId,
  adminSavedDays,
  adminName,
  adminEmail,
  adminDuration,
  onSave,
}) {
  const [showAvailability, setShowAvailability] = useState(false);

  return (
    <div className="bg-dark-900 rounded-xl border border-dark-700 p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-50">
          {adminParticipantId ? `Your Availability (${adminName})` : 'Add Your Availability'}
        </h3>
        <button
          onClick={() => setShowAvailability(s => !s)}
          className="text-brand-400 hover:text-brand-300 text-sm font-semibold"
        >
          {showAvailability ? 'Hide' : adminParticipantId ? 'Update' : 'Add'}
        </button>
      </div>

      {adminParticipantId && !showAvailability && (
        <p className="text-gray-400 text-sm">
          {adminSavedDays.length} day{adminSavedDays.length !== 1 ? 's' : ''} selected. Click "Update" to change.
        </p>
      )}

      {!adminParticipantId && !showAvailability && (
        <p className="text-gray-400 text-sm">
          As the organizer, add your own availability so it's included in the overlap results.
        </p>
      )}

      {showAvailability && (
        <CalendarView
          startDate={group.startDate}
          endDate={group.endDate}
          onSubmit={onSave}
          savedDays={adminSavedDays}
          initialName={adminName}
          initialEmail={adminEmail}
          initialDuration={adminDuration}
          singleDay={isSingleDayEvent(group?.eventType)}
        />
      )}
    </div>
  );
}

export default AdminAvailability;
