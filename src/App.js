import React, { useState, useEffect } from 'react';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-center mb-2 text-indigo-600">Vacation Scheduler</h1>
        <p className="text-center text-gray-600 mb-8">Plan group vacations with ease</p>
        
        {!showCreate && !showJoin && (
          <div className="space-y-4">
            <button
              onClick={() => setShowCreate(true)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition"
            >
              Create Group
            </button>
            <button
              onClick={() => setShowJoin(true)}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg transition"
            >
              Join Group
            </button>
          </div>
        )}

        {showCreate && (
          <CreateGroupForm onSuccess={onCreateGroup} onCancel={() => setShowCreate(false)} />
        )}

        {showJoin && (
          <JoinGroupForm onSuccess={onJoinGroup} onCancel={() => setShowJoin(false)} />
        )}
      </div>
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="e.g., Summer Trip 2024"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description (optional) {description.length}/500
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 500))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="e.g., Beach trip to Hawaii, hiking adventure, etc."
          rows="2"
          maxLength="500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email (for reminders)</label>
        <input
          type="email"
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="your@email.com"
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Group ID</label>
        <input
          type="text"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Paste group ID here"
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
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
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-2">&#10003;</div>
          <h1 className="text-2xl font-bold text-gray-800">Group created!</h1>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Share with participants:
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={participantLink}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
            />
            <button
              onClick={() => copy(participantLink, setCopiedP)}
              className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold"
            >
              {copiedP ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your admin link — save this:
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={adminLink}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
            />
            <button
              onClick={() => copy(adminLink, setCopiedA)}
              className="px-3 py-2 bg-gray-700 text-white rounded-lg text-sm font-semibold"
            >
              {copiedA ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Bookmark or save this link — it's the only way to access your admin panel later.
          </p>
        </div>

        <button
          onClick={onEnterAdmin}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition"
        >
          Open Admin Panel →
        </button>
      </div>
    </div>
  );
}

export default App;
