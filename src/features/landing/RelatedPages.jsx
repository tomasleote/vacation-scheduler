import React from 'react';
import { Link } from 'react-router-dom';
import { landingPagesConfig } from './landingPageContent';
import { ArrowRight, ChevronRight } from 'lucide-react';

export default function RelatedPages({ currentType, relatedSlugs }) {
    if (!relatedSlugs || relatedSlugs.length === 0) return null;

    // Convert slugs back to keys to find their configs
    // Preserves array order and allows both slugs and matching config keys directly
    const relatedTypes = relatedSlugs
        .map(slugOrKey => {
            if (landingPagesConfig[slugOrKey]) return slugOrKey;
            const entry = Object.entries(landingPagesConfig).find(([_, config]) => config.slug === slugOrKey);
            return entry ? entry[0] : null;
        })
        .filter(Boolean);

    return (
        <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center gap-3 mb-8">
                <h3 className="text-xl font-bold text-white">More ways to schedule</h3>
                <div className="h-px bg-dark-800 flex-1" />
            </div>

            <div className="flex flex-wrap gap-4">
                {relatedTypes.map(type => {
                    const config = landingPagesConfig[type];
                    return (
                        <Link
                            key={type}
                            to={`/${config.slug}`}
                            className="px-6 py-4 bg-dark-900 border border-dark-800 rounded-2xl hover:border-brand-500 hover:bg-brand-500/5 transition-all group flex items-center gap-4 flex-1 min-w-[280px]"
                        >
                            <div className="flex-1">
                                <div className="text-sm font-bold text-white mb-1 group-hover:text-brand-400 transition-colors">
                                    {config.h1}
                                </div>
                                <div className="text-xs text-gray-500 line-clamp-1">
                                    {config.metaDescription}
                                </div>
                            </div>
                            <ChevronRight className="text-dark-700 group-hover:text-brand-500 transition-colors transform group-hover:translate-x-1" size={20} />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
