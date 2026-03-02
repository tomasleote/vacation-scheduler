import React, { useState, useEffect } from 'react';
import './index.css';
import AdminPanel from './features/admin/AdminPage';
import ParticipantView from './components/ParticipantView';
import HomePage from './features/home/HomePage';
import GroupCreatedScreen from './features/home/GroupCreatedScreen';

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

export default App;
