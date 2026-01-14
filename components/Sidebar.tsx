
import React, { useState, useEffect } from 'react';
import { View, User } from '../types.ts';
import { MenuIcon, XIcon, ChevronDownIcon } from './icons.tsx';
import { useClientData } from '../hooks/useClientData.ts';

interface SidebarProps {
    currentUser: User;
    activeView: View;
    setActiveView: (view: View) => void;
    onLogout: () => void;
    isCollapsed: boolean;
    toggleSidebar: () => void;
}

type NavItem = {
    id: string;
    label: string;
    icon: React.ReactNode;
    view?: View;
    subItems?: NavItem[];
};

const navStructure: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠', view: View.Dashboard },
    { 
        id: 'client-management',
        label: 'Client Management', 
        icon: '👥',
        subItems: [
            { id: 'gst-clients', label: 'GST Client Details', icon: '🧾', view: View.GstClientDetails },
            { id: 'it-clients', label: 'Income Tax Client Details', icon: '💻', view: View.ItClientDetails },
        ]
    },
    { 
        id: 'tax-compliance',
        label: 'Tax & Compliance', 
        icon: '📊',
        subItems: [
            { id: 'gst-monthly', label: 'Monthly', icon: '🗓️', view: View.GstRegularMonthly },
            { id: 'gst-quarterly', label: 'Quarterly', icon: '🗓️', view: View.GstRegularQuarterly },
            { id: 'gst-composition', label: 'Composition', icon: '📦', view: View.GstCompositionReturn },
        ]
    },
    { 
        id: 'legal',
        label: 'Legal', 
        icon: '⚖️',
        subItems: [
            { id: 'gst-notices', label: 'GST Notices', icon: '✉️', view: View.GstNoticePendingReply },
            { id: 'gst-appeals', label: 'GST Appeals', icon: '🏛️', view: View.GstAppealPending },
        ]
    },
    { 
        id: 'admin',
        label: 'Administrative', 
        icon: '⚙️',
        subItems: [
            { id: 'reminders', label: 'Due Date Reminder', icon: '⏰', view: View.DueDateReminder },
            { id: 'payments', label: 'Payment Details', icon: '💳', view: View.PaymentDetails },
            { id: 'settings', label: 'Settings', icon: '🔧', view: View.Settings },
            { id: 'logout', label: 'Logout', icon: '🚪' },
        ]
    },
];

const Sidebar: React.FC<SidebarProps> = ({ currentUser, activeView, setActiveView, onLogout, isCollapsed, toggleSidebar }) => {
    const { isSyncing } = useClientData();
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

    const handleToggle = (id: string) => {
        setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const NavItemComponent: React.FC<{ item: NavItem, level: number }> = ({ item, level }) => {
        const hasSubItems = item.subItems && item.subItems.length > 0;
        const isOpen = openSections[item.id] || false;
        const isActive = activeView === item.view;

        const handleClick = () => {
            if (hasSubItems) {
                handleToggle(item.id);
            } else if (item.view) {
                setActiveView(item.view);
                if (window.innerWidth < 1024) toggleSidebar();
            } else if (item.id === 'logout') {
                onLogout();
            }
        };

        return (
            <>
                <li
                    onClick={handleClick}
                    className={`flex items-center justify-between p-3 my-1 rounded-lg cursor-pointer transition-colors ${
                        isActive ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    style={{ paddingLeft: `${12 + level * 16}px` }}
                >
                    <div className="flex items-center overflow-hidden">
                        <span className="text-xl w-6 h-6 flex items-center justify-center flex-shrink-0">{item.icon}</span>
                        <span className={`ml-4 font-medium transition-opacity duration-300 truncate ${isCollapsed ? 'lg:opacity-0 lg:hidden' : 'opacity-100'}`}>
                           {item.label}
                        </span>
                    </div>
                    {hasSubItems && !isCollapsed && (
                        <span className={`transition-transform transform ml-auto flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
                            <ChevronDownIcon />
                        </span>
                    )}
                </li>
                {hasSubItems && isOpen && !isCollapsed && (
                    <ul>
                        {item.subItems!.map(subItem => <NavItemComponent key={subItem.id} item={subItem} level={level + 1} />)}
                    </ul>
                )}
            </>
        );
    };

    return (
        <>
            <aside className={`flex flex-col bg-white dark:bg-gray-800 shadow-xl transition-all duration-300 ease-in-out z-40 print:hidden fixed inset-y-0 left-0 lg:sticky lg:top-0 lg:h-screen ${isCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0 w-72'}`}>
                <div className={`flex items-center p-4 border-b dark:border-gray-700 h-[69px] flex-shrink-0 ${isCollapsed ? 'lg:justify-center justify-between' : 'justify-between'}`}>
                    {!isCollapsed && (
                        <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                             <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                {currentUser.fullName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-sm font-bold text-gray-900 dark:text-white truncate">{currentUser.fullName}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize truncate">{currentUser.role}</span>
                            </div>
                        </div>
                    )}
                    <button onClick={toggleSidebar} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 flex-shrink-0 ml-2">
                        {isCollapsed ? <MenuIcon /> : <XIcon />}
                    </button>
                </div>
                
                <div className="px-4 py-2 border-b dark:border-gray-700 text-xs flex items-center justify-center">
                    {isSyncing ? (
                        <span className="text-indigo-600 animate-pulse font-semibold">☁️ Cloud Syncing...</span>
                    ) : (
                        <span className="text-green-600 font-semibold">● Cloud Connected</span>
                    )}
                </div>

                <nav className="flex-1 px-2 py-4 overflow-y-auto">
                    <ul>
                        {navStructure.map(item => <NavItemComponent key={item.id} item={item} level={0} />)}
                    </ul>
                </nav>
            </aside>
            {!isCollapsed && <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={toggleSidebar} />}
        </>
    );
};

export default Sidebar;
