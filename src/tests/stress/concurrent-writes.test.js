/**
 * Integration test: requires Firebase Emulator running on port 9000.
 *
 * Start emulator and run:
 *   firebase emulators:exec "npm run test:stress:integration"
 *
 * Or manually:
 *   firebase emulators:start --only database
 *   FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:9000 npm test -- --watchAll=false --testPathPattern=concurrent-writes
 *
 * Tests validate that concurrent participant submissions don't cause data loss.
 */

const EMULATOR_HOST = process.env.FIREBASE_DATABASE_EMULATOR_HOST;

// Skip entire suite when emulator is not running (normal CI / unit test runs)
const describeIf = EMULATOR_HOST ? describe : describe.skip;

describeIf('Concurrent Write Stress Tests (requires Firebase Emulator)', () => {
    let adminDb;
    let testGroupId;

    beforeAll(async () => {
        // Dynamic import to avoid errors when firebase-admin is not configured
        const admin = await import('firebase-admin');
        if (!admin.apps.length) {
            admin.initializeApp({ databaseURL: `http://${EMULATOR_HOST}/?ns=find-a-day-test` });
        }
        adminDb = admin.database();
    });

    beforeEach(async () => {
        // Create a fresh group for each test
        testGroupId = `test-group-${Date.now()}`;
        await adminDb.ref(`groups/${testGroupId}`).set({
            name: 'Concurrent Test Group',
            startDate: '2026-01-01',
            endDate: '2026-01-31',
        });
    });

    afterEach(async () => {
        // Clean up test data
        await adminDb.ref(`groups/${testGroupId}`).remove();
    });

    test('50 simultaneous participant writes: all succeed without data loss', async () => {
        const CONCURRENT_COUNT = 50;

        const writes = Array.from({ length: CONCURRENT_COUNT }, (_, i) =>
            adminDb.ref(`groups/${testGroupId}/participants/participant-${i}`).set({
                id: `participant-${i}`,
                name: `Concurrent User ${i}`,
                email: `concurrent${i}@test.com`,
                duration: 3,
                createdAt: new Date().toISOString(),
            })
        );

        const results = await Promise.allSettled(writes);
        const successes = results.filter(r => r.status === 'fulfilled');
        const failures = results.filter(r => r.status === 'rejected');

        console.log(`Writes: ${successes.length} succeeded, ${failures.length} failed`);
        expect(successes.length).toBe(CONCURRENT_COUNT);

        const snapshot = await adminDb.ref(`groups/${testGroupId}/participants`).once('value');
        const participants = snapshot.val();
        expect(Object.keys(participants).length).toBe(CONCURRENT_COUNT);
    });

    test('Duplicate participant id writes: last write wins (Firebase RTDB behavior)', async () => {
        const CONCURRENT_COUNT = 10;

        const writes = Array.from({ length: CONCURRENT_COUNT }, (_, i) =>
            adminDb.ref(`groups/${testGroupId}/participants/same-id`).set({
                id: 'same-id',
                name: `Version ${i}`,
                createdAt: new Date().toISOString(),
            })
        );

        const results = await Promise.allSettled(writes);
        const successes = results.filter(r => r.status === 'fulfilled');
        expect(successes.length).toBe(CONCURRENT_COUNT);

        const snapshot = await adminDb.ref(`groups/${testGroupId}/participants/same-id`).once('value');
        const participant = snapshot.val();
        // Exactly one record should exist (last write wins)
        expect(participant).not.toBeNull();
        expect(participant.id).toBe('same-id');
    });
});
