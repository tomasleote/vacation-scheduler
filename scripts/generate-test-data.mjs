/**
 * Standalone ESM script for seeding Firebase Emulator with stress test data.
 *
 * Usage (standalone):
 *   node scripts/generate-test-data.mjs
 *
 * Usage (programmatic, with adminDb):
 *   import { seedEmulator } from './scripts/generate-test-data.mjs';
 *   await seedEmulator(adminDb, { participantCount: 50 });
 *
 * Run integration tests with:
 *   firebase emulators:exec "npm run test:stress:integration"
 */

function getDatesBetween(startDate, endDate) {
    const dates = [];
    const current = new Date(startDate);
    while (current <= new Date(endDate)) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }
    return dates;
}

/**
 * @param {Object} options
 * @param {number} options.participantCount
 * @param {string} options.startDate
 * @param {string} options.endDate
 * @param {number} options.availabilityRate
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

/**
 * Seeds the Firebase Emulator with a synthetic group for integration testing.
 * Writes to groups/{groupId} and availability/{groupId} paths.
 *
 * @param {import('firebase-admin').database.Database} adminDb
 * @param {Object} options - same as generateTestGroup options
 * @returns {{ groupId: string, participantCount: number }}
 */
export async function seedEmulator(adminDb, options) {
    const { group, participants, availabilityMap } = generateTestGroup(options);

    await adminDb.ref(`groups/${group.id}`).set(group);

    const participantUpdates = {};
    participants.forEach(p => { participantUpdates[p.id] = p; });
    await adminDb.ref(`groups/${group.id}/participants`).set(participantUpdates);

    const availabilityUpdates = {};
    participants.forEach(p => {
        availabilityUpdates[p.id] = availabilityMap[p.id];
    });
    await adminDb.ref(`availability/${group.id}`).set(availabilityUpdates);

    return { groupId: group.id, participantCount: participants.length };
}
