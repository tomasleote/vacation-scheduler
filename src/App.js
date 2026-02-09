import React, { useState, useEffect } from 'react';
import './index.css';
import AdminPanel from './components/AdminPanel';
import ParticipantView from './components/ParticipantView';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [groupId, setGroupId] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const gId = urlParams.get('group');
    if (gId) {
      setGroupId(gId);
      setCurrentPage(gId.startsWith('admin_') ? 'admin' : 'participant');
    }
  }, []);

  const handleCreateGroup = (newGroupId) => {
    setGroupId(`admin_${newGroupId}`);
    setCurrentPage('admin');
    window.history.pushState({}, '', `?group=admin_${newGroupId}`);
  };

  const handleJoinGroup = (gId) => {
    setGroupId(gId);
    setCurrentPage('participant');
    window.history.pushState({}, '', `?group=${gId}`);
  };

  const handleBackHome = () => {
    setCurrentPage('home');
    setGroupId(null);
    window.history.pushState({}, '', '/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {currentPage === 'home' && (
        <HomePage onCreateGroup={handleCreateGroup} onJoinGroup={handleJoinGroup} />
      )}
      {currentPage === 'admin' && (
        <AdminPanel groupId={groupId.replace('admin_', '')} onBack={handleBackHome} />
      )}
      {currentPage === 'participant' && (
        <ParticipantView groupId={groupId} onBack={handleBackHome} />
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
      const groupId = await createGroup({
        name,
        startDate,
        endDate,
        adminEmail
      });
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

export default App;
