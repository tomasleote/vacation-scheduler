import React, { useState, useEffect } from 'react';
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
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-50 mb-4">
            Find the best date for{' '}
            <span className="text-brand-400">anything.</span>
          </h1>
          <p className="text-lg text-gray-400 mb-8 max-w-lg mx-auto">
            Vacation. Dinner. Party. Game night. Everyone marks their dates. We find the overlap.
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
              Create Event <ArrowRight size={18} />
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
