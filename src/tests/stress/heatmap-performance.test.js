import { generateTestGroup } from '../../utils/testDataGenerator';

describe('Heatmap Computation Benchmarks', () => {
    test('dailyAvailability with Sets: 200p x 365d under 50ms', () => {
        const { participants, availabilityMap, dateRange } = generateTestGroup({
            participantCount: 200,
            startDate: '2026-01-01',
            endDate: '2026-12-31',
        });

        const start = performance.now();

        // Set-based O(N*D) computation -- the optimized approach
        const pSets = participants.map(p => new Set(Object.keys(availabilityMap[p.id] || {})));
        const counts = {};
        dateRange.forEach(dateStr => {
            let count = 0;
            pSets.forEach(s => { if (s.has(dateStr)) count++; });
            counts[dateStr] = count;
        });

        const elapsed = performance.now() - start;
        console.log(`Set-based heatmap (200p x 365d): ${elapsed.toFixed(1)}ms`);
        expect(elapsed).toBeLessThan(50);
        expect(Object.keys(counts).length).toBe(new Set(dateRange).size);
    });

    test('dailyAvailability with Array.includes: 200p x 365d (slow baseline)', () => {
        const { participants, availabilityMap, dateRange } = generateTestGroup({
            participantCount: 200,
            startDate: '2026-01-01',
            endDate: '2026-12-31',
        });

        // Convert to arrays to simulate the old Array.includes approach
        const participantsWithArrays = participants.map(p => ({
            ...p,
            availableDays: Object.keys(availabilityMap[p.id] || {}),
        }));

        const start = performance.now();

        const counts = {};
        dateRange.forEach(dateStr => {
            let count = 0;
            participantsWithArrays.forEach(p => {
                if ((p.availableDays || []).includes(dateStr)) count++;
            });
            counts[dateStr] = count;
        });

        const elapsed = performance.now() - start;
        // No timing assertion -- this documents the slow baseline for comparison
        console.log(`Array.includes baseline (200p x 365d): ${elapsed.toFixed(1)}ms`);
        expect(Object.keys(counts).length).toBe(new Set(dateRange).size);
    });
});

