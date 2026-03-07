# Voting System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a heatmap-integrated voting phase so the admin can create a poll from candidate date ranges and participants vote directly on the heatmap with live real-time results.

**Architecture:** Poll data lives under `groups/{groupId}/poll/` in Firebase RTDB. The existing `SlidingOverlapCalendar` gains a `votingMode` prop that switches its interaction model — candidate periods become the only interactive zones, everything else fades out. The admin selects candidates via the existing locked-selection mechanism, then starts a poll; participants vote through a `VotePanel` that renders inside the existing details panel.

**Tech Stack:** React 18, Firebase RTDB v10 (modular SDK), Tailwind CSS, Vercel Serverless Functions (CommonJS), Nodemailer for email.

**Design doc:** `docs/plans/2026-03-07-voting-system-design.md`

---

## Task 1: Firebase Rules — Add poll node

**Files:**
- Modify: `database.rules.json`

**Step 1: Add `poll` rules under `$groupId`**

Open `database.rules.json`. Inside the `"$groupId"` block (after the `"participants"` block, before the closing `}`), add:

```json
"poll": {
  ".read": true,
  ".write": "data.parent().child('adminToken').val() === newData.parent().child('adminToken').val() || newData.parent().child('adminToken').val() === null",
  "status": {
    ".validate": "newData.isString() && (newData.val() === 'active' || newData.val() === 'closed')"
  },
  "mode": {
    ".validate": "newData.isString() && (newData.val() === 'single' || newData.val() === 'multi')"
  },
  "candidates": {
    "$candidateId": {
      "startDate": { ".validate": "newData.isString()" },
      "endDate": { ".validate": "newData.isString()" },
      "label": { ".validate": "newData.isNumber()" }
    }
  },
  "votes": {
    "$participantId": {
      ".write": true,
      "candidateIds": { ".validate": "newData.hasChildren() || !newData.exists()" },
      "votedAt": { ".validate": "newData.isString() || !newData.exists()" }
    }
  }
}
```

**Step 2: Verify JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('database.rules.json', 'utf8')); console.log('valid')"`

Expected: `valid`

**Step 3: Commit**

```bash
git add database.rules.json
git commit -m "feat(voting): add Firebase rules for poll node"
```

---

## Task 2: Poll Service — Firebase CRUD

**Files:**
- Create: `src/services/pollService.js`

**Step 1: Create the service**

```js
import { ref, set, remove, onValue } from 'firebase/database';
import { database } from './firebaseConfig';

/**
 * Creates a new poll under groups/{groupId}/poll.
 * Overwrites any existing poll (one at a time enforced by data structure).
 *
 * @param {string} groupId
 * @param {{ mode: 'single'|'multi', candidates: Array<{startDate:string, endDate:string}> }} options
 * @returns {Promise<string>} pollId
 */
export const createPoll = async (groupId, { mode, candidates }) => {
  const pollId = crypto.randomUUID();

  const candidatesObj = {};
  candidates.forEach((c, i) => {
    const id = crypto.randomUUID();
    candidatesObj[id] = {
      startDate: c.startDate,
      endDate: c.endDate,
      label: i + 1,
    };
  });

  await set(ref(database, `groups/${groupId}/poll`), {
    id: pollId,
    status: 'active',
    mode,
    createdAt: new Date().toISOString(),
    closedAt: null,
    candidates: candidatesObj,
    votes: null, // Firebase omits null; votes node created on first vote
  });

  return pollId;
};

/**
 * Marks the poll as closed.
 */
export const closePoll = async (groupId) => {
  await set(ref(database, `groups/${groupId}/poll/status`), 'closed');
  await set(ref(database, `groups/${groupId}/poll/closedAt`), new Date().toISOString());
};

/**
 * Deletes the entire poll node (admin cancel).
 */
export const deletePoll = async (groupId) => {
  await remove(ref(database, `groups/${groupId}/poll`));
};

/**
 * Writes or overwrites a participant's vote.
 * In single mode, candidateIds has one entry.
 * In multi mode, candidateIds can have multiple entries.
 * To remove all votes, pass candidateIds = [].
 * Note: Firebase does not allow empty arrays; pass null to clear.
 *
 * @param {string} groupId
 * @param {string} participantId
 * @param {string[]} candidateIds
 */
export const submitVote = async (groupId, participantId, candidateIds) => {
  const voteRef = ref(database, `groups/${groupId}/poll/votes/${participantId}`);
  if (candidateIds.length === 0) {
    await remove(voteRef);
  } else {
    await set(voteRef, {
      candidateIds,
      votedAt: new Date().toISOString(),
    });
  }
};

/**
 * Subscribes to real-time poll updates.
 *
 * @param {string} groupId
 * @param {function} callback - called with poll object or null
 * @param {function} [onError]
 * @returns {function} unsubscribe
 */
export const subscribeToPoll = (groupId, callback, onError) => {
  const pollRef = ref(database, `groups/${groupId}/poll`);
  return onValue(
    pollRef,
    (snapshot) => callback(snapshot.exists() ? snapshot.val() : null),
    (err) => {
      console.error('[pollService] subscribeToPoll error:', err);
      if (onError) onError(err);
    }
  );
};
```

**Step 2: Verify file is syntactically correct**

Run: `node --input-type=module < src/services/pollService.js 2>&1 | head -5`

If there's a module import error about firebase that's expected (no bundler); no syntax errors is what we want.

**Step 3: Commit**

```bash
git add src/services/pollService.js
git commit -m "feat(voting): add pollService for Firebase poll CRUD"
```

---

## Task 3: Spotlight Effect in SlidingOverlapCalendar

This is a standalone improvement: when a block is hovered/locked, all other in-range dates fade to draw focus to the active period.

**Files:**
- Modify: `src/components/SlidingOverlapCalendar.js`

**Step 1: Add spotlight CSS class to non-highlighted dates**

Find the day button's `className` template literal (around line 270). It currently has:

```js
${inRange && !isHighlighted ? getHeatmapColor(count, maxParts) : ''}
```

