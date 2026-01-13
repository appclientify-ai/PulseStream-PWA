
import React, { useState } from 'react';
import { ActiveView } from '../types';

interface NavItem {
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
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, isCollapsed, onToggle }) => {
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);

  const navigation: { group: string; items: NavItem[] }[] = [
    {
      group: 'Primary',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /> },
      ]
    },
    {
      group: 'Client Hub',
      items: [
        { id: 'gst-portfolio', label: 'GST Portfolio', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2-2h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011-1v5m-4 0h4" /> },
        { id: 'it-portfolio', label: 'IT Portfolio', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /> },
      ]
    },
    {
      group: 'Returns',
      items: [
        { 
          id: 'gst-return-folder', 
          label: 'GST Return', 
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
          children: [
            { id: 'compliance-monthly', label: 'Monthly Filing' },
            { id: 'compliance-quarterly', label: 'Quarterly Filing' },
            { id: 'compliance-composition', label: 'Composition Filing' },
          ]
        },
        { 
          id: 'annual-ret-folder', 
          label: 'Annual Compliance', 
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
          children: [
            { id: 'compliance-gstr4', label: 'GSTR-4' },
            { id: 'compliance-gstr9', label: 'GSTR-9/9C' },
          ]
        },
        { 
          id: 'it-audit-folder', 
          label: 'IT & Audit', 
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1.07.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
          children: [
            { id: 'compliance-itr', label: 'ITR Returns' },
            { id: 'compliance-taxaudit', label: 'Audit & B/S' },
          ]
        },
      ]
    },
    {
      group: 'Litigation',
      items: [
        {
          id: 'gst-notices-folder',
          label: 'GST Notices',
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
          children: [
            { id: 'lit-notice-pending', label: 'Pending' },
            { id: 'lit-notice-filed', label: 'Filed' },
            { id: 'lit-notice-drop', label: 'Dropped' },
            { id: 'lit-notice-demand', label: 'Demand' },
          ]
        },
      ]
    },
    {
      group: 'Admin',
      items: [
        { id: 'reminders', label: 'Reminders', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
        { id: 'admin-invoices', label: 'Invoices', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
        { id: 'settings', label: 'Settings', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> },
      ]
    }
  ];

  const handleItemClick = (item: NavItem) => {
    const hasChildren = !!item.children?.length;
    if (hasChildren) {
      if (isCollapsed) return; // In collapsed mode, hover handles flyout
      setExpandedFolders(prev => prev.includes(item.id) ? prev.filter(f => f !== item.id) : [...prev, item.id]);
    } else {
      onViewChange(item.id as ActiveView);
    }
  };

  const renderItem = (item: NavItem, level = 0) => {
    const isExpanded = expandedFolders.includes(item.id);
    const isActive = activeView === item.id || item.children?.some(c => c.id === activeView);
    const hasChildren = !!item.children?.length;

    return (
      <div key={item.id} className="w-full group/item relative">
        <button
          onClick={() => handleItemClick(item)}
          className={`flex w-full items-center gap-4 rounded-2xl transition-all duration-300 ${
            isCollapsed ? 'justify-center py-4' : 'px-4 py-3'
          } ${
            isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          } ${!isCollapsed && level > 0 ? 'ml-6' : ''}`}
        >
          {item.icon && (
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 shrink-0 transition-transform group-hover/item:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover/item:text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {item.icon}
            </svg>
          )}
          
          {!isCollapsed && <span className="flex-1 text-left truncate font-bold text-sm uppercase tracking-tight">{item.label}</span>}
          
          {!isCollapsed && hasChildren && (
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>

        {/* Collapsed Mode Tooltip & Flyout */}
        {isCollapsed && (
          <div className="absolute left-full top-0 ml-2 pointer-events-none opacity-0 group-hover/item:opacity-100 group-hover/item:pointer-events-auto transition-all z-[100] translate-x-2 group-hover/item:translate-x-0">
             {!hasChildren ? (
                <div className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg shadow-xl whitespace-nowrap">
                   {item.label}
                </div>
             ) : (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden min-w-[200px] py-2">
                   <div className="px-4 py-2 border-b border-slate-100 mb-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                   </div>
                   {item.children?.map(child => (
                     <button 
                       key={child.id}
                       onClick={() => onViewChange(child.id as ActiveView)}
                       className={`w-full text-left px-4 py-2 text-xs font-bold transition-all ${activeView === child.id ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}
                     >
                        {child.label}
                     </button>
                   ))}
                </div>
             )}
          </div>
        )}

        {/* Expanded Mode Sub-items */}
        {!isCollapsed && hasChildren && isExpanded && (
          <div className="mt-1 space-y-1 border-l-2 border-slate-100 ml-6 pl-2 animate-in slide-in-from-top-2 duration-200">
            {item.children?.map(child => (
              <button
                key={child.id}
                onClick={() => onViewChange(child.id as ActiveView)}
                className={`w-full text-left px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  activeView === child.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {child.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-[70] flex flex-col border-r border-slate-200 bg-white shadow-2xl transition-all duration-500 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-80'
      }`}
    >
      <div className={`flex h-16 md:h-20 items-center border-b border-slate-100 shrink-0 ${isCollapsed ? 'justify-center' : 'px-6 justify-between'}`}>
         {!isCollapsed && (
           <div className="flex items-center gap-3 animate-in fade-in duration-500">
             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </div>
             <span className="text-xl font-black text-slate-900 tracking-tight">Client<span className="text-indigo-600">ify</span></span>
           </div>
         )}
         {isCollapsed && (
           <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
           </div>
         )}
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-8 no-scrollbar scroll-smooth">
        {navigation.map((group, i) => (
          <div key={i} className="space-y-4">
            {!isCollapsed && <h5 className="px-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">{group.group}</h5>}
            <div className="space-y-1">{group.items.map(item => renderItem(item))}</div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
         <button 
           onClick={onToggle}
           className={`w-full flex items-center justify-center h-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100 ${isCollapsed ? '' : 'gap-3 px-4'}`}
         >
           <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-500 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7m0 0l7-7m-7 7h16" />
           </svg>
           {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">Collapse Vault</span>}
         </button>
      </div>
    </aside>
  );
};

export default Sidebar;
