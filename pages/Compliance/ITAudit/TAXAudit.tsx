
import React, { useState, useMemo } from 'react';
import { useClientData } from '../../../hooks/useClientData.ts';
import { useTaxAuditLogic, BSStatus } from './TAXAuditlogic.tsx';
import { YEARS } from '../GSTReturn/filinglogic/MonthlyFilingLogic.tsx';

const TAXAudit: React.FC = () => {
  const { clients, isLoading, fetchData } = useClientData();
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState(YEARS[0]);
  
  const { getStatus, toggleAuditStatus, setBSStatus, getDueDate, updateDueDate, watchlist, addToWatchlist } = useTaxAuditLogic(selectedYear);

  const trackedClients = useMemo(() => {
    const activeIds = new Set(watchlist[selectedYear] || []);
    return clients.filter(c => activeIds.has(c.id));
  }, [clients, watchlist, selectedYear]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return trackedClients.filter(c => 
      (c.legalName || '').toLowerCase().includes(s) || 
      (c.itProfile?.pan || '').toLowerCase().includes(s)
    );
  }, [trackedClients, search]);

  const stats = useMemo(() => ({
    total: trackedClients.length,
    audited: trackedClients.filter(c => getStatus(c.id).auditFiled).length,
    ready: trackedClients.filter(c => getStatus(c.id).bsStatus === 'Ready').length
  }), [trackedClients, getStatus]);

  if (isLoading) return <div className="p-20 text-center font-black uppercase text-slate-400">Syncing Vault...</div>;

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 overflow-hidden">
      
      {/* Command Strip */}
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Portfolio</p>
            <p className="text-xl font-black text-slate-900 leading-none">{stats.total}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Financials</p>
            <p className="text-xl font-black text-emerald-600 leading-none">{stats.ready}</p>
          </div>
        </div>

        <div className="relative flex-1 group w-full">
          <input type="text" placeholder="Search audit queue..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3.5 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-4 focus:ring-indigo-50 outline-none transition-all" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} 
            className="bg-slate-50 rounded-xl px-4 py-3 text-[11px] font-black uppercase text-slate-600 outline-none cursor-pointer">
            {YEARS.map(y => <option key={y} value={y}>FY {y}</option>)}
          </select>
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
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[240px]">Entity Name</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[180px]">PAN / GSTIN</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center w-[170px]">Financials</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-center w-[130px]">Audit Status</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-right w-[100px]">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-32 text-center text-slate-300 font-black uppercase tracking-widest text-sm">No entities tracked for audit in {selectedYear}</td></tr>
              ) : (
                filtered.map((client, idx) => {
                  const st = getStatus(client.id);
                  return (
                    <tr key={client.id} className="group hover:bg-slate-50/50 transition-all text-[12px]">
                      <td className="px-6 py-5 font-black text-slate-300">{(idx + 1).toString().padStart(2, '0')}</td>
                      <td className="px-6 py-5">
                        <p className="font-black text-slate-900 uppercase truncate">{client.legalName}</p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-black text-indigo-600 font-mono tracking-wider uppercase">{client.itProfile?.pan || client.gstProfile?.gstin}</span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button onClick={() => setBSStatus(client.id, 'Ready')} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${st.bsStatus === 'Ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                          {st.bsStatus}
                        </button>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button onClick={() => toggleAuditStatus(client.id)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${st.auditFiled ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                          {st.auditFiled ? 'Completed' : 'Pending'}
                        </button>
                      </td>
                      <td className="px-6 py-5 text-right whitespace-nowrap">
                         <button className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center shadow-sm ml-auto">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg>
                         </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TAXAudit;
