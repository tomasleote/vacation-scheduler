import React from 'react';
import { Mail, Github, BookOpen } from 'lucide-react';

export function Footer({ onNavigateDocs, onNavigatePrivacy }) {
    const handleDocsClick = (e) => {
        if (onNavigateDocs) {
            e.preventDefault();
            onNavigateDocs('/docs');
        }
    };

    const handlePrivacyClick = (e) => {
        if (onNavigatePrivacy) {
            e.preventDefault();
            onNavigatePrivacy('/privacy');
        }
    };

    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-auto border-t border-dark-800 bg-dark-950 py-10 w-full px-4 md:px-8">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div className="space-y-3">
                    <h3 className="text-lg font-bold text-gray-50">Vacation Scheduler</h3>
                    <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                        A seamless way to organize group trips and find the perfect dates when everyone is available. Stop herding cats and start packing bags.
                    </p>
                </div>

                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Resources</h4>
                    <ul className="space-y-2">
                        <li>
                            <a
                                href="/docs"
                                onClick={handleDocsClick}
                                className="text-sm text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                            >
                                <BookOpen size={14} className="group-hover:text-blue-400 transition-colors" />
                                Documentation
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://github.com/tomasleote/vacation-scheduler"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-gray-400 hover:text-gray-50 transition-colors flex items-center gap-2 group"
                            >
                                <Github size={14} className="group-hover:text-gray-50 transition-colors" />
                                GitHub Repository
                            </a>
                        </li>
                    </ul>
                </div>

                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Contact</h4>
                    <ul className="space-y-2">
                        <li>
                            <a
                                href="mailto:vacationscheduler.info@gmail.com"
                                className="text-sm text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                            >
                                <Mail size={14} className="group-hover:text-blue-400 transition-colors" />
                                vacationscheduler.info@gmail.com
                            </a>
                        </li>
                        <li className="text-sm text-gray-500">
                            Questions or feedback? Contact us.
                        </li>
                    </ul>
                </div>
            </div>

            <div className="max-w-6xl mx-auto pt-6 border-t border-dark-800 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500">
                <p>&copy; {currentYear} Vacation Scheduler. All rights reserved.</p>
                <div className="flex space-x-4 mt-2 md:mt-0">
                    <button
                        onClick={handlePrivacyClick}
                        className="hover:text-blue-400 transition-colors"
                    >
                        Privacy Policy
                    </button>
                    <span className="cursor-not-allowed hover:text-gray-400 transition-colors">Terms of Service</span>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
