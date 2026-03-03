import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { CalendarRange, Sparkles, MessageCircle, Share2, CheckCircle2, ChevronDown, ArrowRight, Palmtree, Utensils, Users, Gamepad2, Plane, Tv, CalendarDays, Zap, Clock, ThumbsUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { landingPagesConfig } from './landingPageContent';
import ComparisonTable from './ComparisonTable';
import RelatedPages from './RelatedPages';
import SchemaMarkup from './SchemaMarkup';
import { Header } from '../../shared/ui';

// Map textual emoji/icon keys to actual Lucide components to ensure NO EMOJIS are used
const ICON_MAP = {
    vacation: Palmtree,
    doodle: Sparkles,
    when2meet: Zap,
    dinner: Utensils,
    event: CalendarDays,
    team: Users,
    party: Tv,
    gamenight: Gamepad2,
};

export default function LandingPage({ type }) {
    const content = landingPagesConfig[type];
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'auto' });
    }, [type]);

    if (!content) return null;
    const SITE_URL = 'https://findaday.app';

    const PageIcon = ICON_MAP[type] || CalendarRange;

    return (
        <div className="min-h-screen bg-dark-950 text-gray-50 flex flex-col font-sans selection:bg-brand-500/30">
            <Helmet>
                <title>{content.title}</title>
                <meta name="description" content={content.metaDescription} />
                <link rel="canonical" href={`${SITE_URL}/${content.slug}`} />
                <meta property="og:title" content={content.title} />
                <meta property="og:description" content={content.metaDescription} />
                <meta property="og:url" content={`${SITE_URL}/${content.slug}`} />
                <meta property="og:type" content="website" />
                <meta property="og:image" content={`${SITE_URL}/logo.png`} />
                <meta property="og:site_name" content="Find A Day" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={content.title} />
                <meta name="twitter:description" content={content.metaDescription} />
                <meta name="twitter:image" content={`${SITE_URL}/logo.png`} />
            </Helmet>

            <SchemaMarkup type={type} content={content} />

            {/* Nav */}
            <Header />

            {/* Hero */}
            <main className="flex-1 w-full flex flex-col items-center">
                <section className="w-full max-w-4xl mx-auto px-6 pt-16 md:pt-24 pb-20 text-center relative">
                    {/* Decorative background blobs */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/10 blur-[100px] rounded-full pointer-events-none" />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="w-16 h-16 bg-brand-500/20 text-brand-400 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-inner shadow-brand-300/10"
                    >
                        <PageIcon size={32} />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight"
                    >
                        {content.h1}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed"
                    >
                        {content.subtitle}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link to="/" className="w-full sm:w-auto px-8 py-4 rounded-full bg-brand-500 text-white text-lg font-bold shadow-xl shadow-brand-500/20 hover:-translate-y-1 hover:shadow-brand-500/40 active:translate-y-0 transition-all flex items-center justify-center gap-2 group">
                            Create an Event — Free
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-4 text-sm text-gray-500 font-medium"
                    >
                        No sign-up required. Free forever.
                    </motion.p>
                </section>

                {/* Problem Section */}
                <section className="w-full bg-dark-900 py-20 border-y border-dark-800">
                    <div className="max-w-3xl mx-auto px-6">
                        <div className="space-y-6">
                            {content.problemSection.map((p, i) => (
                                <motion.p
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className={`text-lg leading-relaxed ${i === 0 ? 'text-gray-200 font-medium text-xl border-l-4 border-brand-500 pl-6 py-2' : 'text-gray-400'}`}
                                >
                                    {p}
                                </motion.p>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How It Works (Playful Style) */}
                <section className="w-full max-w-6xl mx-auto px-6 py-24">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How it works</h2>
                        <p className="text-xl text-gray-400">Dead simple coordination. Under 60 seconds.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { step: 1, title: 'Create Event', desc: 'Set your date range. Vacations, meetings, or dinners.', icon: <CalendarRange size={24} /> },
                            { step: 2, title: 'Share Link', desc: 'Send it in your group chat. No sign-ups or ads.', icon: <Share2 size={24} /> },
                            { step: 3, title: 'See Overlap', desc: 'Instantly view the heatmap of when everyone is free.', icon: <CheckCircle2 size={24} /> }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.2 }}
                                whileHover={{ y: -5 }}
                                className="bg-dark-900 border border-dark-800 p-8 rounded-3xl relative overflow-hidden group"
                            >
                                <div className="w-14 h-14 bg-dark-800 text-brand-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-500 group-hover:text-white transition-colors duration-300">
                                    {item.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">
                                    <span className="text-brand-500 mr-2">{item.step}.</span>
                                    {item.title}
                                </h3>
                                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Comparison Table */}
                {content.showComparison && (
                    <section className="w-full bg-dark-900 border-y border-dark-800 py-24">
                        <div className="max-w-4xl mx-auto px-6">
                            <ComparisonTable type={type} />
                        </div>
                    </section>
                )}

                {/* FAQs */}
                <section className="w-full max-w-3xl mx-auto px-6 py-24">
                    <h2 className="text-3xl font-bold text-white mb-10 text-center">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {content.faqs.map((faq, i) => (
                            <FAQItem key={i} question={faq.question} answer={faq.answer} />
                        ))}
                    </div>
                </section>

                {/* Bottom CTA */}
                <section className="w-full py-24 relative overflow-hidden flex items-center justify-center text-center px-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-600 to-orange-500 opacity-20" />
                    <div className="relative z-10 max-w-2xl">
                        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Ready to stop guessing?</h2>
                        <p className="text-xl text-gray-300 mb-10">Create your event link and let the algorithm do the work.</p>
                        <Link to="/" className="px-10 py-5 rounded-full bg-white text-brand-600 text-lg font-bold shadow-2xl hover:scale-105 active:scale-95 transition-transform inline-flex items-center gap-3">
                            Start Planning
                            <ArrowRight size={20} />
                        </Link>
                    </div>
                </section>

                {/* Internal Linking Widgets */}
                <section className="w-full bg-dark-950 py-16 border-t border-dark-800">
                    <RelatedPages currentType={type} relatedSlugs={content.relatedPages} />
                </section>
            </main>
        </div>
    );
}

function FAQItem({ question, answer }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const id = React.useId();
    return (
        <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden hover:border-dark-700 transition-colors">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-5 text-left flex justify-between items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 rounded-xl"
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${id}`}
            >
                <span className="font-bold text-gray-200 text-lg">{question}</span>
                <ChevronDown className={`text-brand-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} size={20} />
            </button>
            <motion.div
                id={`faq-answer-${id}`}
                role="region"
                aria-hidden={!isOpen}
                initial={false}
                animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                className="overflow-hidden bg-dark-800/50"
            >
                <p className="p-6 pt-2 text-gray-400 leading-relaxed font-medium text-sm md:text-base">
                    {answer}
                </p>
            </motion.div>
        </div>
    );
}
