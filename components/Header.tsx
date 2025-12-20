
import React from 'react';
import { User } from '../types';

interface HeaderProps {
  isConnected: boolean;
  currentUser: User | null;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ isConnected, currentUser, onMenuClick }) => {
  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/30 px-4 md:px-6 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          aria-label="Toggle Menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Client<span className="text-indigo-500">ify</span>
        </h1>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="hidden text-[10px] font-bold uppercase tracking-widest text-slate-500 sm:inline">
            {isConnected ? 'Sync Active' : 'Offline'}
          </span>
        </div>

        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-200">{currentUser?.username}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Consultant</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white ring-2 ring-slate-800 shadow-lg">
            {currentUser?.username?.substring(0, 2).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
