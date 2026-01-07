import React from 'react';
import { User } from '../types';

interface HeaderProps {
  isConnected: boolean;
  currentUser: User | null;
  onMenuClick: () => void;
  activeViewLabel: string;
  activeViewDescription: string;
}

const Header: React.FC<HeaderProps> = ({ isConnected, currentUser, onMenuClick, activeViewLabel, activeViewDescription }) => {
  return (
    <header className="flex h-20 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-6 flex-1 min-w-0">
        <button 
          onClick={onMenuClick} 
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors border border-slate-100 shadow-sm"
          aria-label="Toggle Menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div className="h-8 w-[1px] bg-slate-200 hidden md:block" />

        <div className="min-w-0 flex-1">
           <div className="flex items-baseline gap-2 overflow-hidden">
             <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none truncate shrink-0">{activeViewLabel}</h2>
             <span className="text-xs font-bold text-slate-400 shrink-0 hidden sm:inline">|</span>
             <div className="hidden sm:flex items-baseline gap-1.5 truncate">
                <span className="text-xl font-black text-indigo-600 tracking-tight">Clientify</span>
                <span className="text-sm font-semibold text-slate-500 tracking-normal ml-0.5">Secure Your Client Vault.</span>
             </div>
           </div>
           <p className="text-sm font-medium text-slate-500 truncate mt-1" title={activeViewDescription}>
             {activeViewDescription}
           </p>
        </div>
      </div>

      <div className="flex items-center gap-6 shrink-0">
        <div className="hidden lg:flex items-center gap-3 rounded-full bg-slate-50 px-4 py-2 border border-slate-100">
           <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isConnected ? 'Cloud Sync Active' : 'Offline Mode'}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-slate-900 leading-none">{currentUser?.username}</p>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">Authorized User</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-lg font-black text-white shadow-lg ring-4 ring-slate-50">
            {currentUser?.username?.substring(0, 2).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;