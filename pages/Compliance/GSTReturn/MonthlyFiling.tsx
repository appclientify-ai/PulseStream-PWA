
import React, { useState, useMemo } from 'react';
import { useClientData } from '../../../hooks/useClientData.ts';
import { useMonthlyFilingLogic, MONTHS, YEARS, getDefaultPeriod } from './filinglogic/MonthlyFilingLogic.tsx';

const MonthlyFiling: React.FC = () => {
  const { clients, isLoading } = useClientData();
  const defaultPeriod = getDefaultPeriod();
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState(defaultPeriod.year);
  const [selectedMonth, setSelectedMonth] = useState(defaultPeriod.month);
  
  const { getStatus, toggleStatus, updateDueDate, getDueDate } = useMonthlyFilingLogic(selectedYear, selectedMonth);

  const filteredClients = useMemo(() => {
    const s = search.toLowerCase();
    return clients.filter(c => 
      c.status === 'Active Filing' && 
      c.gstProfile?.regType === 'Regular' &&
      c.gstProfile?.filingFreq === 'Monthly' &&
      ((c.legalName || '').toLowerCase().includes(s) || 
       (c.tradeName || '').toLowerCase().includes(s) ||
       (c.gstProfile?.gstin || '').toLowerCase().includes(s))
    );
  }, [clients, search]);

  const stats = useMemo(() => {
    const total = filteredClients.length;
    const r1Filed = filteredClients.filter(c => getStatus(c.id).r1).length;
    const r3bFiled = filteredClients.filter(c => getStatus(c.id).r3b).length;
    return { total, r1Filed, r3bFiled };
  }, [filteredClients, getStatus]);

  if (isLoading) return <div className="p-20 text-center font-black uppercase text-slate-400">Loading Matrix...</div>;

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 overflow-hidden">
      
      {/* Matrix Command Strip */}
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Matrix</p>
            <p className="text-xl font-black text-slate-900 leading-none">{stats.total}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">R1 Done</p>
            <p className="text-xl font-black text-indigo-600 leading-none">{stats.r1Filed}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">3B Done</p>
            <p className="text-xl font-black text-emerald-600 leading-none">{stats.r3bFiled}</p>
          </div>
        </div>

        <div className="relative flex-1 group w-full">
          <input type="text" placeholder="Search matrix entities..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-4 focus:ring-indigo-50 outline-none transition-all" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex items-center gap-2 shrink-0">
           <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-slate-50 rounded-xl px-4 py-3 text-[11px] font-black uppercase text-slate-600">{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
           <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-slate-50 rounded-xl px-4 py-3 text-[11px] font-black uppercase text-slate-600">{MONTHS.map(m => <option key={m} value={m}>{m}</option>)}</select>
           <div className="bg-indigo-50 rounded-xl px-4 py-3 border border-indigo-100">
              <input type="date" value={getDueDate()} onChange={e => updateDueDate(e.target.value)} className="bg-transparent text-[11px] font-black text-indigo-600 outline-none uppercase" />
           </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[70px]">S.No</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[260px]">Client Identity</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[180px]">GSTIN</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center w-[130px]">GSTR-1</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center w-[130px]">GSTR-3B</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[180px]">Credentials</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-right w-[100px]">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client, idx) => {
                const st = getStatus(client.id);
                return (
                  <tr key={client.id} className="group hover:bg-indigo-50/20 transition-all text-[12px]">
                    <td className="px-6 py-5 text-slate-300 font-black">{(idx + 1).toString().padStart(2, '0')}</td>
                    <td className="px-6 py-5">
                      <p className="font-black text-slate-900 uppercase truncate">{client.tradeName || client.legalName}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-black text-indigo-600 font-mono tracking-widest uppercase">{client.gstProfile?.gstin}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <button onClick={() => toggleStatus(client.id, 'r1')} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${st.r1 ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                         {st.r1 ? 'Filed' : 'Pending'}
                       </button>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <button onClick={() => toggleStatus(client.id, 'r3b')} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${st.r3b ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                         {st.r3b ? 'Filed' : 'Pending'}
                       </button>
                    </td>
                    <td className="px-6 py-5">
                        <span className="text-[10px] font-black text-slate-700">{client.gstProfile?.username}</span>
                    </td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">
                       <button onClick={() => window.open('https://services.gst.gov.in/services/login', '_blank')} 
                         className="h-8 w-8 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center border border-slate-100 shadow-sm ml-auto">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
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

export default MonthlyFiling;
