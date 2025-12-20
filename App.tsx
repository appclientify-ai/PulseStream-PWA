
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
  const { isAuthenticated, token } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  
  const handleReconnect = useCallback(() => {
    if (token) {
      api.get('/auth/me').catch(console.error);
    }
  }, [token]);

  const isOnline = useOffline(handleReconnect);

  useEffect(() => {
    api.setToken(token);
  }, [token]);

  // Handle Redirects based on Auth Status
  useEffect(() => {
    if (isAuthenticated) {
      if (currentPage === 'login' || currentPage === 'signup' || currentPage === 'home') {
        setCurrentPage('dashboard');
      }
    } else {
      // If user logs out or session is lost, go to home or login
      if (currentPage === 'dashboard') {
        setCurrentPage('home');
      }
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
