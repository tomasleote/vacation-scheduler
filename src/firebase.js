import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, update, remove, child, runTransaction, onValue, off } from 'firebase/database';


const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDemoKey123456789",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "vacation-scheduler-demo.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "vacation-scheduler-demo",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "vacation-scheduler-demo.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || `https://${process.env.REACT_APP_FIREBASE_PROJECT_ID || "vacation-scheduler-demo"}.firebaseio.com`
};



const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);

// Produces a hex-encoded SHA-256 digest of a token using the browser's Web Crypto API.
// The raw adminToken never enters the database — only this irreversible hash does.
const hashAdminToken = async (token) => {
  const data = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export const createGroup = async (groupData) => {
  try {
    // Hardening: validate and sanitize inputs
    const name = String(groupData.name || '').trim().slice(0, 100);
    const description = String(groupData.description || '').trim().slice(0, 1000);
    const startDate = String(groupData.startDate || '').slice(0, 10);
    const endDate = String(groupData.endDate || '').slice(0, 10);
    const adminEmail = String(groupData.adminEmail || '').trim().slice(0, 255);

    if (!name || !startDate || !endDate) {
      throw new Error('Name, start date, and end date are required.');
    }

    const groupId = crypto.randomUUID();
    const adminToken = crypto.randomUUID();
    const adminTokenHash = await hashAdminToken(adminToken);
    if (!adminTokenHash) {
      throw new Error('Failed to generate admin token hash');
    }
    const groupRef = ref(database, `groups/${groupId}`);
    // Store the hash of the admin token, never the raw token itself.
    // The hash is safe to be public: SHA-256 of a UUID is computationally irreversible.
    await set(groupRef, {
      name,
      description,
      startDate,
      endDate,
      adminEmail,
      createdAt: new Date().toISOString(),
      id: groupId,
      adminTokenHash
    });
    return { groupId, adminToken };
  } catch (error) {
    console.error("Error creating group:", error);
    throw new Error(`Failed to create group: ${error.message}`);
  }
};

// Validates by hashing the provided token and comparing against the stored hash.
// No Cloud Function or Blaze plan required — runs entirely client-side.
export const validateAdminToken = async (groupId, providedToken) => {
  const group = await getGroup(groupId);
  if (!group || !group.adminTokenHash) return false;
  const providedHash = await hashAdminToken(providedToken);
  return providedHash === group.adminTokenHash;
};

export const getGroup = async (groupId) => {
  const groupRef = ref(database, `groups/${groupId}`);
  const snapshot = await get(groupRef);
  return snapshot.exists() ? snapshot.val() : null;
};

export const updateGroup = async (groupId, updates) => {
  // Never allow adminTokenHash to be overwritten through regular updates
  const { adminTokenHash, ...safeUpdates } = updates;
  const groupRef = ref(database, `groups/${groupId}`);
  await update(groupRef, safeUpdates);
};

export const addParticipant = async (groupId, participantData) => {
  // Hardening: validate and sanitize inputs
  const name = String(participantData.name || '').trim().slice(0, 100);
  if (!name) throw new Error('A participant name is required.');

  const email = String(participantData.email || '').trim().slice(0, 255);
  const duration = parseInt(participantData.duration, 10) || 3;
  const blockType = String(participantData.blockType || 'flexible').slice(0, 50);

  let availableDays = Array.isArray(participantData.availableDays) ? participantData.availableDays : [];
  // Cap at max 365 days, slice strings to prevent massive payloads
  availableDays = availableDays.slice(0, 365).map(d => String(d).slice(0, 10));

  const participantId = crypto.randomUUID();
  const normalizedNew = name.toLowerCase();

  const participantsRef = ref(database, `groups/${groupId}/participants`);

  // Concurrency check: Ensure no race conditions for participant names
  const transactionResult = await runTransaction(participantsRef, (currentParticipants) => {
    if (!currentParticipants) {
      currentParticipants = {};
    }
    const existing = Object.values(currentParticipants);
    if (existing.some(p => p.name && p.name.trim().toLowerCase() === normalizedNew)) {
      return; // Return undefined to abort transaction
    }

    currentParticipants[participantId] = {
      name,
      email,
      duration,
      blockType,
      availableDays,
      id: participantId,
      createdAt: new Date().toISOString()
    };
    return currentParticipants;
  });

  if (!transactionResult.committed) {
    throw new Error('A participant with this name already exists. Please choose another name.');
  }

  return participantId;
};

export const updateParticipant = async (groupId, participantId, updates) => {
  // Hardening
  const safeUpdates = { ...updates };
  if (safeUpdates.name !== undefined) safeUpdates.name = String(safeUpdates.name).trim().slice(0, 100);
  if (safeUpdates.email !== undefined) safeUpdates.email = String(safeUpdates.email).trim().slice(0, 255);
  if (safeUpdates.duration !== undefined) safeUpdates.duration = parseInt(safeUpdates.duration, 10) || 3;
  if (safeUpdates.blockType !== undefined) safeUpdates.blockType = String(safeUpdates.blockType).slice(0, 50);
  if (Array.isArray(safeUpdates.availableDays)) {
    safeUpdates.availableDays = safeUpdates.availableDays.slice(0, 365).map(d => String(d).slice(0, 10));
  }

  if (safeUpdates.name !== undefined) {
    const normalizedNew = safeUpdates.name.toLowerCase();
    const participantsRef = ref(database, `groups/${groupId}/participants`);

    const transactionResult = await runTransaction(participantsRef, (currentParticipants) => {
      if (!currentParticipants) return currentParticipants;
      const existing = Object.values(currentParticipants);
      if (existing.some(p => p.name && p.name.trim().toLowerCase() === normalizedNew && p.id !== participantId)) {
        return; // Abort
      }
      if (currentParticipants[participantId]) {
        currentParticipants[participantId] = { ...currentParticipants[participantId], ...safeUpdates };
      }
      return currentParticipants;
    });

    if (!transactionResult.committed) {
      throw new Error('A participant with this name already exists. Please choose another name.');
    }
  } else {
    const participantRef = ref(database, `groups/${groupId}/participants/${participantId}`);
    await update(participantRef, safeUpdates);
  }
};

export const getParticipant = async (groupId, participantId) => {
  const participantRef = ref(database, `groups/${groupId}/participants/${participantId}`);
  const snapshot = await get(participantRef);
  return snapshot.exists() ? snapshot.val() : null;
};

export const getParticipants = async (groupId) => {
  const participantRef = ref(database, `groups/${groupId}/participants`);
  const snapshot = await get(participantRef);
  return snapshot.exists() ? Object.values(snapshot.val()) : [];
};

export const deleteGroup = async (groupId) => {
  const groupRef = ref(database, `groups/${groupId}`);
  await remove(groupRef);
};

export const deleteParticipant = async (groupId, participantId) => {
  const participantRef = ref(database, `groups/${groupId}/participants/${participantId}`);
  await remove(participantRef);
};

// Real-time subscribers
export const subscribeToGroup = (groupId, callback) => {
  const groupRef = ref(database, `groups/${groupId}`);
  const listener = onValue(groupRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  }, (error) => {
    console.error("Group sync error:", error);
  });
  return () => off(groupRef, 'value', listener);
};

export const subscribeToParticipants = (groupId, callback) => {
  const participantRef = ref(database, `groups/${groupId}/participants`);
  const listener = onValue(participantRef, (snapshot) => {
    callback(snapshot.exists() ? Object.values(snapshot.val()) : []);
  }, (error) => {
    console.error("Participants sync error:", error);
  });
  return () => off(participantRef, 'value', listener);
};
