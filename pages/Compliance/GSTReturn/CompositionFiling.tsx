
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useModuleData } from '../../../hooks/useModuleData.ts';
import { formatDate } from '../../../exportUtils';
import { Client } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';
import GSTViewIcon from '../../../components/GSTViewIcon';
import { exportToCSV, printList, getSectorGroupLabel, getClientColorTheme } from '../../../exportUtils';
import { TableFilter } from '../../../components/TableFilter';
import { SectorJurisdictionFilter, filterClientsBySectorJurisdiction } from '../../../components/SectorJurisdictionFilter';
import { useCompositionFilingLogic } from './filinglogic/CompositionFilingLogic';
import { EditableRemark } from '../../../components/EditableRemark';
import { getDefaultPeriod, YEARS, QUARTERS, isClientVisibleInPeriod, isClientVisibleInFY, getStatusLabel } from './filinglogic/MonthlyFilingLogic';

const QUARTER_SELECT_OPTIONS = ['All Quarters', ...QUARTERS];

const SHORT_QUARTER_MAP: Record<string, string> = {
  'April-June (Q1)': 'Q1 (Apr-Jun)',
  'July-September (Q2)': 'Q2 (Jul-Sep)',
  'October-December (Q3)': 'Q3 (Oct-Dec)',
  'January-March (Q4)': 'Q4 (Jan-Mar)',
};
import { toast } from 'sonner';
import { useGlobalDueDates } from '../../../hooks/useGlobalDueDates';
import { formatISOToDDMMYYYY } from '../../../dateUtils';
import { ViewControl } from '../../../components/ViewControl';

