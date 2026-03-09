import React, { useState, useEffect, Suspense } from 'react';
import './index.css';
import { GroupProvider } from './shared/context';
import { LoadingSpinner, ErrorBoundary, Footer, StorageConsent } from './shared/ui';
import { Routes, Route, useSearchParams, useNavigate, useLocation, Navigate } from 'react-router-dom';

const AdminPanel = React.lazy(() => import('./features/admin/AdminPage'));
const ParticipantView = React.lazy(() => import('./components/ParticipantView'));
const HomePage = React.lazy(() => import('./features/home/HomePage'));
const GroupCreatedScreen = React.lazy(() => import('./features/home/GroupCreatedScreen'));
const DocumentationPage = React.lazy(() => import('./features/docs/DocumentationPage'));
const PrivacyPolicy = React.lazy(() => import('./features/legal/PrivacyPolicy'));
const TermsOfService = React.lazy(() => import('./features/legal/TermsOfService'));
const LandingPage = React.lazy(() => import('./features/landing/LandingPage'));
const BlogIndex = React.lazy(() => import('./features/blog/BlogIndex'));
const BlogPost = React.lazy(() => import('./features/blog/BlogPost'));
const CompareHub = React.lazy(() => import('./features/landing/CompareHub'));
const ComparePageWrapper = React.lazy(() => import('./features/landing/ComparePageWrapper'));

function RootHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const gId = searchParams.get('group');
  const adminTok = searchParams.get('admin');
  const pId = searchParams.get('p');

  const [groupId, setGroupId] = useState(gId || null);
  const [adminToken, setAdminToken] = useState(adminTok || null);
  const [participantId, setParticipantId] = useState(pId || null);
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    // One-time migration from old localStorage keys
    try {
      const isMigrationComplete = localStorage.getItem('fad_migration_v1_complete');
      if (!isMigrationComplete) {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('vacation_admin_')) {
            const newKey = key.replace('vacation_admin_', 'fad_admin_');
            localStorage.setItem(newKey, localStorage.getItem(key));
            localStorage.removeItem(key);
          }
          if (key.startsWith('vacation_p_')) {
            const newKey = key.replace('vacation_p_', 'fad_p_');
            localStorage.setItem(newKey, localStorage.getItem(key));
            localStorage.removeItem(key);
          }
          if (key === 'vacation_storage_consent') {
            localStorage.setItem('fad_storage_consent', localStorage.getItem(key));
            localStorage.removeItem(key);
          }
        });
        localStorage.setItem('fad_migration_v1_complete', 'true');
      }
    } catch (error) {
      console.error("localStorage migration vacation_admin_/vacation_p_ -> fad_admin_/fad_p_ failed:", error);
    }

    if (gId) {
      setGroupId(gId);
      if (adminTok) {
        setAdminToken(adminTok);
        setCurrentPage('admin');
        try { localStorage.setItem(`fad_admin_${gId}`, adminTok); } catch { }
        return;
      }
      if (pId) {
        setParticipantId(pId);
        setCurrentPage('participant');
        return;
      }

      // localStorage fallback
      try {
        const storedAdmin = localStorage.getItem(`fad_admin_${gId}`);
        if (storedAdmin) {
          setAdminToken(storedAdmin);
          setCurrentPage('admin');
          return;
        }
        const storedParticipant = localStorage.getItem(`fad_p_${gId}`);
        if (storedParticipant) {
          const { participantId: storedPId } = JSON.parse(storedParticipant);
          setParticipantId(storedPId);
          setCurrentPage('participant');
          return;
        }
      } catch { }

      setAdminToken(null);
      setParticipantId(null);
      setCurrentPage('participant');
    } else {
      setAdminToken(null);
      setParticipantId(null);
      setCurrentPage('home');
    }
  }, [gId, adminTok, pId]);

  const handleCreateGroup = ({ groupId, adminToken }) => {
    setGroupId(groupId);
    setAdminToken(adminToken);
    try { localStorage.setItem(`fad_admin_${groupId}`, adminToken); } catch { }
    setCurrentPage('created');
  };

  const handleEnterAdmin = () => {
    setCurrentPage('admin');
    try { localStorage.setItem(`fad_admin_${groupId}`, adminToken); } catch { }
    navigate(`/?group=${groupId}&admin=${adminToken}`);
  };

  const handleJoinGroup = (joinGId, optAdminToken) => {
    if (optAdminToken) {
      handleRecoverAdmin(joinGId, optAdminToken);
      return;
    }
    setGroupId(joinGId);
    setAdminToken(null);
    setParticipantId(null);
    setCurrentPage('participant');
    navigate(`/?group=${joinGId}`);
  };

  const handleBackHome = () => {
    setCurrentPage('home');
    setGroupId(null);
    setAdminToken(null);
    setParticipantId(null);
    navigate('/');
  };

  const handleRecoverAdmin = (recGId, newAdminToken) => {
    setGroupId(recGId);
    setAdminToken(newAdminToken);
    try { localStorage.setItem(`fad_admin_${recGId}`, newAdminToken); } catch { }
    setCurrentPage('admin');
    navigate(`/?group=${recGId}&admin=${newAdminToken}`);
  };

  const isAdmin = !!adminToken;

  return (
    <GroupProvider groupId={groupId} adminToken={adminToken} isAdmin={isAdmin}>
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
    </GroupProvider>
  );
}

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Need to scroll to top on path change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-dark-950 text-gray-50 flex flex-col">
      <main className="flex-grow flex flex-col">
        <Suspense fallback={
          <div className="flex-grow flex items-center justify-center">
            <LoadingSpinner label="Loading page..." size="lg" />
          </div>
        }>
          <Routes>
            <Route path="/" element={<RootHandler />} />
            <Route path="/vacation-planner" element={<LandingPage type="vacation" />} />
            <Route path="/doodle-alternative" element={<LandingPage type="doodle" />} />
            <Route path="/when2meet-alternative" element={<LandingPage type="when2meet" />} />
            <Route path="/find-a-date-for-dinner" element={<Navigate to="/find-a-day-for-dinner" replace />} />
            <Route path="/find-a-day-for-dinner" element={<LandingPage type="dinner" />} />
            <Route path="/group-event-planner" element={<LandingPage type="event" />} />
            <Route path="/team-scheduling" element={<LandingPage type="team" />} />
            <Route path="/party-planner" element={<LandingPage type="party" />} />
            <Route path="/game-night-planner" element={<LandingPage type="gamenight" />} />
            <Route path="/christmas-dinner-planner" element={<LandingPage type="christmas" />} />
            <Route path="/summer-vacation-planner" element={<LandingPage type="summer" />} />
            <Route path="/family-reunion-planner" element={<LandingPage type="family" />} />
            <Route path="/compare" element={<CompareHub />} />
            <Route path="/compare/:competitor" element={<ComparePageWrapper />} />
            <Route path="/docs" element={<DocumentationPage onBack={() => navigate('/')} />} />
            <Route path="/blog" element={<BlogIndex onBack={() => navigate('/')} />} />
            <Route path="/blog/:slug" element={<BlogPost onBack={() => navigate('/blog')} />} />
            <Route path="/privacy" element={<PrivacyPolicy onBack={() => navigate('/')} />} />
            <Route path="/terms" element={<TermsOfService onBack={() => navigate('/')} />} />
          </Routes>
        </Suspense>
      </main>
      <Footer
        onNavigateDocs={() => navigate('/docs')}
        onNavigatePrivacy={() => navigate('/privacy')}
        onNavigateTerms={() => navigate('/terms')}
      />
      <StorageConsent onNavigate={(path) => navigate(path)} />
    </div>
  );
}

function App() {
  return <MainLayout />;
}

export default App;
