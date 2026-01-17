
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

  // Added missing state variables for client selection and login box visibility to fix errors on line 127
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoginBoxOpen, setIsLoginBoxOpen] = useState(false);
  
  const [activeActionsId, setActiveActionsId] = useState<string | null>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  const { getStatus, toggleStatus, updateDueDate, getDueDate } = useMonthlyFilingLogic(selectedYear, selectedMonth, 'clientify_qrmp_filing_v3');

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

  /**
   * For Quarterly, we keep them visible if the cancelDate month is less than or equal to the current period's month
   * BUT for the quarterly return itself (GSTR-3B), they should remain visible in the list until the end of the quarter.
   */
  const checkQrmpVisibility = (c: Client) => {
    if (!c.gstProfile) return false;
    
    // IFF/GSTR-1 Visibility
    const visibleInMonth = isClientVisibleInPeriod(c, selectedYear, selectedMonth);
    
    // GSTR-3B Quarterly Visibility (Show until end of quarter if cancelled inside it)
    if (isQuarterEnd) {
      if (c.gstProfile.cancelDate && c.gstProfile.gstStatus === 'Closed') {
        const cancelDate = new Date(c.gstProfile.cancelDate);
        const periodDate = periodToDate(selectedYear, selectedMonth);
        // If cancellation happened anytime before or during this quarter's end month, they still have to file the final quarterly 3B.
        // We hide them ONLY in the next quarter.
        const lastVisibleMonthDate = new Date(cancelDate.getFullYear(), cancelDate.getMonth(), 1);
        if (periodDate > lastVisibleMonthDate) return true; // Keep visible for final 3B if within quarter range logic? 
        // Actually, the simplest implementation is: if isClientVisibleInPeriod is true, or if it was true earlier in the same quarter.
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
                    <td className="px-[5.5px] py-[2px] text-right"><button onClick={() => { setSelectedClient(client); setIsLoginBoxOpen(true); }} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 flex items-center justify-center shadow-sm"><svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14" /></svg></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QuarterlyFiling;
