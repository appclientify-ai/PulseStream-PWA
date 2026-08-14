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
import { useMonthlyFilingLogic, MONTHS, FY_MONTHS, YEARS, getDefaultPeriod, isClientVisibleInPeriod, isClientVisibleInFY, getStatusLabel } from './filinglogic/MonthlyFilingLogic';
import { EditableRemark } from '../../../components/EditableRemark';
import { toast } from 'sonner';
import { useGlobalDueDates } from '../../../hooks/useGlobalDueDates';
import { formatISOToDDMMYYYY } from '../../../dateUtils';
import { ViewControl } from '../../../components/ViewControl';

const MONTH_SELECT_OPTIONS = ['All Months', ...FY_MONTHS];

const SHORT_MONTH_MAP: Record<string, string> = {
  April: 'Apr',
  May: 'May',
  June: 'Jun',
  July: 'Jul',
  August: 'Aug',
  September: 'Sep',
  October: 'Oct',
  November: 'Nov',
  December: 'Dec',
  January: 'Jan',
  February: 'Feb',
  March: 'Mar',
};

const MonthlyFiling: React.FC = () => {
  const defaultPeriod = getDefaultPeriod();
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState(defaultPeriod.year);
  const [selectedMonth, setSelectedMonth] = useState(defaultPeriod.month);
  
  const { getGlobalDueDate } = useGlobalDueDates(selectedYear);
  const r1DueDate = getGlobalDueDate('monthly_r1', selectedMonth);
  const r3bDueDate = getGlobalDueDate('monthly_r3b', selectedMonth);
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [newPassVal, setNewPassVal] = useState('');

  const [r1Filter, setR1Filter] = useState<'All' | 'Filed' | 'Pending'>('All');
  const [r3bFilter, setR3bFilter] = useState<'All' | 'Filed' | 'Challan' | 'Pending'>('All');
  const [quickFilter, setQuickFilter] = useState<'All' | 'R1Filed' | '3BFiled' | '3BChallan' | 'Pending'>('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [authorityFilter, setAuthorityFilter] = useState<'All' | 'State' | 'Center'>('All');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [monthFilters, setMonthFilters] = useState<Record<string, string>>({});
  const [isR1FilterOpen, setIsR1FilterOpen] = useState(false);
  const [isR3bFilterOpen, setIsR3bFilterOpen] = useState(false);
  const [search, setSearch] = useState('');

  const [activeActionsId, setActiveActionsId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const actionsRef = useRef<HTMLDivElement>(null);

  const { data: pageData, isLoading: isPageLoading } = useModuleData('monthly_filing_page_data');

  const clients = useMemo(() => pageData?.clients || [], [pageData]);
  const allClientsBase = clients;

  const { getStatus, toggleStatus, updateRemark } = useMonthlyFilingLogic(
    selectedYear, 
    selectedMonth, 
    undefined, 
    pageData?.filingData || {}, 
    pageData?.dueDates || {}
  );

  const isLoading = isPageLoading && !pageData;

  useEffect(() => {
    const handleClose = (event: any) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) setActiveActionsId(null);
    };
    if (activeActionsId) document.addEventListener('mousedown', handleClose);
    return () => document.removeEventListener('mousedown', handleClose);
  }, [activeActionsId]);

  const getClientDisplayId = useCallback((client: Client) => {
    if (!client || !client.gstProfile) return '---';
    const isState = client?.gstProfile?.jurisdictionType === 'State';
    const val = isState ? client?.gstProfile?.sector : client?.gstProfile?.range;
    const prefix = isState ? 'S' : 'C';
    const sameGroup = allClientsBase.filter(c => c && 
      c.gstProfile?.jurisdictionType === client.gstProfile?.jurisdictionType &&
      (isState ? c.gstProfile?.sector === val : c.gstProfile?.range === val)
    ).sort((a, b) => (new Date(a.createdAt || 0).getTime()) - (new Date(b.createdAt || 0).getTime()));
    const rank = sameGroup.findIndex(c => c.id === client.id) + 1;
    return `${prefix}/${val || '?'}/${rank}`;
  }, [allClientsBase]);

  const isAllMonthsMode = selectedMonth === 'All Months';

  const baseClients = useMemo(() => {
    const s = search.toLowerCase();
    let list = clients.filter(c => 
      (isAllMonthsMode ? isClientVisibleInFY(c, selectedYear) : isClientVisibleInPeriod(c, selectedYear, selectedMonth)) &&
      ((c.legalName || '').toLowerCase().includes(s) || 
       (c.tradeName || '').toLowerCase().includes(s) ||
       (c.gstProfile?.gstin || '').toLowerCase().includes(s))
    );

    if (isAllMonthsMode) {
      if (r1Filter === 'Filed') {
        list = list.filter(c => FY_MONTHS.every(m => getStatus(c.id, `${selectedYear}_${m}`).r1));
      } else if (r1Filter === 'Pending') {
        list = list.filter(c => FY_MONTHS.some(m => !getStatus(c.id, `${selectedYear}_${m}`).r1));
      }

      if (r3bFilter === 'Filed') {
        list = list.filter(c => FY_MONTHS.every(m => getStatusLabel(getStatus(c.id, `${selectedYear}_${m}`).r3b) === 'Filed'));
      } else if (r3bFilter === 'Challan') {
        list = list.filter(c => FY_MONTHS.some(m => getStatusLabel(getStatus(c.id, `${selectedYear}_${m}`).r3b) === 'Challan'));
      } else if (r3bFilter === 'Pending') {
        list = list.filter(c => FY_MONTHS.some(m => getStatusLabel(getStatus(c.id, `${selectedYear}_${m}`).r3b) === 'Pending'));
      }

      FY_MONTHS.forEach(m => {
        const filter = monthFilters[m];
        if (!filter || filter === 'All') return;
        if (filter === 'R1 Filed') {
          list = list.filter(c => getStatus(c.id, `${selectedYear}_${m}`).r1);
        } else if (filter === 'R1 Pending') {
          list = list.filter(c => !getStatus(c.id, `${selectedYear}_${m}`).r1);
        } else if (filter === '3B Filed') {
          list = list.filter(c => getStatusLabel(getStatus(c.id, `${selectedYear}_${m}`).r3b) === 'Filed');
        } else if (filter === '3B Challan') {
          list = list.filter(c => getStatusLabel(getStatus(c.id, `${selectedYear}_${m}`).r3b) === 'Challan');
        } else if (filter === '3B Pending') {
          list = list.filter(c => getStatusLabel(getStatus(c.id, `${selectedYear}_${m}`).r3b) === 'Pending');
        }
      });
    } else {
      if (r1Filter !== 'All') list = list.filter(c => r1Filter === 'Filed' ? getStatus(c.id).r1 : !getStatus(c.id).r1);
      if (r3bFilter !== 'All') list = list.filter(c => getStatusLabel(getStatus(c.id).r3b) === r3bFilter);
    }

    list = filterClientsBySectorJurisdiction(list, authorityFilter, selectedSectors);
    return list;
  }, [clients, search, r1Filter, r3bFilter, authorityFilter, selectedSectors, monthFilters, getStatus, selectedYear, selectedMonth, isAllMonthsMode]);

  const stats = useMemo(() => {
    const total = baseClients.length;
    if (isAllMonthsMode) return { total, r1: 0, r3b: 0, r3bChallan: 0, pending: 0 };
    const r1 = baseClients.filter(c => getStatus(c.id).r1).length;
    const r3bFiled = baseClients.filter(c => getStatusLabel(getStatus(c.id).r3b) === 'Filed').length;
    const r3bChallan = baseClients.filter(c => getStatusLabel(getStatus(c.id).r3b) === 'Challan').length;
    const pending = baseClients.filter(c => !getStatus(c.id).r1 || getStatusLabel(getStatus(c.id).r3b) === 'Pending').length;
    return { total, r1, r3b: r3bFiled, r3bChallan, pending };
  }, [baseClients, getStatus, isAllMonthsMode]);

  const filteredClients = useMemo(() => {
    if (quickFilter === 'All') return baseClients;
    if (quickFilter === 'R1Filed') return baseClients.filter(c => getStatus(c.id).r1);
    if (quickFilter === '3BFiled') return baseClients.filter(c => getStatusLabel(getStatus(c.id).r3b) === 'Filed');
    if (quickFilter === '3BChallan') return baseClients.filter(c => getStatusLabel(getStatus(c.id).r3b) === 'Challan');
    if (quickFilter === 'Pending') return baseClients.filter(c => !getStatus(c.id).r1 || getStatusLabel(getStatus(c.id).r3b) === 'Pending');
    return baseClients;
  }, [baseClients, quickFilter, getStatus]);

  const handleRefreshClients = useCallback(() => {
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

  const openActionsMenu = (e: React.MouseEvent, client: Client) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + window.scrollY + 8, left: rect.right - 256 });
    setActiveActionsId(client.id);
    setSelectedClient(client);
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
    if (isAllMonthsMode) {
      const headers = ['S.No.', 'Trade Name', 'Mobile No.', 'GSTIN', ...FY_MONTHS.map(m => `${m} (R1 / 3B)`), 'User ID', 'Password'];
      const rows = filteredClients.map((client, index) => [
        (index + 1).toString().padStart(2, '0'),
        client.tradeName,
        client.mobile,
        client.gstProfile?.gstin,
        ...FY_MONTHS.map(m => {
          const st = getStatus(client.id, `${selectedYear}_${m}`);
          return `R1:${st.r1 ? 'Filed' : 'Pend'} | 3B:${getStatusLabel(st.r3b)}`;
        }),
        client.gstProfile?.username,
        client.gstProfile?.password
      ]);
      exportToCSV(headers, rows, `Monthly_Filing_AllMonths_${selectedYear}.csv`);
    } else {
      const headers = ['S.No.', 'Trade Name', 'Mobile No.', 'GSTIN', 'GSTR-1 Status', 'GSTR-3B Status', 'User ID', 'Password', 'Remark'];
      const rows = filteredClients.map((client, index) => [
        (index + 1).toString().padStart(2, '0'),
        client.tradeName,
        client.mobile,
        client.gstProfile?.gstin,
        getStatus(client.id).r1 ? 'Filed' : 'Pending',
        getStatusLabel(getStatus(client.id).r3b),
        client.gstProfile?.username,
        client.gstProfile?.password
      ]);
      exportToCSV(headers, rows, `Monthly_Filing_${selectedMonth}_${selectedYear}.csv`);
    }
  };

  const handlePrint = () => {
    if (isAllMonthsMode) {
      const headers = ['S.No.', 'Trade Name', 'Mobile No.', 'GSTIN', ...FY_MONTHS.map(m => `${m.slice(0,3)}`), 'User ID'];
      const rows = filteredClients.map((client, index) => [
        (index + 1).toString().padStart(2, '0'),
        client.tradeName,
        client.mobile,
        client.gstProfile?.gstin,
        ...FY_MONTHS.map(m => {
          const st = getStatus(client.id, `${selectedYear}_${m}`);
          return `R1:${st.r1 ? 'F' : 'P'} 3B:${getStatusLabel(st.r3b).slice(0,1)}`;
        }),
        client.gstProfile?.username
      ]);
      printList(`Monthly Filing All Months - ${selectedYear}`, headers, rows);
    } else {
      const headers = ['S.No.', 'Trade Name', 'Mobile No.', 'GSTIN', 'GSTR-1 Status', 'GSTR-3B Status', 'User ID', 'Password', 'Remark'];
      const rows = filteredClients.map((client, index) => [
        (index + 1).toString().padStart(2, '0'),
        client.tradeName,
        client.mobile,
        client.gstProfile?.gstin,
        getStatus(client.id).r1 ? 'Filed' : 'Pending',
        getStatusLabel(getStatus(client.id).r3b),
        client.gstProfile?.username,
        client.gstProfile?.password
      ]);
      printList(`Monthly Filing - ${selectedMonth} ${selectedYear}`, headers, rows);
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
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 py-0.5">
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

            {!isAllMonthsMode && (
              <>
                <button
                  onClick={() => setQuickFilter('R1Filed')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 border ${
                    quickFilter === 'R1Filed' 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                      : 'bg-indigo-50/70 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  <span>R1 Filed</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-black ${
                    quickFilter === 'R1Filed' ? 'bg-indigo-500 text-white' : 'bg-indigo-200 text-indigo-900'
                  }`}>{stats.r1}</span>
                </button>

                <button
                  onClick={() => setQuickFilter('3BChallan')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 border ${
                    quickFilter === '3BChallan' 
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs' 
                      : 'bg-amber-50/70 text-amber-700 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <span>3B Challan</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-black ${
                    quickFilter === '3BChallan' ? 'bg-amber-500 text-white' : 'bg-amber-200 text-amber-900'
                  }`}>{stats.r3bChallan}</span>
                </button>

                <button
                  onClick={() => setQuickFilter('3BFiled')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 border ${
                    quickFilter === '3BFiled' 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                      : 'bg-emerald-50/70 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <span>3B Filed</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-black ${
                    quickFilter === '3BFiled' ? 'bg-emerald-500 text-white' : 'bg-emerald-200 text-emerald-900'
                  }`}>{stats.r3b}</span>
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
                  }`}>{stats.pending}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Controls: View Mode, Filter, Year/Month, Print, Export */}
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
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 h-8 text-[11px] font-black uppercase text-slate-700 outline-none">{MONTH_SELECT_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}</select>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {viewMode === 'grid' ? (
          <div className="overflow-auto no-scrollbar flex-1 p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredClients.map(client => {
                const st = getStatus(client.id);
                const r3bStatus = getStatusLabel(st.r3b);
                return (
                  <div key={client.id} className="bg-slate-50/50 hover:bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{getClientDisplayId(client)}</span>
                        <span className="text-[10px] font-bold text-slate-400">{client.mobile || '---'}</span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 truncate" title={client.tradeName}>{client.tradeName || '---'}</h4>
                      <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-[10px] text-slate-500 font-mono truncate">{client.gstProfile?.gstin || '---'}</p>
                        {client.gstProfile?.gstin && (
                          <button onClick={() => (navigator.clipboard.writeText(client.gstProfile?.gstin || '').then(() => { toast.success('GSTIN Copied!'); window.open('https://services.gst.gov.in/services/searchtp', '_blank'); }))} className="text-slate-400 hover:text-indigo-600 transition-colors inline-flex shrink-0" title="Search Taxpayer">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          </button>
                        )}
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1 text-[11px]">
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="font-bold text-[10px] text-slate-400 uppercase">ID:</span>
                          <span className="font-mono font-bold text-slate-800">{client.gstProfile?.username || '---'}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="font-bold text-[10px] text-slate-400 uppercase">PWD:</span>
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
                      
                      {!isAllMonthsMode && (
                        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100">
                          <button onClick={() => toggleStatus(client.id, 'r1')} className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase border transition-all ${st.r1 ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-slate-400 border-slate-200'}`}>
                            R1: {st.r1 ? 'Filed' : 'Pend'}
                          </button>
                          <button onClick={() => toggleStatus(client.id, 'r3b')} className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase border transition-all ${r3bStatus === 'Filed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : r3bStatus === 'Challan' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-white text-slate-400 border-slate-200'}`}>
                            3B: {r3bStatus}
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100">
                      <div className="text-[9px] text-slate-400 font-medium">Click Actions Menu →</div>
                      <div className="flex items-center gap-1">
                        <GSTViewIcon client={client} onDataChange={handleRefreshClients} />
                        <button onClick={(e) => openActionsMenu(e, client)} className="h-7 w-7 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 flex items-center justify-center shadow-2xs">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="overflow-auto no-scrollbar flex-1 w-full relative h-full">
            <table className={`w-full text-left border-collapse table-fixed min-w-full monthly-returns-table ${isAllMonthsMode ? 'min-w-[1475px]' : ''}`}>
            <thead className="sticky top-0 z-30 bg-slate-100">
              <tr className="bg-slate-50 border-b border-slate-200 shadow-sm">
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 text-[var(--app-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 w-[50px] text-center">S.No.</th>
                <th className={`sticky top-0 z-30 bg-slate-100 px-3 py-1.5 text-[var(--app-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 ${isAllMonthsMode ? 'w-[180px]' : 'w-[22%]'} min-w-[150px]`}>Trade Name</th>
                <th className={`sticky top-0 z-30 bg-slate-100 px-3 py-1.5 text-[var(--app-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 ${isAllMonthsMode ? 'w-[110px]' : 'w-[11%]'}`}>Mobile No.</th>
                <th className={`sticky top-0 z-30 bg-slate-100 px-3 py-1.5 text-[var(--app-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 ${isAllMonthsMode ? 'w-[145px]' : 'w-[14%]'}`}>GSTIN</th>
                
                {isAllMonthsMode ? (
                  FY_MONTHS.map(m => (
                    <th key={m} className="sticky top-0 z-30 bg-slate-100 px-1 py-1 text-[var(--app-font-size)] font-black uppercase tracking-tight text-slate-800 border-b border-slate-200 text-center w-[75px] min-w-[75px]">
                      <div className="flex items-center justify-center gap-0.5">
                        <TableFilter 
                          label={SHORT_MONTH_MAP[m] || m.slice(0, 3)} 
                          isActive={!!monthFilters[m] && monthFilters[m] !== 'All'}
                        >
                          {['All', 'R1 Filed', 'R1 Pending', '3B Filed', '3B Challan', '3B Pending'].map(f => (
                            <button 
                              key={f} 
                              onClick={() => setMonthFilters(prev => ({ ...prev, [m]: f }))} 
                              className={`w-full text-left px-2.5 py-1.5 text-[var(--app-font-size)] font-black uppercase rounded-lg ${(monthFilters[m] || 'All') === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-700'}`}
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
                    <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 text-[var(--app-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 text-center w-[10%] min-w-[90px]">
                       <div className="flex justify-center flex-col items-center">
                         <TableFilter label="GSTR-1" isActive={r1Filter !== 'All'}>
                           {['All', 'Filed', 'Pending'].map(f => <button key={f} onClick={() => setR1Filter(f as any)} className="w-full text-left px-3 py-2 text-[var(--app-font-size)] font-black uppercase rounded-lg hover:bg-slate-50 text-slate-600">{f}</button>)}
                         </TableFilter>
                       </div>
                    </th>
                    <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 text-[var(--app-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 text-center w-[11%] min-w-[100px]">
                       <div className="flex justify-center flex-col items-center">
                         <TableFilter label="GSTR-3B" isActive={r3bFilter !== 'All'}>
                           {['All', 'Filed', 'Challan', 'Pending'].map(f => <button key={f} onClick={() => setR3bFilter(f as any)} className="w-full text-left px-3 py-2 text-[var(--app-font-size)] font-black uppercase rounded-lg hover:bg-slate-50 text-slate-600">{f}</button>)}
                         </TableFilter>
                       </div>
                    </th>
                    <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 text-[var(--app-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 w-[11%] min-w-[110px]">User ID</th>
                    <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 text-[var(--app-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 w-[11%] min-w-[110px]">Password</th>
                    <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 text-[var(--app-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 w-[10%] min-w-[120px]">Remark</th>
                  </>
                )}

                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 text-[var(--app-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 text-right w-[90px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groupedClients.map(({ sector, clients: sectorClients }) => (
              <React.Fragment key={sector}>
                <tr>
                  <td colSpan={isAllMonthsMode ? 17 : 10} className="sticky top-[27px] z-20 bg-slate-200/95 backdrop-blur-md font-bold text-slate-800 py-0.5 px-3 uppercase text-[10px] tracking-widest border-y border-slate-300 shadow-xs">{sector} ({sectorClients.length})</td>
                </tr>
                {sectorClients.map((client, idx) => {
                const st = getStatus(client.id);
                const r3bStatus = getStatusLabel(st.r3b);
                const isEditingPass = editingPasswordId === client.id;
                const theme = getClientColorTheme(client);
                return (
                  <tr key={client.id} className={`transition-all border-b border-slate-100 animate-in fade-in slide-in-from-bottom-1 duration-150 ${theme.rowClass}`}>
                    <td className="px-3 py-1.5 font-black text-indigo-400 font-mono text-[var(--app-font-size)] w-[50px] text-center truncate">{(idx + 1).toString().padStart(2, '0')}</td>
                    <td className={`px-3 py-1.5 truncate ${isAllMonthsMode ? 'w-[180px]' : 'w-[22%]'} min-w-[150px]`} title={client.tradeName}>
                      <div className={`truncate leading-tight font-semibold text-[var(--app-font-size)] ${theme.tradeNameClass}`}>{client.tradeName || '---'}</div>
                      <p className="legal-subtitle truncate leading-normal" title={client.legalName}>{client.legalName || '---'}</p>
                    </td>
    
                    <td className={`px-3 py-1.5 font-bold text-slate-600 text-[var(--app-font-size)] truncate ${isAllMonthsMode ? 'w-[110px]' : 'w-[11%]'}`}>{client.mobile || '---'}</td>
                    <td className={`px-3 py-1.5 ${isAllMonthsMode ? 'w-[145px]' : 'w-[14%]'}`}>
                      <div className="flex items-center gap-1.5 group/gstin">
                        <span className={`truncate font-semibold tracking-wider font-mono text-[var(--app-font-size)] uppercase ${theme.gstinClass}`}>{client.gstProfile?.gstin}</span>
                        {client.gstProfile?.gstin && (
                          <button onClick={() => (navigator.clipboard.writeText(client.gstProfile?.gstin || '').then(() => { toast.success('GSTIN Copied!'); window.open('https://services.gst.gov.in/services/searchtp', '_blank'); }))} className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0" title="Search Taxpayer">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          </button>
                        )}
                      </div>
                    </td>

                    {isAllMonthsMode ? (
                      FY_MONTHS.map(m => {
                        const periodKey = `${selectedYear}_${m}`;
                        const monthSt = getStatus(client.id, periodKey);
                        const monthR3b = getStatusLabel(monthSt.r3b);
                        return (
                          <td key={m} className="px-1 py-1 text-center border-x border-slate-100/60 align-middle w-[75px] min-w-[75px]">
                            <div className="flex flex-col items-center gap-0.5 justify-center">
                              <button
                                type="button"
                                onClick={() => toggleStatus(client.id, 'r1', periodKey)}
                                className={`w-full px-1 py-0.5 rounded text-[10px] font-black uppercase border flex items-center justify-between transition-all ${
                                  monthSt.r1 ? 'bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-200'
                                }`}
                                title={`GSTR-1 (${m}): Click to toggle`}
                              >
                                <span className="text-[9px] font-bold text-slate-400">R1</span>
                                <span>{monthSt.r1 ? 'Filed' : 'Pend'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleStatus(client.id, 'r3b', periodKey)}
                                className={`w-full px-1 py-0.5 rounded text-[10px] font-black uppercase border flex items-center justify-between transition-all ${
                                  monthR3b === 'Filed' 
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200' 
                                    : monthR3b === 'Challan' 
                                      ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200' 
                                      : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-200'
                                }`}
                                title={`GSTR-3B (${m}): Click to cycle (Pending → Challan → Filed)`}
                              >
                                <span className="text-[9px] font-bold text-slate-400">3B</span>
                                <span>{monthR3b === 'Filed' ? 'Filed' : monthR3b === 'Challan' ? 'Chal' : 'Pend'}</span>
                              </button>
                            </div>
                          </td>
                        );
                      })
                    ) : (
                      <>
                        <td className="px-3 py-1.5 text-center w-[10%] min-w-[90px]">
                           <button onClick={() => toggleStatus(client.id, 'r1')} className={`px-2.5 py-0.5 rounded-full text-[var(--app-font-size)] font-black uppercase border flex items-center justify-center gap-1 mx-auto ${st.r1 ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                              {st.r1 ? 'Filed' : 'Pending'}
                              <svg className="h-2.5 w-2.5 opacity-40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                           </button>
                        </td>
                        <td className="px-3 py-1.5 text-center w-[11%] min-w-[100px]">
                           <button onClick={() => toggleStatus(client.id, 'r3b')} className={`px-2.5 py-0.5 rounded-full text-[var(--app-font-size)] font-black uppercase border flex items-center justify-center gap-1 mx-auto transition-all ${
                              r3bStatus === 'Filed' 
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200' 
                                : r3bStatus === 'Challan' 
                                  ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200' 
                                  : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                           }`} title="Click to cycle: Pending → Challan → Filed">
                              {r3bStatus}
                              <svg className="h-2.5 w-2.5 opacity-40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                           </button>
                        </td>
                        <td className="px-3 py-1.5 font-semibold text-slate-700 text-[var(--app-font-size)] truncate w-[11%] min-w-[110px]">{client.gstProfile?.username || '---'}</td>
                        <td className="px-3 py-1.5 w-[11%] min-w-[110px]">
                           <div className="flex items-center gap-2 group/pass">
                              {isEditingPass ? (
                                <input autoFocus value={newPassVal} onChange={e => setNewPassVal(e.target.value)} onBlur={handleUpdatePassword} onKeyDown={e => e.key === 'Enter' && handleUpdatePassword()} className="bg-white border border-indigo-200 rounded px-2 h-7 text-[var(--app-font-size)] font-semibold w-24 outline-none" />
                              ) : (
                                <>
                                   <span className="font-semibold text-indigo-500 text-[var(--app-font-size)] truncate">{client.gstProfile?.password || '---'}</span>
                                   <button onClick={() => { setSelectedClient(client); setEditingPasswordId(client.id); setNewPassVal(client.gstProfile?.password || ''); }} className="p-1 text-slate-300 hover:text-amber-500 opacity-0 group-hover/pass:opacity-100 transition-all shrink-0"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
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
                        <td className="px-3 py-1.5 truncate max-w-[150px] w-[10%] min-w-[120px]">
                           <EditableRemark value={st?.remark || status?.remark || getStatus?.(client.id)?.remark || ''} onSave={val => updateRemark(client.id, val)} />
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

      {/* Floating Action Menu */}
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

      {/* FULL CLIENT DETAIL VIEW MODAL removed - replaced by GSTViewIcon */}

      {/* Profile Detail Dossier Modal removed - replaced by GSTDetailModal */}
    </div>
  );
};

export default MonthlyFiling;
