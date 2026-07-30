
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
    <div className="flex min-h-screen items-center justify-center px-4 bg-slate-50 selection:bg-indigo-100 py-20">
      <div className="w-full max-w-2xl rounded-[3rem] border border-slate-200 bg-white p-12 shadow-2xl shadow-slate-200 relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-blue-50/50 blur-3xl" />

        <button 
          onClick={onBackToHome}
          className="absolute left-12 top-12 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 transition-all hover:-translate-x-1"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Cancel
        </button>

        <div className="mb-12 text-center pt-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 shadow-xl shadow-indigo-100 overflow-hidden relative border border-indigo-100 shrink-0">
            <img 
              src="/icon.png" 
              alt="Clientify Logo" 
              className="relative z-10 h-full w-full object-cover rounded-full" 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.dataset.triedIcon) {
                  target.dataset.triedIcon = 'true';
                  target.src = '/icon.svg';
                } else {
                  target.style.display = 'none';
                }
              }}
            />
            <span className="absolute z-0 text-2xl font-black text-white">C</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase leading-none">Register Firm</h2>
          <p className="mt-3 text-sm font-bold text-slate-400 uppercase tracking-widest">Initialize Professional Onboarding</p>
        </div>

        {error && (
          <div className="mb-8 rounded-2xl bg-red-50 p-5 text-[10px] font-black uppercase tracking-widest text-red-600 border border-red-100 text-center animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">Principal Identity <div className="h-px flex-1 bg-slate-100" /></h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Full Name</label>
                  <input type="text" name="username" required value={formData.username} onChange={handleChange} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-slate-900 font-bold placeholder-slate-300 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all uppercase" placeholder="JOHN DOE" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Number</label>
                  <input type="tel" name="mobile_no" required value={formData.mobile_no} onChange={handleChange} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-slate-900 font-bold placeholder-slate-300 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all" placeholder="9876543210" />
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Professional Email</label>
                <input type="email" name="email_id" required value={formData.email_id} onChange={handleChange} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-slate-900 font-bold placeholder-slate-300 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all lowercase" placeholder="office@firm.com" />
             </div>
          </div>

          <div className="space-y-6">
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">Practice Details <div className="h-px flex-1 bg-slate-100" /></h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Firm Name</label>
                  <input type="text" name="firm_name" value={formData.firm_name} onChange={handleChange} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-slate-900 font-bold placeholder-slate-300 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all uppercase" placeholder="VAULT TAX ASSOCIATES" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Firm GSTIN (Optional)</label>
                  <input type="text" name="gstn" value={formData.gstn} onChange={handleChange} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-slate-900 font-bold placeholder-slate-300 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all uppercase" placeholder="22AAAAA0000A1Z5" />
                </div>
             </div>
          </div>

          <div className="space-y-6">
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">Vault Security <div className="h-px flex-1 bg-slate-100" /></h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Master User ID</label>
                  <input type="text" name="user_id" required value={formData.user_id} onChange={handleChange} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-slate-900 font-black placeholder-slate-300 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all" placeholder="DesiredID" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Master Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} name="password" required value={formData.password} onChange={handleChange} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-slate-900 font-bold placeholder-slate-300 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all" placeholder="••••••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors">
                      {showPassword ? <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg> : <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg>}
                    </button>
                  </div>
                </div>
             </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-2xl bg-indigo-600 py-6 text-sm font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-slate-900 active:scale-[0.98] shadow-2xl shadow-indigo-100 disabled:opacity-50"
          >
            {isLoading ? 'Encrypting Firm Data...' : 'Initialize Professional Firm'}
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Already registered?{' '}
            <button onClick={onSwitch} disabled={isLoading} className="text-indigo-600 hover:text-slate-900 underline-offset-4 hover:underline transition-all">
              Consultant Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
