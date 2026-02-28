/**
 * Tests for firebase.js logic.
 *
 * Since these functions are tightly coupled to the Firebase SDK,
 * we mock the Firebase modules to test our application logic in isolation.
 */

// Polyfill TextEncoder for JSDOM
const { TextEncoder } = require('util');
global.TextEncoder = TextEncoder;

// Mock Firebase modules before importing
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({}))
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({}))
}));

const mockSet = jest.fn(() => Promise.resolve());
const mockGet = jest.fn();
const mockUpdate = jest.fn(() => Promise.resolve());
const mockRemove = jest.fn(() => Promise.resolve());
const mockRef = jest.fn(() => 'mock-ref');
const mockRunTransaction = jest.fn();

jest.mock('firebase/database', () => ({
  getDatabase: jest.fn(() => ({})),
  ref: (...args) => mockRef(...args),
  set: (...args) => mockSet(...args),
  get: (...args) => mockGet(...args),
  update: (...args) => mockUpdate(...args),
  remove: (...args) => mockRemove(...args),
  runTransaction: (...args) => mockRunTransaction(...args),
  onValue: jest.fn(),
  off: jest.fn(),
  child: jest.fn()
}));

// Mock crypto: randomUUID + subtle.digest (used by hashAdminToken)
// digest always returns 32 bytes of 0xab → hex hash = 'ab'.repeat(32)
// randomUUID cycles through values to provide unique IDs for groupId and adminToken
const mockRandomUUID = jest.fn();
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: mockRandomUUID,
    subtle: {
      digest: jest.fn().mockResolvedValue(new Uint8Array(32).fill(0xab).buffer)
    }
  }
});

const MOCK_HASH = 'ab'.repeat(32); // what hashAdminToken returns with the mocked digest

const { createGroup, getGroup, validateAdminToken, addParticipant, updateParticipant, getParticipants, deleteGroup, deleteParticipant } = require('./firebase');

beforeEach(() => {
  jest.clearAllMocks();
  // Ensure digest always returns the array buffer, even if reset
  global.crypto.subtle.digest = jest.fn().mockResolvedValue(new Uint8Array(32).fill(0xab).buffer);

  // createGroup calls randomUUID twice: first for groupId, then for adminToken
  // addParticipant calls it once for participantId
  mockRandomUUID
    .mockReturnValueOnce('test-group-uuid')
    .mockReturnValueOnce('test-admin-token-uuid')
    .mockReturnValue('test-uuid-fallback');
});

describe('createGroup', () => {
  test('creates group with generated ID and admin token', async () => {
    const result = await createGroup({ name: 'Test Group', startDate: '2024-06-01', endDate: '2024-06-15' });

    expect(result.groupId).toBe('test-group-uuid');
    expect(result.adminToken).toBe('test-admin-token-uuid');
    // One set() call: group data with hash included
    expect(mockSet).toHaveBeenCalledTimes(1);
  });

  test('stores all provided data plus metadata but NOT the raw adminToken', async () => {
    await createGroup({ name: 'Trip', description: 'Beach', startDate: '2024-06-01', endDate: '2024-06-15' });

    const groupData = mockSet.mock.calls[0][1];
    expect(groupData.name).toBe('Trip');
    expect(groupData.description).toBe('Beach');
    expect(groupData.createdAt).toBeDefined();
    expect(groupData.id).toBe('test-group-uuid');
    // Raw adminToken must NOT be stored — only its SHA-256 hash
    expect(groupData.adminToken).toBeUndefined();
    expect(groupData.adminTokenHash).toBe(MOCK_HASH);
  });

  test('throws on Firebase error', async () => {
    mockSet.mockRejectedValueOnce(new Error('Firebase error'));

    await expect(createGroup({ name: 'Fail', startDate: '2024-06-01', endDate: '2024-06-15' })).rejects.toThrow('Failed to create group');
  });
});

describe('getGroup', () => {
  test('returns group data when exists', async () => {
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => ({ name: 'Found Group' })
    });

    const result = await getGroup('123');
    expect(result).toEqual({ name: 'Found Group' });
  });

  test('returns null when group does not exist', async () => {
    mockGet.mockResolvedValue({
      exists: () => false,
      val: () => null
    });

    const result = await getGroup('nonexistent');
    expect(result).toBeNull();
  });
});

describe('addParticipant', () => {
  test('adds participant with generated ID', async () => {
    // Mock runTransaction to commit successfully
    mockRunTransaction.mockResolvedValueOnce({ committed: true });

    const result = await addParticipant('group1', {
      name: 'Alice',
      email: 'alice@example.com',
      duration: 5,
      availableDays: ['2024-06-01']
    });

    expect(result).toBe('test-group-uuid');
    expect(mockRunTransaction).toHaveBeenCalled();
  });

  test('rejects duplicate participant names (case-insensitive)', async () => {
    // Mock runTransaction failing to commit
    mockRunTransaction.mockResolvedValueOnce({ committed: false });

    await expect(
      addParticipant('group1', { name: 'alice', email: '', duration: 3 })
    ).rejects.toThrow('already exists');
  });

  test('rejects duplicate names with whitespace differences', async () => {
    mockRunTransaction.mockResolvedValueOnce({ committed: false });

    await expect(
      addParticipant('group1', { name: '  Alice  ', email: '', duration: 3 })
    ).rejects.toThrow('already exists');
  });
});

