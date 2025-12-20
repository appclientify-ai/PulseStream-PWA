import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './auth/Login';
import Signup from './auth/Signup';
import { api } from './services/api';

type Page = 'home' | 'login' | 'signup' | 'dashboard';

const AppContent: React.FC = () => {
  const { isAuthenticated, token } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('home');

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

  return renderPage();
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
