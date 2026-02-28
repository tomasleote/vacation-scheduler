import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ParticipantView from './ParticipantView';
import * as firebase from '../firebase';

// Mock Firebase functions
jest.mock('../firebase', () => ({
    subscribeToGroup: jest.fn(),
    subscribeToParticipants: jest.fn(),
    addParticipant: jest.fn(),
    updateParticipant: jest.fn(),
    getParticipant: jest.fn()
}));

const mockGroup = {
    id: 'group123',
    name: 'Summer Trip',
    startDate: '2026-06-01',
    endDate: '2026-06-10',
    description: 'Annual vacation'
};

const mockParticipants = [
    { id: 'p1', name: 'Alice', availableDays: [] },
    { id: 'p2', name: 'Bob', availableDays: [] }
];

describe('ParticipantView - Duplicate Name Check', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Default mock behavior for successful subscription
        firebase.subscribeToGroup.mockImplementation((id, cb) => {
            cb(mockGroup);
            return () => { };
        });

        firebase.subscribeToParticipants.mockImplementation((id, cb) => {
            cb(mockParticipants);
            return () => { };
        });
    });

    test('blocks submission and shows error if name already exists', async () => {
        render(<ParticipantView groupId="group123" onBack={() => { }} />);

        // Wait for internal loading to finish
        await waitFor(() => {
            expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
        });

        // Fill in a duplicate name ("ALICE" vs "Alice")
        const nameInput = screen.getByPlaceholderText(/Your Name \*/i);
        fireEvent.change(nameInput, { target: { value: 'ALICE' } });

        // Select a day to enable the Submit button
        const dayBtn = screen.getAllByTestId('day-2026-06-01')[0];
        fireEvent.click(dayBtn);

        // Submit the form
        const submitButton = screen.getByRole('button', { name: /Submit Availability/i });
        fireEvent.click(submitButton);

        // Should show error message (the component's error state)
        await waitFor(() => {
            expect(screen.getByText(/A participant with this name already exists/i)).toBeInTheDocument();
        });

        // Firebase addParticipant should NOT have been called
        expect(firebase.addParticipant).not.toHaveBeenCalled();
    });

    test('allows submission if name is unique', async () => {
        firebase.addParticipant.mockResolvedValue('p3');

        render(<ParticipantView groupId="group123" onBack={() => { }} />);

        await waitFor(() => {
            expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
        });

        const nameInput = screen.getByPlaceholderText(/Your Name \*/i);
        fireEvent.change(nameInput, { target: { value: 'Charlie' } });

        // Select a day
        const dayBtn = screen.getAllByTestId('day-2026-06-01')[0];
        fireEvent.click(dayBtn);

        const submitButton = screen.getByRole('button', { name: /Submit Availability/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(firebase.addParticipant).toHaveBeenCalledWith('group123', expect.objectContaining({
                name: 'Charlie'
            }));
        });

        await waitFor(() => {
            expect(screen.getByText(/Your response has been recorded/i)).toBeInTheDocument();
        });
    });
});
