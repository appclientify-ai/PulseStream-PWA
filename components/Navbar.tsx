
import React from 'react';

interface NavbarProps {
  onLoginClick: () => void;
  onHomeClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLoginClick, onHomeClick }) => {
  return (
    <nav className="fixed top-0 z-50 w-full bg-white/80 px-6 py-5 backdrop-blur-xl border-b border-slate-100">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <button onClick={onHomeClick} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <span className="text-2xl font-black text-slate-900 tracking-tight">Client<span className="text-indigo-600">ify</span></span>
        </button>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={onLoginClick} 
            className="rounded-full bg-slate-900 px-8 py-3 text-sm font-black text-white transition-all hover:bg-indigo-600 shadow-lg hover:shadow-indigo-500/20 active:scale-95"
          >
            Consultant Login
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
