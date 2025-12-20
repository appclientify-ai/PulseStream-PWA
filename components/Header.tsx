
import React from 'react';
import { User } from '../types';

interface HeaderProps {
  isConnected: boolean;
  currentUser: User | null;
}

const Header: React.FC<HeaderProps> = ({ isConnected, currentUser }) => {
  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/30 px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857" />
          </svg>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Client<span className="text-indigo-500">ify</span>
        </h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="hidden text-sm font-medium text-slate-400 sm:inline">
            {isConnected ? 'Portal Online' : 'Connecting...'}
          </span>
        </div>

        <div className="h-4 w-px bg-slate-800" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-200">{currentUser?.username}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Consultant</p>
          </div>
          <button className="h-9 w-9 rounded-full bg-slate-800 p-1 ring-1 ring-slate-700 transition-hover hover:ring-indigo-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;