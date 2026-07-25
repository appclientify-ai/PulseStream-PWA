
import React, { useState } from 'react';
import { User, ActiveView } from '../types';
import { useAuth } from '../auth/AuthContext';
import { usePWA } from '../hooks/usePWA';

interface HeaderProps {
  isConnected: boolean;
  currentUser: User | null;
  onMenuClick: () => void;
  activeViewLabel: string;
  activeViewDescription: string;
  onViewChange: (view: ActiveView) => void;
}

const Header: React.FC<HeaderProps> = ({ isConnected, currentUser, onMenuClick, activeViewLabel, activeViewDescription, onViewChange }) => {
  const { logout } = useAuth();
  const { canInstall, triggerInstall } = usePWA();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="flex h-16 md:h-20 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-4 md:px-6 backdrop-blur-md sticky top-0 z-[9999]">
      <div className="flex items-center gap-3 md:gap-6 flex-1 min-w-0">
        <button 
          onClick={onMenuClick} 
          className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl md:rounded-2xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors border border-slate-100 shadow-sm"
          aria-label="Toggle Menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div className="h-6 md:h-8 w-[1px] bg-slate-200 hidden sm:block" />

        <div className="min-w-0 flex-1">
           <div className="flex items-center gap-2 overflow-hidden">
             <h2 className="text-base md:text-xl font-black text-slate-900 tracking-tight leading-none truncate shrink-0 uppercase">{activeViewLabel}</h2>
             <span className="text-sm font-bold text-slate-300 shrink-0">|</span>
             <span className="text-base md:text-xl font-black text-indigo-600 tracking-tight shrink-0">Clientify</span>
           </div>
           <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-slate-400 truncate mt-1.5 hidden sm:block" title={activeViewDescription}>
             {activeViewDescription}
           </p>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6 shrink-0">
        {canInstall && (
          <button onClick={triggerInstall} className="sm:hidden flex items-center justify-center h-10 w-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-md shadow-indigo-600/20" title="Install App">
             <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          </button>
        )}
        {canInstall && (
          <button onClick={triggerInstall} className="hidden sm:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-widest transition-colors shadow-md shadow-indigo-600/20">
             <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
             App
          </button>
        )}
        <div className="hidden lg:flex items-center gap-3 rounded-full bg-slate-50 px-4 py-2 border border-slate-100">
           <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isConnected ? 'Vault Live' : 'Local Snapshot'}</span>
        </div>

        <div className="relative">
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 md:gap-4 group hover:bg-slate-50 p-1 rounded-2xl transition-all"
          >
            <div className="text-right hidden md:block">
              <p className="text-sm font-black text-slate-900 leading-none">{currentUser?.username}</p>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1 truncate max-w-[120px]">{currentUser?.firm_name || 'Practitioner'}</p>
            </div>
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt="DP" className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl object-cover shadow-lg ring-2 ring-slate-50" />
            ) : (
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-indigo-600 flex items-center justify-center text-sm md:text-lg font-black text-white shadow-lg ring-2 ring-slate-50">
                {currentUser?.username?.substring(0, 2).toUpperCase()}
              </div>
            )}
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl p-2 animate-in zoom-in-95 duration-200 origin-top-right z-[10000]">
               <div className="p-3 border-b border-slate-100 mb-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vault Session ID</p>
                  <p className="text-xs font-black text-slate-900 truncate">{currentUser?.user_id}</p>
               </div>
               <button 
                 onClick={() => { onViewChange('settings'); setIsProfileOpen(false); }}
                 className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 transition-all font-black text-xs uppercase tracking-widest"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                 </svg>
                 Firm Settings
               </button>
               <button 
                 onClick={logout}
                 className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all font-black text-xs uppercase tracking-widest"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                 </svg>
                 Exit Vault
               </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
