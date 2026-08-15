import React, { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useModuleData } from '../../hooks/useModuleData.ts';
import { FoodLicenseRecord, FoodLicenseStatus } from '../../types';
import { api } from '../../services/api.ts';
import FoodLicensesForm from '../Clientform/FoodLicensesForm';
import Loader from '../../components/Loader';
import { TableFilter } from '../../components/TableFilter';
import { toast } from 'sonner';
import { formatDate as formatDateUtil, calculateRenewalDueDate } from '../../dateUtils.ts';
import { ViewControl } from '../../components/ViewControl';

const FoodLicenses: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FoodLicenseRecord | null>(null);
  const [activeStatusRowId, setActiveStatusRowId] = useState<string | null>(null);
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [compactMode, setCompactMode] = useState(true);

  const { data: records = [], isLoading } = useModuleData<FoodLicenseRecord[]>('food_licenses');

  const saveMutation = useMutation({
    mutationFn: (data: Partial<FoodLicenseRecord>) => api.saveFoodLicense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food_licenses'] });
    },
    onError: () => {
      toast.error("Operation failed.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteFoodLicense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food_licenses'] });
      toast.success("Record deleted.");
    },
    onError: () => {
      toast.error("Deletion failed.");
    }
  });

  useEffect(() => {
    const syncHandler = () => {
      queryClient.invalidateQueries({ queryKey: ['food_licenses'] });
    };
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, [queryClient]);

  const handleInlineUpdate = async (id: string, field: keyof FoodLicenseRecord, value: any) => {
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
    const todayStr = new Date().toISOString().split('T')[0];
    if (statusFilter === 'Renewal Due') {
      list = list.filter(r => {
        const due = r.dueDate || calculateRenewalDueDate(r.expiryDate);
        return due && due <= todayStr && r.status !== 'Rejected';
      });
    } else if (statusFilter === 'Applied' || statusFilter === 'In Progress' || statusFilter === 'Pending') {
      list = list.filter(r => r.status !== 'Completed' && r.status !== 'Rejected');
    } else if (statusFilter === 'Completed' || statusFilter === 'Active') {
      list = list.filter(r => r.status === 'Completed');
    } else if (statusFilter !== 'All') {
      list = list.filter(r => r.status === statusFilter);
    }
    const s = search.toLowerCase();
    return list.filter(r => 
      (r.tradeName || '').toLowerCase().includes(s) || 
      (r.legalName || '').toLowerCase().includes(s) || 
      (r.clientName || '').toLowerCase().includes(s) || 
      (r.mobile && String(r.mobile).includes(s)) || 
      (r.licenseNo && String(r.licenseNo).toLowerCase().includes(s)) ||
      (r.password && String(r.password).toLowerCase().includes(s))
    ).sort((a, b) => (new Date(b.appDate || 0).getTime() || 0) - (new Date(a.appDate || 0).getTime() || 0));
  }, [records, search, statusFilter]);

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return {
      total: records.length,
      active: records.filter(r => r.status === 'Completed').length,
      pending: records.filter(r => r.status !== 'Completed' && r.status !== 'Rejected').length,
      renewalDue: records.filter(r => {
        const due = r.dueDate || calculateRenewalDueDate(r.expiryDate);
        return due && due <= todayStr && r.status !== 'Rejected';
      }).length
    };
  }, [records]);

  const handleDelete = async (id: string) => {
    if (confirm('Permanently remove this FSSAI record from the vault?')) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusStyle = (st: FoodLicenseStatus) => {
    switch (st) {
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
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
            placeholder="Search by Client, Mobile or FSSAI License Number..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-2 pl-9 pr-8 font-bold text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600/10 outline-none transition-all" 
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
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
        <div className="flex flex-wrap items-center gap-1.5 shrink-0 py-0.5">
          <button
            type="button"
            onClick={() => setStatusFilter('All')}
            className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 border cursor-pointer ${
              statusFilter === 'All' 
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Total</span>
            <span className={`px-1.5 py-0.2 rounded-md text-xs font-black ${
              statusFilter === 'All' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-800'
            }`}>
              {stats.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Applied')}
            className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 border cursor-pointer ${
              statusFilter === 'Applied' || statusFilter === 'Pending' || statusFilter === 'In Progress'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs' 
                : 'bg-amber-50/70 text-amber-800 border-amber-200 hover:bg-amber-100/80'
            }`}
          >
            <span>Applied</span>
            <span className={`px-1.5 py-0.2 rounded-md text-xs font-black ${
              statusFilter === 'Applied' || statusFilter === 'Pending' || statusFilter === 'In Progress' ? 'bg-amber-500 text-white' : 'bg-amber-200 text-amber-900'
            }`}>
              {stats.pending}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Completed')}
            className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 border cursor-pointer ${
              statusFilter === 'Completed' || statusFilter === 'Active'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                : 'bg-emerald-50/70 text-emerald-800 border-emerald-200 hover:bg-emerald-100/80'
            }`}
          >
            <span>Active</span>
            <span className={`px-1.5 py-0.2 rounded-md text-xs font-black ${
              statusFilter === 'Completed' || statusFilter === 'Active' ? 'bg-emerald-500 text-white' : 'bg-emerald-200 text-emerald-900'
            }`}>
              {stats.active}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Renewal Due')}
            className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 border cursor-pointer ${
              statusFilter === 'Renewal Due'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs' 
                : 'bg-rose-50/70 text-rose-800 border-rose-200 hover:bg-rose-100/80'
            }`}
          >
            <span>Renewal</span>
            <span className={`px-1.5 py-0.2 rounded-md text-xs font-black ${
              statusFilter === 'Renewal Due' ? 'bg-rose-500 text-white' : 'bg-rose-200 text-rose-900'
            }`}>
              {stats.renewalDue}
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
            className="h-10 px-4 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:bg-slate-900 transition-all flex items-center gap-1.5 shrink-0"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            New FSSAI Entry
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {viewMode === 'grid' ? (
          <div className="p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredRecords.length === 0 ? (
              <div className="col-span-full py-8 text-center text-slate-400 font-bold uppercase tracking-wider text-[var(--app-font-size)]">
                No food license records archived
              </div>
            ) : (
              filteredRecords.map((rec, idx) => {
                const renewalDueDate = rec.dueDate || calculateRenewalDueDate(rec.expiryDate);
                const todayStr = new Date().toISOString().split('T')[0];
                const isRenewalDueNow = Boolean(renewalDueDate && renewalDueDate <= todayStr && rec.status !== 'Rejected');
                const isExpired = Boolean(rec.expiryDate && new Date(rec.expiryDate).getTime() < new Date().setHours(0,0,0,0) && rec.status !== 'Rejected');

                return (
                  <div key={rec.id} className="p-3.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl shadow-xs transition-all flex flex-col justify-between space-y-3 relative">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">#{idx + 1}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{rec.licenseType}</span>
                      </div>
                      <h4 className="text-xs font-black text-slate-900 truncate" title={rec.tradeName || rec.clientName}>{rec.tradeName || rec.clientName || '---'}</h4>
                      <p className="text-[10px] font-bold text-slate-500 truncate">Legal: {rec.legalName || rec.clientName || '---'}</p>
                      <p className="text-[9px] font-bold text-slate-400">Mob: {rec.mobile || '---'}</p>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-[9px] text-slate-400 uppercase">FSSAI No:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-bold text-slate-800">{rec.licenseNo || 'Awaiting Issue...'}</span>
                          {rec.licenseNo && (
                            <button onClick={() => { navigator.clipboard.writeText(rec.licenseNo || ''); toast.success('FSSAI No Copied!'); }} className="p-0.5 text-slate-300 hover:text-emerald-600 transition-colors inline-flex" title="Copy FSSAI No">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1" /></svg>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-[9px] text-slate-400 uppercase">Password:</span>
                        <div className="flex items-center gap-1">
                          {editingPasswordId === rec.id ? (
                            <input 
                              autoFocus 
                              value={tempPassword} 
                              onChange={e => setTempPassword(e.target.value)} 
                              onBlur={() => { handleInlineUpdate(rec.id, 'password', tempPassword); setEditingPasswordId(null); toast.success('Password updated!'); }}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  handleInlineUpdate(rec.id, 'password', tempPassword);
                                  setEditingPasswordId(null);
                                  toast.success('Password updated!');
                                }
                              }} 
                              className="bg-white border border-emerald-200 rounded px-1.5 py-0.5 text-[10px] font-bold w-20 outline-none h-5" 
                            />
                          ) : (
                            <>
                              <span className="font-mono font-bold text-indigo-500">{rec.password || '---'}</span>
                              <button 
                                onClick={() => { setEditingPasswordId(rec.id); setTempPassword(rec.password || ''); }} 
                                className="p-0.5 text-slate-300 hover:text-amber-500 transition-all inline-flex"
                                title="Edit Password"
                              >
                                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                              <button 
                                onClick={() => { 
                                  navigator.clipboard.writeText(rec.licenseNo || ''); 
                                  window.open('https://foscos.fssai.gov.in/public/', '_blank'); 
                                }} 
                                className="p-0.5 text-slate-300 hover:text-emerald-600 transition-all inline-flex" 
                                title="Login to Portal"
                              >
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-[9px] text-slate-400 uppercase">Renewal Date:</span>
                        <span className={`font-mono font-bold ${isRenewalDueNow ? 'text-amber-600' : 'text-slate-700'}`}>{formatDate(renewalDueDate)}</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-[9px] text-slate-400 uppercase">Expiry Date:</span>
                        <span className={`font-mono font-bold ${isExpired ? 'text-red-600 animate-pulse' : 'text-rose-500'}`}>{formatDate(rec.expiryDate)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                      <div>
                        <select 
                          value={rec.status || 'Pending'}
                          onChange={e => handleInlineUpdate(rec.id, 'status', e.target.value as FoodLicenseStatus)}
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border cursor-pointer outline-none text-center ${getStatusStyle(rec.status)}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Applied">Applied</option>
                          <option value="Completed">Completed</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button onClick={() => { setSelectedRecord(rec); setIsFormOpen(true); }} className="p-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-white hover:border-emerald-200 transition-all" title="Edit Entry">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(rec.id)} className="p-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-white hover:border-red-200 transition-all" title="Delete Entry">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="w-full overflow-x-auto overflow-y-auto no-scrollbar flex-1 relative h-full">
            <table className={`w-full text-left border-collapse table-auto min-w-[1100px] food-licenses-table gst-portfolio-table ${compactMode ? 'compact-mode' : ''}`}>
              <thead className="sticky top-0 z-30 bg-slate-100">
                <tr className="bg-slate-50 border-b border-slate-200 shadow-sm">
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2.5 text-[var(--app-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 whitespace-nowrap w-12">S.No.</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2.5 text-[var(--app-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 min-w-[200px]">Trade Name</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2.5 text-[var(--app-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 min-w-[170px] whitespace-nowrap">License Number (ID)</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2.5 text-[var(--app-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 min-w-[150px] whitespace-nowrap">Password</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2.5 text-[var(--app-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 min-w-[140px] whitespace-nowrap">License Type</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2.5 text-[var(--app-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 text-center min-w-[150px] whitespace-nowrap">
                    <div className="flex justify-center flex-col items-center">
                      <TableFilter label="Status" isActive={statusFilter !== 'All'}>
                         {['All', 'Pending', 'Applied', 'Completed', 'Renewal Due', 'Rejected'].map(st => (
                           <button key={st} onClick={() => setStatusFilter(st)} className={`w-full text-left px-3 py-2 text-[var(--app-font-size)] font-bold uppercase rounded-lg ${statusFilter === st ? 'bg-emerald-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{st}</button>
                         ))}
                      </TableFilter>
                    </div>
                  </th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2.5 text-[var(--app-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 min-w-[125px] whitespace-nowrap">Applied On</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2.5 text-[var(--app-font-size)] font-bold uppercase tracking-wider text-amber-600 border-b border-slate-200 min-w-[145px] whitespace-nowrap">Renewal Due Date</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2.5 text-[var(--app-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 min-w-[145px] whitespace-nowrap">Expiry Date</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2.5 text-[var(--app-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 text-right min-w-[100px] whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400 font-bold uppercase tracking-wider text-[var(--app-font-size)]">
                      No food license records archived
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec, idx) => {
                    const renewalDueDate = rec.dueDate || calculateRenewalDueDate(rec.expiryDate);
                    const todayStr = new Date().toISOString().split('T')[0];
                    const isRenewalDueNow = Boolean(renewalDueDate && renewalDueDate <= todayStr && rec.status !== 'Rejected');

                    return (
                      <tr key={rec.id} className="hover:bg-emerald-50/20 transition-all group text-[var(--app-font-size)] border-b border-slate-100">
                        <td className="px-3 py-2.5 text-slate-400 font-bold whitespace-nowrap">{(idx + 1).toString().padStart(2, '0')}</td>
                        <td className="px-3 py-2.5">
                           <p className="font-bold text-slate-800 uppercase leading-snug text-[var(--app-font-size)]" title={rec.tradeName || rec.clientName}>
                             {rec.tradeName || rec.clientName || '---'}
                           </p>
                           <p className="sub-text text-slate-500 uppercase mt-0.5 text-[calc(var(--app-font-size)-1.5px)] font-normal" title={rec.legalName || rec.clientName}>
                             Legal: {rec.legalName || rec.clientName || '---'}
                           </p>
                           <p className="sub-text text-slate-500 uppercase mt-0.5 text-[calc(var(--app-font-size)-1.5px)] font-normal">
                             Mob: {rec.mobile || 'No Contact'}
                           </p>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-mono font-bold text-[var(--app-font-size)] tracking-wider uppercase ${rec.licenseNo ? 'text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80' : 'text-slate-400 italic font-normal'}`}>
                              {rec.licenseNo || 'Awaiting Issue...'}
                            </span>
                            {rec.licenseNo && (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(rec.licenseNo || '');
                                  toast.success('License No copied!');
                                }}
                                className="text-slate-400 hover:text-emerald-600 p-1 rounded-md hover:bg-emerald-50 transition-colors shrink-0"
                                title="Copy License Number"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 012-2v-8a2 2 0 01-2-2h-8a2 2 0 01-2 2v8a2 2 0 012 2z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {editingPasswordId === rec.id ? (
                              <div className="flex items-center gap-1">
                                <input 
                                  type="text" 
                                  value={tempPassword} 
                                  onChange={e => setTempPassword(e.target.value)} 
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      handleInlineUpdate(rec.id, 'password', tempPassword);
                                      setEditingPasswordId(null);
                                      toast.success("Password updated!");
                                    } else if (e.key === 'Escape') {
                                      setEditingPasswordId(null);
                                    }
                                  }}
                                  autoFocus
                                  className="bg-white border border-emerald-300 focus:ring-2 focus:ring-emerald-400 rounded-lg px-2 py-1 font-mono font-bold text-slate-800 text-[var(--app-font-size)] outline-none w-32 shadow-xs"
                                  placeholder="Password..."
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleInlineUpdate(rec.id, 'password', tempPassword);
                                    setEditingPasswordId(null);
                                    toast.success("Password updated!");
                                  }}
                                  className="p-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                                  title="Save Password"
                                >
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingPasswordId(null)}
                                  className="p-1 bg-slate-200 text-slate-600 rounded-md hover:bg-slate-300 transition-colors"
                                  title="Cancel"
                                >
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-medium text-slate-800 text-[var(--app-font-size)]">
                                  {rec.password || <span className="text-slate-400 italic font-normal">Not Set</span>}
                                </span>
                                
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPasswordId(rec.id);
                                    setTempPassword(rec.password || '');
                                  }}
                                  className="text-slate-400 hover:text-indigo-600 p-1 rounded-md hover:bg-indigo-50 transition-colors shrink-0"
                                  title="Edit Password"
                                >
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (rec.licenseNo) {
                                      navigator.clipboard.writeText(rec.licenseNo);
                                      toast.success("License No / User ID copied! Opening FoSCoS portal...");
                                    } else if (rec.password) {
                                      navigator.clipboard.writeText(rec.password);
                                      toast.success("Password copied! Opening FoSCoS portal...");
                                    } else {
                                      toast.info("Opening FoSCoS Portal...");
                                    }
                                    window.open('https://foscos.fssai.gov.in/public/', '_blank');
                                  }}
                                  className="text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200/80 p-1.5 rounded-lg transition-all flex items-center gap-1 shrink-0 text-[var(--app-font-size)] font-bold uppercase shadow-xs"
                                  title="Direct Login to FoSCoS Portal (https://foscos.fssai.gov.in/public/)"
                                >
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                  </svg>
                                  <span>Login</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 font-medium text-slate-700 uppercase truncate text-[var(--app-font-size)] whitespace-nowrap">{rec.licenseType}</td>
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                            <select 
                              value={rec.status || 'Pending'}
                              onChange={e => handleInlineUpdate(rec.id, 'status', e.target.value as FoodLicenseStatus)}
                              className={`px-3 py-1.5 rounded-full text-[var(--app-font-size)] font-bold uppercase tracking-wider border transition-all cursor-pointer outline-none text-center ${getStatusStyle(rec.status)}`}
                            >
                              <option value="Pending" className="bg-white text-slate-900 font-bold">Pending</option>
                              <option value="Applied" className="bg-white text-slate-900 font-bold">Applied</option>
                              <option value="Completed" className="bg-white text-slate-900 font-bold">Completed</option>
                              <option value="Rejected" className="bg-white text-slate-900 font-bold">Rejected</option>
                            </select>
                        </td>
                        <td className="px-3 py-2.5 font-medium text-slate-700 uppercase text-[var(--app-font-size)] whitespace-nowrap">{formatDate(rec.appDate)}</td>
                        <td className="px-3 py-2.5 font-medium uppercase text-[var(--app-font-size)] whitespace-nowrap">
                          <span className={isRenewalDueNow ? 'text-amber-600 font-bold' : 'text-slate-700'}>
                            {formatDate(renewalDueDate)}
                          </span>
                          {isRenewalDueNow && (
                            <span className="block mt-0.5 text-[calc(var(--app-font-size)-1.5px)] font-bold text-amber-700 bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5 w-fit uppercase">
                              Renewal Due (2 Mo Window)
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 font-medium uppercase text-[var(--app-font-size)] whitespace-nowrap">
                          <span className={rec.expiryDate && new Date(rec.expiryDate).getTime() < new Date().setHours(0,0,0,0) ? 'text-red-600 font-bold' : 'text-slate-700'}>
                            {formatDate(rec.expiryDate)}
                          </span>
                          {Boolean(rec.expiryDate && new Date(rec.expiryDate).getTime() < new Date().setHours(0,0,0,0) && rec.status !== 'Rejected') && (
                            <span className="block mt-0.5 text-[calc(var(--app-font-size)-1.5px)] font-bold text-red-700 bg-red-100 border border-red-300 rounded px-1.5 py-0.5 w-fit uppercase animate-pulse">
                              Expired • Late Fees Apply
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                             <button onClick={() => { setSelectedRecord(rec); setIsFormOpen(true); }} className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-emerald-600 transition-all flex items-center justify-center shadow-sm">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                             </button>
                             <button onClick={() => handleDelete(rec.id)} className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-red-600 transition-all flex items-center justify-center shadow-sm">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                             </button>
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

      <FoodLicensesForm  
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

export default FoodLicenses;
