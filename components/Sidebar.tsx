
import React, { useState } from 'react';
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
  const [hoveredItem, setHoveredItem] = useState<{ id: string; top: number; item: NavItem } | null>(null);
  const hoverTimeout = React.useRef<NodeJS.Timeout | null>(null);

  const navigation: { group: string; items: NavItem[] }[] = [
    {
      group: 'Primary',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /> },
      ]
    },
    {
      group: 'Portfolios',
      items: [
        { id: 'gst-portfolio', label: 'GST Portfolio', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2-2h-5m-9 0H3m2 0h5" /> },
        { id: 'it-portfolio', label: 'IT Portfolio', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857" /> },
      ]
    },
    {
      group: 'Compliance',
      items: [
        { 
          id: 'gst-ret-f', label: 'GST Returns', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
          children: [
            { id: 'compliance-monthly', label: 'Monthly Filing' },
            { id: 'compliance-quarterly', label: 'Quarterly Filing' },
            { id: 'compliance-composition', label: 'Composition' },
          ]
        },
        {
          id: 'annual-ret-f', label: 'Annual Returns', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
          children: [
            { id: 'compliance-gstr4', label: 'GSTR-4 Annual' },
            { id: 'compliance-gstr9', label: 'GSTR-9/9C Audit' },
          ]
        },
        { 
          id: 'it-audit-f', label: 'IT & Audit', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586" />,
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
          id: 'l-notices', label: 'GST Notices', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
          children: [
            { id: 'lit-notice-pending', label: 'Pending Notices' },
            { id: 'lit-notice-filed', label: 'Filed Notices' },
            { id: 'lit-notice-drop', label: 'Closed/Relief' },
            { id: 'lit-notice-demand', label: 'Confirmed Demand' },
          ]
        },
        {
          id: 'l-appeals', label: 'GST Appeals', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
          children: [
            { id: 'lit-appeal-pending', label: 'Pending Appeals' },
            { id: 'lit-appeal-filed', label: 'Filed Appeals' },
            { id: 'lit-appeal-drop', label: 'Closed/Relief' },
            { id: 'lit-appeal-demand', label: 'Sustained' },
          ]
        },
        {
          id: 'l-tribunal', label: 'Tribunal', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />,
          children: [
            { id: 'lit-tribunal-pending', label: 'Pending' },
            { id: 'lit-tribunal-filed', label: 'Filed' },
            { id: 'lit-tribunal-drop', label: 'Closed/Relief' },
            { id: 'lit-tribunal-demand', label: 'Sustained' },
          ]
        },
        {
          id: 'l-court', label: 'High Court', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 14v20c0 4.418 7.163 8 16 8 1.38 0 2.721-.087 4-.252M8 14c0 4.418 7.163 8 16 8s16-3.582 16-8M8 14c0-4.418 7.163-8 16-8s16 3.582 16 8m0 0v20c0 4.418-7.163 8-16 8-1.38 0-2.721-.087-4-.252" />,
          children: [
            { id: 'lit-hc-pending', label: 'Pending' },
            { id: 'lit-hc-filed', label: 'Filed' },
            { id: 'lit-hc-drop', label: 'Closed/Relief' },
            { id: 'lit-hc-demand', label: 'Sustained' },
          ]
        },
      ]
    },
    {
      group: 'Services',
      items: [
        { id: 'misc-gst-reg', label: 'GST Reg.', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /> },
        { id: 'misc-food-lic', label: 'Food License', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /> },
        { id: 'misc-msme', label: 'MSME Reg.', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /> },
        { id: 'misc-work', label: 'Work Log', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
      ]
    },
    {
      group: 'Admin',
      items: [
        { id: 'messenger', label: 'Messenger', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /> },
        { id: 'reminders', label: 'Reminders', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /> },
        { id: 'admin-invoices', label: 'Invoices', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 14l6-6m-5.5.5h.5m.5.5h.5m.5.5h.5m.5.5h.5m-3 3h.5m.5.5h.5m.5.5h.5m.5.5h.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
        { id: 'admin-payments', label: 'Payments', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 002 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /> },
        { id: 'admin-client-ledger', label: 'Client Ledger', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
        { id: 'admin-duedates', label: 'Due Dates', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
        { id: 'settings', label: 'Settings', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> },
        { id: 'trash', label: 'Vault Audit', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /> },
      ]
    }
  ];

  const handleItemClick = (e: React.MouseEvent, item: NavItem) => {
    if (item.children?.length) {
      if (hoveredItem?.id === item.id) {
        setHoveredItem(null);
      } else {
        const rect = e.currentTarget.getBoundingClientRect();
        setHoveredItem({ id: item.id, top: rect.top, item });
      }
    } else {
      onViewChange(item.id as ActiveView);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent, item: NavItem) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    if (!isCollapsed && (!item.children || item.children.length === 0)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredItem({ id: item.id, top: rect.top, item });
  };

  const renderItem = (item: NavItem) => {
    const isActive = activeView === item.id || item.children?.some(c => c.id === activeView);
    const hasChildren = !!item.children?.length;

    return (
      <div key={item.id} className="w-full relative px-2">
        <button
          onClick={(e) => handleItemClick(e, item)}
          onMouseEnter={(e) => handleMouseEnter(e, item)}
          onMouseLeave={() => { hoverTimeout.current = setTimeout(() => setHoveredItem(null), 150); }}
          className={`flex w-full items-center gap-4 rounded-2xl transition-all duration-300 group/item ${
            isCollapsed ? 'justify-center py-4' : 'px-4 py-3'
          } ${
            isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          {item.icon && (
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 shrink-0 transition-transform group-hover/item:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover/item:text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {item.icon}
            </svg>
          )}
          
          {!isCollapsed && (
            <span className="flex-1 text-left truncate font-black text-[11px] uppercase tracking-wider">
              {item.label}
            </span>
          )}
          
          {!isCollapsed && hasChildren && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7-7" />
            </svg>
          )}
        </button>
      </div>
    );
  };

  return (
    <>
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] md:hidden transition-opacity"
          onClick={onToggle}
        />
      )}
      <aside 
        className={`fixed inset-y-0 left-0 z-[70] flex flex-col border-r border-slate-200 bg-white shadow-2xl transition-all duration-500 ease-in-out md:translate-x-0 ${
          isCollapsed ? '-translate-x-full md:w-20' : 'translate-x-0 w-72'
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

        <nav className="flex-1 overflow-y-auto py-6 space-y-8 no-scrollbar scroll-smooth">
          {navigation.map((group, i) => (
            <div key={i} className="space-y-3">
              {!isCollapsed && <h5 className="px-6 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">{group.group}</h5>}
              <div className="space-y-1">{group.items.map(item => renderItem(item))}</div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
           <button 
             onClick={onToggle}
             className="w-full flex items-center justify-center h-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100 group"
             title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
           >
             {isCollapsed ? (
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
               </svg>
             ) : (
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
               </svg>
             )}
             {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-widest ml-3">Minimize Vault</span>}
           </button>
        </div>
      </aside>

      {/* Floating Tooltip / Menu */}
      {hoveredItem && (isCollapsed || hoveredItem.item.children) && (
        <div 
          className={`fixed z-[80] ${isCollapsed ? 'left-20' : 'left-72'} pl-2`}
          style={{ top: hoveredItem.top }}
          onMouseEnter={() => { if (hoverTimeout.current) clearTimeout(hoverTimeout.current); }}
          onMouseLeave={() => { hoverTimeout.current = setTimeout(() => setHoveredItem(null), 150); }}
        >
          <div className="absolute left-2 top-6 -ml-1.5 h-3 w-3 -translate-y-1/2 rotate-45 bg-slate-900 border-l border-b border-white/10" />
          
          <div className="relative z-10 bg-slate-900 text-white rounded-xl shadow-2xl p-3 border border-white/10 min-w-[180px] animate-in fade-in zoom-in-95 duration-200">
             <div className="mb-2 pb-2 border-b border-white/10">
               <span className="text-xs font-black uppercase tracking-wider text-white block">{hoveredItem.item.label}</span>
             </div>
             
             {hoveredItem.item.children ? (
               <div className="space-y-1">
                 {hoveredItem.item.children.map(child => (
                   <button
                     key={child.id}
                     onClick={() => {
                        onViewChange(child.id as ActiveView);
                        setHoveredItem(null);
                     }}
                     className="w-full text-left text-[10px] font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg px-2 py-1.5 transition-colors flex items-center justify-between group"
                   >
                     <span>{child.label}</span>
                     <svg className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                   </button>
                 ))}
               </div>
             ) : (
                <div className="text-[9px] text-slate-400 font-medium px-1">Click to open module</div>
             )}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
