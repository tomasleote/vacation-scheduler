import React, { useEffect } from 'react';
import { ShieldAlert, Gavel, Scale, AlertOctagon, ArrowLeft } from 'lucide-react';

export default function TermsOfService({ onBack }) {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const sections = [
        {
            title: "1. Acceptance of Terms",
            icon: <Gavel size={20} className="text-blue-500" />,
            content: "By accessing and using Vacation Scheduler, you agree to be bound by these Terms of Service. If you do not agree to these terms, please stop using the application immediately."
        },
        {
            title: "2. Description of Service",
            icon: <Scale size={20} className="text-blue-400" />,
            content: "Vacation Scheduler is a free-to-use utility provided \"as is\" to help coordinate group availability. We provide calculation tools and data persistence, but we do not guarantee the completeness or accuracy of any generated schedule."
        },
        {
            title: "3. User Responsibilities",
            icon: <AlertOctagon size={20} className="text-yellow-500" />,
            content: "You are solely responsible for the security of your Admin links, group passphrases, and personal invite links. If you lose access to these links, we cannot recover them unless you have previously associated an email address with your account."
        },
        {
            title: "4. No Warranty (Disclaimer)",
            icon: <ShieldAlert size={20} className="text-rose-500" />,
            isWarning: true,
            content: "THE SERVICE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY LAW, VACATION SCHEDULER DISCLAIMS ALL WARRANTIES, INCLUDING ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE."
        },
        {
            title: "5. Limitation of Liability",
            icon: <ShieldAlert size={20} className="text-rose-500" />,
            isWarning: true,
            content: "IN NO EVENT SHALL THE APP CREATORS, CONTRIBUTORS, OR SERVICE PROVIDERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM (I) YOUR ACCESS TO OR USE OF THE SERVICE; (II) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICE; OR (III) UNAUTHORIZED ACCESS, USE OR ALTERATION OF YOUR DATA."
        },
        {
            title: "6. Data & Privacy",
            icon: <Scale size={20} className="text-emerald-400" />,
            content: "We process limited personal data (Names, Emails) as described in our Privacy Policy. By using the service, you consent to this processing as required for the functional operation of the application."
        },
        {
            title: "7. Modifications",
            icon: <Gavel size={20} className="text-gray-400" />,
            content: "We reserve the right to modify or discontinue the service at any time without notice. We may also modify these terms, and your continued use of the app constitutes acceptance of the new terms."
        }
    ];

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
                    <h1 className="text-3xl font-bold text-gray-50">Terms of Service</h1>
                </div>

                <div className="space-y-8 pb-20 font-sans">
                    <p className="text-gray-400 border-l-4 border-blue-500 pl-4 py-1 italic">
                        Last Updated: March 2026. Please read these terms carefully before using the service.
                    </p>

                    {sections.map((section, idx) => (
                        <section key={idx} className={`p-6 rounded-2xl border ${section.isWarning ? 'bg-rose-500/5 border-rose-500/20' : 'bg-dark-900 border-dark-700'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                {section.icon}
                                <h2 className={`text-xl font-bold ${section.isWarning ? 'text-rose-400' : 'text-gray-100'}`}>
                                    {section.title}
                                </h2>
                            </div>
                            <p className={`leading-relaxed ${section.isWarning ? 'text-gray-200 font-medium' : 'text-gray-400 text-sm'}`}>
                                {section.content}
                            </p>
                        </section>
                    ))}

                    <div className="bg-dark-950 p-6 rounded-xl border border-dark-800 text-center">
                        <p className="text-sm text-gray-500 mb-2">Questions about these terms?</p>
                        <a href="mailto:vacationscheduler.info@gmail.com" className="text-blue-500 hover:text-blue-400 font-bold underline">
                            vacationscheduler.info@gmail.com
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
