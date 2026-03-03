import React, { useEffect } from 'react';
import { Shield, Eye, Lock, Trash2, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy({ onBack }) {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen p-4 md:p-8 text-gray-300">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-4 mb-10">
                    <button
                        onClick={(e) => {
                            if (onBack) {
                                e.preventDefault();
                                onBack();
                            } else {
                                window.location.href = '/';
                            }
                        }}
                        className="text-gray-400 hover:text-white transition-colors bg-dark-800 p-2 rounded-lg"
                        aria-label="Go Back"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-3xl font-bold text-gray-50 flex items-center gap-3">
                        <Shield className="text-brand-500" />
                        Privacy Policy
                    </h1>
                </div>

                <article className="space-y-12 pb-20">
                    <section className="space-y-4">
                        <p className="leading-relaxed text-lg">
                            At FindADate, we believe your data should be handled with transparency and respect. This policy explains how we collect and process your information when you use our service.
                        </p>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2 border-b border-dark-700 pb-2">
                            <Eye className="text-brand-400" size={20} /> What Data We Collect
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
                                <h3 className="font-bold text-gray-200 mb-2">Participant Information</h3>
                                <p className="text-sm leading-relaxed text-gray-400">
                                    We store names and (optionally) email addresses provided by you. These are used to identify you within your specific event group.
                                </p>
                            </div>
                            <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
                                <h3 className="font-bold text-gray-200 mb-2">Availability Data</h3>
                                <p className="text-sm leading-relaxed text-gray-400">
                                    The dates you select as "available" are stored to calculate group overlaps. This is the core functionality of the app.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2 border-b border-dark-700 pb-2">
                            <Lock className="text-emerald-400" size={20} /> How We Store Your Data
                        </h2>
                        <div className="space-y-4 text-sm leading-relaxed">
                            <p>
                                <strong>Firebase Realtime Database:</strong> Your group data and availability are stored securely in
                                Firebase (a Google service). This allows for real-time synchronization between group members.
                            </p>
                            <p>
                                <strong>Local Storage:</strong> We use your browser's local storage (similar to cookies) to store a unique identifier.
                                This allows the app to remember who you are when you return to a group link, saving you from re-entering your details.
                                <span className="text-brand-400"> This storage is functional and helps provide the service you requested.</span>
                            </p>
                            <p>
                                <strong>Passphrase Hashing:</strong> Admin passphrases are hashed in your browser before ever reaching our servers.
                                We never see or store your raw passphrase.
                            </p>
                        </div>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2 border-b border-dark-700 pb-2">
                            <Trash2 className="text-rose-400" size={20} /> Your Rights (GDPR)
                        </h2>
                        <div className="space-y-4 text-sm leading-relaxed">
                            <p>
                                Under the GDPR, you have the following rights regarding your personal data:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Right to be informed:</strong> You have the right to know how your data is used (this policy).</li>
                                <li><strong>Right of access:</strong> You can see all data tied to your name within the group dashboard.</li>
                                <li><strong>Right to rectification:</strong> You can update your name, email, or dates at any time.</li>
                                <li><strong>Right to erasure:</strong> You can ask the Group Admin to delete your record, or use the "Clear My Local Data" button on your dashboard to remove yourself from your browser.</li>
                            </ul>
                        </div>
                    </section>

                    <section className="space-y-4 bg-dark-950 p-6 rounded-xl border border-dark-800">
                        <h3 className="text-lg font-bold text-gray-100">Contact</h3>
                        <p className="text-sm">
                            Questions about your privacy? Contact us at: <a href="mailto:hello@findadate.app" className="text-brand-400 hover:underline">hello@findadate.app</a>
                        </p>
                    </section>
                </article>
            </div>
        </div>
    );
}