Add the spotlight fade line directly after (still inside the template literal):

```js
${activeBlock.length > 0 && inRange && !isHighlighted ? 'opacity-30' : ''}
```

Full updated className block (replace existing `className={` expression):

```jsx
className={`
  w-full h-full rounded-lg transition-all duration-200 flex flex-col items-center justify-center gap-1
  ${!inRange ? 'text-gray-600 cursor-not-allowed opacity-50' : 'cursor-pointer hover:ring-2 hover:ring-brand-400 hover:ring-offset-1 hover:ring-offset-dark-800'}
  ${isHighlighted ? 'ring-2 ring-brand-500 shadow-md transform scale-[1.02] z-10' : ''}
  ${inRange && !isHighlighted ? getHeatmapColor(count, maxParts) : ''}
  ${activeBlock.length > 0 && inRange && !isHighlighted ? 'opacity-30' : ''}
  ${isHighlighted ? 'bg-brand-500 text-white font-bold' : ''}
`}
```

**Step 2: Test manually**

Start the app: `npm start`

1. Open any group with participants
2. Hover over a date on the heatmap
3. Confirm the hovered block is bright; all other dates fade to ~30% opacity
4. Move mouse away — all dates return to full opacity

**Step 3: Commit**

```bash
git add src/components/SlidingOverlapCalendar.js
git commit -m "feat(calendar): add spotlight fade effect on period hover/selection"
```

---

## Task 4: SlidingOverlapCalendar — Voting Mode Support

This is the largest change. Adds `votingMode` and `highlightedCandidates` props.

**Files:**
- Modify: `src/components/SlidingOverlapCalendar.js`

### Step 1: Update function signature

Change line 27 from:
```js
function SlidingOverlapCalendar({ startDate, endDate, participants, duration, overlaps, onDurationChange, singleDay = false, renderSelectedAction }) {
```
To:
```js
function SlidingOverlapCalendar({ startDate, endDate, participants, duration, overlaps, onDurationChange, singleDay = false, renderSelectedAction, votingMode, highlightedCandidates }) {
```

### Step 2: Add new state variables

After the existing state declarations (after line 33 `const [debouncedDuration, ...`), add:

```js
const [selectedCandidateId, setSelectedCandidateId] = useState(null);
const [hoveredCandidateId, setHoveredCandidateId] = useState(null);
```

### Step 3: Add candidateDateMap memo

After the `dailyAvailability` useMemo (after line 75), add:

```js
// Maps each date string to its candidateId when voting is active
const candidateDateMap = useMemo(() => {
  if (!votingMode?.active || !votingMode.poll?.candidates) return {};
  const map = {};
  Object.entries(votingMode.poll.candidates).forEach(([id, c]) => {
    getDatesBetween(c.startDate, c.endDate).forEach(d => { map[d] = id; });
  });
  return map;
}, [votingMode]);

// Ordered array of candidates for display (sorted by label)
const orderedCandidates = useMemo(() => {
  if (!votingMode?.active || !votingMode.poll?.candidates) return [];
  return Object.entries(votingMode.poll.candidates)
    .map(([id, c]) => ({ id, ...c }))
    .sort((a, b) => a.label - b.label);
}, [votingMode]);
```

### Step 4: Replace activeBlock computation

Find line 126: `const activeBlock = getHighlightBlock(lockedDate || hoveredDate);`

Replace it with:

```js
const activeCandidateId = votingMode?.active
  ? (selectedCandidateId || hoveredCandidateId)
  : null;

const activeBlock = (() => {
  if (votingMode?.active && activeCandidateId) {
    const candidate = votingMode.poll?.candidates?.[activeCandidateId];
    return candidate ? getDatesBetween(candidate.startDate, candidate.endDate) : [];
  }
  return getHighlightBlock(lockedDate || hoveredDate);
})();

// Unified "is something locked" across both modes
const isLocked = votingMode?.active ? Boolean(selectedCandidateId) : Boolean(lockedDate);

const clearSelection = () => {
  if (votingMode?.active) {
    setSelectedCandidateId(null);
  } else {
    setLockedDate(null);
  }
};
```

### Step 5: Replace handleDayClick

Replace the existing `handleDayClick` function (lines 128–139) with:

```js
const handleDayClick = (dateStr) => {
  if (votingMode?.active) {
    const cid = candidateDateMap[dateStr];
    if (!cid) return;
    if (selectedCandidateId === cid) {
      setSelectedCandidateId(null); // toggle off
    } else {
      setSelectedCandidateId(cid);
      setHoveredCandidateId(null);
    }
    return;
  }

  // Original logic
  if (!isDateInRange(dateStr)) return;
  const block = getHighlightBlock(dateStr);
  if (block.length < parseInt(duration)) return;
  if (lockedDate === dateStr) {
    setLockedDate(null);
  } else {
    setLockedDate(dateStr);
  }
};
```

### Step 6: Update getBlockDetails to work in voting mode

Find `getBlockDetails` (around line 154). Change the `reqDuration` line:

```js
const getBlockDetails = () => {
  if (activeBlock.length === 0) return null;
  // In voting mode the candidate defines its own duration
  const reqDuration = votingMode?.active ? activeBlock.length : parseInt(duration);
  // ... rest unchanged
```

### Step 7: Update the duration input to hide in voting mode

Find the duration input section (around line 187). Wrap it:

```jsx
{!votingMode?.active && onDurationChange && !singleDay ? (
  // existing duration input JSX
) : !votingMode?.active ? (
  // existing read-only duration display
) : null}
```

### Step 8: Update day cell hover handlers

Find the day button's `onMouseEnter` and `onMouseLeave` (lines 266–267). Replace:

```jsx
onMouseEnter={() => {
  if (votingMode?.active) {
    const cid = candidateDateMap[dateStr];
    if (cid && !selectedCandidateId) setHoveredCandidateId(cid);
    return;
  }
  inRange && wouldBeValidBlock && !lockedDate && setHoveredDate(dateStr);
}}
onMouseLeave={() => {
  if (votingMode?.active) {
    if (!selectedCandidateId) setHoveredCandidateId(null);
    return;
  }
  !lockedDate && setHoveredDate(null);
}}
```

