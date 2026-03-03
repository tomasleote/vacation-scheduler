# Location Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add optional location field to Groups with Google Places autocomplete in admin settings, location display in participant view, and public preview integration.

**Architecture:** LocationInput component → locationService (Google Places API logic) → Firebase → LocationDisplay components (admin, participant, public). Free tier quota protection with graceful fallback to manual text input.

**Tech Stack:** React 18, Firebase Realtime Database, Google Places API (free tier), Tailwind CSS, Lucide icons

---

## Task 1: Set Up Google Places API & Environment

**Files:**
- Modify: `.env.local` (add API key)
- Modify: `public/index.html` (load Google Maps script)

**Step 1: Add environment variable**

In `.env.local`, add:

```
REACT_APP_GOOGLE_PLACES_API_KEY=YOUR_API_KEY_HERE
```

**Why:** Separates API key from source code, enables environment-specific values.

**Step 2: Load Google Maps script**

In `public/index.html`, find the closing `</head>` tag and add before it:

```html
<script
  src="https://maps.googleapis.com/maps/api/js?key=%REACT_APP_GOOGLE_PLACES_API_KEY%&libraries=places"
  async
  defer
></script>
```

**Note:** React will interpolate `%REACT_APP_GOOGLE_PLACES_API_KEY%` at build time.

**Step 3: Verify script loads**

In browser DevTools Console, run:

```javascript
window.google.maps.places.AutocompleteService
```

Expected: Function object (not undefined)

**Step 4: Commit**

```bash
git add .env.local public/index.html
git commit -m "setup: add Google Places API script and environment variable"
```

---

## Task 2: Create locationService with Free Tier Protection

**Files:**
- Create: `src/services/locationService.js`
- Create: `src/services/locationService.test.js`

**Step 1: Write test for API availability check**

Create `src/services/locationService.test.js`:

```javascript
describe('locationService', () => {
  describe('isPlacesAPIAvailable', () => {
    test('returns true if Google Places API is loaded', () => {
      window.google = {
        maps: {
          places: {
            AutocompleteService: jest.fn(),
            PlacesService: jest.fn()
          }
        }
      };
      const { isPlacesAPIAvailable } = require('./locationService');
      expect(isPlacesAPIAvailable()).toBe(true);
    });

    test('returns false if Google Places API is not loaded', () => {
      delete window.google;
      jest.resetModules();
      const { isPlacesAPIAvailable } = require('./locationService');
      expect(isPlacesAPIAvailable()).toBe(false);
    });
  });
});
```

**Step 2: Run test (should fail)**

```bash
npm test -- src/services/locationService.test.js --no-coverage
```

Expected: `FAIL - Cannot find module './locationService'`

**Step 3: Write locationService.js with error classes**

Create `src/services/locationService.js`:

