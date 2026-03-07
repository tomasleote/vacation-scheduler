import { ref, update, onValue } from 'firebase/database';
import { database } from './firebaseConfig';

/**
 * Synchronously computes delta between old and new days and applies them to `/dailyCounts`.
 * We use `update` incrementally since we only manipulate integer counts.
 */
export const updateDailyCounts = async (groupId, oldDays = [], newDays = []) => {
    const countsRef = ref(database, `groups/${groupId}/dailyCounts`);

    // Convert arrays into Set differences to find what got added vs removed.
    const oldSet = new Set(oldDays);
    const newSet = new Set(newDays);

    const added = [...newSet].filter(x => !oldSet.has(x));
    const removed = [...oldSet].filter(x => !newSet.has(x));

    if (added.length === 0 && removed.length === 0) {
        return; // No-op
    }

    try {
        // Since we don't know the exact count locally, we use the ServerValue.increment primitive.
        // However, standard database.js syntax in Firebase 9+ for increment relies on `increment()` function.
        // Let's import increment later or use numeric updates safely.
        // For standard client SDK without needing Admin logic, multi-path update + transaction can be messy.
        // We will read the whole dailyCounts object, do the math locally, and write back. 
        // This is safe since we don't have extremely high parallel concurrency rewriting overlapping days constantly.
        // Alternatively, use transactions per day.

        // Simpler, less contentious approach: run a single read -> compute -> multi-path update.
        // For reliability, we will import and use `increment()` from 'firebase/database' inside the update payload.
        const { increment } = await import('firebase/database');

        const updates = {};
        for (const day of added) {
            updates[day] = increment(1);
        }
        for (const day of removed) {
            updates[day] = increment(-1);
        }

        await update(countsRef, updates);
    } catch (error) {
        console.error("Failed to update dailyCounts:", error);
        throw error;
    }
};

/**
 * Rapid lightweight subscription for rendering the heatmap without any participant parsing.
 */
export const subscribeToDailyCounts = (groupId, callback, onError) => {
    const countsRef = ref(database, `groups/${groupId}/dailyCounts`);
    const unsubscribe = onValue(countsRef, (snapshot) => {
        callback(snapshot.exists() ? snapshot.val() : {});
    }, (error) => {
        console.error("Daily counts sync error:", error);
        if (onError) onError(error);
    });
    return unsubscribe;
};
