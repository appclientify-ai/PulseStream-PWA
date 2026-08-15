import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useModuleData } from '../../hooks/useModuleData.ts';
import { api } from '../../services/api.ts';
import Loader from '../../components/Loader';
import { formatDate } from '../../dateUtils.ts';
import ViewControl from '../../components/ViewControl';
import { ExportMenu } from '../../components/ExportMenu';
import { GoogleCalendarModal } from '../../components/GoogleCalendarModal';
import { syncDeadlineToGoogleCalendar } from '../../services/googleCalendar';
import { exportToCSV, printList } from '../../exportUtils';
import { toast } from 'sonner';
import { Calendar } from 'lucide-react';

interface UnifiedDeadline {
  id: string;
  title: string;
  client: string;
  date: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  status: string;
  origin: 'litigation' | 'work' | 'food_license' | 'statutory';
  expiryDate?: string;
}

export const Reminders: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'Statutory' | 'Litigation' | 'Misc Work' | 'Food License'>('All');
  const [dueFilter, setDueFilter] = useState<'All' | 'overdue' | 'due15' | 'safe'>('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [activeSnoozeId, setActiveSnoozeId] = useState<string | null>(null);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const snoozeMenuRef = useRef<HTMLDivElement>(null);

  // Separate React Query for each filter/tab, leveraging separate database datasets
  const { data: reminderData = [], isLoading } = useModuleData<UnifiedDeadline[]>('reminders_data', filter);

  // Query all for stats calculation
  const { data: allReminderData = [] } = useModuleData<UnifiedDeadline[]>('reminders_data', 'All');

  useEffect(() => {
    const syncHandler = () => {
      queryClient.invalidateQueries({ queryKey: ['reminders_data'] });
    };
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, [queryClient]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (snoozeMenuRef.current && !snoozeMenuRef.current.contains(e.target as Node)) {
        setActiveSnoozeId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const deadlines = reminderData || [];
  const totalDeadlines = allReminderData || deadlines;

  const getDaysLeft = (dueDate: string) => {
    if (!dueDate) return 999;
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = due.getTime() - now.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  };

  const getThreshold = (d: UnifiedDeadline) => {
    return d.origin === 'food_license' ? 60 : 15;
  };

  const stats = useMemo(() => {
    const total = totalDeadlines.length;
    let overdue = 0;
    let dueIn15Days = 0;
    let safe = 0;

    totalDeadlines.forEach(d => {
      const dl = getDaysLeft(d.date);
      const threshold = getThreshold(d);
      if (dl < 0) overdue++;
      else if (dl >= 0 && dl <= threshold) dueIn15Days++;
      else safe++;
    });

    return {
      total,
      overdue,
      dueIn15Days,
      safe,
      statutory: totalDeadlines.filter(d => d.origin === 'statutory').length,
      litigation: totalDeadlines.filter(d => d.origin === 'litigation').length,
      misc: totalDeadlines.filter(d => d.origin === 'work').length,
      foodLicense: totalDeadlines.filter(d => d.origin === 'food_license').length
    };
  }, [totalDeadlines]);

  const filteredRecords = useMemo(() => {
    const s = search.toLowerCase();
    let list = deadlines.filter(d => 
      (d.client || '').toLowerCase().includes(s) || 
      (d.title || '').toLowerCase().includes(s) || 
      (d.category || '').toLowerCase().includes(s)
    );

    if (dueFilter === 'overdue') {
      list = list.filter(d => getDaysLeft(d.date) < 0);
    } else if (dueFilter === 'due15') {
      list = list.filter(d => {
        const dl = getDaysLeft(d.date);
        return dl >= 0 && dl <= getThreshold(d);
      });
    } else if (dueFilter === 'safe') {
      list = list.filter(d => getDaysLeft(d.date) > getThreshold(d));
    }

    return list;
  }, [deadlines, search, dueFilter]);

  const deadlinesForCalendarSync = useMemo(() => {
    return filteredRecords.map(item => ({
      id: item.id,
      title: item.title,
      client: item.client,
      category: item.category,
      date: item.date
    }));
  }, [filteredRecords]);

  const handleMarkCompleted = async (item: UnifiedDeadline) => {
    try {
      if (item.origin === 'work') {
        await api.saveMiscWork({ id: item.id, status: 'Completed' });
        toast.success(`Task for "${item.client}" marked as completed`);
      } else if (item.origin === 'litigation') {
        await api.saveLitigationRecord({ 
          id: item.id, 
          status: 'Filed', 
          filedDate: new Date().toISOString().split('T')[0] 
        });
        toast.success(`Notice response for "${item.client}" marked as filed`);
      } else if (item.origin === 'food_license') {
        await api.saveFoodLicense({ id: item.id, status: 'Renewed' });
        toast.success(`Food License for "${item.client}" marked as renewed`);
      } else if (item.origin === 'statutory') {
        toast.info(`Statutory deadline "${item.title}" noted.`);
      }
      queryClient.invalidateQueries({ queryKey: ['reminders_data'] });
      window.dispatchEvent(new CustomEvent('clientify_db_change'));
    } catch (err) {
      toast.error('Failed to update task status');
    }
  };

  const handleSingleItemCalendarSync = async (item: UnifiedDeadline) => {
    const body = `Compliance Item: ${item.title}\nClient/Portfolio: ${item.client}\nCategory: ${item.category}\nDue Date: ${formatDate(item.date)}`;
    await syncDeadlineToGoogleCalendar(item.title, body, item.date, item.id);
  };

  const handleSnooze = async (item: UnifiedDeadline, days: number) => {
    try {
      const targetBase = item.date ? new Date(item.date) : new Date();
      const newDateObj = new Date(targetBase.getTime() + days * 24 * 60 * 60 * 1000);
      const newDateStr = newDateObj.toISOString().split('T')[0];

      if (item.origin === 'work') {
        await api.saveMiscWork({ id: item.id, targetDate: newDateStr, dueDate: newDateStr });
      } else if (item.origin === 'litigation') {
        await api.saveLitigationRecord({ id: item.id, dueDate: newDateStr });
      } else if (item.origin === 'food_license') {
        await api.saveFoodLicense({ id: item.id, dueDate: newDateStr });
      }

      toast.success(`Snoozed deadline by +${days} days (${formatDate(newDateStr)})`);
      setActiveSnoozeId(null);
      queryClient.invalidateQueries({ queryKey: ['reminders_data'] });
      window.dispatchEvent(new CustomEvent('clientify_db_change'));
    } catch (err) {
      toast.error('Failed to snooze deadline');
    }
  };

  const handleExportCSV = () => {
    const headers = ['S.No.', 'Entity Identity', 'Module', 'Task Reference', 'Target Date', 'Remaining Days', 'Status'];
    const rows = filteredRecords.map((item, idx) => {
      const dl = getDaysLeft(item.date);
      const remainingStr = dl < 0 ? `${Math.abs(dl)} days overdue` : `${dl} days left`;
      return [
        (idx + 1).toString().padStart(2, '0'),
        item.client,
        item.category,
        item.title,
        item.date ? formatDate(item.date) : '---',
        remainingStr,
        item.status || 'Pending'
      ];
    });
    exportToCSV(headers, rows, 'Vault_Reminders_List.csv');
  };

  const handleExportPDF = () => {
    const headers = ['Entity Identity', 'Module', 'Task Reference', 'Target Date', 'Remaining'];
    const rows = filteredRecords.map(item => {
      const dl = getDaysLeft(item.date);
      const remainingStr = dl < 0 ? `${Math.abs(dl)}d overdue` : `${dl}d left`;
      return [
        item.client,
        item.category,
        item.title,
        item.date ? formatDate(item.date) : '---',
        remainingStr
      ];
    });
    printList('Vault Upcoming Deadlines & Reminders', headers, rows);
  };

  if (isLoading && !reminderData) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-3 animate-in fade-in duration-500 max-w-full mx-auto w-full overflow-hidden">
      
      {/* Top Filter & Count Bar */}
      <div className="flex flex-col gap-3 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex flex-col lg:flex-row items-center gap-3 w-full">
          
          {/* Interactive Count Badges */}
          <div className="flex items-center gap-2 shrink-0 flex-nowrap overflow-x-auto no-scrollbar w-full lg:w-auto max-w-full py-0.5">
            <button 
              type="button"
              onClick={() => setDueFilter('All')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap flex-shrink-0 ${
                dueFilter === 'All' 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title="Show all reminders"
            >
              <span>Total</span>
              <span className={`px-1.5 py-0.2 rounded-md text-xs font-black ${
                dueFilter === 'All' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
              }`}>{stats.total}</span>
            </button>

            <button 
              type="button"
              onClick={() => setDueFilter(prev => prev === 'overdue' ? 'All' : 'overdue')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap flex-shrink-0 ${
                dueFilter === 'overdue' 
                  ? 'bg-rose-600 text-white shadow-sm' 
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
              title="Filter by overdue deadlines"
            >
              <span>Overdue</span>
              <span className={`px-1.5 py-0.2 rounded-md text-xs font-black ${
                dueFilter === 'overdue' ? 'bg-rose-500 text-white' : 'bg-rose-200 text-rose-900'
              }`}>{stats.overdue}</span>
            </button>

            <button 
              type="button"
              onClick={() => setDueFilter(prev => prev === 'due15' ? 'All' : 'due15')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap flex-shrink-0 ${
                dueFilter === 'due15' 
                  ? 'bg-amber-600 text-white shadow-sm' 
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
              title="Filter by deadlines due within 15 days"
            >
              <span>Due ≤15 Days</span>
              <span className={`px-1.5 py-0.2 rounded-md text-xs font-black ${
                dueFilter === 'due15' ? 'bg-amber-500 text-white' : 'bg-amber-200 text-amber-900'
              }`}>{stats.dueIn15Days}</span>
            </button>

            <button 
              type="button"
              onClick={() => setDueFilter(prev => prev === 'safe' ? 'All' : 'safe')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap flex-shrink-0 ${
                dueFilter === 'safe' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
              title="Filter by safe deadlines (> 15 days)"
            >
              <span>Safe (&gt;15d)</span>
              <span className={`px-1.5 py-0.2 rounded-md text-xs font-black ${
                dueFilter === 'safe' ? 'bg-emerald-500 text-white' : 'bg-emerald-200 text-emerald-900'
              }`}>{stats.safe}</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 w-full group">
            <input 
              type="text" 
              placeholder="Search deadlines by client, case reference, or task..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all" 
            />
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>

          {/* View Switcher, Google Calendar Sync, Export & Invalidate Action */}
          <div className="flex items-center gap-2 shrink-0 flex-nowrap overflow-x-auto no-scrollbar max-w-full py-0.5">
            <button
              type="button"
              onClick={() => setIsCalendarModalOpen(true)}
              className="h-11 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              title="Google Calendar Synchronization & Settings"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Google Calendar</span>
            </button>

            <ViewControl 
              viewMode={viewMode} 
              onViewChange={setViewMode} 
            />

            <ExportMenu 
              onExportCSV={handleExportCSV} 
              onExportPDF={handleExportPDF} 
            />

            <button 
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['reminders_data'] });
                toast.success('Reminders refreshed');
              }} 
              className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 flex items-center justify-center transition-all shadow-sm"
              title="Refresh Deadlines"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </div>
        </div>

        {/* Category Sub-Tabs with accurate counts */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100">
          {[
            { id: 'All', label: 'All Modules', count: stats.total },
            { id: 'Statutory', label: 'Statutory Deadlines', count: stats.statutory },
            { id: 'Litigation', label: 'Litigation Notices & Appeals', count: stats.litigation },
            { id: 'Misc Work', label: 'Misc Work Orders', count: stats.misc },
            { id: 'Food License', label: 'FSSAI License Renewals', count: stats.foodLicense },
          ].map(tab => {
            const isSelected = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area: Table / Grid */}
      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-0">
        {viewMode === 'grid' ? (
          <div className="overflow-y-auto no-scrollbar flex-1 p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredRecords.length === 0 ? (
              <div className="col-span-full py-24 text-center text-slate-400 font-bold uppercase tracking-wider">
                No Deadlines Matching Selected Filter
              </div>
            ) : (
              filteredRecords.map((item, idx) => {
                const dl = getDaysLeft(item.date);
                const isOverdue = dl < 0;
                const isUrgent = dl >= 0 && dl <= getThreshold(item);

                return (
                  <div 
                    key={item.id}
                    className={`rounded-2xl p-3.5 border transition-all flex flex-col justify-between gap-3 relative ${
                      isOverdue 
                        ? 'bg-rose-50/20 border-rose-200 hover:border-rose-300' 
                        : isUrgent 
                        ? 'bg-amber-50/20 border-amber-200 hover:border-amber-300' 
                        : 'bg-slate-50/40 border-slate-200/80 hover:border-indigo-200'
                    }`}
                  >
                    {/* Header: S.No., Module badge & Urgency tag */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-400">
                          #{(idx + 1).toString().padStart(2, '0')}
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wide border ${
                          item.origin === 'statutory'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : item.origin === 'litigation' 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : item.origin === 'food_license'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {item.category}
                        </span>
                      </div>

                      {/* Urgency Badge */}
                      {isOverdue ? (
                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold uppercase bg-rose-100 text-rose-700 border border-rose-200 inline-flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-ping" />
                          {Math.abs(dl)}d overdue
                        </span>
                      ) : isUrgent ? (
                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1.5 animate-pulse">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-ping" />
                          {dl}d left
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {dl}d left
                        </span>
                      )}
                    </div>

                    {/* Entity & Task Reference */}
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-slate-900 truncate" title={item.client}>
                        {item.client}
                      </h4>
                      <p className="text-xs font-medium text-slate-600 line-clamp-2 leading-relaxed" title={item.title}>
                        {item.title}
                      </p>
                    </div>

                    {/* Target Date Box */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-semibold text-slate-400 uppercase text-[10px]">Target Date:</span>
                        <span className="font-bold text-slate-800">{formatDate(item.date)}</span>
                      </div>
                      {item.expiryDate && (
                        <div className="flex items-center justify-between text-slate-500">
                          <span className="font-semibold text-slate-400 uppercase text-[10px]">Expiry:</span>
                          <span className="font-medium text-slate-600">{formatDate(item.expiryDate)}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <button 
                          type="button"
                          onClick={() => handleMarkCompleted(item)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                          <span>Done</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSingleItemCalendarSync(item)}
                          className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"
                          title="Sync to Google Calendar"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Snooze Options */}
                      <div className="relative">
                        <button 
                          type="button"
                          onClick={() => setActiveSnoozeId(activeSnoozeId === item.id ? null : item.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span>Snooze</span>
                        </button>

                        {activeSnoozeId === item.id && (
                          <div 
                            ref={snoozeMenuRef}
                            className="absolute right-0 bottom-full mb-1.5 w-36 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-40 animate-in zoom-in-95 space-y-0.5"
                          >
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-1">Snooze By</p>
                            <button onClick={() => handleSnooze(item, 3)} className="w-full text-left px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
                              +3 Days
                            </button>
                            <button onClick={() => handleSnooze(item, 7)} className="w-full text-left px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
                              +7 Days
                            </button>
                            <button onClick={() => handleSnooze(item, 15)} className="w-full text-left px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
                              +15 Days
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="overflow-auto no-scrollbar flex-1 w-full relative h-full">
            <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
              <thead className="sticky top-0 z-30 bg-slate-100">
                <tr className="bg-slate-50 border-b border-slate-200 shadow-sm font-bold uppercase tracking-wider text-slate-900 text-xs">
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2.5 border-b border-slate-200 w-[55px] text-center whitespace-nowrap">S.No.</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2.5 border-b border-slate-200 w-[24%] min-w-[180px]">Entity Identity</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2.5 border-b border-slate-200 w-[14%] min-w-[120px] whitespace-nowrap">Module</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2.5 border-b border-slate-200 w-[26%] min-w-[200px]">Task Reference</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2.5 border-b border-slate-200 w-[12%] min-w-[110px] whitespace-nowrap">Target Date</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2.5 border-b border-slate-200 w-[12%] min-w-[110px] whitespace-nowrap">Remaining</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2.5 border-b border-slate-200 text-right w-[140px] whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-24 text-center text-slate-400 font-bold uppercase tracking-wider">
                      No Deadlines Matching Selected Filter
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((item, idx) => {
                    const dl = getDaysLeft(item.date);
                    const isOverdue = dl < 0;
                    const isUrgent = dl >= 0 && dl <= getThreshold(item);

                    return (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-slate-50/70 transition-all border-b border-slate-100 last:border-0 ${
                          isOverdue ? 'bg-rose-50/15' : isUrgent ? 'bg-amber-50/15' : ''
                        }`}
                      >
                        <td className="px-3 py-2.5 font-bold text-indigo-400 font-mono text-center whitespace-nowrap">
                          {(idx + 1).toString().padStart(2, '0')}
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-slate-900 truncate min-w-[180px]" title={item.client}>
                          <div className="text-sm font-semibold text-slate-900 truncate">
                            {item.client}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wide border ${
                            item.origin === 'statutory'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : item.origin === 'litigation' 
                              ? 'bg-amber-50 text-amber-700 border-amber-200' 
                              : item.origin === 'food_license'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {item.category}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-medium text-slate-700 truncate" title={item.title}>
                          <span className="text-sm font-medium text-slate-700">
                            {item.title}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="text-xs font-semibold text-slate-900">
                            {formatDate(item.date)}
                          </div>
                          {item.expiryDate && (
                            <p className="text-[11px] font-medium text-slate-500">Exp: {formatDate(item.expiryDate)}</p>
                          )}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {isOverdue ? (
                            <span className="px-2 py-0.5 rounded-lg text-xs font-bold uppercase bg-rose-100 text-rose-700 border border-rose-200 inline-flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-ping" />
                              {item.origin === 'food_license' ? `Expired (${Math.abs(dl)}d)` : `${Math.abs(dl)}d overdue`}
                            </span>
                          ) : isUrgent ? (
                            <span className="px-2 py-0.5 rounded-lg text-xs font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1.5 animate-pulse">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-ping" />
                              {dl}d left {item.origin === 'food_license' ? '(Renewal)' : ''}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-lg text-xs font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              {dl}d left
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Calendar Sync Button */}
                            <button
                              type="button"
                              onClick={() => handleSingleItemCalendarSync(item)}
                              className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-2xs"
                              title="Sync to Google Calendar"
                            >
                              <Calendar className="h-3.5 w-3.5" />
                            </button>

                            {/* Complete Button */}
                            <button 
                              type="button"
                              onClick={() => handleMarkCompleted(item)}
                              className="h-8 px-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-2xs"
                              title="Mark as Completed"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                              <span>Done</span>
                            </button>

                            {/* Snooze Button */}
                            <div className="relative">
                              <button 
                                type="button"
                                onClick={() => setActiveSnoozeId(activeSnoozeId === item.id ? null : item.id)}
                                className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-2xs"
                                title="Snooze Reminder"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              </button>

                              {activeSnoozeId === item.id && (
                                <div 
                                  ref={snoozeMenuRef}
                                  className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-40 animate-in zoom-in-95 space-y-0.5"
                                >
                                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-1">Snooze By</p>
                                  <button onClick={() => handleSnooze(item, 3)} className="w-full text-left px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
                                    +3 Days
                                  </button>
                                  <button onClick={() => handleSnooze(item, 7)} className="w-full text-left px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
                                    +7 Days
                                  </button>
                                  <button onClick={() => handleSnooze(item, 15)} className="w-full text-left px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
                                    +15 Days
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Google Calendar Settings & Batch Sync Modal */}
      <GoogleCalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        deadlinesToSync={deadlinesForCalendarSync}
      />
    </div>
  );
};

export default Reminders;

