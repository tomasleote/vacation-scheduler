# Design Doc: CalendarPicker + Admin Button Redesign

**Date:** 2026-03-03
**Branch:** development
**Status:** Approved

---

## Problem

1. `CreateGroupForm` and `GroupSettings` use native `<input type="date">` — browser-native, visually inconsistent with the design system.
2. `AdminPage` Actions panel uses 3 raw `<button>` elements with hardcoded colors (emerald, brand, rose) that bypass the shared `Button` component.
3. `GroupSettings` Save/Cancel also use raw `<button>` elements.

---

## Part 1 — CalendarPicker Component

### Location
- `src/shared/ui/CalendarPicker.jsx`
- Exported from `src/shared/ui/index.js`
- Date utilities: `src/utils/dateUtils.js`

### Component API
```jsx
<CalendarPicker
  label="Start Date"
  id="start-date"
  value={startDate}          // "YYYY-MM-DD" string or ""
  onChange={setStartDate}    // (value: "YYYY-MM-DD") => void
  minDate="2026-03-03"       // optional — disables days before this
  maxDate="2026-12-31"       // optional — disables days after this
  required                   // forwarded to hidden input
  placeholder="Select a date"
/>
```

### UX Pattern: Inline Toggle
Clicking the trigger expands the calendar grid directly below within the form flow. Selecting a date collapses it. Click outside also collapses.

### Visual States
| State | Classes |
|---|---|
| Default cell | `bg-transparent text-gray-300 hover:bg-dark-700 hover:text-gray-100` |
| Today | `ring-1 ring-brand-400/60 text-brand-400` |
| Selected | `bg-brand-500 text-white font-semibold` |
| Disabled (before minDate) | `text-dark-700 cursor-not-allowed opacity-30` |
| Outside current month | `text-gray-600 opacity-40` |

### Date Utilities (`src/utils/dateUtils.js`)
Pure functions, no side effects:
- `toYMD(date)` → "YYYY-MM-DD"
- `fromYMD(str)` → Date
- `getDaysInMonth(year, month)` → number
- `getFirstDayOfWeek(year, month)` → 0-6 (Monday-based)
- `isToday(date)` → boolean
- `isSameDay(a, b)` → boolean
- `isBefore(a, b)` → boolean (date-only, ignores time)
- `startOfDay(date)` → Date (midnight local)
- `formatDisplayDate(ymd)` → "Mar 15, 2026"

### Constraint Wiring
```jsx
// CreateGroupForm
<CalendarPicker value={startDate} onChange={setStartDate} minDate={today} />
<CalendarPicker value={endDate} onChange={setEndDate} minDate={startDate || today} />

// GroupSettings (edit mode)
<CalendarPicker value={editData.startDate} onChange={(v) => setEditData({...editData, startDate: v})} minDate={today} />
<CalendarPicker value={editData.endDate} onChange={(v) => setEditData({...editData, endDate: v})} minDate={editData.startDate || today} />
```

### Keyboard Navigation
- `Escape` → close calendar
- `Tab` → focus moves through interactive elements normally
- `Enter` / `Space` on a day cell → select and close
- Arrow keys on day cells → navigate between days

### Accessibility
- Calendar grid: `role="grid"`
- Day cells: `role="gridcell"` with `aria-label="March 15, 2026"` (+ ", today" / ", selected" as appropriate)
- Disabled cells: `aria-disabled="true"`
- Trigger button: `aria-expanded={isOpen}` + `aria-haspopup="grid"`
- Month nav: `aria-label="Previous month"` / `aria-label="Next month"`
- Hidden input: `<input type="hidden" required={required} value={value} />` for form validation

### Animation
Uses existing Tailwind keyframe `animate-fade-in` (already defined in `tailwind.config.js`).

---

## Part 2 — Admin Button Redesign

### AdminPage.jsx — Actions Panel
| Action | Before | After |
|---|---|---|
| Export CSV | Raw `<button className="bg-emerald-600...">` | `<Button variant="secondary"><Download/> Export CSV</Button>` |
| Send Reminder | Raw `<button className="bg-brand-500...">` | `<Button variant="primary"><Mail/> Send Reminder</Button>` |
| Delete Group | Raw `<button className="bg-rose-600...">` | `<Button variant="danger">Delete Group</Button>` |

**Hierarchy rationale:**
- `secondary` for Export: utility action, not a call-to-action
- `primary` for Send Reminder: highest value action in the panel (engagement)
- `danger` for Delete: destructive, semantically clear

### GroupSettings.jsx — Edit Mode Buttons
| Action | Before | After |
|---|---|---|
| Save | Raw `<button className="bg-brand-500...">` | `<Button variant="primary"><Save/> Save</Button>` |
| Cancel | Raw `<button className="bg-dark-800...">` | `<Button variant="secondary">Cancel</Button>` |

---

## Tests

### New: `src/utils/dateUtils.test.js`
Covers all pure utility functions with edge cases (leap years, month boundaries, timezone-safe comparisons).

### New: `src/shared/ui/CalendarPicker.test.jsx`
- Renders trigger with placeholder when no value
- Shows formatted date when value provided
- Opens calendar on trigger click
- Closes on outside click
- Disables days before minDate (not clickable, aria-disabled)
- Selects a day and fires onChange with correct "YYYY-MM-DD"
- Closes after selection
- Today has today indicator
- Escape key closes calendar
- Month navigation works

### No existing tests broken
No current tests cover `CreateGroupForm`, `GroupSettings`, or `AdminPage`.

---

## Files Changed

### Created
- `src/shared/ui/CalendarPicker.jsx`
- `src/utils/dateUtils.js`
- `src/utils/dateUtils.test.js`
- `src/shared/ui/CalendarPicker.test.jsx`

### Modified
- `src/shared/ui/index.js` — add CalendarPicker export
- `src/features/home/CreateGroupForm.jsx` — replace Input[type=date] with CalendarPicker
- `src/features/admin/GroupSettings.jsx` — replace Input[type=date] with CalendarPicker; fix Save/Cancel buttons
- `src/features/admin/AdminPage.jsx` — replace 3 raw action buttons with Button component
