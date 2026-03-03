import {
    generateGoogleCalendarUrl,
    generateICSContent,
    buildCalendarEventDetails,
} from './calendarEvent';

describe('calendarEvent Utilities', () => {
    describe('generateGoogleCalendarUrl', () => {
        it('produces valid URL with correct date format for multi-day events', () => {
            const url = generateGoogleCalendarUrl({
                title: 'Team Retreat',
                description: 'Yearly get together',
                startDate: '2026-06-10',
                endDate: '2026-06-12',
            });
            expect(url).toContain('action=TEMPLATE');
            expect(url).toContain('text=Team+Retreat');
            expect(url).toContain('details=Yearly+get+together');
            // end date should be 1 day after end date for all-day spanning events
            expect(url).toContain('dates=20260610%2F20260613');
        });

        it('handles single-day events correctly (end date is +1 day)', () => {
            const url = generateGoogleCalendarUrl({
                title: 'Dinner',
                description: 'Dinner Party',
                startDate: '2026-12-25',
                endDate: '2026-12-25',
            });
            expect(url).toContain('dates=20261225%2F20261226');
        });
    });

    describe('generateICSContent', () => {
        it('produces valid ICS structure for single-day events', () => {
            const ics = generateICSContent({
                title: 'Lunch',
                description: 'Team Lunch',
                startDate: '2026-07-04',
                endDate: '2026-07-04',
            });
            expect(ics).toContain('BEGIN:VCALENDAR');
            expect(ics).toContain('BEGIN:VEVENT');
            expect(ics).toContain('DTSTART;VALUE=DATE:20260704');
            // end date should be 2026-07-05
            expect(ics).toContain('DTEND;VALUE=DATE:20260705');
            expect(ics).toContain('SUMMARY:Lunch');
            expect(ics).toContain('END:VEVENT');
            expect(ics).toContain('END:VCALENDAR');
        });
    });

    describe('buildCalendarEventDetails', () => {
        it('constructs correct title and description from group data', () => {
            const group = {
                name: 'Hawaii Trip',
                description: 'Pack your bags!',
            };
            const overlap = {
                startDate: '2026-08-01',
                endDate: '2026-08-10',
                availableCount: 4,
            };

            const details = buildCalendarEventDetails(group, overlap, 5);
            expect(details.title).toBe('Hawaii Trip');
            expect(details.startDate).toBe('2026-08-01');
            expect(details.endDate).toBe('2026-08-10');

            // Date formatting check (Aug 1 - Aug 10)
            expect(details.description).toContain('Saturday, August 1, 2026');
            expect(details.description).toContain('Monday, August 10, 2026');
            expect(details.description).toContain('4/5 participants available');
            expect(details.description).toContain('findadate.app');
        });

        it('handles missing optional fields safely', () => {
            const group = {};
            const overlap = { startDate: '2026-01-01' };
            const details = buildCalendarEventDetails(group, overlap, 2);

            expect(details.title).toBe('FindADate Event');
            expect(details.startDate).toBe('2026-01-01');
            expect(details.endDate).toBe('2026-01-01');
            expect(details.description).toContain('0/2 participants available');
        });
    });
});
