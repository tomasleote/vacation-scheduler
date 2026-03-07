import React, { useState, useEffect, useMemo, useRef } from 'react';
import { subscribeToGroup } from '../services/groupService';
import { addParticipant, updateParticipant, getParticipant, subscribeToParticipants } from '../services/participantService';
import { getDatesBetween, calculateOverlap, getBestOverlapPeriods } from '../utils/overlap';
import { ReadOnlyInput, CopyButton, Button, LoadingSpinner, Card, TruncatedText, LocationDisplay } from '../shared/ui';
import { useNotification } from '../context/NotificationContext';
import { subscribeToAvailability } from '../services/availabilityService';
import { subscribeToDailyCounts } from '../services/dailyCountsService';
import { useGroupContext } from '../shared/context';
import { isSingleDayEvent } from '../utils/eventTypes';
import { subscribeToPoll, submitVote, closePoll } from '../services/pollService';

import CalendarView from './CalendarView';
import SlidingOverlapCalendar from './SlidingOverlapCalendar';
import VotePanel from './VotePanel';
import CalendarEventButton from '../features/admin/CalendarEventButton';
import SchemaMarkup from '../features/landing/SchemaMarkup';
import { ChevronDown, ChevronUp, CalendarRange, Users } from 'lucide-react';
import { MAX_PARTICIPANTS_PER_GROUP } from '../utils/constants/validation';

