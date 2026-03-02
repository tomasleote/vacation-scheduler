/**
 * Centralized API service for handling frontend `fetch` calls to backend serverless routes.
 * Standardizes error checking, offline detection, and JSON parsing.
 */
export async function apiCall(endpoint, options = {}) {
    // 1. Proactive Offline Check
    if (typeof window !== 'undefined' && !window.navigator.onLine) {
        throw new Error('You appear to be offline. Please check your connection and try again.');
    }

    try {
        const response = await fetch(endpoint, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        });

        let data;
        try {
            data = await response.json();
        } catch {
            // If parsing fails (e.g. Vercel 500 HTML response on container crash)
            if (!response.ok) {
                throw new Error(`Server Error (${response.status})`);
            }
            return null;
        }

        if (!response.ok) {
            throw new Error(data?.error || `Request failed with status ${response.status}`);
        }

        return data;
    } catch (err) {
        // 2. Fetch network-level catching (e.g. DNS or CORS fails before response)
        const isNetworkErr = err.message === 'Failed to fetch' || err.name === 'NetworkError' || (err.message && err.message.toLowerCase().includes('network'));
        if (isNetworkErr) {
            throw new Error('You appear to be offline or the network failed to reach the server.');
        }
        // Repropagate standardized errors decoding/TypeError issues
        throw err;
    }
}
