import React from 'react';

interface OfflineBannerProps {
  isOnline: boolean;
}

const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline }) => {
  if (isOnline) return null;

  return (
    <div className="fixed top-6 left-1/2 z-[200] -translate-x-1/2 animate-in slide-in-from-top-4 duration-300">
      <div className="flex items-center gap-4 rounded-2xl bg-slate-900 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-2">
           <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
           <span className="text-red-400">Sync Disabled</span>
        </div>
        <div className="h-4 w-[1px] bg-slate-700" />
        <span className="text-slate-400">Vault Local Snapshot Active</span>
      </div>
    </div>
  );
};

export default OfflineBanner;