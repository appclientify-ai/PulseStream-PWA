
import React, { useState, useEffect } from 'react';
import { ActiveView } from '../types';

interface NavItem {
  id: string;
  label: string;
  icon: string;
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
            { id: 'gst-clients', label: 'GST Client Details', icon: '🧾', view: 'gst-portfolio' },
            { id: 'it-clients', label: 'Income Tax Client Details', icon: '💻', view: 'it-portfolio' },
        ]
    },
    { 
        id: 'tax-compliance',
        label: 'Tax & Compliance', 
        icon: '📊',
        subItems: [
            { 
                id: 'gst-regular',
                label: 'GST REGULAR Return', 
                icon: '🗓️',
                subItems: [
                    { id: 'gst-monthly', label: 'Monthly', icon: '›', view: 'compliance-monthly' },
                    { id: 'gst-quarterly', label: 'Quarterly', icon: '›', view: 'compliance-quarterly' },
                ]
            },
            { id: 'gst-composition', label: 'GST COMPOSITION Return', icon: '📦', view: 'compliance-composition' },
        ]
    },
    { 
        id: 'legal',
        label: 'Legal', 
        icon: '⚖️',
        subItems: [
            { 
                id: 'gst-notices', 
                label: 'GST Notices', 
                icon: '✉️', 
                subItems: [
                    { id: 'gst-notice-pending', label: 'Pending Reply', icon: '›', view: 'lit-notice-pending' },
                    { id: 'gst-notice-reply', label: 'Notice Reply Filed', icon: '›', view: 'lit-notice-filed' },
                    { id: 'gst-notice-drop', label: 'Notice Drop Order', icon: '›', view: 'lit-notice-drop' },
                    { id: 'gst-notice-demand', label: 'Notice Demand Order', icon: '›', view: 'lit-notice-demand' },
                ]
            },
            { 
                id: 'gst-appeals', 
                label: 'GST Appeals', 
                icon: '🏛️',
                subItems: [
                    { id: 'gst-appeal-pending', label: 'Appeal Pending', icon: '›', view: 'lit-appeal-pending' },
                    { id: 'gst-appeal-filed', label: 'Appeal Filed', icon: '›', view: 'lit-appeal-filed' },
                    { id: 'gst-appeal-drop', label: 'Appeal Drop Order', icon: '›', view: 'lit-appeal-drop' },
                    { id: 'gst-appeal-demand', label: 'Appeal Demand Order', icon: '›', view: 'lit-appeal-demand' },
                ]
            },
            {
                id: 'gst-tribunal',
                label: 'GST Tribunal',
                icon: '🏤',
                subItems: [
                    { id: 'gstat-pending', label: 'GSTAT Pending', icon: '›', view: 'lit-tribunal-pending' },
                    { id: 'gstat-filed', label: 'GSTAT Filed', icon: '›', view: 'lit-tribunal-filed' },
                    { id: 'gstat-drop', label: 'GSTAT Drop Order', icon: '›', view: 'lit-tribunal-drop' },
                    { id: 'gstat-demand', label: 'GSTAT Demand Order', icon: '›', view: 'lit-tribunal-demand' },
                ]
            },
            {
                id: 'high-court',
                label: 'High Court',
                icon: '🏦',
                subItems: [
                    { id: 'hc-pending', label: 'HC Appeal Pending', icon: '›', view: 'lit-hc-pending' },
                    { id: 'hc-filed', label: 'HC Appeal Filed', icon: '›', view: 'lit-hc-filed' },
                    { id: 'hc-drop', label: 'HC Drop Order', icon: '›', view: 'lit-hc-drop' },
                    { id: 'hc-demand', label: 'HC Demand Order', icon: '›', view: 'lit-hc-demand' },
                ]
            }
        ]
    },
    {
        id: 'annual-returns',
        label: 'Annual Returns',
        icon: '📆',
        subItems: [
             { id: 'gstr4-annual', label: 'GSTR-4 Annual Return', icon: '📄', view: 'compliance-gstr4' },
             { id: 'gstr9-annual', label: 'GSTR-9/9C Annual Return', icon: '📑', view: 'compliance-gstr9' },
        ]
    },
    { 
        id: 'it-audit',
        label: 'Income Tax & Audit', 
        icon: '📈',
        subItems: [
            { id: 'it-return', label: 'Income Tax Return', icon: '💸', view: 'compliance-itr' },
            { id: 'audit', label: 'Audit', icon: '🔍', view: 'compliance-taxaudit' },
            { id: 'balance-sheet', label: 'Balance Sheet', icon: '📋', view: 'balance-sheet' },
        ]
    },
    { 
        id: 'misc-work',
        label: 'Miscellaneous Work', 
        icon: '📁',
        subItems: [
            { id: 'gst-registration', label: 'GST Registration', icon: '📝', view: 'misc-gst-reg' },
            { id: 'food-licenses', label: 'Food Licenses', icon: '🍔', view: 'food-licenses' },
            { id: 'msme-registration', label: 'MSME Registration', icon: '🏢', view: 'msme-registration' },
            { id: 'misc-work-general', label: 'Miscellaneous Work', icon: '💼', view: 'misc-work' },
        ]
    },
    { 
        id: 'admin',
        label: 'Administrative', 
        icon: '⚙️',
        subItems: [
            { id: 'reminders', label: 'Due Date Reminder', icon: '⏰', view: 'reminders' },
            { id: 'reminder-messages', label: 'Reminder Messages', icon: '💬', view: 'messenger' },
            { id: 'payments', label: 'Payment Details', icon: '💳', view: 'admin-invoices' },
            { id: 'payments-received', label: 'Payment Received', icon: '✅', view: 'admin-payments' },
            { id: 'due-date-settings', label: 'Due Date Settings', icon: '🗓️', view: 'admin-duedates' },
            { id: 'settings', label: 'Settings', icon: '🔧', view: 'settings' },
        ]
    },
];

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, isCollapsed, onToggle }) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const findPath = (items: NavItem[], targetView: ActiveView): string[] => {
        for (const item of items) {
            if (item.view === targetView) return [item.id];
            if (item.subItems) {
                const sub = findPath(item.subItems, targetView);
                if (sub.length > 0) return [item.id, ...sub];
            }
        }
        return [];
    };
    const path = findPath(navStructure, activeView);
    if (path.length > 0) {
        setOpenSections(prev => {
            const next = { ...prev };
            path.forEach(id => next[id] = true);
            return next;
        });
    }
  }, [activeView]);

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const NavItemComponent: React.FC<{ item: NavItem; level: number }> = ({ item, level }) => {
    const hasSubItems = !!item.subItems?.length;
    const isOpen = openSections[item.id];
    const isActive = activeView === item.view;
    
    const isChildActive = (nodes: NavItem[]): boolean => {
        return nodes.some(node => node.view === activeView || (node.subItems && isChildActive(node.subItems)));
    };
    const childActive = hasSubItems && isChildActive(item.subItems!);

    const handleClick = () => {
      if (hasSubItems) {
        toggleSection(item.id);
      } else if (item.view) {
        onViewChange(item.view);
      }
    };

    return (
      <div className="w-full">
        <button
          onClick={handleClick}
          style={{ paddingLeft: isCollapsed ? '0' : `${16 + level * 12}px` }}
          className={`flex w-full items-center gap-3 rounded-xl transition-all duration-300 ${
            isCollapsed ? 'justify-center py-4' : 'px-4 py-3'
          } ${
            isActive ? 'bg-indigo-600 text-white shadow-lg' : childActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
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
          <div className="mt-1 space-y-1">
            {item.subItems?.map(sub => <NavItemComponent key={sub.id} item={sub} level={level + 1} />)}
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
             <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">Vault<span className="text-indigo-600">Core</span></span>
           </div>
         )}
         {isCollapsed && (
           <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
           </div>
         )}
      </div>

      <nav className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-1">
        {navStructure.map(item => <NavItemComponent key={item.id} item={item} level={0} />)}
      </nav>

      <div className="p-4 border-t border-slate-100 shrink-0">
         <button onClick={onToggle} className="w-full flex items-center justify-center h-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all border border-slate-100">
           <svg className={`h-5 w-5 transition-transform duration-500 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7m0 0l7-7m-7 7h16" /></svg>
           {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-widest ml-3">Minimize Sidebar</span>}
         </button>
      </div>
    </aside>
  );
};

export default Sidebar;
