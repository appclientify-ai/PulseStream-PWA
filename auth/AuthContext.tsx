
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

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

// Cookie Helpers
const setCookie = (name: string, value: string, days: number) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax; Secure`;
};

const getCookie = (name: string) => {
  return document.cookie.split('; ').reduce((r, v) => {
    const parts = v.split('=');
    return parts[0] === name ? decodeURIComponent(parts[1]) : r;
  }, '');
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
      // Try cookie first, then localStorage
      const savedToken = getCookie('clientify_token') || localStorage.getItem('clientify_token');
      
      if (savedToken) {
        setIsLoading(true);
        try {
          api.setToken(savedToken);
          // Set a timeout for the auth check to prevent infinite loading
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          const response = await api.get('/auth/me');
          clearTimeout(timeoutId);

          if (response && response.user) {
            setToken(savedToken);
            setUser(response.user);
          } else {
            throw new Error('Session invalid');
          }
        } catch (err) {
          console.warn('Auth check bypassed or failed:', err);
          // Clean up if actually invalid
          if (err instanceof Error && err.message.includes('invalid')) {
            deleteCookie('clientify_token');
            localStorage.removeItem('clientify_token');
            api.setToken(null);
          }
        } finally {
          setIsLoading(false);
        }
      }
      // CRITICAL: Always allow the app to proceed to the routing logic
      setHasCheckedAuth(true);
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
      const msg = err.message || 'Login failed';
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
      const msg = err.message || 'Signup failed';
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
    localStorage.removeItem('clientify_token');
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
