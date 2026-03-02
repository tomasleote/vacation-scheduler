import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Sparkles, ArrowRight, KeyRound } from 'lucide-react';
import { Modal, Button, Card } from '../../shared/ui';
import RecoverAdminForm from '../recovery/RecoverAdminForm';
import CreateGroupForm from './CreateGroupForm';
import JoinGroupForm from './JoinGroupForm';

function HomePage({ onCreateGroup, onJoinGroup, onRecoverAdmin }) {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showRecover, setShowRecover] = useState(false);

  const closeAll = () => { setShowCreate(false); setShowJoin(false); setShowRecover(false); };
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav Bar */}
      <nav className="sticky top-0 z-50 bg-dark-900/80 backdrop-blur-xl border-b border-dark-700/50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <span className="text-lg font-bold tracking-tight text-gray-50">Vacation Scheduler</span>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              size="sm"
              weight="semibold"
              onClick={() => { setShowRecover(true); setShowCreate(false); setShowJoin(false); }}
              className="flex items-center gap-1.5"
            >
              <KeyRound size={14} /> Recover
            </Button>
            <Button
              variant="primary"
              size="sm"
              weight="semibold"
              onClick={() => { setShowCreate(true); setShowJoin(false); setShowRecover(false); }}
            >
              Create Group
            </Button>
            <Button
              variant="secondary"
              size="sm"
              weight="semibold"
              onClick={() => { setShowJoin(true); setShowCreate(false); setShowRecover(false); }}
            >
              Join Group
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-50 mb-4">
            Find your perfect{' '}
            <span className="text-blue-400">vacation window.</span>
          </h1>
          <p className="text-lg text-gray-400 mb-10 max-w-lg mx-auto">
            Everyone marks their dates. The algorithm finds when the most people overlap. No more back-and-forth.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              variant="primary"
              size="lg"
              rounding="lg"
              onClick={() => { setShowCreate(true); setShowJoin(false); setShowRecover(false); }}
              className="flex items-center gap-2"
            >
              Create a Trip <ArrowRight size={18} />
            </Button>
            <Button
              variant="secondary"
              size="lg"
              rounding="lg"
              onClick={() => { setShowJoin(true); setShowCreate(false); setShowRecover(false); }}
            >
              Join a Trip
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
            { icon: <Users size={24} />, title: '2. Respond', desc: 'Everyone marks which days they\'re free on the calendar.' },
            { icon: <Sparkles size={24} />, title: '3. Match', desc: 'The algorithm finds the best overlapping windows instantly.' },
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
            >
              <Card variant="subtle" className="text-center h-full">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 mb-4">
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
        title={showCreate ? 'Create a Trip' : showJoin ? 'Join a Trip' : 'Recover Admin Access'}
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
