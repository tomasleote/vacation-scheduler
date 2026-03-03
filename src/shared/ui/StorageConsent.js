import React, { useState, useEffect } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export function StorageConsent({ onNavigate }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        let consent = null;
        if (typeof window !== 'undefined') {
            try {
                consent = localStorage.getItem('fad_storage_consent');

                // Migrate legacy consent if new one doesn't exist
                if (!consent) {
                    const legacyConsent = localStorage.getItem('storage_consent');
                    if (legacyConsent) {
                        consent = legacyConsent;
                        localStorage.setItem('fad_storage_consent', consent);
                    }
                }
            } catch (e) {
                console.warn('[StorageConsent] Failed to read/migrate consent:', e);
            }
        }
        if (!consent) {
            // Delay showing it slightly for better UX
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        try {
            localStorage.setItem('fad_storage_consent', 'accepted');
        } catch (e) {
            console.warn('[StorageConsent] Failed to save consent:', e);
        }
        setIsVisible(false);
    };

    const handleDecline = () => {
        try {
            // "Declining" still dismisses the banner, but we note they didn't explicitly accept.
            // Under GDPR, we shouldn't keep pestering them if they say no.
            localStorage.setItem('fad_storage_consent', 'declined');
        } catch (e) {
            console.warn('[StorageConsent] Failed to save decline state:', e);
        }
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 z-50 animate-in slide-in-from-bottom-8 duration-500">
            <div className="bg-dark-900 border border-brand-500/30 shadow-2xl shadow-brand-500/10 rounded-2xl p-5 backdrop-blur-xl">
                <div className="flex items-start gap-4">
                    <div className="bg-brand-500/10 p-2 rounded-lg shrink-0">
                        <ShieldCheck className="text-brand-400" size={24} />
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
                            We use local storage for functional purposes to keep you logged into your groups.
                            You can accept this convenience or decline to stay anonymous.
                        </p>
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                                <button
                                    onClick={handleAccept}
                                    className="flex-1 bg-brand-500 hover:bg-brand-400 text-white text-sm font-bold py-2 rounded-lg transition-all shadow-lg shadow-brand-500/20"
                                >
                                    Accept
                                </button>
                                <button
                                    onClick={handleDecline}
                                    className="flex-1 bg-dark-800 hover:bg-dark-700 text-gray-300 text-sm font-bold py-2 rounded-lg border border-dark-700 transition-all"
                                >
                                    Decline
                                </button>
                            </div>
                            <Link
                                to="/privacy"
                                onClick={() => setIsVisible(false)}
                                className="text-[11px] text-brand-500 hover:text-brand-400 font-bold uppercase tracking-wider text-center mt-1"
                            >
                                Learn More about Privacy
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
