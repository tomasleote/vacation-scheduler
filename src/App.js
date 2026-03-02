import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, Sparkles, ArrowRight, X, KeyRound, Eye, EyeOff } from 'lucide-react';
import './index.css';
import AdminPanel from './components/AdminPanel';
import ParticipantView from './components/ParticipantView';
import RecoverAdminForm from './components/RecoverAdminForm';
import { useNotification } from './context/NotificationContext';
import { useCopyToClipboard } from './hooks/useCopyToClipboard';

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
      try { localStorage.setItem(`vacation_admin_${gId}`, adminTok); } catch { }
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
    } catch { }

    setCurrentPage('participant');
  }, []);

  const handleCreateGroup = ({ groupId, adminToken }) => {
    setGroupId(groupId);
    setAdminToken(adminToken);
    // Persist token immediately so it survives page refresh before entering admin panel
    try { localStorage.setItem(`vacation_admin_${groupId}`, adminToken); } catch { }
    setCurrentPage('created');
  };

  const handleEnterAdmin = () => {
    setCurrentPage('admin');
    try { localStorage.setItem(`vacation_admin_${groupId}`, adminToken); } catch { }
    window.history.pushState({}, '', `?group=${groupId}&admin=${adminToken}`);
  };

  const handleJoinGroup = (gId, optAdminToken) => {
    if (optAdminToken) {
      handleRecoverAdmin(gId, optAdminToken);
      return;
    }
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

  const handleRecoverAdmin = (gId, newAdminToken) => {
    setGroupId(gId);
    setAdminToken(newAdminToken);
    try { localStorage.setItem(`vacation_admin_${gId}`, newAdminToken); } catch { }
    setCurrentPage('admin');
    window.history.pushState({}, '', `?group=${gId}&admin=${newAdminToken}`);
  };

  return (
    <div className="min-h-screen bg-dark-950 text-gray-50">
      {currentPage === 'home' && (
        <HomePage onCreateGroup={handleCreateGroup} onJoinGroup={handleJoinGroup} onRecoverAdmin={handleRecoverAdmin} />
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
            <button
              onClick={() => { setShowRecover(true); setShowCreate(false); setShowJoin(false); }}
              className="text-gray-400 hover:text-gray-200 font-semibold px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-1.5"
            >
              <KeyRound size={14} /> Recover
            </button>
            <button
              onClick={() => { setShowCreate(true); setShowJoin(false); setShowRecover(false); }}
              className="bg-blue-500 hover:bg-blue-400 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Create Group
            </button>
            <button
              onClick={() => { setShowJoin(true); setShowCreate(false); setShowRecover(false); }}
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
        {(showCreate || showJoin || showRecover) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeAll}
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
                  {showCreate ? 'Create a Trip' : showJoin ? 'Join a Trip' : 'Recover Admin Access'}
                </h2>
                <button onClick={closeAll} className="text-gray-500 hover:text-gray-300 transition-colors" aria-label="Close modal">
                  <X size={20} />
                </button>
              </div>
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
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { createGroup, hashPhrase } = await import('./firebase');
      const recoveryPasswordHash = passphrase.trim() ? await hashPhrase(passphrase.trim()) : null;
      const result = await createGroup({ name, description, startDate, endDate, adminEmail, recoveryPasswordHash });
      // Best-effort welcome email — does not block group creation
      if (adminEmail) {
        fetch('/api/send-welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            groupId: result.groupId,
            adminToken: result.adminToken,
            groupName: name,
            startDate,
            endDate,
            adminEmail,
            baseUrl: window.location.origin,
          }),
        }).catch((err) => { console.error('[send-welcome] fetch failed:', err); });
      }
      onSuccess(result);
    } catch (err) {
      console.error('[Group Creation Error] handleSubmit failed:', err);
      addNotification({ type: 'error', title: 'Error', message: err.message });
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
          maxLength="30"
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

      {/* Recovery options info */}
      <div className="bg-blue-500/8 border border-blue-500/20 rounded-lg p-3 space-y-2">
        <p className="text-xs font-semibold text-blue-300 flex items-center gap-1.5">
          <KeyRound size={12} /> Admin link recovery (optional)
        </p>
        <p className="text-xs text-gray-400 leading-relaxed">
          If you lose your admin link, you can recover it using a <strong className="text-gray-200">passphrase</strong> or your <strong className="text-gray-200">email</strong>. We strongly recommend setting at least one.
        </p>
      </div>

      <div>
        <label className={labelClass}>Admin Email <span className="text-blue-400 text-xs">(recommended — enables email recovery)</span></label>
        <input
          type="email"
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
          maxLength="30"
          className={inputClass}
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label className={labelClass}>Recovery Passphrase <span className="text-gray-500 text-xs">(optional)</span></label>
        <div className="relative">
          <input
            type={showPassphrase ? 'text' : 'password'}
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            className={`${inputClass} pr-10`}
            placeholder="Something memorable you won't forget"
          />
          <button
            type="button"
            onClick={() => setShowPassphrase(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            aria-label={showPassphrase ? 'Hide passphrase' : 'Show passphrase'}
            aria-pressed={showPassphrase}
          >
            {showPassphrase ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">Hashed in your browser — never stored in plaintext.</p>
      </div>

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
  const { addNotification } = useNotification();
  const [isAdminFound, setIsAdminFound] = useState(false);
  const [adminToken, setAdminToken] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { getGroup } = await import('./firebase');
      const group = await getGroup(groupId);
      if (!group) {
        addNotification({ type: 'error', message: 'Group not found' });
        return;
      }

      const savedToken = localStorage.getItem(`vacation_admin_${groupId}`);
      if (savedToken) {
        setIsAdminFound(true);
        setAdminToken(savedToken);
      } else {
        onSuccess(groupId);
      }
    } catch (err) {
      console.error('[Join Group Error] handleSubmit failed:', err);
      addNotification({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (isAdminFound) {
    return (
      <div className="space-y-5 py-2">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-sm text-blue-200">
            <strong>Welcome back, Admin!</strong><br />
            You're the admin of this group. Where would you like to go?
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onSuccess(groupId)}
            className="flex-1 bg-dark-800 hover:bg-dark-700 text-gray-300 font-semibold py-2.5 px-4 rounded-lg border border-dark-700 transition-colors text-sm"
          >
            Participant View
          </button>
          <button
            onClick={() => onSuccess(groupId, adminToken)}
            className="flex-1 bg-blue-500 hover:bg-blue-400 text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-sm"
          >
            Admin Panel
          </button>
        </div>
      </div>
    );
  }

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
  const { copy: copyP, copied: copiedP } = useCopyToClipboard();
  const { copy: copyA, copied: copiedA } = useCopyToClipboard();

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
              onClick={() => copyP(participantLink)}
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
              onClick={() => copyA(adminLink)}
              className="px-3 py-2 bg-dark-700 hover:bg-dark-800 text-gray-300 rounded-lg text-sm font-semibold border border-dark-700 transition-colors"
            >
              {copiedA ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-amber-400/80 mt-1.5">
            Bookmark or save this link — it's the only way to access your admin panel later.
          </p>
        </div>

        {/* Recovery info */}
        <div className="bg-dark-800 border border-dark-700/60 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <KeyRound size={15} className="text-blue-400" /> Lost your admin link?
          </p>
          <p className="text-xs text-gray-400 leading-relaxed">
            You can recover it anytime from the home page using:
          </p>
          <ul className="text-xs text-gray-400 space-y-1 pl-2">
            <li className="flex items-start gap-1.5">✦ <span><strong className="text-gray-200">Recovery passphrase</strong> — if you set one during group creation</span></li>
            <li className="flex items-start gap-1.5">✦ <span><strong className="text-gray-200">Email magic link</strong> — if you added an admin email</span></li>
          </ul>
          <p className="text-xs text-blue-400/80 pt-1">Click <strong>"Recover"</strong> in the top nav of the home page.</p>
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
