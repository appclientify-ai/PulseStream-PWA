import React from 'react';

interface InstallBannerProps {
  onInstall: () => void;
}

const InstallBanner: React.FC<InstallBannerProps> = ({ onInstall }) => {
  return (
    <div className="mb-8 flex flex-col md:flex-row items-center justify-between rounded-[2rem] bg-indigo-600 p-6 shadow-xl shadow-indigo-200 md:p-8 animate-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-6 mb-4 md:mb-0">
        <div className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md sm:flex shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>
        <div>
          <h4 className="text-xl font-black text-white uppercase tracking-tight leading-none">Enable Vault Offline</h4>
          <p className="text-sm font-medium text-indigo-100 mt-2">Install Clientify on your home screen for high-speed, dedicated access.</p>
        </div>
      </div>
      <button 
        onClick={onInstall}
        className="w-full md:w-auto rounded-xl bg-white px-10 py-4 text-xs font-black text-indigo-600 uppercase tracking-widest shadow-lg transition-all hover:bg-slate-900 hover:text-white active:scale-95"
      >
        Install Native App
      </button>
    </div>
  );
};

export default InstallBanner;