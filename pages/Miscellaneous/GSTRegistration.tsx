import React, { useState, useEffect, useMemo } from 'react';
import { GSTRegistrationRecord, GSTRegistrationStatus, GSTRegistrationType, Client } from '../../types';
import { api } from '../../services/api.ts';
import GSTRegistrationForm from '../Clientform/GSTRegistrationForm';
import Loader from '../../components/Loader';
import { toast } from 'sonner';


const GSTRegistration: React.FC = () => {
  const [registrations, setRegistrations] = useState<GSTRegistrationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<GSTRegistrationRecord | null>(null);
  const [activeStatusRowId, setActiveStatusRowId] = useState<string | null>(null);

  const fetchRegistrations = async () => {
    setIsLoading(true);
    try {
      const data = await api.getGSTRegistrations();
      setRegistrations(data);
    } catch (err) {
      console.error("GST Reg Sync Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleInlineUpdate = async (id: string, field: keyof GSTRegistrationRecord, value: any) => {
    const updatedRecord = registrations.find(r => r.id === id);
    if (!updatedRecord) return;
    
    try {
      const newRecord = { ...updatedRecord, [field]: value };
      await api.saveGSTRegistration(newRecord);
      setRegistrations(prev => prev.map(r => r.id === id ? newRecord : r));
    } catch (err) {
      toast.error("Cloud update failed.");
    }
    setActiveStatusRowId(null);
  };

  const filteredRegistrations = useMemo(() => {
    let list = registrations;
    if (statusFilter !== 'All') {
      list = list.filter(r => r.status === statusFilter);
    }
    const s = search.toLowerCase();
    return list.filter(r => 
      (r.clientName || '').toLowerCase().includes(s) || 
      (r.mobile && r.mobile.includes(s)) || 
      (r.arn && r.arn.toLowerCase().includes(s))
    ).sort((a, b) => new Date(b.appDate).getTime() - new Date(a.appDate).getTime());
  }, [registrations, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: registrations.length,
      completed: registrations.filter(r => r.status === 'Completed').length,
      inProgress: registrations.filter(r => ['In Progress', 'ARN Generated'].includes(r.status)).length
    };
  }, [registrations]);

  const handleDelete = async (id: string) => {
    if (confirm('Permanently delete this application record from the vault?')) {
      try {
        await api.deleteGSTRegistration(id);
        fetchRegistrations();
      } catch (err) {
        toast.error("Deletion failed.");
      }
    }
  };

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '---';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    return `${d}-${m}-${y}`;
  };

  const getStatusColor = (st: GSTRegistrationStatus) => {
    switch (st) {
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm';
      case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'In Progress': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ARN Generated': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Data Requested': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 max-w-full mx-auto w-full overflow-hidden">
      
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Apps</p>
            <p className="text-xl font-black text-slate-900 leading-none">{stats.total}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">In Process</p>
            <p className="text-xl font-black text-indigo-600 leading-none">{stats.inProgress}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Done</p>
            <p className="text-xl font-black text-emerald-600 leading-none">{stats.completed}</p>
          </div>
        </div>

        <div className="relative flex-1 w-full group">
          <input type="text" placeholder="Search by Entity Name, Mobile or ARN..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3.5 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-4 focus:ring-indigo-50 outline-none transition-all" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <button 
          onClick={() => { setSelectedRecord(null); setIsFormOpen(true); }}
          className="bg-indigo-600 text-white font-black uppercase tracking-widest px-8 h-12 rounded-xl shadow-lg hover:bg-slate-900 transition-all text-xs flex items-center gap-2 shrink-0"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
          Record Application
        </button>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse table-fixed min-w-[1400px]">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[70px]">S.No.</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[240px]">Entity Identity</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[140px]">Mobile</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[180px]">Application Type</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center w-[180px] relative">
                  <button onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)} className="flex items-center justify-center gap-1 w-full uppercase">
                    Status <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {isStatusFilterOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 animate-in zoom-in-95">
                       {['All', 'Pending', 'Data Requested', 'In Progress', 'ARN Generated', 'Completed', 'Rejected'].map(st => (
                         <button key={st} onClick={() => { setStatusFilter(st); setIsStatusFilterOpen(false); }} className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase rounded-lg ${statusFilter === st ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{st}</button>
                       ))}
                    </div>
                  )}
                </th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[140px]">App Date</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[200px]">ARN Identity</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRegistrations.length === 0 ? (
                <tr><td colSpan={8} className="py-32 text-center text-slate-300 font-black uppercase tracking-[0.2em] text-sm">No applications found in tracking</td></tr>
              ) : (
                filteredRegistrations.map((rec, idx) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 transition-all group text-[12px]">
                    <td className="px-6 py-5 text-slate-300 font-black">{(idx + 1).toString().padStart(2, '0')}</td>
                    <td className="px-6 py-5">
                       <p className="font-black text-slate-900 uppercase truncate" title={rec.clientName}>{rec.clientName}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase truncate mt-0.5">{rec.arn ? 'Tracking Active' : 'Drafting Stage'}</p>
                    </td>
                    <td className="px-6 py-5 font-black text-slate-600">{rec.mobile || '---'}</td>
                    <td className="px-6 py-5">
                       <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-100">{rec.appType}</span>
                    </td>
                    <td className="px-6 py-5 text-center relative overflow-visible">
                        <button 
                          onClick={() => setActiveStatusRowId(activeStatusRowId === rec.id ? null : rec.id)}
                          className={`w-full px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-between ${getStatusColor(rec.status)}`}
                        >
                          <span className="truncate">{rec.status}</span>
                          <svg className="h-3 w-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {activeStatusRowId === rec.id && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-1 animate-in zoom-in-95 text-left">
                             {['Pending', 'Data Requested', 'In Progress', 'ARN Generated', 'Completed', 'Rejected'].map(st => (
                               <button key={st} onClick={() => handleInlineUpdate(rec.id, 'status', st)} className="w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg hover:bg-indigo-50 text-slate-600">{st}</button>
                             ))}
                          </div>
                        )}
                    </td>
                    <td className="px-6 py-5 font-black text-slate-500 uppercase">{formatDateDisplay(rec.appDate)}</td>
                    <td className="px-6 py-5">
                       <input 
                         type="text" 
                         value={rec.arn || ''} 
                         onChange={e => handleInlineUpdate(rec.id, 'arn', e.target.value.toUpperCase())}
                         className="w-full bg-transparent border-none focus:bg-white focus:ring-4 focus:ring-indigo-50 rounded-lg px-2 py-1.5 font-black text-indigo-600 font-mono tracking-widest uppercase transition-all"
                         placeholder="AA0000..."
                       />
                    </td>
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

      <GSTRegistrationForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSave={async (data) => {
          await api.saveGSTRegistration(data);
          setIsFormOpen(false);
          fetchRegistrations();
        }} 
        initialData={selectedRecord} 
      />
    </div>
  );
};

export default GSTRegistration;