import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, Sparkles, ArrowRight, X } from 'lucide-react';
import './index.css';
import AdminPanel from './components/AdminPanel';
import ParticipantView from './components/ParticipantView';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [groupId, setGroupId] = useState(null);
  const [adminToken, setAdminToken] = useState(null);
  const [participantId, setParticipantId] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const gId = urlParams.get('group');
    const adminTok = urlParams.get('admin');
    const pId = urlParams.get('p');

    if (!gId) return;

    setGroupId(gId);

    if (adminTok) {
      setAdminToken(adminTok);
      setCurrentPage('admin');
      try { localStorage.setItem(`vacation_admin_${gId}`, adminTok); } catch {}
      return;
    }

    if (pId) {
      setParticipantId(pId);
      setCurrentPage('participant');
      return;
    }

    // localStorage fallback
    try {
      const storedAdmin = localStorage.getItem(`vacation_admin_${gId}`);
      if (storedAdmin) {
        setAdminToken(storedAdmin);
        setCurrentPage('admin');
        return;
      }
      const storedParticipant = localStorage.getItem(`vacation_p_${gId}`);
      if (storedParticipant) {
        const { participantId: storedPId } = JSON.parse(storedParticipant);
        setParticipantId(storedPId);
        setCurrentPage('participant');
        return;
      }
    } catch {}

    setCurrentPage('participant');
  }, []);

  const handleCreateGroup = ({ groupId, adminToken }) => {
    setGroupId(groupId);
    setAdminToken(adminToken);
    // Persist token immediately so it survives page refresh before entering admin panel
    try { localStorage.setItem(`vacation_admin_${groupId}`, adminToken); } catch {}
    setCurrentPage('created');
  };

  const handleEnterAdmin = () => {
    setCurrentPage('admin');
    try { localStorage.setItem(`vacation_admin_${groupId}`, adminToken); } catch {}
    window.history.pushState({}, '', `?group=${groupId}&admin=${adminToken}`);
  };

  const handleJoinGroup = (gId) => {
    setGroupId(gId);
    setCurrentPage('participant');
    window.history.pushState({}, '', `?group=${gId}`);
  };

  const handleBackHome = () => {
    setCurrentPage('home');
    setGroupId(null);
    setAdminToken(null);
    setParticipantId(null);
    window.history.pushState({}, '', '/');
  };

  return (
    <div className="min-h-screen bg-dark-950 text-gray-50">
      {currentPage === 'home' && (
        <HomePage onCreateGroup={handleCreateGroup} onJoinGroup={handleJoinGroup} />
      )}
      {currentPage === 'created' && (
        <GroupCreatedScreen
          groupId={groupId}
          adminToken={adminToken}
          onEnterAdmin={handleEnterAdmin}
          onBack={handleBackHome}
        />
      )}
      {currentPage === 'admin' && (
        <AdminPanel
          groupId={groupId}
          adminToken={adminToken}
          onBack={handleBackHome}
        />
      )}
      {currentPage === 'participant' && (
        <ParticipantView
          groupId={groupId}
          participantId={participantId}
          onBack={handleBackHome}
        />
      )}
    </div>
  );
}

