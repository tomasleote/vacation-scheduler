import { ref, get, update, remove, runTransaction, onValue, off } from 'firebase/database';
import { database } from './firebaseConfig';

export const addParticipant = async (groupId, participantData) => {
  const name = String(participantData.name || '').trim().slice(0, 100);
  if (!name) throw new Error('A participant name is required.');

  const email = String(participantData.email || '').trim().slice(0, 255);
  const duration = parseInt(participantData.duration, 10) || 3;
  const blockType = String(participantData.blockType || 'flexible').slice(0, 50);

  let availableDays = Array.isArray(participantData.availableDays) ? participantData.availableDays : [];
  availableDays = availableDays.slice(0, 365).map(d => String(d).slice(0, 10));

  const participantId = crypto.randomUUID();
  const normalizedNew = name.toLowerCase();

  const participantsRef = ref(database, `groups/${groupId}/participants`);

  const transactionResult = await runTransaction(participantsRef, (currentParticipants) => {
    if (!currentParticipants) {
      currentParticipants = {};
    }
    const existing = Object.values(currentParticipants);
    if (existing.some(p => p.name && p.name.trim().toLowerCase() === normalizedNew)) {
      return;
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
        return;
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

export const deleteParticipant = async (groupId, participantId) => {
  const participantRef = ref(database, `groups/${groupId}/participants/${participantId}`);
  await remove(participantRef);
};

export const subscribeToParticipants = (groupId, callback) => {
  const participantRef = ref(database, `groups/${groupId}/participants`);
  const unsubscribe = onValue(participantRef, (snapshot) => {
    callback(snapshot.exists() ? Object.values(snapshot.val()) : []);
  }, (error) => {
    console.error("Participants sync error:", error);
  });
  return unsubscribe;
};
