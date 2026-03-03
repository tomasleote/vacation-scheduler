import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CalendarPicker from './CalendarPicker';

// Suppress console errors from missing context if any
beforeAll(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
afterAll(() => console.error.mockRestore());

const renderPicker = (props = {}) =>
  render(
    <CalendarPicker
      label="Test Date"
      id="test-date"
      value=""
      onChange={jest.fn()}
      placeholder="Pick a date"
      {...props}
    />
  );

describe('CalendarPicker — rendering', () => {
  test('renders the label', () => {
    renderPicker();
    expect(screen.getByText('Test Date')).toBeInTheDocument();
  });

  test('shows placeholder when no value', () => {
    renderPicker();
    expect(screen.getByText('Pick a date')).toBeInTheDocument();
  });

  test('shows formatted date when value is set', () => {
    renderPicker({ value: '2026-06-15' });
    // Should show something like "Jun 15, 2026"
    expect(screen.getByText(/Jun.*15.*2026/)).toBeInTheDocument();
  });

  test('calendar grid is hidden initially', () => {
    renderPicker();
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });
});

describe('CalendarPicker — open/close', () => {
  test('opens calendar on trigger click', () => {
    renderPicker();
    fireEvent.click(screen.getByRole('button', { name: /pick a date/i }));
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  test('closes calendar when Escape is pressed', () => {
    renderPicker();
    fireEvent.click(screen.getByRole('button', { name: /pick a date/i }));
    expect(screen.getByRole('grid')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });

  test('calendar shows correct month header', () => {
    // Render with a minDate to control which month opens to
    renderPicker({ minDate: '2026-06-01', value: '2026-06-15' });
    fireEvent.click(screen.getByRole('button', { name: /jun.*15.*2026/i }));
    expect(screen.getByText('June 2026')).toBeInTheDocument();
  });
});

describe('CalendarPicker — day selection', () => {
  test('calls onChange with YYYY-MM-DD when a day is clicked', () => {
    const onChange = jest.fn();
    // Open to June 2026
    renderPicker({ onChange, value: '2026-06-01', minDate: '2026-06-01' });
    fireEvent.click(screen.getByRole('button', { name: /jun.*1.*2026/i }));

    // Click day 15
    const day15 = screen.getByRole('gridcell', { name: /june 15, 2026/i });
    fireEvent.click(day15);

    expect(onChange).toHaveBeenCalledWith('2026-06-15');
  });

  test('closes calendar after selecting a day', () => {
    const onChange = jest.fn();
    renderPicker({ onChange, value: '2026-06-01', minDate: '2026-06-01' });
    fireEvent.click(screen.getByRole('button', { name: /jun.*1.*2026/i }));

    const day15 = screen.getByRole('gridcell', { name: /june 15, 2026/i });
    fireEvent.click(day15);

    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });

  test('selected day has aria-label including "selected"', () => {
    renderPicker({ value: '2026-06-15', minDate: '2026-06-01' });
    fireEvent.click(screen.getByRole('button', { name: /jun.*15.*2026/i }));

    const selectedDay = screen.getByRole('gridcell', { name: /selected/i });
    expect(selectedDay).toBeInTheDocument();
  });
});

describe('CalendarPicker — disabled days', () => {
  test('days before minDate are disabled', () => {
    renderPicker({ value: '2026-06-10', minDate: '2026-06-05' });
    fireEvent.click(screen.getByRole('button', { name: /jun.*10.*2026/i }));

    const day3 = screen.getByRole('gridcell', { name: /june 3, 2026/i });
    expect(day3).toBeDisabled();
    expect(day3).toHaveAttribute('aria-disabled', 'true');
  });

  test('disabled days are not clickable', () => {
    const onChange = jest.fn();
    renderPicker({ onChange, value: '2026-06-10', minDate: '2026-06-05' });
    fireEvent.click(screen.getByRole('button', { name: /jun.*10.*2026/i }));

    const day3 = screen.getByRole('gridcell', { name: /june 3, 2026/i });
    fireEvent.click(day3);

    expect(onChange).not.toHaveBeenCalled();
  });

  test('days on or after minDate are not disabled', () => {
    renderPicker({ value: '2026-06-10', minDate: '2026-06-05' });
    fireEvent.click(screen.getByRole('button', { name: /jun.*10.*2026/i }));

    const day5 = screen.getByRole('gridcell', { name: /june 5, 2026/i });
    expect(day5).not.toBeDisabled();
  });
});

describe('CalendarPicker — month navigation', () => {
  test('next month button advances the view', () => {
    renderPicker({ value: '2026-06-01', minDate: '2026-01-01' });
    fireEvent.click(screen.getByRole('button', { name: /jun.*1.*2026/i }));
    expect(screen.getByText('June 2026')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /next month/i }));
    expect(screen.getByText('July 2026')).toBeInTheDocument();
  });

  test('prev month button goes back', () => {
    renderPicker({ value: '2026-07-01', minDate: '2026-01-01' });
    fireEvent.click(screen.getByRole('button', { name: /jul.*1.*2026/i }));

    fireEvent.click(screen.getByRole('button', { name: /previous month/i }));
    expect(screen.getByText('June 2026')).toBeInTheDocument();
  });

  test('prev month button is disabled when all prev month days are before minDate', () => {
    // minDate is June 1 — prev month (May) is entirely before minDate
    renderPicker({ value: '2026-06-15', minDate: '2026-06-01' });
    fireEvent.click(screen.getByRole('button', { name: /jun.*15.*2026/i }));

    const prevBtn = screen.getByRole('button', { name: /previous month/i });
    expect(prevBtn).toBeDisabled();
  });
});
