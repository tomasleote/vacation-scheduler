import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Calendar, Users, Sparkles, ArrowRight, KeyRound } from 'lucide-react';
import { Modal, Button, Card, Header } from '../../shared/ui';
import { useSearchParams, useNavigate } from 'react-router-dom';
import RecoverAdminForm from '../recovery/RecoverAdminForm';
import CreateGroupForm from './CreateGroupForm';
import JoinGroupForm from './JoinGroupForm';

function HomePage({ onCreateGroup, onJoinGroup, onRecoverAdmin }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showRecover, setShowRecover] = useState(false);

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'create') { setShowCreate(true); setShowJoin(false); setShowRecover(false); }
    else if (action === 'join') { setShowJoin(true); setShowCreate(false); setShowRecover(false); }
    else if (action === 'recover') { setShowRecover(true); setShowCreate(false); setShowJoin(false); }
    else { setShowCreate(false); setShowJoin(false); setShowRecover(false); } // Handle default/no-action case

    if (action) {
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const closeAll = () => { setShowCreate(false); setShowJoin(false); setShowRecover(false); };
  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Find A Day — Find the Best Day for Any Group Event</title>
        <meta name="description" content="Everyone marks their availability. The algorithm finds the overlap. Free, no sign-up required." />
        <link rel="canonical" href="https://findaday.app/" />
        <meta property="og:title" content="Find A Day — Find the Best Day for Any Group Event" />
        <meta property="og:description" content="Everyone marks their availability. The algorithm finds the overlap. Free, no sign-up required." />
        <meta property="og:url" content="https://findaday.app/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://findaday.app/logo.png" />
        <meta property="og:site_name" content="Find A Day" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Find A Day — Find the Best Day for Any Group Event" />
        <meta name="twitter:description" content="Stop texting. Start planning. Free group date finder." />
        <meta name="twitter:image" content="https://findaday.app/logo.png" />
        <script type="application/ld+json">
          {JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Find A Day",
              "url": "https://findaday.app/",
              "logo": "https://findaday.app/logo.png"
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Find A Day",
              "url": "https://findaday.app/",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://findaday.app/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            }
          ])}
        </script>
      </Helmet>
      {/* Nav Bar */}
      <Header
        onCreate={() => { setShowCreate(true); setShowJoin(false); setShowRecover(false); }}
        onJoin={() => { setShowJoin(true); setShowCreate(false); setShowRecover(false); }}
        onRecover={() => { setShowRecover(true); setShowCreate(false); setShowJoin(false); }}
      />

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-50 mb-4 leading-tight">
            Find the Best Day For Your <span className="text-brand-400">Group Event.</span>
          </h1>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            The easiest group date finder. Everyone marks when they're free, and we show you the overlap. No sign-up, no ads.
          </p>

          {/* Use case pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {['Vacation', 'Dinner', 'Birthday', 'Game Night', 'Team Offsite'].map((label) => (
              <span key={label} className="px-3 py-1.5 rounded-full text-sm font-medium bg-brand-500/10 text-brand-400 border border-brand-500/20">
                {label}
              </span>
            ))}
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              variant="primary"
              size="lg"
              rounding="lg"
              onClick={() => { setShowCreate(true); setShowJoin(false); setShowRecover(false); }}
              className="flex items-center gap-2"
            >
              Start Planning Now <ArrowRight size={18} />
            </Button>
            <Button
              variant="secondary"
              size="lg"
              rounding="lg"
              onClick={() => { setShowJoin(true); setShowCreate(false); setShowRecover(false); }}
            >
              Join Event
            </Button>
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full"
        >
          {[
            { icon: <Calendar size={24} />, title: '1. Create', desc: 'Set a date range and share the link with your group.' },
            { icon: <Users size={24} />, title: '2. Respond', desc: 'Everyone marks their free days on the calendar.' },
            { icon: <Sparkles size={24} />, title: '3. Match', desc: 'The algorithm finds the best overlapping dates instantly.' },
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
            >
              <Card variant="subtle" className="text-center h-full">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 mb-4">
                  {step.icon}
                </div>
                <h3 className="font-bold text-gray-50 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400">{step.desc}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Enhanced SEO Sections */}
        <div className="w-full max-w-5xl mx-auto mt-32 space-y-24 px-4 text-left">
          {/* Problem Section */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-6">The Universal Scheduling Problem</h2>
            <div className="space-y-4 text-lg text-gray-400 leading-relaxed">
              <p>You want to get a group together. You drop the inevitable "when is everyone free?" into the group chat. What follows is a chaotic spiral of conflicting answers. Three people can do Friday, two say Saturday, and four haven't replied at all. Trying to coordinate a group schedule manually becomes a full-time job for the organizer. The larger the group, the harder it is to find a day that actually works for everyone.</p>
              <p>Traditional group availability tools haven't evolved. Some force you to create accounts before you can launch a poll. Others bombard your friends with intrusive ads just to submit their availability. And most are built for one-hour corporate meetings, making them completely useless if you're trying to schedule a multi-day trip or an open-ended weekend.</p>
            </div>
          </section>

          {/* Use Cases */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-8">Built for Every Kind of Event</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'The Weekend Getaway', desc: 'Finding overlap for a 3-day cabin trip among 8 busy friends.' },
                { title: 'The Dinner Club', desc: 'Picking the single best evening this month for your recurring supper crew.' },
                { title: 'The Remote Team', desc: 'Finding a week where the entire distributed startup can fly in for a company offsite.' }
              ].map((uc, i) => (
                <div key={i} className="bg-dark-900 border border-dark-800 p-6 rounded-2xl relative overflow-hidden group hover:border-dark-700 transition-colors">
                  <h3 className="text-xl font-bold text-white mb-3 text-brand-400">{uc.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{uc.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Home FAQ */}
          <section className="max-w-3xl mx-auto pb-32">
            <h2 className="text-3xl font-bold text-white mb-10 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                { q: 'How does this group availability tool work?', a: 'Create your event by selecting a range of possible dates. Share the generated link in your group chat. Everyone clicks the link and taps the days they are free. The app instantly generates a visual heatmap showing which date has the most overlap.' },
                { q: 'Is it really free, or are there hidden ads?', a: 'Find A Day is 100% free group scheduling. There are no paywalls, no participant limits, and absolutely no ads to interrupt your friends when they respond to your invite.' },
                { q: 'Do my friends need to create an account?', a: 'No. One of our core philosophies is zero friction. Participants do not need to download an app, create an account, or log in. They just enter their name, select their dates, and submit.' },
                { q: 'Can I use this for multi-day events like vacations?', a: 'Yes! Unlike old-school tools built for 30-minute time slots, Find A Day specializes in multi-day scheduling. You can find the best 4-day stretch for a group vacation just as easily as finding one evening for dinner.' },
                { q: 'How many people can join an event?', a: 'There is no hard limit on participants. Whether you are finding a date for a 4-person D&D group or querying availability for a 50-person family reunion, the heatmap handles the data seamlessly.' },
                { q: 'Will this work on mobile phones?', a: 'Yes, the entire interface is optimized for mobile tapping. Since most scheduling happens via links dropped in iMessage or WhatsApp, we ensured the availability grid is highly responsive on all screen sizes.' }
              ].map((faq, i) => (
                <div key={i} className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden p-6">
                  <h3 className="font-bold text-gray-200 text-lg mb-2">{faq.q}</h3>
                  <p className="text-gray-400 leading-relaxed text-base md:text-lg">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Modal Overlays */}
      <Modal
        open={showCreate || showJoin || showRecover}
        onClose={closeAll}
        title={showCreate ? 'Create Event' : showJoin ? 'Join Event' : 'Recover Admin Access'}
        maxWidth={showCreate ? 'lg' : 'md'}
        animated
      >
        {showCreate && (
          <CreateGroupForm onSuccess={onCreateGroup} onCancel={closeAll} />
        )}
        {showJoin && (
          <JoinGroupForm onSuccess={onJoinGroup} onCancel={closeAll} />
        )}
        {showRecover && (
          <RecoverAdminForm
            onSuccess={(gId, token) => { closeAll(); onRecoverAdmin(gId, token); }}
            onCancel={closeAll}
          />
        )}
      </Modal>
    </div>
  );
}

export default HomePage;
