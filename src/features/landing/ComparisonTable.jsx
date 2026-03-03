import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
    { name: 'Free to use', findadate: 'Yes, fully', doodle: 'Limited free tier', when2meet: 'Yes' },
    { name: 'No ads', findadate: 'Yes', doodle: 'No (heavy ads)', when2meet: 'Yes' },
    { name: 'Works on mobile', findadate: 'Yes', doodle: 'Broken experience', when2meet: 'Essentially unusable' },
    { name: 'Multi-day date ranges', findadate: 'Yes (core feature)', doodle: 'No (time slots only)', when2meet: 'No (hourly grid)' },
    { name: 'No account needed', findadate: 'Yes (all users)', doodle: 'Organizer needs account', when2meet: 'Yes (all users)' },
    { name: 'Visual heatmap', findadate: 'Color-coded overlap', doodle: 'Checkmark table', when2meet: 'Basic green grid' },
    { name: 'Post-poll workflow', findadate: 'Planned (voting + calendar)', doodle: 'None in free tier', when2meet: 'None' },
];

export default function ComparisonTable({ type }) {
    // Only highly relevant for doodle and when2meet pages, but can generalize
    const competitor = type === 'doodle' ? 'Doodle' : 'When2Meet';
    const competitorKey = type === 'doodle' ? 'doodle' : 'when2meet';

    return (
        <div className="w-full">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">FindADate vs {competitor}</h2>
                <p className="text-lg text-gray-400">Why thousands are making the switch in 2026.</p>
            </div>

            <div className="bg-dark-900 border border-dark-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="grid grid-cols-3 bg-dark-950 p-6 border-b border-dark-800 items-center">
                    <div className="text-gray-400 font-bold uppercase tracking-wider text-xs">Features</div>
                    <div className="text-brand-500 font-bold text-lg text-center">FindADate</div>
                    <div className="text-gray-500 font-bold text-lg text-center">{competitor}</div>
                </div>

                <div className="divide-y divide-dark-800">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="grid grid-cols-3 p-6 items-center hover:bg-dark-800/50 transition-colors"
                        >
                            <div className="text-gray-200 font-semibold">{feature.name}</div>
                            <div className="text-white font-medium text-center flex flex-col items-center gap-2">
                                {feature.findadate?.toLowerCase().includes('yes') ? (
                                    <CheckCircle2 size={24} className="text-brand-500" />
                                ) : (
                                    <XCircle size={24} className="text-red-500/80" />
                                )}
                                <span className="text-sm">{feature.findadate}</span>
                            </div>
                            <div className="text-gray-500 text-center flex flex-col items-center gap-2">
                                {feature[competitorKey]?.toLowerCase().includes('yes') ? (
                                    <CheckCircle2 size={24} className="text-gray-500 opacity-50" />
                                ) : (
                                    <XCircle size={24} className="text-red-500/50" />
                                )}
                                <span className="text-sm">{feature[competitorKey]}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
