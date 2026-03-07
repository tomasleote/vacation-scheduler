import { ref, set, remove, onValue } from 'firebase/database';
import { database } from './firebaseConfig';
import { MAX_POLL_CANDIDATES, MAX_VOTES_PER_PARTICIPANT } from '../utils/constants/validation';

/**
 * Creates a new poll under groups/{groupId}/poll.
 * Overwrites any existing poll (one at a time enforced by data structure).
 *
 * @param {string} groupId
 * @param {{ mode: 'single'|'multi', candidates: Array<{startDate:string, endDate:string}> }} options
 * @returns {Promise<string>} pollId
 */
export const createPoll = async (groupId, { mode, candidates }) => {
  if (candidates.length > MAX_POLL_CANDIDATES) {
    throw new Error(`Cannot create a poll with more than ${MAX_POLL_CANDIDATES} candidates.`);
  }

  const pollId = crypto.randomUUID();

  const candidatesObj = {};
  candidates.forEach((c, i) => {
    const id = crypto.randomUUID();
    candidatesObj[id] = {
      startDate: c.startDate,
      endDate: c.endDate,
      label: i + 1,
    };
  });

  await set(ref(database, `groups/${groupId}/poll`), {
    id: pollId,
    status: 'active',
    mode,
    createdAt: new Date().toISOString(),
    closedAt: null,
    candidates: candidatesObj,
    votes: null, // Firebase omits null; votes node created on first vote
  });

  return pollId;
};

/**
 * Marks the poll as closed.
 */
export const closePoll = async (groupId) => {
  const pollRef = ref(database, `groups/${groupId}/poll`);
  await import('firebase/database').then(({ update }) => {
    update(pollRef, {
      status: 'closed',
      closedAt: new Date().toISOString()
    });
  });
};

/**
 * Deletes the entire poll node (admin cancel).
 */
export const deletePoll = async (groupId) => {
  await remove(ref(database, `groups/${groupId}/poll`));
};

/**
 * Writes or overwrites a participant's vote.
 * In single mode, candidateIds has one entry.
 * In multi mode, candidateIds can have multiple entries.
 * To remove all votes, pass candidateIds = [].
 * Note: Firebase does not allow empty arrays; pass null to clear.
 *
 * @param {string} groupId
 * @param {string} participantId
 * @param {string[]} candidateIds
 */
export const submitVote = async (groupId, participantId, candidateIds) => {
  if (candidateIds.length > MAX_VOTES_PER_PARTICIPANT) {
    throw new Error(`Cannot vote for more than ${MAX_VOTES_PER_PARTICIPANT} candidates.`);
  }

  const voteRef = ref(database, `groups/${groupId}/poll/votes/${participantId}`);
  if (candidateIds.length === 0) {
    await remove(voteRef);
  } else {
    await set(voteRef, {
      candidateIds,
      votedAt: new Date().toISOString(),
    });
  }
};

/**
 * Subscribes to real-time poll updates.
 *
 * @param {string} groupId
 * @param {function} callback - called with poll object or null
 * @param {function} [onError]
 * @returns {function} unsubscribe
 */
export const subscribeToPoll = (groupId, callback, onError) => {
  const pollRef = ref(database, `groups/${groupId}/poll`);
  const unsubscribe = onValue(
    pollRef,
    (snapshot) => callback(snapshot.exists() ? snapshot.val() : null),
    (err) => {
      console.error('[pollService] subscribeToPoll error:', err);
      if (onError) onError(err);
    }
  );
  return unsubscribe;
};
