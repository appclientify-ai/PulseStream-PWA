
import React, { createContext, useContext, useState, ReactNode } from 'react';
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
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (user_id: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { user_id, password });
      setToken(response.token);
      setUser(response.user);
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
