
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useModuleData } from '../../../hooks/useModuleData.ts';
import { formatDate } from '../../../exportUtils';
import { Client } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';
import GSTViewIcon from '../../../components/GSTViewIcon';
import { TableFilter } from '../../../components/TableFilter';
import { SectorJurisdictionFilter, filterClientsBySectorJurisdiction } from '../../../components/SectorJurisdictionFilter';
import { useGSTR9Logic } from './GSTR9_9Clogic';
import { EditableRemark } from '../../../components/EditableRemark';
import { YEARS, isClientVisibleInFY } from '../GSTReturn/filinglogic/MonthlyFilingLogic';
import { toast } from 'sonner';
import { ExportMenu } from '../../../components/ExportMenu';
import { exportToCSV, printList, getSectorGroupLabel, getClientColorTheme } from '../../../exportUtils';
import { useGlobalDueDates } from '../../../hooks/useGlobalDueDates';
import { formatISOToDDMMYYYY } from '../../../dateUtils';
import { ViewControl } from '../../../components/ViewControl';

const GSTR9_9C: React.FC = () => {
  const queryClient = useQueryClient();
  const getPreviousFY = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const startYear = currentMonth >= 3 ? currentYear - 1 : currentYear - 2;
    return `${startYear}-${(startYear + 1).toString().slice(-2)}`;
  };

  const { data: pageData, isLoading: isPageLoading } = useModuleData('gstr9_filing_page_data');

  const allClients = useMemo(() => pageData?.clients || [], [pageData]);

  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState(getPreviousFY());
  
  const { getGlobalDueDate } = useGlobalDueDates(selectedYear);
  const gstr9DueDate = getGlobalDueDate('annual_gstr9', 'Annual');
  const gstr9cDueDate = getGlobalDueDate('annual_gstr9c', 'Annual');
  
  // Modals & Tools
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditApplicabilityOpen, setIsEditApplicabilityOpen] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [is9CApplicableState, setIs9CApplicableState] = useState(true);
  const [turnoverState, setTurnoverState] = useState('');
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [newPassVal, setNewPassVal] = useState('');

  // Filters
  const [quickFilter, setQuickFilter] = useState<'All' | 'Filed' | 'Pending'>('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [gstr9Filter, setGstr9Filter] = useState<'All' | 'Filed' | 'Pending'>('All');
  const [gstr9cFilter, setGstr9cFilter] = useState<'All' | 'Filed' | 'Pending' | 'N/A'>('All');
  const [authorityFilter, setAuthorityFilter] = useState<'All' | 'State' | 'Center'>('All');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);

  // Actions Menu State
  const [activeActionsId, setActiveActionsId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const actionsRef = useRef<HTMLDivElement>(null);

  const { 
    getStatus, toggleStatus, updateRemark, watchlist, addToWatchlist, 
    removeFromWatchlist, is9CApplicable, update9CApplicability
  } = useGSTR9Logic(
    selectedYear,
    pageData?.watchlist,
    pageData?.config,
    pageData?.filingData,
    pageData?.dueDates
  );

  const isClientsLoading = isPageLoading && !pageData;

  const handleRefreshClients = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['gstr9_filing_page_data'] });
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  }, [queryClient]);

  useEffect(() => {
    const syncHandler = () => handleRefreshClients();
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, [handleRefreshClients]);

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

  const baseDisplayList = useMemo(() => {
    const s = search.toLowerCase();
    const currentWatchlist = watchlist[selectedYear] || [];
    
    const list = allClients.filter(c => {
      if (!c) return false;
      const inWatchlist = currentWatchlist.includes(c.id);
      if (!inWatchlist) return false;
      
      return (c.legalName || '').toLowerCase().includes(s) || 
             (c.tradeName || '').toLowerCase().includes(s) || 
             (c.gstProfile?.gstin && c.gstProfile.gstin.toLowerCase().includes(s)) ||
             (c.pan && c.pan.toLowerCase().includes(s));
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

    return filterClientsBySectorJurisdiction(list, authorityFilter, selectedSectors);
  }, [allClients, search, selectedYear, watchlist, gstr9Filter, gstr9cFilter, authorityFilter, selectedSectors, getStatus, is9CApplicable]);

  const stats = useMemo(() => {
    const total = baseDisplayList.length;
    let filed = 0, pending = 0;
    baseDisplayList.forEach(c => {
      if (getStatus(c.id).gstr9) filed++;
      else pending++;
    });
    return { total, filed, pending };
  }, [baseDisplayList, getStatus]);

  const filteredDisplayList = useMemo(() => {
    if (quickFilter === 'Filed') return baseDisplayList.filter(c => getStatus(c.id).gstr9);
    if (quickFilter === 'Pending') return baseDisplayList.filter(c => !getStatus(c.id).gstr9);
    return baseDisplayList;
  }, [baseDisplayList, quickFilter, getStatus]);


    const groupedClients = useMemo(() => {
    const groups: Record<string, typeof filteredDisplayList> = {};
    filteredDisplayList.forEach(c => {
      const sector = getSectorGroupLabel(c);
      if (!groups[sector]) groups[sector] = [];
      groups[sector].push(c);
    });
    const sortedKeys = Object.keys(groups).sort((a, b) => {
       if (a.startsWith('Uncategorized')) return 1;
       if (b.startsWith('Uncategorized')) return -1;
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
      handleRefreshClients();
      setEditingPasswordId(null);
    } catch (err) { toast.error("Update failed."); }
  };

  const shareViaWhatsApp = (text: string) => {
    window.location.href = `whatsapp://send?text=${encodeURIComponent(text)}`;
  };

  if (isClientsLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-2 landscape:space-y-1 pb-2 overflow-hidden animate-in fade-in duration-500 max-w-full mx-auto w-full">
      
      {/* Search Toolbar with Integrated Count Badges & Grid/Table Toggle */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2 bg-white p-2 md:p-2.5 rounded-2xl border border-slate-200 shadow-xs shrink-0">
        
        {/* Search Bar & Interactive Count Badges */}
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2 min-w-0">
          <div className="relative flex-1 group min-w-[180px]">
            <input 
              type="text" 
              placeholder="Search trade name, GSTIN, PAN..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all" 
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Count Badges Pill Filter Group & Due Dates */}
          <div className="flex items-center gap-1.5 shrink-0 flex-nowrap overflow-x-auto no-scrollbar max-w-full py-0.5">
            <button
              onClick={() => setQuickFilter('All')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 border whitespace-nowrap ${
                quickFilter === 'All' 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>Total</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-black ${
                quickFilter === 'All' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-800'
              }`}>{stats.total}</span>
            </button>

            <button
              onClick={() => setQuickFilter('Filed')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 border whitespace-nowrap ${
                quickFilter === 'Filed' 
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                  : 'bg-emerald-50/70 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <span>Filed</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-black ${
                quickFilter === 'Filed' ? 'bg-emerald-500 text-white' : 'bg-emerald-200 text-emerald-900'
              }`}>{stats.filed}</span>
            </button>

            <button
              onClick={() => setQuickFilter('Pending')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 border whitespace-nowrap ${
                quickFilter === 'Pending' 
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs' 
                  : 'bg-rose-50/70 text-rose-700 border-rose-200 hover:bg-rose-100'
              }`}
            >
              <span>Pending</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-black ${
                quickFilter === 'Pending' ? 'bg-rose-500 text-white' : 'bg-rose-200 text-rose-900'
              }`}>{stats.pending}</span>
            </button>

            {gstr9DueDate && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200/80 text-[10px] font-black text-indigo-700 whitespace-nowrap shrink-0">
                <span className="text-indigo-500 font-bold">GSTR-9 Due:</span>
                <span className="font-mono">{formatISOToDDMMYYYY(gstr9DueDate)}</span>
              </div>
            )}

            {gstr9cDueDate && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 text-[10px] font-black text-emerald-700 whitespace-nowrap shrink-0">
                <span className="text-emerald-500 font-bold">9C Due:</span>
                <span className="font-mono">{formatISOToDDMMYYYY(gstr9cDueDate)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls: View Control, Filter, Track, Export, Year */}
        <div className="flex items-center gap-2 shrink-0 flex-nowrap overflow-x-auto no-scrollbar max-w-full w-full lg:w-auto py-0.5 justify-start lg:justify-end">
          <ViewControl 
            viewMode={viewMode} 
            onViewChange={setViewMode} 
          />

          <SectorJurisdictionFilter
            clients={allClients}
            authority={authorityFilter}
            setAuthority={setAuthorityFilter}
            selectedSectors={selectedSectors}
            setSelectedSectors={setSelectedSectors}
            buttonClassName="h-8 px-2.5 bg-white border border-slate-200 rounded-xl shadow-xs text-xs font-black uppercase tracking-tight hover:border-indigo-200 shrink-0 whitespace-nowrap"
            totalFilteredCount={filteredDisplayList.length}
          />

          <ExportMenu onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />

          <button onClick={() => { setSelectedClient(null); setAddSearch(''); setIsAddModalOpen(true); }} className="h-8 px-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-xs hover:bg-slate-900 transition-all flex items-center gap-1 shrink-0">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            Track Entity
          </button>

          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 h-8 text-[11px] font-black uppercase text-slate-700 outline-none">{YEARS.map(y => <option key={y} value={y}>FY {y}</option>)}</select>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {viewMode === 'grid' ? (
          <div className="p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredDisplayList.map((client, idx) => {
              const statusInfo = getStatus(client.id);
              const isApp9c = is9CApplicable(client.id);
              return (
                <div key={client.id} className="p-3.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl shadow-xs transition-all flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">#{idx + 1}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-black text-slate-700 font-mono">{client.gstProfile?.gstin || 'NO GSTIN'}</span>
                        {client.gstProfile?.gstin && (
                          <button onClick={() => { navigator.clipboard.writeText(client.gstProfile?.gstin || ''); toast.success('GSTIN Copied!'); window.open('https://services.gst.gov.in/services/searchtp', '_blank'); }} className="p-1 text-slate-400 hover:text-indigo-600" title="Search GSTIN">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <h4 className="text-xs font-black text-slate-900 truncate" title={client.tradeName}>{client.tradeName || client.legalName}</h4>
                    <p className="text-[10px] font-bold text-slate-500 truncate">{getClientDisplayId(client)}</p>

                    {/* Credentials Card Section */}
                    <div className="mt-2 p-2 bg-white rounded-xl border border-slate-200/80 space-y-1 text-[10px]">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>User: <strong className="text-slate-900">{client.gstProfile?.username || 'N/A'}</strong></span>
                        {client.gstProfile?.username && (
                          <button onClick={() => { navigator.clipboard.writeText(client.gstProfile?.username || ''); toast.success('Username copied'); }} className="text-indigo-600 font-bold hover:underline">Copy</button>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Pass: <strong className="text-indigo-600">{client.gstProfile?.password || 'N/A'}</strong></span>
                        <div className="flex items-center gap-1.5">
                          {client.gstProfile?.password && (
                            <button onClick={() => { navigator.clipboard.writeText(client.gstProfile?.password || ''); toast.success('Password copied'); }} className="text-indigo-600 font-bold hover:underline">Copy</button>
                          )}
                          {client.gstProfile?.username && (
                            <button onClick={() => { navigator.clipboard.writeText(client.gstProfile?.username || ''); window.open('https://services.gst.gov.in/services/login', '_blank'); }} className="p-1 text-emerald-600 hover:text-emerald-800" title="Login to Portal">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 text-[10px]">
                    <span className={`px-2 py-0.5 rounded-md font-black uppercase ${statusInfo.gstr9 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      GSTR-9: {statusInfo.gstr9 ? 'Filed' : 'Pending'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-black uppercase ${!isApp9c ? 'bg-slate-200 text-slate-700' : statusInfo.gstr9c ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      GSTR-9C: {!isApp9c ? 'N/A' : statusInfo.gstr9c ? 'Filed' : 'Pending'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <span className="text-[9px] font-black uppercase text-slate-400">Annual Return</span>
                    <button onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setMenuPosition({ top: rect.bottom + window.scrollY + 8, left: rect.right - 256 });
                      setActiveActionsId(client.id);
                      setSelectedClient(client);
                    }} className="px-2.5 py-1 text-[10px] font-black uppercase bg-indigo-600 text-white rounded-lg shadow-xs hover:bg-slate-900 transition-colors">
                      Actions
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
        <div className="overflow-auto no-scrollbar flex-1 w-full relative h-full">
          <table className="w-full text-left border-collapse table-fixed min-w-full gstr9-returns-table min-w-[1150px]">
            <thead className="sticky top-0 z-30 bg-slate-100">
              <tr className="bg-slate-50 border-b border-slate-200 shadow-sm font-bold uppercase tracking-wider text-slate-900">
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[50px] text-center whitespace-nowrap">S.No.</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[24%] min-w-[170px]">Trader Name</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[15%] min-w-[145px] whitespace-nowrap">GSTIN</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[11%] min-w-[110px] text-center whitespace-nowrap">
                   <div className="flex justify-center flex-col items-center">
                     <TableFilter label="GSTR-9" isActive={gstr9Filter !== 'All'}>
                       {['All', 'Filed', 'Pending'].map(f => <button key={f} onClick={() => setGstr9Filter(f as any)} className={`w-full text-left px-3 py-2 text-[var(--app-font-size)] font-black uppercase rounded-lg ${gstr9Filter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{f}</button>)}
                     </TableFilter>
                   </div>
                </th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[11%] min-w-[110px] text-center whitespace-nowrap">
                   <div className="flex justify-center flex-col items-center">
                     <TableFilter label="GSTR-9C" isActive={gstr9cFilter !== 'All'}>
                       {['All', 'Filed', 'Pending', 'N/A'].map(f => <button key={f} onClick={() => setGstr9cFilter(f as any)} className={`w-full text-left px-3 py-2 text-[var(--app-font-size)] font-black uppercase rounded-lg ${gstr9cFilter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{f}</button>)}
                     </TableFilter>
                   </div>
                </th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[12%] min-w-[110px] whitespace-nowrap">User ID</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[12%] min-w-[110px] whitespace-nowrap">Password</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[15%] min-w-[150px]">Remark</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 text-right w-[90px] whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groupedClients.map(({ sector, clients: sectorClients }) => (
                <React.Fragment key={sector}>
                  <tr>
                    <td colSpan={9} className="sticky top-[27px] z-20 bg-slate-200/95 backdrop-blur-md font-bold text-slate-800 py-1.5 px-3 uppercase text-[10px] tracking-widest border-y border-slate-300 shadow-xs">{sector} ({sectorClients.length})</td>
                  </tr>
                  {sectorClients.map((client, idx) => {
                const st = getStatus(client.id);
                const app9c = is9CApplicable(client.id);
                const isEditingPass = editingPasswordId === client.id;
                const theme = getClientColorTheme(client);
                return (
                  <tr key={client.id} className={`transition-all group border-b border-slate-100 animate-in fade-in slide-in-from-bottom-1 duration-150 ${theme.rowClass}`}>
                    <td className="px-3 py-1.5 font-black text-indigo-400 font-mono text-center whitespace-nowrap">{(idx + 1).toString().padStart(2, '0')}</td>
                    <td className={`px-3 py-1.5 truncate min-w-[170px] ${theme.tradeNameClass}`} title={client.tradeName}>
                      <div className="font-semibold truncate text-[var(--app-font-size)]">{client.tradeName || '---'}</div>
                      <p className="legal-subtitle truncate font-medium" title={client.legalName}>{client.legalName || '---'}</p>
                    </td>
   
                    <td className="px-3 py-1.5 whitespace-nowrap">
                       <div className="flex items-center gap-1.5 group/gstin">
                          <span className={`truncate font-semibold tracking-wider font-mono uppercase ${theme.gstinClass}`}>{client.gstProfile?.gstin || '---'}</span>
                          {client.gstProfile?.gstin && (
                            <button onClick={() => (navigator.clipboard.writeText(client.gstProfile?.gstin || '').then(() => { toast.success('GSTIN Copied!'); window.open('https://services.gst.gov.in/services/searchtp', '_blank'); }))} className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0" title="Search Taxpayer">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </button>
                          )}
                       </div>
                    </td>
                    <td className="px-3 py-1.5 text-center whitespace-nowrap">
                       <button onClick={() => toggleStatus(client.id, 'gstr9')} className={`px-2.5 py-0.5 rounded-full font-black uppercase border flex items-center justify-center gap-1 mx-auto transition-all ${st.gstr9 ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'}`} title="Click to toggle GSTR-9 Status (Pending / Filed)">
                         <span>{st.gstr9 ? 'Filed' : 'Pending'}</span>
                         <svg className="h-2.5 w-2.5 opacity-40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                       </button>
                    </td>
                    <td className="px-3 py-1.5 text-center whitespace-nowrap">
                       {app9c ? (
                         <button onClick={() => toggleStatus(client.id, 'gstr9c')} className={`px-2.5 py-0.5 rounded-full font-black uppercase border flex items-center justify-center gap-1 mx-auto transition-all ${st.gstr9c ? 'bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200' : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'}`} title="Click to toggle GSTR-9C Status (Pending / Filed)">
                           <span>{st.gstr9c ? 'Filed' : 'Pending'}</span>
                           <svg className="h-2.5 w-2.5 opacity-40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                         </button>
                       ) : (
                         <span className="px-2 py-0.5 rounded text-[9px] font-black text-slate-400 bg-slate-100 border border-slate-200 uppercase tracking-wider">N/A</span>
                       )}
                    </td>
                    <td className="px-3 py-1.5 font-semibold text-slate-700 truncate whitespace-nowrap">{client.gstProfile?.username || '---'}</td>
                    <td className="px-3 py-1.5 relative group/pass whitespace-nowrap">
                       <div className="flex items-center gap-2">
                          {isEditingPass ? (
                            <input autoFocus value={newPassVal} onChange={e => setNewPassVal(e.target.value)} onBlur={handleUpdatePassword} onKeyDown={e => { if (e.key === 'Enter') handleUpdatePassword(); }} className="bg-white border border-indigo-200 rounded px-2 h-7 font-semibold w-24 outline-none" />
                          ) : (
                            <div className="flex items-center gap-2">
                               <span className="font-semibold text-indigo-500 truncate">{client.gstProfile?.password || '---'}</span>
                               <button onClick={() => { setSelectedClient(client); setEditingPasswordId(client.id); setNewPassVal(client.gstProfile?.password || ''); }} className="p-1 text-slate-300 hover:text-amber-500 opacity-0 group-hover/pass:opacity-100 transition-all shrink-0" title="Edit Password"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                               {client.gstProfile?.username && (
                                 <button onClick={() => { 
                                   navigator.clipboard.writeText(client.gstProfile?.username || ''); 
                                   window.open('https://services.gst.gov.in/services/login', '_blank'); 
                                 }} className="p-1 text-slate-300 hover:text-indigo-600 opacity-0 group-hover/pass:opacity-100 transition-all shrink-0" title="Login to GST Portal">
                                   <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                 </button>
                               )}
                            </div>
                          )}
                       </div>
                    </td>
                    <td className="px-3 py-1.5 truncate max-w-[180px] min-w-[150px]">
                       <EditableRemark value={st?.remark || getStatus?.(client.id)?.remark || ''} onSave={val => updateRemark(client.id, val)} />
                    </td>
                    <td className="px-3 py-1.5 text-right w-[90px] whitespace-nowrap">
                       <div className="flex items-center justify-end gap-1">
                          <GSTViewIcon client={client} onDataChange={handleRefreshClients} />
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
        )}
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