```javascript
/**
 * Custom error for when Google Places API quota is exceeded
 */
export class QuotaExceededError extends Error {
  constructor(message = 'Google Places API quota exceeded') {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

/**
 * Custom error for API failures
 */
export class APIError extends Error {
  constructor(message = 'Google Places API error') {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Check if Google Places API is available
 * @returns {boolean}
 */
export const isPlacesAPIAvailable = () => {
  return !!(window.google?.maps?.places?.AutocompleteService);
};

/**
 * Search for places using Google Autocomplete API
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Array of predictions
 * @throws {QuotaExceededError} - If API quota exceeded
 * @throws {APIError} - If API fails
 */
export const searchPlaces = async (query) => {
  if (!isPlacesAPIAvailable()) {
    throw new APIError('Google Places API not loaded');
  }

  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const service = new window.google.maps.places.AutocompleteService();
    const request = { input: query };

    const response = await service.getPlacePredictions(request);

    // Check for quota exceeded
    if (response.status === 'OVER_QUERY_LIMIT') {
      throw new QuotaExceededError();
    }

    // Handle other error statuses
    if (response.status && response.status !== 'OK' && response.status !== 'ZERO_RESULTS') {
      throw new APIError(`Google API error: ${response.status}`);
    }

    return response.predictions || [];
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      throw error;
    }
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(error.message);
  }
};

/**
 * Get detailed place information
 * @param {string} placeId - Google Places ID
 * @returns {Promise<Object>} - Place details
 * @throws {QuotaExceededError} - If API quota exceeded
 * @throws {APIError} - If API fails
 */
export const getPlaceDetails = async (placeId) => {
  if (!isPlacesAPIAvailable()) {
    throw new APIError('Google Places API not loaded');
  }

  if (!placeId) {
    throw new APIError('Place ID is required');
  }

  try {
    const service = new window.google.maps.places.PlacesService(
      document.createElement('div')
    );

    return new Promise((resolve, reject) => {
      service.getDetails(
        { placeId, fields: [
          'formatted_address',
          'geometry',
          'address_components',
          'name',
          'types',
          'place_id'
        ]},
        (place, status) => {
          if (status === 'OVER_QUERY_LIMIT') {
            reject(new QuotaExceededError());
            return;
          }

          if (status !== 'OK') {
            reject(new APIError(`Google API error: ${status}`));
            return;
          }

          if (!place) {
            reject(new APIError('No place details returned'));
            return;
          }

          // Extract location components
          const components = place.address_components || [];
          const locality = components.find(c => c.types.includes('locality'))?.long_name || '';
          const country = components.find(c => c.types.includes('country'))?.long_name || '';
          const postal = components.find(c => c.types.includes('postal_code'))?.long_name || '';
          const route = components.find(c => c.types.includes('route'))?.long_name || '';

          resolve({
            placeId: place.place_id,
            formattedAddress: place.formatted_address,
            name: place.name,
            country,
            city: locality,
            street: route,
            postalCode: postal,
            lat: place.geometry?.location?.lat(),
            lng: place.geometry?.location?.lng(),
            types: place.types || []
          });
        }
      );
    });
  } catch (error) {
    if (error instanceof QuotaExceededError || error instanceof APIError) {
      throw error;
    }
    throw new APIError(error.message);
  }
};

/**
 * Parse location object from user input
 * Minimal object if user enters text manually (no API call)
 * @param {string} text - User-entered text
 * @returns {Object} - Minimal location object
 */
export const parseManualLocation = (text) => {
  if (!text || !text.trim()) {
    return null;
  }

  return {
    formattedAddress: text.trim(),
    name: null,
    placeId: null,
    lat: null,
    lng: null,
    country: null,
    city: null,
    street: null,
    postalCode: null,
    types: []
  };
};
```

**Step 4: Run tests**

```bash
npm test -- src/services/locationService.test.js --no-coverage
```

Expected: `PASS`

**Step 5: Add more tests for searchPlaces**

Update `src/services/locationService.test.js`, add to the describe block:

```javascript
  describe('searchPlaces', () => {
    beforeEach(() => {
      window.google = {
        maps: {
          places: {
            AutocompleteService: jest.fn(() => ({
              getPlacePredictions: jest.fn()
            }))
          }
        }
      };
    });

    test('throws APIError if API not available', async () => {
      delete window.google;
      jest.resetModules();
      const { searchPlaces, APIError: ImportedAPIError } = require('./locationService');

      await expect(searchPlaces('test')).rejects.toThrow();
    });

    test('returns empty array for short query', async () => {
      const { searchPlaces } = require('./locationService');
      const results = await searchPlaces('a');
      expect(results).toEqual([]);
    });

    test('throws QuotaExceededError on OVER_QUERY_LIMIT', async () => {
      const mockGetPlacePredictions = jest.fn().mockResolvedValue({
        status: 'OVER_QUERY_LIMIT',
        predictions: []
      });
      window.google.maps.places.AutocompleteService = jest.fn(() => ({
        getPlacePredictions: mockGetPlacePredictions
      }));
      jest.resetModules();
      const { searchPlaces, QuotaExceededError } = require('./locationService');

      await expect(searchPlaces('Mountain View')).rejects.toThrow(QuotaExceededError);
    });

    test('returns predictions on success', async () => {
      const mockPredictions = [
        {
          place_id: 'place1',
          main_text: 'Mountain View',
          secondary_text: 'CA, USA'
        }
      ];
      const mockGetPlacePredictions = jest.fn().mockResolvedValue({
        status: 'OK',
        predictions: mockPredictions
      });
      window.google.maps.places.AutocompleteService = jest.fn(() => ({
        getPlacePredictions: mockGetPlacePredictions
      }));
      jest.resetModules();
      const { searchPlaces } = require('./locationService');

      const results = await searchPlaces('Mountain View');
      expect(results).toEqual(mockPredictions);
    });
  });
```

**Step 6: Run tests again**

```bash
npm test -- src/services/locationService.test.js --no-coverage
```

Expected: All tests PASS

**Step 7: Commit**

