import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecoverAdminForm from './RecoverAdminForm';
import { hashPhrase } from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';

jest.mock('../../context/NotificationContext', () => ({
    useNotification: jest.fn()
}));

const mockAddNotification = jest.fn();

// Mock the admin service module — implementation set per-test in beforeEach
jest.mock('../../services/adminService', () => ({
    hashPhrase: jest.fn(),
}));

beforeEach(() => {
    global.fetch = jest.fn();
    jest.clearAllMocks();
    useNotification.mockReturnValue({ addNotification: mockAddNotification });
    mockAddNotification.mockClear();
    // Re-apply hashPhrase implementation after clearAllMocks resets it
    hashPhrase.mockImplementation((text) => Promise.resolve(`hashed:${text}`));
});

describe('RecoverAdminForm', () => {
    it('renders passphrase tab by default', () => {
        render(<RecoverAdminForm onSuccess={jest.fn()} onCancel={jest.fn()} />);
        expect(screen.getByPlaceholderText(/set at creation/i)).toBeInTheDocument();
        expect(screen.queryByPlaceholderText(/email you used/i)).not.toBeInTheDocument();
    });

    it('switches to email tab and shows email input', async () => {
        render(<RecoverAdminForm onSuccess={jest.fn()} onCancel={jest.fn()} />);
        await userEvent.click(screen.getByRole('button', { name: /email link/i }));
        expect(screen.getByPlaceholderText(/email you used/i)).toBeInTheDocument();
        expect(screen.queryByPlaceholderText(/set at creation/i)).not.toBeInTheDocument();
    });

    it('switches to find groups tab and shows find email input', async () => {
        render(<RecoverAdminForm onSuccess={jest.fn()} onCancel={jest.fn()} />);
        await userEvent.click(screen.getByRole('button', { name: /find groups/i }));
        expect(screen.getByPlaceholderText(/email you used when creating groups/i)).toBeInTheDocument();
        expect(screen.queryByPlaceholderText(/set at creation/i)).not.toBeInTheDocument();
    });

    it('calls onCancel when Cancel is clicked', async () => {
        const onCancel = jest.fn();
        render(<RecoverAdminForm onSuccess={jest.fn()} onCancel={onCancel} />);
        await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('hashes passphrase client-side before sending to /api/recover-admin', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ adminToken: 'new-token-123' }),
        });

        render(<RecoverAdminForm onSuccess={jest.fn()} onCancel={jest.fn()} />);

        await userEvent.type(screen.getByPlaceholderText(/Paste your group ID/i), 'group-abc');
        await userEvent.type(screen.getByPlaceholderText(/set at creation/i), 'mysecret');
        await userEvent.click(screen.getByRole('button', { name: /recover access/i }));

        await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

        // hashPhrase must have been called with the plaintext
        expect(hashPhrase).toHaveBeenCalledWith('mysecret');

        const body = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(body.groupId).toBe('group-abc');
        // Passphrase in the request is the hashed value, never plaintext
        expect(body.passphrase).toBe('hashed:mysecret');
        expect(body.passphrase).not.toBe('mysecret');
    });

    it('calls onSuccess with groupId and adminToken on successful passphrase recovery', async () => {
        const onSuccess = jest.fn();
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ adminToken: 'new-token-abc' }),
        });

        render(<RecoverAdminForm onSuccess={onSuccess} onCancel={jest.fn()} />);

        await userEvent.type(screen.getByPlaceholderText(/Paste your group ID/i), 'grp-1');
        await userEvent.type(screen.getByPlaceholderText(/set at creation/i), 'pass123');
        await userEvent.click(screen.getByRole('button', { name: /recover access/i }));

        await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('grp-1', 'new-token-abc'));
    });

    it('sends email (not passphrase) when on the email tab', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ adminToken: 'tok' }),
        });

        render(<RecoverAdminForm onSuccess={jest.fn()} onCancel={jest.fn()} />);
        await userEvent.click(screen.getByRole('button', { name: /email link/i }));

        await userEvent.type(screen.getByPlaceholderText(/Paste your group ID/i), 'grp-2');
        await userEvent.type(screen.getByPlaceholderText(/email you used/i), 'admin@example.com');
        await userEvent.click(screen.getByRole('button', { name: /recover access/i }));

        await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
        const body = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(body.email).toBe('admin@example.com');
        expect(body.passphrase).toBeUndefined();
    });

    it('shows an error message when the API returns a non-ok response', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Incorrect recovery passphrase' }),
        });

        render(<RecoverAdminForm onSuccess={jest.fn()} onCancel={jest.fn()} />);
        await userEvent.type(screen.getByPlaceholderText(/Paste your group ID/i), 'grp-3');
        await userEvent.type(screen.getByPlaceholderText(/set at creation/i), 'wrong');
        await userEvent.click(screen.getByRole('button', { name: /recover access/i }));

        await waitFor(() =>
            expect(mockAddNotification).toHaveBeenCalledWith(expect.objectContaining({ message: 'Incorrect recovery passphrase' }))
        );
    });

    it('shows an error when network request fails', async () => {
        global.fetch.mockRejectedValueOnce(new Error('Network error'));

        render(<RecoverAdminForm onSuccess={jest.fn()} onCancel={jest.fn()} />);
        await userEvent.type(screen.getByPlaceholderText(/Paste your group ID/i), 'grp-4');
        await userEvent.type(screen.getByPlaceholderText(/set at creation/i), 'pass');
        await userEvent.click(screen.getByRole('button', { name: /recover access/i }));

        await waitFor(() =>
            expect(mockAddNotification).toHaveBeenCalledWith(expect.objectContaining({ message: 'You appear to be offline or the network failed to reach the server.' }))
        );
    });

    it('toggles passphrase visibility when the eye button is clicked', async () => {
        render(<RecoverAdminForm onSuccess={jest.fn()} onCancel={jest.fn()} />);
        const passphraseInput = screen.getByPlaceholderText(/set at creation/i);
        expect(passphraseInput).toHaveAttribute('type', 'password');

        await userEvent.click(screen.getByRole('button', { name: /show passphrase/i }));
        expect(passphraseInput).toHaveAttribute('type', 'text');

        await userEvent.click(screen.getByRole('button', { name: /hide passphrase/i }));
        expect(passphraseInput).toHaveAttribute('type', 'password');
    });

    it('sends email to /api/find-groups when on the find tab', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ found: 1 }),
        });

        render(<RecoverAdminForm onSuccess={jest.fn()} onCancel={jest.fn()} />);
        await userEvent.click(screen.getByRole('button', { name: /find groups/i }));

        await userEvent.type(screen.getByPlaceholderText(/email you used when creating groups/i), 'admin@example.com');
        await userEvent.click(screen.getByRole('button', { name: /find my groups/i }));

        await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
        const [url, opts] = global.fetch.mock.calls[0];
        expect(url).toBe('/api/find-groups');
        const body = JSON.parse(opts.body);
        expect(body.email).toBe('admin@example.com');
        expect(mockAddNotification).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/We sent a summary/i) }));
    });

    it('shows error if /api/find-groups fails', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Search failed' }),
        });

        render(<RecoverAdminForm onSuccess={jest.fn()} onCancel={jest.fn()} />);
        await userEvent.click(screen.getByRole('button', { name: /find groups/i }));

        await userEvent.type(screen.getByPlaceholderText(/email you used when creating groups/i), 'admin@test.com');
        await userEvent.click(screen.getByRole('button', { name: /find my groups/i }));

        await waitFor(() => expect(mockAddNotification).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/Search failed/i) })));
    });
});
