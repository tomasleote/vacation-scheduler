import React from 'react';
import { Users } from 'lucide-react';

/**
 * Renders inside SlidingOverlapCalendar's details panel when a candidate
 * period is selected during an active poll.
 */
function VotePanel({ poll, candidateId, currentParticipantId, onVote, isReadOnly, participants = [], onVoteComplete }) {
  if (!poll || !candidateId) return null;

  const votes = poll.votes || {};
  const myVote = currentParticipantId ? votes[currentParticipantId] : null;
  const myVotedIds = myVote?.candidateIds || [];
  const hasVotedForThis = myVotedIds.includes(candidateId);

  const voterCount = Object.values(votes).filter(v =>
    v.candidateIds?.includes(candidateId)
  ).length;
  const totalVoters = Object.keys(votes).length;
  const voterPercent = totalVoters > 0 ? Math.round(voterCount / totalVoters * 100) : 0;

  const voterIds = Object.entries(votes)
    .filter(([, v]) => v.candidateIds?.includes(candidateId))
    .map(([id]) => id);

  const handleVote = async () => {
    if (!currentParticipantId || isReadOnly) return;

    let newCandidateIds;
    if (poll.mode === 'single') {
      newCandidateIds = hasVotedForThis ? [] : [candidateId];
    } else {
      newCandidateIds = hasVotedForThis
        ? myVotedIds.filter(id => id !== candidateId)
        : [...myVotedIds, candidateId];
    }

    try {
      await onVote({ candidateId, newCandidateIds });
      if (onVoteComplete) {
        onVoteComplete();
      }
    } catch (err) {
      console.error('[VotePanel] Vote error:', err);
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t border-dark-700">
      {/* Vote count bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span className="flex items-center gap-1">
            <Users size={12} /> {voterCount} of {totalVoters} voted for this
          </span>
          <span className="font-bold text-gray-300">{voterPercent}%</span>
        </div>
        <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 transition-all duration-500"
            style={{ width: `${voterPercent}%` }}
          />
        </div>
      </div>

      {/* Voter list */}
      {voterIds.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {voterIds.map((id) => {
            const participant = participants.find(p => p.id === id);
            const displayName = id === currentParticipantId
              ? 'You'
              : participant?.name || id.slice(0, 8);
            return (
              <span
                key={id}
                className="text-xs bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded-full"
              >
                {displayName}
              </span>
            );
          })}
        </div>
      )}

      {/* Vote button */}
      {!isReadOnly && currentParticipantId && (
        <button
          onClick={handleVote}
          className={`w-full py-2.5 rounded-lg font-bold transition-all duration-200 ${
            hasVotedForThis
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400'
              : 'bg-brand-500 hover:bg-brand-400 text-white'
          }`}
        >
          {hasVotedForThis
            ? (poll.mode === 'single' ? '✓ Voted — click to remove' : '✓ Voted — click to toggle')
            : 'Vote for this period'}
        </button>
      )}

      {isReadOnly && (
        <p className="text-xs text-center text-gray-500 italic">Poll is closed — results are final.</p>
      )}

      {!currentParticipantId && !isReadOnly && (
        <p className="text-xs text-center text-gray-400">Submit your availability first to vote.</p>
      )}
    </div>
  );
}

export default VotePanel;
