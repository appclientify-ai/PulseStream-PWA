
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
    <div className="flex min-h-screen items-center justify-center px-4 bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-sm shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl"></div>
        
        <button 
          onClick={onBackToHome}
          className="absolute left-6 top-6 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Home
        </button>

        <div className="mb-8 text-center pt-4">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Welcome Back</h2>
          <p className="mt-2 text-slate-400">Manage your tax clients with ease</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20 text-center animate-in fade-in slide-in-from-top-2 duration-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">User ID</label>
            <input
              type="text"
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3.5 text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              placeholder="a"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3.5 text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                placeholder="a"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400 transition-colors"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26a5.5 5.5 0 017.747 7.746L8.003 6.554z" clipRule="evenodd" />
                    <path d="M12.454 14.454L9.757 11.757a3.501 3.501 0 004.697 4.697l-2.003-2.003z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-600 py-4 font-black text-white transition-all hover:bg-indigo-500 active:scale-[0.98] shadow-lg shadow-indigo-500/20"
          >
            Sign In
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            Don't have an account?{' '}
            <button onClick={onSwitch} className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
              Register Firm
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
