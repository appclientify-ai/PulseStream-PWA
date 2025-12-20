
import React from 'react';

interface SidebarProps {
  activeTab: 'dashboard' | 'chat';
  onTabChange: (tab: 'dashboard' | 'chat') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <aside className="hidden w-20 flex-col items-center border-r border-slate-800 bg-slate-900/50 py-8 md:flex">
      <div className="mb-12 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-500/20">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>

      <nav className="flex flex-col gap-8">
        <button 
          onClick={() => onTabChange('dashboard')}
          className={`group relative flex h-12 w-12 items-center justify-center rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="absolute left-16 scale-0 rounded bg-slate-800 px-2 py-1 text-xs font-medium text-white transition-all group-hover:scale-100">Dashboard</span>
        </button>

        <button 
          onClick={() => onTabChange('chat')}
          className={`group relative flex h-12 w-12 items-center justify-center rounded-xl transition-all ${activeTab === 'chat' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="absolute left-16 scale-0 rounded bg-slate-800 px-2 py-1 text-xs font-medium text-white transition-all group-hover:scale-100">Messages</span>
        </button>
      </nav>

      <div className="mt-auto pb-4">
        <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-slate-700">
          <img src="https://picsum.photos/100" alt="Profile" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
