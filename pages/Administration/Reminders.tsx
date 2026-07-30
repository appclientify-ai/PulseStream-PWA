import React, { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useModuleData } from '../../hooks/useModuleData.ts';
import { LitigationRecord, MiscWorkRecord } from '../../types';
import { api } from '../../services/api.ts';
import Loader from '../../components/Loader';
import { formatDate } from '../../dateUtils.ts';

interface UnifiedDeadline {
  id: string;
  title: string;
  client: string;
  date: string;
  category: 'NOTICE' | 'APPEAL' | 'TRIBUNAL' | 'HIGHCOURT' | 'MISC WORK';
  priority: 'High' | 'Medium' | 'Low';
  status: string;
  origin: 'litigation' | 'work';
}

const Reminders: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'Litigation' | 'Misc Work'>('All');

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

  const deadlines = reminderData || [];
  const totalDeadlines = allReminderData || deadlines;

  const getDaysLeft = (dueDate: string) => {
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = due.getTime() - now.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  };

  const stats = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return {
      total: totalDeadlines.length,
      overdue: totalDeadlines.filter(d => new Date(d.date) < now).length,
      litigation: totalDeadlines.filter(d => d.origin === 'litigation').length,
      misc: totalDeadlines.filter(d => d.origin === 'work').length
    };
  }, [totalDeadlines]);

  const filteredRecords = useMemo(() => {
    const s = search.toLowerCase();
    return deadlines.filter(d => 
      d.client.toLowerCase().includes(s) || 
      d.title.toLowerCase().includes(s) || 
      d.category.toLowerCase().includes(s)
    );
  }, [deadlines, search]);

  if (isLoading && !reminderData) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 max-w-full mx-auto w-full overflow-hidden">
      
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center justify-between sm:justify-start gap-4 md:gap-6 px-3 py-1.5 border-b md:border-b-0 md:border-r border-slate-100 shrink-0 w-full md:w-auto overflow-x-auto no-scrollbar">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
            <p className="text-lg md:text-xl font-black text-slate-900 leading-none">{stats.total}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-4 md:pl-6">
            <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">Overdue</p>
            <p className="text-lg md:text-xl font-black text-red-600 leading-none">{stats.overdue}</p>
          </div>
        </div>

        <div className="relative flex-1 w-full group">
          <input 
            type="text" 
            placeholder="Search deadlines by client or case ref..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all" 
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
          {['All', 'Litigation', 'Misc Work'].map(f => (
            <button key={f} onClick={() => setFilter(f as any)}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${filter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse table-auto overflow-hidden min-w-full">
            <thead className=" sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className=" px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">S. No.</th>
                <th className=" px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Entity Identity</th>
                <th className=" px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Module</th>
                <th className=" px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Task Reference</th>
                <th className=" px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Target Date</th>
                <th className=" px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Remaining</th>
                <th className=" px-4 py-5 text-[11px] font-black uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((item, idx) => {
                const dl = getDaysLeft(item.date);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className=" px-4 py-5 text-[11px] font-black text-slate-300">{(idx + 1).toString().padStart(2, '0')}</td>
                    <td className=" px-4 py-5 font-black text-slate-900 uppercase truncate">{item.client}</td>
                    <td className=" px-4 py-5">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${item.origin === 'litigation' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{item.category}</span>
                    </td>
                    <td className=" px-4 py-5 font-bold text-slate-500 uppercase truncate">{item.title}</td>
                    <td className=" px-4 py-5 font-black text-slate-700 uppercase">{formatDate(item.date)}</td>
                    <td className=" px-4 py-5">
                       <span className={`text-[11px] font-black ${dl < 0 ? 'text-red-600' : dl <= 7 ? 'text-orange-600' : 'text-slate-600'}`}>
                          {dl < 0 ? `${Math.abs(dl)} days overdue` : `${dl} days left`}
                       </span>
                    </td>
                    <td className="px-4 py-5 text-right ">
                       <button onClick={() => queryClient.invalidateQueries({ queryKey: ['reminders_data'] })} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 flex items-center justify-center transition-all">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                       </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reminders;