### Step 9: Update day cell disabled and cursor logic

The `disabled` prop (line 269) — in voting mode, a date is disabled if it's not in any candidate:

```jsx
disabled={
  votingMode?.active
    ? !candidateDateMap[dateStr]
    : (!inRange || !wouldBeValidBlock)
}
```

And the `!inRange` class condition — replace `!inRange` with `effectivelyDisabled`:

Add before the `return (` of the day map:

```js
const effectivelyDisabled = votingMode?.active
  ? !candidateDateMap[dateStr]
  : (!inRange || !wouldBeValidBlock);
```

Then in `className`, replace `!inRange` with `effectivelyDisabled`:

```jsx
${effectivelyDisabled ? 'text-gray-600 cursor-not-allowed opacity-20' : 'cursor-pointer hover:ring-2 hover:ring-brand-400 hover:ring-offset-1 hover:ring-offset-dark-800'}
```

And the spotlight condition becomes:

```jsx
${activeBlock.length > 0 && !effectivelyDisabled && !isHighlighted ? 'opacity-30' : ''}
```

### Step 10: Add candidate labels and vote checkmarks to day cells

Inside the day button (after the count `<span>`), add:

```jsx
{/* Candidate number label — voting mode active */}
{votingMode?.active && (() => {
  const cid = candidateDateMap[dateStr];
  if (!cid) return null;
  const candidate = votingMode.poll?.candidates?.[cid];
  if (!candidate || candidate.startDate !== dateStr) return null;
  return (
    <span className="absolute top-0.5 left-0.5 w-4 h-4 flex items-center justify-center rounded-full bg-brand-500 text-white text-[9px] font-bold z-20">
      {candidate.label}
    </span>
  );
})()}

{/* Candidate number label — admin setup mode (highlightedCandidates) */}
{!votingMode?.active && highlightedCandidates && (() => {
  const idx = highlightedCandidates.findIndex(c => c.startDate === dateStr);
  if (idx < 0) return null;
  return (
    <span className="absolute top-0.5 left-0.5 w-4 h-4 flex items-center justify-center rounded-full bg-amber-400 text-dark-900 text-[9px] font-bold z-20">
      {idx + 1}
    </span>
  );
})()}

{/* Vote checkmark */}
{votingMode?.active && (() => {
  const cids = candidateDateMap[dateStr];
  if (!cids || !Array.isArray(cids) || cids.length === 0) return null;
  const myVote = votingMode.poll?.votes?.[votingMode.currentParticipantId];
  if (!myVote?.candidateIds) return null;
  const votedCids = cids.filter(cid => {
    const candidate = votingMode.poll?.candidates?.[cid];
    return candidate && candidate.startDate === dateStr && myVote.candidateIds.includes(cid);
  });
  if (votedCids.length === 0) return null;
  return (
    <div className="absolute top-0.5 right-0.5 flex gap-0.5 z-20">
      {votedCids.map(cid => (
        <span key={cid} className="text-emerald-400 text-[10px] font-bold">✓</span>
      ))}
    </div>
  );
})()}
```

Also wrap the outer `<div className="relative aspect-square">` to support absolute positioning (it already has `relative`, so this is fine).

### Step 11: Add highlighted candidate ring for admin setup mode

In the className block, add (before the spotlight line):

```jsx
${!votingMode?.active && highlightedCandidates?.some(c => getDatesBetween(c.startDate, c.endDate).includes(dateStr)) && !isHighlighted
  ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-dark-800'
  : ''}
```

### Step 12: Update the locked-state action area

Find the block around line 385–399 (the `lockedDate &&` block). Replace with:

```jsx
{isLocked && (
  <div className="pt-4 mt-auto border-t border-dark-700 space-y-3">
    {renderSelectedAction && renderSelectedAction({
      startDate: blockDetails.start,
      endDate: blockDetails.end,
      availableCount: blockDetails.available.length,
      candidateId: activeCandidateId,
    })}
    <button
      onClick={clearSelection}
      className="w-full py-2.5 bg-dark-800 hover:bg-dark-700 text-gray-300 font-bold rounded-lg border border-dark-700 transition"
    >
      {votingMode?.active ? 'Deselect Period' : 'Clear Selection'}
    </button>
  </div>
)}

{!isLocked && (
  <div className="pt-4 mt-auto">
    <p className="text-xs text-center text-gray-500 font-medium">
      {votingMode?.active
        ? 'Click a highlighted period to vote.'
        : 'Click on a date to lock this selection.'}
    </p>
  </div>
)}
```

### Step 13: Replace Top Overlaps panel with Candidates list in voting mode

Find the `State 2: No block is highlighted, show Top Rankings` section (line ~408).

Replace the entire right panel idle state with:

