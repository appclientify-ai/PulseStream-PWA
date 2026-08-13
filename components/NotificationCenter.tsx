import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, AlertCircle, Calendar, Sparkles } from 'lucide-react';
import { formatDate } from '../dateUtils';

// Storage Keys
const NOTIFICATION_STORAGE_KEY = 'clientify_notifications_list_v1';
const DEADLINE_STORAGE_KEY = 'clientify_global_compliance_dates_v1';
const NOTIFICATION_LOG_KEY = 'clientify_notified_dates_log_v1';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  type: 'urgent' | 'info' | 'success';
}

const moduleNames: Record<string, string> = {
  'monthly_r1': 'GSTR-1 (Monthly)',
  'monthly_r3b': 'GSTR-3B (Monthly)',
  'quarterly_iff': 'GSTR-1 / IFF (Quarterly)',
  'quarterly_r3b': 'GSTR-3B (Quarterly)',
  'composition_cmp08': 'CMP-08',
  'audit_bs': 'Balance Sheet Prep',
  'audit_tax': 'Tax Audit (3CA/3CD)',
  'itr_return': 'ITR Return',
  'annual_gstr4': 'GSTR-4',
  'annual_gstr9': 'GSTR-9',
  'annual_gstr9c': 'GSTR-9C',
};

// Custom dispatch helper to show in-app WhatsApp notification banner anywhere
export const triggerInAppNotification = (title: string, body: string, type: 'urgent' | 'info' | 'success' = 'info') => {
  const event = new CustomEvent('clientify_show_whatsapp_banner', {
    detail: { title, body, type }
  });
  window.dispatchEvent(event);
};

