
import React, { useState, useEffect, useMemo } from 'react';
import { FoodLicenseRecord, FoodLicenseStatus, FoodLicenseType } from '../../types';
import { mockBackend } from '../../services/mockBackend';
import FoodLicensesForm from '../Clientform/FoodLicensesForm';
import Loader from '../../components/Loader';

const FoodLicenses: React.FC = () => {
  const [records, setRecords] = useState<FoodLicenseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [isDaysFilterOpen, setIsDaysFilterOpen] = useState(false);
  const [daysFilter, setDaysFilter] = useState<'All' | 'Expired' | 'Expiring Soon' | 'Healthy'>('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FoodLicenseRecord | null>(null);
  const [activeStatusRowId, setActiveStatusRowId] = useState<string | null>(null);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const data = await mockBackend.getFoodLicenses();
      setRecords(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleInlineUpdate = async (id: string, field: keyof FoodLicenseRecord, value: any) => {
    const updatedRecord = records.find(r => r.id === id);
    if (!updatedRecord) return;
    
    const newRecord = { ...updatedRecord, [field]: value };
    await mockBackend.saveFoodLicense(newRecord);
    setRecords(prev => prev.map(r => r.id === id ? newRecord : r));
    setActiveStatusRowId(null);
  };

  const getDaysLeft = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const exp = new Date(expiryDate);
    exp.setHours(0,0,0,0);
    const now = new Date();
    now.setHours(0,0,0,0);
    const diffTime = exp.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredRecords = useMemo(() => {
    let list = records;
    if (statusFilter !== 'All') {
      list = list.filter(r => r.status === statusFilter);
    }
    
    if (daysFilter !== 'All') {
      list = list.filter(r => {
        const days = getDaysLeft(r.expiryDate);
        if (days === null) return false;
        if (daysFilter === 'Expired') return days < 0;
        if (daysFilter === 'Expiring Soon') return days >= 0 && days <= 30;
        if (daysFilter === 'Healthy') return days > 30;
        return true;
      });
    }

    const s = search.toLowerCase();
    return list.filter(r => 
      r.clientName.toLowerCase().includes(s) || 
      (r.mobile && r.mobile.includes(s)) || 
      (r.licenseNo && r.licenseNo.toLowerCase().includes(s))
    );
  }, [records, search, statusFilter, daysFilter]);

  const stats = useMemo(() => {
    return {
      total: records.length,
      completed: records.filter(r => r.status === 'Completed').length,
      pending: records.filter(r => !['Completed', 'Rejected'].includes(r.status)).length,
      expiring: records.filter(r => {
        const d = getDaysLeft(r.expiryDate);
        return d !== null && d >= 0 && d <= 30;
      }).length
    };
  }, [records]);

  const handleDelete = async (id: string) => {
    if (confirm('Permanently remove this license record from vault?')) {
      await mockBackend.deleteFoodLicense(id);
      fetchRecords();
    }
  };

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '---';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    return `${d}-${m}-${y}`;
  };

  const getStatusColor = (st: FoodLicenseStatus) => {
    switch (st) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'In Progress': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Applied': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'Data Requested': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 max-w-full mx-auto w-full overflow-hidden">
      
      {/* Consolidated Toolbar */}
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Licenses</p>
            <p className="text-xl font-black text-slate-900 leading-none">{stats.total}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Approved</p>
            <p className="text-xl font-black text-emerald-600 leading-none">{stats.completed}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1">Expiring</p>
            <p className="text-xl font-black text-orange-600 leading-none">{stats.expiring}</p>
          </div>
        </div>

        <div className="relative flex-1 w-full group">
          <input type="text" placeholder="Search Client, Mobile or License No..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600/10 outline-none transition-all" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <button 
          onClick={() => { setSelectedRecord(null); setIsFormOpen(true); }}
          className="bg-emerald-600 text-white font-black uppercase tracking-widest px-8 h-11 rounded-xl shadow-lg hover:bg-slate-900 transition-all text-xs flex items-center gap-2 shrink-0"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
          Register License
        </button>
      </div>

      {/* Tracking Matrix */}
      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse table-fixed min-w-[1600px]">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[60px]">S.No.</th>
                <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[200px]">Client</th>
                <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[140px]">Mobile No.</th>
                <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[200px]">License Type</th>
                
                <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center w-[180px] relative">
                  <div className="flex items-center justify-center gap-1">
                    Status
                    <button onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)} className="p-1 hover:bg-white rounded transition-colors shadow-sm">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                    </button>
                  </div>
                  {isStatusFilterOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-[70] p-1 animate-in zoom-in-95">
                      <button onClick={() => { setStatusFilter('All'); setIsStatusFilterOpen(false); }} className={`w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg ${statusFilter === 'All' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-50'}`}>All Statuses</button>
                      {['Pending', 'Data Requested', 'In Progress', 'Applied', 'Completed', 'Rejected'].map(st => (
                        <button key={st} onClick={() => { setStatusFilter(st); setIsStatusFilterOpen(false); }} className={`w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg ${statusFilter === st ? 'bg-emerald-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{st}</button>
                      ))}
                    </div>
                  )}
                </th>

                <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[140px]">App Date</th>
                <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[200px]">License Number</th>
                <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[160px]">Expiry Date</th>
                
                <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center w-[150px] relative">
                   <div className="flex items-center justify-center gap-1">
                      Days Left
                      <button onClick={() => setIsDaysFilterOpen(!isDaysFilterOpen)} className="p-1 hover:bg-white rounded transition-colors shadow-sm">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                      </button>
                   </div>
                   {isDaysFilterOpen && (
                     <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-[70] p-1 animate-in zoom-in-95">
                        {['All', 'Expired', 'Expiring Soon', 'Healthy'].map(f => (
                           <button key={f} onClick={() => { setDaysFilter(f as any); setIsDaysFilterOpen(false); }} className={`w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg ${daysFilter === f ? 'bg-emerald-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{f}</button>
                        ))}
                     </div>
                   )}
                </th>

                <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[220px]">Remarks</th>
                <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr><td colSpan={11} className="py-32 text-center text-slate-300 font-black uppercase tracking-[0.2em] text-sm">No food licenses found</td></tr>
              ) : (
                filteredRecords.map((rec, idx) => {
                  const days = getDaysLeft(rec.expiryDate);
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/50 transition-all group text-[12px]">
                      <td className="px-4 py-5 text-slate-300 font-black">{(idx + 1).toString().padStart(2, '0')}</td>
                      <td className="px-4 py-5">
                        <p className="font-black text-slate-900 uppercase truncate" title={rec.clientName}>{rec.clientName}</p>
                      </td>
                      <td className="px-4 py-5 font-black text-slate-600">{rec.mobile || '---'}</td>
                      <td className="px-4 py-5 font-bold text-slate-500 uppercase truncate">{rec.licenseType}</td>
                      <td className="px-4 py-5 text-center relative overflow-visible">
                         <div className="relative inline-block w-full">
                            <button 
                              onClick={() => setActiveStatusRowId(activeStatusRowId === rec.id ? null : rec.id)}
                              className={`w-full px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-between group/status ${getStatusColor(rec.status)}`}
                            >
                              <span className="truncate">{rec.status}</span>
                              <svg className="h-3 w-3 opacity-40 group-hover/status:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            {activeStatusRowId === rec.id && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-[80] p-1 animate-in zoom-in-95 text-left">
                                 {['Pending', 'Data Requested', 'In Progress', 'Applied', 'Completed', 'Rejected'].map(st => (
                                   <button key={st} onClick={() => handleInlineUpdate(rec.id, 'status', st as FoodLicenseStatus)} className="w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg hover:bg-emerald-50 text-slate-600">{st}</button>
                                 ))}
                              </div>
                            )}
                         </div>
                      </td>
                      <td className="px-4 py-5 font-black text-slate-500 uppercase">{formatDateDisplay(rec.appDate)}</td>
                      <td className="px-4 py-5">
                         <input 
                           type="text" 
                           value={rec.licenseNo || ''} 
                           onChange={e => handleInlineUpdate(rec.id, 'licenseNo', e.target.value.toUpperCase())}
                           placeholder="License No..."
                           className="w-full bg-transparent border-none focus:bg-white focus:ring-2 focus:ring-emerald-100 rounded-lg px-2 py-1.5 font-black text-emerald-700 font-mono tracking-widest placeholder:text-slate-200 uppercase transition-all"
                         />
                      </td>
                      <td className="px-4 py-5">
                         <input 
                           type="date" 
                           value={rec.expiryDate || ''} 
                           onChange={e => handleInlineUpdate(rec.id, 'expiryDate', e.target.value)}
                           className="w-full bg-transparent border-none focus:bg-white focus:ring-2 focus:ring-emerald-100 rounded-lg px-2 py-1.5 font-black text-slate-700 uppercase transition-all cursor-pointer"
                         />
                      </td>
                      <td className="px-4 py-5 text-center">
                         {days !== null ? (
                           <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                              days < 0 ? 'bg-red-100 text-red-700' :
                              days <= 30 ? 'bg-amber-100 text-amber-700' :
                              'bg-green-100 text-green-700'
                           }`}>
                              {days < 0 ? 'EXPIRED' : `${days} d`}
                           </span>
                         ) : <span className="text-slate-200">---</span>}
                      </td>
                      <td className="px-4 py-5">
                         <input 
                           type="text" 
                           value={rec.remarks || ''} 
                           onChange={e => handleInlineUpdate(rec.id, 'remarks', e.target.value)}
                           placeholder="Internal notes..."
                           className="w-full bg-transparent border-none focus:bg-white focus:ring-2 focus:ring-emerald-100 rounded-lg px-2 py-1.5 font-medium text-slate-500 italic placeholder:text-slate-200 transition-all"
                         />
                      </td>
                      <td className="px-4 py-5 text-right whitespace-nowrap">
                         <div className="flex items-center justify-end gap-2">
                            <button onClick={() => { setSelectedRecord(rec); setIsFormOpen(true); }} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-emerald-600 hover:bg-white transition-all flex items-center justify-center">
                               <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button onClick={() => handleDelete(rec.id)} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-white transition-all flex items-center justify-center">
                               <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                         </div>
                      </td>
                    </tr>
                  )
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
          await mockBackend.saveFoodLicense(data);
          setIsFormOpen(false);
          fetchRecords();
        }} 
        initialData={selectedRecord} 
      />
    </div>
  );
};

export default FoodLicenses;
