import React, { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useModuleData } from '../../hooks/useModuleData.ts';
import { MiscWorkRecord, MiscWorkStatus } from '../../types';
import { api } from '../../services/api.ts';
import WorkForm from '../Clientform/workForm';
import Loader from '../../components/Loader';
import { TableFilter } from '../../components/TableFilter';
import { toast } from 'sonner';
import { formatDate as formatDateUtil } from '../../dateUtils.ts';
import { ViewControl } from '../../components/ViewControl';

const Miscellaneouswork: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MiscWorkRecord | null>(null);
  const [activeStatusRowId, setActiveStatusRowId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [compactMode, setCompactMode] = useState(false);

  const { data: records = [], isLoading } = useModuleData<MiscWorkRecord[]>('misc_work');

  const saveMutation = useMutation({
    mutationFn: (data: Partial<MiscWorkRecord>) => api.saveMiscWork(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['misc_work'] });
    },
    onError: () => {
      toast.error("Operation failed.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteMiscWork(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['misc_work'] });
      toast.success("Record deleted.");
    },
    onError: () => {
      toast.error("Deletion failed.");
    }
  });

  useEffect(() => {
    const syncHandler = () => {
      queryClient.invalidateQueries({ queryKey: ['misc_work'] });
    };
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, [queryClient]);

  const handleInlineUpdate = async (id: string, field: keyof MiscWorkRecord, value: any) => {
    const updatedRecord = records.find(r => r.id === id);
    if (!updatedRecord) return;
    
    try {
      const newRecord = { ...updatedRecord, [field]: value };
      await saveMutation.mutateAsync(newRecord);
    } catch (err) {
      console.error(err);
    }
    setActiveStatusRowId(null);
  };

  const filteredRecords = useMemo(() => {
    let list = records;
    if (statusFilter === 'Pending' || statusFilter === 'In Progress') {
      list = list.filter(r => r.status !== 'Completed');
    } else if (statusFilter === 'Completed') {
      list = list.filter(r => r.status === 'Completed');
    } else if (statusFilter !== 'All') {
      list = list.filter(r => r.status === statusFilter);
    }
    const s = search.toLowerCase();
    return list.filter(r => 
      (r.clientName || '').toLowerCase().includes(s) || 
      (String(r.description || '')).toLowerCase().includes(s) ||
      (String(r.assignedTo || '')).toLowerCase().includes(s)
    ).sort((a, b) => (new Date(b.startDate || 0).getTime() || 0) - (new Date(a.startDate || 0).getTime() || 0));
  }, [records, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: records.length,
      completed: records.filter(r => r.status === 'Completed').length,
      pending: records.filter(r => r.status !== 'Completed').length
    };
  }, [records]);

  const handleDelete = async (id: string) => {
    if (confirm('Delete this work item from the vault permanently?')) {
      deleteMutation.mutate(id);
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
    return formatDateUtil(dateStr);
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-2 landscape:space-y-1 pb-2 overflow-hidden animate-in fade-in duration-500 max-w-full mx-auto w-full">
      
      {/* Header Search & Count Bar */}
      <div className="flex flex-col lg:flex-row items-center gap-2.5 bg-white p-2.5 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0 w-full">
        {/* Search input */}
        <div className="relative flex-1 w-full min-w-[200px] group">
          <input 
            type="text" 
            placeholder="Search by Client, Task Description or Staff Assigned..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-2 pl-9 pr-8 font-bold text-[var(--app-font-size)] text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all" 
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full hover:bg-slate-200"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {/* Count Filter Buttons */}
        <div className="flex items-center gap-1.5 shrink-0 flex-nowrap overflow-x-auto no-scrollbar max-w-full py-0.5">
          <button
            type="button"
            onClick={() => setStatusFilter('All')}
            className={`px-2.5 py-1 rounded-xl text-[var(--app-font-size)] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap border cursor-pointer ${
              statusFilter === 'All' 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Queue</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[calc(var(--app-font-size)-1px)] font-bold ${
              statusFilter === 'All' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-800'
            }`}>
              {stats.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Pending')}
            className={`px-2.5 py-1 rounded-xl text-[var(--app-font-size)] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 border cursor-pointer ${
              statusFilter === 'Pending' || statusFilter === 'In Progress'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs' 
                : 'bg-amber-50/70 text-amber-800 border-amber-200 hover:bg-amber-100/80'
            }`}
          >
            <span>Pending</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[calc(var(--app-font-size)-1px)] font-bold ${
              statusFilter === 'Pending' || statusFilter === 'In Progress' ? 'bg-amber-500 text-white' : 'bg-amber-200 text-amber-900'
            }`}>
              {stats.pending}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Completed')}
            className={`px-2.5 py-1 rounded-xl text-[var(--app-font-size)] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 border cursor-pointer ${
              statusFilter === 'Completed'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                : 'bg-emerald-50/70 text-emerald-800 border-emerald-200 hover:bg-emerald-100/80'
            }`}
          >
            <span>Completed</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[calc(var(--app-font-size)-1px)] font-bold ${
              statusFilter === 'Completed' ? 'bg-emerald-500 text-white' : 'bg-emerald-200 text-emerald-900'
            }`}>
              {stats.completed}
            </span>
          </button>
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
            className="h-10 px-4 bg-indigo-600 text-white rounded-xl font-bold text-[var(--app-font-size)] uppercase tracking-wider shadow-md hover:bg-slate-900 transition-all flex items-center gap-1.5 shrink-0"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            Log Work Item
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {viewMode === 'grid' ? (
          <div className="p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredRecords.length === 0 ? (
              <div className="col-span-full py-8 text-center text-slate-400 font-bold uppercase tracking-wider text-[var(--app-font-size)]">
                No miscellaneous tasks archived
              </div>
            ) : (
              filteredRecords.map((rec, idx) => (
                <div key={rec.id} className="p-3.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl shadow-xs transition-all flex flex-col justify-between space-y-3 relative">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[calc(var(--app-font-size)-1.5px)] font-bold uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">#{idx + 1}</span>
                      <span className="text-[calc(var(--app-font-size)-1.5px)] font-bold text-slate-400 uppercase">Logged: {formatDate(rec.startDate)}</span>
                    </div>
                    <h4 className="text-[var(--app-font-size)] font-bold text-slate-800 truncate" title={rec.clientName}>{rec.clientName || '---'}</h4>
                    <p className="text-[calc(var(--app-font-size)-1.5px)] font-normal text-slate-500">Mob: {rec.mobile || '---'}</p>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 space-y-2 text-[var(--app-font-size)]">
                    <div className="flex flex-col space-y-0.5">
                      <span className="font-bold text-[calc(var(--app-font-size)-1.5px)] text-slate-400 uppercase">Task Description:</span>
                      <input 
                        type="text" 
                        value={rec.description || ''} 
                        onChange={e => handleInlineUpdate(rec.id, 'description', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded px-1.5 py-1 text-[var(--app-font-size)] font-bold text-slate-800 outline-none uppercase"
                        placeholder="Description..."
                      />
                    </div>

                    <div className="flex flex-col space-y-0.5">
                      <span className="font-bold text-[calc(var(--app-font-size)-1.5px)] text-slate-400 uppercase">Staff Assigned:</span>
                      <input 
                        type="text" 
                        value={rec.assignedTo || ''} 
                        onChange={e => handleInlineUpdate(rec.id, 'assignedTo', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded px-1.5 py-1 text-[var(--app-font-size)] font-bold text-slate-600 outline-none uppercase"
                        placeholder="Unassigned"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 relative overflow-visible">
                    <div className="relative">
                      <button 
                        onClick={() => setActiveStatusRowId(activeStatusRowId === rec.id ? null : rec.id)}
                        className={`px-2 py-1 rounded-full text-[calc(var(--app-font-size)-1.5px)] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${getStatusColor(rec.status)}`}
                      >
                        <span>{rec.status}</span>
                        <svg className="h-2.5 w-2.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      {activeStatusRowId === rec.id && (
                        <div className="absolute bottom-full mb-1 left-0 z-50 w-28 bg-white border border-slate-200 rounded-xl shadow-2xl p-1 text-left animate-in zoom-in-95">
                           {['Pending', 'In Progress', 'Completed', 'On Hold'].map(st => (
                             <button key={st} onClick={() => handleInlineUpdate(rec.id, 'status', st as MiscWorkStatus)} className="w-full text-left px-2 py-1.5 text-[var(--app-font-size)] font-bold uppercase rounded-lg hover:bg-indigo-50 text-slate-600">{st}</button>
                           ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button onClick={() => { setSelectedRecord(rec); setIsFormOpen(true); }} className="p-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-white hover:border-indigo-200 transition-all" title="Edit Entry">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(rec.id)} className="p-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-white hover:border-red-200 transition-all" title="Delete Entry">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="w-full overflow-x-auto overflow-y-auto no-scrollbar flex-1 relative h-full">
            <table className={`w-full text-left border-collapse table-auto min-w-[950px] misc-work-table gst-portfolio-table ${compactMode ? 'compact-mode' : ''}`}>
              <thead className="sticky top-0 z-30 bg-slate-100">
                <tr className="bg-slate-50 border-b border-slate-200 shadow-sm">
                  <th className="sticky top-0 z-30 bg-slate-100 px-2 py-2.5 text-[var(--table-header-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 whitespace-nowrap w-12">S.No.</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-2 py-2.5 text-[var(--table-header-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 min-w-[180px]">Entity Identity</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-2 py-2.5 text-[var(--table-header-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 min-w-[200px]">Task Description</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-2 py-2.5 text-[var(--table-header-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 text-center min-w-[150px] whitespace-nowrap">
                    <div className="flex justify-center flex-col items-center">
                      <TableFilter label="Status" isActive={statusFilter !== 'All'}>
                         {['All', 'Pending', 'In Progress', 'Completed', 'On Hold'].map(st => (
                           <button key={st} onClick={() => setStatusFilter(st)} className={`w-full text-left px-3 py-2 text-[var(--table-font-size)] font-bold uppercase rounded-lg ${statusFilter === st ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{st}</button>
                         ))}
                      </TableFilter>
                    </div>
                  </th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-2 py-2.5 text-[var(--table-header-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 min-w-[130px] whitespace-nowrap">Staff Head</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-2 py-2.5 text-[var(--table-header-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 min-w-[110px] whitespace-nowrap">Logged Date</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-2 py-2.5 text-[var(--table-header-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 text-right min-w-[90px] whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-bold uppercase tracking-wider text-[var(--table-font-size)]">
                      No miscellaneous tasks archived
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec, idx) => (
                    <tr key={rec.id} className="hover:bg-indigo-50/20 transition-all group text-[var(--table-font-size)] border-b border-slate-100">
                      <td className="px-2 py-2.5 font-bold text-slate-400 whitespace-nowrap">{(idx + 1).toString().padStart(2, '0')}</td>
                      <td className="px-2 py-2.5">
                         <p className="font-bold text-slate-800 uppercase leading-snug text-[var(--table-font-size)]" title={rec.clientName}>{rec.clientName}</p>
                         <p className="sub-text text-slate-500 uppercase mt-0.5 text-[calc(var(--table-font-size)-1.5px)] font-medium">Mob: {rec.mobile || 'No Mobile'}</p>
                      </td>
                      <td className="px-2 py-2.5">
                         <input 
                           type="text" 
                           value={rec.description || ''} 
                           onChange={e => handleInlineUpdate(rec.id, 'description', e.target.value)}
                           className="w-full bg-transparent border-none focus:bg-white focus:ring-4 focus:ring-indigo-50 rounded-lg px-2 py-1.5 font-medium text-slate-800 transition-all uppercase text-[var(--table-font-size)]"
                           placeholder="Description..."
                         />
                      </td>
                      <td className="px-2 py-2.5 text-center relative overflow-visible whitespace-nowrap">
                          <button 
                            onClick={() => setActiveStatusRowId(activeStatusRowId === rec.id ? null : rec.id)}
                            className={`w-full px-2.5 py-1.5 rounded-full text-[var(--table-font-size)] font-bold uppercase tracking-wider border transition-all flex items-center justify-between ${getStatusColor(rec.status)}`}
                          >
                            <span className="truncate">{rec.status}</span>
                            <svg className="h-3 w-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                          </button>
                          {activeStatusRowId === rec.id && (
                            <div className="absolute top-full mt-1 z-50 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl p-1 animate-in zoom-in-95 text-left">
                               {['Pending', 'In Progress', 'Completed', 'On Hold'].map(st => (
                                 <button key={st} onClick={() => handleInlineUpdate(rec.id, 'status', st as MiscWorkStatus)} className="w-full text-left px-3 py-2 text-[var(--table-font-size)] font-bold uppercase rounded-lg hover:bg-indigo-50 text-slate-600">{st}</button>
                               ))}
                            </div>
                          )}
                      </td>
                      <td className="px-2 py-2.5 whitespace-nowrap">
                         <input 
                           type="text" 
                           value={rec.assignedTo || ''} 
                           onChange={e => handleInlineUpdate(rec.id, 'assignedTo', e.target.value)}
                           className="w-full bg-transparent border-none focus:bg-white focus:ring-4 focus:ring-indigo-50 rounded-lg px-2 py-1.5 font-medium text-slate-700 uppercase transition-all text-[var(--table-font-size)]"
                           placeholder="Unassigned"
                         />
                      </td>
                      <td className="px-2 py-2.5 font-medium text-slate-700 uppercase text-[var(--table-font-size)] whitespace-nowrap">{formatDate(rec.startDate)}</td>
                      <td className="px-2 py-2.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
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

      <WorkForm  
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

export default Miscellaneouswork;
