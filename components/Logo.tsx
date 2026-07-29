import React, { useState } from 'react';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

export const ClientifyLogo: React.FC<LogoProps> = ({
  size = 'md',
  showText = false,
  className = '',
  textClassName = '',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const sizeClasses = {
    xs: 'h-6 w-6 rounded-lg',
    sm: 'h-8 w-8 rounded-xl',
    md: 'h-10 w-10 rounded-xl',
    lg: 'h-12 w-12 rounded-2xl',
    xl: 'h-16 w-16 rounded-2xl',
    '2xl': 'h-16 w-16 md:h-24 md:w-24 rounded-2xl md:rounded-[2rem]',
  }[size];

  const textSizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl',
    '2xl': 'text-5xl md:text-7xl',
  }[size];

  return (
    <div className={`inline-flex items-center gap-3 shrink-0 ${className}`}>
      <div className={`relative ${sizeClasses} overflow-hidden shadow-md shadow-indigo-600/20 group/logo transition-transform duration-300 hover:scale-105 shrink-0 bg-indigo-600`}>
        {!imgFailed ? (
          <img
            src="/icon.png"
            alt="Clientify Logo"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 flex items-center justify-center p-1.5">
            <svg viewBox="0 0 512 512" className="w-full h-full text-white fill-current">
              <path d="M 256 128 C 180 128, 128 180, 128 256 C 128 332, 180 384, 256 384 C 316 384, 360 348, 376 296 L 308 296 C 298 320, 280 332, 256 332 C 214 332, 180 298, 180 256 C 180 214, 214 180, 256 180 C 280 180, 298 192, 308 216 L 376 216 C 360 164, 316 128, 256 128 Z" fill="#ffffff" />
              <circle cx="360" cy="256" r="28" fill="#38bdf8" />
            </svg>
          </div>
        )}
      </div>

      {showText && (
        <span className={`font-black text-slate-900 tracking-tight leading-none ${textSizes} ${textClassName}`}>
          Client<span className="text-indigo-600">ify</span>
        </span>
      )}
    </div>
  );
};

export default ClientifyLogo;
