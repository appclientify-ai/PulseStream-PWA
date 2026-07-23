import React, { useState, useEffect } from 'react';
import { formatDate } from '../dateUtils';

const STORAGE_KEY = 'clientify_global_compliance_dates_v1';

interface Deadline {
  key: string;
  moduleId: string;
  year: string;
  period: string;
  date: Date;
  dateString: string;
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

const UpcomingDeadlinesWidget: React.FC = () => {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
    loadDeadlines();
    
    // Setup interval to check deadlines periodically (e.g., every hour)
    const interval = setInterval(() => {
      loadDeadlines();
    }, 1000 * 60 * 60);
    
    return () => clearInterval(interval);
  }, []);

  const loadDeadlines = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const parsed: Deadline[] = Object.keys(data).map(key => {
        const parts = key.split('_');
        const period = parts.pop() || '';
        const year = parts.pop() || '';
        const moduleId = parts.join('_');
        
        const dateStr = data[key];
        const date = new Date(dateStr);
        return { key, moduleId, year, period, date, dateString: dateStr };
      }).filter(d => !isNaN(d.date.getTime()));

      const upcoming = parsed.filter(d => d.date >= today).sort((a, b) => a.date.getTime() - b.date.getTime());
      setDeadlines(upcoming);
      
      checkNotifications(upcoming);
    } catch (e) { console.error(e); }
  };

  const checkNotifications = (upcoming: Deadline[]) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastNotified = localStorage.getItem('clientify_last_deadline_notification');
    const todayStr = today.toISOString().split('T')[0];
    if (lastNotified === todayStr) return;
    
    let notifiedCount = 0;

    upcoming.forEach(d => {
      const diffTime = d.date.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Notify exactly 3 days before
      if (diffDays === 3) {
        new Notification(`Upcoming Deadline: ${moduleNames[d.moduleId] || d.moduleId}`, {
          body: `Due date for ${d.period} (${d.year}) is in 3 days (${d.dateString}).`,
          icon: '/icon.png'
        });
        notifiedCount++;
      }
    });
    
    if (notifiedCount > 0) {
      localStorage.setItem('clientify_last_deadline_notification', todayStr);
    }
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(p => {
        setPermission(p);
        if (p === 'granted') {
          loadDeadlines();
        }
      });
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm flex flex-col h-[400px] relative overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
          <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Upcoming Deadlines
        </h3>
        {permission !== 'granted' && (
          <button onClick={requestNotificationPermission} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
            Enable Alerts
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {deadlines.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[10px] font-black uppercase tracking-widest">No upcoming deadlines</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
          {deadlines.slice(0, 10).map(d => {
            const diffTime = d.date.getTime() - new Date().getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const isUrgent = diffDays <= 3 && diffDays >= 0;

            return (
              <div key={d.key} className={`p-4 rounded-2xl border ${isUrgent ? 'bg-red-50/50 border-red-100' : 'bg-slate-50 border-slate-100'} flex items-center justify-between group transition-all`}>
                <div>
                  <p className={`text-[11px] font-black uppercase tracking-widest ${isUrgent ? 'text-red-600' : 'text-slate-900'} mb-1`}>
                    {moduleNames[d.moduleId] || d.moduleId}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {d.period} • {d.year}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black ${isUrgent ? 'text-red-600' : 'text-indigo-600'}`}>
                    {formatDate(d.date)}
                  </p>
                  <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${isUrgent ? 'text-red-400' : 'text-slate-400'}`}>
                    {diffDays === 0 ? 'Today' : `In ${diffDays} Days`}
                  </p>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>
      
      {deadlines.length > 10 && (
         <div className="pt-4 mt-2 border-t border-slate-100 text-center shrink-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">+{deadlines.length - 10} More Upcoming</p>
         </div>
      )}
    </div>
  );
};

export default UpcomingDeadlinesWidget;
