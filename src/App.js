import React, { useState, useEffect, Suspense } from 'react';
import './index.css';
import { GroupProvider } from './shared/context';
import { LoadingSpinner, ErrorBoundary, Footer, StorageConsent } from './shared/ui';

const AdminPanel = React.lazy(() => import('./features/admin/AdminPage'));
const ParticipantView = React.lazy(() => import('./components/ParticipantView'));
const HomePage = React.lazy(() => import('./features/home/HomePage'));
const GroupCreatedScreen = React.lazy(() => import('./features/home/GroupCreatedScreen'));
const DocumentationPage = React.lazy(() => import('./features/docs/DocumentationPage'));
const PrivacyPolicy = React.lazy(() => import('./features/legal/PrivacyPolicy'));
const TermsOfService = React.lazy(() => import('./features/legal/TermsOfService'));

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [groupId, setGroupId] = useState(null);
  const [adminToken, setAdminToken] = useState(null);
  const [participantId, setParticipantId] = useState(null);

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/docs') {
      setCurrentPage('docs');
      return;
    }

    if (path === '/privacy') {
      setCurrentPage('privacy');
      return;
    }

    if (path === '/terms') {
      setCurrentPage('terms');
      return;
    }

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

  const isAdmin = !!adminToken;

  return (
    <GroupProvider groupId={groupId} adminToken={adminToken} isAdmin={isAdmin}>
      <div className="min-h-screen bg-dark-950 text-gray-50 flex flex-col">
        <main className="flex-grow flex flex-col">
          <Suspense fallback={
            <div className="flex-grow flex items-center justify-center">
              <LoadingSpinner label="Loading page..." size="lg" />
            </div>
          }>
            {currentPage === 'home' && (
              <ErrorBoundary>
                <HomePage onCreateGroup={handleCreateGroup} onJoinGroup={handleJoinGroup} onRecoverAdmin={handleRecoverAdmin} />
              </ErrorBoundary>
            )}
            {currentPage === 'created' && (
              <ErrorBoundary>
                <GroupCreatedScreen
                  groupId={groupId}
                  adminToken={adminToken}
                  onEnterAdmin={handleEnterAdmin}
                  onBack={handleBackHome}
                />
              </ErrorBoundary>
            )}
            {currentPage === 'admin' && (
              <ErrorBoundary>
                <AdminPanel
                  onBack={handleBackHome}
                />
              </ErrorBoundary>
            )}
            {currentPage === 'participant' && (
              <ErrorBoundary>
                <ParticipantView
                  participantId={participantId}
                  onBack={handleBackHome}
                />
              </ErrorBoundary>
            )}
            {currentPage === 'docs' && (
              <ErrorBoundary>
                <DocumentationPage onBack={handleBackHome} />
              </ErrorBoundary>
            )}
            {currentPage === 'privacy' && (
              <ErrorBoundary>
                <PrivacyPolicy onBack={handleBackHome} />
              </ErrorBoundary>
            )}
            {currentPage === 'terms' && (
              <ErrorBoundary>
                <TermsOfService onBack={handleBackHome} />
              </ErrorBoundary>
            )}
          </Suspense>
        </main>
        <Footer
          onNavigateDocs={(path) => {
            setCurrentPage('docs');
            window.history.pushState({}, '', path);
            window.scrollTo(0, 0);
          }}
          onNavigatePrivacy={(path) => {
            setCurrentPage('privacy');
            window.history.pushState({}, '', path);
            window.scrollTo(0, 0);
          }}
          onNavigateTerms={(path) => {
            setCurrentPage('terms');
            window.history.pushState({}, '', path);
            window.scrollTo(0, 0);
          }}
        />
        <StorageConsent onNavigate={(path) => {
          const page = path.includes('privacy') ? 'privacy' : path.includes('terms') ? 'terms' : 'home';
          setCurrentPage(page);
          window.history.pushState({}, '', path);
          window.scrollTo(0, 0);
        }} />
      </div>
    </GroupProvider>
  );
}

export default App;
