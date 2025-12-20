
import React from 'react';

interface InstallBannerProps {
  onInstall: () => void;
}

const InstallBanner: React.FC<InstallBannerProps> = ({ onInstall }) => {
  return (
    <div className="mb-6 flex items-center justify-between rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 shadow-xl shadow-blue-500/20 md:p-6">
      <div className="flex items-center gap-4">
        <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md sm:flex">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>
        <div>
          <h4 className="text-lg font-bold text-white">Install PulseStream</h4>
          <p className="text-sm text-blue-100">Add to your home screen for a seamless desktop experience.</p>
        </div>
      </div>
      <button 
        onClick={onInstall}
        className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-blue-600 shadow-lg transition-all hover:bg-blue-50 active:scale-95"
      >
        Install Now
      </button>
    </div>
  );
};

export default InstallBanner;
