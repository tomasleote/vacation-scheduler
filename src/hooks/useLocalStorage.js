import { useState, useCallback } from 'react';

/**
 * Custom hook for safe localStorage access with JSON parsing.
 *
 * @param {string} key - localStorage key
 * @param {*} defaultValue - fallback when key is missing or parsing fails
 * @returns {[*, function]} - [storedValue, setValue]
 */
export function useLocalStorage(key, defaultValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setValue = useCallback(
    (value) => {
      try {
        setStoredValue(prev => {
          const valueToStore = value instanceof Function ? value(prev) : value;
          localStorage.setItem(key, JSON.stringify(valueToStore));
          return valueToStore;
        });
      } catch {
        // localStorage may be full or disabled — silently fail
      }
    },
    [key]
  );

  return [storedValue, setValue];
}
