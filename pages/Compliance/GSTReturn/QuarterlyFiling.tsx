
import React, { useState, useEffect, useMemo } from 'react';
import { Client } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';
import { useQuarterlyFilingLogic } from './filinglogic/QuarterlyFilingLogic';
import { getDefaultPeriod, YEARS, QUARTERS, MONTHS } from './filinglogic/MonthlyFilingLogic';

const QuarterlyFiling: React.FC = () => {
  const defaultPeriod = getDefaultPeriod();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState(defaultPeriod.year);
  const [selectedQuarter, setSelectedQuarter] = useState(defaultPeriod.quarter);
  
  const { getStatus, toggleStatus, getDueDate } = useQuarterlyFilingLogic(selectedYear, selectedQuarter);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const data = await api.getClients();
      const filtered = data.filter(c => 
        c.status === 'Active Filing' && 
        c.gstProfile?.regType === 'Regular' &&
        c.gstProfile?.filingFreq === 'Quarterly'
      );
      setClients(filtered);
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchClients(); }, []);

  const filteredClients = useMemo(() => {
    // For quarterly, we check the first day of the quarter
    const qIndex = QUARTERS.indexOf(selectedQuarter);
    const startMonths = [3, 6, 9, 0]; // Apr, Jul, Oct, Jan
    const startMonthIdx = startMonths[qIndex];
    const yearStart = parseInt(selectedYear.split('-')[0]);
    const actualYear = startMonthIdx >= 3 ? yearStart : yearStart + 1;
    const qFirstDay = new Date(actualYear, startMonthIdx, 1);

    const s = search.toLowerCase();
    return clients.filter(c => {
      if (c.gstProfile?.regDate) {
        const regDate = new Date(c.gstProfile.regDate);
        if (qFirstDay < regDate) return false;
      }
      if (c.gstProfile?.gstStatus === 'Cancelled' && c.gstProfile.cancelDate) {
        const cancelDate = new Date(c.gstProfile.cancelDate);
        if (qFirstDay > cancelDate) return false;
      }
      return (c.legalName || '').toLowerCase().includes(s) || 
             (c.gstProfile?.gstin || '').toLowerCase().includes(s);
    });
  }, [clients, search, selectedQuarter, selectedYear]);

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 max-w-full mx-auto w-full overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="relative flex-1 w-full group">
          <input type="text" placeholder="Search QRMP client..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 outline-none">{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
          <select value={selectedQuarter} onChange={e => setSelectedQuarter(e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 outline-none">{QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}</select>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse table-fixed min-w-[1250px]">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400 w-[60px]">S.No</th>
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400 w-[240px]">Entity Name</th>
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400 w-[200px]">GSTIN</th>
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400 text-center w-[110px]">IFF/GSTR-1</th>
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400 text-center w-[110px]">GSTR-3B</th>
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400 w-[140px]">GSTIN Status</th>
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400 text-right w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client, idx) => {
                const st = getStatus(client.id);
                const isSuspended = client.gstProfile?.gstStatus === 'Suspended';
                return (
                  <tr key={client.id} className="group hover:bg-slate-50/50 transition-all text-[12px]">
                    <td className="px-4 py-5 font-black text-slate-300">{(idx + 1).toString().padStart(2, '0')}</td>
                    <td className="px-4 py-5 font-black text-slate-900 uppercase truncate">{client.tradeName || client.legalName}</td>
                    <td className="px-4 py-5 font-black text-indigo-600 font-mono tracking-widest">{client.gstProfile?.gstin}</td>
                    <td className="px-4 py-5 text-center">
                       <button onClick={() => toggleStatus(client.id, 'r1')} className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${st.r1 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                         {st.r1 ? 'Filed' : 'Pending'}
                       </button>
                    </td>
                    <td className="px-4 py-5 text-center">
                       <button onClick={() => toggleStatus(client.id, 'r3b')} className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${st.r3b ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                         {st.r3b ? 'Filed' : 'Pending'}
                       </button>
                    </td>
                    <td className="px-4 py-5">
                       <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${isSuspended ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600'}`}>
                         {isSuspended ? 'Suspended' : 'Active'}
                       </span>
                    </td>
                    <td className="px-4 py-5 text-right whitespace-nowrap">
                       <button onClick={() => { navigator.clipboard.writeText(client.gstProfile?.username || ''); window.open('https://services.gst.gov.in/services/login', '_blank'); }} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 flex items-center justify-center">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14" /></svg>
                       </button>
                    </td>
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
