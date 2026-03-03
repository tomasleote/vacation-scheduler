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
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Format a date for human-readable display in descriptions.
 * Returns e.g., "Monday, July 14, 2026"
 */
function formatDateLong(dateStr) {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day);
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
    const escapeICS = (str) => str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

    const dtNow = new Date();
    const now = dtNow.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const uid = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}@findaday.app`;

    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Find A Day//Find A Day//EN',
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
 * @returns {Object} { title, description, startDate, endDate, location }
 */
export function buildCalendarEventDetails(group, overlap, participantCount) {
    const title = group.name || 'Find A Day Event';
    const startDate = overlap.startDate;
    const endDate = overlap.endDate || overlap.startDate; // single-day events have same start/end

    const availableCount = overlap.count || overlap.availableCount || 0;
    const location = group.location?.formattedAddress || null;

    const description = [
        `${title}`,
        group.description ? `\n${group.description}` : '',
        `\nDate: ${formatDateLong(startDate)}${startDate !== endDate ? ` — ${formatDateLong(endDate)}` : ''}`,
        `\n${availableCount}/${participantCount} participants available`,
        location ? `\nLocation: ${location}` : '',
        `\n\nOrganized with Find A Day — findaday.app`,
    ].join('');

    return { title, description, startDate, endDate, location };
}
