import React from 'react';

/**
 * A shared UI component for safely truncating text that exceeds its container's width.
 * 
 * @param {Object} props
 * @param {string} props.text - The raw text to display.
 * @param {string} [props.className] - Additional CSS classes.
 * @param {string} [props.maxWidth] - Optional CSS max-width constraint (e.g., '150px' or '100%'). Defaults to '100%'.
 */
export function TruncatedText({ text, className = '', maxWidth = '100%' }) {
    if (!text) return null;

    return (
        <span
            title={text}
            className={`block truncate ${className}`}
            style={{ maxWidth }}
        >
            {text}
        </span>
    );
}

export default TruncatedText;
