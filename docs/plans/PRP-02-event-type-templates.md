# PRP-02: Event Type Templates

**Priority:** Medium — Execute after PRP-01 (Rebrand) and PRP-1.5 (SEO Landing Pages)
**Estimated Effort:** 4-6 hours
**Dependencies:** PRP-01 (Rebrand) and PRP-1.5 (SEO Landing Pages) must be completed first

---

## Context & Background

FindADate (formerly "Vacation Scheduler") is a group date-coordination platform. The app has been rebranded (PRP-01) and SEO landing pages have been added (PRP-1.5). The core product flow is:

1. Admin creates a group with a date range
2. Shares a link with participants
3. Participants mark which days they're available
4. The overlap algorithm finds the best matching dates

Currently, the create-group form is generic — it asks for a date range and a "duration" (how many consecutive days the participant needs). This made sense for vacations, but for events like dinners, parties, or game nights, asking "how long can you stay?" makes no sense. A dinner is one evening. A game night is one evening.

### Required Reading Before Starting

Before writing any code, the implementing agent MUST read:
1. `docs/FindADate-PRD-Strategy.md` — Section 4.3 (Event Type Templates) for the original design spec
2. `src/styles/design-tokens.js` — Design tokens for colors and brand values
3. `src/features/home/CreateGroupForm.jsx` — The current group creation form (this is the primary file being modified)
4. `src/components/ParticipantView.js` — The participant availability form (needs conditional duration logic)
5. `src/features/admin/AdminAvailability.jsx` — Admin's own availability form (needs same conditional logic)
6. `src/features/admin/hooks/useGroupData.js` — Where group data is loaded (needs to handle eventType field)
7. `src/utils/overlap.js` — The overlap algorithm (may need awareness of single-day vs multi-day)
8. `src/components/CalendarView.js` — The calendar component where participants select dates

---

## Objective

Add an **event type selector** to the CreateGroupForm that pre-configures the experience based on the type of event being planned. The key insight is:

**Not all events need multi-day scheduling.** Dinners, parties, game nights, and team meetings are single-day events. Only vacations and custom "other" events need multi-day window support.

---

## Event Type Definitions

| Template | Duration Behavior | Ask "How long?" | Default Duration | Placeholder Example |
|----------|------------------|-----------------|------------------|---------------------|
| **Vacation** | Multi-day windows (1-30 days) | YES — participants choose their trip length | 3 days | "Summer Trip 2026" |
| **Dinner** | Single-day only | NO — forced to 1 day | 1 day (locked) | "Friday Dinner" |
| **Party** | Single-day only | NO — forced to 1 day | 1 day (locked) | "Sarah's Birthday" |
| **Game Night** | Single-day only | NO — forced to 1 day | 1 day (locked) | "D&D Session" |
| **Team Event** | Single-day only | NO — forced to 1 day | 1 day (locked) | "Q3 Offsite Planning" |
| **Other** | Multi-day windows (1-30 days) | YES — participants choose their needed duration | 1 day | "Custom Event" |

### Critical Logic

**Single-day templates (Dinner, Party, Game Night, Team Event):**
- Duration is ALWAYS 1 — no "how long can you stay?" question
- The overlap algorithm treats each day independently
- Participants simply mark which individual days work for them
- Results show "Best dates" ranked by how many people are free on each day
- The sliding window overlap calculation uses window size = 1

**Multi-day templates (Vacation, Other):**
- Duration question IS shown — participants specify how many consecutive days they need
- The overlap algorithm finds the best N-consecutive-day windows
- This is the existing behavior, unchanged

**We do NOT care about time slots for any template.** FindADate is about finding the right DATE, not the right hour. All templates work at the day level only.

---

## Data Model Changes

### Group Document (Firebase)

Add an `eventType` field to the group document:

```javascript
// Current group structure:
{
  name: "Summer Trip 2026",
  description: "Beach vacation",
  startDate: "2026-06-01",
  endDate: "2026-08-31",
  adminEmail: "...",
  recoveryPasswordHash: "...",
  createdAt: "..."
}

// New group structure (add eventType):
{
  name: "Summer Trip 2026",
  description: "Beach vacation",
  startDate: "2026-06-01",
  endDate: "2026-08-31",
  eventType: "vacation",    // NEW FIELD: "vacation" | "dinner" | "party" | "gamenight" | "team" | "other"
  adminEmail: "...",
  recoveryPasswordHash: "...",
  createdAt: "..."
}
```

**Backward compatibility:** If `eventType` is missing (old groups), default to `"vacation"` behavior (multi-day, show duration question). This ensures existing groups continue working.

### Helper: isSingleDayEvent()

Create a simple utility function used across the app:

