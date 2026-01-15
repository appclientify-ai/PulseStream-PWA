
import React, { useState, useEffect } from 'react';
import { ActiveView } from '../types';

interface NavItem {
  id: string;
  label: string;
  icon: string | React.ReactNode;
  view?: ActiveView;
  subItems?: NavItem[];
}

interface SidebarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

const navStructure: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠', view: 'dashboard' },
    { 
        id: 'client-management',
        label: 'Client Management', 
        icon: '👥',
        subItems: [
            { id: 'gst-portfolio', label: 'GST Portfolio', icon: '🧾', view: 'gst-portfolio' },
            { id: 'it-portfolio', label: 'IT Portfolio', icon: '💻', view: 'it-portfolio' },
        ]
    },
    { 
        id: 'tax-compliance',
        label: 'Tax & Compliance', 
        icon: '📊',
        subItems: [
            { id: 'compliance-monthly', label: 'Monthly Filing', icon: '🗓️', view: 'compliance-monthly' },
            { id: 'compliance-quarterly', label: 'Quarterly (QRMP)', icon: '🏢', view: 'compliance-quarterly' },
            { id: 'compliance-composition', label: 'Composition', icon: '📦', view: 'compliance-composition' },
        ]
    },
    { 
        id: 'legal',
        label: 'Litigation Suite', 
        icon: '⚖️',
        subItems: [
            { id: 'lit-notices', label: 'GST Notices', icon: '✉️', view: 'lit-notice-pending' },
            { id: 'lit-appeals', label: 'GST Appeals', icon: '🏛️', view: 'lit-appeal-pending' },
            { id: 'lit-tribunal', label: 'GSTAT Tribunal', icon: '🏤', view: 'lit-tribunal-pending' },
            { id: 'lit-court', label: 'High Court', icon: '🏦', view: 'lit-hc-pending' },
        ]
    },
    {
        id: 'annual-returns',
        label: 'Annual Returns',
        icon: '📆',
        subItems: [
             { id: 'compliance-gstr4', label: 'GSTR-4 Annual', icon: '📄', view: 'compliance-gstr4' },
             { id: 'compliance-gstr9', label: 'GSTR-9/9C Audit', icon: '📑', view: 'compliance-gstr9' },
        ]
    },
    { 
        id: 'it-audit',
        label: 'Income Tax & Audit', 
        icon: '📈',
        subItems: [
            { id: 'compliance-itr', label: 'ITR Returns', icon: '💸', view: 'compliance-itr' },
            { id: 'compliance-taxaudit', label: 'Audit & B/S', icon: '🔍', view: 'compliance-taxaudit' },
        ]
    },
    { 
        id: 'misc-work',
        label: 'Services Hub', 
        icon: '📁',
        subItems: [
            { id: 'misc-gst-reg', label: 'GST Reg.', icon: '📝', view: 'misc-gst-reg' },
            { id: 'misc-food-lic', label: 'Food License', icon: '🍔', view: 'misc-food-lic' },
            { id: 'misc-msme', label: 'MSME Reg.', icon: '🏢', view: 'misc-msme' },
            { id: 'misc-work', label: 'Work Log', icon: '💼', view: 'misc-work' },
        ]
    },
    { 
        id: 'admin',
        label: 'Administrative', 
        icon: '⚙️',
        subItems: [
            { id: 'reminders', label: 'Due Reminders', icon: '⏰', view: 'reminders' },
            { id: 'messenger', label: 'Messenger', icon: '💬', view: 'messenger' },
            { id: 'admin-invoices', label: 'Invoices', icon: '💳', view: 'admin-invoices' },
            { id: 'admin-payments', label: 'Payments', icon: '✅', view: 'admin-payments' },
            { id: 'admin-duedates', label: 'Calendar Settings', icon: '🗓️', view: 'admin-duedates' },
            { id: 'settings', label: 'Settings', icon: '🔧', view: 'settings' },
        ]
    },
];

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, isCollapsed, onToggle }) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Auto-expand current active view folder
    const findPath = (items: NavItem[]): string | null => {
        for (const item of items) {
            if (item.view === activeView) return item.id;
            if (item.subItems) {
                const sub = findPath(item.subItems);
                if (sub) return item.id;
            }
        }
        return null;
    };
    const parentId = findPath(navStructure);
    if (parentId) setOpenSections(prev => ({ ...prev, [parentId]: true }));
  }, [activeView]);

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderNavItem = (item: NavItem, level = 0) => {
    const hasSubItems = !!item.subItems?.length;
    const isOpen = openSections[item.id];
    const isActive = activeView === item.view;
    const isChildActive = item.subItems?.some(s => s.view === activeView);

    return (
      <div key={item.id} className="w-full">
        <button
          onClick={() => hasSubItems ? toggleSection(item.id) : item.view && onViewChange(item.view)}
          className={`flex w-full items-center gap-4 rounded-xl transition-all duration-300 ${
            isCollapsed ? 'justify-center py-4' : 'px-4 py-3'
          } ${
            isActive ? 'bg-indigo-600 text-white shadow-lg' : isChildActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className={`${isCollapsed ? 'text-2xl' : 'text-xl'} shrink-0`}>{item.icon}</span>
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left truncate font-black text-[11px] uppercase tracking-wider">{item.label}</span>
              {hasSubItems && (
                <svg className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </>
          )}
        </button>

        {hasSubItems && isOpen && !isCollapsed && (
          <div className="mt-1 space-y-1 ml-6 border-l-2 border-slate-100 pl-2 animate-in slide-in-from-top-2">
            {item.subItems?.map(sub => renderNavItem(sub, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-[70] flex flex-col border-r border-slate-200 bg-white shadow-2xl transition-all duration-500 ${isCollapsed ? 'w-20' : 'w-80'}`}>
      <div className={`flex h-20 items-center border-b border-slate-100 px-6 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
         {!isCollapsed && (
           <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </div>
             <span className="text-xl font-black tracking-tighter">Vault<span className="text-indigo-600">Core</span></span>
           </div>
         )}
         {isCollapsed && (
           <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
           </div>
         )}
      </div>

      <div className="px-4 py-3 border-b border-slate-50">
          <div className="flex items-center justify-center gap-2 bg-slate-50 py-2 rounded-xl border border-slate-100">
             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
             {!isCollapsed && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Cloud Vault Encrypted</span>}
          </div>
      </div>

      <nav className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-1">
        {navStructure.map(item => renderNavItem(item))}
      </nav>

      <div className="p-4 border-t border-slate-100">
         <button onClick={onToggle} className="w-full flex items-center justify-center h-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all border border-slate-100 group">
           <svg className={`h-5 w-5 transition-transform duration-500 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7m0 0l7-7m-7 7h16" /></svg>
           {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-widest ml-3">Minimize Sidebar</span>}
         </button>
      </div>
    </aside>
  );
};

export default Sidebar;
