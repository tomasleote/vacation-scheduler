import React, { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error to an error reporting service
        console.error('[Runtime Crash] React Error Boundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="flex items-center justify-center min-h-screen bg-dark-950 p-4">
                    <div className="bg-dark-900 rounded-xl border border-dark-700 p-8 max-w-md w-full text-center shadow-xl">
                        <div className="mb-6 mx-auto w-16 h-16 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-50 mb-3">Something went wrong</h1>
                        <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                            We've encountered an unexpected error. Please try refreshing the page or navigating back home.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 bg-brand-500 hover:bg-brand-400 text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-sm"
                            >
                                Refresh Page
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="flex-1 bg-dark-800 hover:bg-dark-700 text-gray-300 font-bold py-2.5 px-4 rounded-lg border border-dark-700 transition-colors text-sm"
                            >
                                Go Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