```bash
git add src/services/locationService.js src/services/locationService.test.js
git commit -m "feat(services): create locationService with Google Places API and quota protection

- searchPlaces: autocomplete with quota exceeded detection
- getPlaceDetails: fetch structured location data
- parseManualLocation: handle manual text input fallback
- QuotaExceededError: custom error for free tier limit exceeded
- Full test coverage for all error scenarios"
```

---

## Task 3: Create LocationInput Component

**Files:**
- Create: `src/shared/ui/LocationInput.jsx`
- Create: `src/shared/ui/LocationInput.test.js`

**Step 1: Write test for LocationInput**

Create `src/shared/ui/LocationInput.test.js`:

```javascript
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
      () => new Promise(resolve => setTimeout(() => resolve([]), 100))
    );

    render(<LocationInput value={null} onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText(/location/i);

    fireEvent.change(input, { target: { value: 'Mountain View' } });

    await waitFor(() => {
      expect(screen.queryByText(/searching/i)).toBeInTheDocument();
    });
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
});
```

**Step 2: Run test (should fail)**

```bash
npm test -- src/shared/ui/LocationInput.test.js --no-coverage
```

Expected: Test fails - component doesn't exist yet

**Step 3: Create LocationInput component**

Create `src/shared/ui/LocationInput.jsx`:

```javascript
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { searchPlaces, getPlaceDetails, parseManualLocation, isPlacesAPIAvailable, QuotaExceededError, APIError } from '../../services/locationService';
import Input from './Input';
import Label from './Label';

/**
 * LocationInput Component
 * Provides Google Places autocomplete with fallback to manual text input
 *
 * @param {Object} props
 * @param {Object|null} props.value - Current location object
 * @param {Function} props.onSelect - Callback when location is selected
 * @param {Function} [props.onError] - Callback on error
 * @param {boolean} [props.disabled] - Disable input
 * @param {boolean} [props.readOnly] - Read-only mode
 * @returns {React.ReactElement}
 */
function LocationInput({
  value,
  onSelect,
  onError,
  disabled = false,
  readOnly = false
}) {
  const [inputValue, setInputValue] = useState(value?.formattedAddress || '');
  const [predictions, setPredictions] = useState([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allowAutocomplete, setAllowAutocomplete] = useState(isPlacesAPIAvailable());
  const searchTimeoutRef = useRef(null);

  // Update input when value prop changes
  useEffect(() => {
    if (value?.formattedAddress) {
      setInputValue(value.formattedAddress);
    }
  }, [value]);

  const handleSearch = useCallback(async (query) => {
    if (query.length < 2) {
      setPredictions([]);
      setShowPredictions(false);
      setError(null);
      return;
    }

    if (!allowAutocomplete) {
      setShowPredictions(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await searchPlaces(query);
      setPredictions(results);
      setShowPredictions(true);
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        setError('Using manual entry mode');
        setAllowAutocomplete(false);
      } else if (err instanceof APIError) {
        setError('Search unavailable. Enter location manually.');
        setAllowAutocomplete(false);
      } else {
        setError('Search failed. Try manually entering location.');
      }
      setPredictions([]);
      setShowPredictions(false);
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  }, [allowAutocomplete, onError]);

  const handleInputChange = (e) => {
    const query = e.target.value;
    setInputValue(query);
    setShowPredictions(false);

    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(query);
    }, 300);
  };

  const handleSelectPrediction = async (prediction) => {
    setLoading(true);
    setError(null);

    try {
      const placeId = prediction.place_id;
      const details = await getPlaceDetails(placeId);

      setInputValue(details.formattedAddress);
      setShowPredictions(false);
      setPredictions([]);
      onSelect(details);
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        setError('Using manual entry mode');
        setAllowAutocomplete(false);
      } else if (err instanceof APIError) {
        setError('Could not load details. You can manually enter the location.');
      }
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlur = () => {
    // Delay hiding predictions to allow click to register
    setTimeout(() => {
      setShowPredictions(false);
    }, 200);

    // If user typed something but didn't select from dropdown, treat as manual entry
    if (inputValue && !value?.placeId) {
      const manualLocation = parseManualLocation(inputValue);
      if (manualLocation) {
        onSelect(manualLocation);
      }
    }
  };

  if (readOnly) {
    return (
      <div className="flex items-center gap-2 text-gray-300">
        <MapPin size={18} className="text-brand-400" />
        <span>{inputValue || 'No location set'}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <Label size="compact">Location</Label>
      <div className="relative">
        <Input
          type="text"
          size="compact"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={() => predictions.length > 0 && setShowPredictions(true)}
          placeholder="Enter location (city, address, restaurant...)"
          disabled={disabled}
          className="pl-9"
        />
        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />

        {loading && (
          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 animate-spin" />
        )}
      </div>

      {error && (
        <div className="mt-2 flex items-start gap-2 p-2 bg-orange-500/10 border border-orange-500/30 rounded text-sm text-orange-400">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {showPredictions && predictions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-dark-800 border border-dark-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {predictions.map((prediction, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectPrediction(prediction)}
              className="w-full text-left px-4 py-2.5 hover:bg-dark-700 transition-colors border-b border-dark-700 last:border-b-0"
            >
              <div className="text-sm text-gray-200">{prediction.main_text}</div>
              {prediction.secondary_text && (
                <div className="text-xs text-gray-500">{prediction.secondary_text}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {showPredictions && predictions.length === 0 && inputValue.length >= 2 && !loading && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-dark-800 border border-dark-700 rounded-lg shadow-lg p-3 text-sm text-gray-400">
          No results found
        </div>
      )}
    </div>
  );
}

export default LocationInput;
```

