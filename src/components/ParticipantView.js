import React, { useState, useEffect } from 'react';
import { subscribeToGroup } from '../services/groupService';
import { addParticipant, updateParticipant, getParticipant, subscribeToParticipants } from '../services/participantService';
import { getDatesBetween, calculateOverlap, getBestOverlapPeriods } from '../utils/overlap';
import { ReadOnlyInput, CopyButton, Button, LoadingSpinner, Card, TruncatedText, LocationDisplay } from '../shared/ui';
import { useNotification } from '../context/NotificationContext';
import { useGroupContext } from '../shared/context';
import { isSingleDayEvent } from '../utils/eventTypes';

import CalendarView from './CalendarView';
import SlidingOverlapCalendar from './SlidingOverlapCalendar';
import SchemaMarkup from '../features/landing/SchemaMarkup';
import { ChevronDown, ChevronUp, CalendarRange, Users } from 'lucide-react';

function ParticipantView({ participantId: initialParticipantId, onBack }) {
  const { groupId } = useGroupContext();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addNotification } = useNotification();
  const [participants, setParticipants] = useState([]);
  const [expandedSection, setExpandedSection] = useState('form');
  const [currentParticipantId, setCurrentParticipantId] = useState(null);
  const [savedDays, setSavedDays] = useState([]);
  const [participantName, setParticipantName] = useState('');
  const [participantEmail, setParticipantEmail] = useState('');
  const [participantDuration, setParticipantDuration] = useState('3');
  const [heatmapDuration, setHeatmapDuration] = useState('3');
  const [overlaps, setOverlaps] = useState([]);

  useEffect(() => {
    if (!groupId) return;

    setLoading(true);
    let initialLoads = 2;
    const onLoad = () => {
      initialLoads--;
      if (initialLoads <= 0) setLoading(false);
    };

    const unsubGroup = subscribeToGroup(groupId, (data) => {
      setError('');
      if (data) {
        setGroup(data);
      } else {
        setGroup(null);
      }
      onLoad();
    }, (err) => {
      setError(err.message || 'Failed to load group data.');
      onLoad();
    });

    const unsubParts = subscribeToParticipants(groupId, (data) => {
      setError('');
      setParticipants(data || []);
      onLoad();
    }, (err) => {
      setError(err.message || 'Failed to load participants.');
      onLoad();
    });

    return () => {
      unsubGroup();
      unsubParts();
    };
  }, [groupId]);

  useEffect(() => {
    if (!initialParticipantId) return;
    const restore = async () => {
      try {
        const participant = await getParticipant(groupId, initialParticipantId);
        if (participant) {
          setCurrentParticipantId(initialParticipantId);
          setSavedDays(participant.availableDays || []);
          setParticipantName(participant.name);
          setParticipantEmail(participant.email || '');
          setParticipantDuration(String(participant.duration || '3'));
          setHeatmapDuration(String(participant.duration || '3'));
        }
      } catch (err) {
        console.error('[ParticipantView] Failed to restore participant:', err);
        addNotification({
          type: 'error',
          title: 'Network Error',
          message: 'Could not load your saved dates. Please check your connection or try again later.'
        });
      }
    };
    restore();
  }, [groupId, initialParticipantId]);

  useEffect(() => {
    if (group && participants?.length > 0) {
      const results = calculateOverlap(
        participants,
        group.startDate,
        group.endDate,
        parseInt(heatmapDuration || '3')
      );
      setOverlaps(results);
    } else {
      setOverlaps([]);
    }
  }, [group, participants, heatmapDuration]);

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);

      // The participants state is already updated via a real-time listener (subscribeToParticipants).
      // This ensures the `participants` array is always current for checks like duplication.
      const normalizedName = formData.name.trim().toLowerCase();
      const isDuplicate = participants.some(
        p => p.name.trim().toLowerCase() === normalizedName && p.id !== currentParticipantId
      );
      if (isDuplicate) {
        throw new Error('A participant with this name already exists. Please choose another name.');
      }

      // The CalendarView now passes the entire desired array state.
      // E.g., if a user unselects a previously saved day, formData.selectedDays simply won't include it.
      const finalDays = formData.selectedDays || [];

      if (!currentParticipantId) {
        const participantId = await addParticipant(groupId, {
          name: formData.name,
          email: formData.email,
          duration: formData.duration,
          availableDays: finalDays,
          blockType: formData.blockType
        });
        setCurrentParticipantId(participantId);
        setParticipantName(formData.name);
        setParticipantEmail(formData.email || '');
        setParticipantDuration(String(formData.duration));
        setHeatmapDuration(String(formData.duration));

        try {
          localStorage.setItem(
            `fad_p_${groupId}`,
            JSON.stringify({ participantId, name: formData.name })
          );
        } catch { }

        window.history.replaceState({}, '', `?group=${groupId}&p=${participantId}`);
      } else {
        await updateParticipant(groupId, currentParticipantId, {
          name: formData.name,
          email: formData.email,
          availableDays: finalDays,
          duration: formData.duration,
          blockType: formData.blockType
        });
        setParticipantName(formData.name);
        setParticipantEmail(formData.email || '');
        setParticipantDuration(String(formData.duration));
      }

      setSavedDays(finalDays);
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Your response has been recorded. Thank you!'
      });
    } catch (err) {
      console.error('[Participant Submission Error] handleSubmit failed:', err);
      addNotification({
        type: 'error',
        title: 'Error',
        message: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card variant="danger" className="text-center max-w-md">
          <h2 className="text-xl font-bold text-rose-400 mb-2">Access Denied</h2>
          <p className="text-gray-300 mb-6 font-medium">{error}</p>
          <Button variant="secondary" fullWidth onClick={onBack}>
            Go Home
          </Button>
        </Card>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-dark-900 rounded-xl border border-dark-700 p-8 max-w-md text-center">
          <p className="text-rose-400 mb-6 font-medium">Group not found or could not be loaded.</p>
          <button
            onClick={onBack}
            className="w-full bg-brand-500 hover:bg-brand-400 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen p-4 md:p-8">
      <SchemaMarkup group={group} content={{}} />
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="text-brand-400 hover:text-brand-300 font-semibold mb-8"
        >
          ← Back to Home
        </button>

        <div className="bg-dark-900 rounded-xl border border-dark-700 p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-50 mb-2">
            <TruncatedText text={group.name} />
          </h1>
          {group.description && (
            <p className="text-gray-400 mb-4 italic">{group.description}</p>
          )}
          <p className="text-gray-400 mb-4">
            {isSingleDayEvent(group?.eventType) ? 'Which days work for you?' : 'Select the dates you\'re available'}
          </p>
          <div className="flex gap-4 text-sm text-gray-400 flex-wrap">
            <span className="flex items-center gap-1.5"><CalendarRange size={16} className="text-gray-500" /> {group.startDate} to {group.endDate}</span>
            <span className="flex items-center gap-1.5"><Users size={16} className="text-gray-500" /> {participants?.length || 0} people attending</span>
          </div>
          {group.location && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <LocationDisplay location={group.location} />
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {currentParticipantId ? (
              <ParticipantDashboard
                groupId={groupId}
                participantId={currentParticipantId}
                participantName={participantName}
                participantEmail={participantEmail}
                participantDuration={participantDuration}
                savedDays={savedDays}
                group={group}
                onSubmit={handleSubmit}
              />
            ) : (
              <div className="bg-dark-900 rounded-xl border border-dark-700 p-6">
                <h2 className="text-xl font-bold text-gray-50 mb-4">Select Your Availability</h2>
                <CalendarView
                  startDate={group.startDate}
                  endDate={group.endDate}
                  onSubmit={handleSubmit}
                  savedDays={savedDays}
                  singleDay={isSingleDayEvent(group?.eventType)}
                />
              </div>
            )}

          </div>

          <div className="md:col-span-1">
            <div className="bg-dark-900 rounded-xl border border-dark-700 p-6 sticky top-4">
              <h3 className="text-lg font-bold text-gray-50 mb-4">Participants</h3>
              <div className="space-y-2 text-sm max-h-96 overflow-y-auto">
                {(!participants || participants.length === 0) ? (
                  <p className="text-gray-500">Be the first to join!</p>
                ) : (
                  participants?.map((p, i) => (
                    <div key={i} className="bg-dark-800 rounded p-3 border-l-4 border-brand-500">
                      <p className="font-semibold text-gray-50">
                        <TruncatedText text={p.name || 'Anonymous'} maxWidth="100%" />
                      </p>
                      <p className="text-gray-400 text-xs">{p.duration}-day duration</p>
                      <p className="text-gray-400 text-xs">{(p.availableDays || []).length} days available</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {overlaps?.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-50 mb-4">Current Group Availability</h2>
            <SlidingOverlapCalendar
              startDate={group.startDate}
              endDate={group.endDate}
              participants={participants}
              duration={heatmapDuration || '3'}
              overlaps={getBestOverlapPeriods(overlaps, 10)}
              onDurationChange={setHeatmapDuration}
              singleDay={isSingleDayEvent(group?.eventType)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ParticipantDashboard({ groupId, participantId, participantName, participantEmail, participantDuration, savedDays, group, onSubmit }) {
  const baseUrl = window.location.origin;
  const personalLink = `${baseUrl}?group=${groupId}&p=${participantId}`;
  const [updating, setUpdating] = useState(false);

  return (
    <div className="space-y-4">
      <div className="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <h2 className="text-xl font-bold text-gray-50 mb-1 flex items-center gap-1">
          Hi, <TruncatedText text={participantName} maxWidth="200px" />!
        </h2>
        <p className="text-gray-400 text-sm mb-4">Your availability is saved.</p>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Your personal link — save to edit later:
          </label>
          <div className="flex gap-2">
            <ReadOnlyInput value={personalLink} />
            <CopyButton value={personalLink} />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => setUpdating(u => !u)}
            className="text-brand-400 hover:text-brand-300 text-sm font-semibold text-left w-fit"
          >
            {updating ? '\u2191 Hide update form' : '\u270F Update your dates'}
          </button>
          <button
            onClick={() => {
              if (window.confirm('This will remove your participant access to this group from this browser. You can still return using your personal link. Continue?')) {
                localStorage.removeItem(`fad_p_${groupId}`);
                window.location.href = '/';
              }
            }}
            className="text-gray-500 hover:text-rose-400 text-xs font-medium text-left w-fit transition-colors"
          >
            Clear local access for this group
          </button>
        </div>
      </div>

      <div className="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <h3 className="text-base font-bold text-gray-300 mb-1">Your selected dates</h3>
        <p className="text-gray-500 text-xs mb-3">Changing your name, email, or duration below will update your info when you submit.</p>
        <CalendarView
          startDate={group.startDate}
          endDate={group.endDate}
          onSubmit={onSubmit}
          savedDays={savedDays}
          initialName={participantName}
          initialEmail={participantEmail}
          initialDuration={participantDuration}
          singleDay={isSingleDayEvent(group?.eventType)}
        />
      </div>
    </div>
  );
}

export default ParticipantView;
