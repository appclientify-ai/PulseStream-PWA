import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user_id: string, password: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  hasCheckedAuth: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cookie Helpers for PWA compatibility and security
const setCookie = (name: string, value: string, days: number) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax; Secure`;
};

const getCookie = (name: string) => {
  const cookies = document.cookie.split('; ');
  for (let i = 0; i < cookies.length; i++) {
    const parts = cookies[i].split('=');
    if (parts[0] === name) return decodeURIComponent(parts[1]);
  }
  return '';
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize: Check for existing session on reload
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = getCookie('clientify_token');
        if (savedToken) {
          setIsLoading(true);
          api.setToken(savedToken);
          const response = await api.get('/auth/me');
          if (response && response.user) {
            setToken(savedToken);
            setUser(response.user);
          } else {
            throw new Error('Invalid user session');
          }
        }
      } catch (err) {
        console.warn('Auth check skipped or failed:', err);
        deleteCookie('clientify_token');
        api.setToken(null);
      } finally {
        setIsLoading(false);
        setHasCheckedAuth(true);
      }
    };
    initAuth();
  }, []);

  const login = async (user_id: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { user_id, password });
      setToken(response.token);
      setUser(response.user);
      setCookie('clientify_token', response.token, 7);
      api.setToken(response.token);
    } catch (err: any) {
      const msg = err.message || 'Authentication failed. Verify credentials.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/signup', data);
      setToken(response.token);
      setUser(response.user);
      setCookie('clientify_token', response.token, 7);
      api.setToken(response.token);
    } catch (err: any) {
      const msg = err.message || 'Onboarding failed. User ID or Email may be taken.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setError(null);
    deleteCookie('clientify_token');
    api.setToken(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isAuthenticated: !!token, 
      login, 
      signup, 
      logout, 
      isLoading, 
      hasCheckedAuth,
      error 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};