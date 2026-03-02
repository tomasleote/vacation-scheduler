import React from 'react';
import Card from './Card';
import Button from './Button';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary caught error]', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex items-center justify-center min-h-[50vh] p-4">
                    <Card variant="danger" className="max-w-md w-full text-center space-y-4">
                        <div>
                            <h2 className="text-xl font-bold text-rose-400 mb-2">Something went wrong</h2>
                            <p className="text-sm text-gray-300">
                                An unexpected error occurred. This has been logged in your local console.
                            </p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="secondary"
                                fullWidth
                                onClick={this.handleGoHome}
                            >
                                Go Home
                            </Button>
                            <Button
                                variant="primary"
                                fullWidth
                                onClick={this.handleReload}
                            >
                                Reload Page
                            </Button>
                        </div>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
