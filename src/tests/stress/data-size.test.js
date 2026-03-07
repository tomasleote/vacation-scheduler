import { generateTestGroup } from '../../utils/testDataGenerator';

describe('Data Size Estimation', () => {
    const scenarios = [
        { participants: 10,  days: 30  },
        { participants: 50,  days: 90  },
        { participants: 100, days: 180 },
        { participants: 200, days: 365 },
    ];

    scenarios.forEach(({ participants: pCount, days }) => {
        test(`${pCount} participants x ${days} days: metadata-only payload is smaller than embedded`, () => {
            const endDate = new Date('2026-01-01');
            endDate.setDate(endDate.getDate() + days - 1);

            const { participants, availabilityMap } = generateTestGroup({
                participantCount: pCount,
                startDate: '2026-01-01',
                endDate: endDate.toISOString().split('T')[0],
            });

            // Old architecture: availability embedded in each participant object
            const oldArchitecture = participants.map(p => ({
                ...p,
                availableDays: Object.keys(availabilityMap[p.id] || {}),
            }));
            const oldJson = JSON.stringify(oldArchitecture);
            const oldSizeKB = (oldJson.length / 1024).toFixed(1);

            // New architecture (PRP2): metadata in participants, availability separate
            const newParticipants = JSON.stringify(participants);
            const newAvailability = JSON.stringify(availabilityMap);
            const newMetaSizeKB = (newParticipants.length / 1024).toFixed(1);
            const newAvailSizeKB = (newAvailability.length / 1024).toFixed(1);

            const reductionPct = ((1 - newParticipants.length / oldJson.length) * 100).toFixed(0);

            console.log(`${pCount}p x ${days}d:`);
            console.log(`  Old (embedded):              ${oldSizeKB} KB`);
            console.log(`  New participants (metadata): ${newMetaSizeKB} KB (${reductionPct}% reduction)`);
            console.log(`  New availability (separate): ${newAvailSizeKB} KB`);

            // Loading participants (for list/table) is dramatically cheaper with new architecture
            expect(newParticipants.length).toBeLessThan(oldJson.length);
        });
    });
});