```jsx
) : (
  <div className="h-full flex flex-col">
    {votingMode?.active ? (
      /* Voting mode: show candidates list */
      <>
        <h4 className="flex items-center gap-2 text-lg font-bold text-gray-50 mb-6 pb-4 border-b border-dark-700">
          <Vote size={20} className="text-brand-400" />
          {votingMode.poll?.status === 'closed' ? 'Poll Results' : 'Vote on a Period'}
        </h4>
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {orderedCandidates.map((candidate) => {
            const votes = votingMode.poll?.votes || {};
            const voteCount = Object.values(votes).filter(v =>
              v.candidateIds?.includes(candidate.id)
            ).length;
            const totalVoters = Object.keys(votes).length;
            const myVote = votes[votingMode.currentParticipantId];
            const hasVoted = myVote?.candidateIds?.includes(candidate.id);
            const isWinner = votingMode.poll?.status === 'closed' && voteCount === Math.max(
              ...Object.entries(votingMode.poll.candidates).map(([id]) =>
                Object.values(votes).filter(v => v.candidateIds?.includes(id)).length
              )
            ) && voteCount > 0;

            return (
              <button
                key={candidate.id}
                onClick={() => {
                  const range = getDatesBetween(candidate.startDate, candidate.endDate);
                  const month = new Date(candidate.startDate);
                  setCurrentMonth(month.getMonth());
                  setCurrentYear(month.getFullYear());
                  setSelectedCandidateId(candidate.id);
                }}
                className={`w-full text-left rounded-xl p-4 transition-all duration-200 border ${
                  isWinner
                    ? 'border-2 border-brand-500/70 bg-brand-500/10'
                    : hasVoted
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-dark-700 bg-dark-800 hover:border-dark-600'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      isWinner ? 'bg-brand-500 text-white' : 'bg-dark-700 text-gray-300'
                    }`}>
                      {candidate.label}
                    </span>
                    <span className="font-bold text-gray-50 text-sm">
                      {formatDateRange(candidate.startDate, candidate.endDate)}
                    </span>
                  </div>
                  {hasVoted && <span className="text-emerald-400 text-xs font-bold">✓ Voted</span>}
                  {isWinner && <span className="text-brand-400 text-xs font-bold">Winner</span>}
                </div>
                <div className="ml-8">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{voteCount} vote{voteCount !== 1 ? 's' : ''}</span>
                    <span>{totalVoters > 0 ? Math.round(voteCount / totalVoters * 100) : 0}%</span>
                  </div>
                  <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 transition-all duration-500"
                      style={{ width: `${totalVoters > 0 ? (voteCount / totalVoters) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
          {orderedCandidates.length === 0 && (
            <p className="text-sm text-gray-500 text-center">No candidates yet.</p>
          )}
        </div>
      </>
    ) : (
      /* Normal mode: existing Top Overlaps list */
      <div className="h-full flex flex-col">
        <h4 className="flex items-center gap-2 text-lg font-bold text-gray-50 mb-6 pb-4 border-b border-dark-700">
          <TrendingUp size={20} className="text-brand-400" />
          {singleDay ? 'Top Overlap Dates' : 'Top Overlap Periods'}
        </h4>
        {/* ...existing overlaps rendering unchanged... */}
      </div>
    )}
  </div>
)}
```

Note: add `Vote` to the lucide-react imports at line 2:
```js
import { Calendar as CalendarIcon, Users, Edit2, Play, ChevronLeft, ChevronRight, XIcon, PartyPopper, UserX, TrendingUp, Vote } from 'lucide-react';
```

**Step 14: Test manually**

1. Verify normal heatmap still works (no votingMode prop passed)
2. Pass a mock `votingMode` in browser console or create a test scenario

**Step 15: Commit**

```bash
git add src/components/SlidingOverlapCalendar.js
git commit -m "feat(calendar): add votingMode and highlightedCandidates props, spotlight effect"
```

---

## Task 5: VotePanel Component

Renders inside the heatmap details panel when a candidate period is selected during voting.

**Files:**
- Create: `src/components/VotePanel.jsx`

**Step 1: Create VotePanel**

```jsx
import React from 'react';
import { Users } from 'lucide-react';

/**
 * Renders inside SlidingOverlapCalendar's details panel when a candidate
 * period is selected during an active poll.
 *
 * @param {Object} props
 * @param {Object} props.poll - Full poll object from Firebase
 * @param {string} props.candidateId - The selected candidate's ID
 * @param {string|null} props.currentParticipantId - The viewer's participantId (null if not a participant)
 * @param {function} props.onVote - Called with { candidateId, newCandidateIds }
 * @param {boolean} props.isReadOnly - True when poll is closed
 */
