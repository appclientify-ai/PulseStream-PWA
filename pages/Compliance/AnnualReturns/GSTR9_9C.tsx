import React, { useState, useEffect, useMemo } from 'react';
import { Client, GstRegType } from '../../../types';
import { api } from '../../../services/api.ts';
import GSTClientFormModal from '../../Clientform/GSTClientFormModal';
import Loader from '../../../components/Loader';
import { useGSTR9Logic } from './GSTR9_9Clogic';
import { YEARS } from '../GSTReturn/filinglogic/MonthlyFilingLogic';

const GSTR9_9C: React.FC = () => {
  const getPreviousFY = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const startYear = currentMonth >= 3 ? currentYear - 1 : currentYear - 2;
    return `${startYear}-${(startYear + 1).toString().slice(-2)}`;
  };

  const [allClients, setAllClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState(getPreviousFY());
  
  const [gstr9Filter, setGstr9Filter] = useState<'All' | 'Filed' | 'Pending'>('All');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const { 
    getStatus, 
    toggleStatus, 
    watchlist, 
    addToWatchlist, 
    removeFromWatchlist,
    hasFilingInYear,
    is9CApplicable,
    updateDueDate,
    getDueDate
  } = useGSTR9Logic(selectedYear);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const data = await api.getClients();
      setAllClients(data);
    } catch (err) {
      console.error("GSTR-9/9C Sync Failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const trackedClients = useMemo(() => {
    const selectedStartYear = parseInt(selectedYear.split('-')[0]);
    const activeIds = new Set<string>();

    Object.keys(watchlist).forEach(fy => {
      const ids = watchlist[fy] as string[];
      const fyStart = parseInt(fy.split('-')[0]);
      if (fyStart <= selectedStartYear) {
        ids.forEach(id => activeIds.add(id));
      }
    });

    return allClients.filter(c => {
      const isRegular = c.gstProfile?.regType === 'Regular';
      if (!isRegular) return false;
      const inWatchlistRecord = activeIds.has(c.id);
      const hasHistory = hasFilingInYear(c.id, selectedYear);
      return inWatchlistRecord || hasHistory;
    });
  }, [allClients, watchlist, selectedYear, hasFilingInYear]);

  const filteredDisplayList = useMemo(() => {
    const s = search.toLowerCase();
    let list = trackedClients.filter(c => 
      (c.legalName || '').toLowerCase().includes(s) || 
      (c.tradeName || '').toLowerCase().includes(s) || 
      (c.gstProfile?.gstin && c.gstProfile.gstin.toLowerCase().includes(s))
    );

    if (gstr9Filter !== 'All') {
      list = list.filter(c => gstr9Filter === 'Filed' ? getStatus(c.id).gstr9 : !getStatus(c.id).gstr9);
    }
    return list;
  }, [trackedClients, search, gstr9Filter, getStatus]);

  const availableToAdd = useMemo(() => {
    const s = addSearch.toLowerCase();
    const trackedIds = new Set(trackedClients.map(c => c.id));
    return allClients.filter(c => 
      c.gstProfile?.regType === 'Regular' && 
      !trackedIds.has(c.id) &&
      ((c.legalName || '').toLowerCase().includes(s) || 
       (c.tradeName || '').toLowerCase().includes(s) || 
       (c.gstProfile?.gstin || '').toLowerCase().includes(s))
    ).slice(0, 8);
  }, [allClients, trackedClients, addSearch]);

  const stats = useMemo(() => {
    const list = trackedClients; 
    const gstr9Filed = list.filter(c => getStatus(c.id).gstr9).length;
    const gstr9cFiled = list.filter(c => getStatus(c.id).gstr9c).length;
    return { total: list.length, gstr9Filed, gstr9cFiled };
  }, [trackedClients, getStatus]);

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 max-w-full mx-auto w-full overflow-hidden">
      
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">FY {selectedYear}</p>
            <p className="text-xl font-black text-slate-900 leading-none">{stats.total}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">9 Filed</p>
            <p className="text-xl font-black text-indigo-600 leading-none">{stats.gstr9Filed}</p>
          </div>
        </div>

        <div className="relative flex-1 w-full group">
          <input type="text" placeholder="Search regular entity or GSTIN..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} 
            className="bg-slate-50 border-none rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer">
            {YEARS.map(y => <option key={y} value={y}>FY {y}</option>)}
          </select>
          <button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 text-white font-black uppercase tracking-tight px-6 h-11 rounded-xl shadow-lg hover:bg-slate-900 transition-all flex items-center gap-2 text-xs">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            Add Client
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse table-fixed min-w-[1300px]">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-5 text-[12px] font-black uppercase tracking-widest text-slate-400 w-[60px]">S.No</th>
                <th className="px-4 py-5 text-[12px] font-black uppercase tracking-widest text-slate-400 w-[220px]">Trade Name</th>
                <th className="px-4 py-5 text-[12px] font-black uppercase tracking-widest text-slate-400 w-[200px]">GSTIN</th>
                
                <th className="px-4 py-5 text-[12px] font-black uppercase tracking-widest text-slate-400 text-center w-[130px] relative">
                   <button onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} className="flex items-center justify-center gap-1 w-full uppercase">
                    GSTR-9 <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {isFilterMenuOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1">
                      {['All', 'Filed', 'Pending'].map(f => (
                        <button key={f} onClick={() => { setGstr9Filter(f as any); setIsFilterMenuOpen(false); }} 
                          className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase rounded-lg ${gstr9Filter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50'}`}>
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
                </th>

                <th className="px-4 py-5 text-[12px] font-black uppercase tracking-widest text-slate-400 text-center w-[130px]">GSTR-9C</th>
                <th className="px-4 py-5 text-[12px] font-black uppercase tracking-widest text-slate-400 w-[160px]">Portal Login</th>
                <th className="px-4 py-5 text-[12px] font-black uppercase tracking-widest text-slate-400 text-right w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDisplayList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-300">No regular taxpayers tracked for this period</p>
                  </td>
                </tr>
              ) : (
                filteredDisplayList.map((client, idx) => {
                  const st = getStatus(client.id);
                  const is9CReq = is9CApplicable(client.id);
                  return (
                    <tr key={client.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-4 py-5 font-black text-slate-300">{(idx + 1).toString().padStart(2, '0')}</td>
                      <td className="px-4 py-5">
                        <p className="text-[12px] font-black text-slate-900 uppercase truncate" title={client.tradeName}>{client.tradeName || client.legalName}</p>
                      </td>
                      <td className="px-4 py-5 font-black text-indigo-600 font-mono tracking-widest uppercase text-[11px]">{client.gstProfile?.gstin}</td>
                      <td className="px-4 py-5 text-center">
                        <button onClick={() => toggleStatus(client.id, 'gstr9')} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${st.gstr9 ? 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 border-slate-200'}`}>
                          {st.gstr9 ? 'Filed' : 'Pending'}
                        </button>
                      </td>
                      <td className="px-4 py-5 text-center">
                         <button disabled={!is9CReq} onClick={() => toggleStatus(client.id, 'gstr9c')} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${!is9CReq ? 'opacity-20 cursor-not-allowed' : st.gstr9c ? 'bg-indigo-100 text-indigo-700 border-indigo-200 shadow-sm' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 border-slate-200'}`}>
                          {!is9CReq ? 'Exempt' : st.gstr9c ? 'Filed' : 'Pending'}
                        </button>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-slate-700 truncate">{client.gstProfile?.username}</span>
                           <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Secured Credentials</span>
                        </div>
                      </td>
                      <td className="px-4 py-5 text-right whitespace-nowrap">
                         <div className="flex items-center justify-end gap-2">
                            <button onClick={() => { navigator.clipboard.writeText(client.gstProfile?.username || ''); window.open('https://services.gst.gov.in/services/login', '_blank'); }} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center shadow-sm">
                               <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14" /></svg>
                            </button>
                            <button onClick={() => { setSelectedClient(client); setIsDetailModalOpen(true); }} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center shadow-sm">
                               <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg>
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

      {/* Detail Modal */}
      {isDetailModalOpen && selectedClient && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight truncate">{selectedClient.tradeName || selectedClient.legalName}</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">GSTR-9/9C Audit Profile • FY {selectedYear}</p>
                 </div>
                 <button onClick={() => setIsDetailModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-all"><svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg></button>
              </div>
              <div className="p-10 space-y-8">
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400">GSTIN Identifier</p><p className="text-base font-black text-indigo-600 font-mono tracking-widest">{selectedClient.gstProfile?.gstin}</p></div>
                    <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400">Portal User ID</p><p className="text-base font-black text-slate-900">{selectedClient.gstProfile?.username}</p></div>
                    <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400">GSTR-9 Date</p><p className="text-base font-black text-slate-700">{getStatus(selectedClient.id).gstr9Date || '---'}</p></div>
                    <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400">GSTR-9C Date</p><p className="text-base font-black text-slate-700">{getStatus(selectedClient.id).gstr9cDate || '---'}</p></div>
                 </div>
                 <div className="pt-4 border-t border-slate-100">
                    <button onClick={() => { if(confirm('Remove client from tracking?')) { removeFromWatchlist(selectedClient.id); setIsDetailModalOpen(false); } }} 
                      className="text-[10px] font-black uppercase text-red-500 hover:underline tracking-widest">Untrack for FY {selectedYear}</button>
                 </div>
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                 <button onClick={() => setIsDetailModalOpen(false)} className="px-10 py-4 bg-white border border-slate-200 text-slate-600 font-black uppercase text-[10px] rounded-xl shadow-sm hover:bg-slate-100 transition-all">Dismiss</button>
              </div>
           </div>
        </div>
      )}

      {/* Add to Watchlist Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-8 flex flex-col space-y-6 animate-in zoom-in-95">
              <div className="flex items-center justify-between shrink-0">
                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Add to FY {selectedYear} Audit</h3>
                 <button onClick={() => setIsAddModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-all"><svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg></button>
              </div>
              <div className="relative shrink-0">
                 <input type="text" placeholder="Search Regular GST portfolio..." value={addSearch} onChange={e => setAddSearch(e.target.value)}
                   className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-5 font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-50 transition-all" />
              </div>
              <div className="flex-1 max-h-[400px] overflow-y-auto space-y-2 no-scrollbar">
                 {availableToAdd.length === 0 ? (
                    <p className="text-center py-10 text-slate-400 font-bold uppercase text-xs tracking-widest">No untracked regular entities found</p>
                 ) : (
                    availableToAdd.map(c => (
                      <button key={c.id} onClick={() => { addToWatchlist(c.id, true); setIsAddModalOpen(false); setAddSearch(''); }} 
                        className="w-full text-left p-4 rounded-2xl border border-slate-100 hover:border-indigo-600 hover:bg-indigo-50/50 transition-all group flex items-center justify-between">
                         <div className="min-w-0">
                            <p className="text-sm font-black text-slate-900 uppercase group-hover:text-indigo-600 truncate">{c.tradeName || c.legalName}</p>
                            <p className="text-[10px] text-slate-400 font-mono tracking-tight mt-1 uppercase">{c.gstProfile?.gstin}</p>
                         </div>
                         <svg className="h-5 w-5 text-slate-300 group-hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                      </button>
                    ))
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default GSTR9_9C;