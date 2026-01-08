import React from 'react';

interface NavbarProps {
  onLoginClick: () => void;
  onHomeClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLoginClick, onHomeClick }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] w-full bg-white/70 px-6 md:px-12 py-6 backdrop-blur-2xl border-b border-slate-100">
      <div className="max-w-7xl mx-auto flex w-full items-center justify-between">
        <button onClick={onHomeClick} className="flex items-center gap-4 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-100 transition-transform group-hover:scale-105 group-hover:rotate-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="text-left">
            <span className="text-2xl font-black text-slate-900 tracking-tighter block leading-none">Client<span className="text-indigo-600">ify</span></span>
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1 block">Legal Tech Vault</span>
          </div>
        </button>
        
        <div className="flex items-center gap-8">
          <div className="hidden lg:flex items-center gap-8 border-r border-slate-100 pr-8 mr-2">
             <button onClick={onHomeClick} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">Platform</button>
             <button onClick={onHomeClick} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">Security</button>
             <button onClick={onHomeClick} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">Pricing</button>
          </div>
          <button 
            onClick={onLoginClick} 
            className="rounded-xl bg-slate-900 px-8 py-3.5 text-xs font-black text-white transition-all hover:bg-indigo-600 hover:-translate-y-0.5 shadow-lg shadow-slate-200 hover:shadow-indigo-100 active:scale-95 whitespace-nowrap uppercase tracking-widest"
          >
            Consultant Login
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;