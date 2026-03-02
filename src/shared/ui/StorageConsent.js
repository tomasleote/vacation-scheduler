import React, { useState, useEffect } from 'react';
import { X, ShieldCheck } from 'lucide-react';

export function StorageConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already dismissed the banner
        const dismissed = localStorage.getItem('vacation_storage_consent');
        if (!dismissed) {
            // Delay showing it slightly for better UX
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('vacation_storage_consent', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 z-50 animate-in slide-in-from-bottom-8 duration-500">
            <div className="bg-dark-900 border border-blue-500/30 shadow-2xl shadow-blue-500/10 rounded-2xl p-5 backdrop-blur-xl">
                <div className="flex items-start gap-4">
                    <div className="bg-blue-500/10 p-2 rounded-lg shrink-0">
                        <ShieldCheck className="text-blue-400" size={24} />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                            <h4 className="text-gray-50 font-bold">Privacy & Storage</h4>
                            <button
                                onClick={() => setIsVisible(false)}
                                className="text-gray-500 hover:text-gray-300 transition-colors"
                                aria-label="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed mb-4">
                            We use local storage to keep you logged into your groups automatically.
                            By continuing to use this site, you agree to this functional storage.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleAccept}
                                className="flex-1 bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold py-2 rounded-lg transition-all shadow-lg shadow-blue-500/20"
                            >
                                Got it
                            </button>
                            <a
                                href="/privacy"
                                onClick={(e) => {
                                    e.preventDefault();
                                    // We can't easily trigger the App's navigation here without context
                                    // but we can just use the link if the App handles popstate/URL change
                                    window.history.pushState({}, '', '/privacy');
                                    window.dispatchEvent(new Event('popstate'));
                                }}
                                className="flex-1 bg-dark-800 hover:bg-dark-700 text-gray-300 text-sm font-bold py-2 rounded-lg text-center transition-all border border-dark-700"
                            >
                                Learn More
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
