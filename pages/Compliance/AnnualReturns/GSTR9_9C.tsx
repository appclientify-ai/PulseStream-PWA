
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { formatDate } from '../../../exportUtils';
import { Client } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';
import GSTViewIcon from '../../../components/GSTViewIcon';
import { TableFilter } from '../../../components/TableFilter';
import { useGSTR9Logic } from './GSTR9_9Clogic';
import { EditableRemark } from '../../../components/EditableRemark';
import { YEARS, isClientVisibleInFY } from '../GSTReturn/filinglogic/MonthlyFilingLogic';
import { toast } from 'sonner';
import { ExportMenu } from '../../../components/ExportMenu';
import { exportToCSV, printList } from '../../../exportUtils';
import { useGlobalDueDates } from '../../../hooks/useGlobalDueDates';
import { formatISOToDDMMYYYY } from '../../../dateUtils';

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
  
  const { getGlobalDueDate } = useGlobalDueDates(selectedYear);
  const gstr9DueDate = getGlobalDueDate('annual_gstr9', 'Annual');
  const gstr9cDueDate = getGlobalDueDate('annual_gstr9c', 'Annual');
  
  // Modals & Tools
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditApplicabilityOpen, setIsEditApplicabilityOpen] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [is9CApplicableState, setIs9CApplicableState] = useState(true);
  const [turnoverState, setTurnoverState] = useState('');
    const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [newPassVal, setNewPassVal] = useState('');

  // Filters
  const [gstr9Filter, setGstr9Filter] = useState<'All' | 'Filed' | 'Pending'>('All');
  const [gstr9cFilter, setGstr9cFilter] = useState<'All' | 'Filed' | 'Pending' | 'N/A'>('All');
  const [is9FilterOpen, setIs9FilterOpen] = useState(false);
  const [is9cFilterOpen, setIs9cFilterOpen] = useState(false);

  // Actions Menu State
  const [activeActionsId, setActiveActionsId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const actionsRef = useRef<HTMLDivElement>(null);

  const { 
    getStatus, toggleStatus, updateRemark, watchlist, addToWatchlist, 
    removeFromWatchlist, is9CApplicable, update9CApplicability,
    getDueDate, updateDueDate 
  } = useGSTR9Logic(selectedYear);

  const fetchClients = async (isSync = false) => {
    if (!isSync) setIsLoading(true);
    try {
      const data = await api.getClients();
      setAllClients(data);
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchClients();
    const syncHandler = () => fetchClients(true);
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, []);

  useEffect(() => {
    const handleClose = (event: any) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setActiveActionsId(null);
      }
    };
    if (activeActionsId) document.addEventListener('mousedown', handleClose);
    return () => document.removeEventListener('mousedown', handleClose);
  }, [activeActionsId]);

  const getClientDisplayId = useCallback((client: Client) => {
    if (!client.gstProfile) return '---';
    const isState = client.gstProfile.jurisdictionType === 'State';
    const val = isState ? client.gstProfile.sector : client.gstProfile.range;
    const prefix = isState ? 'S' : 'C';
    const sameGroup = allClients.filter(c => 
      c.gstProfile?.jurisdictionType === client.gstProfile?.jurisdictionType &&
      (isState ? c.gstProfile?.sector === val : c.gstProfile?.range === val)
    ).sort((a, b) => (new Date(a.createdAt || 0).getTime()) - (new Date(b.createdAt || 0).getTime()));
    const rank = sameGroup.findIndex(c => c.id === client.id) + 1;
    return `${prefix}/${val || '?'}/${rank}`;
  }, [allClients]);

    const stats = useMemo(() => {
    let total = 0, filed = 0, pending = 0;
    const currentWatchlist = watchlist[selectedYear] || [];
    const baseClients = allClients.filter(c => {
      if (!c) return false;
      return currentWatchlist.includes(c.id);
    });
    total = baseClients.length;
    baseClients.forEach(c => {
      // For GSTR9/9C we can just count GSTR-9 filing status as primary indicator of filed/pending for now.
      if (getStatus(c.id).gstr9) filed++;
      else pending++;
    });
    return { total, filed, pending };
  }, [allClients, selectedYear, watchlist, getStatus]);

  const filteredDisplayList = useMemo(() => {
    const s = search.toLowerCase();
    const currentWatchlist = watchlist[selectedYear] || [];
    
    return allClients.filter(c => {
      if (!c) return false;
      const inWatchlist = currentWatchlist.includes(c.id);
      if (!inWatchlist) return false;
      
      return (c.legalName || '').toLowerCase().includes(s) || 
             (c.tradeName || '').toLowerCase().includes(s) || 
             (c.gstProfile?.gstin && c.gstProfile.gstin.toLowerCase().includes(s));
    }).filter(c => {
      if (gstr9Filter !== 'All') {
        const filed = getStatus(c.id).gstr9;
        if (gstr9Filter === 'Filed' && !filed) return false;
        if (gstr9Filter === 'Pending' && filed) return false;
      }
      if (gstr9cFilter !== 'All') {
        const isApp = is9CApplicable(c.id);
        if (gstr9cFilter === 'N/A' && isApp) return false;
        if (gstr9cFilter !== 'N/A' && !isApp) return false;
        if (gstr9cFilter === 'Filed' && !getStatus(c.id).gstr9c) return false;
        if (gstr9cFilter === 'Pending' && getStatus(c.id).gstr9c) return false;
      }
      return true;
    });
  }, [allClients, search, selectedYear, watchlist, gstr9Filter, gstr9cFilter, getStatus, is9CApplicable]);


    const groupedClients = useMemo(() => {
    const groups: Record<string, typeof filteredDisplayList> = {};
    filteredDisplayList.forEach(c => {
      const sector = c.gstProfile?.sector || 'Uncategorized';
      if (!groups[sector]) groups[sector] = [];
      groups[sector].push(c);
    });
    const sortedKeys = Object.keys(groups).sort((a, b) => {
       if (a === 'Uncategorized') return 1;
       if (b === 'Uncategorized') return -1;
       return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
    return sortedKeys.map(k => ({ sector: k, clients: groups[k].sort((c1, c2) => (c1.tradeName || '').localeCompare(c2.tradeName || '')) }));
  }, [filteredDisplayList]);

  const handleExportCSV = () => {
    const headers = ["ID", "Trader", "GSTIN", "GSTR-9", "GSTR-9C", "User ID", "Password", "Remark"].join(",");
    const rows = filteredDisplayList.map(c => {
      const s = getStatus(c.id);
      const app9c = is9CApplicable(c.id);
      return [
        getClientDisplayId(c), 
        c.tradeName, 
        c.gstProfile?.gstin, 
        s.gstr9 ? 'Filed' : 'Pending',
        app9c ? (s.gstr9c ? 'Filed' : 'Pending') : 'N/A',
        c.gstProfile?.gstPortalUsername || '---',
        c.gstProfile?.gstPortalPassword || '---'
      ];
    });
    exportToCSV(headers.split(','), rows, 'GSTR9_9C_Audit.csv');
  };

  const handleExportPDF = () => {
    const headers = ["ID", "Trader", "GSTIN", "GSTR-9", "GSTR-9C"];
    headers.push("Remark");
    const rows = filteredDisplayList.map(c => {
      const s = getStatus(c.id);
      const app9c = is9CApplicable(c.id);
      return [
        getClientDisplayId(c), 
        c.tradeName, 
        c.gstProfile?.gstin, 
        s.gstr9 ? 'Filed' : 'Pending',
        app9c ? (s.gstr9c ? 'Filed' : 'Pending') : 'N/A'
      ];
    });
    printList('GSTR-9/9C Audit Returns', headers, rows);
  };

  const openActionsMenu = (e: React.MouseEvent, client: Client) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + window.scrollY + 8, left: rect.right - 256 });
    setActiveActionsId(client.id);
    setSelectedClient(client);
  };

  const handleUpdatePassword = async () => {
    if (!selectedClient || !newPassVal.trim()) return;
    try {
      const updated = { ...selectedClient, gstProfile: { ...selectedClient.gstProfile!, password: newPassVal } };
      await api.saveClient(updated);
      setAllClients(prev => prev.map(c => c.id === selectedClient.id ? (updated as Client) : c));
      setEditingPasswordId(null);
    } catch (err) { toast.error("Update failed."); }
  };

  const shareViaWhatsApp = (text: string) => {
    window.location.href = `whatsapp://send?text=${encodeURIComponent(text)}`;
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-2 landscape:space-y-1 pb-2 overflow-hidden animate-in fade-in duration-500 max-w-full mx-auto w-full">
      
      {/* Mobile & Tablet Compact Stats Strip */}
      <div className="flex flex-wrap items-center justify-between w-full lg:hidden gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl shadow-xs text-xs font-bold text-slate-700 shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-tight">Total: <strong className="font-black text-slate-900">{stats.total}</strong></span>
          <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-tight">Filed: <strong className="font-black text-indigo-900">{stats.filed}</strong></span>
          <span className="bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-tight">Pending: <strong className="font-black text-rose-900">{stats.pending}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-tight font-black text-slate-500">
          {gstr9DueDate && <span>GSTR-9: <strong className="text-indigo-600">{formatISOToDDMMYYYY(gstr9DueDate)}</strong></span>}
          {gstr9cDueDate && <span>9C: <strong className="text-emerald-600">{formatISOToDDMMYYYY(gstr9cDueDate)}</strong></span>}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-3 landscape:gap-1 bg-white p-2.5 landscape:p-1 rounded-[1.5rem] landscape:rounded-xl border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden lg:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">GSTR-9/9C Total</p>
            <p className="text-xl font-black text-slate-900 leading-none">{stats.total}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-0.5">Filed</p>
            <p className="text-xl font-black text-indigo-600 leading-none">{stats.filed}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-0.5">Pending</p>
            <p className="text-xl font-black text-rose-600 leading-none">{stats.pending}</p>
          </div>
        </div>
        <div className="relative flex-1 group w-full">
          <input type="text" placeholder="Search entity in audit list..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-2.5 landscape:py-1 pl-10 pr-3 font-bold text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none" />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ExportMenu onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
          <button onClick={() => { setSelectedClient(null); setAddSearch(''); setIsAddModalOpen(true); }} className="h-10 landscape:h-8 px-5 landscape:px-3 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-md hover:bg-slate-900 transition-all flex items-center gap-1.5 shrink-0">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            Track Entity
          </button>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 landscape:h-8 text-[11px] font-black uppercase tracking-widest text-slate-700 outline-none cursor-pointer">{YEARS.map(y => <option key={y} value={y}>FY {y}</option>)}</select>
          {gstr9DueDate && (
            <div className="flex items-center bg-indigo-50 border border-indigo-100 rounded-xl px-3 h-10 landscape:h-8 gap-1.5 text-indigo-700 font-bold text-[10px] uppercase shrink-0">
              <span>9 Due: <strong>{formatISOToDDMMYYYY(gstr9DueDate)}</strong></span>
            </div>
          )}
          {gstr9cDueDate && (
            <div className="flex items-center bg-emerald-50 border border-emerald-100 rounded-xl px-3 h-10 landscape:h-8 gap-1.5 text-emerald-700 font-bold text-[10px] uppercase shrink-0">
              <span>9C Due: <strong>{formatISOToDDMMYYYY(gstr9cDueDate)}</strong></span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-auto no-scrollbar flex-1 w-full relative h-full">
          <table className="w-full text-left border-collapse table-auto min-w-full">
            <thead className="sticky top-0 z-30 bg-slate-100">
              <tr className="bg-slate-50 border-b border-slate-200 shadow-sm">
                <th className="sticky top-0 z-30 bg-slate-100 px-[5.5px] py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200">S.No.</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-[5.5px] py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200">Trader Name</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-[5.5px] py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200">GSTIN</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-[5.5px] py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200 text-center">
                   <div className="flex justify-center flex-col items-center">
                     <TableFilter label="GSTR-9" isActive={gstr9Filter !== 'All'}>
                       {['All', 'Filed', 'Pending'].map(f => <button key={f} onClick={() => setGstr9Filter(f as any)} className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase rounded-lg ${gstr9Filter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{f}</button>)}
                     </TableFilter>
                   </div>
                </th>
                <th className="sticky top-0 z-30 bg-slate-100 px-[5.5px] py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200 text-center">
                   <div className="flex justify-center flex-col items-center">
                     <TableFilter label="GSTR-9C" isActive={gstr9cFilter !== 'All'}>
                       {['All', 'Filed', 'Pending', 'N/A'].map(f => <button key={f} onClick={() => setGstr9cFilter(f as any)} className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase rounded-lg ${gstr9cFilter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{f}</button>)}
                     </TableFilter>
                   </div>
                </th>
                <th className="sticky top-0 z-30 bg-slate-100 px-[5.5px] py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200">User ID</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-[5.5px] py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200">Password</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-[5.5px] py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200">Remark</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-[5.5px] py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groupedClients.map(({ sector, clients: sectorClients }) => (
                <React.Fragment key={sector}>
                  <tr>
                    <td colSpan={9} className="sticky top-[37px] z-20 bg-slate-200/95 backdrop-blur-md font-bold text-slate-800 py-1.5 px-[5.5px] uppercase text-[10px] tracking-widest border-y border-slate-300 shadow-xs">{sector} ({sectorClients.length})</td>
                  </tr>
                  {sectorClients.map((client, idx) => {
                const st = getStatus(client.id);
                const app9c = is9CApplicable(client.id);
                                const isEditingPass = editingPasswordId === client.id;
                return (
                  <tr key={client.id} className="hover:bg-indigo-50/10 transition-all group h-[44px] text-[12px]">
                    <td className=" px-4 py-[2px] font-black text-indigo-400 font-mono truncate">{(idx + 1).toString().padStart(2, '0')}</td>
                    <td className=" px-4 py-[2px] truncate max-w-[200px]" title={client.tradeName}>
     <div className="font-black text-slate-900 truncate leading-tight text-[12px]">{client.tradeName || '---'}</div>
     <div className="font-bold text-[9px] text-slate-500 truncate leading-tight" title={client.legalName}>{client.legalName || '---'}</div>
   </td>
   
                    <td className=" px-4 py-[2px]">
                       <div className="flex items-center gap-2 group/gstin">
                          <span className="font-black text-indigo-600 font-mono tracking-widest uppercase">{client.gstProfile?.gstin}</span>
                          <button onClick={() => (navigator.clipboard.writeText(client.gstProfile?.gstin || '').then(() => { toast.success('GSTIN Copied!'); window.open('https://services.gst.gov.in/services/searchtp', '_blank'); }))} className="h-6 w-6 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center opacity-0 group-hover/gstin:opacity-100 shadow-sm"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></button>
                       </div>
                    </td>
                    <td className=" px-4 py-[2px] text-center">
                       <button onClick={() => toggleStatus(client.id, 'gstr9')} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${st.gstr9 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>{st.gstr9 ? 'Filed' : 'Pending'}</button>
                    </td>
                    <td className=" px-4 py-[2px] text-center">
                       {app9c ? (
                         <button onClick={() => toggleStatus(client.id, 'gstr9c')} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${st.gstr9c ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>{st.gstr9c ? 'Filed' : 'Pending'}</button>
                       ) : (
                         <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">N/A</span>
                       )}
                    </td>
                    <td className=" px-4 py-[2px] font-black text-slate-700 truncate">{client.gstProfile?.username}</td>
                    <td className=" px-4 py-[2px]">
                       <div className="flex items-center gap-2 group/pass">
                          {isEditingPass ? (
                            <div className="flex items-center gap-1">
                               <input autoFocus value={newPassVal} onChange={e => setNewPassVal(e.target.value)} onBlur={handleUpdatePassword} onKeyDown={e => { if (e.key === 'Enter') handleUpdatePassword(); }} className="bg-white border border-indigo-200 rounded px-2 h-7 text-[11px] font-black w-24 outline-none" />
                            </div>
                          ) : (
                            <>
                               <span className="font-black text-indigo-400 tracking-wider text-[12px] truncate">{client.gstProfile?.password}</span>
                               <button onClick={() => { setSelectedClient(client); setEditingPasswordId(client.id); setNewPassVal(client.gstProfile?.password || ''); }} className="p-1 text-slate-300 hover:text-amber-500 opacity-0 group-hover/pass:opacity-100"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                               {client.gstProfile?.username && (
                                 <button onClick={() => { 
                                   navigator.clipboard.writeText(client.gstProfile?.username || ''); 
                                   window.open('https://services.gst.gov.in/services/login', '_blank'); 
                                 }} className="p-1 text-slate-300 hover:text-indigo-600 opacity-0 group-hover/pass:opacity-100 transition-all shrink-0" title="Login to GST Portal">
                                   <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                 </button>
                               )}
                            </>
                          )}
                       </div>
                    </td>
                    <td className=" px-4 py-[2px] truncate max-w-[150px]">
                       <EditableRemark value={st?.remark || getStatus?.(client.id)?.remark || ''} onSave={val => updateRemark(client.id, val)} />
                    </td>
                    <td className=" px-4 py-[2px] text-right  overflow-visible">
                       <div className="flex items-center justify-end gap-1">
                          <GSTViewIcon client={client} onDataChange={fetchClients} />
                          <button onClick={(e) => openActionsMenu(e, client)} className={`h-8 w-8 rounded-lg border transition-all flex items-center justify-center shadow-sm ${activeActionsId === client.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white'}`}><svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg></button>
                       </div>
                    </td>
                  </tr>
                  );
                })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      {activeActionsId && selectedClient && (
        <div ref={actionsRef} style={{ top: menuPosition.top, left: menuPosition.left }} className="fixed w-64 bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl z-[9999] p-2 animate-in zoom-in-95 origin-top-right overflow-hidden text-left">
          <button onClick={() => { shareViaWhatsApp(`*Audit Credentials*\n*Entity:* ${selectedClient.tradeName}\n*GSTIN:* ${selectedClient.gstProfile?.gstin}\n*User ID:* ${selectedClient.gstProfile?.username}\n*Password:* ${selectedClient.gstProfile?.password}`); setActiveActionsId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-50 rounded-xl transition-colors text-left group">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Share Credentials</span>
          </button>
          <button onClick={() => { shareViaWhatsApp(`*Audit Dossier*\nTrade Name: ${selectedClient.tradeName || 'N/A'}\nLegal Name: ${selectedClient.legalName || 'N/A'}\nMobile: ${selectedClient.mobile || 'N/A'}\nEmail: ${selectedClient.email || 'N/A'}\n\n*GST Details*\nGSTIN: ${selectedClient.gstProfile?.gstin || 'N/A'}\nStatus: ${selectedClient.gstProfile?.gstStatus || 'N/A'}\nReg Type: ${selectedClient.gstProfile?.regType || 'N/A'}\nFiling: ${selectedClient.gstProfile?.filingFreq || 'N/A'}\nReg Date: ${formatDate(selectedClient.gstProfile?.regDate)}\nJurisdiction: ${selectedClient.gstProfile?.jurisdictionType || 'N/A'}\nSector/Range: ${selectedClient.gstProfile?.sector || selectedClient.gstProfile?.range || 'N/A'}\n9C Applies: ${is9CApplicable(selectedClient.id) ? 'YES' : 'NO'}`); setActiveActionsId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-50 rounded-xl transition-colors text-left group">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Share Full Detail</span>
          </button>
          <button onClick={() => { setIsEditApplicabilityOpen(true); setIs9CApplicableState(is9CApplicable(selectedClient!.id)); setActiveActionsId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 rounded-xl transition-colors text-left group border-t border-slate-50">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Edit Applicability</span>
          </button>
          <button onClick={() => { if(confirm('Remove from audit list?')) removeFromWatchlist(selectedClient!.id); setActiveActionsId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 rounded-xl transition-colors text-left group border-t border-slate-50">
              <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Delete from List</span>
          </button>
        </div>
      )}

      {/* TRACK CLIENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 space-y-8 animate-in zoom-in-95 border border-slate-200">
              <div className="flex justify-between items-center">
                 <h3 className="text-xl font-black text-slate-900 tracking-tight">Audit Enrollment • FY {selectedYear}</h3>
                 <button onClick={() => { setIsAddModalOpen(false); setSelectedClient(null); setTurnoverState(''); }} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
                 </button>
              </div>

              <div className="space-y-6">
                 <div>
                    
                    <div className="relative">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Entity Lookup</label>
                       <input 
                         type="text" 
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-100 transition-all uppercase"
                         placeholder="Trade Name or GSTIN..." 
                         value={addSearch || (selectedClient ? (selectedClient.tradeName || selectedClient.legalName) : '')} 
                         onChange={(e) => { 
                            setAddSearch(e.target.value);
                            setSelectedClient(null);
                         }} 
                         onFocus={() => setAddSearch('')}
                       />
                       {addSearch.length > 0 && !selectedClient && (
                         <div className="absolute top-full mt-1 z-50 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto no-scrollbar">
                           {allClients
                             .filter(c => !((watchlist[selectedYear] || []).includes(c.id)))
                             .filter(c => ((c.tradeName || c.legalName || '').toLowerCase().includes(addSearch.toLowerCase()) || (c.gstProfile?.gstin || '').toLowerCase().includes(addSearch.toLowerCase())))
                             .slice(0, 15)
                             .map(c => (
                             <button 
                               key={c.id} 
                               type="button" 
                               onClick={() => {
                                 setSelectedClient(c); 
                                 setAddSearch('');
                                 setIs9CApplicableState(true);
                                 setTurnoverState('');
                               }} 
                               className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-slate-50 last:border-0"
                             >
                               <p className="text-sm font-black text-slate-900 truncate">{c.tradeName || '---'}</p>
                               <p className="text-xs font-bold text-slate-500 truncate leading-tight">{c.legalName ? `Legal: ${c.legalName}` : '---'}</p>
                               <p className="text-[10px] text-indigo-600 font-mono font-black">{c.gstProfile?.gstin || 'NO GSTIN'}</p>
                             </button>
                           ))}
                         </div>
                       )}
                    </div>
                 </div>

                 {selectedClient && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                       <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Annual Turnover (₹)</label>
                          <input type="number" placeholder="e.g. 55000000" value={turnoverState} onChange={(e) => {
                             const val = e.target.value;
                             setTurnoverState(val);
                             const t = Number(val);
                             if (t > 50000000) setIs9CApplicableState(true);
                             else if (t && t <= 50000000) setIs9CApplicableState(false);
                          }} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-bold text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all" />
                          <p className="text-[10px] text-slate-400 font-medium mt-2">&gt; ₹5 Cr automatically enables GSTR-9C.</p>
                       </div>

                       <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
                          <div>
                             <p className="text-sm font-black text-slate-900 uppercase">GSTR-9C Applicable?</p>
                             <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Include reconciliation audit</p>
                          </div>
                          <button onClick={() => setIs9CApplicableState(!is9CApplicableState)} className={`h-8 w-16 rounded-full transition-all relative p-1 ${is9CApplicableState ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                             <div className={`h-6 w-6 bg-white rounded-full shadow-md transition-all ${is9CApplicableState ? 'translate-x-8' : 'translate-x-0'}`} />
                          </button>
                       </div>
                    </div>
                 )}
              </div>

              <div className="pt-4 border-t border-slate-100">
                 <button disabled={!selectedClient} onClick={() => { addToWatchlist(selectedClient.id, is9CApplicableState); setIsAddModalOpen(false); setSelectedClient(null); setTurnoverState(''); }} className="w-full py-5 bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-slate-900 transition-all">Synchronize for Audit</button>
              </div>
           </div>
        </div>
      )}

      {/* EDIT APPLICABILITY MODAL */}
      {isEditApplicabilityOpen && selectedClient && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 space-y-8 animate-in zoom-in-95 border border-slate-200">
              <div><h3 className="text-xl font-black text-slate-900 tracking-tight">Audit Applicability</h3><p className="text-sm font-bold text-slate-400 mt-1 truncate">{selectedClient.legalName}</p></div>
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                 <span className="text-sm font-black text-slate-700 uppercase">GSTR-9C Requirement</span>
                 <button onClick={() => setIs9CApplicableState(!is9CApplicableState)} className={`h-8 w-16 rounded-full transition-all relative p-1 ${is9CApplicableState ? 'bg-indigo-600' : 'bg-slate-200'}`}><div className={`h-6 w-6 bg-white rounded-full shadow-md transition-all ${is9CApplicableState ? 'translate-x-8' : 'translate-x-0'}`} /></button>
              </div>
              <div className="flex gap-3">
                 <button onClick={() => setIsEditApplicabilityOpen(false)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">Discard</button>
                 <button onClick={() => { update9CApplicability(selectedClient.id, is9CApplicableState); setIsEditApplicabilityOpen(false); }} className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-slate-900 transition-all">Save Config</button>
              </div>
           </div>
        </div>
      )}

      {/* FULL CLIENT DETAIL VIEW MODAL removed - replaced by GSTViewIcon */}
    </div>
  );
};

export default GSTR9_9C;
