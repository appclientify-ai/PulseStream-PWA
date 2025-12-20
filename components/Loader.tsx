
import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-950 animate-in fade-in duration-500">
      <div className="relative h-24 w-24">
        <div className="absolute inset-0 animate-ping rounded-full bg-indigo-500/20"></div>
        <div className="relative flex h-full w-full items-center justify-center rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin shadow-[0_0_15px_rgba(99,102,241,0.3)]">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>
      <div className="mt-8 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Syncing Clientify</p>
        <div className="mt-2 flex justify-center gap-1">
          <div className="h-1 w-1 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
          <div className="h-1 w-1 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
          <div className="h-1 w-1 rounded-full bg-indigo-500 animate-bounce" />
        </div>
      </div>
    </div>
  );
};

export default Loader;
