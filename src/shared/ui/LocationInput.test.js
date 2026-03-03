import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LocationInput from './LocationInput';
import * as locationService from '../../services/locationService';

jest.mock('../../services/locationService');

describe('LocationInput', () => {
  const mockOnSelect = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders input field', () => {
    render(<LocationInput value={null} onSelect={mockOnSelect} />);
    expect(screen.getByPlaceholderText(/location/i)).toBeInTheDocument();
  });

  test('displays current location if provided', () => {
    const location = { formattedAddress: '123 Main St' };
    render(<LocationInput value={location} onSelect={mockOnSelect} />);
    expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument();
  });

  test('shows loading state during search', async () => {
    locationService.searchPlaces.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 500))
    );

    render(<LocationInput value={null} onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText(/location/i);

    fireEvent.change(input, { target: { value: 'Mountain View' } });

    // Verify input changed
    expect(input.value).toBe('Mountain View');

    // searchPlaces should be called after debounce
    await waitFor(() => {
      expect(locationService.searchPlaces).toHaveBeenCalledWith('Mountain View');
    }, { timeout: 500 });
  });

  test('shows quota exceeded message when API quota exceeded', async () => {
    locationService.searchPlaces.mockRejectedValue(
      new locationService.QuotaExceededError()
    );

    render(<LocationInput value={null} onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText(/location/i);

    fireEvent.change(input, { target: { value: 'Mountain View' } });

    await waitFor(() => {
      expect(screen.getByText(/using manual entry/i)).toBeInTheDocument();
    });
  });

  test('shows API error message when API fails', async () => {
    locationService.searchPlaces.mockRejectedValue(
      new locationService.APIError('Network error')
    );

    render(<LocationInput value={null} onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText(/location/i);

    fireEvent.change(input, { target: { value: 'Mountain View' } });

    await waitFor(() => {
      expect(screen.getByText(/search unavailable/i)).toBeInTheDocument();
    });
  });

  test('calls onSelect when prediction is selected', async () => {
    const mockLocation = {
      placeId: 'place1',
      formattedAddress: '123 Main St',
      city: 'Mountain View',
      country: 'USA'
    };

    locationService.searchPlaces.mockResolvedValue([
      { place_id: 'place1', main_text: '123 Main St', secondary_text: 'Mountain View, USA' }
    ]);
    locationService.getPlaceDetails.mockResolvedValue(mockLocation);

    render(<LocationInput value={null} onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText(/location/i);

    fireEvent.change(input, { target: { value: '123' } });

    await waitFor(() => {
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('123 Main St'));

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith(mockLocation);
    });
  });

  test('disables autocomplete after quota exceeded and allows manual entry', async () => {
    locationService.searchPlaces.mockRejectedValueOnce(
      new locationService.QuotaExceededError()
    );
    locationService.parseManualLocation.mockReturnValue({
      formattedAddress: 'My Location',
      name: null,
      placeId: null
    });

    render(<LocationInput value={null} onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText(/location/i);

    // First search triggers quota error
    fireEvent.change(input, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByText(/using manual entry/i)).toBeInTheDocument();
    });

    // Can still enter manual location
    fireEvent.change(input, { target: { value: 'My Location' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalled();
    });
  });

  test('shows readOnly mode when readOnly prop is true', () => {
    const location = { formattedAddress: '123 Main St' };
    render(<LocationInput value={location} onSelect={mockOnSelect} readOnly={true} />);
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/location/i)).not.toBeInTheDocument();
  });

  test('shows "No location set" in readOnly mode when value is null', () => {
    render(<LocationInput value={null} onSelect={mockOnSelect} readOnly={true} />);
    expect(screen.getByText('No location set')).toBeInTheDocument();
  });

  test('handles blur event and selects manual location', async () => {
    locationService.parseManualLocation.mockReturnValue({
      formattedAddress: 'Manual Entry Location',
      name: null,
      placeId: null
    });

    render(<LocationInput value={null} onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText(/location/i);

    fireEvent.change(input, { target: { value: 'Manual Entry Location' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith({
        formattedAddress: 'Manual Entry Location',
        name: null,
        placeId: null
      });
    });
  });

  test('does not call parseManualLocation on blur if placeId exists', async () => {
    const location = {
      placeId: 'place1',
      formattedAddress: '123 Main St'
    };

    render(<LocationInput value={location} onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText(/location/i);

    fireEvent.blur(input);

    // Should not call parseManualLocation since value already has placeId
    expect(locationService.parseManualLocation).not.toHaveBeenCalled();
  });

  test('shows predictions dropdown with matching results', async () => {
    locationService.searchPlaces.mockResolvedValue([
      { place_id: 'place1', main_text: '123 Main St', secondary_text: 'Mountain View, USA' },
      { place_id: 'place2', main_text: '456 Oak Ave', secondary_text: 'Mountain View, USA' }
    ]);

    render(<LocationInput value={null} onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText(/location/i);

    fireEvent.change(input, { target: { value: '123' } });

    await waitFor(() => {
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
      expect(screen.getByText('456 Oak Ave')).toBeInTheDocument();
    });
  });

  test('clears predictions when input length is less than 2', async () => {
    render(<LocationInput value={null} onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText(/location/i);

    fireEvent.change(input, { target: { value: 'a' } });

    // After debounce, should not show predictions
    await waitFor(() => {
      expect(screen.queryByText(/no results found/i)).not.toBeInTheDocument();
    }, { timeout: 400 });
  });

  test('handles getPlaceDetails error gracefully', async () => {
    locationService.searchPlaces.mockResolvedValue([
      { place_id: 'place1', main_text: '123 Main St', secondary_text: 'Mountain View, USA' }
    ]);
    locationService.getPlaceDetails.mockRejectedValue(
      new locationService.APIError('Failed to fetch details')
    );

    render(<LocationInput value={null} onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText(/location/i);

    fireEvent.change(input, { target: { value: '123' } });

    await waitFor(() => {
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('123 Main St'));

    await waitFor(() => {
      expect(screen.getByText(/could not load details/i)).toBeInTheDocument();
    });
  });

  test('calls onError callback when API error occurs', async () => {
    const error = new locationService.APIError('Network error');
    locationService.searchPlaces.mockRejectedValue(error);

    render(<LocationInput value={null} onSelect={mockOnSelect} onError={mockOnError} />);
    const input = screen.getByPlaceholderText(/location/i);

    fireEvent.change(input, { target: { value: 'test' } });

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(error);
    });
  });
});
