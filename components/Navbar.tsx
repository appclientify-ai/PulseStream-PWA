
import React from 'react';

interface NavbarProps {
  onLoginClick: () => void;
  onHomeClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLoginClick, onHomeClick }) => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      onHomeClick();
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] w-full bg-white/70 px-6 md:px-12 py-6 backdrop-blur-2xl border-b border-slate-100">
      <div className="max-w-7xl mx-auto flex w-full items-center justify-between">
        <button onClick={onHomeClick} className="flex items-center gap-3.5 group text-left">
          <div className="relative flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full bg-indigo-600 text-white font-black overflow-hidden border border-slate-200 shadow-sm shrink-0 transition-transform group-hover:scale-105">
            <img 
              src="/icon.png" 
              alt="Clientify Logo" 
              className="relative z-10 h-full w-full object-cover rounded-full" 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.dataset.triedIcon) {
                  target.dataset.triedIcon = 'true';
                  target.src = '/icon.svg';
                } else {
                  target.style.display = 'none';
                }
              }}
            />
            <span className="absolute z-0 text-lg font-black text-white">C</span>
          </div>
          <div className="text-left">
            <span className="text-2xl font-black text-slate-900 tracking-tighter block leading-none">Client<span className="text-indigo-600">ify</span></span>
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1 block">Legal Tech Vault</span>
          </div>
        </button>
        
        <div className="flex items-center gap-8">
          <div className="hidden lg:flex items-center gap-8 border-r border-slate-100 pr-8 mr-2">
             <button onClick={() => scrollToSection('platform')} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">Platform</button>
             <button onClick={() => scrollToSection('security')} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">Security</button>
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
