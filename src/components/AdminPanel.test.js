/**
 * Integration tests for AdminPanel — Participant Management Controls.
 *
 * These tests mock the Firebase module and test the AdminPanel component's
 * create/edit/delete/copy-link/send-invite flows using React Testing Library.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import '@testing-library/jest-dom';

// ─── Mocks ────────────────────────────────────────────────────────

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
    motion: { div: (props) => <div {...props} />, button: (props) => <button {...props} /> },
    AnimatePresence: ({ children }) => <>{children}</>,
}));

// Firebase mocks
const mockAddParticipant = jest.fn();
const mockUpdateParticipant = jest.fn();
const mockDeleteParticipant = jest.fn();
const mockGetParticipant = jest.fn();
const mockValidateAdminToken = jest.fn();
const mockSubscribeToGroup = jest.fn();
const mockSubscribeToParticipants = jest.fn();

jest.mock('../services/groupService', () => ({
    getGroup: jest.fn(),
    updateGroup: jest.fn(),
    deleteGroup: jest.fn(),
    subscribeToGroup: (...args) => mockSubscribeToGroup(...args),
}));

jest.mock('../services/participantService', () => ({
    addParticipant: (...args) => mockAddParticipant(...args),
    updateParticipant: (...args) => mockUpdateParticipant(...args),
    deleteParticipant: (...args) => mockDeleteParticipant(...args),
    getParticipant: (...args) => mockGetParticipant(...args),
    getParticipants: jest.fn(),
    subscribeToParticipants: (...args) => mockSubscribeToParticipants(...args),
}));

jest.mock('../services/adminService', () => ({
    validateAdminToken: (...args) => mockValidateAdminToken(...args),
    hashPhrase: jest.fn(),
}));

// Mock overlap utils
jest.mock('../utils/overlap', () => ({
    calculateOverlap: jest.fn(() => []),
    getBestOverlapPeriods: jest.fn(() => []),
    formatDateRange: jest.fn(() => ''),
}));

jest.mock('../utils/export', () => ({
    exportToCSV: jest.fn(),
}));

// Mock NotificationContext
const mockAddNotification = jest.fn();
jest.mock('../context/NotificationContext', () => ({
    useNotification: () => ({ addNotification: mockAddNotification }),
}));

// Import GroupProvider
import { GroupProvider } from '../shared/context';

// Mock child components to simplify rendering
jest.mock('./SlidingOverlapCalendar', () => () => null);
jest.mock('./CalendarView', () => () => null);

// Mock clipboard
Object.assign(navigator, {
    clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
});

// Mock fetch
global.fetch = jest.fn();

// ─── Helpers ──────────────────────────────────────────────────────

const mockGroup = {
    id: 'group-123',
    name: 'Summer Trip',
    description: 'Beach vacation',
    startDate: '2024-06-01',
    endDate: '2024-06-30',
    adminTokenHash: 'hash-abc',
    adminEmail: 'admin@test.com',
    createdAt: '2024-01-01T00:00:00Z',
};

const mockParticipants = [
    { id: 'p1', name: 'Alice', email: 'alice@test.com', duration: 5, availableDays: ['2024-06-01', '2024-06-02'] },
    { id: 'p2', name: 'Bob', email: '', duration: 3, availableDays: ['2024-06-03'] },
];

import AdminPanel from './AdminPanel';

function renderAdminPanel() {
    mockValidateAdminToken.mockResolvedValue(true);
    mockGetParticipant.mockResolvedValue(null);

    // subscribeToGroup: call the callback immediately, return unsub fn
    mockSubscribeToGroup.mockImplementation((groupId, callback) => {
        setTimeout(() => callback(mockGroup), 0);
        return () => { };
    });
    // subscribeToParticipants: call the callback immediately, return unsub fn
    mockSubscribeToParticipants.mockImplementation((groupId, callback) => {
        setTimeout(() => callback([...mockParticipants]), 0);
        return () => { };
    });

    return render(
        <HelmetProvider>
            <GroupProvider groupId="group-123" adminToken="token-abc" isAdmin={true}>
                <AdminPanel onBack={jest.fn()} />
            </GroupProvider>
        </HelmetProvider>
    );
}

/**
 * Helper to render panel and wait for loading to finish.
 */
async function renderAndWaitForLoad() {
    renderAdminPanel();
    // Wait for the component to finish loading and display the participants table
    await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
    });
}

// ─── Tests ────────────────────────────────────────────────────────

beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockReset();
});

