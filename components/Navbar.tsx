
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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Pulse<span className="text-blue-500">Stream</span></span>
        </button>
        
        <div className="flex items-center gap-6">
          <button onClick={onHomeClick} className="text-sm font-medium text-slate-300 hover:text-white">Features</button>
          <button onClick={onLoginClick} className="rounded-full bg-blue-600 px-6 py-2 text-sm font-bold text-white transition-all hover:bg-blue-500 shadow-lg shadow-blue-500/20">
            Log In
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
