import { searchPlaces, getPlaceDetails, parseManualLocation, QuotaExceededError, APIError } from './locationService';

global.fetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  process.env.REACT_APP_GOOGLE_PLACES_API_KEY = 'test-api-key';
});

describe('locationService', () => {
  describe('searchPlaces', () => {
    test('returns empty array for query shorter than 2 characters', async () => {
      expect(await searchPlaces('')).toEqual([]);
      expect(await searchPlaces('a')).toEqual([]);
      expect(fetch).not.toHaveBeenCalled();
    });

    test('returns normalized predictions on success', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          suggestions: [
            {
              placePrediction: {
                placeId: 'place1',
                structuredFormat: {
                  mainText: { text: 'Mountain View' },
                  secondaryText: { text: 'CA, USA' },
                },
                text: { text: 'Mountain View, CA, USA' },
              },
            },
          ],
        }),
      });

      const results = await searchPlaces('Mountain View');
      expect(results).toEqual([
        { place_id: 'place1', main_text: 'Mountain View', secondary_text: 'CA, USA' },
      ]);
    });

    test('returns empty array when suggestions is empty', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ suggestions: [] }),
      });

      const results = await searchPlaces('xyzzy');
      expect(results).toEqual([]);
    });

    test('throws QuotaExceededError on HTTP 429', async () => {
      fetch.mockResolvedValueOnce({ ok: false, status: 429 });
      await expect(searchPlaces('test query')).rejects.toThrow(QuotaExceededError);
    });

    test('throws APIError on other HTTP errors', async () => {
      fetch.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(searchPlaces('test query')).rejects.toThrow(APIError);
    });

    test('throws APIError on network failure', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));
      await expect(searchPlaces('test query')).rejects.toThrow(APIError);
    });

    test('throws APIError when API key is not configured', async () => {
      delete process.env.REACT_APP_GOOGLE_PLACES_API_KEY;
      await expect(searchPlaces('test query')).rejects.toThrow(APIError);
    });

    test('sends correct request to Places API', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ suggestions: [] }),
      });

      await searchPlaces('Paris');

      expect(fetch).toHaveBeenCalledWith(
        'https://places.googleapis.com/v1/places:autocomplete',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-Goog-Api-Key': 'test-api-key',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ input: 'Paris' }),
        })
      );
    });
  });

  describe('getPlaceDetails', () => {
    const mockPlaceResponse = {
      id: 'place1',
      formattedAddress: '1600 Amphitheatre Pkwy, Mountain View, CA 94043',
      displayName: { text: 'Googleplex' },
      location: { latitude: 37.4224, longitude: -122.0842 },
      addressComponents: [
        { longText: 'Mountain View', types: ['locality'] },
        { longText: 'United States', types: ['country'] },
        { longText: '94043', types: ['postal_code'] },
        { longText: 'Amphitheatre Pkwy', types: ['route'] },
      ],
      types: ['point_of_interest'],
    };

    test('returns structured location data on success', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPlaceResponse,
      });

      const result = await getPlaceDetails('place1');
      expect(result).toEqual({
        placeId: 'place1',
        formattedAddress: '1600 Amphitheatre Pkwy, Mountain View, CA 94043',
        name: 'Googleplex',
        city: 'Mountain View',
        country: 'United States',
        postalCode: '94043',
        street: 'Amphitheatre Pkwy',
        lat: 37.4224,
        lng: -122.0842,
        types: ['point_of_interest'],
      });
    });

    test('throws APIError if placeId is missing', async () => {
      await expect(getPlaceDetails('')).rejects.toThrow(APIError);
      await expect(getPlaceDetails(null)).rejects.toThrow(APIError);
    });

    test('throws QuotaExceededError on HTTP 429', async () => {
      fetch.mockResolvedValueOnce({ ok: false, status: 429 });
      await expect(getPlaceDetails('place1')).rejects.toThrow(QuotaExceededError);
    });

    test('throws APIError on other HTTP errors', async () => {
      fetch.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(getPlaceDetails('place1')).rejects.toThrow(APIError);
    });

    test('throws APIError on network failure', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));
      await expect(getPlaceDetails('place1')).rejects.toThrow(APIError);
    });

    test('handles missing address components gracefully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'place1',
          formattedAddress: 'Some Place',
          displayName: { text: 'Some Place' },
          location: null,
          addressComponents: [],
          types: [],
        }),
      });

      const result = await getPlaceDetails('place1');
      expect(result.city).toBe('');
      expect(result.country).toBe('');
      expect(result.lat).toBeNull();
      expect(result.lng).toBeNull();
    });

    test('sends correct request with fields parameter', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPlaceResponse,
      });

      await getPlaceDetails('place1');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('places/place1'),
        expect.objectContaining({
          headers: expect.objectContaining({ 'X-Goog-Api-Key': 'test-api-key' }),
        })
      );
    });
  });

  describe('parseManualLocation', () => {
    test('returns null for empty input', () => {
      expect(parseManualLocation('')).toBeNull();
      expect(parseManualLocation('   ')).toBeNull();
      expect(parseManualLocation(null)).toBeNull();
    });

    test('returns minimal location object for valid text', () => {
      const result = parseManualLocation('Paris, France');
      expect(result).toEqual({
        formattedAddress: 'Paris, France',
        name: null, placeId: null,
        lat: null, lng: null,
        country: null, city: null,
        street: null, postalCode: null,
        types: [],
      });
    });

    test('trims whitespace from input', () => {
      expect(parseManualLocation('  Rome  ').formattedAddress).toBe('Rome');
    });
  });

  describe('error classes', () => {
    test('QuotaExceededError has correct name', () => {
      const err = new QuotaExceededError();
      expect(err.name).toBe('QuotaExceededError');
      expect(err instanceof Error).toBe(true);
    });

    test('APIError has correct name and accepts custom message', () => {
      const err = new APIError('custom');
      expect(err.name).toBe('APIError');
      expect(err.message).toBe('custom');
    });
  });
});
