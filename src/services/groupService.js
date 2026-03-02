import { ref, set, get, update, remove, onValue, off } from 'firebase/database';
import { database } from './firebaseConfig';
import { hashPhrase } from './adminService';

export const createGroup = async (groupData) => {
  try {
    const name = String(groupData.name || '').trim().slice(0, 100);
    const description = String(groupData.description || '').trim().slice(0, 1000);
    const startDate = String(groupData.startDate || '').slice(0, 10);
    const endDate = String(groupData.endDate || '').slice(0, 10);
    const adminEmail = String(groupData.adminEmail || '').trim().slice(0, 255);
    const recoveryPasswordHash = groupData.recoveryPasswordHash
      ? String(groupData.recoveryPasswordHash).slice(0, 64)
      : null;

    if (!name || !startDate || !endDate) {
      throw new Error('Name, start date, and end date are required.');
    }

    const groupId = crypto.randomUUID();
    const adminToken = crypto.randomUUID();
    const adminTokenHash = await hashPhrase(adminToken);
    if (!adminTokenHash) {
      throw new Error('Failed to generate admin token hash');
    }
    const groupRef = ref(database, `groups/${groupId}`);
    const groupPayload = {
      name,
      description,
      startDate,
      endDate,
      adminEmail,
      createdAt: new Date().toISOString(),
      id: groupId,
      adminTokenHash,
    };
    if (recoveryPasswordHash) {
      groupPayload.recoveryPasswordHash = recoveryPasswordHash;
    }
    await set(groupRef, groupPayload);
    return { groupId, adminToken };
  } catch (error) {
    console.error("Error creating group:", error);
    throw new Error(`Failed to create group: ${error.message}`);
  }
};

export const getGroup = async (groupId) => {
  try {
    const groupRef = ref(database, `groups/${groupId}`);
    const snapshot = await get(groupRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error(`Failed to getGroup ${groupId}:`, error);
    throw new Error(`Failed to getGroup ${groupId}: ${error.message}`);
  }
};

export const updateGroup = async (groupId, updates) => {
  try {
    const { adminTokenHash, ...safeUpdates } = updates;
    const groupRef = ref(database, `groups/${groupId}`);
    await update(groupRef, safeUpdates);
  } catch (error) {
    console.error(`Failed to updateGroup ${groupId}:`, error);
    throw new Error(`Failed to updateGroup ${groupId}: ${error.message}`);
  }
};

export const deleteGroup = async (groupId) => {
  try {
    const groupRef = ref(database, `groups/${groupId}`);
    await remove(groupRef);
  } catch (error) {
    console.error(`Failed to deleteGroup ${groupId}:`, error);
    throw new Error(`Failed to deleteGroup ${groupId}: ${error.message}`);
  }
};

export const subscribeToGroup = (groupId, callback) => {
  const groupRef = ref(database, `groups/${groupId}`);
  const unsubscribe = onValue(groupRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  }, (error) => {
    console.error("Group sync error:", error);
  });
  return unsubscribe;
};
