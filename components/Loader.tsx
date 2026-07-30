
import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center">
        {/* Soft glowing ambient aura behind logo */}
        <div className="absolute -inset-6 rounded-full bg-indigo-500/25 blur-2xl animate-pulse" />
        <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 opacity-50 blur-lg animate-pulse" />
        
        {/* Logo container with light dimming and glowing pulse */}
        <div className="relative flex h-24 w-24 md:h-28 md:w-28 items-center justify-center rounded-full bg-white p-2.5 border border-indigo-100 shadow-2xl shadow-indigo-500/20 overflow-hidden">
          <img 
            src="/icon.png" 
            alt="Clientify Logo" 
            className="h-full w-full rounded-full object-cover animate-pulse transition-opacity duration-1000"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.dataset.triedIcon) {
                target.dataset.triedIcon = 'true';
                target.src = '/icon.svg';
              } else {
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `<span class="text-3xl font-black text-indigo-600 animate-pulse">C</span>`;
                }
              }
            }}
          />
        </div>
      </div>
      <div className="mt-8 text-center">
        <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Syncing Clientify</h3>
        <p className="mt-2 text-xs md:text-sm font-black uppercase tracking-[0.3em] text-indigo-600/80 animate-pulse">Authenticating & Loading Data</p>
        <div className="mt-4 flex justify-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.3s]" />
          <div className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
          <div className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" />
        </div>
      </div>
    </div>
  );
};

export default Loader;
