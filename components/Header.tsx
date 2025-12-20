
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
        <div className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Pulse<span className="text-blue-500">Stream</span>
        </h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="hidden text-sm font-medium text-slate-400 sm:inline">
            {isConnected ? 'Network Connected' : 'Connecting...'}
          </span>
        </div>

        <div className="h-4 w-px bg-slate-800" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-200">{currentUser?.username}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Admin</p>
          </div>
          <button className="h-9 w-9 rounded-full bg-slate-800 p-1 ring-1 ring-slate-700 transition-hover hover:ring-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
