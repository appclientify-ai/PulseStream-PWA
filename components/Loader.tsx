
import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 animate-in fade-in duration-500">
      <div className="relative h-32 w-32">
        <div className="absolute inset-0 animate-ping rounded-full bg-indigo-200/50"></div>
        <div className="relative flex h-full w-full items-center justify-center rounded-[2.5rem] bg-white border-4 border-slate-100 border-t-indigo-600 animate-spin shadow-2xl shadow-indigo-100">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>
      <div className="mt-12 text-center">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Syncing Clientify</h3>
        <p className="mt-3 text-sm font-black uppercase tracking-[0.3em] text-slate-400">Authenticating Credentials</p>
        <div className="mt-6 flex justify-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.3s]" />
          <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.15s]" />
          <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-bounce" />
        </div>
      </div>
    </div>
  );
};

export default Loader;
