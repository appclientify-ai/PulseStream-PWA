
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
import { useOffline } from './hooks/useOffline';

type Page = 'home' | 'login' | 'signup' | 'dashboard';

const AppContent: React.FC = () => {
  const { isAuthenticated, hasCheckedAuth, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const isOnline = useOffline();

  useEffect(() => {
    if (!hasCheckedAuth) return;
    if (isAuthenticated) {
      setCurrentPage('dashboard');
    } else {
      // Allow user to stay on login/signup/home if not authenticated
      if (currentPage === 'dashboard') {
        setCurrentPage('home');
      }
    }
  }, [isAuthenticated, hasCheckedAuth]);

  if (!hasCheckedAuth) return <Loader />;

  const renderPage = () => {
    if (isAuthenticated) return <Dashboard />;

    switch (currentPage) {
      case 'login':
        return <Login onSwitch={() => setCurrentPage('signup')} onBackToHome={() => setCurrentPage('home')} />;
      case 'signup':
        return <Signup onSwitch={() => setCurrentPage('login')} onBackToHome={() => setCurrentPage('home')} />;
      case 'home':
      default:
        return (
          <>
            <Navbar onLoginClick={() => setCurrentPage('login')} onHomeClick={() => setCurrentPage('home')} />
            <Home onGetStarted={() => setCurrentPage('signup')} />
          </>
        );
    }
  };

  return (
    <ErrorBoundary>
      <OfflineBanner isOnline={isOnline} />
      {renderPage()}
      {isLoading && !hasCheckedAuth && <div className="fixed inset-0 z-[9999] bg-white/50 backdrop-blur-sm"><Loader /></div>}
    </ErrorBoundary>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