function ParticipantView({ participantId: initialParticipantId, onBack }) {
  const { groupId } = useGroupContext();
  const [group, setGroup] = useState(null);
  const [participants, setParticipants] = useState({});
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [dailyCounts, setDailyCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addNotification } = useNotification();
  const [expandedSection, setExpandedSection] = useState('form');
  const [currentParticipantId, setCurrentParticipantId] = useState(null);
  const [savedDays, setSavedDays] = useState([]);
  const [participantName, setParticipantName] = useState('');
  const [participantEmail, setParticipantEmail] = useState('');
  const [participantDuration, setParticipantDuration] = useState('3');
  const [heatmapDuration, setHeatmapDuration] = useState('3');
  const [overlaps, setOverlaps] = useState([]);
  const [poll, setPoll] = useState(null);
  const calendarRef = useRef(null);

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

    const unsubAvailable = subscribeToAvailability(groupId, (data) => {
      setAvailabilityMap(data || {});
    });

    const unsubCounts = subscribeToDailyCounts(groupId, (data) => {
      setDailyCounts(data || {});
    });

    const unsubParts = subscribeToParticipants(groupId, (data) => {
      setError('');
      setParticipants(data || {});
      onLoad();
    }, (err) => {
      setError(err.message || 'Failed to load participants.');
      onLoad();
    });

    return () => {
      unsubGroup();
      unsubParts();
      unsubAvailable();
      unsubCounts();
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
    if (!groupId) return;
    const unsub = subscribeToPoll(
      groupId,
      (pollData) => {
        setPoll(pollData);

        // Auto-close: if all participants have voted, close the poll using atomic transaction to prevent redundant closures from n clients
        if (pollData?.status === 'active' && participants) {
          const partCount = Object.keys(participants).length;
          const voterCount = Object.keys(pollData.votes || {}).length;
          if (voterCount >= partCount && partCount > 0) {
            import('firebase/database').then(({ ref, runTransaction, set }) => {
              const { database } = require('../services/firebaseConfig');
              const statusRef = ref(database, `groups/${groupId}/poll/status`);
              runTransaction(statusRef, (current) => {
                if (current === 'active') return 'closed';
                return; // Already closed—abort
              }).then((result) => {
                if (result.committed) {
                  // The "winner" writes the closedAt stamp exactly once
                  set(ref(database, `groups/${groupId}/poll/closedAt`), new Date().toISOString());
                }
              }).catch(err => console.error('[ParticipantView] auto-close transaction failed:', err));
            });
          }
        }
      },
      (err) => console.error('[ParticipantView] poll subscription error:', err)
    );
    return unsub;
  }, [groupId, participants]);

  // Fingerprint that only changes when actual availability data changes
  const availabilityFingerprint = useMemo(() => {
    const participantsList = Object.values(participants || {});
    if (!participantsList.length) return '';
    return participantsList
      .map(p => `${p.id}:${(p.availableDays || []).length}:${(p.availableDays || []).join(',')}`)
      .sort()
      .join('|');
  }, [participants]);

  useEffect(() => {
    const participantsList = Object.values(participants || {});
    if (group && participantsList.length > 0) {
      const results = calculateOverlap(
        participantsList,
        group.startDate,
        group.endDate,
        parseInt(heatmapDuration || '3')
      );
      setOverlaps(results);
    } else {
      setOverlaps([]);
    }
  }, [group?.startDate, group?.endDate, availabilityFingerprint, heatmapDuration]);

  const handleVote = async ({ newCandidateIds }) => {
    if (!currentParticipantId || !poll) return;
    try {
      await submitVote(groupId, currentParticipantId, newCandidateIds);
    } catch (err) {
      addNotification({ type: 'error', title: 'Vote Error', message: err.message });
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);

      // We check duplication inside addParticipant/updateParticipant server-side logic
      // But we can still do a basic check here using participants if available
      const storedParticipants = Object.values(participants || {});
      const normalizedName = formData.name.trim().toLowerCase();
      const isDuplicate = storedParticipants.some(
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
            <span className="flex items-center gap-1.5"><Users size={16} className="text-gray-500" /> {Object.keys(participants || {}).length} people attending</span>
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
            ) : Object.keys(participants || {}).length >= MAX_PARTICIPANTS_PER_GROUP ? (
              <div className="bg-dark-900 rounded-xl border border-dark-700 p-6">
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 text-center">
                  <p className="font-bold text-rose-400 mb-1">This group is full</p>
                  <p className="text-sm text-gray-400">The maximum of {MAX_PARTICIPANTS_PER_GROUP} participants has been reached.</p>
                </div>
              </div>
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
                {(!participants || Object.keys(participants).length === 0) ? (
                  <p className="text-gray-500">Be the first to join!</p>
                ) : (
                  Object.values(participants).map((p, i) => (
                    <div key={p.id || i} className="bg-dark-800 rounded p-3 border-l-4 border-brand-500">
                      <p className="font-semibold text-gray-50">
                        <TruncatedText text={p.name || 'Anonymous'} maxWidth="100%" />
                      </p>
                      <p className="text-gray-400 text-xs">{p.duration}-day duration</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {poll && poll.status === 'active' && (
          <div className="mt-6 bg-brand-500/10 border border-brand-500/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500" />
              </span>
              <div>
                <p className="font-bold text-gray-50 text-sm">Vote on proposed dates!</p>
                <p className="text-xs text-gray-400">The organizer has opened a poll. Click a highlighted period below to vote.</p>
              </div>
            </div>
          </div>
        )}

        {poll && poll.status === 'closed' && (
          <div className="mt-6 bg-dark-800 border border-dark-700 rounded-xl p-4">
            <p className="font-semibold text-gray-300 text-sm">Poll closed — results are below.</p>
          </div>
        )}

        {(overlaps?.length > 0 || poll) && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-50 mb-4">
              {poll ? (poll.status === 'active' ? 'Vote on Proposed Dates' : 'Poll Results') : 'Current Group Availability'}
            </h2>
            <SlidingOverlapCalendar
              ref={calendarRef}
              startDate={group.startDate}
              endDate={group.endDate}
              participants={Object.values(participants || {})}
              availabilityMap={availabilityMap || {}}
              dailyCounts={dailyCounts || {}}
              duration={heatmapDuration || '3'}
              overlaps={getBestOverlapPeriods(overlaps, 10)}
              onDurationChange={poll ? undefined : setHeatmapDuration}
              singleDay={isSingleDayEvent(group?.eventType)}
              votingMode={poll ? {
                active: true,
                poll,
                currentParticipantId: currentParticipantId,
              } : undefined}
              renderSelectedAction={poll
                ? ({ candidateId, startDate, endDate }) => {
                  const candidate = poll?.candidates?.[candidateId];
                  return (
                    <div className="space-y-3">
                      <VotePanel
                        poll={poll}
                        candidateId={candidateId}
                        currentParticipantId={currentParticipantId}
                        onVote={handleVote}
                        isReadOnly={poll.status === 'closed' || !currentParticipantId}
                        participants={Object.values(participants || {})}
                        onVoteComplete={() => calendarRef.current?.clearSelection()}
                      />
                      <CalendarEventButton
                        group={group}
                        overlap={{ startDate: candidate?.startDate, endDate: candidate?.endDate, availableCount: Object.keys(participants || {}).length }}
                        participantCount={Object.keys(participants || {}).length}
                      />
                    </div>
                  );
                }
                : undefined
              }
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
