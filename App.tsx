import React, { useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
import { Toaster } from 'sonner';

const AppContent: React.FC = () => {
  const { isAuthenticated, token, hasCheckedAuth, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleReconnect = useCallback(() => {
    if (token) api.get('/auth/me').catch(() => {});
  }, [token]);
  const isOnline = useOffline(handleReconnect);

  useEffect(() => {
    if (!hasCheckedAuth) return;
    if (isAuthenticated) {
      if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup') {
        navigate('/dashboard', { replace: true });
      }
    } else {
      if (location.pathname !== '/' && location.pathname !== '/login' && location.pathname !== '/signup') {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, hasCheckedAuth, location.pathname, navigate]);

  if (!hasCheckedAuth) return <Loader />;

  return (
    <>
      <Toaster position="top-right" richColors />
      <OfflineBanner isOnline={isOnline} />
      <Routes>
        <Route path="/" element={<><Navbar onLoginClick={() => navigate('/login')} onHomeClick={() => navigate('/')} /><Home onGetStarted={() => navigate('/signup')} /></>} />
        <Route path="/login" element={<Login onSwitch={() => navigate('/signup')} onBackToHome={() => navigate('/')} />} />
        <Route path="/signup" element={<Signup onSwitch={() => navigate('/login')} onBackToHome={() => navigate('/')} />} />
        <Route path="/:view" element={
          <ProtectedRoute fallback={<Navigate to="/login" replace />}>
            <Dashboard />
          </ProtectedRoute>
        } />
      </Routes>
      {isLoading && <div className="fixed inset-0 z-[9999] bg-slate-950/20 backdrop-blur-sm"><Loader /></div>}
    </>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </BrowserRouter>
);

export default App;