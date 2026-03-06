import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CalendarView from './CalendarView';
import { useNotification } from '../context/NotificationContext';

jest.mock('../context/NotificationContext', () => ({
  useNotification: jest.fn()
}));

const mockAddNotification = jest.fn();
beforeEach(() => {
  useNotification.mockReturnValue({ addNotification: mockAddNotification });
  mockAddNotification.mockClear();
});

// Suppress console.log from Firebase init
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => { });
});

afterAll(() => {
  console.log.mockRestore();
});

const defaultProps = {
  startDate: '2024-06-01',
  endDate: '2024-06-30',
  onSubmit: jest.fn(() => Promise.resolve()),
  savedDays: [],
  initialName: '',
  initialEmail: '',
  initialDuration: '3'
};

const renderCalendar = (overrides = {}) => {
  return render(
    <MemoryRouter>
      <CalendarView {...defaultProps} {...overrides} />
    </MemoryRouter>
  );
};

describe('CalendarView rendering', () => {
  test('renders name, email, and duration fields', () => {
    renderCalendar();
    expect(screen.getByPlaceholderText('Your Name *')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email (optional)')).toBeInTheDocument();
    expect(screen.getByText('days')).toBeInTheDocument();
  });

  test('renders day-of-week headers', () => {
    renderCalendar();
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
  });

  test('renders month navigation', () => {
    renderCalendar();
    expect(screen.getByText('June 2024')).toBeInTheDocument();
    expect(screen.getByText('← Prev')).toBeInTheDocument();
    expect(screen.getByText('Next →')).toBeInTheDocument();
  });

  test('does not render Flexible or Block selection modes', () => {
    renderCalendar();
    expect(screen.queryByText('Flexible')).not.toBeInTheDocument();
    expect(screen.queryByText('Block')).not.toBeInTheDocument();
  });

  test('renders range selection hint', () => {
    renderCalendar();
    expect(screen.getByText('Click a date to start a range. Click a selected day to deselect it.')).toBeInTheDocument();
  });

  test('pre-fills initial values', () => {
    renderCalendar({
      initialName: 'Alice',
      initialEmail: 'alice@example.com',
      initialDuration: '5'
    });
    expect(screen.getByPlaceholderText('Your Name *')).toHaveValue('Alice');
    expect(screen.getByPlaceholderText('Email (optional)')).toHaveValue('alice@example.com');
  });
});

describe('CalendarView interactions', () => {
  test('name input enforces 30 character limit', () => {
    renderCalendar();
    const nameInput = screen.getByPlaceholderText('Your Name *');
    const longName = 'A'.repeat(50);
    fireEvent.change(nameInput, { target: { value: longName } });
    expect(nameInput.value.length).toBeLessThanOrEqual(30);
  });

  test('shows error when submitting without name', async () => {
    renderCalendar();

    // Click a day first to have selection
    const dayButton = screen.getByTestId('day-2024-06-15');
    fireEvent.click(dayButton);

    // Try to submit without name
    const submitButton = screen.getByText('Submit Availability');
    fireEvent.click(submitButton);

    expect(mockAddNotification).toHaveBeenCalledWith(expect.objectContaining({ message: 'Please enter your name' }));
  });

  test('shows error when submitting without selected days', async () => {
    renderCalendar();

    // Fill in name but don't select days
    const nameInput = screen.getByPlaceholderText('Your Name *');
    fireEvent.change(nameInput, { target: { value: 'Alice' } });

    // Use fireEvent.submit on the form directly to bypass disabled-button constraint.
    const form = nameInput.closest('form');
    fireEvent.submit(form);

    expect(mockAddNotification).toHaveBeenCalledWith(expect.objectContaining({ message: 'Please select at least one day' }));
  });

  test('clicking a single day selects it', () => {
    renderCalendar();

    const dayButton = screen.getByTestId('day-2024-06-10');
    fireEvent.click(dayButton);

    // Day should be selected
    expect(dayButton.className).toContain('text-white');
  });

  test('clicking the same day twice deselects it (toggle)', () => {
    renderCalendar();

    const dayButton = screen.getByTestId('day-2024-06-10');
    fireEvent.click(dayButton); // select
    fireEvent.click(dayButton); // deselect (toggle)

    // Day should be deselected
    expect(dayButton.className).not.toContain('text-white');
  });

  test('range selection: clicking start then end selects all days between', () => {
    renderCalendar();

    fireEvent.click(screen.getByTestId('day-2024-06-10')); // start
    fireEvent.click(screen.getByTestId('day-2024-06-15')); // end

    // All days 10-15 should be selected
    for (let d = 10; d <= 15; d++) {
      const dayBtn = screen.getByTestId(`day-2024-06-${String(d).padStart(2, '0')}`);
      expect(dayBtn.className).toContain('text-white');
    }

    // Day 9 and 16 should NOT be selected
    expect(screen.getByTestId('day-2024-06-09').className).not.toContain('text-white');
    expect(screen.getByTestId('day-2024-06-16').className).not.toContain('text-white');

    // Counter should show 6
    const counter = screen.getByTestId('day-count');
    expect(counter.textContent).toMatch(/6/);
  });

  test('reverse selection: end before start normalizes the range', () => {
    renderCalendar();

    fireEvent.click(screen.getByTestId('day-2024-06-15')); // start (later date)
    fireEvent.click(screen.getByTestId('day-2024-06-10')); // end (earlier date)

    // All days 10-15 should be selected (normalized)
    for (let d = 10; d <= 15; d++) {
      const dayBtn = screen.getByTestId(`day-2024-06-${String(d).padStart(2, '0')}`);
      expect(dayBtn.className).toContain('text-white');
    }
  });

  test('new range is additive — does not clear previous selection', () => {
    renderCalendar();

    // Select range 10-15
    fireEvent.click(screen.getByTestId('day-2024-06-10'));
    fireEvent.click(screen.getByTestId('day-2024-06-15'));

    // Verify range is selected
    expect(screen.getByTestId('day-2024-06-12').className).toContain('text-white');

    // Click a new start date
    fireEvent.click(screen.getByTestId('day-2024-06-20'));

    // Old range should still be selected (additive)
    expect(screen.getByTestId('day-2024-06-12').className).toContain('text-white');

    // New start should also be selected
    expect(screen.getByTestId('day-2024-06-20').className).toContain('text-white');

    // Counter should show 7 (6 from old range + 1 new start)
    const counter = screen.getByTestId('day-count');
    expect(counter.textContent).toMatch(/7/);
  });

  test('days outside range are disabled', () => {
    renderCalendar({
      startDate: '2024-06-10',
      endDate: '2024-06-20'
    });

    // Day 5 should be disabled (outside range)
    const dayButton = screen.getByTestId('day-2024-06-05');
    expect(dayButton).toBeDisabled();

    // Day 15 should be enabled (inside range)
    const enabledDay = screen.getByTestId('day-2024-06-15');
    expect(enabledDay).not.toBeDisabled();
  });

  test('saved days appear as selected', () => {
    renderCalendar({
      savedDays: ['2024-06-15', '2024-06-16']
    });

    expect(screen.getByTestId('day-2024-06-15').className).toContain('text-white');
    expect(screen.getByTestId('day-2024-06-16').className).toContain('text-white');
  });

  test('saved days persist when new range started (additive)', () => {
    renderCalendar({
      savedDays: ['2024-06-15', '2024-06-16']
    });

    const savedDayBtn = screen.getByTestId('day-2024-06-15');
    expect(savedDayBtn.className).toContain('text-white');

    // Click a new start date
    fireEvent.click(screen.getByTestId('day-2024-06-20'));

    // Saved days should still be selected (additive)
    expect(savedDayBtn.className).toContain('text-white');
  });

  test('shows day count including saved and new days', () => {
    renderCalendar({
      savedDays: ['2024-06-15']
    });

    const counter = screen.getByTestId('day-count');
    expect(counter).toBeInTheDocument();
    expect(counter.textContent).toMatch(/1/);

    // Select a new range (additive to saved day)
    fireEvent.click(screen.getByTestId('day-2024-06-20'));
    fireEvent.click(screen.getByTestId('day-2024-06-22'));

    // Should show 4 days (15 saved + 20, 21, 22 new)
    expect(screen.getByTestId('day-count').textContent).toMatch(/4/);
  });

  test('submit button is enabled when savedDays exist but no new days selected', () => {
    renderCalendar({
      savedDays: ['2024-06-15', '2024-06-16'],
      initialName: 'Alice'
    });

    const submitButton = screen.getByText('Submit Availability');
    expect(submitButton).not.toBeDisabled();
  });

  test('submit calls onSubmit with correct data', async () => {
    const mockSubmit = jest.fn(() => Promise.resolve());
    renderCalendar({ onSubmit: mockSubmit });

    // Fill name
    fireEvent.change(screen.getByPlaceholderText('Your Name *'), {
      target: { value: 'Alice' }
    });

    // Select a day
    fireEvent.click(screen.getByTestId('day-2024-06-15'));

    // Submit
    fireEvent.click(screen.getByText('Submit Availability'));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        name: 'Alice',
        email: '',
        duration: 3,
        blockType: 'flexible',
        selectedDays: ['2024-06-15']
      });
    });
  });

  test('Save Details Only button submits with empty selectedDays', async () => {
    const mockSubmit = jest.fn(() => Promise.resolve());
    renderCalendar({ onSubmit: mockSubmit });

    fireEvent.change(screen.getByPlaceholderText('Your Name *'), {
      target: { value: 'Alice' }
    });

    fireEvent.click(screen.getByText('Save Details'));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ selectedDays: [] })
      );
    });
  });
});