const CompositionFiling: React.FC = () => {
  const defaultPeriod = getDefaultPeriod();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [cmp08Filter, setCmp08Filter] = useState<'All' | 'Filed' | 'Challan' | 'Pending'>('All');
  const [quickFilter, setQuickFilter] = useState<'All' | 'Filed' | 'Challan' | 'Pending'>('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [authorityFilter, setAuthorityFilter] = useState<'All' | 'State' | 'Center'>('All');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [quarterFilters, setQuarterFilters] = useState<Record<string, string>>({});
  const [isCmp08FilterOpen, setIsCmp08FilterOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(defaultPeriod.quarterYear);
  const [selectedQuarter, setSelectedQuarter] = useState(defaultPeriod.quarter);
  
  const { getGlobalDueDate } = useGlobalDueDates(selectedYear);
  const cmp08DueDate = getGlobalDueDate('composition_cmp08', selectedQuarter);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [newPassVal, setNewPassVal] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  const [activeActionsId, setActiveActionsId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const actionsRef = useRef<HTMLDivElement>(null);

  const { data: pageData, isLoading: isPageLoading } = useModuleData('composition_filing_page_data');

  const clients = useMemo(() => pageData?.clients || [], [pageData]);
  const allClientsBase = clients;

  // For Composition, visibility check uses the quarter end month
  const quarterEndMonth = useMemo(() => {
    if (selectedQuarter.includes('Q1')) return 'June';
    if (selectedQuarter.includes('Q2')) return 'September';
    if (selectedQuarter.includes('Q3')) return 'December';
    return 'March';
  }, [selectedQuarter]);

  const { getStatus, toggleStatus, updateRemark, updateDueDate, getDueDate } = useCompositionFilingLogic(
    selectedYear, 
    selectedQuarter, 
    pageData?.filingData, 
    pageData?.dueDates
  );

  const isLoading = isPageLoading && !pageData;

  useEffect(() => {
    const syncHandler = () => {
      queryClient.invalidateQueries({ queryKey: ['composition_filing_page_data'] });
    };
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, [queryClient]);

  useEffect(() => {
    const handleClose = (event: any) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) setActiveActionsId(null);
    };
    if (activeActionsId) document.addEventListener('mousedown', handleClose);
    return () => document.removeEventListener('mousedown', handleClose);
  }, [activeActionsId]);

  const openActionsMenu = (e: React.MouseEvent, client: Client) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + window.scrollY + 8, left: rect.right - 256 });
    setActiveActionsId(client.id);
    setSelectedClient(client);
  };

  const isAllQuartersMode = selectedQuarter === 'All Quarters';

  const baseClients = useMemo(() => {
    const s = search.toLowerCase();
    let list = clients.filter(c => 
      (isAllQuartersMode ? isClientVisibleInFY(c, selectedYear) : isClientVisibleInPeriod(c, selectedYear, quarterEndMonth)) &&
      ((c.legalName || '').toLowerCase().includes(s) || 
       (c.tradeName || '').toLowerCase().includes(s) ||
       (c.gstProfile?.gstin || '').toLowerCase().includes(s))
    );
    if (isAllQuartersMode) {
      if (cmp08Filter === 'Filed') {
        list = list.filter(c => QUARTERS.every(q => getStatusLabel(getStatus(c.id, `${selectedYear}_${q}`).cmp08) === 'Filed'));
      } else if (cmp08Filter === 'Challan') {
        list = list.filter(c => QUARTERS.some(q => getStatusLabel(getStatus(c.id, `${selectedYear}_${q}`).cmp08) === 'Challan'));
      } else if (cmp08Filter === 'Pending') {
        list = list.filter(c => QUARTERS.some(q => getStatusLabel(getStatus(c.id, `${selectedYear}_${q}`).cmp08) === 'Pending'));
      }

      QUARTERS.forEach(q => {
        const filter = quarterFilters[q];
        if (!filter || filter === 'All') return;
        if (filter === 'Filed') {
          list = list.filter(c => getStatusLabel(getStatus(c.id, `${selectedYear}_${q}`).cmp08) === 'Filed');
        } else if (filter === 'Challan') {
          list = list.filter(c => getStatusLabel(getStatus(c.id, `${selectedYear}_${q}`).cmp08) === 'Challan');
        } else if (filter === 'Pending') {
          list = list.filter(c => getStatusLabel(getStatus(c.id, `${selectedYear}_${q}`).cmp08) === 'Pending');
        }
      });
    } else if (!isAllQuartersMode && cmp08Filter !== 'All') {
      list = list.filter(c => getStatusLabel(getStatus(c.id).cmp08) === cmp08Filter);
    }

    list = filterClientsBySectorJurisdiction(list, authorityFilter, selectedSectors);

    return list;
  }, [clients, search, selectedYear, quarterEndMonth, cmp08Filter, authorityFilter, selectedSectors, quarterFilters, getStatus, isAllQuartersMode]);

  const stats = useMemo(() => {
    const total = baseClients.length;
    if (isAllQuartersMode) {
      return { total, cmp08: 0, cmp08Challan: 0, cmp08Pending: 0 };
    }
    const cmp08Filed = baseClients.filter(c => getStatusLabel(getStatus(c.id).cmp08) === 'Filed').length;
    const cmp08Challan = baseClients.filter(c => getStatusLabel(getStatus(c.id).cmp08) === 'Challan').length;
    const cmp08Pending = baseClients.filter(c => getStatusLabel(getStatus(c.id).cmp08) === 'Pending').length;
    return { total, cmp08: cmp08Filed, cmp08Challan, cmp08Pending };
  }, [baseClients, getStatus, isAllQuartersMode]);

  const filteredClients = useMemo(() => {
    if (quickFilter === 'All') return baseClients;
    if (quickFilter === 'Filed') return baseClients.filter(c => getStatusLabel(getStatus(c.id).cmp08) === 'Filed');
    if (quickFilter === 'Challan') return baseClients.filter(c => getStatusLabel(getStatus(c.id).cmp08) === 'Challan');
    if (quickFilter === 'Pending') return baseClients.filter(c => getStatusLabel(getStatus(c.id).cmp08) === 'Pending');
    return baseClients;
  }, [baseClients, quickFilter, getStatus]);
  
  const handleRefreshClients = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['composition_filing_page_data'] });
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  }, [queryClient]);

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
    if (isAllQuartersMode) {
      const headers = ['S.No.', 'Trade Name', 'Legal Name', 'Mobile No.', 'GSTIN', ...QUARTERS.map(q => `CMP-08 ${q}`), 'User ID', 'Password'];
      const rows = filteredClients.map((client, index) => [
        (index + 1).toString().padStart(2, '0'),
        client.tradeName,
        client.legalName,
        client.mobile,
        client.gstProfile?.gstin,
        ...QUARTERS.map(q => getStatusLabel(getStatus(client.id, `${selectedYear}_${q}`).cmp08)),
        client.gstProfile?.username,
        client.gstProfile?.password
      ]);
      exportToCSV(headers, rows, `Composition_Filing_AllQuarters_${selectedYear}.csv`);
    } else {
      const headers = ['S.No.', 'Trade Name', 'Mobile No.', 'GSTIN', 'CMP-08 Status', 'User ID', 'Password', 'Remark'];
      const rows = filteredClients.map((client, index) => [
        (index + 1).toString().padStart(2, '0'),
        client.tradeName,
        client.mobile,
        client.gstProfile?.gstin,
        getStatusLabel(getStatus(client.id).cmp08),
        client.gstProfile?.username,
        client.gstProfile?.password
      ]);
      exportToCSV(headers, rows, `Composition_Filing_${selectedQuarter}_${selectedYear}.csv`);
    }
  };

  const handlePrint = () => {
    if (isAllQuartersMode) {
      const headers = ['S.No.', 'Trade Name', 'Mobile No.', 'GSTIN', ...QUARTERS.map(q => q.slice(0, 2)), 'User ID'];
      const rows = filteredClients.map((client, index) => [
        (index + 1).toString().padStart(2, '0'),
        client.tradeName,
        client.mobile,
        client.gstProfile?.gstin,
        ...QUARTERS.map(q => getStatusLabel(getStatus(client.id, `${selectedYear}_${q}`).cmp08)),
        client.gstProfile?.username
      ]);
      printList(`Composition Filing All Quarters - ${selectedYear}`, headers, rows);
    } else {
      const headers = ['S.No.', 'Trade Name', 'Mobile No.', 'GSTIN', 'CMP-08 Status', 'User ID', 'Password', 'Remark'];
      const rows = filteredClients.map((client, index) => [
        (index + 1).toString().padStart(2, '0'),
        client.tradeName,
        client.mobile,
        client.gstProfile?.gstin,
        getStatusLabel(getStatus(client.id).cmp08),
        client.gstProfile?.username,
        client.gstProfile?.password
      ]);
      printList(`Composition Filing - ${selectedQuarter} ${selectedYear}`, headers, rows);
    }
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-2 landscape:space-y-1 pb-2 overflow-hidden animate-in fade-in duration-500">
      
      {/* Search Toolbar with Integrated Count Badges & Grid/Table Toggle */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2 bg-white p-2 md:p-2.5 rounded-2xl border border-slate-200 shadow-xs shrink-0">
        
        {/* Search Bar & Interactive Count Badges */}
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2 min-w-0">
          <div className="relative flex-1 group min-w-[180px]">
            <input 
              type="text" 
              placeholder="Search trade name, GSTIN, mobile..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all" 
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Count Badges Pill Filter Group */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0 py-0.5">
            <button
              onClick={() => setQuickFilter('All')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 border ${
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

            {!isAllQuartersMode && (
              <>
                <button
                  onClick={() => setQuickFilter('Filed')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 border ${
                    quickFilter === 'Filed' 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                      : 'bg-emerald-50/70 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <span>CMP-08 Filed</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-black ${
                    quickFilter === 'Filed' ? 'bg-emerald-500 text-white' : 'bg-emerald-200 text-emerald-900'
                  }`}>{stats.cmp08}</span>
                </button>

                <button
                  onClick={() => setQuickFilter('Challan')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 border ${
                    quickFilter === 'Challan' 
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs' 
                      : 'bg-amber-50/70 text-amber-700 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <span>CMP-08 Challan</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-black ${
                    quickFilter === 'Challan' ? 'bg-amber-500 text-white' : 'bg-amber-200 text-amber-900'
                  }`}>{stats.cmp08Challan}</span>
                </button>

                <button
                  onClick={() => setQuickFilter('Pending')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 border ${
                    quickFilter === 'Pending' 
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs' 
                      : 'bg-rose-50/70 text-rose-700 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <span>Pending</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-black ${
                    quickFilter === 'Pending' ? 'bg-rose-500 text-white' : 'bg-rose-200 text-rose-900'
                  }`}>{stats.cmp08Pending}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Controls: View Control, Filter, Year/Quarter, Print, Export */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-between lg:justify-end">
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
            buttonClassName="h-8 px-2.5 bg-white border border-slate-200 rounded-xl shadow-xs text-xs font-black uppercase tracking-tight hover:border-indigo-200"
            totalFilteredCount={filteredClients.length}
          />

          <button onClick={handlePrint} className="h-8 w-8 bg-white border border-slate-200 rounded-xl shadow-xs text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors flex items-center justify-center shrink-0" title="Print List">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          </button>
          <button onClick={handleExportCSV} className="h-8 w-8 bg-white border border-slate-200 rounded-xl shadow-xs text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition-colors flex items-center justify-center shrink-0" title="Export Excel / CSV">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </button>

          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 h-8 text-[11px] font-black uppercase text-slate-700 outline-none">{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
          <select value={selectedQuarter} onChange={e => setSelectedQuarter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 h-8 text-[11px] font-black uppercase text-slate-700 outline-none">{QUARTER_SELECT_OPTIONS.map(q => <option key={q} value={q}>{q}</option>)}</select>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {viewMode === 'grid' ? (
          <div className="p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredClients.map((client, idx) => {
              const statusLabel = getStatusLabel(getStatus(client.id).cmp08);
              return (
                <div key={client.id} className="p-3.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl shadow-xs transition-all flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">#{idx + 1}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-slate-500 font-mono">{client.gstProfile?.gstin || 'NO GSTIN'}</span>
                        {client.gstProfile?.gstin && (
                          <button onClick={() => { navigator.clipboard.writeText(client.gstProfile?.gstin || ''); toast.success('GSTIN Copied!'); window.open('https://services.gst.gov.in/services/searchtp', '_blank'); }} className="p-0.5 text-slate-400 hover:text-indigo-600 transition-colors inline-flex" title="Search GSTIN">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <h4 className="text-xs font-black text-slate-900 truncate" title={client.tradeName}>{client.tradeName || client.legalName}</h4>
                    <p className="text-[10px] font-bold text-slate-500 truncate mb-2">{client.legalName}</p>

                    {/* Credentials Section */}
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
                                className="p-0.5 text-slate-300 hover:text-amber-500 transition-all inline-flex"
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
                                  className="p-0.5 text-slate-300 hover:text-indigo-600 transition-all inline-flex" 
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

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 text-[10px]">
                    <span className={`px-2 py-0.5 rounded-md font-black uppercase ${
                      statusLabel === 'Filed' ? 'bg-emerald-100 text-emerald-800' : statusLabel === 'Challan' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      CMP-08: {statusLabel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <span className="text-[9px] font-black uppercase text-slate-400">Composition</span>
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
          <table className={`w-full text-left border-collapse table-fixed min-w-full composition-returns-table ${isAllQuartersMode ? 'min-w-[1250px]' : ''}`}>
            <thead className="sticky top-0 z-30 bg-slate-100">
              <tr className="bg-slate-50 border-b border-slate-200 shadow-sm font-bold uppercase tracking-wider text-slate-900">
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[50px] text-center">S.No.</th>
                <th className={`sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 ${isAllQuartersMode ? 'w-[180px]' : 'w-[22%]'} min-w-[150px]`}>Trade Name</th>
                <th className={`sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 ${isAllQuartersMode ? 'w-[110px]' : 'w-[11%]'}`}>Mobile No.</th>
                <th className={`sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 ${isAllQuartersMode ? 'w-[145px]' : 'w-[14%]'}`}>GSTIN</th>
                
                {isAllQuartersMode ? (
                  QUARTERS.map(q => (
                    <th key={q} className="sticky top-0 z-30 bg-slate-100 px-1 py-1 border-b border-slate-200 text-center w-[125px] min-w-[125px]">
                      <div className="flex items-center justify-center gap-0.5">
                        <TableFilter 
                          label={SHORT_QUARTER_MAP[q] || q} 
                          isActive={!!quarterFilters[q] && quarterFilters[q] !== 'All'}
                        >
                          {['All', 'Filed', 'Challan', 'Pending'].map(f => (
                            <button 
                              key={f} 
                              onClick={() => setQuarterFilters(prev => ({ ...prev, [q]: f }))} 
                              className={`w-full text-left px-2.5 py-1.5 text-[var(--app-font-size)] font-black uppercase rounded-lg ${
                                (quarterFilters[q] || 'All') === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              {f}
                            </button>
                          ))}
                        </TableFilter>
                      </div>
                    </th>
                  ))
                ) : (
                  <>
                    <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 text-center w-[16%] min-w-[160px]">
                       <div className="flex justify-center flex-col items-center">
                         <TableFilter label="CMP-08" isActive={cmp08Filter !== 'All'}>
                           {['All', 'Filed', 'Challan', 'Pending'].map(f => <button key={f} onClick={() => setCmp08Filter(f as any)} className={`w-full text-left px-3 py-2 text-[var(--app-font-size)] font-black uppercase rounded-lg ${cmp08Filter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{f}</button>)}
                         </TableFilter>
                       </div>
                    </th>
                    <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[11%] min-w-[110px]">User ID</th>
                    <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[11%] min-w-[110px]">Password</th>
                    <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[10%] min-w-[120px]">Remark</th>
                  </>
                )}

                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 text-right w-[90px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groupedClients.map(({ sector, clients: sectorClients }) => (
                <React.Fragment key={sector}>
                  <tr>
                    <td colSpan={isAllQuartersMode ? 10 : 10} className="sticky top-[27px] z-20 bg-slate-200/95 backdrop-blur-md font-bold text-slate-800 py-1.5 px-3 uppercase text-[10px] tracking-widest border-y border-slate-300 shadow-xs">{sector} ({sectorClients.length})</td>
                  </tr>
                  {sectorClients.map((client, idx) => {
                const st = getStatus(client.id);
                const cmp08Status = getStatusLabel(st.cmp08);
                const isEditingPass = editingPasswordId === client.id;
                const theme = getClientColorTheme(client);
                return (
                  <tr key={client.id} className={`transition-all group border-b border-slate-100 animate-in fade-in slide-in-from-bottom-1 duration-150 ${theme.rowClass}`}>
                    <td className="px-3 py-1.5 font-black text-indigo-400 font-mono text-center">{(idx + 1).toString().padStart(2, '0')}</td>
                    <td className={`px-3 py-1.5 truncate ${theme.tradeNameClass}`} title={client.tradeName}>
                      <div className="font-semibold truncate text-[var(--app-font-size)]">{client.tradeName || '---'}</div>
                      <p className="legal-subtitle truncate font-medium" title={client.legalName}>{client.legalName || '---'}</p>
                    </td>
                    <td className="px-3 py-1.5 font-bold text-slate-600 truncate">{client.mobile || '---'}</td>
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-1.5 group/gstin">
                        <span className={`truncate font-semibold tracking-wider font-mono uppercase ${theme.gstinClass}`}>{client.gstProfile?.gstin}</span>
                        {client.gstProfile?.gstin && (
                          <button onClick={() => (navigator.clipboard.writeText(client.gstProfile?.gstin || '').then(() => { toast.success('GSTIN Copied!'); window.open('https://services.gst.gov.in/services/searchtp', '_blank'); }))} className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0" title="Search Taxpayer">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          </button>
                        )}
                      </div>
                    </td>

                    {isAllQuartersMode ? (
                      QUARTERS.map(q => {
                        const targetKey = `${selectedYear}_${q}`;
                        const qSt = getStatus(client.id, targetKey);
                        const qStatusLabel = getStatusLabel(qSt.cmp08);
                        return (
                          <td key={q} className="px-1 py-1 text-center border-x border-slate-100/80 align-middle w-[125px] min-w-[125px]">
                            <button
                              type="button"
                              onClick={() => toggleStatus(client.id, targetKey)}
                              className={`w-full px-1.5 py-0.5 rounded text-[9px] font-black uppercase border flex items-center justify-between gap-0.5 transition-all ${
                                qStatusLabel === 'Filed' 
                                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200' 
                                  : qStatusLabel === 'Challan' 
                                    ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200' 
                                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-200'
                              }`}
                              title={`CMP-08 (${q}): Click to cycle (Pending → Challan → Filed)`}
                            >
                              <span>{qStatusLabel === 'Filed' ? 'Filed' : qStatusLabel === 'Challan' ? 'Chal' : 'Pend'}</span>
                              <svg className="h-2 w-2 opacity-40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                          </td>
                        );
                      })
                    ) : (
                      <>
                        <td className="px-3 py-1.5 text-center w-[16%] min-w-[160px]">
                          <button onClick={() => toggleStatus(client.id)} className={`px-2.5 py-0.5 rounded-full font-black uppercase border flex items-center justify-center gap-1 mx-auto transition-all ${
                            cmp08Status === 'Filed' 
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200' 
                              : cmp08Status === 'Challan' 
                                ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200' 
                                : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                          }`} title="Click to cycle: Pending → Challan → Filed">
                            {cmp08Status}
                            <svg className="h-2.5 w-2.5 opacity-40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                        </td>
                        <td className="px-3 py-1.5 font-semibold text-slate-700 truncate w-[11%] min-w-[110px]">{client.gstProfile?.username || '---'}</td>
                        <td className="px-3 py-1.5 w-[11%] min-w-[110px] relative group/pass">
                          <div className="flex items-center gap-2">
                            {isEditingPass ? (
                              <input autoFocus value={newPassVal} onChange={e => setNewPassVal(e.target.value)} onBlur={handleUpdatePassword} onKeyDown={e => e.key === 'Enter' && handleUpdatePassword()} className="bg-white border border-indigo-200 rounded px-2 h-7 font-semibold w-24 outline-none" />
                            ) : (
                              <div className="flex items-center gap-2">
                                 <span className="font-semibold text-indigo-500 truncate">{client.gstProfile?.password || '---'}</span>
                                 <button onClick={() => { setSelectedClient(client); setEditingPasswordId(client.id); setNewPassVal(client.gstProfile?.password || ''); }} className="p-1 text-slate-300 hover:text-amber-500 opacity-0 group-hover/pass:opacity-100 transition-all shrink-0"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
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
                        <td className="px-3 py-1.5 truncate max-w-[150px] w-[10%] min-w-[120px]">
                           <EditableRemark value={st?.remark || getStatus?.(client.id)?.remark || ''} onSave={val => updateRemark(client.id, val)} />
                        </td>
                      </>
                    )}
                    <td className="px-3 py-1.5 text-right w-[90px]">
                       <div className="flex items-center justify-end gap-1">
                          <GSTViewIcon client={client} onDataChange={handleRefreshClients} />
                          <button onClick={(e) => openActionsMenu(e, client)} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 flex items-center justify-center shadow-sm">
                             <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                          </button>
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

      {activeActionsId && selectedClient && (
        <div ref={actionsRef} style={{ top: menuPosition.top, left: menuPosition.left }} className="fixed w-64 bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl z-[9999] p-2 animate-in zoom-in-95 origin-top-right text-left">
           <button onClick={() => { 
             const text = `*Entity Profile*\nTrade Name: ${selectedClient.tradeName || 'N/A'}\nLegal Name: ${selectedClient.legalName || 'N/A'}\nMobile: ${selectedClient.mobile || 'N/A'}\nEmail: ${selectedClient.email || 'N/A'}\n\n*GST Details*\nGSTIN: ${selectedClient.gstProfile?.gstin || 'N/A'}\nStatus: ${selectedClient.gstProfile?.gstStatus || 'N/A'}\nReg Type: ${selectedClient.gstProfile?.regType || 'N/A'}\nFiling: ${selectedClient.gstProfile?.filingFreq || 'N/A'}\nReg Date: ${formatDate(selectedClient.gstProfile?.regDate)}\nJurisdiction: ${selectedClient.gstProfile?.jurisdictionType || 'N/A'}\nSector/Range: ${selectedClient.gstProfile?.sector || selectedClient.gstProfile?.range || 'N/A'}\n\n*Credentials*\nGST User ID: ${selectedClient.gstProfile?.username || 'N/A'}\nGST Password: ${selectedClient.gstProfile?.password || 'N/A'}`;
             window.location.href = `whatsapp://send?text=${encodeURIComponent(text)}`;
             setActiveActionsId(null); 
           }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-left group">
              <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center text-green-500 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.126.549 4.2 1.593 6.035L.302 23.687l5.772-1.517a12.001 12.001 0 005.957 1.57h.005c6.645 0 12.031-5.385 12.031-12.031C24.067 5.385 18.681 0 12.031 0zm0 21.724c-1.802 0-3.568-.485-5.114-1.403l-.367-.217-3.8.998 1.018-3.705-.238-.38A9.992 9.992 0 012.016 12.03c0-5.526 4.498-10.024 10.024-10.024 2.678 0 5.195 1.042 7.087 2.937 1.892 1.892 2.934 4.409 2.934 7.087 0 5.528-4.499 10.028-10.025 10.028v-.004c0-.001-.002-.001-.005-.001zM17.53 14.19c-.302-.15-1.785-.882-2.062-.983-.277-.101-.479-.151-.68.15s-.781.983-.956 1.185c-.176.201-.352.226-.653.076-.301-.15-1.275-.471-2.428-1.5-3.036-2.699-2.227-2.699-.582-5.467.243-.404-.76-2.222-1.04-2.912-.272-.676-.55-.584-.755-.595l-.645-.01c-.226 0-.594.084-.904.42-.311.336-1.191 1.163-1.191 2.836 0 1.674 1.221 3.292 1.391 3.519.17.227 2.457 3.864 5.952 5.253.81.321 1.442.513 1.934.656.812.235 1.551.202 2.138.122.656-.09 2.062-.843 2.353-1.657.292-.814.292-1.512.204-1.657-.087-.145-.313-.231-.615-.383z"/></svg></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Share via WhatsApp</span>
           </button>
        </div>
      )}
    </div>
  );
};

export default CompositionFiling;
