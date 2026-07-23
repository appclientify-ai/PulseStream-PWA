import React from 'react';
import { ActiveView } from '../types';

interface MobileBottomNavProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  onToggleSidebar: () => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  onViewChange,
  onToggleSidebar
}) => {
  const isDashboard = activeView === 'dashboard';
  const isGst = activeView.startsWith('gst') || activeView.startsWith('compliance-m') || activeView.startsWith('compliance-q') || activeView.startsWith('compliance-c');
  const isIt = activeView.startsWith('it') || activeView.startsWith('compliance-itr') || activeView.startsWith('compliance-tax');
  const isBilling = activeView.startsWith('admin-invoice') || activeView === 'admin-client-ledger' || activeView === 'admin-payments';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-2xl safe-area-pb">
      <button
        onClick={() => onViewChange('dashboard')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
          isDashboard ? 'text-indigo-600 font-bold scale-105' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <span className="text-[9px] font-black uppercase tracking-tight mt-1">Home</span>
      </button>

      <button
        onClick={() => onViewChange('gst-portfolio')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
          isGst ? 'text-indigo-600 font-bold scale-105' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2-2h-5m-9 0H3m2 0h5" />
        </svg>
        <span className="text-[9px] font-black uppercase tracking-tight mt-1">GST</span>
      </button>

      <button
        onClick={() => onViewChange('it-portfolio')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
          isIt ? 'text-indigo-600 font-bold scale-105' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857" />
        </svg>
        <span className="text-[9px] font-black uppercase tracking-tight mt-1">IT Tax</span>
      </button>

      <button
        onClick={() => onViewChange('admin-client-ledger')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
          isBilling ? 'text-indigo-600 font-bold scale-105' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-[9px] font-black uppercase tracking-tight mt-1">Ledger</span>
      </button>

      <button
        onClick={onToggleSidebar}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-2xl text-slate-500 hover:text-slate-900 transition-all"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span className="text-[9px] font-black uppercase tracking-tight mt-1">Menu</span>
      </button>
    </div>
  );
};

export default MobileBottomNav;