describe('CalendarView month navigation', () => {
  test('navigates to next month', () => {
    renderCalendar({
      startDate: '2024-06-01',
      endDate: '2024-08-31'
    });

    expect(screen.getByText('June 2024')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Next →'));
    expect(screen.getByText('July 2024')).toBeInTheDocument();
  });

  test('navigates to previous month', () => {
    renderCalendar({
      startDate: '2024-05-01',
      endDate: '2024-07-31'
    });

    // Navigate forward first
    fireEvent.click(screen.getByText('Next →'));
    expect(screen.getByText('June 2024')).toBeInTheDocument();

    // Then back
    fireEvent.click(screen.getByText('← Prev'));
    expect(screen.getByText('May 2024')).toBeInTheDocument();
  });

  test('cannot navigate before start month', () => {
    renderCalendar({
      startDate: '2024-06-01',
      endDate: '2024-08-31'
    });

    // Try to go before June
    fireEvent.click(screen.getByText('← Prev'));
    expect(screen.getByText('June 2024')).toBeInTheDocument(); // Should stay
  });

  test('cannot navigate past end month', () => {
    renderCalendar({
      startDate: '2024-06-01',
      endDate: '2024-06-30'
    });

    // Try to go past June
    fireEvent.click(screen.getByText('Next →'));
    expect(screen.getByText('June 2024')).toBeInTheDocument(); // Should stay
  });
});

describe('CalendarView edge cases', () => {
  test('handles cross-year date range', () => {
    renderCalendar({
      startDate: '2024-12-01',
      endDate: '2025-01-31'
    });

    expect(screen.getByText('December 2024')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Next →'));
    expect(screen.getByText('January 2025')).toBeInTheDocument();
  });

  test('range selection clips to allowed date range boundary', () => {
    renderCalendar({
      startDate: '2024-06-01',
      endDate: '2024-06-05'
    });

    // Select range that extends to the boundary
    fireEvent.click(screen.getByTestId('day-2024-06-03'));
    fireEvent.click(screen.getByTestId('day-2024-06-05'));

    expect(screen.getByTestId('day-2024-06-03').className).toContain('text-white');
    expect(screen.getByTestId('day-2024-06-04').className).toContain('text-white');
    expect(screen.getByTestId('day-2024-06-05').className).toContain('text-white');
  });

  test('range selection does not select days outside allowed range', () => {
    renderCalendar({
      startDate: '2024-06-10',
      endDate: '2024-06-12'
    });

    // Select the full allowed range
    fireEvent.click(screen.getByTestId('day-2024-06-10'));
    fireEvent.click(screen.getByTestId('day-2024-06-12'));

    // Day 13 should NOT be selected (outside range and disabled)
    const day13 = screen.getByTestId('day-2024-06-13');
    expect(day13.className).not.toContain('text-white');
  });

  test('range selection across month boundaries works via navigation', () => {
    renderCalendar({
      startDate: '2024-06-28',
      endDate: '2024-07-05'
    });

    // Click start date in June
    fireEvent.click(screen.getByTestId('day-2024-06-28'));

    // Navigate to July
    fireEvent.click(screen.getByText('Next →'));

    // Click end date in July
    fireEvent.click(screen.getByTestId('day-2024-07-03'));

    // Verify July days are selected
    expect(screen.getByTestId('day-2024-07-01').className).toContain('text-white');
    expect(screen.getByTestId('day-2024-07-02').className).toContain('text-white');
    expect(screen.getByTestId('day-2024-07-03').className).toContain('text-white');

    // Navigate back to June and verify those days too
    fireEvent.click(screen.getByText('← Prev'));
    expect(screen.getByTestId('day-2024-06-28').className).toContain('text-white');
    expect(screen.getByTestId('day-2024-06-29').className).toContain('text-white');
    expect(screen.getByTestId('day-2024-06-30').className).toContain('text-white');
  });
});