export const NotificationCenter: React.FC<{ placement?: 'header' | 'navbar' }> = ({ placement = 'header' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [activeBanner, setActiveBanner] = useState<{ title: string; body: string; type: string } | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Load saved notifications
    const saved = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }

    // Setup listener for custom whatsapp-style floating toast alerts
    const handleShowBanner = (e: Event) => {
      const customEv = e as CustomEvent;
      if (customEv.detail) {
        setActiveBanner(customEv.detail);
        setBannerVisible(true);
        
        // Auto add to notifications history list
        const newItem: NotificationItem = {
          id: Math.random().toString(36).substr(2, 9),
          title: customEv.detail.title,
          body: customEv.detail.body,
          timestamp: new Date().toISOString(),
          read: false,
          type: customEv.detail.type || 'info',
        };
        
        setNotifications(prev => {
          const updated = [newItem, ...prev].slice(0, 50); // cap at 50 logs
          localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });

        // Auto dismiss banner after 6 seconds
        const timer = setTimeout(() => {
          setBannerVisible(false);
        }, 6000);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('clientify_show_whatsapp_banner', handleShowBanner);
    
    // Auto scan for upcoming deadlines
    scanDeadlinesForAlerts();

    // Re-check periodically
    const interval = setInterval(scanDeadlinesForAlerts, 1000 * 60 * 30); // every 30 mins

    return () => {
      window.removeEventListener('clientify_show_whatsapp_banner', handleShowBanner);
      clearInterval(interval);
    };
  }, []);

  const scanDeadlinesForAlerts = () => {
    const saved = localStorage.getItem(DEADLINE_STORAGE_KEY);
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const parsed = Object.keys(data).map(key => {
        const parts = key.split('_');
        const period = parts.pop() || '';
        const year = parts.pop() || '';
        const moduleId = parts.join('_');
        const dateStr = data[key];
        const date = new Date(dateStr);
        return { key, moduleId, year, period, date, dateString: dateStr };
      }).filter(d => !isNaN(d.date.getTime()));

      const loggedNotifications = JSON.parse(localStorage.getItem(NOTIFICATION_LOG_KEY) || '{}');
      const todayStr = today.toISOString().split('T')[0];

      parsed.forEach(d => {
        const diffTime = d.date.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Let's notify if the deadline is exactly 3 days away or is TODAY
        if (diffDays === 3 || diffDays === 1 || diffDays === 0) {
          const notificationLogId = `${d.key}_days_${diffDays}`;
          
          // Avoid duplicate alerts on the same day for this state
          if (loggedNotifications[notificationLogId] !== todayStr) {
            const moduleLabel = moduleNames[d.moduleId] || d.moduleId;
            let title = '';
            let body = '';
            let type: 'urgent' | 'info' = 'info';

            if (diffDays === 0) {
              title = `🚨 CRITICAL DUE DATE TODAY: ${moduleLabel}`;
              body = `Today is the final day to file GSTR / Compliance for ${d.period} (${d.year}). Avoid late fees!`;
              type = 'urgent';
            } else {
              title = `⏰ Compliance Alert: ${moduleLabel} in ${diffDays} Day${diffDays > 1 ? 's' : ''}`;
              body = `The last date for ${d.period} (${d.year}) is scheduled on ${formatDate(d.date)}. Please complete filings.`;
              type = 'urgent';
            }

            // Trigger system push notification if granted
            if ('Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification(title, {
                  body,
                  icon: '/icon.png',
                  tag: notificationLogId,
                });
              } catch (e) {
                console.error('System notification block:', e);
              }
            }

            // Always trigger beautiful in-app WhatsApp toast banner
            triggerInAppNotification(title, body, type);

            // Save log
            loggedNotifications[notificationLogId] = todayStr;
            localStorage.setItem(NOTIFICATION_LOG_KEY, JSON.stringify(loggedNotifications));
          }
        }
      });
    } catch (e) {
      console.error('Failed checking notifications', e);
    }
  };

  const handleRequestPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(p => {
        setPermission(p);
        if (p === 'granted') {
          triggerInAppNotification(
            '🔔 Desktop Notifications Enabled!',
            'You will now receive instant push notifications for due dates, last dates, and portal updates.',
            'success'
          );
        }
      });
    }
  };

  const handleTestNotification = () => {
    const messages = [
      {
        title: '💬 Clientify Vault Bot',
        body: 'Practice Update: 5 GSTR-3B filings completed successfully. Sync complete.',
        type: 'success' as const
      },
      {
        title: '⚠️ Last Date Reminder: CMP-08',
        body: 'CMP-08 return due in 3 days. Quarter: Q1 (2025-26). Keep your compliance green.',
        type: 'urgent' as const
      },
      {
        title: '⚡ GSTR-1 Automated Sync',
        body: 'New client GSTR-1 state retrieved from legal gateway. Click to view dashboard analytics.',
        type: 'info' as const
      }
    ];

    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    
    // Trigger Native Notification if granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(randomMsg.title, {
        body: randomMsg.body,
        icon: '/icon.png'
      });
    }

    // Trigger WhatsApp Floating Toast
    triggerInAppNotification(randomMsg.title, randomMsg.body, randomMsg.type);
  };

  const handleMarkAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated));
  };

  const handleClearAll = () => {
    setNotifications([]);
    localStorage.removeItem(NOTIFICATION_STORAGE_KEY);
  };

  const handleToggleRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: !n.read } : n);
    setNotifications(updated);
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* WhatsApp Sliding Push Toast Alert overlay */}
      {activeBanner && bannerVisible && (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:right-6 md:w-[420px] z-[99999] animate-in slide-in-from-top-6 duration-300">
          <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-4 rounded-3xl border border-slate-700/50 shadow-[0_20px_50px_rgba(9,13,22,0.35)] backdrop-blur-md flex items-start gap-3.5 relative overflow-hidden group">
            {/* Vibe line */}
            <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
              activeBanner.type === 'urgent' ? 'bg-rose-500' : activeBanner.type === 'success' ? 'bg-emerald-500' : 'bg-indigo-500'
            }`} />

            {/* Logo/Avatar */}
            <div className="relative h-10 w-10 shrink-0 rounded-2xl bg-white/15 border border-white/10 flex items-center justify-center font-bold text-xs shadow-inner mt-0.5">
              <span className="text-lg">🤖</span>
              <span className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] border-2 border-slate-900">
                ✓
              </span>
            </div>

            {/* Message Body */}
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Clientify Vault Bot</span>
                <span className="text-[9px] font-bold text-slate-400">just now</span>
              </div>
              <p className="text-[12px] font-black text-white mt-1 uppercase tracking-tight line-clamp-1">{activeBanner.title}</p>
              <p className="text-[11px] font-medium text-slate-300 mt-0.5 line-clamp-2 leading-snug">{activeBanner.body}</p>
              
              <div className="flex items-center gap-2 mt-2.5">
                <button 
                  onClick={() => setBannerVisible(false)}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 transition-all text-[9px] font-black uppercase tracking-wider rounded-lg"
                >
                  Dismiss
                </button>
                <button 
                  onClick={() => { setBannerVisible(false); setIsOpen(true); }}
                  className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-all text-[9px] font-black uppercase tracking-wider rounded-lg"
                >
                  View History
                </button>
              </div>
            </div>

            {/* Dismiss Cross */}
            <button 
              onClick={() => setBannerVisible(false)} 
              className="text-slate-400 hover:text-white absolute top-3 right-3 p-1 rounded-lg"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Bell Button inside Header/Navbar */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex ${
            placement === 'navbar' ? 'h-10 w-10 md:h-11 md:w-11' : 'h-10 w-10 md:h-12 md:w-12'
          } items-center justify-center rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700/60 transition-all cursor-pointer shadow-xs relative`}
          title="Practitioner Notifications Hub"
          id={`bell-trigger-${placement}`}
        >
          <Bell className={`h-4.5 w-4.5 text-slate-700 dark:text-slate-200 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white border-2 border-white dark:border-slate-900 shadow-sm animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown Sidebar Overlay or Panel */}
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[140]" onClick={() => setIsOpen(false)} />
            <div 
              className="absolute right-0 mt-3 w-80 md:w-96 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-2xl z-[150] animate-in fade-in slide-in-from-top-3 duration-200"
              id={`bell-dropdown-${placement}`}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Alert Notification Hub</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Real-time due dates & alerts</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {permission !== 'granted' && (
                      <button 
                        onClick={handleRequestPermission}
                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                      >
                        Enable Push
                      </button>
                    )}
                    <button 
                      onClick={handleTestNotification}
                      className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                      title="Simulate WhatsApp Style Push Notification"
                    >
                      Test Alert
                    </button>
                  </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-72 overflow-y-auto no-scrollbar space-y-2">
                  {notifications.length === 0 ? (
                    <div className="py-8 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 space-y-2">
                      <Bell className="h-8 w-8" strokeWidth={1.5} />
                      <p className="text-[10px] font-black uppercase tracking-widest text-center">No alerts logged yet</p>
                      <p className="text-[9px] text-center max-w-[200px] text-slate-400 font-bold">Upcoming 3-day deadlines will automatically show here.</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`p-3 rounded-2xl border transition-all text-left relative ${
                          n.read 
                            ? 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800/50 opacity-70' 
                            : 'bg-indigo-50/20 dark:bg-slate-800/60 border-indigo-100/40 dark:border-indigo-900/40'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="text-base mt-0.5 shrink-0">
                            {n.type === 'urgent' ? '⚠️' : n.type === 'success' ? '✅' : 'ℹ️'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight line-clamp-1">{n.title}</p>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{n.body}</p>
                            <span className="text-[8px] font-bold text-slate-400 block mt-1.5">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Actions overlay */}
                        <div className="absolute right-2.5 top-2.5 flex items-center gap-1 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleToggleRead(n.id)}
                            className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:text-indigo-600 text-slate-400 transition-colors"
                            title={n.read ? "Mark Unread" : "Mark Read"}
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer Controls */}
                {notifications.length > 0 && (
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800">
                    <button 
                      onClick={handleMarkAllRead}
                      className="text-[9px] font-black uppercase tracking-wider text-indigo-600 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      Mark all as read
                    </button>
                    <button 
                      onClick={handleClearAll}
                      className="text-[9px] font-black uppercase tracking-wider text-rose-500 hover:text-rose-700 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" /> Clear All
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};
