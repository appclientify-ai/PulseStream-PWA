import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import Navbar from './components/Navbar.tsx';
import Home from './pages/Home.tsx';
import Dashboard from './pages/Primary/Dashboard.tsx';
import Login from './auth/Login.tsx';
import Signup from './auth/Signup.tsx';
import Loader from './components/Loader.tsx';
import OfflineBanner from './components/OfflineBanner.tsx';
import { api } from './services/api.ts';
import { useOffline } from './hooks/useOffline.ts';

type Page = 'home' | 'login' | 'signup' | 'dashboard';

const AppContent: React.FC = () => {
  const { isAuthenticated, token, hasCheckedAuth, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  
  const handleReconnect = useCallback(() => {
    if (token) api.get('/auth/me').catch(() => {});
  }, [token]);

  const isOnline = useOffline(handleReconnect);

  useEffect(() => {
    if (!hasCheckedAuth) return;
    if (isAuthenticated) {
      setCurrentPage('dashboard');
    } else {
      if (currentPage === 'dashboard') setCurrentPage('home');
    }
  }, [isAuthenticated, hasCheckedAuth]);

  if (!hasCheckedAuth) return <Loader />;

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <>
            <Navbar onLoginClick={() => setCurrentPage('login')} onHomeClick={() => setCurrentPage('home')} />
            <Home onGetStarted={() => setCurrentPage('signup')} />
          </>
        );
      case 'login':
        return <Login onSwitch={() => setCurrentPage('signup')} onBackToHome={() => setCurrentPage('home')} />;
      case 'signup':
        return <Signup onSwitch={() => setCurrentPage('login')} onBackToHome={() => setCurrentPage('home')} />;
      case 'dashboard':
        return (
          <ProtectedRoute fallback={<Login onSwitch={() => setCurrentPage('signup')} onBackToHome={() => setCurrentPage('home')} />}>
            <Dashboard />
          </ProtectedRoute>
        );
      default:
        return <Home onGetStarted={() => setCurrentPage('signup')} />;
    }
  };

  return (
    <>
      <OfflineBanner isOnline={isOnline} />
      {renderPage()}
      {isLoading && <div className="fixed inset-0 z-[9999] bg-slate-950/20 backdrop-blur-sm"><Loader /></div>}
    </>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
