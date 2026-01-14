
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
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, isOpen, onToggle }) => {
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);

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
          id: 'gst-ret-f', label: 'GST Return', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
          children: [
            { id: 'compliance-monthly', label: 'Monthly' },
            { id: 'compliance-quarterly', label: 'Quarterly' },
            { id: 'compliance-composition', label: 'Composition' },
          ]
        },
        { 
          id: 'gst-ann-ret-f', label: 'GST Annual Return', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
          children: [
            { id: 'compliance-gstr4', label: 'GSTR-04' },
            { id: 'compliance-gstr9', label: 'GSTR-9/9C' },
          ]
        },
        { 
          id: 'it-audit-f', label: 'IT & Audit', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586" />,
          children: [
            { id: 'compliance-itr', label: 'IT Return' },
            { id: 'compliance-taxaudit', label: 'Audit and Balance sheet' },
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
            { id: 'lit-notice-pending', label: 'Pending' },
            { id: 'lit-notice-filed', label: 'Filed' },
            { id: 'lit-notice-drop', label: 'Dropped' },
            { id: 'lit-notice-demand', label: 'Demand' },
          ]
        },
        {
          id: 'l-appeals', label: 'GST Appeals', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
          children: [
            { id: 'lit-appeal-pending', label: 'Pending' },
            { id: 'lit-appeal-filed', label: 'Filed' },
            { id: 'lit-appeal-drop', label: 'Dropped' },
            { id: 'lit-appeal-demand', label: 'Demand' },
          ]
        },
      ]
    },
    {
      group: 'Miscellaneous',
      items: [
        { id: 'misc-gst-reg', label: 'GST Registration', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /> },
        { id: 'misc-food-lic', label: 'Food Licenses', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 15.5a5 5 0 01-7 4.5s-2.5 2-4.5 2h-5a1 1 0 01-1-1v-4a5 5 0 014.5-7l.5-.5V5.5a2.5 2.5 0 115 0v3l.5.5a5 5 0 017 4.5z" /> },
        { id: 'misc-msme', label: 'MSME / Udyam', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2-2h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" /> },
        { id: 'misc-work', label: 'Misc Work Log', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
      ]
    },
    {
      group: 'Administration',
      items: [
        { id: 'reminders', label: 'Deadlines', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /> },
        { id: 'messenger', label: 'WhatsApp Messenger', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /> },
      ]
    },
    {
      group: 'Billing & Finance',
      items: [
        { id: 'admin-invoices', label: 'Invoices', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
        { id: 'admin-payments', label: 'Payments Received', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
      ]
    },
    {
      group: 'System',
      items: [
        { id: 'admin-duedates', label: 'Due Date Settings', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
        { id: 'settings', label: 'Firm Settings', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> },
        { id: 'trash', label: 'System Audit Log', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /> },
      ]
    }
  ];

  const handleItemClick = (item: NavItem) => {
    const hasChildren = !!item.children?.length;
    if (hasChildren) {
      setExpandedFolders(prev => prev.includes(item.id) ? prev.filter(f => f !== item.id) : [...prev, item.id]);
    } else {
      onViewChange(item.id as ActiveView);
      if (window.innerWidth < 1024) onToggle(); // Auto close on mobile
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
          className={`flex w-full items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 ${
            isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          } ${level > 0 ? 'ml-6' : ''}`}
        >
          {item.icon && (
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 shrink-0 transition-transform group-hover/item:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover/item:text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {item.icon}
            </svg>
          )}
          
          <span className="flex-1 text-left truncate font-black text-[11px] uppercase tracking-wider">{item.label}</span>
          
          {hasChildren && (
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>

        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1 border-l-2 border-slate-100 ml-6 pl-2 animate-in slide-in-from-top-2 duration-200">
            {item.children?.map(child => (
              <button
                key={child.id}
                onClick={() => { onViewChange(child.id as ActiveView); if (window.innerWidth < 1024) onToggle(); }}
                className={`w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
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
      className={`fixed inset-y-0 left-0 z-[100] flex flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-500 ease-in-out w-80 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-20 items-center px-6 justify-between border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight">Client<span className="text-indigo-600">ify</span></span>
        </div>
        <button onClick={onToggle} className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-8 min-h-0 scroll-smooth">
        {navigation.map((group, i) => (
          <div key={i} className="space-y-3">
            <h5 className="px-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">{group.group}</h5>
            <div className="space-y-1">{group.items.map(item => renderItem(item))}</div>
          </div>
        ))}
        <div className="h-20 shrink-0" /> {/* Bottom Spacer */}
      </nav>
    </aside>
  );
};

export default Sidebar;
