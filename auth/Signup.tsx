
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import Loader from '../components/Loader';

interface SignupProps {
  onSwitch: () => void;
  onBackToHome: () => void;
}

const Signup: React.FC<SignupProps> = ({ onSwitch, onBackToHome }) => {
  const [formData, setFormData] = useState({
    username: '',
    mobile_no: '',
    email_id: '',
    firm_name: '',
    gstn: '',
    user_id: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const { signup, isLoading, error } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; 
    
    try {
      await signup(formData);
    } catch (err) {
      // Error handled in AuthContext
    }
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-slate-950 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-sm shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl"></div>

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011-1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Register Firm</h2>
          <p className="mt-2 text-slate-400">Join the next generation of tax management</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20 text-center animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">User Name</label>
              <input
                type="text"
                name="username"
                required
                disabled={isLoading}
                value={formData.username}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-3 text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                placeholder="Full Name"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Mobile No</label>
              <input
                type="tel"
                name="mobile_no"
                required
                disabled={isLoading}
                value={formData.mobile_no}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-3 text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                placeholder="10 digit number"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Email ID</label>
            <input
              type="email"
              name="email_id"
              required
              disabled={isLoading}
              value={formData.email_id}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-3 text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              placeholder="email@example.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Firm Name (Optional)</label>
              <input
                type="text"
                name="firm_name"
                disabled={isLoading}
                value={formData.firm_name}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-3 text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                placeholder="Your Firm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">GSTN (Optional)</label>
              <input
                type="text"
                name="gstn"
                disabled={isLoading}
                value={formData.gstn}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-3 text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                placeholder="GST Number"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Unique User ID</label>
            <input
              type="text"
              name="user_id"
              required
              disabled={isLoading}
              value={formData.user_id}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-3 text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              placeholder="choose_a_username"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                disabled={isLoading}
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-3 text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                placeholder="••••••••"
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
            disabled={isLoading}
            className="mt-6 w-full rounded-2xl bg-indigo-600 py-4 font-black text-white transition-all hover:bg-indigo-500 active:scale-[0.98] shadow-lg shadow-indigo-500/20 disabled:bg-slate-700 disabled:shadow-none"
          >
            {isLoading ? 'Processing...' : 'Register Firm'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <button onClick={onSwitch} disabled={isLoading} className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50">
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
