
import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../services/api.ts';
import { usePWA, DeviceCategory } from '../../hooks/usePWA';
import Loader from '../../components/Loader';
import { useTheme } from '../../hooks/useTheme';
import { FONT_SIZES, FONT_STYLES, THEME_COLORS, THEME_MODES } from '../../services/theme';
import CredentialsVault from './CredentialsVault';

const Setting: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, token } = useAuth();
  const { canInstall, isStandalone, isIOS, isAndroid, isMac, isWindows, isTablet, isMobile, detectedCategory, triggerInstall } = usePWA();
  const [activeTab, setActiveTab] = useState<'profile' | 'credentials' | 'security' | 'appearance' | 'app' | 'data'>('profile');
  const [selectedDevice, setSelectedDevice] = useState<DeviceCategory>('desktop');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (detectedCategory) {
      setSelectedDevice(detectedCategory);
    }
  }, [detectedCategory]);

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

  const { settings: uiSettings, updateSettings } = useTheme();

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

  const downloadAppShortcut = () => {
    try {
      const shortcutContent = `[InternetShortcut]\nURL=${window.location.origin}\nIconIndex=0\nIconFile=${window.location.origin}/favicon.ico\n`;
      const blob = new Blob([shortcutContent], { type: 'application/x-mswinurl' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Clientify_App.url`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'App shortcut downloaded! You can pin this to your desktop.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Shortcut download failed.' });
    }
  };

  const handleClearCache = () => {
    try {
      queryClient.clear();
      setMessage({ type: 'success', text: 'Local query cache purged successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Cache purge failed.' });
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 max-w-full mx-auto w-full overflow-hidden pb-10">
      
      <div className="flex items-center gap-2 bg-white p-2 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0 overflow-x-auto no-scrollbar">
         {[
           { id: 'profile', label: 'Firm' },
           { 
             id: 'credentials', 
             label: (
               <span className="flex items-center gap-1.5">
                 <span>🔑</span>
                 <span>Credential Vault</span>
               </span>
             ) 
           },
           { id: 'security', label: 'Security' },
           { id: 'appearance', label: 'UI' },
           { 
             id: 'app', 
             label: (
               <span className="flex items-center gap-1.5">
                 <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                 </svg>
                 Download App
               </span>
             ) 
           },
           { id: 'data', label: 'Data' }
         ].map(tab => (
           <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
             className={`px-4 md:px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shrink-0 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}>
             {tab.label}
           </button>
         ))}
      </div>

      {message && (
        <div className={`mx-auto w-full max-w-4xl p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest text-center animate-in slide-in-from-top-4 duration-300 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-y-auto no-scrollbar p-6 md:p-10">
         {activeTab === 'credentials' && (
           <CredentialsVault onShowMessage={setMessage} />
         )}

         {activeTab === 'profile' && (
           <form onSubmit={handleProfileSave} className="max-w-3xl space-y-8 md:space-y-10 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 pb-8 border-b border-slate-100">
                 <div className="relative group">
                    <div className="h-24 w-24 md:h-32 md:w-32 rounded-[2.5rem] bg-indigo-600 text-white flex items-center justify-center text-4xl md:text-5xl font-black shadow-2xl overflow-hidden ring-8 ring-slate-50">
                       {profileData.avatar ? (
                         <img src={profileData.avatar} alt="DP" className="h-full w-full object-cover" />
                       ) : user?.username?.substring(0,2)}
                    </div>
                    {profileData.avatar && (
                      <button 
                        type="button"
                        onClick={() => {
                          setProfileData({ ...profileData, avatar: null });
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute top-[-10px] right-[-10px] h-10 w-10 bg-white border border-rose-200 rounded-xl shadow-lg flex items-center justify-center text-rose-500 hover:text-rose-700 transition-all hover:scale-110 z-10"
                        title="Remove profile photo"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-[-10px] right-[-10px] h-10 w-10 bg-white border border-slate-200 rounded-xl shadow-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all hover:scale-110"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                 </div>
                 <div className="text-center md:text-left">
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{user?.username}</h3>
                    <p className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mt-1.5">Authorized Practitioner Profile</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Practitioner Name</label>
                    <input required value={profileData.username} onChange={e => setProfileData({...profileData, username: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50" />
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
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Firm GSTIN</label>
                    <input value={profileData.gstn} onChange={e => setProfileData({...profileData, gstn: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 uppercase font-mono" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Contact No</label>
                    <input value={profileData.mobile_no} onChange={e => setProfileData({...profileData, mobile_no: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50" />
                 </div>
              </div>

              <div className="pt-6">
                 <button type="submit" disabled={isLoading} className="w-full md:w-auto bg-indigo-600 text-white font-black uppercase tracking-widest px-12 py-5 rounded-2xl shadow-xl hover:bg-slate-900 transition-all text-xs">
                   {isLoading ? 'Updating Vault...' : 'Commit Firm Profile'}
                 </button>
              </div>
           </form>
         )}

         {activeTab === 'security' && (
           <form onSubmit={handleSecuritySave} className="max-w-2xl space-y-10 animate-in slide-in-from-bottom-4 duration-300">
              <div className="p-6 md:p-8 bg-amber-50 border border-amber-100 rounded-[2.5rem] flex flex-col md:flex-row items-start md:items-center gap-6">
                 <div className="h-12 w-12 bg-amber-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                 </div>
                 <div>
                    <h4 className="text-lg font-black text-amber-900 uppercase tracking-tight leading-none mb-2">Access Rotation</h4>
                    <p className="text-amber-800/70 text-sm font-medium">Updating Master ID or Password will revoke all current sessions.</p>
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
                    <button type="submit" disabled={isLoading} className="w-full md:w-auto bg-slate-900 text-white font-black uppercase tracking-widest px-12 py-5 rounded-2xl shadow-xl hover:bg-indigo-600 transition-all text-xs">
                      Rotate Vault Access
                    </button>
                 </div>
              </div>
           </form>
         )}

         {activeTab === 'app' && (
            <div className="max-w-4xl space-y-8 animate-in slide-in-from-bottom-4 duration-300">
               {/* Header Banner */}
               <section className="bg-slate-900 p-8 md:p-10 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
                  <div className="absolute -top-10 -right-10 h-40 w-40 bg-indigo-500/20 rounded-full blur-3xl" />
                  <div className="relative z-10 space-y-6">
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                           <div className="h-16 w-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0">
                              <svg className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                           </div>
                           <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-2xl font-black uppercase tracking-tight">Install Clientify App</h3>
                              </div>
                              <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mt-1">Cross-Platform Native PWA Experience</p>
                           </div>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0 flex items-center gap-2 bg-white/10 px-4 py-2.5 rounded-2xl border border-white/10 text-[11px] font-black uppercase tracking-wider text-indigo-200">
                           <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                           <span>Detected: {detectedCategory === 'macbook' ? 'MacBook / macOS' : detectedCategory === 'mobile' ? 'Mobile Device' : detectedCategory === 'tablet' ? 'Tablet' : 'Laptop / Desktop'}</span>
                        </div>
                     </div>

                     {/* Main Install Trigger Card */}
                     <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                           <div className="space-y-1 text-center sm:text-left">
                              <p className="text-white text-base font-black">Download & Install Application</p>
                              <p className="text-slate-300 text-xs font-medium">Install Clientify directly onto your home screen or download a launcher shortcut for instant access.</p>
                           </div>
                           <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto shrink-0">
                              {canInstall && (
                                 <button 
                                    onClick={triggerInstall} 
                                    className="flex-1 sm:flex-initial bg-indigo-600 text-white font-black uppercase tracking-widest px-6 py-3.5 rounded-xl shadow-xl hover:bg-white hover:text-slate-900 transition-all text-xs active:scale-95 flex items-center justify-center gap-2"
                                 >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    <span>Install App</span>
                                 </button>
                              )}
                              <button 
                                 onClick={downloadAppShortcut} 
                                 className="flex-1 sm:flex-initial bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black uppercase tracking-widest px-6 py-3.5 rounded-xl transition-all text-xs active:scale-95 flex items-center justify-center gap-2"
                                 title="Download Desktop Launcher Shortcut"
                              >
                                 <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                 <span>Download Shortcut</span>
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
               </section>

               {/* Device Selection Tabs */}
               <section className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                     <div>
                        <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">Installation Guides by Device</h4>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Select your device type for step-by-step setup</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                     {[
                        { 
                          id: 'mobile', 
                          label: 'Mobile', 
                          sub: 'iPhone & Android',
                          icon: (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          )
                        },
                        { 
                          id: 'tablet', 
                          label: 'Tablet', 
                          sub: 'iPad & Android Tab',
                          icon: (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          )
                        },
                        { 
                          id: 'desktop', 
                          label: 'Laptop / PC', 
                          sub: 'Windows / Linux',
                          icon: (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          )
                        },
                        { 
                          id: 'macbook', 
                          label: 'MacBook', 
                          sub: 'macOS & Safari',
                          icon: (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2 2 0 01-2 2H5a2 2 0 01-2-2V5.25a2 2 0 012-2h14a2 2 0 012 2z" />
                            </svg>
                          )
                        }
                     ].map(dev => {
                        const isSelected = selectedDevice === dev.id;
                        const isAutoDetected = detectedCategory === dev.id;
                        return (
                           <button
                              key={dev.id}
                              onClick={() => setSelectedDevice(dev.id as DeviceCategory)}
                              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center relative ${
                                 isSelected 
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-200' 
                                    : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:border-slate-300 hover:bg-slate-100/70'
                              }`}
                           >
                              {isAutoDetected && (
                                 <span className={`absolute -top-2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                    isSelected ? 'bg-amber-400 text-slate-900' : 'bg-indigo-600 text-white'
                                 }`}>
                                    Your Device
                                 </span>
                              )}
                              <div className={`mb-2 ${isSelected ? 'text-white' : 'text-indigo-600'}`}>
                                 {dev.icon}
                              </div>
                              <span className="text-xs font-black uppercase tracking-tight">{dev.label}</span>
                              <span className={`text-[9px] font-bold mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>{dev.sub}</span>
                           </button>
                        );
                     })}
                  </div>

                  {/* Selected Device Step-By-Step Guide */}
                  <div className="bg-slate-50 rounded-[2.5rem] border border-slate-200 p-6 md:p-8 space-y-6">
                     {selectedDevice === 'mobile' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                           <div className="flex items-center gap-3 pb-4 border-b border-slate-200/60">
                              <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">📱</div>
                              <div>
                                 <h5 className="font-black text-slate-900 text-sm uppercase tracking-tight">Mobile Phone Installation (iPhone & Android)</h5>
                                 <p className="text-xs font-medium text-slate-500">Install Clientify as a native app on your mobile home screen</p>
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* iPhone / iOS */}
                              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 space-y-4 shadow-sm">
                                 <div className="flex items-center justify-between">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                       <span className="h-2 w-2 rounded-full bg-slate-900" /> Apple iPhone (iOS)
                                    </span>
                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">Safari</span>
                                 </div>
                                 <ol className="space-y-3 text-xs font-medium text-slate-700 list-decimal pl-4">
                                    <li>Open Clientify in <strong>Safari</strong> browser on your iPhone.</li>
                                    <li>Tap the <strong>Share</strong> button (<svg className="inline w-4 h-4 text-indigo-600 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>) in Safari's bottom toolbar.</li>
                                    <li>Scroll down the menu and select <strong>"Add to Home Screen"</strong>.</li>
                                    <li>Tap <strong>"Add"</strong> in the top right corner to finish.</li>
                                 </ol>
                              </div>

                              {/* Android Phone */}
                              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 space-y-4 shadow-sm">
                                 <div className="flex items-center justify-between">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                       <span className="h-2 w-2 rounded-full bg-emerald-500" /> Android Smartphone
                                    </span>
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Chrome / Edge</span>
                                 </div>
                                 <ol className="space-y-3 text-xs font-medium text-slate-700 list-decimal pl-4">
                                    <li>Tap the <strong>"Install Application Now"</strong> button above if visible.</li>
                                    <li>Or tap the 3-dot menu (<strong>⋮</strong>) in Chrome/Edge top right.</li>
                                    <li>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                                    <li>Confirm by tapping <strong>"Install"</strong> to place on your app grid.</li>
                                 </ol>
                              </div>
                           </div>
                        </div>
                     )}

                     {selectedDevice === 'tablet' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                           <div className="flex items-center gap-3 pb-4 border-b border-slate-200/60">
                              <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">📱</div>
                              <div>
                                 <h5 className="font-black text-slate-900 text-sm uppercase tracking-tight">Tablet Installation (iPad & Android Tabs)</h5>
                                 <p className="text-xs font-medium text-slate-500">Optimized tablet interface with full touch & stylus support</p>
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* iPad */}
                              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 space-y-4 shadow-sm">
                                 <div className="flex items-center justify-between">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                       <span className="h-2 w-2 rounded-full bg-slate-900" /> Apple iPad (iPadOS)
                                    </span>
                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">Safari</span>
                                 </div>
                                 <ol className="space-y-3 text-xs font-medium text-slate-700 list-decimal pl-4">
                                    <li>Open Clientify in <strong>Safari</strong> on your iPad.</li>
                                    <li>Tap the <strong>Share</strong> button (<svg className="inline w-4 h-4 text-indigo-600 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>) near top address bar.</li>
                                    <li>Tap <strong>"Add to Home Screen"</strong> from the options.</li>
                                    <li>Tap <strong>"Add"</strong> to place Clientify on your iPad dock.</li>
                                 </ol>
                              </div>

                              {/* Android Tablet */}
                              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 space-y-4 shadow-sm">
                                 <div className="flex items-center justify-between">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                       <span className="h-2 w-2 rounded-full bg-emerald-500" /> Android Tablet
                                    </span>
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Chrome / Edge</span>
                                 </div>
                                 <ol className="space-y-3 text-xs font-medium text-slate-700 list-decimal pl-4">
                                    <li>Tap the <strong>"Install Application Now"</strong> button above.</li>
                                    <li>Or click the <strong>Install Icon</strong> in the browser URL bar.</li>
                                    <li>Or tap 3-dot menu (<strong>⋮</strong>) -&gt; <strong>"Install app"</strong>.</li>
                                    <li>Launch directly from your Android Tablet app drawer.</li>
                                 </ol>
                              </div>
                           </div>
                        </div>
                     )}

                     {selectedDevice === 'desktop' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                           <div className="flex items-center gap-3 pb-4 border-b border-slate-200/60">
                              <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">💻</div>
                              <div>
                                 <h5 className="font-black text-slate-900 text-sm uppercase tracking-tight">Laptop & PC Installation (Windows / Linux / Chrome OS)</h5>
                                 <p className="text-xs font-medium text-slate-500">Standalone window experience with keyboard shortcuts & Taskbar integration</p>
                              </div>
                           </div>

                           <div className="bg-white rounded-2xl p-5 border border-slate-200/80 space-y-4 shadow-sm">
                              <div className="flex items-center justify-between">
                                 <span className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-blue-600" /> Windows / Linux / Chromebook
                                 </span>
                                 <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">Chrome / Edge / Brave</span>
                              </div>
                              <ol className="space-y-3 text-xs font-medium text-slate-700 list-decimal pl-4">
                                 <li>Click the <strong>"Install Application Now"</strong> button in the banner above.</li>
                                 <li>Or look for the <strong>Install Icon</strong> (<svg className="inline w-4 h-4 text-indigo-600 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4 4m4-4v12" /></svg> or <strong>⊕</strong>) on the right side of your browser address bar.</li>
                                 <li>Alternatively, click Browser Menu (<strong>⋮</strong>) -&gt; <strong>"Save and Share"</strong> -&gt; <strong>"Install Clientify..."</strong>.</li>
                                 <li>Pin the app icon to your <strong>Windows Taskbar</strong> or Linux dock for instant launch!</li>
                              </ol>
                           </div>
                        </div>
                     )}

                     {selectedDevice === 'macbook' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                           <div className="flex items-center gap-3 pb-4 border-b border-slate-200/60">
                              <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">💻</div>
                              <div>
                                 <h5 className="font-black text-slate-900 text-sm uppercase tracking-tight">MacBook & macOS Installation (MacBook Air / Pro / iMac)</h5>
                                 <p className="text-xs font-medium text-slate-500">Native Mac Dock app with dedicated window & macOS Launchpad support</p>
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* macOS Safari */}
                              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 space-y-4 shadow-sm">
                                 <div className="flex items-center justify-between">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                       <span className="h-2 w-2 rounded-full bg-slate-900" /> macOS Safari (Sonoma+)
                                    </span>
                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">Safari 17+</span>
                                 </div>
                                 <ol className="space-y-3 text-xs font-medium text-slate-700 list-decimal pl-4">
                                    <li>Open Clientify in <strong>Safari</strong> on your MacBook.</li>
                                    <li>Click <strong>File</strong> in the top Mac menu bar -&gt; select <strong>"Add to Dock..."</strong>.</li>
                                    <li>Or click the <strong>Share</strong> button in Safari toolbar -&gt; <strong>"Add to Dock"</strong>.</li>
                                    <li>Click <strong>Add</strong> to create a dedicated Mac App in your Dock & Launchpad.</li>
                                 </ol>
                              </div>

                              {/* macOS Chrome */}
                              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 space-y-4 shadow-sm">
                                 <div className="flex items-center justify-between">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                       <span className="h-2 w-2 rounded-full bg-blue-600" /> macOS Chrome / Edge
                                    </span>
                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">Chrome / Edge</span>
                                 </div>
                                 <ol className="space-y-3 text-xs font-medium text-slate-700 list-decimal pl-4">
                                    <li>Click <strong>"Install Application Now"</strong> button above.</li>
                                    <li>Or click the <strong>Install Icon</strong> in Chrome's address bar.</li>
                                    <li>Or Chrome Menu (<strong>⋮</strong>) -&gt; <strong>"Save and Share"</strong> -&gt; <strong>"Install Clientify..."</strong>.</li>
                                    <li>Open anytime directly from <strong>Mac Applications</strong> or Launchpad!</li>
                                 </ol>
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               </section>

               {/* App Capabilities Grid */}
               <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/70 space-y-2">
                     <div className="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">⚡</div>
                     <h6 className="font-black text-slate-900 text-xs uppercase tracking-tight">Offline Resilience</h6>
                     <p className="text-[11px] text-slate-500 font-medium">Full offline support for client records, ledger, and tax filing lists.</p>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/70 space-y-2">
                     <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">🖥️</div>
                     <h6 className="font-black text-slate-900 text-xs uppercase tracking-tight">Dedicated Window</h6>
                     <p className="text-[11px] text-slate-500 font-medium">Runs in clean standalone mode without browser tabs or address bar clutter.</p>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/70 space-y-2">
                     <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-sm">🔒</div>
                     <h6 className="font-black text-slate-900 text-xs uppercase tracking-tight">Instant Vault Access</h6>
                     <p className="text-[11px] text-slate-500 font-medium">Fast 1-tap app launch directly from your Home Screen, Dock, or Taskbar.</p>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/70 space-y-2">
                     <div className="h-9 w-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">🔄</div>
                     <h6 className="font-black text-slate-900 text-xs uppercase tracking-tight">Auto Sync</h6>
                     <p className="text-[11px] text-slate-500 font-medium">Automatic cloud sync in background whenever device goes online.</p>
                  </div>
               </section>

               <section className="bg-rose-50/60 p-6 md:p-10 rounded-[3rem] border border-rose-100/80">
                  <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
                     <div className="h-14 w-14 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></div>
                     <div className="text-center md:text-left">
                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Purge Local Query Cache</h4>
                        <p className="text-slate-500 text-sm font-medium">Manually clear local client data cache if experiencing synchronization issues.</p>
                     </div>
                  </div>
                  <button onClick={handleClearCache} className="w-full bg-white border-2 border-rose-600 text-rose-600 font-black uppercase tracking-widest py-5 rounded-2xl shadow-xl shadow-rose-100 hover:bg-rose-600 hover:text-white transition-all text-xs">
                     Purge Cache (queryClient.clear)
                  </button>
               </section>
            </div>
         )}

         {activeTab === 'appearance' && (
           <div className="max-w-4xl space-y-10 animate-in slide-in-from-bottom-4 duration-300">
              {/* App Accent Color Section */}
              <section className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                 <div>
                   <h4 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2">
                     <span className="h-3 w-3 rounded-full bg-indigo-600 inline-block" />
                     App Theme Accent Color
                   </h4>
                   <p className="text-xs font-medium text-slate-500 mt-1">Select the primary theme color applied across buttons, badges, navigation, and active indicators across the whole app.</p>
                 </div>
                 
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                   {THEME_COLORS.map(col => (
                     <button
                       key={col.id}
                       onClick={() => updateSettings({ themeColor: col.id as any })}
                       className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all ${
                         uiSettings.themeColor === col.id ? 'border-slate-900 bg-slate-50 shadow-md ring-2 ring-slate-900/10' : 'border-slate-100 hover:border-slate-200 bg-white'
                       }`}
                     >
                       <span className="h-7 w-7 rounded-full shadow-inner shrink-0 ring-2 ring-white" style={{ backgroundColor: col.primary }} />
                       <div className="text-left min-w-0">
                         <p className="text-xs font-black text-slate-900 truncate">{col.name}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{col.id}</p>
                       </div>
                     </button>
                   ))}
                 </div>
              </section>

              {/* Font Size Scaling Section */}
              <section className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                 <div>
                   <h4 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2">
                     <span className="text-sm">🔤</span>
                     Global Font Size Options
                   </h4>
                   <p className="text-xs font-medium text-slate-500 mt-1">Scale interface typography across all tables, forms, modals, sidebars, and headings.</p>
                 </div>

                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                   {FONT_SIZES.map(sz => (
                     <button
                       key={sz.value}
                       onClick={() => updateSettings({ fontSize: sz.value })}
                       className={`flex flex-col p-4 rounded-2xl border-2 text-left transition-all ${
                         uiSettings.fontSize === sz.value ? 'border-indigo-600 bg-indigo-50/70 shadow-md ring-2 ring-indigo-600/10' : 'border-slate-100 hover:border-slate-200 bg-white'
                       }`}
                     >
                       <div className="flex items-center justify-between mb-2">
                         <span className="text-xs font-black uppercase tracking-wider text-slate-900">{sz.label}</span>
                         <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{sz.value}px</span>
                       </div>
                       <span className="font-black text-slate-900 my-1 truncate" style={{ fontSize: `${Math.min(sz.value, 18)}px` }}>Aa Bb 123</span>
                       <span className="text-[10px] font-medium text-slate-400 truncate">{sz.desc.split('•')[1] || sz.desc}</span>
                     </button>
                   ))}
                 </div>
              </section>

              {/* Typography Style Section */}
              <section className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                 <div>
                   <h4 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2">
                     <span className="text-sm">✒️</span>
                     Global Typography Font Style
                   </h4>
                   <p className="text-xs font-medium text-slate-500 mt-1">Select your preferred typeface family applied globally across all screens and documents.</p>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                   {FONT_STYLES.map(sty => (
                     <button
                       key={sty.id}
                       onClick={() => updateSettings({ fontStyle: sty.id as any })}
                       className={`p-5 rounded-2xl border-2 text-left transition-all ${sty.fontClass} ${
                         uiSettings.fontStyle === sty.id ? 'border-indigo-600 bg-indigo-50/70 shadow-md ring-2 ring-indigo-600/10' : 'border-slate-100 hover:border-slate-200 bg-white'
                       }`}
                     >
                       <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block mb-1">{sty.name}</span>
                       <span className="text-base font-bold text-slate-900 block my-1">{sty.sample}</span>
                       <span className="text-[10px] text-slate-400 font-mono block mt-2 truncate">{sty.family}</span>
                     </button>
                   ))}
                 </div>
              </section>

              {/* Theme Mode Section */}
              <section className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                 <div>
                   <h4 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2">
                     <span className="text-sm">🎨</span>
                     Interface Surface Mode
                   </h4>
                   <p className="text-xs font-medium text-slate-500 mt-1">Select contrast canvas mode for optimal reading comfort.</p>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                   {THEME_MODES.map(m => (
                     <button
                       key={m.id}
                       onClick={() => updateSettings({ themeMode: m.id as any })}
                       className={`p-5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                         uiSettings.themeMode === m.id ? 'border-slate-900 bg-slate-900 text-white shadow-xl' : 'border-slate-100 hover:border-slate-200 bg-slate-50 text-slate-900'
                       }`}
                     >
                       <div>
                         <span className="text-xs font-black uppercase tracking-widest block mb-1">{m.name}</span>
                         <p className={`text-[11px] font-medium ${uiSettings.themeMode === m.id ? 'text-slate-300' : 'text-slate-500'}`}>{m.desc}</p>
                       </div>
                       <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200/20">
                         <span className="h-4 w-4 rounded-full border border-current shrink-0" style={{ backgroundColor: m.bg }} />
                         <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{m.id} mode</span>
                       </div>
                     </button>
                   ))}
                 </div>
              </section>
           </div>
         )}

         {activeTab === 'data' && (
           <div className="max-w-2xl space-y-12 animate-in slide-in-from-bottom-4 duration-300">
              <section className="bg-slate-50 p-6 md:p-10 rounded-[3rem] border border-slate-100">
                 <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
                    <div className="h-14 w-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" /></svg></div>
                    <div className="text-center md:text-left">
                       <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Vault Snapshot</h4>
                       <p className="text-slate-500 text-sm font-medium">Export encrypted JSON backup of your practice data.</p>
                    </div>
                 </div>
                 <button onClick={triggerBackup} className="w-full bg-white border-2 border-indigo-600 text-indigo-600 font-black uppercase tracking-widest py-5 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-600 hover:text-white transition-all text-xs">
                    Download Master Backup
                 </button>
              </section>

              <section className="bg-slate-900 p-6 md:p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/10 blur-3xl rounded-full" />
                 <div className="flex flex-col md:flex-row items-center gap-6 mb-8 relative z-10">
                    <div className="h-14 w-14 bg-white/10 text-white rounded-2xl flex items-center justify-center"><svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4 4m4-4v4" /></svg></div>
                    <div className="text-center md:text-left">
                       <h4 className="text-xl font-black text-white uppercase tracking-tight">Restore Archive</h4>
                       <p className="text-slate-400 text-sm font-medium">Inject data from backup into this vault.</p>
                    </div>
                 </div>
                 <button onClick={() => restoreInputRef.current?.click()} className="w-full bg-indigo-600 text-white font-black uppercase tracking-widest py-5 rounded-2xl shadow-xl hover:bg-white hover:text-slate-900 transition-all text-xs relative z-10">
                    Select Restore File
                 </button>
                 <input type="file" ref={restoreInputRef} onChange={handleRestore} className="hidden" accept=".json" />
              </section>

              <section className="bg-rose-50/60 p-6 md:p-10 rounded-[3rem] border border-rose-100/80">
                 <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
                    <div className="h-14 w-14 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></div>
                    <div className="text-center md:text-left">
                       <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Purge Local Query Cache</h4>
                       <p className="text-slate-500 text-sm font-medium">Manually clear local client data cache if experiencing synchronization issues.</p>
                    </div>
                 </div>
                 <button onClick={handleClearCache} className="w-full bg-white border-2 border-rose-600 text-rose-600 font-black uppercase tracking-widest py-5 rounded-2xl shadow-xl shadow-rose-100 hover:bg-rose-600 hover:text-white transition-all text-xs">
                    Purge Cache (queryClient.clear)
                 </button>
              </section>
           </div>
         )}
      </div>
    </div>
  );
};

export default Setting;
