/**
 * Location Service
 *
 * Uses Google Places API (New) REST endpoints directly — no Maps JavaScript SDK required.
 * Only needs "Places API" enabled in Google Cloud Console.
 *
 * Exported Functions:
 * - searchPlaces(query)     — Autocomplete suggestions via REST
 * - getPlaceDetails(placeId) — Structured location data via REST
 * - parseManualLocation(text) — Fallback for manual text input
 *
 * Exported Error Classes:
 * - QuotaExceededError — Thrown when API quota is exceeded (429)
 * - APIError           — Thrown for other API failures
 */

const BASE_URL = 'https://places.googleapis.com/v1';
const getApiKey = () => process.env.REACT_APP_GOOGLE_PLACES_API_KEY;

export class QuotaExceededError extends Error {
  constructor(message = 'Google Places API quota exceeded') {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

export class APIError extends Error {
  constructor(message = 'Google Places API error') {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Search for places using Google Places Autocomplete (New) REST API.
 * Returns normalized predictions compatible with LocationInput component.
 *
 * @param {string} query - Search query (min 2 characters)
 * @returns {Promise<Array>} Array of { place_id, main_text, secondary_text }
 * @throws {QuotaExceededError} On HTTP 429
 * @throws {APIError} On other failures
 */
export const searchPlaces = async (query) => {
  if (!query || query.trim().length < 2) return [];

  if (!getApiKey()) throw new APIError('Google Places API key not configured');

  let response;
  try {
    response = await fetch(`${BASE_URL}/places:autocomplete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': getApiKey(),
      },
      body: JSON.stringify({ input: query }),
    });
  } catch {
    throw new APIError('Network error contacting Places API');
  }

  if (response.status === 429) throw new QuotaExceededError();
  if (!response.ok) throw new APIError(`Places API error: ${response.status}`);

  const data = await response.json();

  // Normalize to shape LocationInput expects
  return (data.suggestions || []).map((s) => {
    const p = s.placePrediction;
    return {
      place_id: p.placeId,
      main_text: p.structuredFormat?.mainText?.text || p.text?.text || '',
      secondary_text: p.structuredFormat?.secondaryText?.text || '',
    };
  });
};

/**
 * Fetch structured place details using Google Places (New) REST API.
 *
 * @param {string} placeId - Google Places ID
 * @returns {Promise<Object>} { placeId, formattedAddress, name, country, city, street, postalCode, lat, lng, types }
 * @throws {QuotaExceededError} On HTTP 429
 * @throws {APIError} On other failures
 */
export const getPlaceDetails = async (placeId) => {
  if (!placeId) throw new APIError('Place ID is required');
  if (!getApiKey()) throw new APIError('Google Places API key not configured');

  const fields = 'id,displayName,formattedAddress,location,addressComponents,types';

  let response;
  try {
    response = await fetch(`${BASE_URL}/places/${placeId}?fields=${fields}`, {
      headers: {
        'X-Goog-Api-Key': getApiKey(),
      },
    });
  } catch {
    throw new APIError('Network error contacting Places API');
  }

  if (response.status === 429) throw new QuotaExceededError();
  if (!response.ok) throw new APIError(`Places API error: ${response.status}`);

  const place = await response.json();

  const components = place.addressComponents || [];
  const find = (type) =>
    components.find((c) => c.types?.includes(type))?.longText || '';

  return {
    placeId: place.id,
    formattedAddress: place.formattedAddress || '',
    name: place.displayName?.text || '',
    country: find('country'),
    city: find('locality') || find('administrative_area_level_2'),
    street: find('route'),
    postalCode: find('postal_code'),
    lat: place.location?.latitude ?? null,
    lng: place.location?.longitude ?? null,
    types: place.types || [],
  };
};

/**
 * Build a minimal location object from manual user text input.
 * Used as fallback when API is unavailable or quota exceeded.
 *
 * @param {string} text - User-entered location text
 * @returns {Object|null}
 */
export const parseManualLocation = (text) => {
  if (!text || !text.trim()) return null;
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
    types: [],
  };
};
