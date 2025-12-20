
import React, { useState } from 'react';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './auth/Login';
import Signup from './auth/Signup';

type Page = 'home' | 'login' | 'signup' | 'dashboard';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');

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
        return <Dashboard />;
      default:
        return <Home onGetStarted={() => setCurrentPage('signup')} />;
    }
  };

  return (
    <AuthProvider>
      <ProtectedRoute 
        fallback={renderPage()}
      >
        <Dashboard />
      </ProtectedRoute>
    </AuthProvider>
  );
};

export default App;
