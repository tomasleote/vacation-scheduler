import React, { useState, useEffect } from 'react';
import { getGroup, addParticipant, updateParticipant, getParticipants, getParticipant } from '../firebase';
import { getDatesBetween } from '../utils/overlap';

import CalendarView from './CalendarView';
import { ChevronDown, ChevronUp } from 'lucide-react';

function ParticipantView({ groupId, participantId: initialParticipantId, onBack }) {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [expandedSection, setExpandedSection] = useState('form');
  const [currentParticipantId, setCurrentParticipantId] = useState(null);
  const [savedDays, setSavedDays] = useState([]);
  const [participantName, setParticipantName] = useState('');
  const [participantEmail, setParticipantEmail] = useState('');
  const [participantDuration, setParticipantDuration] = useState('3');

  useEffect(() => {
    fetchData();
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
        }
      } catch { }
    };
    restore();
  }, [groupId, initialParticipantId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const groupData = await getGroup(groupId);
      const participantsData = await getParticipants(groupId);

      if (!groupData) {
        setError('Group not found');
        return;
      }

      setGroup(groupData);
      setParticipants(participantsData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      setError('');

      const normalizedName = formData.name.trim().toLowerCase();
      const isDuplicate = participants.some(
        p => p.name.trim().toLowerCase() === normalizedName && p.id !== currentParticipantId
      );
      if (isDuplicate) {
        setError('A participant with this name already exists. Please choose another name.');
        return;
      }

      const newDays = formData.selectedDays || [];
      const mergedDays = newDays.length > 0
        ? Array.from(new Set([...savedDays, ...newDays]))
        : savedDays;

      if (!currentParticipantId) {
        const participantId = await addParticipant(groupId, {
          name: formData.name,
          email: formData.email,
          duration: formData.duration,
          availableDays: mergedDays,
          blockType: formData.blockType
        });
        setCurrentParticipantId(participantId);
        setParticipantName(formData.name);
        setParticipantEmail(formData.email || '');
        setParticipantDuration(String(formData.duration));

        try {
          localStorage.setItem(
            `vacation_p_${groupId}`,
            JSON.stringify({ participantId, name: formData.name })
          );
        } catch { }

        window.history.replaceState({}, '', `?group=${groupId}&p=${participantId}`);
      } else {
        await updateParticipant(groupId, currentParticipantId, {
          name: formData.name,
          email: formData.email,
          availableDays: mergedDays,
          duration: formData.duration,
          blockType: formData.blockType
        });
        setParticipantName(formData.name);
        setParticipantEmail(formData.email || '');
        setParticipantDuration(String(formData.duration));
      }

      setSavedDays(mergedDays);
      setSubmitted(true);
      await fetchData();
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <p className="text-red-600 mb-4">{error || 'Group not found'}</p>
          <button
            onClick={onBack}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const dateRange = getDatesBetween(group.startDate, group.endDate);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="text-indigo-600 hover:text-indigo-700 font-semibold mb-8"
        >
          ← Back to Home
        </button>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{group.name}</h1>
          {group.description && (
            <p className="text-gray-600 mb-4 italic">{group.description}</p>
          )}
          <p className="text-gray-600 mb-4">Select your available dates for the vacation</p>
          <div className="flex gap-4 text-sm text-gray-600 flex-wrap">
            <span>📅 {group.startDate} to {group.endDate}</span>
            <span>👥 {participants.length} people attending</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {submitted && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            ✓ Your response has been recorded. Thank you!
          </div>
        )}

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
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Select Your Availability</h2>
                <CalendarView
                  startDate={group.startDate}
                  endDate={group.endDate}
                  onSubmit={handleSubmit}
                  savedDays={savedDays}
                />
              </div>
            )}
          </div>

          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Participants</h3>
              <div className="space-y-2 text-sm max-h-96 overflow-y-auto">
                {participants.length === 0 ? (
                  <p className="text-gray-500">Be the first to join!</p>
                ) : (
                  participants.map((p, i) => (
                    <div key={i} className="bg-indigo-50 rounded p-3 border-l-4 border-indigo-500">
                      <p className="font-semibold text-gray-800">{p.name || 'Anonymous'}</p>
                      <p className="text-gray-600 text-xs">{p.duration}-day trip</p>
                      <p className="text-gray-500 text-xs">{(p.availableDays || []).length} days available</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ParticipantDashboard({ groupId, participantId, participantName, participantEmail, participantDuration, savedDays, group, onSubmit }) {
  const baseUrl = window.location.origin;
  const personalLink = `${baseUrl}?group=${groupId}&p=${participantId}`;
  const [copied, setCopied] = useState(false);
  const [updating, setUpdating] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(personalLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-1">Hi, {participantName}!</h2>
        <p className="text-gray-500 text-sm mb-4">Your availability is saved.</p>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Your personal link — save to edit later:
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={personalLink}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
            />
            <button
              onClick={copy}
              className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <button
          onClick={() => setUpdating(u => !u)}
          className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold"
        >
          {updating ? '\u2191 Hide update form' : '\u270F Update your dates'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-base font-bold text-gray-700 mb-1">Your selected dates</h3>
        <p className="text-gray-400 text-xs mb-3">Changing your name, email, or duration below will update your info when you submit.</p>
        <CalendarView
          startDate={group.startDate}
          endDate={group.endDate}
          onSubmit={onSubmit}
          savedDays={savedDays}
          initialName={participantName}
          initialEmail={participantEmail}
          initialDuration={participantDuration}
        />
      </div>
    </div>
  );
}

export default ParticipantView;
