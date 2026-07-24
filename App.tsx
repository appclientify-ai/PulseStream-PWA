import React, { useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { AuthProvider, useAuth } from './auth/AuthContext.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import Navbar from './components/Navbar.tsx';
import Loader from './components/Loader.tsx';
import OfflineBanner from './components/OfflineBanner.tsx';

const Home = React.lazy(() => import('./pages/Home.tsx'));
const Dashboard = React.lazy(() => import('./pages/Primary/Dashboard.tsx'));
const Login = React.lazy(() => import('./auth/Login.tsx'));
const Signup = React.lazy(() => import('./auth/Signup.tsx'));
import { api } from './services/api.ts';
import { useOffline } from './hooks/useOffline.ts';
import { Toaster } from 'sonner';
import { socketService } from './services/socket.ts';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const localStoragePersister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: 'CLIENTIFY_QUERY_CACHE',
});

const AppContent: React.FC = () => {
  const { isAuthenticated, token, hasCheckedAuth, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect();
    } else {
      socketService.disconnect();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleDbChange = () => {
      api.invalidateCache();
      queryClient.invalidateQueries();
    };
    window.addEventListener('clientify_db_change', handleDbChange);
    return () => window.removeEventListener('clientify_db_change', handleDbChange);
  }, []);

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
      <React.Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<><Navbar onLoginClick={() => navigate('/login')} onHomeClick={() => navigate('/')} /><Home onGetStarted={() => navigate('/signup')} /></>} />
          <Route path="/login" element={<Login onSwitch={() => navigate('/signup')} onBackToHome={() => navigate('/')} />} />
          <Route path="/signup" element={<Signup onSwitch={() => navigate('/login')} onBackToHome={() => navigate('/')} />} />
          <Route path="/:view" element={
            <>
              <Dashboard />
            </>
          } />
        </Routes>
      </React.Suspense>
      {isLoading && <div className="fixed inset-0 z-[9999] bg-slate-950/20 backdrop-blur-sm"><Loader /></div>}
    </>
  );
};

const App: React.FC = () => (
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{
      persister: localStoragePersister,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    }}
  >
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  </PersistQueryClientProvider>
);

export default App;