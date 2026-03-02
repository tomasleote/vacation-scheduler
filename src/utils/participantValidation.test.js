/**
 * Unit tests for participantValidation.js
 * Tests validation logic, duplicate detection, email validation, and link generation.
 */

import {
    validateParticipantName,
    validateEmail,
    sanitizeName,
    sanitizeEmail,
    generateParticipantLink
} from './participantValidation';
import { MAX_PARTICIPANT_NAME_LENGTH } from './constants/validation';

describe('validateParticipantName', () => {
    const existingParticipants = [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
        { id: 'p3', name: '  Charlie  ' },
    ];

    test('rejects empty name', () => {
        const result = validateParticipantName('', existingParticipants);
        expect(result.valid).toBe(false);
        expect(result.error).toMatch(/required/i);
    });

    test('rejects whitespace-only name', () => {
        const result = validateParticipantName('   ', existingParticipants);
        expect(result.valid).toBe(false);
        expect(result.error).toMatch(/required/i);
    });

    test('rejects null/undefined name', () => {
        expect(validateParticipantName(null, existingParticipants).valid).toBe(false);
        expect(validateParticipantName(undefined, existingParticipants).valid).toBe(false);
    });

    test('rejects name exceeding MAX_PARTICIPANT_NAME_LENGTH characters', () => {
        const longName = 'A'.repeat(MAX_PARTICIPANT_NAME_LENGTH + 1);
        const result = validateParticipantName(longName, []);
        expect(result.valid).toBe(false);
        expect(result.error).toMatch(new RegExp(`${MAX_PARTICIPANT_NAME_LENGTH} characters`));
    });

    test('rejects duplicate names (exact match)', () => {
        const result = validateParticipantName('Alice', existingParticipants);
        expect(result.valid).toBe(false);
        expect(result.error).toMatch(/already exists/i);
    });

    test('rejects duplicate names (case-insensitive)', () => {
        const result = validateParticipantName('ALICE', existingParticipants);
        expect(result.valid).toBe(false);
        expect(result.error).toMatch(/already exists/i);
    });

    test('rejects duplicate names with whitespace differences', () => {
        const result = validateParticipantName('  alice  ', existingParticipants);
        expect(result.valid).toBe(false);
        expect(result.error).toMatch(/already exists/i);
    });

    test('allows same participant to keep their own name (edit case)', () => {
        const result = validateParticipantName('Alice', existingParticipants, 'p1');
        expect(result.valid).toBe(true);
        expect(result.error).toBeNull();
    });

    test('accepts valid unique name', () => {
        const result = validateParticipantName('Diana', existingParticipants);
        expect(result.valid).toBe(true);
        expect(result.error).toBeNull();
    });

    test('accepts name with empty participants list', () => {
        const result = validateParticipantName('Anyone', []);
        expect(result.valid).toBe(true);
        expect(result.error).toBeNull();
    });
});

describe('validateEmail', () => {
    test('accepts valid emails', () => {
        expect(validateEmail('user@example.com').valid).toBe(true);
        expect(validateEmail('test.user@domain.co').valid).toBe(true);
        expect(validateEmail('a+b@c.org').valid).toBe(true);
    });

    test('allows empty email (optional field)', () => {
        expect(validateEmail('').valid).toBe(true);
        expect(validateEmail(null).valid).toBe(true);
        expect(validateEmail(undefined).valid).toBe(true);
        expect(validateEmail('   ').valid).toBe(true);
    });

    test('rejects invalid email formats', () => {
        expect(validateEmail('notanemail').valid).toBe(false);
        expect(validateEmail('missing@').valid).toBe(false);
        expect(validateEmail('@nodomain.com').valid).toBe(false);
        expect(validateEmail('spaces in@email.com').valid).toBe(false);
    });

    test('rejects email exceeding 255 characters', () => {
        const longEmail = 'a'.repeat(250) + '@b.com';
        const result = validateEmail(longEmail);
        expect(result.valid).toBe(false);
        expect(result.error).toMatch(/255 characters/);
    });
});

describe('sanitizeName', () => {
    test('trims whitespace', () => {
        expect(sanitizeName('  Alice  ')).toBe('Alice');
    });

    test('caps at MAX_PARTICIPANT_NAME_LENGTH characters', () => {
        const longName = 'A'.repeat(200);
        expect(sanitizeName(longName)).toHaveLength(MAX_PARTICIPANT_NAME_LENGTH);
    });

    test('handles null/undefined', () => {
        expect(sanitizeName(null)).toBe('');
        expect(sanitizeName(undefined)).toBe('');
    });
});

describe('sanitizeEmail', () => {
    test('trims whitespace', () => {
        expect(sanitizeEmail('  test@example.com  ')).toBe('test@example.com');
    });

    test('caps at 255 characters', () => {
        const longEmail = 'a'.repeat(300);
        expect(sanitizeEmail(longEmail)).toHaveLength(255);
    });

    test('handles null/undefined', () => {
        expect(sanitizeEmail(null)).toBe('');
        expect(sanitizeEmail(undefined)).toBe('');
    });
});

describe('generateParticipantLink', () => {
    test('generates correct URL format', () => {
        const link = generateParticipantLink('https://example.com', 'group-123', 'part-456');
        expect(link).toBe('https://example.com?group=group-123&p=part-456');
    });

    test('handles trailing slash in baseUrl', () => {
        const link = generateParticipantLink('https://example.com/', 'g1', 'p1');
        expect(link).toBe('https://example.com?group=g1&p=p1');
    });

    test('handles multiple trailing slashes', () => {
        const link = generateParticipantLink('https://example.com///', 'g1', 'p1');
        expect(link).toBe('https://example.com?group=g1&p=p1');
    });

    test('handles empty baseUrl gracefully', () => {
        const link = generateParticipantLink('', 'g1', 'p1');
        expect(link).toBe('?group=g1&p=p1');
    });

    test('preserves special characters in IDs', () => {
        const link = generateParticipantLink('https://app.com', 'abc-def-123', 'xyz-789-uvw');
        expect(link).toContain('group=abc-def-123');
        expect(link).toContain('p=xyz-789-uvw');
    });
});
