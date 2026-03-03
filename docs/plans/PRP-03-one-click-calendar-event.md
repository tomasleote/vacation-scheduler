# PRP-03: One-Click Calendar Event Creation

**Priority:** Medium — Execute after PRP-02 (Event Type Templates)
**Estimated Effort:** 6-8 hours
**Dependencies:** PRP-01 (Rebrand), PRP-1.5 (SEO Landing Pages), PRP-02 (Event Type Templates) must be completed first

---

## Context & Background

FindADate (formerly "Vacation Scheduler") is a group date-coordination platform. At this point in the implementation sequence:
- The app has been rebranded to "FindADate" with coral/orange brand colors (PRP-01)
- SEO landing pages and react-router-dom are in place (PRP-1.5)
- Event type templates exist — groups have an `eventType` field (PRP-02)

The research document (`docs/findAdate.pdf`) identifies the **"post-poll problem"** as the biggest gap in scheduling tools: once you find the best date, existing tools abandon you. You still have to manually create a calendar event, send invitations, and notify everyone. No free tool handles this end-to-end workflow.

### Required Reading Before Starting

Before writing any code, the implementing agent MUST read:
1. `docs/FindADate-PRD-Strategy.md` — Section 4.5 (Calendar Event Creation) for the feature spec
2. `docs/findAdate.pdf` — The research paper discusses the "post-poll problem" extensively (page 2, 5)
3. `src/features/admin/OverlapResults.jsx` — Where overlap results are displayed (this is where the calendar button will live)
4. `src/features/admin/AdminPage.jsx` — The admin dashboard layout
5. `src/utils/eventTypes.js` — Event type definitions (created in PRP-02) that inform calendar event titles
6. `src/styles/design-tokens.js` — Design tokens for consistent styling

---

## Objective

After the overlap algorithm identifies the best dates, give the admin a **one-click way to create a calendar event** from those results. This bridges the gap from "we found the date" to "it's on everyone's calendar."

Two methods:
1. **Google Calendar link** — Opens Google Calendar with pre-filled event details (no API key needed)
2. **ICS file download** — Universal format that works with Apple Calendar, Outlook, and any calendar app

---

## Implementation Steps

### Step 1: Create Calendar Utility Functions (1-1.5h)

Create `src/utils/calendarEvent.js`:

