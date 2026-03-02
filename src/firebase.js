/**
 * Backward-compatibility re-export layer.
 *
 * All business logic now lives in src/services/.
 * Components should import from services directly.
 * This file exists only so existing lazy imports (e.g. `await import('./firebase')`)
 * and tests continue to work during the incremental migration.
 */

export { database } from './services/firebaseConfig';

export { createGroup, getGroup, updateGroup, deleteGroup, subscribeToGroup } from './services/groupService';

export {
  addParticipant,
  updateParticipant,
  getParticipant,
  getParticipants,
  deleteParticipant,
  subscribeToParticipants,
} from './services/participantService';

export { hashPhrase, validateAdminToken } from './services/adminService';
