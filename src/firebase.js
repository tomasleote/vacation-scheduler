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

export const createGroup = async (groupData) => {
  try {
    const groupId = Date.now().toString();
    const groupRef = ref(database, `groups/${groupId}`);
    await set(groupRef, {
      ...groupData,
      createdAt: new Date().toISOString(),
      id: groupId
    });
    return groupId;
  } catch (error) {
    console.error("Error creating group:", error);
    throw new Error(`Failed to create group: ${error.message}`);
  }
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
  const participantId = Date.now().toString();
  const participantRef = ref(database, `groups/${groupId}/participants/${participantId}`);
  await set(participantRef, {
    ...participantData,
    id: participantId,
    createdAt: new Date().toISOString()
  });
  return participantId;
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
