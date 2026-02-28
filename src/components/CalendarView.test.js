import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CalendarView from './CalendarView';

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
  return render(<CalendarView {...defaultProps} {...overrides} />);
};

describe('CalendarView rendering', () => {
  test('renders name, email, and duration fields', () => {
    renderCalendar();
    expect(screen.getByPlaceholderText('Your Name *')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email (optional)')).toBeInTheDocument();
    expect(screen.getByText('days trip')).toBeInTheDocument();
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

  test('renders block type selection modes', () => {
    renderCalendar();
    expect(screen.getByText('Flexible')).toBeInTheDocument();
    expect(screen.getByText('Block')).toBeInTheDocument();
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

    expect(screen.getByText('Please enter your name')).toBeInTheDocument();
  });

  test('shows error when submitting without selected days', async () => {
    renderCalendar();

    // Fill in name but don't select days
    const nameInput = screen.getByPlaceholderText('Your Name *');
    fireEvent.change(nameInput, { target: { value: 'Alice' } });

    // Use fireEvent.submit on the form directly to bypass disabled-button constraint.
    // The submit button is disabled when no days are selected; we test the handler itself.
    const form = nameInput.closest('form');
    fireEvent.submit(form);

    expect(screen.getByText('Please select at least one day')).toBeInTheDocument();
  });

  test('clicking a day in flexible mode toggles selection', () => {
    renderCalendar();

    const dayButton = screen.getByTestId('day-2024-06-10');
    fireEvent.click(dayButton);

    // Day should be selected (has indigo class)
    expect(dayButton.className).toContain('bg-indigo-600');

    // Click again to deselect
    fireEvent.click(dayButton);
    expect(dayButton.className).not.toContain('bg-indigo-600');
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

  test('block mode selects consecutive days', () => {
    renderCalendar({
      startDate: '2024-06-01',
      endDate: '2024-06-30'
    });

    // Switch to custom block mode and make it 3 days
    const blockRadio = screen.getByText('Block');
    fireEvent.click(blockRadio);

    // The second number input on the page is the custom block size
    const numberInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(numberInputs[1], { target: { value: '3' } });

    // Click day 10
    fireEvent.click(screen.getByTestId('day-2024-06-10'));

    // Days 10, 11, 12 should all be selected
    expect(screen.getByTestId('day-2024-06-10').className).toContain('bg-indigo-600');
    expect(screen.getByTestId('day-2024-06-11').className).toContain('bg-indigo-600');
    expect(screen.getByTestId('day-2024-06-12').className).toContain('bg-indigo-600');
  });

  test('saved days appear as selected', () => {
    renderCalendar({
      savedDays: ['2024-06-15', '2024-06-16']
    });

    expect(screen.getByTestId('day-2024-06-15').className).toContain('bg-indigo-600');
    expect(screen.getByTestId('day-2024-06-16').className).toContain('bg-indigo-600');
  });

  test('shows day count including saved and new days', () => {
    renderCalendar({
      savedDays: ['2024-06-15']
    });

    // BUG-K: use data-testid for reliable query (avoids matching calendar day number buttons)
    const counter = screen.getByTestId('day-count');
    expect(counter).toBeInTheDocument();
    expect(counter.textContent).toMatch(/1/);

    // Select another day
    fireEvent.click(screen.getByTestId('day-2024-06-20'));

    // Should show 2 days total
    expect(screen.getByTestId('day-count').textContent).toMatch(/2/);
  });

  test('submit button is enabled when savedDays exist but no new days selected', () => {
    // BUG-I: submit should be enabled when savedDays.length > 0 even if selectedDays is empty
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

  test('block mode near end of range clips to range boundary', () => {
    renderCalendar({
      startDate: '2024-06-01',
      endDate: '2024-06-05'
    });

    // Switch to 5-day block
    fireEvent.click(screen.getByText('Block'));
    const numberInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(numberInputs[1], { target: { value: '5' } });

    // Click day 3 - block would go 3,4,5 (only 3 days since range ends at 5)
    fireEvent.click(screen.getByTestId('day-2024-06-03'));

    expect(screen.getByTestId('day-2024-06-03').className).toContain('bg-indigo-600');
    expect(screen.getByTestId('day-2024-06-04').className).toContain('bg-indigo-600');
    expect(screen.getByTestId('day-2024-06-05').className).toContain('bg-indigo-600');
  });

  test('block mode does not select days outside range', () => {
    renderCalendar({
      startDate: '2024-06-10',
      endDate: '2024-06-12'
    });

    // Switch to 5-day block mode
    fireEvent.click(screen.getByText('Block'));
    const numberInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(numberInputs[1], { target: { value: '5' } });

    // Click day 10 - should only select 10, 11, 12 (within range)
    fireEvent.click(screen.getByTestId('day-2024-06-10'));

    // Day 13 should NOT be selected (outside range and disabled)
    const day13 = screen.getByTestId('day-2024-06-13');
    expect(day13.className).not.toContain('bg-indigo-600');
  });

  // BUG-H (fixed): block mode now toggles — clicking a fully-selected block deselects it
  test('block mode deselects days when all block days are already selected', () => {
    renderCalendar({
      startDate: '2024-06-01',
      endDate: '2024-06-30'
    });

    // Switch to 3-day block
    fireEvent.click(screen.getByText('Block'));
    const numberInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(numberInputs[1], { target: { value: '3' } });

    // Click day 10 — selects 10, 11, 12
    fireEvent.click(screen.getByTestId('day-2024-06-10'));
    expect(screen.getByTestId('day-2024-06-10').className).toContain('bg-indigo-600');
    expect(screen.getByTestId('day-2024-06-11').className).toContain('bg-indigo-600');
    expect(screen.getByTestId('day-2024-06-12').className).toContain('bg-indigo-600');

    // Click day 10 again — all 3 days already selected, so they should all deselect
    fireEvent.click(screen.getByTestId('day-2024-06-10'));
    expect(screen.getByTestId('day-2024-06-10').className).not.toContain('bg-indigo-600');
    expect(screen.getByTestId('day-2024-06-11').className).not.toContain('bg-indigo-600');
    expect(screen.getByTestId('day-2024-06-12').className).not.toContain('bg-indigo-600');
  });
});
