import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import Loader from '../components/Loader';

interface LoginProps {
  onSwitch: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitch }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && password.trim()) {
      try {
        await login(email, password);
      } catch (err) {
        // Error is handled in context
      }
    }
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-sm shadow-2xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
          <p className="mt-2 text-slate-400">Log in to your PulseStream account</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="name@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white transition-all hover:bg-blue-500 active:scale-[0.98] shadow-lg shadow-blue-500/20"
          >
            Sign In
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          Don't have an account?{' '}
          <button onClick={onSwitch} className="font-semibold text-blue-400 hover:text-blue-300">
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
