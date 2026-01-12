
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
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, isOpen, onClose }) => {
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);

  const navigation: { group: string; items: NavItem[] }[] = [
    {
      group: 'Primary',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /> },
      ]
    },
    {
      group: 'Client Hub',
      items: [
        { id: 'gst-portfolio', label: 'GST Portfolio', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2-2h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011-1v5m-4 0h4" /> },
        { id: 'it-portfolio', label: 'IT Portfolio', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /> },
      ]
    },
    {
      group: 'Compliance',
      items: [
        { 
          id: 'gst-return-folder', 
          label: 'GST Return', 
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
          children: [
            { id: 'compliance-monthly', label: 'Monthly Filing' },
            { id: 'compliance-quarterly', label: 'Quarterly Filing' },
            { id: 'compliance-composition', label: 'Composition Filing' },
          ]
        },
        { 
          id: 'annual-ret-folder', 
          label: 'Annual Returns', 
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
          children: [
            { id: 'compliance-gstr4', label: 'GSTR-4' },
            { id: 'compliance-gstr9', label: 'GSTR-9/9C' },
          ]
        },
        { 
          id: 'it-audit-folder', 
          label: 'IT & Audit', 
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
          children: [
            { id: 'compliance-itr', label: 'ITR Returns' },
            { id: 'compliance-taxaudit', label: 'Audit & Financials' },
          ]
        },
      ]
    },
    {
      group: 'Litigation Suite',
      items: [
        {
          id: 'gst-notices-folder',
          label: 'GST Notices',
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
          children: [
            { id: 'lit-notice-pending', label: 'Pending' },
            { id: 'lit-notice-filed', label: 'Filed' },
            { id: 'lit-notice-drop', label: 'Dropped' },
            { id: 'lit-notice-demand', label: 'Demand' },
          ]
        },
        {
          id: 'gst-appeals-folder',
          label: 'GST Appeals',
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l5 5m-5-5l5-5" />,
          children: [
            { id: 'lit-appeal-pending', label: 'Pending' },
            { id: 'lit-appeal-filed', label: 'Filed' },
            { id: 'lit-appeal-drop', label: 'Relief' },
            { id: 'lit-appeal-demand', label: 'Sustained' },
          ]
        },
        {
          id: 'tribunal-folder',
          label: 'Tribunal (GSTAT)',
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2-2h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011-1v5m-4 0h4" />,
          children: [
            { id: 'lit-tribunal-pending', label: 'Pending' },
            { id: 'lit-tribunal-filed', label: 'Filed' },
            { id: 'lit-tribunal-drop', label: 'Closed' },
            { id: 'lit-tribunal-demand', label: 'Demand' },
          ]
        },
        {
          id: 'high-court-folder',
          label: 'High Court',
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
          children: [
            { id: 'lit-hc-pending', label: 'Pending' },
            { id: 'lit-hc-filed', label: 'Filed' },
            { id: 'lit-hc-drop', label: 'Relief' },
            { id: 'lit-hc-demand', label: 'Sustained' },
          ]
        }
      ]
    },
    {
      group: 'Miscellaneous',
      items: [
        { id: 'misc-gst-reg', label: 'GST Registration', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
        { id: 'misc-food-lic', label: 'Food Licenses', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /> },
        { id: 'misc-msme', label: 'MSME Registration', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2-2h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011-1v5m-4 0h4" /> },
        { id: 'misc-work', label: 'Miscellaneous Work', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
      ]
    },
    {
      group: 'Administration',
      items: [
        { id: 'reminders', label: 'Reminders', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
        { id: 'messenger', label: 'Bulk Messenger', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /> },
        { 
          id: 'billing-folder', 
          label: 'Billing & Fees', 
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
          children: [
            { id: 'admin-invoices', label: 'Invoices' },
            { id: 'admin-payments', label: 'Payments Received' },
          ]
        },
        { id: 'admin-duedates', label: 'Due Date Setting', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
        { id: 'settings', label: 'Setting', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> },
        { id: 'trash', label: 'Trash', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /> },
      ]
    }
  ];

  const handleItemClick = (item: NavItem) => {
    const hasChildren = !!item.children?.length;
    if (hasChildren) {
      setExpandedFolders(prev => prev.includes(item.id) ? prev.filter(f => f !== item.id) : [...prev, item.id]);
    } else {
      onViewChange(item.id as ActiveView);
      onClose();
    }
  };

  const renderItem = (item: NavItem, level = 0) => {
    const isExpanded = expandedFolders.includes(item.id);
    const isActive = activeView === item.id;
    const hasChildren = !!item.children?.length;

    return (
      <div key={item.id} className="w-full">
        <button
          onClick={() => handleItemClick(item)}
          className={`group flex w-full items-center gap-4 rounded-2xl px-4 py-3 md:py-2.5 text-sm font-bold transition-all duration-200 ${
            isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          } ${level > 0 ? 'ml-6' : ''}`}
        >
          {item.icon && (
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {item.icon}
            </svg>
          )}
          <span className="flex-1 text-left truncate">{item.label}</span>
          {hasChildren && (
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1 border-l-2 border-slate-100 ml-6 pl-2">
            {item.children?.map(child => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div 
        className={`fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-md transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose} 
      />
      <aside className={`fixed inset-y-0 left-0 z-[70] flex flex-col border-r border-slate-200 bg-white shadow-[0_0_50px_rgba(0,0,0,0.1)] transition-transform duration-500 ease-in-out w-[280px] sm:w-80 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 md:h-20 items-center justify-between px-6 border-b border-slate-100 shrink-0">
           <div className="flex items-center gap-3">
             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </div>
             <span className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Client<span className="text-indigo-600">ify</span></span>
           </div>
           <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all border border-slate-100">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
           </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
          {navigation.map((group, i) => (
            <div key={i} className="space-y-3">
              <h5 className="px-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{group.group}</h5>
              <div className="space-y-1">{group.items.map(item => renderItem(item))}</div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
