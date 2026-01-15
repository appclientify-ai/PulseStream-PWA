
import React, { useState, useEffect, useMemo } from 'react';
import { MiscWorkRecord, MiscWorkStatus } from '../../types';
import { api } from '../../services/api.ts';
import WorkForm from '../Clientform/workForm';
import Loader from '../../components/Loader';
import { ModuleStatCard } from '../../components/DashboardUI';

const Miscellaneouswork: React.FC = () => {
  const [records, setRecords] = useState<MiscWorkRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MiscWorkRecord | null>(null);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const data = await api.getMiscWork();
      setRecords(data);
    } catch (err) {
      console.error("Misc Work Sync Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const filteredRecords = useMemo(() => {
    const s = search.toLowerCase();
    return records.filter(r => 
      (r.clientName || '').toLowerCase().includes(s) || 
      (r.description || '').toLowerCase().includes(s) ||
      (r.assignedTo || '').toLowerCase().includes(s)
    ).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [records, search]);

  const stats = useMemo(() => {
    return {
      total: records.length,
      completed: records.filter(r => r.status === 'Completed').length,
      pending: records.filter(r => r.status !== 'Completed').length
    };
  }, [records]);

  const handleDelete = async (id: string) => {
    if (confirm('Delete this work item from the vault permanently?')) {
      try {
        await api.deleteMiscWork(id);
        fetchRecords();
      } catch (err) {
        alert("Deletion failed.");
      }
    }
  };

  const getStatusColor = (st: MiscWorkStatus) => {
    switch (st) {
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm';
      case 'In Progress': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'On Hold': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    return dateStr.split('-').reverse().join('-');
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-8 animate-in fade-in duration-500 max-w-full mx-auto w-full overflow-hidden">
      
      {/* Summary Section - Dashboard UI Style */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ModuleStatCard 
              title="Work Pipeline" 
              icon="💼" 
              stats={[
                  { label: 'Assigned Tasks', value: stats.total },
                  { label: 'Queue Load', value: 'Moderate' }
              ]}
          />
          <ModuleStatCard 
              title="Task Velocity" 
              icon="⚡" 
              stats={[
                  { label: 'Done', value: stats.completed, color: 'text-emerald-600' },
                  { label: 'Ratio', value: `${Math.round((stats.completed/stats.total)*100 || 0)}%` }
              ]}
              chartData={{ value: stats.completed, total: stats.total }}
          />
          <ModuleStatCard 
              title="Active Load" 
              icon="⏳" 
              stats={[
                  { label: 'In Process', value: stats.pending, color: 'text-amber-600' },
                  { label: 'Sync Status', value: 'Active' }
              ]}
          />
      </section>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="relative flex-1 w-full group">
          <input type="text" placeholder="Search by Client, Task Description or Staff Assigned..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3.5 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-4 focus:ring-indigo-50 outline-none transition-all" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <button onClick={() => { setSelectedRecord(null); setIsFormOpen(true); }} className="bg-indigo-600 text-white font-black uppercase tracking-widest px-8 h-12 rounded-xl shadow-lg hover:bg-slate-900 transition-all text-xs flex items-center gap-2 shrink-0">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
          Log Work Item
        </button>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[70px]">S.No.</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[240px]">Entity Identity</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[300px]">Task Description</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center w-[160px]">Status</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[140px]">Staff Head</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[130px]">Logged Date</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right w-[110px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr><td colSpan={7} className="py-32 text-center text-slate-300 font-black uppercase tracking-widest text-sm">No miscellaneous tasks archived</td></tr>
              ) : (
                filteredRecords.map((rec, idx) => (
                  <tr key={rec.id} className="hover:bg-indigo-50/20 transition-all group text-[12px]">
                    <td className="px-6 py-5 text-slate-300 font-black">{(idx + 1).toString().padStart(2, '0')}</td>
                    <td className="px-6 py-5">
                       <p className="font-black text-slate-900 uppercase truncate" title={rec.clientName}>{rec.clientName}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase truncate mt-0.5">{rec.mobile || 'No Mobile'}</p>
                    </td>
                    <td className="px-6 py-5 font-bold text-slate-600 uppercase truncate" title={rec.description}>{rec.description}</td>
                    <td className="px-6 py-5 text-center">
                       <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(rec.status)}`}>
                         {rec.status}
                       </span>
                    </td>
                    <td className="px-6 py-5 font-black text-slate-500 uppercase truncate">{rec.assignedTo || 'Unassigned'}</td>
                    <td className="px-6 py-5 font-black text-slate-400 uppercase">{formatDate(rec.startDate)}</td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                         <button onClick={() => { setSelectedRecord(rec); setIsFormOpen(true); }} className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center shadow-sm">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                         </button>
                         <button onClick={() => handleDelete(rec.id)} className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-red-600 transition-all flex items-center justify-center shadow-sm">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                         </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <WorkForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSave={async (data) => {
          await api.saveMiscWork(data);
          setIsFormOpen(false);
          fetchRecords();
        }} 
        initialData={selectedRecord} 
      />
    </div>
  );
};

export default Miscellaneouswork;
