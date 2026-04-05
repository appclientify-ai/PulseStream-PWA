
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Client } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';
import GSTViewIcon from '../../../components/GSTViewIcon';
import { useCompositionFilingLogic } from './filinglogic/CompositionFilingLogic';
import { getDefaultPeriod, YEARS, QUARTERS, isClientVisibleInPeriod } from './filinglogic/MonthlyFilingLogic';

const CompositionFiling: React.FC = () => {
  const defaultPeriod = getDefaultPeriod();
  const [clients, setClients] = useState<Client[]>([]);
  const [allClientsBase, setAllClientsBase] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState(defaultPeriod.quarterYear);
  const [selectedQuarter, setSelectedQuarter] = useState(defaultPeriod.quarter);
  
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const { getStatus, toggleStatus, updateDueDate, getDueDate } = useCompositionFilingLogic(selectedYear, selectedQuarter);

  // For Composition, visibility check uses the quarter end month
  const quarterEndMonth = useMemo(() => {
    if (selectedQuarter.includes('Q1')) return 'June';
    if (selectedQuarter.includes('Q2')) return 'September';
    if (selectedQuarter.includes('Q3')) return 'December';
    return 'March';
  }, [selectedQuarter]);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const data = await api.getClients();
      setAllClientsBase(data);
      setClients(data.filter(c => c.gstProfile?.regType === 'Composition'));
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchClients(); }, []);

  const filteredClients = useMemo(() => {
    const s = search.toLowerCase();
    return clients.filter(c => 
      isClientVisibleInPeriod(c, selectedYear, quarterEndMonth) &&
      ((c.legalName || '').toLowerCase().includes(s) || 
       (c.tradeName || '').toLowerCase().includes(s) ||
       (c.gstProfile?.gstin || '').toLowerCase().includes(s))
    );
  }, [clients, search, selectedYear, quarterEndMonth]);

  const handleExport = () => {
    const headers = ["ID", "Trader", "GSTIN", "CMP-08 Status"].join(",");
    const rows = filteredClients.map(c => [c.id, c.tradeName, c.gstProfile?.gstin, getStatus(c.id).cmp08?'Filed':'Pending'].join(",")).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Composition_${selectedQuarter}.csv`; a.click();
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-4 px-2">
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex-1 relative group w-full">
          <input type="text" placeholder="Search composition client..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handleExport} className="h-11 w-11 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer">{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
          <select value={selectedQuarter} onChange={e => setSelectedQuarter(e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer">{QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}</select>
        </div>
      </div>
      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1 w-full">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-200 shadow-sm font-bold uppercase tracking-widest text-slate-900 text-[12px]">
                <th className="px-4 py-3 w-[60px]">S.No.</th>
                <th className="px-4 py-3 min-w-[200px]">Trade Name</th>
                <th className="px-4 py-3 w-[200px]">Legal Name</th>
                <th className="px-4 py-3 w-[120px]">Mobile No.</th>
                <th className="px-4 py-3 w-[180px]">GSTIN</th>
                <th className="px-4 py-3 w-[120px] text-center">CMP-08</th>
                <th className="px-4 py-3 w-[140px]">User ID</th>
                <th className="px-4 py-3 w-[160px]">Password</th>
                <th className="px-4 py-3 w-[100px] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client, idx) => {
                const st = getStatus(client.id);
                return (
                  <tr key={client.id} className="hover:bg-indigo-50/10 transition-all group h-[44px] text-[12px]">
                    <td className="px-4 py-[2px] font-black text-indigo-400 font-mono">{(idx + 1).toString().padStart(2, '0')}</td>
                    <td className="px-4 py-[2px] font-black uppercase truncate" title={client.tradeName}>{client.tradeName || '---'}</td>
                    <td className="px-4 py-[2px] font-bold text-slate-600 uppercase truncate" title={client.legalName}>{client.legalName}</td>
                    <td className="px-4 py-[2px] font-black text-slate-500 truncate">{client.mobile || '---'}</td>
                    <td className="px-4 py-[2px] font-black text-indigo-600 font-mono tracking-widest">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{client.gstProfile?.gstin}</span>
                        {client.gstProfile?.gstin && (
                          <button onClick={() => window.open(`https://services.gst.gov.in/services/searchtp?gstin=${client.gstProfile?.gstin}`, '_blank')} className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0" title="Search Taxpayer">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-[2px] text-center"><button onClick={() => toggleStatus(client.id)} className={`px-4 py-1 rounded-full text-[10px] font-black uppercase border ${st.cmp08 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>{st.cmp08 ? 'Filed' : 'Pending'}</button></td>
                    <td className="px-4 py-[2px] font-black text-slate-700 uppercase truncate">{client.gstProfile?.username}</td>
                    <td className="px-4 py-[2px] font-black text-indigo-400 tracking-widest">
                      <div className="flex items-center gap-2">
                        <span>••••••••</span>
                        {client.gstProfile?.username && (
                          <button onClick={() => { 
                            navigator.clipboard.writeText(client.gstProfile?.username || ''); 
                            window.open('https://services.gst.gov.in/services/login', '_blank'); 
                          }} className="p-1 text-slate-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all shrink-0" title="Login to GST Portal">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-[2px] text-right flex items-center justify-end gap-1">
                      <GSTViewIcon client={client} onDataChange={fetchClients} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL CLIENT DETAIL VIEW MODAL removed - replaced by GSTViewIcon */}
    </div>
  );
};

export default CompositionFiling;
