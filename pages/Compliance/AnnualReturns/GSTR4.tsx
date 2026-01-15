
import React, { useState, useEffect, useMemo } from 'react';
import { Client } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';
import { ModuleStatCard } from '../../../components/DashboardUI';
import { useGSTR4Logic } from './GSTR4logic';
import { YEARS } from '../GSTReturn/filinglogic/MonthlyFilingLogic';

const GSTR4: React.FC = () => {
  const getPreviousFY = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const startYear = currentMonth >= 3 ? currentYear - 1 : currentYear - 2;
    return `${startYear}-${(startYear + 1).toString().slice(-2)}`;
  };

  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState(getPreviousFY());
  
  const { getStatus, toggleStatus, getDueDate, updateDueDate } = useGSTR4Logic(selectedYear);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await api.getClients();
        setClients(data.filter(c => c.gstProfile?.regType === 'Composition'));
      } finally { setIsLoading(false); }
    };
    load();
  }, []);

  const filteredClients = useMemo(() => {
    const s = search.toLowerCase();
    return clients.filter(c => 
      c.legalName.toLowerCase().includes(s) || 
      (c.tradeName || '').toLowerCase().includes(s) ||
      (c.gstProfile?.gstin || '').toLowerCase().includes(s)
    );
  }, [clients, search]);

  const stats = useMemo(() => {
    const total = filteredClients.length;
    const filed = filteredClients.filter(c => getStatus(c.id).filed).length;
    return { total, filed };
  }, [filteredClients, getStatus]);

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-8 animate-in fade-in duration-500 overflow-hidden">
      
      {/* Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ModuleStatCard 
              title="Composition Hub" 
              icon="📄" 
              stats={[
                  { label: 'Total Entities', value: stats.total },
                  { label: 'FY Period', value: selectedYear }
              ]}
              dueDate={`Target: ${getDueDate() || 'Not Set'}`}
          />
          <ModuleStatCard 
              title="Filing Velocity" 
              icon="⚡" 
              stats={[
                  { label: 'Filed', value: stats.filed, color: 'text-emerald-600' },
                  { label: 'Remaining', value: stats.total - stats.filed, color: 'text-rose-500' }
              ]}
              chartData={{ value: stats.filed, total: stats.total }}
          />
          <ModuleStatCard 
              title="Audit Preparedness" 
              icon="🛡️" 
              stats={[
                  { label: 'Data Ready', value: '82%' },
                  { label: 'Risk Factor', value: 'Low' }
              ]}
          />
      </section>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="relative flex-1 group w-full">
          <input type="text" placeholder="Search composition taxpayers in GSTR-4 vault..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3.5 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-4 focus:ring-indigo-50 outline-none transition-all" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} 
            className="bg-slate-50 border-none rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer hover:bg-slate-100">
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="flex items-center bg-slate-50 rounded-xl px-4 py-3 gap-2 border border-transparent focus-within:border-indigo-100 transition-all">
            <span className="text-[9px] font-black text-slate-400 uppercase whitespace-nowrap">Due:</span>
            <input type="date" value={getDueDate()} onChange={e => updateDueDate(e.target.value)} className="bg-transparent border-none p-0 text-[11px] font-black text-slate-600 outline-none cursor-pointer uppercase" />
          </div>
        </div>
      </div>

      {/* Main Table Vault */}
      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[70px]">S.No</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[260px]">Client Identity</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[200px]">GSTIN</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center w-[150px]">Filing Status</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[180px]">Filing Date</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[160px]">Vault ID</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((c, idx) => {
                const st = getStatus(c.id);
                return (
                  <tr key={c.id} className="group hover:bg-indigo-50/20 transition-all text-[12px]">
                    <td className="px-6 py-5 font-black text-slate-300">{(idx + 1).toString().padStart(2, '0')}</td>
                    <td className="px-6 py-5">
                       <p className="font-black text-slate-900 uppercase truncate">{c.tradeName || c.legalName}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate">{c.legalName}</p>
                    </td>
                    <td className="px-6 py-5">
                       <span className="font-black text-indigo-600 font-mono tracking-widest uppercase">{c.gstProfile?.gstin}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <button onClick={() => toggleStatus(c.id)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${st.filed ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'}`}>
                         {st.filed ? 'Filed' : 'Pending'}
                       </button>
                    </td>
                    <td className="px-6 py-5 font-black text-slate-500 uppercase">{st.date || '---'}</td>
                    <td className="px-6 py-5 font-black text-slate-400 uppercase">{c.gstProfile?.username}</td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">
                       <button onClick={() => { navigator.clipboard.writeText(c.gstProfile?.username || ''); window.open('https://services.gst.gov.in/services/login', '_blank'); }} 
                         className="h-8 w-8 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center border border-slate-100 ml-auto group-hover:scale-110">
                          <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
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

export default GSTR4;
