
import React, { useState, useEffect, useMemo } from 'react';
import { Client } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';
import { useTaxAuditLogic } from './TAXAuditlogic';
import { YEARS } from '../GSTReturn/filinglogic/MonthlyFilingLogic';

const TAXAudit: React.FC = () => {
  const getPreviousFY = () => {
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    const startY = m >= 3 ? y - 1 : y - 2;
    return `${startY}-${(startY + 1).toString().slice(-2)}`;
  };

  const [allClients, setAllClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState(getPreviousFY());
  
  const { getStatus, toggleAuditStatus, setBSStatus, updateDueDate, getDueDate, watchlist, addToWatchlist } = useTaxAuditLogic(selectedYear);

  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      try {
        const data = await api.getClients();
        setAllClients(data);
      } finally { setIsLoading(false); }
    };
    fetchClients();
  }, []);

  const trackedClients = useMemo(() => {
    const ids = new Set(watchlist[selectedYear] || []);
    return allClients.filter(c => ids.has(c.id));
  }, [allClients, watchlist, selectedYear]);

  const filteredDisplayList = useMemo(() => {
    const s = search.toLowerCase();
    return trackedClients.filter(c => 
      (c.legalName || '').toLowerCase().includes(s) || 
      (c.itProfile?.pan || '').toLowerCase().includes(s)
    );
  }, [trackedClients, search]);

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-3 px-4 border-r border-slate-100 hidden md:flex shrink-0">
            <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{filteredDisplayList.length} Active Audits</span>
        </div>
        <div className="relative flex-1 group w-full">
          <input type="text" placeholder="Search audit pipeline..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 font-bold text-sm text-slate-900 focus:ring-4 focus:ring-emerald-50 transition-all outline-none" />
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-2.5 text-[10px] font-black uppercase text-slate-600 cursor-pointer">{YEARS.map(y => <option key={y} value={y}>FY {y}</option>)}</select>
          <div className="flex items-center bg-slate-50 rounded-xl px-4 py-2.5 gap-2 border border-transparent focus-within:border-emerald-100 transition-all">
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
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[240px]">Entity identity</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[180px]">PAN Identity</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center w-[160px]">Financials</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center w-[160px]">Audit Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[180px]">Auditor (CA)</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDisplayList.map((client, idx) => {
                const st = getStatus(client.id);
                return (
                  <tr key={client.id} className="hover:bg-slate-50/50 transition-all text-[12px]">
                    <td className="px-6 py-4 text-slate-300 font-black">{(idx + 1).toString().padStart(2, '0')}</td>
                    <td className="px-6 py-4">
                      <p className="font-black text-slate-900 uppercase truncate">{client.legalName}</p>
                    </td>
                    <td className="px-6 py-4 font-black text-indigo-600 font-mono tracking-widest uppercase">{client.itProfile?.pan}</td>
                    <td className="px-6 py-4 text-center">
                       <button onClick={() => setBSStatus(client.id, st.bsStatus === 'Ready' ? 'Pending' : 'Ready')} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${st.bsStatus === 'Ready' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                         {st.bsStatus}</button>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <button onClick={() => toggleAuditStatus(client.id)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${st.auditFiled ? 'bg-indigo-600 text-white shadow-lg border-indigo-700' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                         {st.auditFiled ? 'Filed' : 'Pending'}</button>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-700 truncate">{st.caName || '---'}</td>
                    <td className="px-6 py-4 text-right">
                       <button className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center ml-auto group-hover:scale-110 shadow-sm">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg>
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

export default TAXAudit;
