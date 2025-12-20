
import React from 'react';

interface OfflineBannerProps {
  isOnline: boolean;
}

const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline }) => {
  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[100] -translate-x-1/2 animate-bounce">
      <div className="flex items-center gap-3 rounded-full bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-2xl shadow-red-500/40 border border-red-400/30 backdrop-blur-md">
        <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
        <span>You are currently offline. Viewing cached data.</span>
      </div>
    </div>
  );
};

export default OfflineBanner;
