import React from 'react';
import { render, screen } from '@testing-library/react';
import ResultsDisplay from './ResultsDisplay';

describe('ResultsDisplay', () => {
  test('shows empty message when no overlaps', () => {
    render(<ResultsDisplay overlaps={[]} />);
    expect(screen.getByText('No matching periods found. More participants needed.')).toBeInTheDocument();
  });

  test('shows empty message when overlaps is null', () => {
    render(<ResultsDisplay overlaps={null} />);
    expect(screen.getByText('No matching periods found. More participants needed.')).toBeInTheDocument();
  });

  test('shows empty message when overlaps is undefined', () => {
    render(<ResultsDisplay />);
    expect(screen.getByText('No matching periods found. More participants needed.')).toBeInTheDocument();
  });

  test('renders overlap cards with correct data', () => {
    const overlaps = [{
      startDate: '2024-06-01',
      endDate: '2024-06-05',
      availabilityPercent: 75,
      availableCount: 3,
      totalParticipants: 4,
      dayCount: 5
    }];

    render(<ResultsDisplay overlaps={overlaps} />);

    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('available')).toBeInTheDocument();
    expect(screen.getByText('3 of 4 people')).toBeInTheDocument();
    expect(screen.getByText('5 days')).toBeInTheDocument();
  });

  test('renders multiple overlap cards', () => {
    const overlaps = [
      {
        startDate: '2024-06-01',
        endDate: '2024-06-03',
        availabilityPercent: 100,
        availableCount: 4,
        totalParticipants: 4,
        dayCount: 3
      },
      {
        startDate: '2024-06-05',
        endDate: '2024-06-07',
        availabilityPercent: 50,
        availableCount: 2,
        totalParticipants: 4,
        dayCount: 3
      }
    ];

    render(<ResultsDisplay overlaps={overlaps} />);

    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  test('renders progress bar with correct width', () => {
    const overlaps = [{
      startDate: '2024-06-01',
      endDate: '2024-06-03',
      availabilityPercent: 60,
      availableCount: 3,
      totalParticipants: 5,
      dayCount: 3
    }];

    const { container } = render(<ResultsDisplay overlaps={overlaps} />);
    const progressBar = container.querySelector('.bg-indigo-600.h-2');
    expect(progressBar.style.width).toBe('60%');
  });

  test('renders tip section', () => {
    const overlaps = [{
      startDate: '2024-06-01',
      endDate: '2024-06-03',
      availabilityPercent: 100,
      availableCount: 1,
      totalParticipants: 1,
      dayCount: 3
    }];

    render(<ResultsDisplay overlaps={overlaps} />);
    expect(screen.getByText(/Tip:/)).toBeInTheDocument();
  });
});
