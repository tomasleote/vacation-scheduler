/**
 * Participant validation and link generation utilities.
 * Pure functions — no Firebase or React dependencies.
 */

/**
 * Validates a participant name for uniqueness and non-emptiness.
 * @param {string} name - Name to validate
 * @param {Array<{id: string, name: string}>} existingParticipants - Current participants list
 * @param {string|null} currentId - ID of the participant being edited (null for new)
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateParticipantName(name, existingParticipants = [], currentId = null) {
    const trimmed = (name || '').trim();
    if (!trimmed) {
        return { valid: false, error: 'Name is required.' };
    }
    if (trimmed.length > 100) {
        return { valid: false, error: 'Name must be 100 characters or fewer.' };
    }

    const normalized = trimmed.toLowerCase();
    const duplicate = existingParticipants.some(
        p => p.name && p.name.trim().toLowerCase() === normalized && p.id !== currentId
    );
    if (duplicate) {
        return { valid: false, error: 'A participant with this name already exists.' };
    }

    return { valid: true, error: null };
}

/**
 * Validates an email address (optional field).
 * @param {string} email
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateEmail(email) {
    if (!email || email.trim() === '') {
        return { valid: true, error: null }; // email is optional
    }
    const trimmed = email.trim();
    if (trimmed.length > 255) {
        return { valid: false, error: 'Email must be 255 characters or fewer.' };
    }
    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
        return { valid: false, error: 'Please enter a valid email address.' };
    }
    return { valid: true, error: null };
}

/**
 * Sanitizes a participant name — trims whitespace and caps length.
 * @param {string} name
 * @returns {string}
 */
export function sanitizeName(name) {
    return String(name || '').trim().slice(0, 100);
}

/**
 * Sanitizes an email — trims whitespace and caps length.
 * @param {string} email
 * @returns {string}
 */
export function sanitizeEmail(email) {
    return String(email || '').trim().slice(0, 255);
}

/**
 * Generates a personal participant link.
 * @param {string} baseUrl - Origin URL (e.g., window.location.origin)
 * @param {string} groupId
 * @param {string} participantId
 * @returns {string}
 */
export function generateParticipantLink(baseUrl, groupId, participantId) {
    // Strip trailing slash from baseUrl
    const origin = (baseUrl || '').replace(/\/+$/, '');
    const params = new URLSearchParams({ group: groupId, p: participantId });
    return `${origin}?${params.toString()}`;
}
