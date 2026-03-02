import { getGroup } from './groupService';

/**
 * Produces a hex-encoded SHA-256 digest using the browser's Web Crypto API.
 */
export const hashPhrase = async (text) => {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Validates an admin token by hashing it and comparing against the stored hash.
 */
export const validateAdminToken = async (groupId, providedToken) => {
  const group = await getGroup(groupId);
  if (!group || !group.adminTokenHash) return false;
  const providedHash = await hashPhrase(providedToken);
  return providedHash === group.adminTokenHash;
};
