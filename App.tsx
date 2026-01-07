
import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Primary/Dashboard';
import Login from './auth/Login';
import Signup from './auth/Signup';
import Loader from './components/Loader';
import OfflineBanner from './components/OfflineBanner';
import ErrorBoundary from './components/ErrorBoundary';
import { api } from './services/api';
import { useOffline } from './hooks/useOffline';

type Page = 'home' | 'login' | 'signup' | 'dashboard';

const AppContent: React.FC = () => {
  const { isAuthenticated, token, hasCheckedAuth, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  
  const handleReconnect = useCallback(() => {
    if (token) {
      api.get('/auth/me').catch(console.error);
    }
  }, [token]);

  const isOnline = useOffline(handleReconnect);

  useEffect(() => {
    if (!hasCheckedAuth) return;
    if (isAuthenticated) {
      if (currentPage !== 'dashboard') setCurrentPage('dashboard');
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
    <ErrorBoundary>
      <OfflineBanner isOnline={isOnline} />
      {renderPage()}
      {isLoading && <div className="fixed inset-0 z-[9999] bg-slate-950/20 backdrop-blur-sm"><Loader /></div>}
    </ErrorBoundary>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
