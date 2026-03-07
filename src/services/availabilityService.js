import { ref, set, onValue, off } from 'firebase/database';
import { database } from './firebaseConfig';

/**
 * Saves availability data for a single participant into a granular object.
 * @param {string} groupId 
 * @param {string} participantId 
 * @param {string[]} days Array of date strings (e.g. ['2026-01-15', '2026-01-16'])
 */
export const saveAvailability = async (groupId, participantId, days) => {
    const availRef = ref(database, `groups/${groupId}/availability/${participantId}`);

    // Convert array of dates to object { "YYYY-MM-DD": true }
    const daysObj = {};
    if (Array.isArray(days)) {
        days.forEach(d => {
            if (d && typeof d === 'string') {
                daysObj[d] = true;
            }
        });
    }

    await set(availRef, daysObj);
};

/**
 * Subscribes to the availability node for the entire group.
 * Overlap/Heatmap relies on this mapping vs parsing everyone's metadata object.
 */
export const subscribeToAvailability = (groupId, callback, onError) => {
    const availRef = ref(database, `groups/${groupId}/availability`);
    const unsubscribe = onValue(availRef, (snapshot) => {
        callback(snapshot.exists() ? snapshot.val() : {});
    }, (error) => {
        console.error("Availability sync error:", error);
        if (onError) onError(error);
    });
    return unsubscribe;
};
