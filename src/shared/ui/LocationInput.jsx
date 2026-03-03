import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { searchPlaces, getPlaceDetails, parseManualLocation, QuotaExceededError, APIError } from '../../services/locationService';
import Input from './Input';
import { Label } from './Input';

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
  const [allowAutocomplete, setAllowAutocomplete] = useState(true);
  const searchTimeoutRef = useRef(null);
  const blurTimeoutRef = useRef(null);
  const selectingPredictionRef = useRef(false);

  // Update input when value prop changes
  useEffect(() => {
    setInputValue(value?.formattedAddress || '');
  }, [value]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

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
    selectingPredictionRef.current = true;
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
      } else {
        setError('Could not load details. You can manually enter the location.');
      }
      if (onError) onError(err);
    } finally {
      setLoading(false);
      // Small delay to ensure blur handler check finishes
      setTimeout(() => {
        selectingPredictionRef.current = false;
      }, 300);
    }
  };

  const handleBlur = () => {
    // Delay hiding predictions to allow click to register
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    blurTimeoutRef.current = setTimeout(() => {
      setShowPredictions(false);
      // If user typed something but didn't select from dropdown, treat as manual entry
      // Skip if we're currently selecting a prediction to avoid duplicate calls
      // Also skip if the input value is the same as the currently selected value (to avoid re-selecting same location)
      if (!selectingPredictionRef.current && inputValue && inputValue !== value?.formattedAddress) {
        const manualLocation = parseManualLocation(inputValue);
        if (manualLocation) {
          onSelect(manualLocation);
        }
      }
    }, 200);
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