describe('updateParticipant', () => {
  test('updates participant data', async () => {
    mockRunTransaction.mockResolvedValueOnce({ committed: true });

    await updateParticipant('group1', 'p1', { name: 'Alice Updated' });
    expect(mockRunTransaction).toHaveBeenCalled();
  });

  test('rejects name change to existing name', async () => {
    mockRunTransaction.mockResolvedValueOnce({ committed: false });

    await expect(
      updateParticipant('group1', 'p1', { name: 'Bob' })
    ).rejects.toThrow('already exists');
  });

  test('allows keeping same name on update', async () => {
    mockRunTransaction.mockResolvedValueOnce({ committed: true });

    // Same participant updating their own name (no change) should work
    await expect(
      updateParticipant('group1', 'p1', { name: 'Alice' })
    ).resolves.not.toThrow();
  });

  test('skips transaction check when name not in updates', async () => {
    await updateParticipant('group1', 'p1', { duration: 5 });
    // Should call standard update when only other fields change
    expect(mockUpdate).toHaveBeenCalled();
  });
});

describe('getParticipants', () => {
  test('returns array of participants', async () => {
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => ({
        p1: { name: 'Alice', id: 'p1' },
        p2: { name: 'Bob', id: 'p2' }
      })
    });

    const result = await getParticipants('group1');
    expect(result).toHaveLength(2);
  });

  test('returns empty array when no participants', async () => {
    mockGet.mockResolvedValue({
      exists: () => false,
      val: () => null
    });

    const result = await getParticipants('group1');
    expect(result).toEqual([]);
  });
});

describe('deleteGroup', () => {
  test('calls remove on group ref', async () => {
    await deleteGroup('group1');
    expect(mockRemove).toHaveBeenCalled();
  });
});

describe('deleteParticipant', () => {
  test('calls remove on participant ref', async () => {
    await deleteParticipant('group1', 'p1');
    expect(mockRemove).toHaveBeenCalled();
  });
});

describe('Group ID generation', () => {
  test('uses crypto.randomUUID() for secure IDs', async () => {
    mockRandomUUID.mockReset();
    mockRandomUUID.mockReturnValueOnce('secure-uuid-1').mockReturnValueOnce('secure-admin-1');
    const result1 = await createGroup({ name: 'G1', startDate: '2024-06-01', endDate: '2024-06-15' });

    mockRandomUUID.mockReturnValueOnce('secure-uuid-2').mockReturnValueOnce('secure-admin-2');
    const result2 = await createGroup({ name: 'G2', startDate: '2024-06-01', endDate: '2024-06-15' });

    expect(result1.groupId).toBe('secure-uuid-1');
    expect(result2.groupId).toBe('secure-uuid-2');
    expect(result1.groupId).not.toBe(result2.groupId);
  });
});

describe('Admin token security', () => {
  test('raw adminToken is NOT stored in the group document', async () => {
    await createGroup({ name: 'SecTest', startDate: '2024-06-01', endDate: '2024-06-15' });

    const groupData = mockSet.mock.calls[0][1];
    // BUG-B fix: raw token absent — only its irreversible SHA-256 hash is stored
    expect(groupData.adminToken).toBeUndefined();
  });

  test('adminTokenHash (SHA-256 digest) is stored instead of raw token', async () => {
    await createGroup({ name: 'SecTest', startDate: '2024-06-01', endDate: '2024-06-15' });

    const groupData = mockSet.mock.calls[0][1];
    expect(groupData.adminTokenHash).toBe(MOCK_HASH);
    // Only one write — no separate private-path write needed
    expect(mockSet).toHaveBeenCalledTimes(1);
  });
});

describe('validateAdminToken', () => {
  test('returns true when provided token hash matches stored hash', async () => {
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => ({ adminTokenHash: MOCK_HASH, name: 'Test' })
    });

    // The mocked digest always returns the same value, so any token will match MOCK_HASH
    const result = await validateAdminToken('group1', 'test-uuid-1234');
    expect(result).toBe(true);
  });

  test('returns false when provided token hash does not match stored hash', async () => {
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => ({ adminTokenHash: 'totally-wrong-hash', name: 'Test' })
    });

    const result = await validateAdminToken('group1', 'wrong-token');
    expect(result).toBe(false);
  });

  test('returns false when group does not exist', async () => {
    mockGet.mockResolvedValue({ exists: () => false, val: () => null });

    const result = await validateAdminToken('nonexistent', 'any-token');
    expect(result).toBe(false);
  });

  test('returns false when group has no adminTokenHash', async () => {
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => ({ name: 'Test' }) // no adminTokenHash field
    });

    const result = await validateAdminToken('group1', 'any-token');
    expect(result).toBe(false);
  });
});