**Step 4: Run tests**

```bash
npm test -- src/shared/ui/LocationInput.test.js --no-coverage
```

Expected: Tests PASS

**Step 5: Commit**

```bash
git add src/shared/ui/LocationInput.jsx src/shared/ui/LocationInput.test.js
git commit -m "feat(ui): create LocationInput component with autocomplete and fallback

- Google Places autocomplete with debounced search
- Graceful degradation on quota exceeded or API error
- Manual text entry fallback always available
- Displays loading state during search
- Handles prediction selection and detail fetching"
```

---

## Task 4: Create LocationDisplay Component

**Files:**
- Create: `src/shared/ui/LocationDisplay.jsx`
- Create: `src/shared/ui/LocationDisplay.test.js`

**Step 1: Write test**

Create `src/shared/ui/LocationDisplay.test.js`:

```javascript
import React from 'react';
import { render, screen } from '@testing-library/react';
import LocationDisplay from './LocationDisplay';

describe('LocationDisplay', () => {
  test('renders nothing if location is null', () => {
    const { container } = render(<LocationDisplay location={null} />);
    expect(container.firstChild).toBeEmptyDOMElement();
  });

  test('renders formatted address', () => {
    const location = {
      formattedAddress: '1600 Amphitheatre Parkway, Mountain View, CA 94043',
      placeId: 'ChIJN1blFLsV9IIRCB33QewcLjM'
    };
    render(<LocationDisplay location={location} />);
    expect(screen.getByText(location.formattedAddress)).toBeInTheDocument();
  });

  test('renders Google Maps link with placeId', () => {
    const location = {
      formattedAddress: '1600 Amphitheatre Parkway, Mountain View, CA 94043',
      placeId: 'ChIJN1blFLsV9IIRCB33QewcLjM'
    };
    render(<LocationDisplay location={location} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', expect.stringContaining('place_id:ChIJN1blFLsV9IIRCB33QewcLjM'));
    expect(link).toHaveAttribute('target', '_blank');
  });

  test('renders Google Maps link with address if no placeId', () => {
    const location = {
      formattedAddress: 'Some Manual Address',
      placeId: null
    };
    render(<LocationDisplay location={location} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', expect.stringContaining('?q=Some%20Manual%20Address'));
  });

  test('renders location icon', () => {
    const location = { formattedAddress: '123 Main St', placeId: null };
    const { container } = render(<LocationDisplay location={location} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
```

**Step 2: Run test (should fail)**

```bash
npm test -- src/shared/ui/LocationDisplay.test.js --no-coverage
```

Expected: FAIL - component doesn't exist

**Step 3: Create LocationDisplay component**

Create `src/shared/ui/LocationDisplay.jsx`:

