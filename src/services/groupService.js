import { ref, set, get, update, remove, onValue, off } from 'firebase/database';
import { database } from './firebaseConfig';
import { hashPhrase } from './adminService';
import { MAX_DATE_RANGE_DAYS } from '../utils/constants/validation';

export const createGroup = async (groupData) => {
  try {
    const name = String(groupData.name || '').trim().slice(0, 100);
    const description = String(groupData.description || '').trim().slice(0, 1000);
    const startDate = String(groupData.startDate || '').slice(0, 10);
    const endDate = String(groupData.endDate || '').slice(0, 10);
    const ALLOWED_EVENT_TYPES = ['vacation', 'dinner', 'party', 'gamenight', 'team', 'other'];
    const incomingEventType = String(groupData.eventType || '').trim().toLowerCase();
    const eventType = ALLOWED_EVENT_TYPES.includes(incomingEventType) ? incomingEventType : 'vacation';
    const adminEmail = String(groupData.adminEmail || '').trim().slice(0, 255);
    const recoveryPasswordHash = groupData.recoveryPasswordHash
      ? String(groupData.recoveryPasswordHash).slice(0, 64)
      : null;

    if (!name || !startDate || !endDate) {
      throw new Error('Name, start date, and end date are required.');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const rangeDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    if (rangeDays < 1) {
      throw new Error('End date must be after start date.');
    }
    if (rangeDays > MAX_DATE_RANGE_DAYS) {
      throw new Error(`Date range cannot exceed ${MAX_DATE_RANGE_DAYS} days.`);
    }

    const groupId = crypto.randomUUID();
    const adminToken = crypto.randomUUID();
    const adminTokenHash = await hashPhrase(adminToken);
    if (!adminTokenHash) {
      throw new Error('Failed to generate admin token hash');
    }
    const sanitizeLocation = (loc) => {
      if (!loc || typeof loc !== 'object') return null;
      const s = (val, max = 255) => typeof val === 'string' ? val.trim().slice(0, max) : null;
      const n = (val) => typeof val === 'number' && !isNaN(val) ? Number(val.toFixed(6)) : null;
      return {
        placeId: s(loc.placeId),
        name: s(loc.name),
        formattedAddress: s(loc.formattedAddress, 500),
        street: s(loc.street),
        city: s(loc.city),
        state: s(loc.state),
        country: s(loc.country),
        zip: s(loc.zip, 20),
        lat: n(loc.lat),
        lng: n(loc.lng),
      };
    };

    const location = sanitizeLocation(groupData.location);
    const groupRef = ref(database, `groups/${groupId}/meta`);
    const groupPayload = {
      name,
      description,
      location,
      startDate,
      endDate,
      eventType,
      adminEmail,
      createdAt: new Date().toISOString(),
      id: groupId,
      adminTokenHash,
    };
    if (recoveryPasswordHash) {
      groupPayload.recoveryPasswordHash = recoveryPasswordHash;
    }
    // Also write top-level static attributes to `groups/${groupId}` for easier listing/deletion and rules
    const rootUpdates = {
      [`groups/${groupId}/id`]: groupId,
      [`groups/${groupId}/createdAt`]: groupPayload.createdAt,
      [`groups/${groupId}/adminTokenHash`]: adminTokenHash,
    };
    await update(ref(database), rootUpdates);
    await set(groupRef, groupPayload);
    return { groupId, adminToken };
  } catch (error) {
    console.error("Error creating group:", error);
    throw new Error(`Failed to create group: ${error.message}`);
  }
};

export const getGroup = async (groupId) => {
  try {
    const groupRef = ref(database, `groups/${groupId}/meta`);
    const snapshot = await get(groupRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error(`Failed to getGroup ${groupId}:`, error);
    throw new Error(`Failed to getGroup ${groupId}: ${error.message}`);
  }
};

export const updateGroup = async (groupId, adminToken, updates) => {
  try {
    const { adminTokenHash, ...safeUpdates } = updates;
    const response = await fetch('/api/admin-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groupId,
        adminToken,
        action: 'updateGroup',
        payload: safeUpdates
      })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update group');
    }
  } catch (error) {
    console.error(`Failed to updateGroup ${groupId}:`, error);
    throw new Error(`Failed to updateGroup ${groupId}: ${error.message}`);
  }
};

export const deleteGroup = async (groupId, adminToken) => {
  try {
    const response = await fetch('/api/admin-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groupId,
        adminToken,
        action: 'deleteGroup'
      })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete group');
    }
  } catch (error) {
    console.error(`Failed to deleteGroup ${groupId}:`, error);
    throw new Error(`Failed to deleteGroup ${groupId}: ${error.message}`);
  }
};

export const subscribeToGroup = (groupId, callback, onError) => {
  const groupRef = ref(database, `groups/${groupId}/meta`);
  const unsubscribe = onValue(groupRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  }, (error) => {
    console.error("Group sync error:", error);
    if (onError) onError(error);
  });
  return unsubscribe;
};
