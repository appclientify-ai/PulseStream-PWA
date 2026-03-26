import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Client } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';
import GSTViewIcon from '../../../components/GSTViewIcon';
import { useMonthlyFilingLogic, MONTHS, YEARS, getDefaultPeriod, isClientVisibleInPeriod, periodToDate } from './filinglogic/MonthlyFilingLogic';

const QuarterlyFiling: React.FC = () => {
  const defaultPeriod = getDefaultPeriod();
  const [clients, setClients] = useState<Client[]>([]);
  const [allClientsBase, setAllClientsBase] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState(defaultPeriod.year);
  const [selectedMonth, setSelectedMonth] = useState(defaultPeriod.month);
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [newPassVal, setNewPassVal] = useState('');

  const [activeActionsId, setActiveActionsId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const actionsRef = useRef<HTMLDivElement>(null);

  const { getStatus, toggleStatus } = useMonthlyFilingLogic(selectedYear, selectedMonth, 'clientify_quarterly_filing_v3');

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const data = await api.getClients();
      setAllClientsBase(data);
      // AUTOMATIC ROUTING: Quarterly Return list only shows taxpayers with Quarterly frequency
      setClients(data.filter(c => c.gstProfile?.regType === 'Regular' && c.gstProfile?.filingFreq === 'Quarterly'));
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchClients(); }, []);

  useEffect(() => {
    const handleClose = (event: any) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) setActiveActionsId(null);
    };
    if (activeActionsId) document.addEventListener('mousedown', handleClose);
    return () => document.removeEventListener('mousedown', handleClose);
  }, [activeActionsId]);

  const isQuarterEnd = useMemo(() => ['June', 'September', 'December', 'March'].includes(selectedMonth), [selectedMonth]);

  const checkQrmpVisibility = (c: Client) => {
    if (!c.gstProfile) return false;
    const visibleInMonth = isClientVisibleInPeriod(c, selectedYear, selectedMonth);
    if (isQuarterEnd) {
      if (c.gstProfile.cancelDate && c.gstProfile.gstStatus === 'Closed') {
        const cancelDate = new Date(c.gstProfile.cancelDate);
        if (!isNaN(cancelDate.getTime())) {
          const periodDate = periodToDate(selectedYear, selectedMonth);
          const lastVisibleMonthDate = new Date(cancelDate.getFullYear(), cancelDate.getMonth(), 1);
          if (periodDate > lastVisibleMonthDate) return true;
        }
      }
    }
    return visibleInMonth;
  };

  const filteredClients = useMemo(() => {
    const s = search.toLowerCase();
    return clients.filter(c => 
      checkQrmpVisibility(c) &&
      ((c.legalName || '').toLowerCase().includes(s) || 
       (c.tradeName || '').toLowerCase().includes(s) ||
       (c.gstProfile?.gstin || '').toLowerCase().includes(s))
    );
  }, [clients, search, selectedYear, selectedMonth]);

  const stats = useMemo(() => {
    const r1 = filteredClients.filter(c => getStatus(c.id).r1).length;
    const r3b = filteredClients.filter(c => getStatus(c.id).r3b).length;
    return { total: filteredClients.length, r1, r3b };
  }, [filteredClients, getStatus]);

  const handleUpdatePassword = async () => {
    if (!selectedClient || !newPassVal.trim()) return;
    try {
      const updated = { ...selectedClient, gstProfile: { ...selectedClient.gstProfile!, password: newPassVal } };
      await api.saveClient(updated);
      setClients(prev => prev.map(c => c.id === selectedClient.id ? (updated as Client) : c));
      setEditingPasswordId(null);
    } catch (err) { alert("Update failed."); }
  };

  const openActionsMenu = (e: React.MouseEvent, client: Client) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + window.scrollY + 8, left: rect.right - 256 });
    setActiveActionsId(client.id);
    setSelectedClient(client);
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">QRMP Total</p>
            <p className="text-xl font-black text-slate-900 leading-none">{stats.total}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">IFF Filed</p>
            <p className="text-xl font-black text-indigo-600 leading-none">{stats.r1}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">3B Filed</p>
            <p className="text-xl font-black text-emerald-600 leading-none">{isQuarterEnd ? stats.r3b : '---'}</p>
          </div>
        </div>
        <div className="flex-1 relative group w-full">
          <input type="text" placeholder="Search QRMP..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <div className="flex gap-2">
           <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-3 text-[11px] font-black uppercase text-slate-600 outline-none">{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
           <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-3 text-[11px] font-black uppercase text-slate-600 outline-none">{MONTHS.map(m => <option key={m} value={m}>{m}</option>)}</select>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1 w-full">
          <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-200 shadow-sm">
                <th className="px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-slate-900 w-[60px]">S.No.</th>
                <th className="px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-slate-900 min-w-[200px]">Trader Name</th>
                <th className="px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-slate-900 w-[180px]">GSTIN</th>
                <th className="px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-slate-900 w-[120px] text-center">IFF/R1</th>
                <th className="px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-slate-900 w-[120px] text-center">GSTR-3B</th>
                <th className="px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-slate-900 w-[140px]">User ID</th>
                <th className="px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-slate-900 w-[160px]">Password</th>
                <th className="px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-slate-900 text-right w-[100px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client, idx) => {
                const st = getStatus(client.id);
                const isEditingPass = editingPasswordId === client.id;
                return (
                  <tr key={client.id} className="hover:bg-indigo-50/10 transition-all border-b border-slate-50 last:border-0 h-[44px]">
                    <td className="px-4 py-[2px] font-black text-indigo-400 font-mono text-[12px] truncate">{(idx + 1).toString().padStart(2, '0')}</td>
                    <td className="px-4 py-[2px] font-black text-slate-900 uppercase truncate text-[12px]">{client.tradeName || '---'}</td>
                    <td className="px-4 py-[2px] font-black font-mono tracking-widest uppercase text-[12px] text-indigo-600">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{client.gstProfile?.gstin}</span>
                        {client.gstProfile?.gstin && (
                          <button onClick={() => window.open(`https://services.gst.gov.in/services/searchtp?gstin=${client.gstProfile?.gstin}`, '_blank')} className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0" title="Search Taxpayer">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-[2px] text-center">
                       <button onClick={() => toggleStatus(client.id, 'r1')} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border flex items-center justify-center gap-1 mx-auto ${st.r1 ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-400'}`}>
                          {st.r1 ? 'Filed' : 'Pending'}
                          <svg className="h-2.5 w-2.5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                       </button>
                    </td>
                    <td className="px-4 py-[2px] text-center">
                       {isQuarterEnd ? (
                         <button onClick={() => toggleStatus(client.id, 'r3b')} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border flex items-center justify-center gap-1 mx-auto ${st.r3b ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400'}`}>
                            {st.r3b ? 'Filed' : 'Pending'}
                            <svg className="h-2.5 w-2.5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                         </button>
                       ) : <span className="text-[10px] font-black text-slate-300">N/A</span>}
                    </td>
                    <td className="px-4 py-[2px] font-black text-slate-700 text-[12px] uppercase truncate">{client.gstProfile?.username}</td>
                    <td className="px-4 py-[2px]">
                       <div className="flex items-center gap-2 group/pass">
                          {isEditingPass ? (
                            <input autoFocus value={newPassVal} onChange={e => setNewPassVal(e.target.value)} onBlur={handleUpdatePassword} onKeyDown={e => e.key === 'Enter' && handleUpdatePassword()} className="bg-white border border-indigo-200 rounded px-2 h-7 text-[11px] font-black w-24 outline-none" />
                          ) : (
                            <>
                               <span className="font-black text-indigo-400 text-[12px] truncate">{client.gstProfile?.password}</span>
                               <button onClick={() => { setSelectedClient(client); setEditingPasswordId(client.id); setNewPassVal(client.gstProfile?.password || ''); }} className="p-1 text-slate-300 hover:text-amber-500 opacity-0 group-hover/pass:opacity-100 transition-all shrink-0"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                               {client.gstProfile?.username && (
                                 <button onClick={() => { 
                                   navigator.clipboard.writeText(client.gstProfile?.username || ''); 
                                   window.open('https://services.gst.gov.in/services/login', '_blank'); 
                                 }} className="p-1 text-slate-300 hover:text-indigo-600 opacity-0 group-hover/pass:opacity-100 transition-all shrink-0" title="Login to GST Portal">
                                   <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                 </button>
                               )}
                            </>
                          )}
                       </div>
                    </td>
                    <td className="px-4 py-[2px] text-right">
                       <div className="flex items-center justify-end gap-1">
                          <GSTViewIcon client={client} />
                          <button onClick={(e) => openActionsMenu(e, client)} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 flex items-center justify-center shadow-sm">
                             <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                          </button>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Action Menu */}
      {activeActionsId && selectedClient && (
        <div ref={actionsRef} style={{ top: menuPosition.top, left: menuPosition.left }} className="fixed w-64 bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl z-[9999] p-2 animate-in zoom-in-95 origin-top-right text-left">
           <button onClick={() => { if(confirm('Delete from QRMP?')) api.deleteClient(selectedClient.id).then(fetchClients); setActiveActionsId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 rounded-xl transition-colors text-left group">
              <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Delete record</span>
           </button>
        </div>
      )}

      {/* FULL CLIENT DETAIL VIEW MODAL removed - replaced by GSTViewIcon */}

      {/* Dossier Modal removed - replaced by GSTDetailModal */}
    </div>
  );
};

export default QuarterlyFiling;
