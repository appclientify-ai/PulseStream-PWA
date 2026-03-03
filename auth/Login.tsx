
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import Loader from '../components/Loader';
import { api } from '../services/api.ts';

type ViewState = 'login' | 'forgot_user' | 'forgot_pass' | 'reset_password_step';

const Login: React.FC<{ onSwitch: () => void; onBackToHome: () => void }> = ({ onSwitch, onBackToHome }) => {
  const [view, setView] = useState<ViewState>('login');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error } = useAuth();

  // Recovery States
  const [recoveryName, setRecoveryName] = useState('');
  const [recoveryMobile, setRecoveryMobile] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoverySuccess, setRecoverySuccess] = useState<string | null>(null);
  const [foundUserId, setFoundUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userId.trim() && password.trim()) {
      try { await login(userId, password); } catch (err) { /* ignore */ }
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    setRecoverySuccess(null);
    setIsRecovering(true);

    try {
      const response = await api.post('/auth/recover-identity', {
        username: recoveryName,
        mobile_no: recoveryMobile,
        email_id: recoveryEmail
      });

      if (view === 'forgot_user') {
        setRecoverySuccess(`Identity Verified. Your Master User ID is: ${response.user_id}`);
        setFoundUserId(response.user_id);
      } else {
        setFoundUserId(response.user_id);
        setView('reset_password_step');
      }
    } catch (err: any) {
      setRecoveryError(err.message || 'Identity verification failed. Check details.');
    } finally {
      setIsRecovering(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    setIsRecovering(true);

    try {
      await api.post('/auth/reset-password-recovery', {
        user_id: foundUserId,
        new_password: newPassword,
        username: recoveryName,
        mobile_no: recoveryMobile,
        email_id: recoveryEmail
      });
      setRecoverySuccess('Password reset successfully. You can now login.');
      setTimeout(() => setView('login'), 2000);
    } catch (err: any) {
      setRecoveryError(err.message || 'Password reset failed.');
    } finally {
      setIsRecovering(false);
    }
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900">
      <div className="w-full max-w-md rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-2xl shadow-slate-200 relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-indigo-50/50 blur-3xl" />
        
        <button 
          onClick={view === 'login' ? onBackToHome : () => setView('login')}
          className="absolute left-10 top-10 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 transition-all hover:-translate-x-1"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          {view === 'login' ? 'Exit Vault' : 'Back to Login'}
        </button>

        <div className="mb-10 text-center pt-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-200 transition-transform hover:rotate-6">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase leading-none">
            {view === 'login' ? 'Authenticate' : view === 'forgot_user' ? 'Find User' : 'Security Reset'}
          </h2>
          <p className="mt-3 text-sm font-bold text-slate-400 uppercase tracking-widest">
            {view === 'login' ? 'Secure Firm Sync Session' : 'Vault Identity Verification'}
          </p>
        </div>

        {(error || recoveryError) && (
          <div className="mb-8 rounded-2xl bg-red-50 p-5 text-[10px] font-black uppercase tracking-widest text-red-600 border border-red-100 text-center animate-in shake duration-300">
            {error || recoveryError}
          </div>
        )}

        {recoverySuccess && (
          <div className="mb-8 rounded-2xl bg-emerald-50 p-5 text-[10px] font-black uppercase tracking-widest text-emerald-600 border border-emerald-100 text-center animate-in slide-in-from-top-2">
            {recoverySuccess}
          </div>
        )}

        {view === 'login' && (
          <>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Master User ID</label>
                <input
                  type="text" required autoFocus value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-slate-900 font-bold placeholder-slate-300 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                  placeholder="YourFirmID"
                />
                <div className="flex justify-end">
                   <button type="button" onClick={() => setView('forgot_user')} className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline transition-all">Forgot User ID?</button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Credential</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"} required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-slate-900 font-bold placeholder-slate-300 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg>
                    )}
                  </button>
                </div>
                <div className="flex justify-end">
                   <button type="button" onClick={() => setView('forgot_pass')} className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline transition-all">Forgot Password?</button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full rounded-2xl bg-indigo-600 py-5 text-sm font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-slate-900 active:scale-[0.98] shadow-xl shadow-indigo-100"
              >
                Authorize Entry
              </button>
            </form>
          </>
        )}

        {(view === 'forgot_user' || view === 'forgot_pass') && (
          <form onSubmit={handleRecovery} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Principal Legal Name</label>
              <input type="text" required autoFocus value={recoveryName} onChange={e => setRecoveryName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-slate-900 font-bold uppercase outline-none focus:border-indigo-600 transition-all" placeholder="Enter Full Name" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registered Mobile No</label>
              <input type="tel" required value={recoveryMobile} onChange={e => setRecoveryMobile(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all" placeholder="9876543210" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Professional Email ID</label>
              <input type="email" required value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-slate-900 font-bold lowercase outline-none focus:border-indigo-600 transition-all" placeholder="office@firm.com" />
            </div>
            <button type="submit" disabled={isRecovering} className="w-full rounded-2xl bg-indigo-600 py-5 text-sm font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-slate-900 active:scale-[0.98] shadow-xl shadow-indigo-100 disabled:opacity-50">
               {isRecovering ? 'Verifying Identity...' : 'Validate Identity'}
            </button>
          </form>
        )}

        {view === 'reset_password_step' && (
          <form onSubmit={handlePasswordReset} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-center">
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Authenticated For</p>
                <p className="text-sm font-black text-indigo-900">{foundUserId}</p>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Access Credential</label>
                <input type="password" required autoFocus value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all" placeholder="••••••••••••" />
             </div>
             <button type="submit" disabled={isRecovering} className="w-full rounded-2xl bg-slate-900 py-5 text-sm font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-indigo-600 active:scale-[0.98] shadow-xl disabled:opacity-50">
               {isRecovering ? 'Updating Vault...' : 'Commit New Password'}
             </button>
          </form>
        )}

        <div className="mt-10 text-center">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            {view === 'login' ? (
              <>New Practitioner? <button onClick={onSwitch} className="text-indigo-600 hover:text-slate-900 underline-offset-4 hover:underline transition-all">Initialize Firm Profile</button></>
            ) : (
              <button onClick={() => setView('login')} className="text-indigo-600 hover:text-slate-900 underline-offset-4 hover:underline transition-all">Return to Sign In</button>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
