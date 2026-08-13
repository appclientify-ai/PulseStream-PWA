import React from 'react';

export interface ViewControlProps {
  viewMode: 'table' | 'grid';
  onViewChange: (mode: 'table' | 'grid') => void;
  compactMode?: boolean;
  onCompactToggle?: () => void;
  extraActions?: React.ReactNode;
  className?: string;
}

export const ViewControl: React.FC<ViewControlProps> = ({
  viewMode,
  onViewChange,
  compactMode,
  onCompactToggle,
  extraActions,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 ${className}`}>
      {/* Table View Button */}
      <button
        type="button"
        onClick={() => onViewChange('table')}
        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
          viewMode === 'table'
            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
        }`}
        title="Switch to Table View"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        <span>Table</span>
      </button>

      {/* Grid View Button */}
      <button
        type="button"
        onClick={() => onViewChange('grid')}
        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
          viewMode === 'grid'
            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
        }`}
        title="Switch to Grid View"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <span>Grid</span>
      </button>

      {/* Compact Density Toggle Button if provided */}
      {onCompactToggle !== undefined && (
        <button
          type="button"
          onClick={onCompactToggle}
          className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 border ${
            compactMode
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
          }`}
          title="Toggle Compact Data Density"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8h16M4 16h16" />
          </svg>
          <span className="hidden sm:inline">Compact</span>
        </button>
      )}

      {extraActions}
    </div>
  );
};

export default ViewControl;
