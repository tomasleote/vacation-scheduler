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
 * Constant-time string comparison to prevent timing attacks.
 */
const timingSafeEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
};

/**
 * Validates an admin token by hashing it and comparing against the stored hash.
 */
export const validateAdminToken = async (groupId, providedToken) => {
  const group = await getGroup(groupId);
  if (!group || !group.adminTokenHash) return false;
  const providedHash = await hashPhrase(providedToken);
  return timingSafeEqual(providedHash, group.adminTokenHash);
};