```javascript
// src/utils/eventTypes.js

export const EVENT_TYPES = {
  vacation: {
    key: 'vacation',
    label: 'Vacation',
    emoji: '🏖️',
    placeholder: 'e.g., Summer Trip 2026',
    descriptionPlaceholder: 'Where are you going? Beach, mountains, city break...',
    singleDay: false,
    defaultDuration: 3,
  },
  dinner: {
    key: 'dinner',
    label: 'Dinner',
    emoji: '🍽️',
    placeholder: 'e.g., Friday Dinner',
    descriptionPlaceholder: 'Restaurant name, cuisine, occasion...',
    singleDay: true,
    defaultDuration: 1,
  },
  party: {
    key: 'party',
    label: 'Party',
    emoji: '🎂',
    placeholder: "e.g., Sarah's Birthday",
    descriptionPlaceholder: 'Birthday, house party, celebration...',
    singleDay: true,
    defaultDuration: 1,
  },
  gamenight: {
    key: 'gamenight',
    label: 'Game Night',
    emoji: '🎮',
    placeholder: 'e.g., D&D Session',
    descriptionPlaceholder: 'Board games, D&D, video games, LAN party...',
    singleDay: true,
    defaultDuration: 1,
  },
  team: {
    key: 'team',
    label: 'Team Event',
    emoji: '👥',
    placeholder: 'e.g., Q3 Offsite Planning',
    descriptionPlaceholder: 'Team meeting, offsite, retreat, all-hands...',
    singleDay: true,
    defaultDuration: 1,
  },
  other: {
    key: 'other',
    label: 'Other',
    emoji: '📅',
    placeholder: 'e.g., Custom Event',
    descriptionPlaceholder: 'What are you planning?',
    singleDay: false,
    defaultDuration: 1,
  },
};

export const isSingleDayEvent = (eventType) => {
  if (!eventType) return false; // backward compat: old groups default to multi-day
  return EVENT_TYPES[eventType]?.singleDay ?? false;
};

export const getEventConfig = (eventType) => {
  return EVENT_TYPES[eventType] || EVENT_TYPES.other;
};
```

---

## Implementation Steps

### Step 1: Create Event Types Utility (30 min)

Create `src/utils/eventTypes.js` with the `EVENT_TYPES` config, `isSingleDayEvent()`, and `getEventConfig()` as shown above.

### Step 2: Update CreateGroupForm (1-1.5h)

Modify `src/features/home/CreateGroupForm.jsx`:

1. **Add event type selector** at the TOP of the form (before group name):

```jsx
<div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
  {Object.values(EVENT_TYPES).map((type) => (
    <button
      key={type.key}
      type="button"
      onClick={() => setEventType(type.key)}
      className={`p-2 rounded-lg border text-center text-sm transition-colors ${
        eventType === type.key
          ? 'border-brand-500 bg-brand-500/10 text-brand-400'
          : 'border-dark-700 bg-dark-800 text-gray-400 hover:border-dark-600'
      }`}
    >
      <span className="text-lg block">{type.emoji}</span>
      <span className="text-xs font-medium">{type.label}</span>
    </button>
  ))}
</div>
```

2. **Add `eventType` state** with default value `'vacation'`:
```javascript
const [eventType, setEventType] = useState('vacation');
```

3. **Dynamic placeholders** — when eventType changes, update the name and description placeholders:
```javascript
const config = getEventConfig(eventType);
// Use config.placeholder for name input
// Use config.descriptionPlaceholder for description textarea
```

4. **Pass eventType to createGroup** — add `eventType` to the data sent to Firebase:
```javascript
const result = await createGroup({
  name, description, startDate, endDate, adminEmail, recoveryPasswordHash,
  eventType  // NEW
});
```

### Step 3: Update Firebase createGroup Function (30 min)

Modify `src/firebase.js` (the `createGroup` function) to accept and store `eventType`:

```javascript
// In the createGroup function, add eventType to the data written to Firebase:
const groupData = {
  name,
  description,
  startDate,
  endDate,
  eventType: eventType || 'vacation',  // default for backward compat
  adminEmail,
  recoveryPasswordHash,
  createdAt: new Date().toISOString(),
};
```

### Step 4: Update ParticipantView — Conditional Duration (1.5-2h)

Modify `src/components/ParticipantView.js`:

1. **Import the utility:**
```javascript
import { isSingleDayEvent, getEventConfig } from '../utils/eventTypes';
```

2. **Check group.eventType** after loading the group data:
```javascript
const singleDay = isSingleDayEvent(group?.eventType);
```

3. **Conditionally hide the "How many days do you need?" input:**
   - If `singleDay === true`: Do NOT render the duration selector. Force `participantDuration = '1'` internally.
   - If `singleDay === false`: Show the duration selector as it currently works.

4. **Update the overlap calculation calls:**
   - For single-day events, the heatmap duration filter should be locked to 1.
   - The `heatmapDuration` state should be set to `'1'` and the duration filter UI should be hidden.

5. **Update section labels:**
   - For single-day events: "Which days work for you?" (not "Which days are you available?")
   - For multi-day events: Keep current wording about availability windows

### Step 5: Update AdminAvailability — Conditional Duration (1h)

Modify `src/features/admin/AdminAvailability.jsx` with the same logic:

