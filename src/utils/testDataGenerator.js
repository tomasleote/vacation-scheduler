import { getDatesBetween } from './overlap';

/**
 * Generates synthetic group data for stress testing.
 * Returns participants (metadata only) and availabilityMap
 * matching the PRP2 data architecture: { [participantId]: { [dateStr]: true } }
 *
 * @param {Object} options
 * @param {number} options.participantCount
 * @param {string} options.startDate - ISO date string (YYYY-MM-DD)
 * @param {string} options.endDate - ISO date string (YYYY-MM-DD)
 * @param {number} options.availabilityRate - Fraction of dates available (0-1)
 * @returns {{ group, participants, availabilityMap, dateRange }}
 */
export function generateTestGroup({
    participantCount = 50,
    startDate = '2026-01-01',
    endDate = '2026-06-30',
    availabilityRate = 0.6,
} = {}) {
    const dateRange = getDatesBetween(startDate, endDate);

    const group = {
        id: `test-group-${Date.now()}`,
        name: `Stress Test Group (${participantCount}p)`,
        description: 'Auto-generated for stress testing',
        startDate,
        endDate,
        eventType: 'vacation',
        createdAt: new Date().toISOString(),
    };

    const participants = Array.from({ length: participantCount }, (_, i) => ({
        id: `participant-${i}`,
        name: `Test User ${i}`,
        email: `user${i}@test.com`,
        duration: 3,
        blockType: 'flexible',
        createdAt: new Date().toISOString(),
    }));

    // availabilityMap matches the architecture used by calculateOverlap:
    // { [participantId]: { [dateStr]: true } }
    const availabilityMap = {};
    participants.forEach(p => {
        availabilityMap[p.id] = {};
        dateRange.forEach(dateStr => {
            if (Math.random() < availabilityRate) {
                availabilityMap[p.id][dateStr] = true;
            }
        });
    });

    return { group, participants, availabilityMap, dateRange };
}
