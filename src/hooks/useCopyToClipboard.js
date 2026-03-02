import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for clipboard copy with auto-resetting success state.
 *
 * @param {number} [resetDelay=2000] - ms before `copied` resets to false
 * @returns {{ copy: (text: string) => Promise<boolean>, copied: boolean }}
 */
export function useCopyToClipboard(resetDelay = 2000) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const copy = useCallback(
    async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopied(false), resetDelay);

        return true;
      } catch {
        setCopied(false);
        return false;
      }
    },
    [resetDelay]
  );

  return { copy, copied };
}
