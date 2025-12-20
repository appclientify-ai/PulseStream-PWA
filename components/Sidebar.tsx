
import React from 'react';
import { useAuth } from '../auth/AuthContext';

interface SidebarProps {
  activeTab: 'dashboard' | 'chat';
  onTabChange: (tab: 'dashboard' | 'chat') => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isOpen, onClose }) => {
  const { logout, user } = useAuth();

  const handleTabClick = (tab: 'dashboard' | 'chat') => {
    onTabChange(tab);
    if (window.innerWidth < 768) onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900 border-r border-slate-800 transition-transform duration-300 ease-in-out md:sticky md:w-20 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-16 items-center justify-between px-6 md:justify-center md:px-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white md:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-4 px-6 md:hidden">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Menu</p>
        </div>

        <nav className="mt-6 flex flex-1 flex-col gap-2 px-4 md:items-center md:gap-8 md:px-0">
          <button 
            onClick={() => handleTabClick('dashboard')}
            className={`group flex items-center gap-4 rounded-xl p-3 transition-all md:h-12 md:w-12 md:justify-center ${activeTab === 'dashboard' ? 'bg-indigo-600/10 text-indigo-400' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="font-medium md:hidden">Dashboard</span>
            <span className="absolute left-16 hidden scale-0 rounded bg-slate-800 px-2 py-1 text-xs font-medium text-white transition-all group-hover:scale-100 md:block">Dashboard</span>
          </button>

          <button 
            onClick={() => handleTabClick('chat')}
            className={`group flex items-center gap-4 rounded-xl p-3 transition-all md:h-12 md:w-12 md:justify-center ${activeTab === 'chat' ? 'bg-indigo-600/10 text-indigo-400' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="font-medium md:hidden">Messenger</span>
            <span className="absolute left-16 hidden scale-0 rounded bg-slate-800 px-2 py-1 text-xs font-medium text-white transition-all group-hover:scale-100 md:block">Messages</span>
          </button>
        </nav>

        <div className="mt-auto flex flex-col gap-4 p-4 md:items-center md:pb-6">
          <div className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-3 md:hidden">
            <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-700">
              <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}`} alt="Profile" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-bold text-white">{user?.username}</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Active Session</p>
            </div>
          </div>

          <button 
            onClick={logout}
            className="flex w-full items-center gap-4 rounded-xl p-3 text-red-400 transition-all hover:bg-red-500/10 md:h-12 md:w-12 md:justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="font-bold md:hidden">Sign Out</span>
            <span className="absolute left-16 hidden scale-0 rounded bg-red-600 px-2 py-1 text-xs font-medium text-white transition-all group-hover:scale-100 md:block text-center whitespace-nowrap">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
