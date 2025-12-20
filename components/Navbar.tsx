
import React from 'react';

interface NavbarProps {
  onLoginClick: () => void;
  onHomeClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLoginClick, onHomeClick }) => {
  return (
    <nav className="fixed top-0 z-50 w-full bg-slate-950/50 px-6 py-4 backdrop-blur-lg border-b border-slate-800">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <button onClick={onHomeClick} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-lg shadow-indigo-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Client<span className="text-indigo-500">ify</span></span>
        </button>
        
        <div className="flex items-center gap-6">
          <button onClick={onHomeClick} className="text-sm font-medium text-slate-300 hover:text-white">Services</button>
          <button onClick={onLoginClick} className="rounded-full bg-indigo-600 px-6 py-2 text-sm font-bold text-white transition-all hover:bg-indigo-500 shadow-lg shadow-indigo-500/20">
            Log In
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;