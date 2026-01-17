
import React from 'react';
import { ActiveView } from '../types';

export interface NavItem {
  id: ActiveView | string;
  label: string;
  icon?: React.ReactNode;
  children?: NavItem[];
}

interface SidebarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  onOpenFolder: (item: NavItem) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, isCollapsed, onToggle, onOpenFolder }) => {

  const navigation: { items: NavItem[] }[] = [
    {
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
        { id: 'gst-portfolio', label: 'Client Management', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /> },
        { id: 'compliance-monthly', label: 'Tax & Compliance', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
        { id: 'lit-notice-pending', label: 'Legal', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /> },
        { id: 'compliance-gstr4', label: 'Annual Returns', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
        { id: 'compliance-itr', label: 'Income Tax & Audit', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /> },
        { id: 'misc-msme', label: 'Miscellaneous Work', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /> },
        { id: 'settings', label: 'Administrative', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> },
      ]
    }
  ];

  const handleItemClick = (item: NavItem) => {
    onViewChange(item.id as ActiveView);
  };

  const renderItem = (item: NavItem) => {
    const isActive = activeView === item.id;
    return (
      <div key={item.id} className="w-full relative px-3 py-1">
        <button
          onClick={() => handleItemClick(item)}
          className={`flex w-full items-center gap-4 rounded-xl transition-all duration-300 group/item ${
            isCollapsed ? 'justify-center py-4' : 'px-4 py-3'
          } ${
            isActive ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          {item.icon && (
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 shrink-0 transition-transform ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover/item:text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {item.icon}
            </svg>
          )}
          {!isCollapsed && (
            <span className="flex-1 text-left truncate font-bold text-[13px] tracking-tight">
              {item.label}
            </span>
          )}
        </button>
      </div>
    );
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-[70] flex flex-col border-r border-slate-100 bg-white transition-all duration-500 ease-in-out ${isCollapsed ? 'w-20' : 'w-80'}`}>
      <div className={`flex h-20 items-center shrink-0 ${isCollapsed ? 'justify-center' : 'px-6 justify-between'}`}>
         {!isCollapsed && (
           <div className="flex items-center gap-3">
             <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </div>
             <span className="text-xl font-black text-slate-900 tracking-tight">Client<span className="text-indigo-600">ify</span></span>
           </div>
         )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 space-y-1 no-scrollbar">
        {navigation.map((group, i) => (
          <div key={i} className="space-y-1">{group.items.map(item => renderItem(item))}</div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-50">
         <button onClick={onToggle} className="w-full flex items-center justify-center h-12 rounded-xl text-slate-400 hover:bg-slate-50 transition-all">
           <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7m0 0l7-7m-7 7h16" /></svg>
         </button>
      </div>
    </aside>
  );
};

export default Sidebar;
