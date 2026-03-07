import React, { useState } from 'react';
import { Vote, Mail, XCircle } from 'lucide-react';
import SlidingOverlapCalendar from '../../components/SlidingOverlapCalendar';
import VotePanel from '../../components/VotePanel';
import { Button } from '../../shared/ui';
import { isSingleDayEvent } from '../../utils/eventTypes';
import { formatDateRange, getBestOverlapPeriods } from '../../utils/overlap';

/**
 * Admin view of an active or closed poll with live vote results.
 */
function VotingResults({
  group, participants, overlaps, durationFilter, onDurationChange,
  poll, adminParticipantId,
  onClosePoll, onDeletePoll, onVote, onSendInvites, onSendResult,
}) {
  const [closingPoll, setClosingPoll] = useState(false);
  const [sendingInvites, setSendingInvites] = useState(false);
  const [sendingResult, setSendingResult] = useState(false);

  if (!poll || !group) return null;

  const votes = poll.votes || {};
  const candidates = poll.candidates || {};
  const isActive = poll.status === 'active';
  const totalVoters = Object.keys(votes).length;
  const totalParticipants = participants.length;

  const handleClose = async () => {
    setClosingPoll(true);
    try { await onClosePoll(); } finally { setClosingPoll(false); }
  };

  const handleSendInvites = async () => {
    setSendingInvites(true);
    try { await onSendInvites(); } finally { setSendingInvites(false); }
  };

  const handleSendResult = async () => {
    setSendingResult(true);
    try { await onSendResult(); } finally { setSendingResult(false); }
  };

  // Find winning candidate(s)
  const voteCounts = Object.entries(candidates).map(([id, c]) => ({
    id, ...c,
    count: Object.values(votes).filter(v => v.candidateIds?.includes(id)).length,
  })).sort((a, b) => a.label - b.label);

  const maxVotes = Math.max(...voteCounts.map(v => v.count), 0);
  const winners = voteCounts.filter(v => v.count === maxVotes && maxVotes > 0);

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-50 flex items-center gap-2">
          <Vote size={20} className="text-brand-400" />
          {isActive ? 'Poll Active' : 'Poll Results'}
        </h2>
        <div className="flex items-center gap-2">
          {isActive && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          )}
          {!isActive && (
            <span className="text-xs text-gray-500 font-medium bg-dark-800 border border-dark-700 px-3 py-1 rounded-full">
              Closed
            </span>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 mb-4">
        <div className="flex gap-6 text-sm">
          <div>
            <p className="text-gray-500 mb-0.5">Voted</p>
            <p className="font-bold text-gray-50">{totalVoters} / {totalParticipants}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-0.5">Mode</p>
            <p className="font-bold text-gray-50 capitalize">{poll.mode}</p>
          </div>
          {!isActive && winners.length > 0 && (
            <div>
              <p className="text-gray-500 mb-0.5">Winner</p>
              <p className="font-bold text-brand-400">{formatDateRange(winners[0].startDate, winners[0].endDate)}</p>
            </div>
          )}
        </div>

        {/* Participation progress */}
        <div className="mt-3">
          <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 transition-all duration-500"
              style={{ width: `${totalParticipants > 0 ? (totalVoters / totalParticipants) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{totalParticipants - totalVoters} participant{totalParticipants - totalVoters !== 1 ? 's' : ''} yet to vote</p>
        </div>
      </div>

      {/* Heatmap in voting mode */}
      <SlidingOverlapCalendar
        startDate={group.startDate}
        endDate={group.endDate}
        participants={participants}
        duration={durationFilter}
        overlaps={getBestOverlapPeriods(overlaps, 10)}
        onDurationChange={onDurationChange}
        singleDay={isSingleDayEvent(group?.eventType)}
        votingMode={{
          active: true,
          poll,
          currentParticipantId: adminParticipantId,
        }}
        renderSelectedAction={({ candidateId }) =>
          adminParticipantId ? (
            <VotePanel
              poll={poll}
              candidateId={candidateId}
              currentParticipantId={adminParticipantId}
              onVote={onVote}
              isReadOnly={!isActive}
              participants={participants}
            />
          ) : null
        }
      />

      {/* Admin actions */}
      <div className="mt-4 flex flex-col gap-2">
        {isActive && (
          <>
            <Button
              variant="secondary"
              fullWidth
              onClick={handleSendInvites}
              disabled={sendingInvites || !participants.some(p => p?.email)}
              title={!participants.some(p => p?.email) ? 'No participants have email addresses' : ''}
            >
              <Mail size={16} className="inline mr-1.5" />
              {sendingInvites ? 'Sending...' : 'Send Voting Invites'}
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleClose}
              disabled={closingPoll}
            >
              <XCircle size={16} className="inline mr-1.5" />
              {closingPoll ? 'Closing...' : 'Close Poll'}
            </Button>
          </>
        )}

        {!isActive && (
          <>
            <Button
              variant="primary"
              fullWidth
              onClick={handleSendResult}
              disabled={sendingResult || !participants.some(p => p?.email)}
            >
              <Mail size={16} className="inline mr-1.5" />
              {sendingResult ? 'Sending...' : 'Send Result + Calendar Invite'}
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={onDeletePoll}
            >
              Start New Vote
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default VotingResults;
