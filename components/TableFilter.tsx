import React, { useState, useRef, useEffect, ReactNode } from 'react';

interface TableFilterProps {
  label: ReactNode;
  isActive?: boolean;
  onOpen?: () => void;
  children: ReactNode;
}

export const TableFilter: React.FC<TableFilterProps> = ({ label, isActive, onOpen, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpen) onOpen();
    if (!isOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 4, left: rect.left });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const close = () => setIsOpen(false);
    if (isOpen) {
      document.addEventListener('mousedown', close);
      window.addEventListener('scroll', close, true);
    }
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [isOpen]);

  return (
    <>
      <div className="flex items-center gap-1">
        {label}
        <button ref={btnRef} onClick={handleToggle} className={`p-1 rounded transition-colors ${isActive ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-200'}`}>
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
        </button>
      </div>
      {isOpen && (
        <div 
          style={{ top: coords.top, left: coords.left }} 
          className="fixed bg-white border border-slate-200 rounded-[1rem] shadow-xl z-[9999] p-1 animate-in zoom-in-95 origin-top text-left min-w-[120px] flex flex-col gap-1"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </>
  );
}
