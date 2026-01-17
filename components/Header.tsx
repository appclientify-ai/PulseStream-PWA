
import React from 'react';
import { User, ActiveView } from '../types';

interface HeaderProps {
  isConnected: boolean;
  currentUser: User | null;
  onMenuClick: () => void;
  activeViewLabel: string;
  activeViewDescription: string;
  onViewChange: (view: ActiveView) => void;
}

const Header: React.FC<HeaderProps> = ({ isConnected, currentUser, onMenuClick, activeViewLabel, onViewChange }) => {
  return (
    <header className="flex h-20 w-full items-center justify-between border-b border-slate-100 bg-white px-6 sticky top-0 z-30">
      <div className="flex items-center gap-6 flex-1 min-w-0">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase truncate shrink-0">
          {activeViewLabel === 'dashboard' ? 'Dashboard' : activeViewLabel.replace(/-/g, ' ')}
        </h1>
        
        <div className="relative max-w-md w-full hidden md:block">
           <input 
             type="text" 
             placeholder="Search..." 
             className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 font-medium text-sm text-slate-900 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
           />
           <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
           <div className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-black text-slate-400">⌘K</div>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <button className="h-10 px-4 bg-indigo-50 text-indigo-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
           Live Vault
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
           <div className="text-right">
              <p className="text-sm font-black text-slate-900 leading-none">{currentUser?.username}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Practitioner</p>
           </div>
           <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black">
              {currentUser?.username?.substring(0, 1).toUpperCase()}
           </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