function VotePanel({ poll, candidateId, currentParticipantId, onVote, isReadOnly }) {
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

  // Names of voters for this candidate (from votes keys matched to participants)
  const voterIds = Object.entries(votes)
    .filter(([, v]) => v.candidateIds?.includes(candidateId))
    .map(([id]) => id);

  const handleVote = () => {
    if (!currentParticipantId || isReadOnly) return;

    let newCandidateIds;
    if (poll.mode === 'single') {
      // Replace any existing vote with this one
      newCandidateIds = hasVotedForThis ? [] : [candidateId];
    } else {
      // Toggle this candidate in multi-vote
      newCandidateIds = hasVotedForThis
        ? myVotedIds.filter(id => id !== candidateId)
        : [...myVotedIds, candidateId];
    }

    onVote({ candidateId, newCandidateIds });
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
          {voterIds.map((id) => (
            <span
              key={id}
              className="text-xs bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded-full"
            >
              {id === currentParticipantId ? 'You' : id.slice(0, 6)}
            </span>
          ))}
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
```

Note: voterIds will be participantIds. In a future improvement, these can be matched to participant names via the `participants` prop. For now, showing truncated IDs and "You" is sufficient.

**Step 2: Commit**

```bash
git add src/components/VotePanel.jsx
git commit -m "feat(voting): add VotePanel component for heatmap details panel"
```

---

## Task 6: VotingSetup Admin Component

Allows the admin to select candidate periods and start a poll.

**Files:**
- Create: `src/features/admin/VotingSetup.jsx`

**Step 1: Create VotingSetup**

```jsx
import React, { useState } from 'react';
import { Vote, X, Play } from 'lucide-react';
import SlidingOverlapCalendar from '../../components/SlidingOverlapCalendar';
import { Button } from '../../shared/ui';
import { isSingleDayEvent } from '../../utils/eventTypes';
import { formatDateRange } from '../../utils/overlap';

/**
 * Admin UI for selecting voting candidates and starting a poll.
 *
 * @param {Object} props
 * @param {Object} props.group
 * @param {Array} props.participants
 * @param {Array} props.overlaps
 * @param {string} props.durationFilter
 * @param {function} props.onDurationChange
 * @param {function} props.onStartPoll - called with { mode, candidates }
 * @param {function} props.onCancel
 */
function VotingSetup({ group, participants, overlaps, durationFilter, onDurationChange, onStartPoll, onCancel }) {
  const [candidates, setCandidates] = useState([]); // [{ startDate, endDate, label }]
  const [mode, setMode] = useState('single');
  const [starting, setStarting] = useState(false);

  const addCandidate = ({ startDate, endDate }) => {
    if (candidates.length >= 5) return;
    const already = candidates.some(c => c.startDate === startDate && c.endDate === endDate);
    if (already) return;
    setCandidates(prev => [...prev, { startDate, endDate, label: prev.length + 1 }]);
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
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
                  mode === m
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
```

**Step 2: Commit**

```bash
git add src/features/admin/VotingSetup.jsx
git commit -m "feat(voting): add VotingSetup admin component"
```

---

## Task 7: VotingResults Admin Component

Shows live vote tallies and admin actions (close, notify, confirm winner).

**Files:**
- Create: `src/features/admin/VotingResults.jsx`

**Step 1: Create VotingResults**

```jsx
import React, { useState } from 'react';
import { Vote, Mail, CheckCircle, XCircle } from 'lucide-react';
import SlidingOverlapCalendar from '../../components/SlidingOverlapCalendar';
import VotePanel from '../../components/VotePanel';
import { Button } from '../../shared/ui';
import { isSingleDayEvent } from '../../utils/eventTypes';
import { formatDateRange, getBestOverlapPeriods } from '../../utils/overlap';

/**
 * Admin view of an active or closed poll with live vote results.
 *
 * @param {Object} props
 * @param {Object} props.group
 * @param {Array} props.participants
 * @param {Array} props.overlaps
 * @param {string} props.durationFilter
 * @param {function} props.onDurationChange
 * @param {Object} props.poll - Full poll object from Firebase
 * @param {string|null} props.adminParticipantId - If admin is a participant, their ID
 * @param {function} props.onClosePoll
 * @param {function} props.onDeletePoll - Cancel/reset the poll
 * @param {function} props.onVote
 * @param {function} props.onSendInvites
 * @param {function} props.onSendResult
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
  })).sort((a, b) => b.label - a.label); // keep label order for display

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
```

**Step 2: Commit**

```bash
git add src/features/admin/VotingResults.jsx
git commit -m "feat(voting): add VotingResults admin component with live tallies"
```

---

## Task 8: Wire Up Admin Page

**Files:**
- Modify: `src/features/admin/hooks/useGroupData.js`
- Modify: `src/features/admin/AdminPage.jsx`

### Step 1: Add poll subscription to useGroupData

In `useGroupData.js`, add `poll` state and subscription:

After the `const [adminDuration, setAdminDuration] = useState('3');` line, add:

```js
const [poll, setPoll] = useState(null);
```

In the `initAdmin` async function, after the two `unsubGroup` / `unsubParts` assignments and before the `};` closing of `initAdmin`, add:

```js
const { subscribeToPoll } = require('../../../services/pollService');
let unsubPoll = () => {};
unsubPoll = subscribeToPoll(groupId, (pollData) => {
  if (!isMounted) return;
  setPoll(pollData);
}, (err) => {
  console.error('[useGroupData] poll subscription error:', err);
});
```

In the cleanup `return () => {` block, add:
```js
unsubPoll();
```

Add `poll` and `setPoll` to the returned object:
```js
return {
  // ...existing...
  poll, setPoll,
};
```

### Step 2: Wire up AdminPage

In `AdminPage.jsx`:

**Add imports at top:**
```js
import { useState, useCallback } from 'react'; // already imported
import { createPoll, closePoll, deletePoll, submitVote } from '../../services/pollService';
import VotingSetup from './VotingSetup';
import VotingResults from './VotingResults';
import { apiCall } from '../../services/apiService'; // already imported
```

**Add new state after existing state:**
```js
const [showVotingSetup, setShowVotingSetup] = useState(false);
```

**Destructure poll from useGroupData:**
```js
const {
  // ...existing...
  poll, setPoll,
} = useGroupData(groupId, adminToken, onBack);
```

**Add handlers:**
```js
const handleStartPoll = useCallback(async ({ mode, candidates }) => {
  try {
    await createPoll(groupId, { mode, candidates });
    setShowVotingSetup(false);
    addNotification({ type: 'success', title: 'Poll Started', message: 'Participants can now vote.' });
  } catch (err) {
    addNotification({ type: 'error', title: 'Error', message: err.message });
  }
}, [groupId, addNotification]);

const handleClosePoll = useCallback(async () => {
  try {
    await closePoll(groupId);
    addNotification({ type: 'success', title: 'Poll Closed', message: 'Results are now final.' });
  } catch (err) {
    addNotification({ type: 'error', title: 'Error', message: err.message });
  }
}, [groupId, addNotification]);

const handleDeletePoll = useCallback(async () => {
  try {
    await deletePoll(groupId);
    setPoll(null);
    addNotification({ type: 'success', title: 'Poll Removed', message: 'You can start a new vote.' });
  } catch (err) {
    addNotification({ type: 'error', title: 'Error', message: err.message });
  }
}, [groupId, setPoll, addNotification]);

const handleAdminVote = useCallback(async ({ newCandidateIds }) => {
  if (!adminParticipantId) return;
  try {
    await submitVote(groupId, adminParticipantId, newCandidateIds);
  } catch (err) {
    addNotification({ type: 'error', title: 'Vote Error', message: err.message });
  }
}, [groupId, adminParticipantId, addNotification]);

const handleSendVoteInvites = useCallback(async () => {
  try {
    await apiCall('/api/send-vote-invite', {
      method: 'POST',
      body: JSON.stringify({
        groupId,
        groupName: group.name,
        participants: participants.filter(p => p?.email).map(p => ({ email: p.email, id: p.id })),
        baseUrl: window.location.origin,
      }),
    });
    addNotification({ type: 'success', title: 'Invites Sent', message: 'Voting invites delivered.' });
  } catch (err) {
    addNotification({ type: 'error', title: 'Error', message: err.message });
  }
}, [groupId, group, participants, addNotification]);

const handleSendVoteResult = useCallback(async () => {
  try {
    const votes = poll?.votes || {};
    const candidates = poll?.candidates || {};
    const voteCounts = Object.entries(candidates).map(([id, c]) => ({
      ...c,
      count: Object.values(votes).filter(v => v.candidateIds?.includes(id)).length,
    }));
    const winner = voteCounts.sort((a, b) => b.count - a.count)[0];

    await apiCall('/api/send-vote-result', {
      method: 'POST',
      body: JSON.stringify({
        groupId,
        groupName: group.name,
        winnerStartDate: winner?.startDate,
        winnerEndDate: winner?.endDate,
        participants: participants.filter(p => p?.email).map(p => ({ email: p.email })),
        baseUrl: window.location.origin,
      }),
    });
    addNotification({ type: 'success', title: 'Result Sent', message: 'Calendar invites delivered.' });
  } catch (err) {
    addNotification({ type: 'error', title: 'Error', message: err.message });
  }
}, [groupId, group, participants, poll, addNotification]);
```

**Add "Start Vote" button to the Actions panel:**

In the Actions `<div className="space-y-2">`, add after Export CSV and before Send Reminder:
```jsx
<Button
  variant="secondary"
  fullWidth
  onClick={() => setShowVotingSetup(true)}
  disabled={!!poll || showVotingSetup || !overlaps?.length}
  title={poll ? 'A poll is already active' : !overlaps?.length ? 'No overlap data yet' : ''}
>
  <Vote size={16} className="inline mr-1.5" /> Start Vote
</Button>
```

Add `Vote` to lucide-react imports: `import { Download, Mail, Vote } from 'lucide-react';`

**Replace `<OverlapResults />` with conditional rendering:**

Where `<OverlapResults ... />` is rendered in AdminPage, replace with:

```jsx
{showVotingSetup && !poll ? (
  <VotingSetup
    group={group}
    participants={participants}
    overlaps={overlaps}
    durationFilter={durationFilter}
    onDurationChange={setDurationFilter}
    onStartPoll={handleStartPoll}
    onCancel={() => setShowVotingSetup(false)}
  />
) : poll ? (
  <VotingResults
    group={group}
    participants={participants}
    overlaps={overlaps}
    durationFilter={durationFilter}
    onDurationChange={setDurationFilter}
    poll={poll}
    adminParticipantId={adminParticipantId}
    onClosePoll={handleClosePoll}
    onDeletePoll={handleDeletePoll}
    onVote={handleAdminVote}
    onSendInvites={handleSendVoteInvites}
    onSendResult={handleSendVoteResult}
  />
) : (
  <OverlapResults
    group={group}
    participants={participants}
    overlaps={overlaps}
    durationFilter={durationFilter}
    onDurationChange={setDurationFilter}
  />
)}
```

**Step 3: Test manually**

1. Open admin page, confirm "Start Vote" button appears in Actions
2. Click "Start Vote" → VotingSetup renders with heatmap
3. Select 2+ candidates via the heatmap → candidates appear in list
4. Click "Start Poll" → poll appears in Firebase, VotingResults renders
5. Click "Close Poll" → poll status changes to 'closed'

**Step 4: Commit**

```bash
git add src/features/admin/hooks/useGroupData.js src/features/admin/AdminPage.jsx
git commit -m "feat(voting): wire up admin poll flow — create, view results, close"
```

---

## Task 9: Wire Up Participant View

**Files:**
- Modify: `src/components/ParticipantView.js`

**Step 1: Add poll subscription and vote handler**

In `ParticipantView.js`, add imports at top:

```js
import { subscribeToPoll, submitVote, closePoll } from '../services/pollService';
import VotePanel from './VotePanel';
```

Add state after existing state declarations:

```js
const [poll, setPoll] = useState(null);
```

Add useEffect for poll subscription (after the existing `useEffect` blocks):

```js
useEffect(() => {
  if (!groupId) return;
  const unsub = subscribeToPoll(
    groupId,
    (pollData) => {
      setPoll(pollData);

      // Auto-close: if all participants have voted, close the poll
      if (pollData?.status === 'active' && participants.length > 0) {
        const voterCount = Object.keys(pollData.votes || {}).length;
        if (voterCount >= participants.length) {
          closePoll(groupId).catch(err =>
            console.error('[ParticipantView] auto-close poll failed:', err)
          );
        }
      }
    },
    (err) => console.error('[ParticipantView] poll subscription error:', err)
  );
  return unsub;
}, [groupId, participants.length]);
```

Add vote handler:

```js
const handleVote = async ({ newCandidateIds }) => {
  if (!currentParticipantId || !poll) return;
  try {
    await submitVote(groupId, currentParticipantId, newCandidateIds);
  } catch (err) {
    addNotification({ type: 'error', title: 'Vote Error', message: err.message });
  }
};
```

**Step 2: Add voting banner and pass votingMode to heatmap**

Find the `{overlaps?.length > 0 && (` block at the bottom of the render (around line 296).

Replace it with:

```jsx
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
      startDate={group.startDate}
      endDate={group.endDate}
      participants={participants}
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
        ? ({ candidateId }) => (
            <VotePanel
              poll={poll}
              candidateId={candidateId}
              currentParticipantId={currentParticipantId}
              onVote={handleVote}
              isReadOnly={poll.status === 'closed' || !currentParticipantId}
            />
          )
        : undefined
      }
    />
  </div>
)}
```

**Step 3: Test manually**

1. Admin starts a poll with 2 candidates
2. Open participant link in another tab
3. Confirm voting banner appears
4. Confirm heatmap shows only candidate periods, others faded
5. Click a candidate period → details panel shows VotePanel with vote button
6. Click "Vote for this period" → checkmark appears, vote count updates
7. In single-vote mode: vote for second candidate → first vote removed
8. In multi-vote mode: vote for second candidate → both checked
9. Admin closes poll → banner changes, heatmap becomes read-only

**Step 4: Commit**

```bash
git add src/components/ParticipantView.js
git commit -m "feat(voting): participant can view and submit votes via heatmap"
```

---

## Task 10: VotePanel — Show Participant Names (Enhancement)

The VotePanel currently shows voter IDs. Pass participants to resolve names.

**Files:**
- Modify: `src/components/VotePanel.jsx`
- Modify: `src/components/ParticipantView.js` (pass participants)
- Modify: `src/features/admin/VotingResults.jsx` (pass participants)

**Step 1: Update VotePanel to accept participants prop**

Add `participants = []` to props destructuring:

```js
function VotePanel({ poll, candidateId, currentParticipantId, onVote, isReadOnly, participants = [] }) {
```

Replace the voter list rendering to use names:

```jsx
{voterIds.map((id) => {
  const participant = participants.find(p => p.id === id);
  const displayName = id === currentParticipantId
    ? 'You'
    : participant?.name || id.slice(0, 8);
  return (
    <span key={id} className="text-xs bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded-full">
      {displayName}
    </span>
  );
})}
```

**Step 2: Pass participants from ParticipantView and VotingResults**

In `ParticipantView.js`, add `participants={participants}` to VotePanel:

```jsx
<VotePanel
  poll={poll}
  candidateId={candidateId}
  currentParticipantId={currentParticipantId}
  onVote={handleVote}
  isReadOnly={poll.status === 'closed' || !currentParticipantId}
  participants={participants}
/>
```

In `VotingResults.jsx`, add `participants={participants}` to VotePanel:

```jsx
<VotePanel
  poll={poll}
  candidateId={candidateId}
  currentParticipantId={adminParticipantId}
  onVote={onVote}
  isReadOnly={!isActive}
  participants={participants}
/>
```

**Step 3: Commit**

```bash
git add src/components/VotePanel.jsx src/components/ParticipantView.js src/features/admin/VotingResults.jsx
git commit -m "feat(voting): show participant names in vote panel voter list"
```

---

## Task 11: Serverless — Vote Invite Email

**Files:**
- Create: `api/send-vote-invite.js`

**Step 1: Create the serverless function**

```js
// Vercel Serverless Function — POST /api/send-vote-invite
// Notifies participants that a vote is open for them to cast.
// Required env vars: EMAIL_USER, EMAIL_PASSWORD (Gmail App Password)

const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { groupId, groupName, participants, baseUrl } = req.body ?? {};

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('[send-vote-invite] EMAIL credentials not set');
    return res.status(500).json({ error: 'Email service is not configured' });
  }

  const allParticipants = Array.isArray(participants) ? participants : [];
  const recipients = [...new Set(
    allParticipants.filter(p => p.email && p.email.includes('@')).map(p => p.email)
  )];

  if (recipients.length === 0) {
    return res.status(400).json({ error: 'No participants with email addresses' });
  }

  const origin = baseUrl || 'https://vacation-scheduler.vercel.app';
  const groupLink = `${origin}?group=${groupId}`;

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#0f172a;color:#f8fafc;border-radius:12px;overflow:hidden;">
      <div style="background:#1e3a5f;padding:32px 32px 24px;">
        <h1 style="margin:0;font-size:22px;font-weight:700;color:#f97316;">Find A Day</h1>
        <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">Time to vote!</p>
      </div>
      <div style="padding:32px;">
        <h2 style="margin:0 0 16px;font-size:20px;color:#f1f5f9;">
          🗳️ Vote on the best date for "${groupName || 'your event'}"
        </h2>
        <p style="color:#cbd5e1;line-height:1.6;margin:0 0 24px;">
          The organizer has proposed a few date options and wants your vote.
          Head to the planning page and click the highlighted periods to cast your vote.
        </p>
        <a href="${groupLink}"
           style="display:inline-block;padding:14px 28px;background:#f97316;color:#fff;font-weight:700;font-size:15px;border-radius:10px;text-decoration:none;">
          Vote Now →
        </a>
        <p style="color:#475569;font-size:12px;margin:32px 0 0;border-top:1px solid #1e293b;padding-top:20px;">
          You're receiving this because you're a participant in a group event planning session.
        </p>
      </div>
    </div>
  `;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Find A Day" <${process.env.EMAIL_USER}>`,
      to: recipients,
      subject: `Vote now — "${groupName || 'your event'}"`,
      html,
    });

    return res.status(200).json({ success: true, sentTo: recipients.length });
  } catch (err) {
    console.error('[send-vote-invite] Failed:', err.message);
    return res.status(500).json({ error: 'Failed to send email', detail: err.message });
  }
};
```

**Step 2: Commit**

```bash
git add api/send-vote-invite.js
git commit -m "feat(voting): add send-vote-invite serverless email function"
```

---

## Task 12: Serverless — Vote Result Email with Calendar Invite

**Files:**
- Create: `api/send-vote-result.js`

**Step 1: Create the serverless function**

The Google Calendar invite is generated as an ICS attachment using RFC 5545 format.

```js
// Vercel Serverless Function — POST /api/send-vote-result
// Sends result email with a Google Calendar ICS attachment.
// Required env vars: EMAIL_USER, EMAIL_PASSWORD

const nodemailer = require('nodemailer');

function formatICSDate(dateStr) {
  // dateStr is YYYY-MM-DD; convert to YYYYMMDD for ICS all-day format
  return dateStr.replace(/-/g, '');
}

function generateICS({ title, startDate, endDate, description }) {
  // endDate in ICS all-day events is exclusive (day after last day)
  const end = new Date(endDate);
  end.setDate(end.getDate() + 1);
  const endStr = end.toISOString().split('T')[0].replace(/-/g, '');
  const startStr = formatICSDate(startDate);
  const uid = `${Date.now()}@findaday`;
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Find A Day//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${startStr}`,
    `DTEND;VALUE=DATE:${endStr}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

function formatDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { groupId, groupName, winnerStartDate, winnerEndDate, participants, baseUrl } = req.body ?? {};

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    return res.status(500).json({ error: 'Email service is not configured' });
  }

  if (!winnerStartDate || !winnerEndDate) {
    return res.status(400).json({ error: 'winnerStartDate and winnerEndDate are required' });
  }

  const allParticipants = Array.isArray(participants) ? participants : [];
  const recipients = [...new Set(
    allParticipants.filter(p => p.email && p.email.includes('@')).map(p => p.email)
  )];

  if (recipients.length === 0) {
    return res.status(400).json({ error: 'No participants with email addresses' });
  }

  const origin = baseUrl || 'https://vacation-scheduler.vercel.app';
  const groupLink = `${origin}?group=${groupId}`;

  const dateDisplay = winnerStartDate === winnerEndDate
    ? formatDate(winnerStartDate)
    : `${formatDate(winnerStartDate)} – ${formatDate(winnerEndDate)}`;

  const icsContent = generateICS({
    title: groupName || 'Group Event',
    startDate: winnerStartDate,
    endDate: winnerEndDate,
    description: `Scheduled via Find A Day. ${groupLink}`,
  });

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#0f172a;color:#f8fafc;border-radius:12px;overflow:hidden;">
      <div style="background:#1e3a5f;padding:32px 32px 24px;">
        <h1 style="margin:0;font-size:22px;font-weight:700;color:#f97316;">Find A Day</h1>
        <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">Date confirmed!</p>
      </div>
      <div style="padding:32px;">
        <h2 style="margin:0 0 8px;font-size:20px;color:#f1f5f9;">
          🎉 "${groupName || 'Your event'}" is happening!
        </h2>
        <p style="color:#f97316;font-size:24px;font-weight:700;margin:0 0 24px;">${dateDisplay}</p>
        <p style="color:#cbd5e1;line-height:1.6;margin:0 0 24px;">
          The group has voted and the date is set. A calendar invite is attached — add it to your calendar!
        </p>
        <a href="${groupLink}"
           style="display:inline-block;padding:14px 28px;background:#f97316;color:#fff;font-weight:700;font-size:15px;border-radius:10px;text-decoration:none;">
          View Planning Page →
        </a>
        <p style="color:#475569;font-size:12px;margin:32px 0 0;border-top:1px solid #1e293b;padding-top:20px;">
          Sent via Find A Day.
        </p>
      </div>
    </div>
  `;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Find A Day" <${process.env.EMAIL_USER}>`,
      to: recipients,
      subject: `Date confirmed — "${groupName || 'your event'}"`,
      html,
      attachments: [
        {
          filename: 'event.ics',
          content: icsContent,
          contentType: 'text/calendar; method=REQUEST',
        },
      ],
    });

    return res.status(200).json({ success: true, sentTo: recipients.length });
  } catch (err) {
    console.error('[send-vote-result] Failed:', err.message);
    return res.status(500).json({ error: 'Failed to send email', detail: err.message });
  }
};
```

**Step 2: Commit**

```bash
git add api/send-vote-result.js
git commit -m "feat(voting): add send-vote-result email with ICS calendar invite"
```

---

## Final Verification Checklist

### Admin flow
- [ ] "Start Vote" button appears in Actions panel (disabled when poll exists or no overlaps)
- [ ] Clicking "Start Vote" shows VotingSetup with the heatmap
- [ ] Clicking dates on heatmap → "Add as Candidate" button appears in details panel
- [ ] Candidates accumulate in list with number labels (max 5)
- [ ] Number labels (1, 2, 3…) appear on heatmap over candidate first days with amber styling
- [ ] Remove candidate button works and re-numbers remaining
- [ ] Single/multi toggle works
- [ ] "Start Poll" disabled until 2+ candidates selected
- [ ] After starting poll: VotingResults renders with live stats
- [ ] Admin sees "Close Poll" and "Send Voting Invites" buttons
- [ ] If admin is a participant, they can vote via the heatmap in VotingResults
- [ ] Closing poll shows winner, "Send Result Email" button appears
- [ ] "Start New Vote" deletes old poll, returns to OverlapResults

### Participant flow
- [ ] No poll active → heatmap works normally (no regression)
- [ ] Poll active → voting banner appears above heatmap
- [ ] Heatmap shows only candidate periods; all other dates at ~20% opacity
- [ ] Hovering a candidate period: spotlight effect (others at 30%)
- [ ] Clicking a candidate: details panel shows VotePanel with vote button
- [ ] Vote button submits vote; checkmark appears on voted candidate's first day
- [ ] Vote count and progress bar update in real-time (open two tabs to verify)
- [ ] Voter names shown in VotePanel voter list
- [ ] In single mode: voting for 2nd candidate removes 1st vote
- [ ] In multi mode: multiple candidates can be voted for simultaneously
- [ ] Poll closed: banner changes, no vote buttons, heatmap read-only

### Mobile
- [ ] Voting banner readable on small screen
- [ ] Candidate period cells have adequate tap target size
- [ ] VotePanel vote button is full-width and easy to tap
- [ ] Details panel stacks below calendar on mobile

### Edge cases
- [ ] Admin who isn't a participant sees no vote button (VotePanel returns null)
- [ ] Participant who hasn't submitted availability sees "Submit your availability first to vote"
- [ ] Poll with 0 votes can be closed manually
- [ ] Auto-close fires when last participant votes (check Firebase data directly)

---

## Commit Summary

| Commit | Change |
|--------|--------|
| `feat(voting): add Firebase rules for poll node` | Task 1 |
| `feat(voting): add pollService for Firebase poll CRUD` | Task 2 |
| `feat(calendar): add spotlight fade effect on period hover/selection` | Task 3 |
| `feat(calendar): add votingMode and highlightedCandidates props, spotlight effect` | Task 4 |
| `feat(voting): add VotePanel component for heatmap details panel` | Task 5 |
| `feat(voting): add VotingSetup admin component` | Task 6 |
| `feat(voting): add VotingResults admin component with live tallies` | Task 7 |
| `feat(voting): wire up admin poll flow — create, view results, close` | Task 8 |
| `feat(voting): participant can view and submit votes via heatmap` | Task 9 |
| `feat(voting): show participant names in vote panel voter list` | Task 10 |
| `feat(voting): add send-vote-invite serverless email function` | Task 11 |
| `feat(voting): add send-vote-result email with ICS calendar invite` | Task 12 |
