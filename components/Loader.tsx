
import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-950">
      <div className="relative h-20 w-20">
        <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20"></div>
        <div className="relative flex h-full w-full items-center justify-center rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin"></div>
      </div>
    </div>
  );
};

export default Loader;
