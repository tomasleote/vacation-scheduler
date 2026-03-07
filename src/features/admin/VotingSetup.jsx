import React, { useState, useRef } from 'react';
import { Vote, X, Play } from 'lucide-react';
import SlidingOverlapCalendar from '../../components/SlidingOverlapCalendar';
import { Button } from '../../shared/ui';
import { isSingleDayEvent } from '../../utils/eventTypes';
import { formatDateRange } from '../../utils/overlap';

/**
 * Admin UI for selecting voting candidates and starting a poll.
 */
function VotingSetup({ group, participants, overlaps, durationFilter, onDurationChange, onStartPoll, onCancel }) {
  const [candidates, setCandidates] = useState([]);
  const [mode, setMode] = useState('single');
  const [starting, setStarting] = useState(false);
  const calendarRef = useRef(null);

  const addCandidate = ({ startDate, endDate }) => {
    if (candidates.length >= 5) return;
    const already = candidates.some(c => c.startDate === startDate && c.endDate === endDate);
    if (already) return;
    setCandidates(prev => [...prev, { startDate, endDate, label: prev.length + 1 }]);
    // Auto-deselect period after adding candidate
    calendarRef.current?.clearSelection();
  };

  const removeCandidate = (idx) => {
    setCandidates(prev => {
      const next = prev.filter((_, i) => i !== idx);
      return next.map((c, i) => ({ ...c, label: i + 1 }));
    });
  };

  const handleStartPoll = async () => {
    if (candidates.length < 2) return;
    setStarting(true);
    try {
      await onStartPoll({ mode, candidates });
    } catch (err) {
      console.error('[VotingSetup] Failed to start poll:', err);
    } finally {
      setStarting(false);
    }
  };

  if (!group?.startDate || !group?.endDate) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-50 flex items-center gap-2">
          <Vote size={20} className="text-brand-400" /> Set Up Vote
        </h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-200 transition">
          <X size={20} />
        </button>
      </div>

      <div className="bg-dark-900 border border-brand-500/30 rounded-xl p-4 mb-4 text-sm text-gray-300">
        <p className="font-semibold text-brand-400 mb-1">How to select candidates:</p>
        <p>Click a date on the heatmap to highlight a period, then click <strong>"Add as Candidate"</strong>. Select 2–5 periods. Participants will vote on these options.</p>
      </div>

      {/* Candidate list */}
      {candidates.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-sm font-semibold text-gray-400">Selected candidates ({candidates.length}/5):</p>
          {candidates.map((c, i) => (
            <div key={i} className="flex items-center justify-between bg-dark-800 border border-amber-400/30 rounded-lg px-4 py-2">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-amber-400 text-dark-900 text-xs font-bold">
                  {i + 1}
                </span>
                <span className="text-gray-50 font-medium">{formatDateRange(c.startDate, c.endDate)}</span>
              </div>
              <button
                onClick={() => removeCandidate(i)}
                className="text-gray-500 hover:text-rose-400 transition"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Heatmap with Add as Candidate renderSelectedAction */}
      <SlidingOverlapCalendar
        ref={calendarRef}
        startDate={group.startDate}
        endDate={group.endDate}
        participants={participants}
        duration={durationFilter}
        overlaps={overlaps}
        onDurationChange={onDurationChange}
        singleDay={isSingleDayEvent(group?.eventType)}
        highlightedCandidates={candidates}
        renderSelectedAction={({ startDate, endDate }) => (
          <button
            onClick={() => addCandidate({ startDate, endDate })}
            disabled={
              candidates.length >= 5 ||
              candidates.some(c => c.startDate === startDate && c.endDate === endDate)
            }
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-dark-900 font-bold rounded-lg transition"
          >
            {candidates.some(c => c.startDate === startDate && c.endDate === endDate)
              ? 'Already added'
              : candidates.length >= 5
                ? 'Max 5 candidates'
                : '+ Add as Candidate'}
          </button>
        )}
      />

      {/* Poll config & start */}
      <div className="mt-4 bg-dark-900 border border-dark-700 rounded-xl p-4 space-y-4">
        <div>
          <p className="text-sm font-semibold text-gray-300 mb-2">Voting mode:</p>
          <div className="flex gap-3">
            {['single', 'multi'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${mode === m
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : 'bg-dark-800 border-dark-700 text-gray-400 hover:border-dark-600'
                  }`}
              >
                {m === 'single' ? 'Single vote' : 'Multi vote'}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {mode === 'single'
              ? 'Each participant picks one period.'
              : 'Participants can vote for multiple periods.'}
          </p>
        </div>

        <Button
          variant="primary"
          fullWidth
          onClick={handleStartPoll}
          disabled={candidates.length < 2 || starting}
        >
          <Play size={16} className="inline mr-1.5" />
          {starting ? 'Starting...' : candidates.length < 2
            ? `Add ${2 - candidates.length} more candidate${2 - candidates.length !== 1 ? 's' : ''} to start`
            : 'Start Poll'}
        </Button>
      </div>
    </div>
  );
}

export default VotingSetup;