```javascript
// src/utils/calendarEvent.js
// Utility functions for generating calendar events from overlap results.

/**
 * Format a date string (YYYY-MM-DD) into Google Calendar's required format (YYYYMMDD).
 * For all-day events, Google Calendar uses the date without time.
 */
function toGCalDate(dateStr) {
  return dateStr.replace(/-/g, '');
}

/**
 * Add N days to a date string. Returns YYYY-MM-DD format.
 * Used to set the end date for all-day events (Google Calendar requires end = day AFTER last day).
 */
function addDays(dateStr, days) {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Format a date for human-readable display in descriptions.
 * Returns e.g., "Monday, July 14, 2026"
 */
function formatDateLong(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate a Google Calendar URL for an overlap result.
 *
 * @param {Object} params
 * @param {string} params.title - Event title (group name)
 * @param {string} params.description - Event description
 * @param {string} params.startDate - Start date in YYYY-MM-DD format
 * @param {string} params.endDate - End date in YYYY-MM-DD format (inclusive)
 * @param {string} [params.location] - Optional location
 * @returns {string} Google Calendar URL
 */
export function generateGoogleCalendarUrl({ title, description, startDate, endDate, location }) {
  // Google Calendar all-day events: end date must be the day AFTER the last day
  const gcalEnd = toGCalDate(addDays(endDate, 1));
  const gcalStart = toGCalDate(startDate);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${gcalStart}/${gcalEnd}`,
    details: description,
  });

  if (location) {
    params.set('location', location);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate an ICS file content string for an overlap result.
 * ICS format is universal — works with Apple Calendar, Outlook, Google Calendar, etc.
 *
 * @param {Object} params
 * @param {string} params.title - Event title
 * @param {string} params.description - Event description
 * @param {string} params.startDate - Start date in YYYY-MM-DD format
 * @param {string} params.endDate - End date in YYYY-MM-DD format (inclusive)
 * @param {string} [params.location] - Optional location
 * @returns {string} ICS file content
 */
export function generateICSContent({ title, description, startDate, endDate, location }) {
  // ICS all-day events: DTEND is the day AFTER the last day
  const icsStart = toGCalDate(startDate);
  const icsEnd = toGCalDate(addDays(endDate, 1));

  // ICS requires specific line folding and escaping
  const escapeICS = (str) => str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@findadate.app`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FindADate//FindADate//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART;VALUE=DATE:${icsStart}`,
    `DTEND;VALUE=DATE:${icsEnd}`,
    `SUMMARY:${escapeICS(title)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    `UID:${uid}`,
    `DTSTAMP:${now}`,
  ];

  if (location) {
    lines.push(`LOCATION:${escapeICS(location)}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.join('\r\n');
}

/**
 * Trigger download of an ICS file.
 *
 * @param {string} icsContent - The ICS file content string
 * @param {string} filename - Desired filename (e.g., "summer-trip.ics")
 */
export function downloadICSFile(icsContent, filename) {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Build event details for calendar creation from an overlap result and group data.
 *
 * @param {Object} group - The group object from Firebase
 * @param {Object} overlap - An overlap result object
 * @param {number} participantCount - Total number of participants
 * @returns {Object} { title, description, startDate, endDate }
 */
export function buildCalendarEventDetails(group, overlap, participantCount) {
  const title = group.name || 'FindADate Event';
  const startDate = overlap.startDate;
  const endDate = overlap.endDate || overlap.startDate; // single-day events have same start/end

  const description = [
    `${title}`,
    group.description ? `\n${group.description}` : '',
    `\nDate: ${formatDateLong(startDate)}${startDate !== endDate ? ` — ${formatDateLong(endDate)}` : ''}`,
    `\n${overlap.count || overlap.availableCount || 0}/${participantCount} participants available`,
    `\n\nOrganized with FindADate — findadate.app`,
  ].join('');

  return { title, description, startDate, endDate };
}
```

### Step 2: Create CalendarEventButton Component (1.5-2h)

Create `src/features/admin/CalendarEventButton.jsx`:

This component renders next to each overlap result row and provides:
- A primary button that opens Google Calendar in a new tab
- A secondary dropdown/option for ICS download

```jsx
import React, { useState } from 'react';
import { Calendar, Download, ChevronDown } from 'lucide-react';
import {
  generateGoogleCalendarUrl,
  generateICSContent,
  downloadICSFile,
  buildCalendarEventDetails,
} from '../../utils/calendarEvent';

function CalendarEventButton({ group, overlap, participantCount }) {
  const [showOptions, setShowOptions] = useState(false);

  const { title, description, startDate, endDate } = buildCalendarEventDetails(
    group,
    overlap,
    participantCount
  );

  const handleGoogleCalendar = () => {
    const url = generateGoogleCalendarUrl({ title, description, startDate, endDate });
    window.open(url, '_blank', 'noopener,noreferrer');
    setShowOptions(false);
  };

  const handleICSDownload = () => {
    const icsContent = generateICSContent({ title, description, startDate, endDate });
    const filename = `${title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.ics`;
    downloadICSFile(icsContent, filename);
    setShowOptions(false);
  };

  return (
    <div className="relative inline-flex">
      {/* Primary action: Google Calendar */}
      <button
        onClick={handleGoogleCalendar}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-l-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 border border-brand-500/30 transition-colors"
        title="Add to Google Calendar"
      >
        <Calendar size={14} />
        Add to Calendar
      </button>

      {/* Dropdown toggle for more options */}
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="flex items-center px-1.5 py-1.5 text-xs rounded-r-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 border border-l-0 border-brand-500/30 transition-colors"
        title="More calendar options"
      >
        <ChevronDown size={12} />
      </button>

      {/* Dropdown menu */}
      {showOptions && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowOptions(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-20 bg-dark-800 border border-dark-700 rounded-lg shadow-xl py-1 min-w-[180px]">
            <button
              onClick={handleGoogleCalendar}
              className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-dark-700 flex items-center gap-2"
            >
              <Calendar size={14} />
              Google Calendar
            </button>
            <button
              onClick={handleICSDownload}
              className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-dark-700 flex items-center gap-2"
            >
              <Download size={14} />
              Download .ics file
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default CalendarEventButton;
```

### Step 3: Integrate into OverlapResults (1-1.5h)

Modify `src/features/admin/OverlapResults.jsx`:

1. Import the `CalendarEventButton` component
2. Add the button next to each overlap result row
3. Pass `group`, the specific `overlap` object, and `participants.length` as props

The button should appear on each result row, aligned to the right. For the top result, consider making the button slightly more prominent (e.g., filled background instead of ghost).

**Read the existing OverlapResults.jsx first** to understand the current layout before integrating.

### Step 4: Add "Confirm & Schedule" Button to Top Result (1h)

In addition to per-row buttons, add a prominent CTA for the #1 best result:

```jsx
{overlaps.length > 0 && (
  <div className="bg-brand-500/5 border border-brand-500/20 rounded-xl p-4 mb-6 flex items-center justify-between">
    <div>
      <p className="text-sm font-semibold text-gray-200">
        Best match: {overlaps[0].startDate} — {overlaps[0].endDate}
      </p>
      <p className="text-xs text-gray-400">
        {overlaps[0].availabilityPercent}% availability
      </p>
    </div>
    <CalendarEventButton
      group={group}
      overlap={overlaps[0]}
      participantCount={participants.length}
    />
  </div>
)}
```

### Step 5: Write Unit Tests (1h)

Create `src/utils/calendarEvent.test.js`:

Test cases:
1. `generateGoogleCalendarUrl` — produces valid URL with correct date format
2. `generateGoogleCalendarUrl` — encodes special characters in title/description
3. `generateGoogleCalendarUrl` — handles single-day events (start === end)
4. `generateICSContent` — produces valid ICS with VCALENDAR/VEVENT structure
5. `generateICSContent` — DTSTART and DTEND are correct for multi-day events
6. `generateICSContent` — single-day events have DTEND = start + 1 day
7. `buildCalendarEventDetails` — constructs correct title from group name
8. `buildCalendarEventDetails` — includes FindADate attribution in description
9. `buildCalendarEventDetails` — handles missing optional fields gracefully

---

## Calendar URL Examples

**Single-day dinner event (Jun 14, 2026):**
```
Google Calendar:
https://calendar.google.com/calendar/render?action=TEMPLATE&text=Friday+Dinner&dates=20260614/20260615&details=Friday+Dinner%0A%0ADate%3A+Sunday%2C+June+14%2C+2026%0A8%2F10+participants+available%0A%0AOrganized+with+FindADate+%E2%80%94+findadate.app

ICS file:
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//FindADate//FindADate//EN
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260614
DTEND;VALUE=DATE:20260615
SUMMARY:Friday Dinner
DESCRIPTION:Friday Dinner\n\nDate: Sunday\, June 14\, 2026\n8/10 participants available\n\nOrganized with FindADate — findadate.app
END:VEVENT
END:VCALENDAR
```

**Multi-day vacation (Jul 10-17, 2026):**
```
Google Calendar:
https://calendar.google.com/calendar/render?action=TEMPLATE&text=Summer+Trip+2026&dates=20260710/20260718&details=...

ICS file:
DTSTART;VALUE=DATE:20260710
DTEND;VALUE=DATE:20260718
```

---

## Testing Checklist

- [ ] `npm start` — app loads without errors
- [ ] Overlap results in admin panel show "Add to Calendar" button on each row
- [ ] Top result has a prominent calendar CTA section
- [ ] Clicking "Add to Calendar" opens Google Calendar in a new tab with correct pre-filled data
- [ ] Google Calendar shows correct title (group name)
- [ ] Google Calendar shows correct dates (all-day event spanning the right days)
- [ ] Google Calendar description includes group info and FindADate attribution
- [ ] Dropdown shows "Download .ics file" option
- [ ] Clicking .ics download produces a valid .ics file
- [ ] ICS file opens correctly in Apple Calendar (if testable)
- [ ] ICS file opens correctly in Outlook (if testable)
- [ ] Single-day events produce single-day calendar entries
- [ ] Multi-day events produce multi-day calendar entries
- [ ] Special characters in group names don't break URLs or ICS files
- [ ] `npm test` — all new unit tests pass
- [ ] `npm test` — all existing tests still pass

---

## Files Created

- `src/utils/calendarEvent.js`
- `src/utils/calendarEvent.test.js`
- `src/features/admin/CalendarEventButton.jsx`

## Files Modified

- `src/features/admin/OverlapResults.jsx` (integrate CalendarEventButton)

---

## Important Notes

- This is entirely **client-side** — no backend changes, no API keys, no third-party services
- Google Calendar URL generation requires NO authentication or API key — it's just a URL with query parameters
- ICS generation is a string template — no libraries needed
- The end date for all-day calendar events must be the day AFTER the last day (both Google Calendar and ICS spec require this)
- Attribution ("Organized with FindADate — findadate.app") in the description is a viral loop mechanism — every calendar event becomes a brand impression
