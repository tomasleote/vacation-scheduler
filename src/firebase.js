import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, update, remove, child } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDemoKey123456789",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "vacation-scheduler-demo.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "vacation-scheduler-demo",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "vacation-scheduler-demo.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || `https://${process.env.REACT_APP_FIREBASE_PROJECT_ID || "vacation-scheduler-demo"}.firebaseio.com`
};

// Debug: Log config (remove in production)
console.log("Firebase initialized with projectId:", firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);

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
    const groupId = Date.now().toString();
    const adminToken = crypto.randomUUID();
    const adminTokenHash = await hashAdminToken(adminToken);
    const groupRef = ref(database, `groups/${groupId}`);
    // Store the hash of the admin token, never the raw token itself.
    // The hash is safe to be public: SHA-256 of a UUID is computationally irreversible.
    await set(groupRef, {
      ...groupData,
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
  const groupRef = ref(database, `groups/${groupId}`);
  await update(groupRef, updates);
};

export const addParticipant = async (groupId, participantData) => {
  const existing = await getParticipants(groupId);
  const normalizedNew = participantData.name.trim().toLowerCase();
  if (existing.some(p => p.name.trim().toLowerCase() === normalizedNew)) {
    throw new Error('A participant with this name already exists. Please choose another name.');
  }

  const participantId = Date.now().toString();
  const participantRef = ref(database, `groups/${groupId}/participants/${participantId}`);
  await set(participantRef, {
    ...participantData,
    id: participantId,
    createdAt: new Date().toISOString()
  });
  return participantId;
};

export const updateParticipant = async (groupId, participantId, updates) => {
  if (updates.name !== undefined) {
    const existing = await getParticipants(groupId);
    const normalizedNew = updates.name.trim().toLowerCase();
    if (existing.some(p => p.name.trim().toLowerCase() === normalizedNew && p.id !== participantId)) {
      throw new Error('A participant with this name already exists. Please choose another name.');
    }
  }

  const participantRef = ref(database, `groups/${groupId}/participants/${participantId}`);
  await update(participantRef, updates);
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
