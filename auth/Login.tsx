
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import Loader from '../components/Loader';

interface LoginProps {
  onSwitch: () => void;
  onBackToHome: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitch, onBackToHome }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userId.trim() && password.trim()) {
      try {
        await login(userId, password);
      } catch (err) {
        // Error is handled in context
      }
    }
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-slate-50">
      <div className="w-full max-w-md rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-2xl shadow-slate-200 relative overflow-hidden">
        {/* Subtle background decorative element */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-indigo-50 blur-3xl"></div>
        
        <button 
          onClick={onBackToHome}
          className="absolute left-10 top-10 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Home
        </button>

        <div className="mb-10 text-center pt-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-600 shadow-xl shadow-indigo-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Consultant Login</h2>
          <p className="mt-3 text-lg font-medium text-slate-500">Secure access to your firm vault</p>
        </div>

        {error && (
          <div className="mb-8 rounded-2xl bg-red-50 p-5 text-sm font-bold text-red-600 border border-red-100 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Unique User ID</label>
            <input
              type="text"
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-slate-900 font-bold placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
              placeholder="Enter your ID"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-slate-900 font-bold placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26a5.5 5.5 0 017.747 7.746L8.003 6.554z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-2xl bg-indigo-600 py-5 text-lg font-black text-white transition-all hover:bg-slate-900 active:scale-[0.98] shadow-xl shadow-indigo-100"
          >
            Authorize Access
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-base font-medium text-slate-500">
            New consultant?{' '}
            <button onClick={onSwitch} className="font-black text-indigo-600 hover:text-slate-900 transition-colors">
              Register Your Firm
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
