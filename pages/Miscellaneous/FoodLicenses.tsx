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

const FoodLicenses: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FoodLicenseRecord | null>(null);
  const [activeStatusRowId, setActiveStatusRowId] = useState<string | null>(null);
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string>('');

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
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 max-w-full mx-auto w-full overflow-hidden">
      
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center justify-between sm:justify-start gap-4 md:gap-6 px-3 py-1.5 border-b md:border-b-0 md:border-r border-slate-100 shrink-0 w-full md:w-auto overflow-x-auto no-scrollbar">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Portfolio</p>
            <p className="text-lg md:text-xl font-black text-slate-900 leading-none">{stats.total}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-4 md:pl-6">
            <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Applied</p>
            <p className="text-lg md:text-xl font-black text-amber-600 leading-none">{stats.pending}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-4 md:pl-6">
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Licenses</p>
            <p className="text-lg md:text-xl font-black text-emerald-600 leading-none">{stats.active}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-4 md:pl-6">
            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Renewal Due</p>
            <p className="text-lg md:text-xl font-black text-rose-600 leading-none">{stats.renewalDue}</p>
          </div>
        </div>

        <div className="relative flex-1 w-full group">
          <input type="text" placeholder="Search by Client, Mobile or FSSAI License Number..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3.5 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-4 focus:ring-emerald-50 outline-none transition-all" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <button 
          onClick={() => { setSelectedRecord(null); setIsFormOpen(true); }}
          className="bg-emerald-600 text-white font-black uppercase tracking-widest px-8 h-12 rounded-xl shadow-lg hover:bg-slate-900 transition-all text-xs flex items-center gap-2 shrink-0"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
          New FSSAI Entry
        </button>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse table-auto overflow-hidden min-w-full">
            <thead className=" sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">S.No.</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Trade Name</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">License Number (ID)</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Password</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">License Type</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">
                  <div className="flex justify-center flex-col items-center">
                    <TableFilter label="Status" isActive={statusFilter !== 'All'}>
                       {['All', 'Pending', 'Applied', 'Completed', 'Renewal Due', 'Rejected'].map(st => (
                         <button key={st} onClick={() => setStatusFilter(st)} className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase rounded-lg ${statusFilter === st ? 'bg-emerald-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{st}</button>
                       ))}
                    </TableFilter>
                  </div>
                </th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Applied On</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-amber-600">Renewal Due Date</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Expiry Date</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr><td colSpan={10} className=" py-32 text-center text-slate-300 font-black uppercase tracking-widest text-sm">No food license records archived</td></tr>
              ) : (
                filteredRecords.map((rec, idx) => {
                  const renewalDueDate = rec.dueDate || calculateRenewalDueDate(rec.expiryDate);
                  const todayStr = new Date().toISOString().split('T')[0];
                  const isRenewalDueNow = Boolean(renewalDueDate && renewalDueDate <= todayStr && rec.status !== 'Rejected');

                  return (
                    <tr key={rec.id} className="hover:bg-emerald-50/20 transition-all group text-[12px]">
                      <td className=" px-6 py-5 text-slate-300 font-black">{(idx + 1).toString().padStart(2, '0')}</td>
                      <td className=" px-6 py-5">
                         <p className="font-black text-slate-900 uppercase leading-snug" title={rec.tradeName || rec.clientName}>
                           {rec.tradeName || rec.clientName || '---'}
                         </p>
                         <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5" title={rec.legalName || rec.clientName}>
                           Legal: {rec.legalName || rec.clientName || '---'}
                         </p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                           Mob: {rec.mobile || 'No Contact'}
                         </p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono font-black text-xs tracking-wider uppercase ${rec.licenseNo ? 'text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/60' : 'text-slate-400 italic font-normal text-xs'}`}>
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
                      <td className="px-6 py-5">
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
                                className="bg-white border border-emerald-300 focus:ring-2 focus:ring-emerald-400 rounded-lg px-2 py-1 font-mono font-bold text-slate-800 text-xs outline-none w-32 shadow-xs"
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
                              <span className="font-mono font-bold text-slate-800 text-xs">
                                {rec.password || <span className="text-slate-300 italic font-normal text-xs">Not Set</span>}
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
                                className="text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200/80 p-1.5 rounded-lg transition-all flex items-center gap-1 shrink-0 text-[10px] font-black uppercase shadow-xs"
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
                      <td className=" px-6 py-5 font-black text-slate-500 uppercase truncate">{rec.licenseType}</td>
                      <td className=" px-6 py-5 text-center">
                          <select 
                            value={rec.status || 'Pending'}
                            onChange={e => handleInlineUpdate(rec.id, 'status', e.target.value as FoodLicenseStatus)}
                            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all cursor-pointer outline-none text-center ${getStatusStyle(rec.status)}`}
                          >
                            <option value="Pending" className="bg-white text-slate-900 font-bold">Pending</option>
                            <option value="Applied" className="bg-white text-slate-900 font-bold">Applied</option>
                            <option value="Completed" className="bg-white text-slate-900 font-bold">Completed</option>
                            <option value="Rejected" className="bg-white text-slate-900 font-bold">Rejected</option>
                          </select>
                      </td>
                      <td className=" px-6 py-5 font-black text-slate-500 uppercase">{formatDate(rec.appDate)}</td>
                      <td className=" px-6 py-5 font-black uppercase">
                        <span className={isRenewalDueNow ? 'text-amber-600 font-black' : 'text-slate-700 font-semibold'}>
                          {formatDate(renewalDueDate)}
                        </span>
                        {isRenewalDueNow && (
                          <span className="block mt-0.5 text-[8px] font-black text-amber-700 bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5 w-fit uppercase">
                            Renewal Due (2 Mo Window)
                          </span>
                        )}
                      </td>
                      <td className=" px-6 py-5 font-black uppercase">
                        <span className={rec.expiryDate && new Date(rec.expiryDate).getTime() < new Date().setHours(0,0,0,0) ? 'text-red-600 font-black' : 'text-rose-500 font-semibold'}>
                          {formatDate(rec.expiryDate)}
                        </span>
                        {Boolean(rec.expiryDate && new Date(rec.expiryDate).getTime() < new Date().setHours(0,0,0,0) && rec.status !== 'Rejected') && (
                          <span className="block mt-0.5 text-[8px] font-black text-red-700 bg-red-100 border border-red-300 rounded px-1.5 py-0.5 w-fit uppercase animate-pulse">
                            Expired • Late Fees Apply
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right ">
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
