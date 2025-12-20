
import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './auth/Login';
import Signup from './auth/Signup';
import OfflineBanner from './components/OfflineBanner';
import { api } from './services/api';
import { useOffline } from './hooks/useOffline';

type Page = 'home' | 'login' | 'signup' | 'dashboard';

const AppContent: React.FC = () => {
  const { isAuthenticated, token, user } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  
  const handleReconnect = useCallback(() => {
    console.log('App back online - re-syncing...');
    // Without persistent storage, we simply attempt to verify session if possible
    if (token) {
      api.get('/auth/me').catch(console.error);
    }
  }, [token]);

  const isOnline = useOffline(handleReconnect);

  // Sync token to ApiService whenever it changes
  useEffect(() => {
    api.setToken(token);
  }, [token]);

  // If authenticated and on an auth page, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && (currentPage === 'login' || currentPage === 'signup' || currentPage === 'home')) {
      setCurrentPage('dashboard');
    }
  }, [isAuthenticated, currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <>
            <Navbar 
              onLoginClick={() => setCurrentPage('login')} 
              onHomeClick={() => setCurrentPage('home')} 
            />
            <Home onGetStarted={() => setCurrentPage('signup')} />
          </>
        );
      case 'login':
        return <Login onSwitch={() => setCurrentPage('signup')} />;
      case 'signup':
        return <Signup onSwitch={() => setCurrentPage('login')} />;
      case 'dashboard':
        return (
          <ProtectedRoute fallback={<Login onSwitch={() => setCurrentPage('signup')} />}>
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
    </>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
