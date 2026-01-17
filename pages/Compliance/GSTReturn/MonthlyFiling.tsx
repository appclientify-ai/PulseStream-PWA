
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Client } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';
import { useMonthlyFilingLogic, MONTHS, YEARS, getDefaultPeriod, isClientVisibleInPeriod } from './filinglogic/MonthlyFilingLogic';

const MonthlyFiling: React.FC = () => {
  const defaultPeriod = getDefaultPeriod();
  const [clients, setClients] = useState<Client[]>([]);
  const [allClientsBase, setAllClientsBase] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState(defaultPeriod.year);
  const [selectedMonth, setSelectedMonth] = useState(defaultPeriod.month);
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoginBoxOpen, setIsLoginBoxOpen] = useState(false);
  const [isEditingLoginPass, setIsEditingLoginPass] = useState(false);
  const [tempPass, setTempPass] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  const [r1Filter, setR1Filter] = useState<'All' | 'Filed' | 'Pending'>('All');
  const [r3bFilter, setR3bFilter] = useState<'All' | 'Filed' | 'Pending'>('All');
  const [isR1FilterOpen, setIsR1FilterOpen] = useState(false);
  const [isR3bFilterOpen, setIsR3bFilterOpen] = useState(false);

  const [activeActionsId, setActiveActionsId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const actionsRef = useRef<HTMLDivElement>(null);

  const { getStatus, toggleStatus, updateDueDate, getDueDate } = useMonthlyFilingLogic(selectedYear, selectedMonth);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const data = await api.getClients();
      setAllClientsBase(data);
      // Base filtering for Monthly/Regular
      setClients(data.filter(c => c.gstProfile?.regType === 'Regular' && c.gstProfile?.filingFreq === 'Monthly'));
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

  const getClientDisplayId = useCallback((client: Client) => {
    if (!client.gstProfile) return '---';
    const isState = client.gstProfile.jurisdictionType === 'State';
    const val = isState ? client.gstProfile.sector : client.gstProfile.range;
    const prefix = isState ? 'S' : 'C';
    const sameGroup = allClientsBase.filter(c => 
      c.gstProfile?.jurisdictionType === client.gstProfile?.jurisdictionType &&
      (isState ? c.gstProfile?.sector === val : c.gstProfile?.range === val)
    ).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    const rank = sameGroup.findIndex(c => c.id === client.id) + 1;
    return `${prefix}/${val || '?'}/${rank}`;
  }, [allClientsBase]);

  const filteredClients = useMemo(() => {
    const s = search.toLowerCase();
    let list = clients.filter(c => 
      (isClientVisibleInPeriod(c, selectedYear, selectedMonth)) &&
      ((c.legalName || '').toLowerCase().includes(s) || 
       (c.tradeName || '').toLowerCase().includes(s) ||
       (c.gstProfile?.gstin || '').toLowerCase().includes(s))
    );

    if (r1Filter !== 'All') list = list.filter(c => r1Filter === 'Filed' ? getStatus(c.id).r1 : !getStatus(c.id).r1);
    if (r3bFilter !== 'All') list = list.filter(c => r3bFilter === 'Filed' ? getStatus(c.id).r3b : !getStatus(c.id).r3b);
    return list;
  }, [clients, search, r1Filter, r3bFilter, getStatus, selectedYear, selectedMonth]);

  const handleExport = () => {
    const headers = ["ID", "Trader", "GSTIN", "R1", "3B"].join(",");
    const rows = filteredClients.map(c => {
      const st = getStatus(c.id);
      return [getClientDisplayId(c), c.tradeName, c.gstProfile?.gstin, st.r1?'Filed':'Pending', st.r3b?'Filed':'Pending'].join(",");
    }).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Monthly_${selectedMonth}_${selectedYear}.csv`; a.click();
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 max-w-full mx-auto w-full overflow-hidden px-2">
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Vault</p>
            <p className="text-xl font-black text-slate-900 leading-none">{filteredClients.length}</p>
          </div>
        </div>
        <div className="relative flex-1 w-full group">
          <input type="text" placeholder="Search entity..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <div className="flex items-center gap-2 shrink-0">
           <button onClick={handleExport} className="h-11 w-11 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm" title="Export CSV"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
           <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer hover:bg-slate-100 transition-colors">{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
           <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer hover:bg-slate-100 transition-colors">{MONTHS.map(m => <option key={m} value={m}>{m}</option>)}</select>
           <div className="flex items-center bg-slate-50 rounded-xl px-4 py-3 gap-2 border border-transparent focus-within:border-indigo-100 transition-all">
            <span className="text-[9px] font-black text-slate-400 uppercase whitespace-nowrap">Due:</span>
            <input type="date" value={getDueDate()} onChange={e => updateDueDate(e.target.value)} className="bg-transparent border-none p-0 text-[11px] font-black text-slate-600 outline-none cursor-pointer uppercase" />
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1 w-full">
          <table className="w-full text-left border-collapse table-fixed min-w-[1400px]">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-200 shadow-sm">
                <th className="px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900 w-[90px]">ID no.</th>
                <th className="px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900 w-[180px]">Trader Name</th>
                <th className="px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900 w-[200px]">Legal Name</th>
                <th className="px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900 w-[180px]">GSTIN</th>
                <th className="px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900 w-[120px] text-center relative">
                   <div className="flex items-center justify-center gap-1">GSTR-1 <button onClick={() => setIsR1FilterOpen(!isR1FilterOpen)} className="p-1 hover:bg-slate-200 rounded transition-colors"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg></button></div>
                   {isR1FilterOpen && <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-[400] p-1 animate-in zoom-in-95">{['All', 'Filed', 'Pending'].map(f => <button key={f} onClick={() => { setR1Filter(f as any); setIsR1FilterOpen(false); }} className={`w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg ${r1Filter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{f}</button>)}</div>}
                </th>
                <th className="px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900 w-[120px] text-center relative">
                   <div className="flex items-center justify-center gap-1">GSTR-3B <button onClick={() => setIsR3bFilterOpen(!isR3bFilterOpen)} className="p-1 hover:bg-slate-200 rounded transition-colors"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg></button></div>
                   {isR3bFilterOpen && <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-[400] p-1 animate-in zoom-in-95">{['All', 'Filed', 'Pending'].map(f => <button key={f} onClick={() => { setR3bFilter(f as any); setIsR3bFilterOpen(false); }} className={`w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg ${r3bFilter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{f}</button>)}</div>}
                </th>
                <th className="px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900 w-[130px]">User ID</th>
                <th className="px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900 w-[160px]">Password</th>
                <th className="px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900 text-right w-[110px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client) => {
                const st = getStatus(client.id);
                return (
                  <tr key={client.id} className="hover:bg-indigo-50/10 transition-all group border-b border-slate-50 last:border-0 h-[44px]">
                    <td className="px-[5.5px] py-[2px] font-black text-indigo-400 font-mono text-[12px] truncate">{getClientDisplayId(client)}</td>
                    <td className="px-[5.5px] py-[2px] font-black text-slate-900 uppercase truncate text-[12px]">{client.tradeName || '---'}</td>
                    <td className="px-[5.5px] py-[2px] font-bold text-slate-600 uppercase truncate text-[12px]">{client.legalName}</td>
                    <td className="px-[5.5px] py-[2px] font-black font-mono tracking-widest uppercase text-[12px] text-indigo-600">{client.gstProfile?.gstin}</td>
                    <td className="px-[5.5px] py-[2px] text-center"><button onClick={() => toggleStatus(client.id, 'r1')} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${st.r1 ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>{st.r1 ? 'Filed' : 'Pending'}</button></td>
                    <td className="px-[5.5px] py-[2px] text-center"><button onClick={() => toggleStatus(client.id, 'r3b')} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${st.r3b ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>{st.r3b ? 'Filed' : 'Pending'}</button></td>
                    <td className="px-[5.5px] py-[2px] font-black text-slate-700 text-[12px] uppercase truncate">{client.gstProfile?.username}</td>
                    <td className="px-[5.5px] py-[2px] font-black text-indigo-400 text-[12px] tracking-widest">••••••••</td>
                    <td className="px-[5.5px] py-[2px] text-right">
                       <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setSelectedClient(client); setIsLoginBoxOpen(true); }} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 flex items-center justify-center shadow-sm"><svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14" /></svg></button>
                       </div>
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
