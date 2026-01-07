
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
    <div className="flex min-h-screen items-center justify-center px-4 bg-slate-50 py-20">
      <div className="w-full max-w-2xl rounded-[3rem] border border-slate-200 bg-white p-12 shadow-2xl shadow-slate-200 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-blue-50 blur-3xl"></div>

        <button 
          onClick={onBackToHome}
          className="absolute left-12 top-12 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Home
        </button>

        <div className="mb-12 text-center pt-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-600 shadow-xl shadow-indigo-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011-1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Register Firm</h2>
          <p className="mt-3 text-lg font-medium text-slate-500">Professional onboarding for CA & Tax practitioners</p>
        </div>

        {error && (
          <div className="mb-8 rounded-2xl bg-red-50 p-5 text-sm font-bold text-red-600 border border-red-100 text-center animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Principal Name</label>
              <input
                type="text"
                name="username"
                required
                disabled={isLoading}
                value={formData.username}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-slate-900 font-bold placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                placeholder="Full Name"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Mobile No</label>
              <input
                type="tel"
                name="mobile_no"
                required
                disabled={isLoading}
                value={formData.mobile_no}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-slate-900 font-bold placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                placeholder="10 digit contact"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Professional Email</label>
            <input
              type="email"
              name="email_id"
              required
              disabled={isLoading}
              value={formData.email_id}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-slate-900 font-bold placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
              placeholder="email@firm.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Firm Name</label>
              <input
                type="text"
                name="firm_name"
                disabled={isLoading}
                value={formData.firm_name}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-slate-900 font-bold placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                placeholder="Practice Name"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Firm GSTN</label>
              <input
                type="text"
                name="gstn"
                disabled={isLoading}
                value={formData.gstn}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-slate-900 font-bold placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Unique User ID</label>
              <input
                type="text"
                name="user_id"
                required
                disabled={isLoading}
                value={formData.user_id}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-slate-900 font-bold placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                placeholder="choose_id"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Firm Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  disabled={isLoading}
                  value={formData.password}
                  onChange={handleChange}
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
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 w-full rounded-2xl bg-indigo-600 py-6 text-xl font-black text-white transition-all hover:bg-slate-900 active:scale-[0.98] shadow-xl shadow-indigo-100 disabled:bg-slate-300 disabled:shadow-none"
          >
            {isLoading ? 'Creating Firm...' : 'Register Professional Firm'}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-base font-medium text-slate-500">
            Already have an account?{' '}
            <button onClick={onSwitch} disabled={isLoading} className="font-black text-indigo-600 hover:text-slate-900 transition-colors">
              Consultant Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
