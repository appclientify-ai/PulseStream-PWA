
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
import { useGSTR4Logic } from './GSTR4logic';
import { EditableRemark } from '../../../components/EditableRemark';
import { YEARS, isClientVisibleInFY } from '../GSTReturn/filinglogic/MonthlyFilingLogic';
import { toast } from 'sonner';
import { ExportMenu } from '../../../components/ExportMenu';
import { exportToCSV, printList, getSectorGroupLabel, getClientColorTheme } from '../../../exportUtils';
import { useGlobalDueDates } from '../../../hooks/useGlobalDueDates';
import { formatISOToDDMMYYYY } from '../../../dateUtils';
import { ViewControl } from '../../../components/ViewControl';

const GSTR4: React.FC = () => {
  const queryClient = useQueryClient();
  const getPreviousFY = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const startYear = currentMonth >= 3 ? currentYear - 1 : currentYear - 2;
    return `${startYear}-${(startYear + 1).toString().slice(-2)}`;
  };

  const { data: pageData, isLoading: isPageLoading } = useModuleData('gstr4_filing_page_data');

  const clients = useMemo(() => pageData?.clients || [], [pageData]);
  const allClientsBase = clients;

  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState(getPreviousFY());
  
  const { getGlobalDueDate } = useGlobalDueDates(selectedYear);
  const gstr4DueDate = getGlobalDueDate('annual_gstr4', 'Annual');

  const [quickFilter, setQuickFilter] = useState<'All' | 'Filed' | 'Pending'>('All');
  const [authorityFilter, setAuthorityFilter] = useState<'All' | 'State' | 'Center'>('All');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals & Tools
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [newPassVal, setNewPassVal] = useState('');
  
  // Actions Menu State
  const [activeActionsId, setActiveActionsId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const actionsRef = useRef<HTMLDivElement>(null);

  const { getStatus, toggleStatus, updateRemark } = useGSTR4Logic(
    selectedYear,
    pageData?.filingData,
    pageData?.dueDates
  );

  const cmp08Data = useMemo<Record<string, Record<string, { cmp08: boolean }>>>(() => pageData?.cmp08Data || {}, [pageData]);

  const isClientsLoading = isPageLoading && !pageData;

  const handleRefreshClients = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['gstr4_filing_page_data'] });
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  }, [queryClient]);

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
    const sameGroup = allClientsBase.filter(c => 
      c.gstProfile?.jurisdictionType === client.gstProfile?.jurisdictionType &&
      (isState ? c.gstProfile?.sector === val : c.gstProfile?.range === val)
    ).sort((a, b) => (new Date(a.createdAt || 0).getTime()) - (new Date(b.createdAt || 0).getTime()));
    const rank = sameGroup.findIndex(c => c.id === client.id) + 1;
    return `${prefix}/${val || '?'}/${rank}`;
  }, [allClientsBase]);

    const stats = useMemo(() => {
    let total = 0, filed = 0, pending = 0;
    const baseClients = clients.filter(c => isClientVisibleInFY(c, selectedYear));
    total = baseClients.length;
    baseClients.forEach(c => {
      if (getStatus(c.id).filed) filed++;
      else pending++;
    });
    return { total, filed, pending };
  }, [clients, selectedYear, getStatus]);


  useEffect(() => {
    const syncHandler = () => handleRefreshClients();
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, [handleRefreshClients]);

  const filteredClients = useMemo(() => {
    let list = clients.filter(c => 
      isClientVisibleInFY(c, selectedYear) &&
      ((c.legalName || '').toLowerCase().includes(search.toLowerCase()) || 
       (c.tradeName || '').toLowerCase().includes(search.toLowerCase()) || 
       (c.gstProfile?.gstin || '').toLowerCase().includes(search.toLowerCase()))
    );
    if (quickFilter !== 'All') list = list.filter(c => quickFilter === 'Filed' ? getStatus(c.id).filed : !getStatus(c.id).filed);
    list = filterClientsBySectorJurisdiction(list, authorityFilter, selectedSectors);
    return list;
  }, [clients, search, quickFilter, authorityFilter, selectedSectors, getStatus, selectedYear]);

  
  const handleUpdatePassword = async () => {
    if (!selectedClient || !newPassVal.trim()) return;
    try {
      const updated = { ...selectedClient, gstProfile: { ...selectedClient.gstProfile!, password: newPassVal } };
      await api.saveClient(updated);
      handleRefreshClients();
      setEditingPasswordId(null);
    } catch (err) { toast.error("Update failed."); }
  };

  const groupedClients = useMemo(() => {
    const groups: Record<string, typeof filteredClients> = {};
    filteredClients.forEach(c => {
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
  }, [filteredClients]);

  const handleExportCSV = () => {
    const headers = ["ID", "Trader", "GSTIN", "Status", "User ID", "Password", "Remark"].join(",");
    const rows = filteredClients.map(c => [
      getClientDisplayId(c), 
      c.tradeName, 
      c.gstProfile?.gstin, 
      getStatus(c.id).filed ? 'Filed' : 'Pending',
      c.gstProfile?.gstPortalUsername || '---',
      c.gstProfile?.gstPortalPassword || '---'
    ]);
    exportToCSV(headers.split(','), rows, 'GSTR4_Composition.csv');
};

const handleExportPDF = () => {
    const headers = ["ID", "Trader", "GSTIN", "Status"];
    headers.push("Remark");
    const rows = filteredClients.map(c => [
      getClientDisplayId(c), 
      c.tradeName, 
      c.gstProfile?.gstin, 
      getStatus(c.id).filed ? 'Filed' : 'Pending'
    ]);
    printList('GSTR-4 Composition Returns', headers, rows);
};

  const openActionsMenu = (e: React.MouseEvent, client: Client) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 160;
    const menuWidth = 256;
    const padding = 12;

    let top = rect.bottom + 8;
    if (top + menuHeight > window.innerHeight - padding) {
      if (rect.top - menuHeight - 8 > padding) {
        top = rect.top - menuHeight - 8;
      } else {
        top = Math.max(padding, window.innerHeight - menuHeight - padding);
      }
    }

    let left = rect.right - menuWidth;
    if (left < padding) {
      left = padding;
    } else if (left + menuWidth > window.innerWidth - padding) {
      left = window.innerWidth - menuWidth - padding;
    }

    setMenuPosition({ top, left });
    setActiveActionsId(client.id);
    setSelectedClient(client);
  };

  const shareViaWhatsApp = (text: string) => {
    window.location.href = `whatsapp://send?text=${encodeURIComponent(text)}`;
  };

  if (isClientsLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-2 landscape:space-y-1 pb-2 overflow-hidden animate-in fade-in duration-500">
      
      {/* Header Search & Count Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 landscape:gap-1 bg-white p-2 md:p-2.5 landscape:p-1 rounded-[1.5rem] landscape:rounded-xl border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-1.5 shrink-0 flex-nowrap overflow-x-auto no-scrollbar max-w-full py-0.5">
          <button 
            onClick={() => setQuickFilter('All')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              quickFilter === 'All' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>Total</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-xs font-black">{stats.total}</span>
          </button>
          <button 
            onClick={() => setQuickFilter('Filed')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              quickFilter === 'Filed' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <span>Filed</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-xs font-black">{stats.filed}</span>
          </button>
          <button 
            onClick={() => setQuickFilter('Pending')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              quickFilter === 'Pending' ? 'bg-rose-600 text-white shadow-sm' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <span>Pending</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-xs font-black">{stats.pending}</span>
          </button>
          {gstr4DueDate && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200/80 text-xs font-black uppercase whitespace-nowrap shrink-0">
              <span className="text-indigo-500 font-bold">GSTR-4 Due:</span>
              <span className="font-mono">{formatISOToDDMMYYYY(gstr4DueDate)}</span>
            </div>
          )}
        </div>

        <div className="relative flex-1 group w-full">
          <input type="text" placeholder="Search composition annual entity..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-2.5 landscape:py-1 pl-10 pr-3 font-bold text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none" />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-nowrap overflow-x-auto no-scrollbar max-w-full w-full lg:w-auto py-0.5">
          <ViewControl 
            viewMode={viewMode} 
            onViewChange={setViewMode} 
          />
          <SectorJurisdictionFilter
            clients={clients}
            authority={authorityFilter}
            setAuthority={setAuthorityFilter}
            selectedSectors={selectedSectors}
            setSelectedSectors={setSelectedSectors}
            buttonClassName="h-10 landscape:h-8 px-3 bg-white border border-slate-200 rounded-xl shadow-xs text-xs font-black uppercase tracking-tight hover:border-indigo-200 shrink-0 whitespace-nowrap"
            totalFilteredCount={filteredClients.length}
          />
          <ExportMenu onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 landscape:h-8 text-[11px] font-black uppercase tracking-widest text-slate-700 outline-none cursor-pointer shrink-0 whitespace-nowrap">{YEARS.map(y => <option key={y} value={y}>FY {y}</option>)}</select>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {viewMode === 'grid' ? (
          <div className="p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredClients.map((client, idx) => {
              const status = getStatus(client.id);
              const theme = getClientColorTheme(client);
              return (
                <div key={client.id} className="p-3.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl shadow-xs transition-all flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">#{idx + 1}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-slate-700 font-mono">{client.gstProfile?.gstin || 'NO GSTIN'}</span>
                        {client.gstProfile?.gstin && (
                          <button onClick={() => { navigator.clipboard.writeText(client.gstProfile?.gstin || ''); toast.success('GSTIN Copied!'); window.open('https://services.gst.gov.in/services/searchtp', '_blank'); }} className="p-0.5 text-slate-400 hover:text-indigo-600 transition-colors inline-flex" title="Search GSTIN">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <h4 className="text-xs font-black text-slate-900 truncate" title={client.tradeName}>{client.tradeName || client.legalName}</h4>
                    <p className="text-[10px] font-bold text-slate-500 truncate mb-2">{client.legalName}</p>
                    
                    {/* Credentials Section with Edit/Login Buttons */}
                    <div className="mt-2 p-2.5 bg-white rounded-xl border border-slate-200/80 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-[9px] text-slate-400 uppercase">ID:</span>
                        <span className="font-mono font-bold text-slate-800">{client.gstProfile?.username || '---'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-[9px] text-slate-400 uppercase">PWD:</span>
                        <div className="flex items-center gap-1">
                          {editingPasswordId === client.id ? (
                            <input 
                              autoFocus 
                              value={newPassVal} 
                              onChange={e => setNewPassVal(e.target.value)} 
                              onBlur={handleUpdatePassword} 
                              onKeyDown={e => e.key === 'Enter' && handleUpdatePassword()} 
                              className="bg-white border border-indigo-200 rounded px-1.5 py-0.5 text-[10px] font-bold w-20 outline-none h-5" 
                            />
                          ) : (
                            <>
                              <span className="font-mono font-bold text-indigo-500">{client.gstProfile?.password || '---'}</span>
                              <button 
                                onClick={() => { setSelectedClient(client); setEditingPasswordId(client.id); setNewPassVal(client.gstProfile?.password || ''); }} 
                                className="p-0.5 text-slate-300 hover:text-amber-500 transition-all"
                                title="Edit Password"
                              >
                                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                              {client.gstProfile?.username && (
                                <button 
                                  onClick={() => { 
                                    navigator.clipboard.writeText(client.gstProfile?.username || ''); 
                                    window.open('https://services.gst.gov.in/services/login', '_blank'); 
                                  }} 
                                  className="p-0.5 text-slate-300 hover:text-indigo-600 transition-all" 
                                  title="Login to Portal"
                                >
                                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-[10px]">
                    <span className="font-bold text-slate-500">GSTR-4 Status:</span>
                    <button onClick={() => toggleStatus(client.id)} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${status.filed ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-rose-100 text-rose-800 border-rose-200'}`}>
                      {status.filed ? 'Filed' : 'Pending'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <GSTViewIcon client={client} onDataChange={handleRefreshClients} />
                    <button onClick={(e) => openActionsMenu(e, client)} className="px-2.5 py-1 text-[10px] font-black uppercase bg-indigo-600 text-white rounded-lg shadow-xs hover:bg-slate-900 transition-colors">
                      Actions
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
        <div className="overflow-auto no-scrollbar flex-1 w-full relative h-full">
          <table className="w-full text-left border-collapse table-fixed min-w-full gstr4-returns-table min-w-[1100px]">
            <thead className="sticky top-0 z-30 bg-slate-100">
              <tr className="bg-slate-50 border-b border-slate-200 shadow-sm font-bold uppercase tracking-wider text-slate-900">
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[50px] text-center">S.No.</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[22%] min-w-[160px]">Trader Name</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[15%] min-w-[145px]">GSTIN</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[14%] min-w-[140px] text-center">CMP-08 Status</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[12%] min-w-[115px] text-center">GSTR-4 Status</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[11%] min-w-[110px]">User ID</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[11%] min-w-[110px]">Password</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[11%] min-w-[120px]">Remark</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 text-right w-[90px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groupedClients.map(({ sector, clients: sectorClients }) => (
                <React.Fragment key={sector}>
                  <tr>
                    <td colSpan={9} className="sticky top-[27px] z-20 bg-slate-200/95 backdrop-blur-md font-bold text-slate-800 py-1.5 px-3 uppercase text-[10px] tracking-widest border-y border-slate-300 shadow-xs">{sector} ({sectorClients.length})</td>
                  </tr>
                  {sectorClients.map((client, idx) => {
                const status = getStatus(client.id);
                const isEditingPass = editingPasswordId === client.id;
                const theme = getClientColorTheme(client);
                return (
                  <tr key={client.id} className={`transition-all group border-b border-slate-100 animate-in fade-in slide-in-from-bottom-1 duration-150 ${theme.rowClass}`}>
                    <td className="px-3 py-1.5 font-black text-indigo-400 font-mono text-center">{(idx + 1).toString().padStart(2, '0')}</td>
                    <td className={`px-3 py-1.5 truncate ${theme.tradeNameClass}`} title={client.tradeName}>
                      <div className="font-semibold truncate text-[var(--app-font-size)]">{client.tradeName || '---'}</div>
                      <p className="legal-subtitle truncate font-medium" title={client.legalName}>{client.legalName || '---'}</p>
                    </td>
   
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-1.5 group/gstin">
                        <span className={`truncate font-semibold tracking-wider font-mono uppercase ${theme.gstinClass}`}>{client.gstProfile?.gstin || '---'}</span>
                        {client.gstProfile?.gstin && (
                          <button onClick={() => (navigator.clipboard.writeText(client.gstProfile?.gstin || '').then(() => { toast.success('GSTIN Copied!'); window.open('https://services.gst.gov.in/services/searchtp', '_blank'); }))} className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0" title="Search Taxpayer">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <div className="flex justify-center items-center gap-1">
                        {[
                          { label: 'Q1', q: 'April-June (Q1)' },
                          { label: 'Q2', q: 'July-September (Q2)' },
                          { label: 'Q3', q: 'October-December (Q3)' },
                          { label: 'Q4', q: 'January-March (Q4)' }
                        ].map(qInfo => {
                           const isFiled = cmp08Data[`${selectedYear}_${qInfo.q}`]?.[client.id]?.cmp08;
                           return (
                             <span 
                               key={qInfo.label} 
                               title={`${qInfo.q}: ${isFiled ? 'Filed' : 'Pending'}`} 
                               className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border transition-all ${
                                 isFiled 
                                   ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                   : 'bg-slate-100 text-slate-400 border-slate-200'
                               }`}
                             >
                               {qInfo.label}
                             </span>
                           );
                        })}
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-center">
                       <button 
                         onClick={() => toggleStatus(client.id)} 
                         className={`px-2.5 py-0.5 rounded-full font-black uppercase border flex items-center justify-center gap-1 mx-auto transition-all ${
                           status.filed 
                             ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200' 
                             : 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200'
                         }`}
                         title="Click to toggle GSTR-4 Status (Pending / Filed)"
                       >
                         <span>{status.filed ? 'Filed' : 'Pending'}</span>
                         <svg className="h-2.5 w-2.5 opacity-40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                       </button>
                    </td>
                    <td className="px-3 py-1.5 font-semibold text-slate-700 truncate">{client.gstProfile?.username || '---'}</td>
                    <td className="px-3 py-1.5 relative group/pass">
                      <div className="flex items-center gap-2">
                        {isEditingPass ? (
                          <input 
                            autoFocus 
                            value={newPassVal} 
                            onChange={e => setNewPassVal(e.target.value)} 
                            onBlur={handleUpdatePassword} 
                            onKeyDown={e => e.key === 'Enter' && handleUpdatePassword()} 
                            className="bg-white border border-indigo-200 rounded px-2 h-7 font-semibold w-24 outline-none" 
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-indigo-500 truncate">{client.gstProfile?.password || '---'}</span>
                            <button 
                              onClick={() => { setSelectedClient(client); setEditingPasswordId(client.id); setNewPassVal(client.gstProfile?.password || ''); }} 
                              className="p-1 text-slate-300 hover:text-amber-500 opacity-0 group-hover/pass:opacity-100 transition-all shrink-0"
                              title="Edit Password"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            {client.gstProfile?.username && (
                              <button 
                                onClick={() => { 
                                  navigator.clipboard.writeText(client.gstProfile?.username || ''); 
                                  window.open('https://services.gst.gov.in/services/login', '_blank'); 
                                }} 
                                className="p-1 text-slate-300 hover:text-indigo-600 opacity-0 group-hover/pass:opacity-100 transition-all shrink-0" 
                                title="Login to GST Portal"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-1.5 truncate max-w-[150px]" title={status?.remark || getStatus?.(client.id)?.remark || 'Add remark...'}>
                       <EditableRemark value={status?.remark || getStatus?.(client.id)?.remark || ''} onSave={val => updateRemark(client.id, val)} />
                    </td>
                    <td className="px-3 py-1.5 text-right w-[90px]">
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

      {/* FIXED ACTIONS MENU */}
      {activeActionsId && selectedClient && (
        <div ref={actionsRef} style={{ top: menuPosition.top, left: menuPosition.left }} className="fixed w-64 bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl z-[9999] p-2 animate-in zoom-in-95 origin-top-right overflow-y-auto max-h-[calc(100vh-24px)] text-left">
          <button onClick={() => { shareViaWhatsApp(`*GSTR-4 Annual Credentials*\nEntity: ${selectedClient.tradeName}\nGSTIN: ${selectedClient.gstProfile?.gstin}\nUser ID: ${selectedClient.gstProfile?.username}\nPassword: ${selectedClient.gstProfile?.password}`); setActiveActionsId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-50 rounded-xl transition-colors text-left group">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-white shadow-sm">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Share Creds</span>
          </button>
          <button onClick={() => { shareViaWhatsApp(`*Entity Profile*\nTrade Name: ${selectedClient.tradeName || 'N/A'}\nLegal Name: ${selectedClient.legalName || 'N/A'}\nMobile: ${selectedClient.mobile || 'N/A'}\nEmail: ${selectedClient.email || 'N/A'}\nGSTIN: ${selectedClient.gstProfile?.gstin || 'N/A'}`); setActiveActionsId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-50 rounded-xl transition-colors text-left group border-t border-slate-50">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Share Full Detail</span>
          </button>
        </div>
      )}

      {/* FULL CLIENT DETAIL VIEW MODAL removed - replaced by GSTViewIcon */}
    </div>
  );
};

export default GSTR4;
