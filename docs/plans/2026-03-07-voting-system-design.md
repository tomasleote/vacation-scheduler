# Voting System Design

**Date:** 2026-03-07
**Status:** Approved
**Feature:** Heatmap-Integrated Voting

---

## Overview

Add a voting phase to the event lifecycle: **Availability → Voting → Confirmed**.

The admin reviews the availability heatmap, selects 2–5 fixed date ranges as candidates, and starts a poll. Participants vote directly on the heatmap, which switches into a focused voting mode showing only the candidate periods. Results are live (real-time). The poll closes automatically when all participants have voted, or the admin closes it manually.

---

## Requirements

### Functional

- Admin selects 2–5 fixed date ranges as voting candidates from the heatmap
- Admin configures single-vote or multi-vote mode
- Participants see only the candidate periods on the heatmap during an active poll
- All other dates fade out (non-interactive)
- Live vote counts visible to all participants in real-time
- Participants can change their vote freely while the poll is open
- Poll auto-closes when all participants have voted
- Admin can manually close the poll at any time
- Winning period is highlighted after the poll closes
- Admin can optionally send a result email with a Google Calendar invite
- Admin can optionally notify participants when the poll starts
- One active poll at a time; admin can start a new poll after closing
- Admin can vote as a participant (if they added themselves as one)

### Non-functional

- No new authentication required (uses existing UUID-based participant/admin tokens)
- Real-time sync via existing Firebase Realtime Database listeners
- Mobile-friendly: large tap targets, stacked layout
- No performance regression on the heatmap for groups without a poll

---

## Data Model

New node under `groups/{groupId}/poll/`:

```text
poll/
  id: string                      # UUID
  status: 'active' | 'closed'
  mode: 'single' | 'multi'
  createdAt: string               # ISO 8601
  closedAt: string | null         # ISO 8601, set when closed
  candidates/
    {candidateId}/
      startDate: string           # YYYY-MM-DD
      endDate: string             # YYYY-MM-DD
      label: number               # 1–5, display order
  votes/
    {participantId}/
      candidateIds: string[]      # voted candidate IDs
      votedAt: string             # ISO 8601
```

**Design decisions:**
- `poll` is a single node (enforces one active poll at a time naturally)
- `votes` keyed by `participantId` — prevents duplicates; vote change = overwrite
- `candidateIds` is an array for both modes (single = length 1, multi = length 1+)
- Poll is deleted on admin cancel; previous vote data does not persist across polls

---

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `src/services/pollService.js` | Firebase CRUD for polls and votes |
| `src/features/admin/VotingSetup.jsx` | Admin candidate selection + poll creation UI |
| `src/features/admin/VotingResults.jsx` | Admin view of live results + close/notify actions |
| `src/components/VotePanel.jsx` | Vote button + vote count shown in heatmap details panel |
| `api/send-vote-invite.js` | Email: voting started notification |
| `api/send-vote-result.js` | Email: poll result + Google Calendar invite |

### Modified Files

| File | Change |
|------|--------|
| `src/components/SlidingOverlapCalendar.js` | Add `votingMode` prop; spotlight effect; candidate-period rendering |
| `src/features/admin/AdminPage.jsx` | Add "Start Vote" button; render VotingSetup / VotingResults |
| `src/components/ParticipantView.js` | Subscribe to poll; pass `votingMode` to heatmap; show voting banner |
| `database.rules.json` | Add read/write rules for `poll/` and `poll/votes/` |

---

## Component Design

### `votingMode` prop on SlidingOverlapCalendar

```js
votingMode?: {
  active: boolean,
  poll: {
    id: string,
    status: 'active' | 'closed',
    mode: 'single' | 'multi',
    candidates: { [id]: { startDate, endDate, label } },
    votes: { [participantId]: { candidateIds, votedAt } },
  },
  currentParticipantId: string | null,
  onVote: (candidateId: string) => void,
  isReadOnly: boolean,   // true when poll is closed or no participantId
}
```

**Behavior changes when `votingMode.active` is true:**

1. Duration input is hidden
2. Dates outside all candidate periods: `opacity-20 cursor-default pointer-events-none`
3. First day of each candidate period: shows numbered label (① ② ③)
4. Clicking any date within a candidate period selects that entire period (replaces duration-based block logic)
5. Voted periods show a checkmark badge on first day
6. Details panel right side renders `VotePanel` instead of `renderSelectedAction`
7. Top overlaps list replaced with voting candidate list

**Spotlight effect (general, not voting-specific):**

When `activeBlock.length > 0`, all non-highlighted in-range cells add:
```css
opacity-30 transition-opacity duration-200
```
Highlighted cells retain full opacity + existing ring/glow.

### `VotePanel` component

Renders inside the details panel when a candidate period is selected during an active poll:

```text
[Date Range heading — existing]
[Availability count — existing]
[Who can make it — existing]
[Who is holding you back — existing]
─────────────────────────────
Vote count: "4 of 7 voted for this"
Voter list: [name pills]
[Vote for this period] button  ← primary, full width
  or [Voted ✓] with [Remove Vote] link if already voted
```