```javascript
import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';

/**
 * LocationDisplay Component
 * Read-only display of a location with Google Maps link
 *
 * @param {Object} props
 * @param {Object|null} props.location - Location object
 * @param {boolean} [props.showIcon] - Show location icon
 * @returns {React.ReactElement|null}
 */
function LocationDisplay({ location, showIcon = true }) {
  if (!location || !location.formattedAddress) {
    return null;
  }

  // Build Google Maps link
  const mapsUrl = location.placeId
    ? `https://maps.google.com/?q=place_id:${location.placeId}`
    : `https://maps.google.com/?q=${encodeURIComponent(location.formattedAddress)}`;

  return (
    <div className="flex items-start gap-3">
      {showIcon && (
        <MapPin size={18} className="text-brand-400 flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1">
        <div className="text-sm text-gray-300 mb-2">
          {location.formattedAddress}
        </div>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors"
        >
          Open in Google Maps
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}

export default LocationDisplay;
```

**Step 4: Run tests**

```bash
npm test -- src/shared/ui/LocationDisplay.test.js --no-coverage
```

Expected: PASS

**Step 5: Update shared UI exports**

Modify `src/shared/ui/index.js`, add:

```javascript
export { default as LocationInput } from './LocationInput';
export { default as LocationDisplay } from './LocationDisplay';
```

**Step 6: Commit**

```bash
git add src/shared/ui/LocationDisplay.jsx src/shared/ui/LocationDisplay.test.js src/shared/ui/index.js
git commit -m "feat(ui): create LocationDisplay component for read-only location rendering

- Displays formatted address with location icon
- Generates Google Maps link (via placeId or address)
- Safe for participant view and public previews"
```

---

## Task 5: Integrate LocationInput into GroupSettings

**Files:**
- Modify: `src/features/admin/GroupSettings.jsx` (add location field in edit mode)

**Step 1: Update GroupSettings to handle location in editData**

Find the `editData` state initialization in `src/features/admin/GroupSettings.jsx`. Update the component to include location:

```javascript
// In the editing section, add location field after description:

<div>
  <Label size="compact">Location</Label>
  <LocationInput
    value={editData.location}
    onSelect={(location) => setEditData({ ...editData, location })}
    onError={(error) => console.error('Location error:', error)}
  />
</div>
```

Add import at top of file:

```javascript
import { LocationInput } from '../../shared/ui';
```

**Step 2: Verify GroupSettings receives location in onSaveEdit**

The `onSaveEdit` function should already handle location via editData. Verify it calls:

```javascript
groupService.updateGroup(groupId, editData);
// This will include location if present
```

**Step 3: Display location in read-only view**

Add to the non-editing section in GroupSettings (after description):

```javascript
{group.location && (
  <div className="border-t border-dark-700/50 pt-3 mt-3">
    <LocationDisplay location={group.location} />
  </div>
)}
```

Add import:

```javascript
import { LocationInput, LocationDisplay } from '../../shared/ui';
```

**Step 4: Verify component still renders**

```bash
npm start
```

Navigate to admin panel, verify GroupSettings loads without errors.

**Step 5: Commit**

```bash
git add src/features/admin/GroupSettings.jsx
git commit -m "feat(admin): integrate LocationInput into GroupSettings

- Location field in edit mode with autocomplete
- Display location in read-only view
- Saves location to Firebase via groupService"
```

---

## Task 6: Add LocationDisplay to ParticipantView

**Files:**
- Modify: `src/components/ParticipantView.js`

**Step 1: Display location in participant view**

Find where group info is displayed in `ParticipantView.js`. Add:

```javascript
{group.location && (
  <div className="mt-4 p-4 bg-dark-800 rounded-lg border border-dark-700">
    <LocationDisplay location={group.location} />
  </div>
)}
```

Add import:

```javascript
import { LocationDisplay } from '../shared/ui';
```

**Step 2: Test navigation**

```bash
npm start
```

Create/join a group, verify location displays after admin sets it.

**Step 3: Commit**

```bash
git add src/components/ParticipantView.js
git commit -m "feat(participant): display location in group view

- Shows location with Google Maps link
- Only displays if location is set"
```

---

## Task 7: Update SchemaMarkup & SEO

**Files:**
- Modify: `src/features/landing/SchemaMarkup.jsx` (add location to schema)

**Step 1: Update schema to include location**

In `SchemaMarkup.jsx`, update the Event schema to include location:

```javascript
const schema = {
  "@context": "https://schema.org",
  "@type": "Event",
  "name": group.name,
  "description": group.description,
  "startDate": group.startDate,
  "endDate": group.endDate,
  "eventAttendanceMode": "OfflineEventAttendanceMode",
  // NEW: Add location
  ...(group.location && {
    "location": {
      "@type": "Place",
      "name": group.location.name || group.location.formattedAddress,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": group.location.street || "",
        "addressLocality": group.location.city || "",
        "addressCountry": group.location.country || ""
      },
      ...(group.location.lat && group.location.lng && {
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": group.location.lat,
          "longitude": group.location.lng
        }
      })
    }
  })
};
```

**Step 2: Update OpenGraph meta tags**

Find where OpenGraph tags are set (likely in meta tags or index.html). Add:

```html
<!-- If location exists -->
<meta property="og:description" content="July 1-15, 2025 · 8 participants · Mountain View, CA" />
```

This would be dynamic based on group. If using react-helmet-async, update the Helmet component.

**Step 3: Commit**

```bash
git add src/features/landing/SchemaMarkup.jsx
git commit -m "feat(seo): add location to structured data and OpenGraph

