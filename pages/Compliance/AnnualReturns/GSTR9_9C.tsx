
import React, { useState, useEffect, useMemo } from 'react';
import { Client } from '../../../types';
import { api } from '../../../services/api.ts';
import GSTClientFormModal from '../../Clientform/GSTClientFormModal';
import Loader from '../../../components/Loader';
import { useGSTR9Logic } from './GSTR9_9Clogic';
import { YEARS } from '../GSTReturn/filinglogic/MonthlyFilingLogic';

const GSTR9_9C: React.FC = () => {
  const getPreviousFY = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const startYear = currentMonth >= 3 ? currentYear - 1 : currentYear - 2;
    return `${startYear}-${(startYear + 1).toString().slice(-2)}`;
  };

  const [allClients, setAllClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState(getPreviousFY());
  
  const [gstr9Filter, setGstr9Filter] = useState<'All' | 'Filed' | 'Pending'>('All');
  const [gstr9cFilter, setGstr9cFilter] = useState<'All' | 'Filed' | 'Pending'>('All');
  const [activeHeaderFilter, setActiveHeaderFilter] = useState<'gstr9' | 'gstr9c' | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [pendingClientToAdd, setPendingClientToAdd] = useState<Client | null>(null);
  const [addSearch, setAddSearch] = useState('');
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  const { 
    getStatus, 
    toggleStatus, 
    watchlist, 
    addToWatchlist, 
    removeFromWatchlist,
    hasFilingInYear,
    is9CApplicable,
    updateDueDate,
    getDueDate
  } = useGSTR9Logic(selectedYear);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const data = await api.getClients();
      setAllClients(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const trackedClients = useMemo(() => {
    const selectedStartYear = parseInt(selectedYear.split('-')[0]);
    const activeIds = new Set<string>();

    Object.keys(watchlist).forEach(fy => {
      const ids = watchlist[fy] as string[];
      const fyStart = parseInt(fy.split('-')[0]);
      if (fyStart <= selectedStartYear) {
        ids.forEach(id => activeIds.add(id));
      }
    });

    return allClients.filter(c => {
      const isRegular = c.gstProfile?.regType === 'Regular';
      if (!isRegular) return false;
      const inWatchlistRecord = activeIds.has(c.id);
      const hasHistory = hasFilingInYear(c.id, selectedYear);
      return inWatchlistRecord || hasHistory;
    });
  }, [allClients, watchlist, selectedYear, hasFilingInYear]);

  const filteredDisplayList = useMemo(() => {
    const s = search.toLowerCase();
    let list = trackedClients.filter(c => 
      (c.legalName || '').toLowerCase().includes(s) || 
      (c.tradeName || '').toLowerCase().includes(s) || 
      (c.gstProfile?.gstin && c.gstProfile.gstin.toLowerCase().includes(s))
    );

    if (gstr9Filter !== 'All') {
      list = list.filter(c => gstr9Filter === 'Filed' ? getStatus(c.id).gstr9 : !getStatus(c.id).gstr9);
    }
    return list;
  }, [trackedClients, search, gstr9Filter, getStatus]);

  const stats = useMemo(() => {
    const list = trackedClients; 
    const gstr9Filed = list.filter(c => getStatus(c.id).gstr9).length;
    const gstr9cFiled = list.filter(c => getStatus(c.id).gstr9c).length;
    return { total: list.length, gstr9Filed, gstr9cFiled };
  }, [trackedClients, getStatus]);

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 max-w-full mx-auto w-full overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">FY {selectedYear}</p>
            <p className="text-xl font-black text-slate-900 leading-none">{stats.total}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">9 Filed</p>
            <p className="text-xl font-black text-emerald-600 leading-none">{stats.gstr9Filed}</p>
          </div>
        </div>

        <div className="relative flex-1 w-full group">
          <input type="text" placeholder="Search regular entity or GSTIN..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} 
            className="bg-slate-50 border-none rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer">
            {YEARS.map(y => <option key={y} value={y}>FY {y}</option>)}
          </select>
          <button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 text-white font-black uppercase tracking-tight px-6 h-11 rounded-xl shadow-lg hover:bg-slate-900 transition-all flex items-center gap-2 text-xs">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            Add Client
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse table-fixed min-w-[1300px]">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-5 text-[12px] font-black uppercase tracking-widest text-slate-400 w-[60px]">S.No</th>
                <th className="px-4 py-5 text-[12px] font-black uppercase tracking-widest text-slate-400 w-[220px]">Trade Name</th>
                <th className="px-4 py-5 text-[12px] font-black uppercase tracking-widest text-slate-400 w-[200px]">GSTIN</th>
                <th className="px-4 py-5 text-[12px] font-black uppercase tracking-widest text-slate-400 text-center w-[120px]">GSTR-9</th>
                <th className="px-4 py-5 text-[12px] font-black uppercase tracking-widest text-slate-400 text-center w-[120px]">GSTR-9C</th>
                <th className="px-4 py-5 text-[12px] font-black uppercase tracking-widest text-slate-400 w-[160px]">Username</th>
                <th className="px-4 py-5 text-[12px] font-black uppercase tracking-widest text-slate-400 text-right w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDisplayList.map((client, idx) => {
                const st = getStatus(client.id);
                return (
                  <tr key={client.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-4 py-5 font-black text-slate-300">{(idx + 1).toString().padStart(2, '0')}</td>
                    <td className="px-4 py-5 font-black text-slate-900 uppercase truncate">{client.tradeName || client.legalName}</td>
                    <td className="px-4 py-5 font-black text-indigo-600 font-mono tracking-widest uppercase">{client.gstProfile?.gstin}</td>
                    <td className="px-4 py-5 text-center">
                      <button onClick={() => toggleStatus(client.id, 'gstr9')} className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${st.gstr9 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                        {st.gstr9 ? 'Filed' : 'Pending'}
                      </button>
                    </td>
                    <td className="px-4 py-5 text-center">
                       <button onClick={() => toggleStatus(client.id, 'gstr9c')} className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${st.gstr9c ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                        {st.gstr9c ? 'Filed' : 'Pending'}
                      </button>
                    </td>
                    <td className="px-4 py-5 font-black text-slate-700 truncate">{client.gstProfile?.username}</td>
                    <td className="px-4 py-5 text-right whitespace-nowrap">
                       <button onClick={() => { setSelectedClient(client); setIsDetailModalOpen(true); }} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 flex items-center justify-center">
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

export default GSTR9_9C;