function HomePage({ onCreateGroup, onJoinGroup }) {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav Bar */}
      <nav className="sticky top-0 z-50 bg-dark-900/80 backdrop-blur-xl border-b border-dark-700/50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <span className="text-lg font-bold tracking-tight text-gray-50">Vacation Scheduler</span>
          <div className="flex gap-3">
            <button
              onClick={() => { setShowCreate(true); setShowJoin(false); }}
              className="bg-blue-500 hover:bg-blue-400 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Create Group
            </button>
            <button
              onClick={() => { setShowJoin(true); setShowCreate(false); }}
              className="bg-dark-800 hover:bg-dark-700 text-gray-300 hover:text-gray-50 font-semibold px-4 py-2 rounded-lg text-sm border border-dark-700 transition-colors"
            >
              Join Group
            </button>
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
            <button
              onClick={() => { setShowCreate(true); setShowJoin(false); }}
              className="bg-blue-500 hover:bg-blue-400 text-white font-bold px-6 py-3 rounded-xl text-base transition-colors flex items-center gap-2"
            >
              Create a Trip <ArrowRight size={18} />
            </button>
            <button
              onClick={() => { setShowJoin(true); setShowCreate(false); }}
              className="bg-dark-800 hover:bg-dark-700 text-gray-300 hover:text-gray-50 font-bold px-6 py-3 rounded-xl text-base border border-dark-700 transition-colors"
            >
              Join a Trip
            </button>
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
              className="bg-dark-900 border border-dark-700/50 rounded-xl p-6 text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 mb-4">
                {step.icon}
              </div>
              <h3 className="font-bold text-gray-50 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-400">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Modal Overlays */}
      <AnimatePresence>
        {(showCreate || showJoin) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => { setShowCreate(false); setShowJoin(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="bg-dark-900 border border-dark-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-50">
                  {showCreate ? 'Create a Trip' : 'Join a Trip'}
                </h2>
                <button
                  onClick={() => { setShowCreate(false); setShowJoin(false); }}
                  className="text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              {showCreate && (
                <CreateGroupForm onSuccess={onCreateGroup} onCancel={() => setShowCreate(false)} />
              )}
              {showJoin && (
                <JoinGroupForm onSuccess={onJoinGroup} onCancel={() => setShowJoin(false)} />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CreateGroupForm({ onSuccess, onCancel }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { createGroup } = await import('./firebase');
      const result = await createGroup({ name, description, startDate, endDate, adminEmail });
      onSuccess(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors";
  const labelClass = "block text-sm font-medium text-gray-300 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>Group Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={inputClass}
          placeholder="e.g., Summer Trip 2024"
        />
      </div>

      <div>
        <label className={labelClass}>
          Description (optional) <span className="text-gray-500">{description.length}/500</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 500))}
          className={inputClass}
          placeholder="e.g., Beach trip to Hawaii, hiking adventure, etc."
          rows="2"
          maxLength="500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Admin Email (for reminders)</label>
        <input
          type="email"
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
          className={inputClass}
          placeholder="your@email.com"
        />
      </div>

      {error && <p className="text-rose-400 text-sm">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-dark-800 hover:bg-dark-700 text-gray-300 font-semibold py-2.5 px-4 rounded-lg border border-dark-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-500 hover:bg-blue-400 text-white font-bold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create'}
        </button>
      </div>
    </form>
  );
}

function JoinGroupForm({ onSuccess, onCancel }) {
  const [groupId, setGroupId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { getGroup } = await import('./firebase');
      const group = await getGroup(groupId);
      if (!group) {
        setError('Group not found');
        return;
      }
      onSuccess(groupId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Group ID</label>
        <input
          type="text"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          required
          className="w-full px-3 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
          placeholder="Paste group ID here"
        />
      </div>

      {error && <p className="text-rose-400 text-sm">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-dark-800 hover:bg-dark-700 text-gray-300 font-semibold py-2.5 px-4 rounded-lg border border-dark-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-500 hover:bg-blue-400 text-white font-bold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Joining...' : 'Join'}
        </button>
      </div>
    </form>
  );
}

function GroupCreatedScreen({ groupId, adminToken, onEnterAdmin, onBack }) {
  const baseUrl = window.location.origin;
  const participantLink = `${baseUrl}?group=${groupId}`;
  const adminLink = `${baseUrl}?group=${groupId}&admin=${adminToken}`;
  const [copiedP, setCopiedP] = useState(false);
  const [copiedA, setCopiedA] = useState(false);

  const copy = (text, setFlag) => {
    navigator.clipboard.writeText(text);
    setFlag(true);
    setTimeout(() => setFlag(false), 2000);
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-dark-900 border border-dark-700 rounded-2xl p-8 max-w-md w-full space-y-6 shadow-2xl"
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 mb-4">
            <span className="text-3xl">&#10003;</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-50">Group created!</h1>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Share with participants:
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={participantLink}
              className="flex-1 px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-sm text-gray-300"
            />
            <button
              onClick={() => copy(participantLink, setCopiedP)}
              className="px-3 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              {copiedP ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Your admin link — save this:
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={adminLink}
              className="flex-1 px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-sm text-gray-300"
            />
            <button
              onClick={() => copy(adminLink, setCopiedA)}
              className="px-3 py-2 bg-dark-700 hover:bg-dark-800 text-gray-300 rounded-lg text-sm font-semibold border border-dark-700 transition-colors"
            >
              {copiedA ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-amber-400/80 mt-1.5">
            Bookmark or save this link — it's the only way to access your admin panel later.
          </p>
        </div>

        <button
          onClick={onEnterAdmin}
          className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          Open Admin Panel <ArrowRight size={18} />
        </button>
      </motion.div>
    </div>
  );
}

export default App;