1. Check `group.eventType` to determine if single-day
2. If single-day: hide duration input, force duration to 1
3. If multi-day: show duration input as current

### Step 6: Update OverlapResults — Conditional Display (30 min)

Modify `src/features/admin/OverlapResults.jsx`:

1. For single-day events: hide the duration filter dropdown, lock to 1-day windows
2. Label results as "Best dates" instead of "Best windows" for single-day events
3. Each result shows a single date instead of a date range

### Step 7: Update Admin hooks/useGroupData.js (30 min)

Ensure the `useGroupData` hook properly reads and exposes the `eventType` field from the group document. Set a default of `'vacation'` if the field is missing (backward compatibility).

### Step 8: Update GroupSettings Display (15 min)

In `src/features/admin/GroupSettings.jsx`, display the event type as a badge or label in the group settings section. This is informational only — event type cannot be changed after creation.

---

## UI Behavior Summary

### Single-Day Events (Dinner, Party, Game Night, Team Event)

```
Create Form:                    Participant View:
┌──────────────────────┐        ┌──────────────────────┐
│ [🍽️ Dinner] selected │        │ Which days work      │
│                      │        │ for you?             │
│ Name: Friday Dinner  │        │                      │
│ Date: Jun 1 - Jun 30 │        │ ┌──┬──┬──┬──┬──┐    │
│                      │        │ │ 1│ 2│ 3│ 4│ 5│    │
│ NO duration question │        │ ├──┼──┼──┼──┼──┤    │
│                      │        │ │ 8│ 9│10│11│12│    │
│ [Create]             │        │ └──┴──┴──┴──┴──┘    │
└──────────────────────┘        │ (tap to toggle days) │
                                │                      │
                                │ NO "how long" input  │
                                │                      │
                                │ [Save Availability]  │
                                └──────────────────────┘

Admin Results:
┌──────────────────────────────┐
│ Best Dates (no duration      │
│ filter shown)                │
│                              │
│ 1. Jun 14 — 8/10 available  │
│ 2. Jun 21 — 7/10 available  │
│ 3. Jun 7  — 6/10 available  │
└──────────────────────────────┘
```

### Multi-Day Events (Vacation, Other)

```
Create Form:                    Participant View:
┌──────────────────────┐        ┌──────────────────────┐
│ [🏖️ Vacation] selected│       │ When are you         │
│                      │        │ available?           │
│ Name: Summer Trip    │        │                      │
│ Date: Jun 1 - Aug 31 │        │ How many days do you │
│                      │        │ need? [  5  ] days   │
│ [Create]             │        │                      │
└──────────────────────┘        │ ┌──┬──┬──┬──┬──┐    │
                                │ │ 1│ 2│ 3│ 4│ 5│    │
                                │ ├──┼──┼──┼──┼──┤    │
                                │ │ 8│ 9│10│11│12│    │
                                │ └──┴──┴──┴──┴──┘    │
                                │                      │
                                │ [Save Availability]  │
                                └──────────────────────┘

Admin Results:
┌──────────────────────────────┐
│ Best Windows                 │
│ Duration filter: [5 days ▾]  │
│                              │
│ 1. Jul 10-14 — 8/10 avail   │
│ 2. Jul 20-24 — 7/10 avail   │
│ 3. Aug 1-5   — 6/10 avail   │
└──────────────────────────────┘
```

---

## Testing Checklist

- [ ] `npm start` — app loads without errors
- [ ] CreateGroupForm shows event type selector with 6 options
- [ ] Selecting different event types changes placeholders dynamically
- [ ] Creating a "Dinner" event stores `eventType: "dinner"` in Firebase
- [ ] Creating a "Vacation" event stores `eventType: "vacation"` in Firebase
- [ ] Participant view for a dinner group: NO duration question shown
- [ ] Participant view for a vacation group: duration question IS shown
- [ ] Admin availability for a dinner group: NO duration question shown
- [ ] Admin availability for a vacation group: duration question IS shown
- [ ] Overlap results for dinner: shows "Best dates" with single dates, no duration filter
- [ ] Overlap results for vacation: shows "Best windows" with date ranges and duration filter
- [ ] OLD groups (no eventType field) behave as vacation (multi-day, duration shown) — backward compatibility
- [ ] Group settings show the event type badge
- [ ] `npm test` — all existing tests pass
- [ ] Test each event type: vacation, dinner, party, gamenight, team, other

---

## Files Created

- `src/utils/eventTypes.js`

## Files Modified

- `src/features/home/CreateGroupForm.jsx` (event type selector + dynamic placeholders)
- `src/firebase.js` (store eventType in createGroup)
- `src/components/ParticipantView.js` (conditional duration logic)
- `src/features/admin/AdminAvailability.jsx` (conditional duration logic)
- `src/features/admin/OverlapResults.jsx` (conditional display)
- `src/features/admin/hooks/useGroupData.js` (expose eventType)
- `src/features/admin/GroupSettings.jsx` (display event type badge)
