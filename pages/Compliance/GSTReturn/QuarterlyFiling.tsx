
import React, { useState, useEffect, useMemo } from 'react';
import { Client } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';
import { useQuarterlyFilingLogic } from './filinglogic/QuarterlyFilingLogic';
import { getDefaultPeriod, YEARS, QUARTERS } from './filinglogic/MonthlyFilingLogic';

const QuarterlyFiling: React.FC = () => {
  const defaultPeriod = getDefaultPeriod();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState(defaultPeriod.year);
  const [selectedQuarter, setSelectedQuarter] = useState(defaultPeriod.quarter);
  
  const { getStatus, toggleStatus, updateDueDate, getDueDate } = useQuarterlyFilingLogic(selectedYear, selectedQuarter);

  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      try {
        const data = await api.getClients();
        setClients(data.filter(c => 
          c.status === 'Active Filing' && 
          c.gstProfile?.regType === 'Regular' &&
          c.gstProfile?.filingFreq === 'Quarterly'
        ));
      } finally { setIsLoading(false); }
    };
    fetchClients();
  }, []);

  const filteredClients = useMemo(() => {
    const s = search.toLowerCase();
    return clients.filter(c => 
      (c.legalName || '').toLowerCase().includes(s) || 
      (c.tradeName || '').toLowerCase().includes(s) ||
      (c.gstProfile?.gstin || '').toLowerCase().includes(s)
    );
  }, [clients, search]);

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-3 px-4 border-r border-slate-100 hidden md:flex shrink-0">
            <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              {filteredClients.length} QRMP Files
            </span>
        </div>
        <div className="relative flex-1 group w-full">
          <input type="text" placeholder="Search QRMP vault..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 font-bold text-sm text-slate-900 focus:ring-4 focus:ring-indigo-50 transition-all outline-none" />
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-2.5 text-[10px] font-black uppercase text-slate-600 cursor-pointer">{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
          <select value={selectedQuarter} onChange={e => setSelectedQuarter(e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-2.5 text-[10px] font-black uppercase text-slate-600 cursor-pointer">{QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}</select>
          <div className="flex items-center bg-slate-50 rounded-xl px-4 py-2.5 gap-2 border border-transparent focus-within:border-indigo-100 transition-all">
            <span className="text-[8px] font-black text-slate-400 uppercase whitespace-nowrap">Due:</span>
            <input type="date" value={getDueDate()} onChange={e => updateDueDate(e.target.value)} className="bg-transparent border-none p-0 text-[10px] font-black text-slate-600 cursor-pointer uppercase" />
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse table-fixed min-w-[1250px]">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[60px]">S.No</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[240px]">Entity Identity</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[180px]">GSTIN</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center w-[120px]">IFF/GSTR-1</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center w-[120px]">GSTR-3B</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[180px]">User ID</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client, idx) => {
                const st = getStatus(client.id);
                return (
                  <tr key={client.id} className="hover:bg-indigo-50/20 transition-all text-[12px]">
                    <td className="px-6 py-4 text-slate-300 font-black">{(idx + 1).toString().padStart(2, '0')}</td>
                    <td className="px-6 py-4">
                      <p className="font-black text-slate-900 uppercase truncate">{client.tradeName || client.legalName}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate">{client.legalName}</p>
                    </td>
                    <td className="px-6 py-4 font-black text-indigo-600 font-mono tracking-widest uppercase">{client.gstProfile?.gstin}</td>
                    <td className="px-6 py-4 text-center">
                       <button onClick={() => toggleStatus(client.id, 'r1')} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${st.r1 ? 'bg-indigo-100 text-indigo-700 border-indigo-200 shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                         {st.r1 ? 'Filed' : 'Pending'}</button>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <button onClick={() => toggleStatus(client.id, 'r3b')} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${st.r3b ? 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                         {st.r3b ? 'Filed' : 'Pending'}</button>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-700 truncate">{client.gstProfile?.username}</td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                       <button onClick={() => { navigator.clipboard.writeText(client.gstProfile?.username || ''); window.open('https://services.gst.gov.in/services/login', '_blank'); }} 
                         className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600 flex items-center justify-center ml-auto group-hover:scale-110 transition-all border border-slate-100 shadow-sm">
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

export default QuarterlyFiling;
