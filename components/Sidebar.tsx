
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
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
  const { logout, user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [hoveredFolder, setHoveredFolder] = useState<{ item: NavItem; top: number } | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);

  // Comprehensive Nav Structure
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
          id: 'gst-reg', 
          label: 'GST Regular', 
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
          children: [
            { id: 'gst-reg-monthly', label: 'Monthly Filing' },
            { id: 'gst-reg-quarterly', label: 'Quarterly Filing' },
          ]
        },
        { id: 'gst-composition', label: 'GST Composition', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /> },
        { 
          id: 'annual-ret', 
          label: 'Annual Returns', 
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
          children: [
            { id: 'gst-annual-4', label: 'GSTR-4' },
            { id: 'gst-annual-9', label: 'GSTR-9/9C' },
          ]
        },
        { 
          id: 'it-audit', 
          label: 'IT & Audit', 
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
          children: [
            { id: 'it-itr', label: 'ITR Returns' },
            { id: 'it-audits', label: 'Tax Audits' },
            { id: 'it-balance-sheets', label: 'Balance Sheets' },
          ]
        },
      ]
    },
    {
      group: 'Litigation Suite',
      items: [
        {
          id: 'lit-notices', label: 'GST Notices', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
          children: [
            { id: 'lit-notice-pending', label: 'Pending' },
            { id: 'lit-notice-filed', label: 'Filed' },
            { id: 'lit-notice-drop', label: 'Drop Orders' },
            { id: 'lit-notice-demand', label: 'Demand Orders' },
          ]
        },
        {
          id: 'lit-appeals', label: 'GST Appeals', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />,
          children: [
            { id: 'lit-appeal-pending', label: 'Pending' },
            { id: 'lit-appeal-filed', label: 'Filed' },
            { id: 'lit-appeal-drop', label: 'Drop' },
            { id: 'lit-appeal-demand', label: 'Demand' },
          ]
        },
        {
          id: 'lit-tribunal', label: 'Tribunal (GSTAT)', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v20c0 4.418 7.163 8 16 8s16-3.582 16-8V14M8 14c0 4.418 7.163 8 16 8s16-3.582 16-8M8 14c0-4.418 7.163-8 16-8s16 3.582 16 8" />,
          children: [
            { id: 'lit-tribunal-pending', label: 'Pending' },
            { id: 'lit-tribunal-filed', label: 'Filed' },
            { id: 'lit-tribunal-drop', label: 'Drop' },
            { id: 'lit-tribunal-demand', label: 'Demand' },
          ]
        },
        {
          id: 'lit-hc', label: 'High Court', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2-2h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011-1v5m-4 0h4" />,
          children: [
            { id: 'lit-hc-pending', label: 'Pending' },
            { id: 'lit-hc-filed', label: 'Filed' },
            { id: 'lit-hc-drop', label: 'Drop' },
            { id: 'lit-hc-demand', label: 'Demand' },
          ]
        },
      ]
    },
    {
      group: 'Administration',
      items: [
        { id: 'reminders', label: 'Reminders', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
        { id: 'messenger', label: 'Bulk Messenger', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /> },
        { id: 'invoices', label: 'Invoices', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
        { id: 'settings', label: 'Settings', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> },
        { id: 'trash', label: 'Trash', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /> },
      ]
    }
  ];

  // Auto-expand logic for initial view
  useEffect(() => {
    const expandParents = (items: NavItem[], target: string, path: string[] = []): boolean => {
      for (const item of items) {
        if (item.id === target) {
          setExpandedFolders(prev => Array.from(new Set([...prev, ...path])));
          return true;
        }
        if (item.children) {
          if (expandParents(item.children, target, [...path, item.id])) return true;
        }
      }
      return false;
    };
    navigation.forEach(group => expandParents(group.items, activeView));
  }, [activeView]);

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleItemClick = (item: NavItem, event: React.MouseEvent) => {
    const hasChildren = !!item.children?.length;

    if (isCollapsed && hasChildren) {
      const rect = event.currentTarget.getBoundingClientRect();
      setHoveredFolder({ item, top: rect.top });
      return;
    }

    if (hasChildren) {
      toggleFolder(item.id);
    } else {
      onViewChange(item.id as ActiveView);
      if (window.innerWidth < 768) onClose();
    }
  };

  const handleMouseEnter = (item: NavItem, event: React.MouseEvent) => {
    if (!isCollapsed || !item.children?.length) return;
    if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current);
    
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredFolder({ item, top: rect.top });
  };

  const handleMouseLeave = () => {
    if (!isCollapsed) return;
    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredFolder(null);
    }, 150);
  };

  const FloatingSubMenu = ({ folder }: { folder: { item: NavItem; top: number } }) => {
    const menuHeightEstimate = (folder.item.children?.length || 0) * 44 + 50;
    const viewportHeight = window.innerHeight;
    
    // Adjust top if it would overflow bottom of screen
    let adjustedTop = folder.top;
    if (adjustedTop + menuHeightEstimate > viewportHeight) {
      adjustedTop = Math.max(10, viewportHeight - menuHeightEstimate - 20);
    }

    return (
      <div 
        className="fixed left-[76px] z-[100] w-64 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-left-2 duration-200 ring-1 ring-white/5"
        style={{ top: `${adjustedTop}px` }}
        onMouseEnter={() => {
          if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current);
        }}
        onMouseLeave={handleMouseLeave}
      >
        <div className="mb-1 px-4 py-3 border-b border-slate-800/50 bg-slate-800/20 rounded-t-2xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{folder.item.label}</p>
        </div>
        <div className="p-1.5 space-y-1">
          {folder.item.children?.map(child => (
            <button
              key={child.id}
              onClick={() => {
                onViewChange(child.id as ActiveView);
                setHoveredFolder(null);
                if (window.innerWidth < 768) onClose();
              }}
              className={`w-full rounded-xl px-4 py-2 text-left text-sm font-semibold transition-all hover:bg-slate-800/80 ${
                activeView === child.id ? 'bg-indigo-600/15 text-indigo-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              {child.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderItem = (item: NavItem, level = 0) => {
    const isExpanded = expandedFolders.includes(item.id);
    const isActive = activeView === item.id || (item.children?.some(c => c.id === activeView));
    const hasChildren = !!item.children?.length;

    return (
      <div 
        key={item.id} 
        className="relative w-full"
        onMouseEnter={(e) => handleMouseEnter(item, e)}
        onMouseLeave={handleMouseLeave}
      >
        <button
          onClick={(e) => handleItemClick(item, e)}
          className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-300 ${
            isActive && !hasChildren
              ? 'bg-indigo-600/10 text-indigo-400 ring-1 ring-inset ring-indigo-500/30' 
              : isActive && hasChildren 
              ? 'text-indigo-400'
              : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
          } ${level > 0 ? 'ml-4' : ''}`}
        >
          {item.icon && (
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {item.icon}
            </svg>
          )}
          
          {(!isCollapsed || level > 0) && (
            <span className="flex-1 text-left truncate tracking-tight">{item.label}</span>
          )}

          {hasChildren && !isCollapsed && (
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>

        {hasChildren && isExpanded && !isCollapsed && (
          <div className="mt-1 space-y-1 border-l border-slate-800 ml-5 pl-1.5">
            {item.children?.map(child => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-md md:hidden" onClick={onClose} />
      )}

      {/* Single shared floating menu to avoid multiple renders */}
      {isCollapsed && hoveredFolder && (
        <FloatingSubMenu folder={hoveredFolder} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-800 bg-slate-950/90 backdrop-blur-xl transition-all duration-500 md:static ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} ${isCollapsed ? 'w-20' : 'w-72'}`}>
        
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-900">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-black text-white tracking-tighter">Vault<span className="text-indigo-500">Core</span></span>
            </div>
          ) : (
             <div className="mx-auto h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
             </div>
          )}
          
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800 md:flex">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-8 no-scrollbar">
          {navigation.map((group, i) => (
            <div key={i} className="space-y-2">
              {!isCollapsed && <h5 className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">{group.group}</h5>}
              <div className="space-y-1">{group.items.map(item => renderItem(item))}</div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-900 bg-slate-900/10">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 rounded-2xl bg-slate-900/40 p-3 ring-1 ring-inset ring-slate-800/50">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-400 font-black text-sm">
                {user?.username?.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-bold text-white">{user?.username}</p>
                <p className="truncate text-[10px] font-bold text-slate-600 uppercase tracking-widest">Consultant</p>
              </div>
              <button onClick={logout} className="text-slate-600 hover:text-red-500 transition-colors p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <button onClick={logout} className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-red-500/10 hover:text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
