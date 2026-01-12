
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../services/api.ts';
import Loader from '../../components/Loader';

const Setting: React.FC = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'appearance' | 'data'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form states
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email_id: user?.email_id || '',
    firm_name: user?.firm_name || '',
    gstn: user?.gstn || '',
    mobile_no: user?.mobile_no || '',
    avatar: user?.avatar || null
  });

  const [securityData, setSecurityData] = useState({
    user_id: user?.user_id || '',
    newPassword: '',
    confirmPassword: ''
  });

  const [uiSettings, setUiSettings] = useState(() => {
    const saved = localStorage.getItem('clientify_ui_settings');
    return saved ? JSON.parse(saved) : { fontSize: 16, fontStyle: 'sans' };
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.updateProfile(profileData);
      setMessage({ type: 'success', text: 'Firm profile updated successfully.' });
      // In a real app, you'd trigger an auth context refresh here
      window.location.reload();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Update failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecuritySave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (securityData.newPassword && securityData.newPassword !== securityData.confirmPassword) {
      return setMessage({ type: 'error', text: 'Passwords do not match.' });
    }
    setIsLoading(true);
    try {
      const payload: any = { user_id: securityData.user_id };
      if (securityData.newPassword) payload.password = securityData.newPassword;
      await api.updateProfile(payload);
      setMessage({ type: 'success', text: 'Access credentials rotated successfully.' });
      setSecurityData({ ...securityData, newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Security update failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  const applyUiSettings = (next: any) => {
    setUiSettings(next);
    localStorage.setItem('clientify_ui_settings', JSON.stringify(next));
    document.documentElement.style.setProperty('--ui-font-size', next.fontSize + 'px');
    document.body.classList.remove('app-font-sans', 'app-font-serif', 'app-font-mono');
    document.body.classList.add('app-font-' + next.fontStyle);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerBackup = async () => {
    try {
      const dataStr = await api.backupAllData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Clientify_Backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      setMessage({ type: 'success', text: 'Cloud vault backup downloaded.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Backup failed.' });
    }
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const items = JSON.parse(event.target?.result as string);
        if (!Array.isArray(items)) throw new Error('Invalid backup format');
        if (confirm(`Restore ${items.length} records? This will add to your current vault.`)) {
          setIsLoading(true);
          await api.restoreData(items);
          setMessage({ type: 'success', text: 'Data restoration sequence completed.' });
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Restore failed: Invalid file.' });
      } finally {
        setIsLoading(false);
        if (restoreInputRef.current) restoreInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 max-w-full mx-auto w-full overflow-hidden pb-10">
      
      <div className="flex items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar">
           {[
             { id: 'profile', label: 'Firm Identity' },
             { id: 'security', label: 'Access Control' },
             { id: 'appearance', label: 'UI Appearance' },
             { id: 'data', label: 'Cloud Data' }
           ].map(tab => (
             <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
               className={`px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shrink-0 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}>
               {tab.label}
             </button>
           ))}
        </div>
      </div>

      {message && (
        <div className={`mx-auto w-full max-w-4xl p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest text-center animate-in slide-in-from-top-4 duration-300 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-y-auto no-scrollbar p-10">
         {activeTab === 'profile' && (
           <form onSubmit={handleProfileSave} className="max-w-3xl space-y-10 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex flex-col md:flex-row items-center gap-10 pb-10 border-b border-slate-100">
                 <div className="relative group">
                    <div className="h-32 w-32 rounded-[2.5rem] bg-indigo-600 text-white flex items-center justify-center text-5xl font-black shadow-2xl overflow-hidden ring-8 ring-slate-50">
                       {profileData.avatar ? (
                         <img src={profileData.avatar} alt="DP" className="h-full w-full object-cover" />
                       ) : user?.username?.substring(0,2).toUpperCase()}
                    </div>
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-[-10px] right-[-10px] h-10 w-10 bg-white border border-slate-200 rounded-xl shadow-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all hover:scale-110 active:scale-95"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                 </div>
                 <div className="text-center md:text-left">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{user?.username}</h3>
                    <p className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mt-1.5">Authorized Principal Account</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Practitioner Name</label>
                    <input required value={profileData.username} onChange={e => setProfileData({...profileData, username: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 uppercase" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Work Email</label>
                    <input required value={profileData.email_id} onChange={e => setProfileData({...profileData, email_id: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Legal Firm Name</label>
                    <input required value={profileData.firm_name} onChange={e => setProfileData({...profileData, firm_name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 uppercase" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Firm GSTN</label>
                    <input value={profileData.gstn} onChange={e => setProfileData({...profileData, gstn: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 uppercase font-mono" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Contact No</label>
                    <input value={profileData.mobile_no} onChange={e => setProfileData({...profileData, mobile_no: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50" />
                 </div>
              </div>

              <div className="pt-6">
                 <button type="submit" disabled={isLoading} className="bg-indigo-600 text-white font-black uppercase tracking-widest px-12 py-5 rounded-2xl shadow-xl hover:bg-slate-900 transition-all text-xs">
                   {isLoading ? 'Updating Vault...' : 'Commit Firm Profile'}
                 </button>
              </div>
           </form>
         )}

         {activeTab === 'security' && (
           <form onSubmit={handleSecuritySave} className="max-w-2xl space-y-10 animate-in slide-in-from-bottom-4 duration-300">
              <div className="p-8 bg-amber-50 border border-amber-100 rounded-[2.5rem] flex items-start gap-6">
                 <div className="h-12 w-12 bg-amber-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                 </div>
                 <div>
                    <h4 className="text-lg font-black text-amber-900 uppercase tracking-tight leading-none mb-2">Access Rotation</h4>
                    <p className="text-amber-800/70 text-sm font-medium leading-relaxed">Updating your Master User ID or Password will revoke all existing sessions immediately. Ensure all staff members are notified of the change.</p>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Master User ID</label>
                    <input required value={securityData.user_id} onChange={e => setSecurityData({...securityData, user_id: e.target.value})} className="w-full border-2 border-slate-100 bg-slate-50 rounded-2xl p-5 font-black text-slate-900 focus:border-indigo-600 focus:bg-white outline-none transition-all" />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">New Password</label>
                       <input type="password" value={securityData.newPassword} onChange={e => setSecurityData({...securityData, newPassword: e.target.value})} placeholder="••••••••••••" className="w-full border-2 border-slate-100 bg-slate-50 rounded-2xl p-5 font-black text-slate-900 focus:border-indigo-600 focus:bg-white outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Confirm Password</label>
                       <input type="password" value={securityData.confirmPassword} onChange={e => setSecurityData({...securityData, confirmPassword: e.target.value})} placeholder="••••••••••••" className="w-full border-2 border-slate-100 bg-slate-50 rounded-2xl p-5 font-black text-slate-900 focus:border-indigo-600 focus:bg-white outline-none transition-all" />
                    </div>
                 </div>
                 <div className="pt-4">
                    <button type="submit" disabled={isLoading} className="bg-slate-900 text-white font-black uppercase tracking-widest px-12 py-5 rounded-2xl shadow-xl hover:bg-indigo-600 transition-all text-xs">
                      {isLoading ? 'Rotating Keys...' : 'Rotate Vault Access'}
                    </button>
                 </div>
              </div>
           </form>
         )}

         {activeTab === 'appearance' && (
           <div className="max-w-2xl space-y-12 animate-in slide-in-from-bottom-4 duration-300">
              <section>
                 <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 mb-8 flex items-center gap-3">Visual Scaling <div className="h-px flex-1 bg-slate-100" /></h4>
                 <div className="grid grid-cols-3 gap-4">
                    {[
                      { l: 'Compact', v: 14 },
                      { l: 'Default', v: 16 },
                      { l: 'Large', v: 18 }
                    ].map(sz => (
                      <button key={sz.v} onClick={() => applyUiSettings({...uiSettings, fontSize: sz.v})}
                        className={`flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 transition-all ${uiSettings.fontSize === sz.v ? 'bg-indigo-50 border-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                        <span className="text-[10px] font-black uppercase tracking-widest mb-2">{sz.l}</span>
                        <span className="font-black" style={{ fontSize: sz.v + 'px' }}>Aa</span>
                      </button>
                    ))}
                 </div>
              </section>

              <section>
                 <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 mb-8 flex items-center gap-3">Typography Style <div className="h-px flex-1 bg-slate-100" /></h4>
                 <div className="grid grid-cols-3 gap-4">
                    {[
                      { l: 'Modern Sans', v: 'sans' },
                      { l: 'Classic Serif', v: 'serif' },
                      { l: 'Statutory Mono', v: 'mono' }
                    ].map(sty => (
                      <button key={sty.v} onClick={() => applyUiSettings({...uiSettings, fontStyle: sty.v})}
                        className={`flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 transition-all ${uiSettings.fontStyle === sty.v ? 'bg-indigo-50 border-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'} app-font-${sty.v}`}>
                        <span className="text-[10px] font-black uppercase tracking-widest mb-2">{sty.l}</span>
                        <span className="text-xl font-black">Ref</span>
                      </button>
                    ))}
                 </div>
              </section>
           </div>
         )}

         {activeTab === 'data' && (
           <div className="max-w-2xl space-y-12 animate-in slide-in-from-bottom-4 duration-300">
              <section className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100">
                 <div className="flex items-center gap-6 mb-8">
                    <div className="h-14 w-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" /></svg></div>
                    <div>
                       <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Vault Snapshot</h4>
                       <p className="text-slate-500 text-sm font-medium">Export a complete encrypted JSON backup of your practice data.</p>
                    </div>
                 </div>
                 <button onClick={triggerBackup} className="w-full bg-white border-2 border-indigo-600 text-indigo-600 font-black uppercase tracking-widest py-5 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-600 hover:text-white transition-all text-xs">
                    Download Master Backup
                 </button>
              </section>

              <section className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/10 blur-3xl rounded-full" />
                 <div className="flex items-center gap-6 mb-8 relative z-10">
                    <div className="h-14 w-14 bg-white/10 text-white rounded-2xl flex items-center justify-center"><svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></div>
                    <div>
                       <h4 className="text-xl font-black text-white uppercase tracking-tight">Restore Archive</h4>
                       <p className="text-slate-400 text-sm font-medium">Inject data from an existing Clientify backup into this vault.</p>
                    </div>
                 </div>
                 <button onClick={() => restoreInputRef.current?.click()} className="w-full bg-indigo-600 text-white font-black uppercase tracking-widest py-5 rounded-2xl shadow-xl hover:bg-white hover:text-slate-900 transition-all text-xs relative z-10">
                    Select Restore File
                 </button>
                 <input type="file" ref={restoreInputRef} onChange={handleRestore} className="hidden" accept=".json" />
              </section>
           </div>
         )}
      </div>
    </div>
  );
};

export default Setting;