- Include location in Event schema.org markup
- Add location city/country to OpenGraph description
- Improve social preview information"
```

---

## Task 8: Add Comprehensive Tests

**Files:**
- Modify: `src/services/locationService.test.js` (already started in Task 2)
- Modify: `src/shared/ui/LocationInput.test.js` (already started in Task 3)
- Modify: `src/shared/ui/LocationDisplay.test.js` (already started in Task 4)

**Step 1: Run all tests**

```bash
npm test -- --testPathPattern="location" --no-coverage
```

Expected: All tests PASS

**Step 2: Verify test coverage**

```bash
npm test -- --testPathPattern="location" --coverage
```

Check that critical paths are covered:
- locationService: 85%+
- LocationInput: 80%+
- LocationDisplay: 90%+

**Step 3: Commit if adding new tests**

```bash
git add src/services/locationService.test.js src/shared/ui/LocationInput.test.js src/shared/ui/LocationDisplay.test.js
git commit -m "test: add comprehensive tests for location feature

- locationService API error handling and quota detection
- LocationInput autocomplete and fallback behavior
- LocationDisplay rendering and link generation"
```

---

## Task 9: Manual Testing Checklist

**Step 1: Test group creation (without location)**

- [ ] Create new group without entering location
- [ ] Verify group saves successfully
- [ ] Verify location is not displayed in participant view

**Step 2: Test admin adding location**

- [ ] Log in as admin
- [ ] Edit group settings
- [ ] Type in location field → verify autocomplete suggestions appear
- [ ] Select a suggestion → verify full address and coordinates saved
- [ ] Refresh page → verify location persists

**Step 3: Test location display**

- [ ] View group as participant
- [ ] Verify location displays with icon
- [ ] Click "Open in Google Maps" → verifies link opens

**Step 4: Test fallback behavior**

- [ ] Make many location searches to trigger quota (or mock in dev)
- [ ] Verify autocomplete disables
- [ ] Verify user can still enter location manually
- [ ] Verify manual text is saved to Firebase

**Step 5: Test API failures**

- [ ] Disconnect internet
- [ ] Try to search location
- [ ] Verify error message: "Search unavailable..."
- [ ] Verify user can still enter location manually

**Step 6: Test public preview**

- [ ] Share group link on social media (or check meta tags in browser)
- [ ] Verify location appears in preview
- [ ] Verify schema.org location data is in page source

---

## Git Commit Summary

After all tasks, you should have commits like:

```
setup: add Google Places API script and environment variable
feat(services): create locationService with Google Places API and quota protection
feat(ui): create LocationInput component with autocomplete and fallback
feat(ui): create LocationDisplay component for read-only location rendering
feat(admin): integrate LocationInput into GroupSettings
feat(participant): display location in group view
feat(seo): add location to structured data and OpenGraph
test: add comprehensive tests for location feature
```

---

## Implementation Notes

**Architecture Principles Followed:**
- ✅ No direct API calls in components (locationService isolates logic)
- ✅ Reusable LocationInput component
- ✅ Backward compatible (location is optional)
- ✅ Free tier quota protection with graceful fallback
- ✅ Services → UI → Features pattern
- ✅ TDD approach (tests before implementation)

**Key Edge Cases Handled:**
- API quota exceeded → fallback to text
- API unavailable → fallback to text
- User enters short query → no API call
- User selects prediction → fetch full details
- User types manually → minimal location object stored
- Existing groups without location → no breaking changes

---

## Estimated Effort

- **Task 1:** 10 minutes (setup)
- **Task 2:** 45 minutes (locationService + tests)
- **Task 3:** 60 minutes (LocationInput + tests)
- **Task 4:** 20 minutes (LocationDisplay + tests)
- **Task 5:** 15 minutes (GroupSettings integration)
- **Task 6:** 10 minutes (ParticipantView)
- **Task 7:** 15 minutes (SEO/schema)
- **Task 8:** 10 minutes (test verification)
- **Task 9:** 20 minutes (manual testing)

**Total: ~3.5 hours**

---

