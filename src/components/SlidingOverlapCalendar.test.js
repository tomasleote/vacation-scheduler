import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SlidingOverlapCalendar from './SlidingOverlapCalendar';

const mockDateRange = {
    startDate: '2026-03-01',
    endDate: '2026-03-10'
};

const mockParticipants = [
    { id: '1', name: 'Alice', availableDays: ['2026-03-01', '2026-03-02', '2026-03-03'] },
    { id: '2', name: 'Bob', availableDays: ['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04'] }
];

describe('SlidingOverlapCalendar Edge Cases', () => {

    test('renders gracefully with empty participants', () => {
        render(
            <SlidingOverlapCalendar
                {...mockDateRange}
                participants={[]}
                duration="3"
                overlaps={[]}
            />
        );
        expect(screen.getByText('Availability Heatmap')).toBeInTheDocument();
        // Hovering shouldn't crash
        const dayBtn = screen.getByTestId('day-2026-03-01');
        fireEvent.mouseEnter(dayBtn);
        expect(screen.getByText('Nobody is fully available for this period.')).toBeInTheDocument();
    });

    test('handles duration input changes properly, avoiding impossible extremes', () => {
        const mockOnDurationChange = jest.fn();
        render(
            <SlidingOverlapCalendar
                {...mockDateRange}
                participants={mockParticipants}
                duration="3"
                overlaps={[]}
                onDurationChange={mockOnDurationChange}
            />
        );

        const input = screen.getByDisplayValue('3');
        expect(input).toBeInTheDocument();

        // Change to high number (invalid boundary)
        fireEvent.change(input, { target: { value: '99' } });
        fireEvent.blur(input); // Simulate onBlur which formats the string internally

        // Check if onDurationChange was called with the clamped max value (10 days total)
        expect(mockOnDurationChange).toHaveBeenCalledWith('10');

        // Change to valid number
        fireEvent.change(input, { target: { value: '5' } });
        fireEvent.blur(input);
        expect(mockOnDurationChange).toHaveBeenCalledWith('5');
    });

    test('shows "Everyone can make it" when all participants are fully available for a block', () => {
        const perfectParticipants = [
            { id: '1', name: 'Alice', availableDays: ['2026-03-01', '2026-03-02'] },
            { id: '2', name: 'Bob', availableDays: ['2026-03-01', '2026-03-02'] }
        ];

        render(
            <SlidingOverlapCalendar
                {...mockDateRange}
                participants={perfectParticipants}
                duration="2"
                overlaps={[]}
            />
        );

        const dayBtn = screen.getByTestId('day-2026-03-01');
        fireEvent.click(dayBtn); // Lock date to force details view

        expect(screen.getByText('Everyone can make it!')).toBeInTheDocument();
    });

    test('shows "Missing X days" when participants have partial overlap', () => {
        render(
            <SlidingOverlapCalendar
                {...mockDateRange}
                participants={mockParticipants}
                duration="4" // Need 4 days
                overlaps={[]}
            />
        );

        const dayBtn = screen.getByTestId('day-2026-03-01');
        fireEvent.click(dayBtn); // Block: 03-01 to 03-04

        // Bob has 4 days (can attend), Alice only has 3 (missing 1)
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Missing 1 day')).toBeInTheDocument();
    });

});