In single-vote mode: voting for a new period auto-removes the previous vote (one call to `submitVote` with new candidateId).

### Admin: VotingSetup

Shown when admin clicks "Start Vote" in the Actions panel. Replaces (or wraps) the `OverlapResults` heatmap section.

States:
1. **Candidate selection**: heatmap in selection mode; admin clicks to define periods (1–5); selected periods appear as a list with remove buttons; single/multi toggle; "Start Poll" CTA
2. **Poll active**: heatmap switches to voting mode with live results; "Close Poll" button; optional "Send Voting Invites" button

### Admin: VotingResults

Shown in the admin view when a poll is active or closed:

- Live vote tally per candidate (progress bars)
- Participant vote status table (voted / not voted)
- If closed: winner highlighted, "Send Result Email" button
- If active: "Close Poll" button

---

## Flows

### Admin Creates Poll

1. Admin clicks "Start Vote" (Actions panel)
2. Heatmap enters candidate selection mode
3. Admin clicks on date ranges to define 2–5 candidates (labeled ①–⑤)
4. Admin selects single/multi vote mode
5. Admin clicks "Start Poll" → `createPoll()` writes to Firebase
6. Optional: "Send Voting Invites" → POST `/api/send-vote-invite`
7. Heatmap transitions to voting mode; VotingResults panel appears

### Participant Votes

1. Participant visits link; `subscribeToPoll()` listener detects active poll
2. Banner: "Vote on proposed dates!" appears above heatmap
3. Heatmap shows only candidate periods (others faded)
4. Participant hovers → spotlight effect; clicks → period locked, details panel shown
5. Details panel shows VotePanel with vote button
6. Participant clicks "Vote" → `submitVote()` writes to Firebase
7. Real-time listener updates vote counts for all participants instantly

### Poll Closes

**Auto-close:** After each `submitVote()`, client checks `votes count >= participants.length`; if true, calls `closePoll()`.

**Manual close:** Admin clicks "Close Poll" → `closePoll()` sets `status: 'closed'`, `closedAt: now`.

**After close:**
- All clients' real-time listeners fire with `status: 'closed'`
- Heatmap becomes read-only; winning period highlighted with gold ring
- Admin sees "Send Result Email" button → POST `/api/send-vote-result`

---

## Edge Cases

| Case | Behavior |
|------|---------|
| Vote change (single mode) | Overwrite `candidateIds: [newId]` |
| Vote change (multi mode) | Toggle: add if absent, remove if present |
| Poll closed | Heatmap read-only, no vote buttons, winner highlighted |
| Admin cancels poll | Delete `poll/` node; heatmap reverts to availability mode |
| Late participant joins | Can vote immediately; auto-close check uses live participant count |
| Cross-month period | "→" indicator on last visible day; clicking either month portion selects full period |
| Tie (multiple winners) | Both highlighted; admin sees tie notice; can start new poll |
| Participant with no availability | Can still vote (voting is decoupled from availability) |
| No participants have voted yet | Poll shows 0/N; no auto-close triggered |
| Admin is not a participant | Cannot vote; vote button not shown |

---

## Firebase Rules

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
      ".write": true,  // any participant can write their own vote
      "candidateIds": { ".validate": "newData.hasChildren() || !newData.exists()" },
      "votedAt": { ".validate": "newData.isString() || !newData.exists()" }
    }
  }
}
```

Note: Firebase RTDB does not support server-side identity verification for this app's token pattern. Vote integrity relies on `participantId` being known only to the participant (via their personal link URL).

---

## Email Templates

### Voting Invite (`/api/send-vote-invite`)

Subject: `Vote now — [Group Name]`

Body: Group name, voting deadline (if any), personal participation link, CTA button.

### Vote Result (`/api/send-vote-result`)

Subject: `[Group Name] — Date confirmed!`

Body: Winning date range, group name, Google Calendar `.ics` attachment generated server-side.

---

## Mobile UX

- Candidate periods are full-cell tap targets (no sub-cell precision needed)
- Details panel stacks below calendar (existing responsive layout handles this)
- Vote button is full-width at bottom of details panel
- Voting banner is sticky at top on mobile
- Month navigation arrows remain accessible during voting mode

---

## Implementation Order

1. Firebase rules update (`database.rules.json`)
2. `pollService.js` — all Firebase poll operations
3. `SlidingOverlapCalendar.js` — `votingMode` prop + spotlight effect
4. `VotePanel.jsx` — vote UI in details panel
5. `VotingSetup.jsx` — admin candidate selection + poll creation
6. `VotingResults.jsx` — admin live results view
7. `AdminPage.jsx` — wire up VotingSetup/VotingResults + "Start Vote" button
8. `ParticipantView.js` — subscribe to poll, pass votingMode to heatmap, show banner
9. `send-vote-invite.js` + `send-vote-result.js` — serverless email functions
10. End-to-end testing: admin flow, participant flow, auto-close, mobile
