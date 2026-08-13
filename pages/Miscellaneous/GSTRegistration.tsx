import React, { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useModuleData } from '../../hooks/useModuleData.ts';
import { GSTRegistrationRecord, GSTRegistrationStatus, GSTRegistrationType } from '../../types';
import { api } from '../../services/api.ts';
import GSTRegistrationForm from '../Clientform/GSTRegistrationForm';
import Loader from '../../components/Loader';
import { TableFilter } from '../../components/TableFilter';
import { toast } from 'sonner';
import { formatDate } from '../../dateUtils.ts';
import { ViewControl } from '../../components/ViewControl';

const GSTRegistration: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<GSTRegistrationRecord | null>(null);
  const [activeStatusRowId, setActiveStatusRowId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [compactMode, setCompactMode] = useState(true);

  const { data: registrations = [], isLoading } = useModuleData<GSTRegistrationRecord[]>('gst_registrations');

  const saveMutation = useMutation({
    mutationFn: (data: Partial<GSTRegistrationRecord>) => api.saveGSTRegistration(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gst_registrations'] });
    },
    onError: () => {
      toast.error("Operation failed.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteGSTRegistration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gst_registrations'] });
      toast.success("Application deleted.");
    },
    onError: () => {
      toast.error("Deletion failed.");
    }
  });

  useEffect(() => {
    const syncHandler = () => {
      queryClient.invalidateQueries({ queryKey: ['gst_registrations'] });
    };
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, [queryClient]);

  const handleInlineUpdate = async (id: string, field: keyof GSTRegistrationRecord, value: any) => {
    const updatedRecord = registrations.find(r => r.id === id);
    if (!updatedRecord) return;
    
    try {
      const newRecord = { ...updatedRecord, [field]: value };
      await saveMutation.mutateAsync(newRecord);
    } catch (err) {
      console.error(err);
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
      (r.mobile && String(r.mobile).includes(s)) || 
      (r.arn && String(r.arn).toLowerCase().includes(s))
    ).sort((a, b) => (new Date(b.appDate || 0).getTime() || 0) - (new Date(a.appDate || 0).getTime() || 0));
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
      deleteMutation.mutate(id);
    }
  };

  const formatDateDisplay = (dateStr?: string) => {
    return formatDate(dateStr);
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
    <div className="flex flex-col h-full space-y-2 landscape:space-y-1 pb-2 overflow-hidden animate-in fade-in duration-500 max-w-full mx-auto w-full">
      
      {/* Compact Counts Strip */}
      <div className="flex flex-wrap items-center justify-between w-full lg:hidden gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-xs text-xs font-bold text-slate-700 shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] uppercase tracking-tight">Total: <strong className="font-black text-slate-900">{stats.total}</strong></span>
          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] uppercase tracking-tight">Applied: <strong className="font-black text-indigo-900">{stats.inProgress}</strong></span>
          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] uppercase tracking-tight">Done: <strong className="font-black text-emerald-900">{stats.completed}</strong></span>
        </div>
      </div>

      {/* Header Search & Count Bar */}
      <div className="flex flex-col lg:flex-row items-center gap-3 bg-white p-2.5 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <span className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-900 text-white shadow-sm flex items-center gap-1.5">
            <span>Portfolio</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-xs font-black">{stats.total}</span>
          </span>
          <span className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 flex items-center gap-1.5">
            <span>Applied</span>
            <span className="px-1.5 py-0.2 rounded-md bg-indigo-200 text-xs font-black">{stats.inProgress}</span>
          </span>
          <span className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 flex items-center gap-1.5">
            <span>Done</span>
            <span className="px-1.5 py-0.2 rounded-md bg-emerald-200 text-xs font-black">{stats.completed}</span>
          </span>
        </div>

        <div className="relative flex-1 w-full group">
          <input type="text" placeholder="Search by Entity Name, Mobile or ARN..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-3 font-bold text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all" />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <ViewControl 
            viewMode={viewMode} 
            onViewChange={setViewMode} 
            compactMode={compactMode} 
            onCompactToggle={() => setCompactMode(!compactMode)} 
          />
          <button 
            onClick={() => { setSelectedRecord(null); setIsFormOpen(true); }}
            className="h-10 px-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:bg-slate-900 transition-all flex items-center gap-1.5 shrink-0"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            Record App
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {viewMode === 'grid' ? (
          <div className="p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredRegistrations.length === 0 ? (
              <div className="col-span-full py-32 text-center text-slate-300 font-black uppercase tracking-widest text-sm">No applications found in tracking</div>
            ) : (
              filteredRegistrations.map((rec, idx) => (
                <div key={rec.id} className="p-3.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl shadow-xs transition-all flex flex-col justify-between space-y-3 relative">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">#{idx + 1}</span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700">{rec.appType}</span>
                    </div>
                    <h4 className="text-xs font-black text-slate-900 truncate" title={rec.clientName}>{rec.clientName}</h4>
                    <p className="text-[10px] font-bold text-slate-500 mb-1">Mob: {rec.mobile || '---'}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">App Date: {formatDateDisplay(rec.appDate)}</p>
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[9px] text-slate-400 uppercase">ARN Status:</span>
                      <div className="relative shrink-0 w-32">
                        <button 
                          onClick={() => setActiveStatusRowId(activeStatusRowId === rec.id ? null : rec.id)}
                          className={`w-full px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all flex items-center justify-between ${getStatusColor(rec.status)}`}
                        >
                          <span className="truncate">{rec.status}</span>
                          <svg className="h-2.5 w-2.5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {activeStatusRowId === rec.id && (
                          <div className="absolute bottom-full mb-1 right-0 left-auto w-36 bg-white border border-slate-200 rounded-xl shadow-2xl p-1 z-50 animate-in zoom-in-95 text-left">
                             {['Pending', 'Data Requested', 'In Progress', 'ARN Generated', 'Completed', 'Rejected'].map(st => (
                               <button key={st} onClick={() => handleInlineUpdate(rec.id, 'status', st as GSTRegistrationStatus)} className="w-full text-left px-2.5 py-1.5 text-[9px] font-black uppercase rounded-lg hover:bg-indigo-50 text-slate-600">{st}</button>
                             ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[9px] text-slate-400 uppercase">ARN ID:</span>
                      <div className="flex items-center gap-1">
                        <input 
                          type="text" 
                          value={rec.arn || ''} 
                          onChange={e => handleInlineUpdate(rec.id, 'arn', e.target.value)}
                          className="bg-slate-50 hover:bg-white focus:bg-white border border-slate-200/80 rounded px-1.5 py-0.5 text-[10px] font-bold font-mono tracking-wider w-24 outline-none h-5"
                          placeholder="ARN..."
                        />
                        {rec.arn && (
                          <button onClick={() => { navigator.clipboard.writeText(rec.arn || ''); toast.success('ARN Copied!'); window.open('https://services.gst.gov.in/services/searchtp', '_blank'); }} className="p-0.5 text-slate-400 hover:text-indigo-600 transition-colors inline-flex" title="Search ARN">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{rec.arn ? 'Tracking Active' : 'Drafting Stage'}</span>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => { setSelectedRecord(rec); setIsFormOpen(true); }} className="p-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-white hover:border-indigo-200 transition-all" title="Edit Record">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(rec.id)} className="p-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-white hover:border-red-200 transition-all" title="Delete Record">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="overflow-auto no-scrollbar flex-1 w-full relative h-full">
            <table className={`w-full text-left border-collapse table-auto min-w-full compact-table ${compactMode ? 'compact-mode' : ''}`}>
              <thead className="sticky top-0 z-30 bg-slate-100">
                <tr className="bg-slate-50 border-b border-slate-200 shadow-sm">
                  <th className="sticky top-0 z-30 bg-slate-100 px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200">S.No.</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200">Entity Identity</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200">Mobile</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200">Application Type</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200 text-center min-w-[150px]">
                    <div className="flex justify-center flex-col items-center">
                      <TableFilter label="Status" isActive={statusFilter !== 'All'}>
                         {['All', 'Pending', 'Data Requested', 'In Progress', 'ARN Generated', 'Completed', 'Rejected'].map(st => (
                           <button key={st} onClick={() => setStatusFilter(st)} className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase rounded-lg ${statusFilter === st ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{st}</button>
                         ))}
                      </TableFilter>
                    </div>
                  </th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200">App Date</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200">ARN Identity</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRegistrations.length === 0 ? (
                  <tr><td colSpan={8} className=" py-32 text-center text-slate-300 font-black uppercase tracking-[0.2em] text-sm">No applications found in tracking</td></tr>
                ) : (
                  filteredRegistrations.map((rec, idx) => (
                    <tr key={rec.id} className="hover:bg-slate-50/50 transition-all group text-[12px]">
                      <td className=" px-4 py-2.5 text-slate-300 font-black">{(idx + 1).toString().padStart(2, '0')}</td>
                      <td className=" px-4 py-2.5">
                         <p className="font-black text-slate-900 uppercase leading-snug" title={rec.clientName}>{rec.clientName}</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{rec.arn ? 'Tracking Active' : 'Drafting Stage'}</p>
                      </td>
                      <td className=" px-4 py-2.5 font-black text-slate-600">{rec.mobile || '---'}</td>
                      <td className=" px-4 py-2.5">
                         <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-100">{rec.appType}</span>
                      </td>
                      <td className=" px-4 py-2.5 text-center relative overflow-visible">
                          <button 
                            onClick={() => setActiveStatusRowId(activeStatusRowId === rec.id ? null : rec.id)}
                            className={`w-full px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-between ${getStatusColor(rec.status)}`}
                          >
                            <span className="truncate">{rec.status}</span>
                            <svg className="h-3 w-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                          </button>
                          {activeStatusRowId === rec.id && (
                            <div className="absolute top-full mt-1 z-50 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl p-1 animate-in zoom-in-95 text-left">
                               {['Pending', 'Data Requested', 'In Progress', 'ARN Generated', 'Completed', 'Rejected'].map(st => (
                                 <button key={st} onClick={() => handleInlineUpdate(rec.id, 'status', st as GSTRegistrationStatus)} className="w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg hover:bg-indigo-50 text-slate-600">{st}</button>
                               ))}
                            </div>
                          )}
                      </td>
                      <td className=" px-4 py-2.5 font-black text-slate-500 uppercase">{formatDateDisplay(rec.appDate)}</td>
                      <td className=" px-4 py-2.5">
                         <input 
                           type="text" 
                           value={rec.arn || ''} 
                           onChange={e => handleInlineUpdate(rec.id, 'arn', e.target.value)}
                           className="w-full bg-transparent border-none focus:bg-white focus:ring-4 focus:ring-indigo-50 rounded-lg px-2 py-1.5 font-black text-indigo-600 font-mono tracking-widest uppercase transition-all"
                           placeholder="AA0000..."
                         />
                      </td>
                      <td className="px-4 py-2.5 text-right ">
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
        )}
      </div>

      <GSTRegistrationForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSave={async (data) => {
          await saveMutation.mutateAsync(data);
          setIsFormOpen(false);
        }} 
        initialData={selectedRecord} 
      />
    </div>
  );
};

export default GSTRegistration;
