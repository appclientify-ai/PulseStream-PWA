import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Client } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';
import { useMonthlyFilingLogic, MONTHS, YEARS, getDefaultPeriod, isClientVisibleInPeriod, periodToDate } from './filinglogic/MonthlyFilingLogic';

const QuarterlyFiling: React.FC = () => {
  const defaultPeriod = getDefaultPeriod();
  const [clients, setClients] = useState<Client[]>([]);
  const [allClientsBase, setAllClientsBase] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState(defaultPeriod.year);
  const [selectedMonth, setSelectedMonth] = useState(defaultPeriod.month);
  
  // Login Tool Box State
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoginBoxOpen, setIsLoginBoxOpen] = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);

  const { getStatus, toggleStatus, updateDueDate, getDueDate } = useMonthlyFilingLogic(selectedYear, selectedMonth, 'clientify_quarterly_filing_v3');

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const data = await api.getClients();
      setAllClientsBase(data);
      setClients(data.filter(c => c.gstProfile?.regType === 'Regular' && c.gstProfile?.filingFreq === 'Quarterly'));
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchClients(); }, []);

  const isQuarterEnd = useMemo(() => ['June', 'September', 'December', 'March'].includes(selectedMonth), [selectedMonth]);

  const checkQrmpVisibility = (c: Client) => {
    if (!c.gstProfile) return false;
    const visibleInMonth = isClientVisibleInPeriod(c, selectedYear, selectedMonth);
    if (isQuarterEnd) {
      if (c.gstProfile.cancelDate && c.gstProfile.gstStatus === 'Closed') {
        const cancelDate = new Date(c.gstProfile.cancelDate);
        const periodDate = periodToDate(selectedYear, selectedMonth);
        const lastVisibleMonthDate = new Date(cancelDate.getFullYear(), cancelDate.getMonth(), 1);
        if (periodDate > lastVisibleMonthDate) return true;
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

  const handleExport = () => {
    const headers = ["ID", "Trader", "GSTIN", "IFF/R1", "Q-3B"].join(",");
    const rows = filteredClients.map(c => {
      const st = getStatus(c.id);
      return [c.id, c.tradeName, c.gstProfile?.gstin, st.r1?'Filed':'Pending', isQuarterEnd?(st.r3b?'Filed':'Pending'):'N/A'].join(",");
    }).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Quarterly_${selectedMonth}.csv`; a.click();
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-4 px-2">
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex-1 relative group w-full">
          <input type="text" placeholder="Search QRMP entity..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handleExport} className="h-11 w-11 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer hover:bg-slate-100 transition-all">{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer hover:bg-slate-100 transition-all">{MONTHS.map(m => <option key={m} value={m}>{m}</option>)}</select>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse table-fixed min-w-[1400px]">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-200 shadow-sm">
                <th className="px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900 w-[90px]">ID no.</th>
                <th className="px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900 w-[180px]">Trader Name</th>
                <th className="px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900 w-[200px]">Legal Name</th>
                <th className="px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900 w-[180px]">GSTIN</th>
                <th className="px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900 w-[120px] text-center">GSTR-1/IFF</th>
                <th className="px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900 w-[120px] text-center">GSTR-3B</th>
                <th className="px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900 w-[130px]">User ID</th>
                <th className="px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900 w-[160px]">Password</th>
                <th className="px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900 text-right w-[110px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client) => {
                const st = getStatus(client.id);
                return (
                  <tr key={client.id} className="hover:bg-indigo-50/10 transition-all border-b border-slate-50 last:border-0 h-[44px]">
                    <td className="px-[5.5px] py-[2px] font-black text-indigo-400 font-mono text-[12px] truncate">{client.id.substring(0,6)}</td>
                    <td className="px-[5.5px] py-[2px] font-black text-slate-900 uppercase truncate text-[12px]">{client.tradeName || '---'}</td>
                    <td className="px-[5.5px] py-[2px] font-bold text-slate-600 uppercase truncate text-[12px]">{client.legalName}</td>
                    <td className="px-[5.5px] py-[2px] font-black font-mono tracking-widest uppercase text-[12px] text-indigo-600">{client.gstProfile?.gstin}</td>
                    <td className="px-[5.5px] py-[2px] text-center"><button onClick={() => toggleStatus(client.id, 'r1')} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${st.r1 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>{st.r1 ? 'Filed' : 'Pending'}</button></td>
                    <td className="px-[5.5px] py-[2px] text-center">{isQuarterEnd ? <button onClick={() => toggleStatus(client.id, 'r3b')} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${st.r3b ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>{st.r3b ? 'Filed' : 'Pending'}</button> : <span className="text-[10px] font-black text-slate-300">N/A</span>}</td>
                    <td className="px-[5.5px] py-[2px] font-black text-slate-700 text-[12px] uppercase truncate">{client.gstProfile?.username}</td>
                    <td className="px-[5.5px] py-[2px] font-black text-indigo-400 text-[12px] tracking-widest">••••••••</td>
                    <td className="px-[5.5px] py-[2px] text-right">
                       <button onClick={() => { setSelectedClient(client); setIsLoginBoxOpen(true); }} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 flex items-center justify-center shadow-sm">
                          <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14" /></svg>
                       </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Portal Login Modal */}
      {isLoginBoxOpen && selectedClient && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
              <div className="p-8 bg-slate-900 text-white flex items-center justify-between shrink-0">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-2">Portal Access Bridge</p>
                    <h3 className="text-xl font-black uppercase truncate">{selectedClient.tradeName}</h3>
                 </div>
                 <button onClick={() => setIsLoginBoxOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"><svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg></button>
              </div>
              <div className="p-10 space-y-8">
                 <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col gap-4">
                    <div>
                       <p className="text-[9px] font-black uppercase text-slate-400 mb-1">GSTIN Identity</p>
                       <p className="text-lg font-black text-indigo-600 font-mono tracking-widest uppercase">{selectedClient.gstProfile?.gstin}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                       <div>
                          <p className="text-[9px] font-black uppercase text-slate-400 mb-1">User ID</p>
                          <p className="text-sm font-black text-slate-900 uppercase truncate">{selectedClient.gstProfile?.username}</p>
                       </div>
                       <div>
                          <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Password</p>
                          <p className="text-sm font-black text-indigo-600 tracking-widest">{selectedClient.gstProfile?.password}</p>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100">
                 <button onClick={() => { navigator.clipboard.writeText(selectedClient.gstProfile?.username || ''); window.open('https://services.gst.gov.in/services/login', '_blank'); }} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 transition-all shadow-2xl flex items-center justify-center gap-3">
                    Launch Portal & Sync ID
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default QuarterlyFiling;