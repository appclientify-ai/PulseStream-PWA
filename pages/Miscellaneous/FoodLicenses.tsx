import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FoodLicenseRecord, FoodLicenseStatus } from '../../types';
import { api } from '../../services/api.ts';
import FoodLicensesForm from '../Clientform/FoodLicensesForm';
import Loader from '../../components/Loader';
import { TableFilter } from '../../components/TableFilter';
import { toast } from 'sonner';
import { formatDate as formatDateUtil } from '../../dateUtils.ts';

const FoodLicenses: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FoodLicenseRecord | null>(null);
  const [activeStatusRowId, setActiveStatusRowId] = useState<string | null>(null);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['food_licenses'],
    queryFn: () => api.getFoodLicenses(true),
    staleTime: 0,
  });

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
    if (statusFilter !== 'All') {
      list = list.filter(r => r.status === statusFilter);
    }
    const s = search.toLowerCase();
    return list.filter(r => 
      (r.clientName || '').toLowerCase().includes(s) || 
      (r.mobile && String(r.mobile).includes(s)) || 
      (r.licenseNo && String(r.licenseNo).toLowerCase().includes(s))
    ).sort((a, b) => (new Date(b.appDate || 0).getTime() || 0) - (new Date(a.appDate || 0).getTime() || 0));
  }, [records, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: records.length,
      active: records.filter(r => r.status === 'Completed').length,
      pending: records.filter(r => r.status !== 'Completed' && r.status !== 'Rejected').length
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
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Portfolio</p>
            <p className="text-xl font-black text-slate-900 leading-none">{stats.total}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Applied</p>
            <p className="text-xl font-black text-amber-600 leading-none">{stats.pending}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Licenses</p>
            <p className="text-xl font-black text-emerald-600 leading-none">{stats.active}</p>
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
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Client Identity</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">License Number</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">License Type</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">
                  <div className="flex justify-center flex-col items-center">
                    <TableFilter label="Status" isActive={statusFilter !== 'All'}>
                       {['All', 'Pending', 'Applied', 'Completed', 'Rejected'].map(st => (
                         <button key={st} onClick={() => setStatusFilter(st)} className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase rounded-lg ${statusFilter === st ? 'bg-emerald-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{st}</button>
                       ))}
                    </TableFilter>
                  </div>
                </th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Applied On</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Expiry Date</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr><td colSpan={8} className=" py-32 text-center text-slate-300 font-black uppercase tracking-widest text-sm">No food license records archived</td></tr>
              ) : (
                filteredRecords.map((rec, idx) => (
                  <tr key={rec.id} className="hover:bg-emerald-50/20 transition-all group text-[12px]">
                    <td className=" px-6 py-5 text-slate-300 font-black">{(idx + 1).toString().padStart(2, '0')}</td>
                    <td className=" px-6 py-5">
                       <p className="font-black text-slate-900 uppercase truncate" title={rec.clientName}>{rec.clientName}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase truncate mt-0.5">{rec.mobile || 'No Contact'}</p>
                    </td>
                    <td className=" px-6 py-5">
                       <input 
                         type="text" 
                         value={rec.licenseNo || ''} 
                         onChange={e => handleInlineUpdate(rec.id, 'licenseNo', e.target.value)}
                         className="w-full bg-transparent border-none focus:bg-white focus:ring-4 focus:ring-emerald-50 rounded-lg px-2 py-1.5 font-black text-emerald-600 font-mono tracking-widest uppercase transition-all"
                         placeholder="Awaiting Issue..."
                       />
                    </td>
                    <td className=" px-6 py-5 font-black text-slate-500 uppercase truncate">{rec.licenseType}</td>
                    <td className=" px-6 py-5 text-center relative overflow-visible">
                        <button 
                          onClick={() => setActiveStatusRowId(activeStatusRowId === rec.id ? null : rec.id)}
                          className={`w-full px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-between ${getStatusStyle(rec.status)}`}
                        >
                          <span className="truncate">{rec.status}</span>
                          <svg className="h-3 w-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {activeStatusRowId === rec.id && (
                          <div className="absolute top-full mt-1 z-50 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl p-1 animate-in zoom-in-95 text-left">
                             {['Pending', 'Applied', 'Completed', 'Rejected'].map(st => (
                               <button key={st} onClick={() => handleInlineUpdate(rec.id, 'status', st as FoodLicenseStatus)} className="w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg hover:bg-emerald-50 text-slate-600">{st}</button>
                             ))}
                          </div>
                        )}
                    </td>
                    <td className=" px-6 py-5 font-black text-slate-500 uppercase">{formatDate(rec.appDate)}</td>
                    <td className=" px-6 py-5 font-black text-rose-500 uppercase">{formatDate(rec.expiryDate)}</td>
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
                ))
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