describe('Participant Table', () => {
    test('renders participant table with existing participants', async () => {
        await renderAndWaitForLoad();
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    test('shows "Add Participant" button', async () => {
        await renderAndWaitForLoad();
        expect(screen.getByText('Add Participant')).toBeInTheDocument();
    });

    test('shows action buttons for each participant', async () => {
        await renderAndWaitForLoad();
        expect(screen.getByTestId('edit-participant-p1')).toBeInTheDocument();
        expect(screen.getByTestId('delete-participant-p1')).toBeInTheDocument();
        expect(screen.getByTestId('copy-link-p1')).toBeInTheDocument();
        expect(screen.getByTestId('send-invite-p1')).toBeInTheDocument();
    });
});

describe('Create Participant', () => {
    test('opens create form and submits with valid name', async () => {
        mockAddParticipant.mockResolvedValue('new-p-id');
        await renderAndWaitForLoad();

        fireEvent.click(screen.getByText('Add Participant'));

        await waitFor(() => {
            expect(screen.getByTestId('create-participant-name')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByTestId('create-participant-name'), { target: { value: 'Diana' } });
        fireEvent.change(screen.getByTestId('create-participant-email'), { target: { value: 'diana@test.com' } });
        fireEvent.click(screen.getByTestId('create-participant-submit'));

        await waitFor(() => {
            expect(mockAddParticipant).toHaveBeenCalledWith('group-123', expect.objectContaining({
                name: 'Diana',
                email: 'diana@test.com',
            }));
            expect(mockAddNotification).toHaveBeenCalledWith(expect.objectContaining({
                type: 'success',
                title: 'Participant Created',
            }));
        });
    });

    test('rejects duplicate name via client-side validation', async () => {
        await renderAndWaitForLoad();

        fireEvent.click(screen.getByText('Add Participant'));
        await waitFor(() => screen.getByTestId('create-participant-name'));

        fireEvent.change(screen.getByTestId('create-participant-name'), { target: { value: 'Alice' } });
        fireEvent.click(screen.getByTestId('create-participant-submit'));

        await waitFor(() => {
            expect(mockAddNotification).toHaveBeenCalledWith(expect.objectContaining({
                type: 'error',
                title: 'Validation Error',
            }));
        });
        expect(mockAddParticipant).not.toHaveBeenCalled();
    });

    test('rejects invalid email format', async () => {
        await renderAndWaitForLoad();

        fireEvent.click(screen.getByText('Add Participant'));
        await waitFor(() => screen.getByTestId('create-participant-name'));

        fireEvent.change(screen.getByTestId('create-participant-name'), { target: { value: 'Eve' } });
        fireEvent.change(screen.getByTestId('create-participant-email'), { target: { value: 'not-an-email' } });
        fireEvent.click(screen.getByTestId('create-participant-submit'));

        await waitFor(() => {
            expect(mockAddNotification).toHaveBeenCalledWith(expect.objectContaining({
                type: 'error',
                title: 'Validation Error',
            }));
        });
        expect(mockAddParticipant).not.toHaveBeenCalled();
    });

    test('rolls back optimistic update on server failure', async () => {
        mockAddParticipant.mockRejectedValue(new Error('Server error'));
        await renderAndWaitForLoad();

        fireEvent.click(screen.getByText('Add Participant'));
        await waitFor(() => screen.getByTestId('create-participant-name'));

        fireEvent.change(screen.getByTestId('create-participant-name'), { target: { value: 'FailUser' } });
        fireEvent.click(screen.getByTestId('create-participant-submit'));

        await waitFor(() => {
            expect(mockAddNotification).toHaveBeenCalledWith(expect.objectContaining({
                type: 'error',
                title: 'Create Failed',
            }));
        });
    });
});

describe('Edit Participant', () => {
    test('opens edit modal and saves changes', async () => {
        mockUpdateParticipant.mockResolvedValue();
        await renderAndWaitForLoad();

        fireEvent.click(screen.getByTestId('edit-participant-p1'));

        await waitFor(() => {
            expect(screen.getByTestId('edit-participant-name-input')).toBeInTheDocument();
            expect(screen.getByTestId('edit-participant-name-input').value).toBe('Alice');
        });

        fireEvent.change(screen.getByTestId('edit-participant-name-input'), { target: { value: 'Alice Updated' } });
        fireEvent.click(screen.getByTestId('edit-participant-save'));

        await waitFor(() => {
            expect(mockUpdateParticipant).toHaveBeenCalledWith('group-123', 'p1', expect.objectContaining({
                name: 'Alice Updated',
            }));
            expect(mockAddNotification).toHaveBeenCalledWith(expect.objectContaining({
                type: 'success',
                title: 'Participant Updated',
            }));
        });
    });

    test('rejects duplicate name on edit', async () => {
        await renderAndWaitForLoad();

        fireEvent.click(screen.getByTestId('edit-participant-p1'));
        await waitFor(() => screen.getByTestId('edit-participant-name-input'));

        // Try to rename Alice to Bob (duplicate)
        fireEvent.change(screen.getByTestId('edit-participant-name-input'), { target: { value: 'Bob' } });
        fireEvent.click(screen.getByTestId('edit-participant-save'));

        await waitFor(() => {
            expect(mockAddNotification).toHaveBeenCalledWith(expect.objectContaining({
                type: 'error',
                title: 'Validation Error',
            }));
        });
        expect(mockUpdateParticipant).not.toHaveBeenCalled();
    });

    test('allows email editing', async () => {
        mockUpdateParticipant.mockResolvedValue();
        await renderAndWaitForLoad();

        fireEvent.click(screen.getByTestId('edit-participant-p2'));
        await waitFor(() => screen.getByTestId('edit-participant-email-input'));

        fireEvent.change(screen.getByTestId('edit-participant-email-input'), { target: { value: 'bob@new.com' } });
        fireEvent.click(screen.getByTestId('edit-participant-save'));

        await waitFor(() => {
            expect(mockUpdateParticipant).toHaveBeenCalledWith('group-123', 'p2', expect.objectContaining({
                email: 'bob@new.com',
            }));
        });
    });

    test('rolls back on server rejection during edit', async () => {
        mockUpdateParticipant.mockRejectedValue(new Error('A participant with this name already exists.'));
        await renderAndWaitForLoad();

        fireEvent.click(screen.getByTestId('edit-participant-p1'));
        await waitFor(() => screen.getByTestId('edit-participant-name-input'));

        fireEvent.change(screen.getByTestId('edit-participant-name-input'), { target: { value: 'NewUniqueName' } });
        fireEvent.click(screen.getByTestId('edit-participant-save'));

        await waitFor(() => {
            expect(mockAddNotification).toHaveBeenCalledWith(expect.objectContaining({
                type: 'error',
                title: 'Update Failed',
            }));
        });
    });
});

describe('Delete Participant', () => {
    test('shows confirmation modal and deletes on confirm', async () => {
        mockDeleteParticipant.mockResolvedValue();
        await renderAndWaitForLoad();

        fireEvent.click(screen.getByTestId('delete-participant-p1'));

        await waitFor(() => {
            expect(screen.getByText('Delete Participant?')).toBeInTheDocument();
        });
        // Use getAllByText since "Alice" appears in both the table and the confirmation modal
        expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1);

        fireEvent.click(screen.getByTestId('delete-confirm'));

        await waitFor(() => {
            expect(mockDeleteParticipant).toHaveBeenCalledWith('group-123', 'p1');
            expect(mockAddNotification).toHaveBeenCalledWith(expect.objectContaining({
                type: 'success',
                title: 'Participant Deleted',
            }));
        });
    });

    test('cancel does not delete participant', async () => {
        await renderAndWaitForLoad();

        fireEvent.click(screen.getByTestId('delete-participant-p1'));
        await waitFor(() => screen.getByTestId('delete-cancel'));
        fireEvent.click(screen.getByTestId('delete-cancel'));

        expect(mockDeleteParticipant).not.toHaveBeenCalled();
    });

    test('rolls back optimistic delete on server failure', async () => {
        mockDeleteParticipant.mockRejectedValue(new Error('Network error'));
        await renderAndWaitForLoad();

        fireEvent.click(screen.getByTestId('delete-participant-p1'));
        await waitFor(() => screen.getByTestId('delete-confirm'));
        fireEvent.click(screen.getByTestId('delete-confirm'));

        await waitFor(() => {
            expect(mockAddNotification).toHaveBeenCalledWith(expect.objectContaining({
                type: 'error',
                title: 'Delete Failed',
            }));
        });
    });
});

describe('Copy Link', () => {
    test('copies correct personal link to clipboard', async () => {
        await renderAndWaitForLoad();

        fireEvent.click(screen.getByTestId('copy-link-p1'));

        await waitFor(() => {
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
                expect.stringContaining('group=group-123&p=p1')
            );
            expect(mockAddNotification).toHaveBeenCalledWith(expect.objectContaining({
                type: 'success',
                title: 'Link Copied',
            }));
        });
    });
});

describe('Send Invite', () => {
    test('sends invite to participant with email', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ success: true }),
        });
        await renderAndWaitForLoad();

        fireEvent.click(screen.getByTestId('send-invite-p1'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/send-invite', expect.objectContaining({
                method: 'POST',
            }));
            expect(mockAddNotification).toHaveBeenCalledWith(expect.objectContaining({
                type: 'success',
                title: 'Invite Sent',
            }));
        });
    });

    test('shows error on send invite failure', async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({ error: 'Email service error' }),
        });
        await renderAndWaitForLoad();

        fireEvent.click(screen.getByTestId('send-invite-p1'));

        await waitFor(() => {
            expect(mockAddNotification).toHaveBeenCalledWith(expect.objectContaining({
                type: 'error',
                title: 'Invite Failed',
            }));
        });
    });

    test('send invite button is disabled when participant has no email', async () => {
        await renderAndWaitForLoad();

        const btn = screen.getByTestId('send-invite-p2');
        expect(btn).toBeDisabled();
    });

    test('handles network failure on send invite', async () => {
        global.fetch.mockRejectedValue(new Error('Network failure'));
        await renderAndWaitForLoad();

        fireEvent.click(screen.getByTestId('send-invite-p1'));

        await waitFor(() => {
            expect(mockAddNotification).toHaveBeenCalledWith(expect.objectContaining({
                type: 'error',
                title: 'Invite Failed',
            }));
        });
    });
});
