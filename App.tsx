
import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './auth/Login';
import Signup from './auth/Signup';
import Loader from './components/Loader';
import OfflineBanner from './components/OfflineBanner';
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

  // Sync current page with Auth state
  useEffect(() => {
    if (!hasCheckedAuth) return;

    if (isAuthenticated) {
      if (currentPage !== 'dashboard') {
        setCurrentPage('dashboard');
      }
    } else {
      if (currentPage === 'dashboard') {
        setCurrentPage('home');
      }
    }
  }, [isAuthenticated, hasCheckedAuth]);

  // Wait for initial auth check to complete
  if (!hasCheckedAuth) {
    return <Loader />;
  }

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
        return (
          <Login 
            onSwitch={() => setCurrentPage('signup')} 
            onBackToHome={() => setCurrentPage('home')} 
          />
        );
      case 'signup':
        return (
          <Signup 
            onSwitch={() => setCurrentPage('login')} 
            onBackToHome={() => setCurrentPage('home')} 
          />
        );
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
      {/* Global overlay loader for auth transitions */}
      {isLoading && <div className="fixed inset-0 z-[9999] bg-slate-950/50 backdrop-blur-sm"><Loader /></div>}
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
