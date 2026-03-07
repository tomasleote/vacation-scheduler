import { calculateOverlap } from '../../utils/overlap';
import { generateTestGroup } from '../../utils/testDataGenerator';

describe('Overlap Performance Benchmarks', () => {
    const scenarios = [
        { name: 'Small (10p x 30d)',    participants: 10,  days: 30,  maxMs: 10  },
        { name: 'Medium (50p x 90d)',   participants: 50,  days: 90,  maxMs: 30  },
        { name: 'Large (100p x 180d)',  participants: 100, days: 180, maxMs: 75  },
        { name: 'Stress (200p x 365d)', participants: 200, days: 365, maxMs: 150 },
    ];

    scenarios.forEach(({ name, participants: pCount, days, maxMs }) => {
        test(`${name}: calculateOverlap completes within ${maxMs}ms`, () => {
            const endDate = new Date('2026-01-01');
            endDate.setDate(endDate.getDate() + days - 1);
            const endDateStr = endDate.toISOString().split('T')[0];

            const { participants, availabilityMap } = generateTestGroup({
                participantCount: pCount,
                startDate: '2026-01-01',
                endDate: endDateStr,
            });

            const start = performance.now();
            const results = calculateOverlap(
                participants,
                availabilityMap,
                '2026-01-01',
                endDateStr,
                3
            );
            const elapsed = performance.now() - start;

            console.log(`${name}: ${elapsed.toFixed(1)}ms`);
            expect(elapsed).toBeLessThan(maxMs);
            expect(results).toBeDefined();
        });
    });
});
