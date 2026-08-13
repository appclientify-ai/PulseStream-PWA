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
import { useMonthlyFilingLogic, MONTHS, YEARS, getDefaultPeriod, isClientVisibleInPeriod, isClientVisibleInFY, periodToDate, getStatusLabel } from './filinglogic/MonthlyFilingLogic';
import { ViewControl } from '../../../components/ViewControl';

const QUARTERLY_PERIOD_OPTIONS = [
  'All Quarters',
  'April-June (Q1)',
  'July-September (Q2)',
  'October-December (Q3)',
  'January-March (Q4)'
];

const QUARTER_CONFIGS = [
  {
    key: 'Q1',
    label: 'Q1 (Apr-Jun)',
    months: [
      { name: 'April', short: 'Apr', type: 'IFF' },
      { name: 'May', short: 'May', type: 'IFF' },
      { name: 'June', short: 'Jun', type: 'GSTR-1' },
    ],
    r3bMonth: 'June',
  },
  {
    key: 'Q2',
    label: 'Q2 (Jul-Sep)',
    months: [
      { name: 'July', short: 'Jul', type: 'IFF' },
      { name: 'August', short: 'Aug', type: 'IFF' },
      { name: 'September', short: 'Sep', type: 'GSTR-1' },
    ],
    r3bMonth: 'September',
  },
  {
    key: 'Q3',
    label: 'Q3 (Oct-Dec)',
    months: [
      { name: 'October', short: 'Oct', type: 'IFF' },
      { name: 'November', short: 'Nov', type: 'IFF' },
      { name: 'December', short: 'Dec', type: 'GSTR-1' },
    ],
    r3bMonth: 'December',
  },
  {
    key: 'Q4',
    label: 'Q4 (Jan-Mar)',
    months: [
      { name: 'January', short: 'Jan', type: 'IFF' },
      { name: 'February', short: 'Feb', type: 'IFF' },
      { name: 'March', short: 'Mar', type: 'GSTR-1' },
    ],
    r3bMonth: 'March',
  },
];
import { EditableRemark } from '../../../components/EditableRemark';
import { toast } from 'sonner';
import { useGlobalDueDates } from '../../../hooks/useGlobalDueDates';
import { formatISOToDDMMYYYY } from '../../../dateUtils';

const QuarterlyFiling: React.FC = () => {
  const defaultPeriod = getDefaultPeriod();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [r1Filter, setR1Filter] = useState<'All' | 'Filed' | 'Pending'>('All');
  const [r3bFilter, setR3bFilter] = useState<'All' | 'Filed' | 'Challan' | 'Pending'>('All');
  const [quickFilter, setQuickFilter] = useState<'All' | 'R1Filed' | '3BFiled' | '3BChallan' | 'Pending'>('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [authorityFilter, setAuthorityFilter] = useState<'All' | 'State' | 'Center'>('All');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [quarterFilters, setQuarterFilters] = useState<Record<string, string>>({});
  const [isR1FilterOpen, setIsR1FilterOpen] = useState(false);
  const [isR3bFilterOpen, setIsR3bFilterOpen] = useState(false);
  const getDefaultQuarterOption = () => {
    const m = defaultPeriod.month;
    if (['April', 'May', 'June'].includes(m)) return 'April-June (Q1)';
    if (['July', 'August', 'September'].includes(m)) return 'July-September (Q2)';
    if (['October', 'November', 'December'].includes(m)) return 'October-December (Q3)';
    return 'January-March (Q4)';
  };

  const [selectedYear, setSelectedYear] = useState(defaultPeriod.year);
  const [selectedMonth, setSelectedMonth] = useState(getDefaultQuarterOption());
  const [compactMode, setCompactMode] = useState(true);
  
  const currentQuarter = useMemo(() => {
    if (selectedMonth === 'All Quarters') return 'April-June (Q1)';
    return selectedMonth;
  }, [selectedMonth]);

  const { getGlobalDueDate } = useGlobalDueDates(selectedYear);
  const iffDueDate = getGlobalDueDate('quarterly_iff', currentQuarter);
  const q3bDueDate = getGlobalDueDate('quarterly_r3b', currentQuarter);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [newPassVal, setNewPassVal] = useState('');

  const [activeActionsId, setActiveActionsId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const actionsRef = useRef<HTMLDivElement>(null);

  const { data: pageData, isLoading: isPageLoading } = useModuleData('quarterly_filing_page_data');

  const clients = useMemo(() => pageData?.clients || [], [pageData]);
  const allClientsBase = clients;

  const { getStatus, toggleStatus, updateRemark } = useMonthlyFilingLogic(
    selectedYear, 
    selectedMonth, 
    'clientify_quarterly_filing_v3', 
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

  const isAllQuartersMode = selectedMonth === 'All Quarters';

  const activeQuarterConfig = useMemo(() => {
    return QUARTER_CONFIGS.find(q => q.label === selectedMonth || selectedMonth.includes(q.key)) || QUARTER_CONFIGS[0];
  }, [selectedMonth]);

  const isQuarterEnd = true;

  const checkQrmpVisibility = useCallback((c: Client) => {
    if (!c || !c.gstProfile) return false;
    if (isAllQuartersMode) {
      return isClientVisibleInFY(c, selectedYear);
    }
    const targetMonth = activeQuarterConfig ? activeQuarterConfig.r3bMonth : 'June';
    return isClientVisibleInPeriod(c, selectedYear, targetMonth);
  }, [isAllQuartersMode, selectedYear, activeQuarterConfig]);

  const baseClients = useMemo(() => {
    const s = search.toLowerCase();
    let list = clients.filter(c => 
      checkQrmpVisibility(c) &&
      ((c.legalName || '').toLowerCase().includes(s) || 
       (c.tradeName || '').toLowerCase().includes(s) ||
       (c.gstProfile?.gstin || '').toLowerCase().includes(s))
    );

    if (isAllQuartersMode) {
      if (r1Filter === 'Filed') {
        list = list.filter(c => QUARTER_CONFIGS.every(q => q.months.every(m => getStatus(c.id, `${selectedYear}_${m.name}`).r1)));
      } else if (r1Filter === 'Pending') {
        list = list.filter(c => QUARTER_CONFIGS.some(q => q.months.some(m => !getStatus(c.id, `${selectedYear}_${m.name}`).r1)));
      }

      if (r3bFilter === 'Filed') {
        list = list.filter(c => QUARTER_CONFIGS.every(q => getStatusLabel(getStatus(c.id, `${selectedYear}_${q.r3bMonth}`).r3b) === 'Filed'));
      } else if (r3bFilter === 'Challan') {
        list = list.filter(c => QUARTER_CONFIGS.some(q => getStatusLabel(getStatus(c.id, `${selectedYear}_${q.r3bMonth}`).r3b) === 'Challan'));
      } else if (r3bFilter === 'Pending') {
        list = list.filter(c => QUARTER_CONFIGS.some(q => getStatusLabel(getStatus(c.id, `${selectedYear}_${q.r3bMonth}`).r3b) === 'Pending'));
      }

      QUARTER_CONFIGS.forEach(qConfig => {
        const filter = quarterFilters[qConfig.key];
        if (!filter || filter === 'All') return;
        if (filter === '3B Filed') {
          list = list.filter(c => getStatusLabel(getStatus(c.id, `${selectedYear}_${qConfig.r3bMonth}`).r3b) === 'Filed');
        } else if (filter === '3B Challan') {
          list = list.filter(c => getStatusLabel(getStatus(c.id, `${selectedYear}_${qConfig.r3bMonth}`).r3b) === 'Challan');
        } else if (filter === '3B Pending') {
          list = list.filter(c => getStatusLabel(getStatus(c.id, `${selectedYear}_${qConfig.r3bMonth}`).r3b) === 'Pending');
        } else if (filter === 'R1 Filed') {
          list = list.filter(c => qConfig.months.every(m => getStatus(c.id, `${selectedYear}_${m.name}`).r1));
        } else if (filter === 'R1 Pending') {
          list = list.filter(c => qConfig.months.some(m => !getStatus(c.id, `${selectedYear}_${m.name}`).r1));
        }
      });
    } else {
      if (r1Filter === 'Filed') {
        list = list.filter(c => activeQuarterConfig.months.every(m => getStatus(c.id, `${selectedYear}_${m.name}`).r1));
      } else if (r1Filter === 'Pending') {
        list = list.filter(c => activeQuarterConfig.months.some(m => !getStatus(c.id, `${selectedYear}_${m.name}`).r1));
      }

      if (r3bFilter === 'Filed') {
        list = list.filter(c => getStatusLabel(getStatus(c.id, `${selectedYear}_${activeQuarterConfig.r3bMonth}`).r3b) === 'Filed');
      } else if (r3bFilter === 'Challan') {
        list = list.filter(c => getStatusLabel(getStatus(c.id, `${selectedYear}_${activeQuarterConfig.r3bMonth}`).r3b) === 'Challan');
      } else if (r3bFilter === 'Pending') {
        list = list.filter(c => getStatusLabel(getStatus(c.id, `${selectedYear}_${activeQuarterConfig.r3bMonth}`).r3b) === 'Pending');
      }
    }

    list = filterClientsBySectorJurisdiction(list, authorityFilter, selectedSectors);
    return list;
  }, [clients, search, selectedYear, selectedMonth, r1Filter, r3bFilter, authorityFilter, selectedSectors, quarterFilters, getStatus, checkQrmpVisibility, isAllQuartersMode, activeQuarterConfig]);

  const stats = useMemo(() => {
    const total = baseClients.length;
    if (isAllQuartersMode) return { total, r1: 0, r3b: 0, r3bChallan: 0, pending: 0 };
    const r1 = baseClients.filter(c => getStatus(c.id).r1).length;
    const r3bFiled = baseClients.filter(c => getStatusLabel(getStatus(c.id).r3b) === 'Filed').length;
    const r3bChallan = baseClients.filter(c => getStatusLabel(getStatus(c.id).r3b) === 'Challan').length;
    const pending = baseClients.filter(c => !getStatus(c.id).r1 || getStatusLabel(getStatus(c.id).r3b) === 'Pending').length;
    return { total, r1, r3b: r3bFiled, r3bChallan, pending };
  }, [baseClients, getStatus, isAllQuartersMode]);

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
    if (isAllQuartersMode) {
      const headers = ['S.No.', 'Trade Name', 'Legal Name', 'Mobile No.', 'GSTIN', ...QUARTER_CONFIGS.map(q => `${q.key} Status`), 'User ID', 'Password'];
      const rows = filteredClients.map((client, index) => [
        (index + 1).toString().padStart(2, '0'),
        client.tradeName,
        client.legalName,
        client.mobile,
        client.gstProfile?.gstin,
        ...QUARTER_CONFIGS.map(q => {
          const m1 = getStatus(client.id, `${selectedYear}_${q.months[0].name}`).r1 ? 'F' : 'P';
          const m2 = getStatus(client.id, `${selectedYear}_${q.months[1].name}`).r1 ? 'F' : 'P';
          const m3 = getStatus(client.id, `${selectedYear}_${q.months[2].name}`).r1 ? 'F' : 'P';
          const b3 = getStatusLabel(getStatus(client.id, `${selectedYear}_${q.r3bMonth}`).r3b);
          return `IFF1:${m1}, IFF2:${m2}, R1:${m3}, 3B:${b3}`;
        }),
        client.gstProfile?.username,
        client.gstProfile?.password
      ]);
      exportToCSV(headers, rows, `Quarterly_Filing_AllQuarters_${selectedYear}.csv`);
    } else {
      const headers = ['S.No.', 'Trade Name', 'Mobile No.', 'GSTIN', 'IFF/R1 Status', 'GSTR-3B Status', 'User ID', 'Password', 'Remark'];
      const rows = filteredClients.map((client, index) => [
        (index + 1).toString().padStart(2, '0'),
        client.tradeName,
        client.mobile,
        client.gstProfile?.gstin,
        getStatus(client.id).r1 ? 'Filed' : 'Pending',
        isQuarterEnd ? getStatusLabel(getStatus(client.id).r3b) : 'N/A',
        client.gstProfile?.username,
        client.gstProfile?.password
      ]);
      exportToCSV(headers, rows, `Quarterly_Filing_${selectedMonth}_${selectedYear}.csv`);
    }
  };

  const handlePrint = () => {
    if (isAllQuartersMode) {
      const headers = ['S.No.', 'Trade Name', 'Mobile No.', 'GSTIN', ...QUARTER_CONFIGS.map(q => q.key), 'User ID'];
      const rows = filteredClients.map((client, index) => [
        (index + 1).toString().padStart(2, '0'),
        client.tradeName,
        client.mobile,
        client.gstProfile?.gstin,
        ...QUARTER_CONFIGS.map(q => {
          const m1 = getStatus(client.id, `${selectedYear}_${q.months[0].name}`).r1 ? 'F' : 'P';
          const m2 = getStatus(client.id, `${selectedYear}_${q.months[1].name}`).r1 ? 'F' : 'P';
          const m3 = getStatus(client.id, `${selectedYear}_${q.months[2].name}`).r1 ? 'F' : 'P';
          return `I1:${m1} I2:${m2} R1:${m3}`;
        }),
        client.gstProfile?.username
      ]);
      printList(`Quarterly Filing All Quarters - ${selectedYear}`, headers, rows);
    } else {
      const headers = ['S.No.', 'Trade Name', 'Mobile No.', 'GSTIN', 'IFF/R1 Status', 'GSTR-3B Status', 'User ID', 'Password', 'Remark'];
      const rows = filteredClients.map((client, index) => [
        (index + 1).toString().padStart(2, '0'),
        client.tradeName,
        client.mobile,
        client.gstProfile?.gstin,
        getStatus(client.id).r1 ? 'Filed' : 'Pending',
        isQuarterEnd ? getStatusLabel(getStatus(client.id).r3b) : 'N/A',
        client.gstProfile?.username,
        client.gstProfile?.password
      ]);
      printList(`Quarterly Filing - ${selectedMonth} ${selectedYear}`, headers, rows);
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
                  onClick={() => setQuickFilter('R1Filed')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 border ${
                    quickFilter === 'R1Filed' 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                      : 'bg-indigo-50/70 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  <span>IFF/R1 Filed</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-black ${
                    quickFilter === 'R1Filed' ? 'bg-indigo-500 text-white' : 'bg-indigo-200 text-indigo-900'
                  }`}>{stats.r1}</span>
                </button>

                {isQuarterEnd && (
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
                )}

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

        {/* Controls: View Control, Filter, Year/Month, Print, Export */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-between lg:justify-end">
          <ViewControl 
            viewMode={viewMode} 
            onViewChange={setViewMode} 
            compactMode={compactMode} 
            onCompactToggle={() => setCompactMode(!compactMode)} 
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
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 h-8 text-[11px] font-black uppercase text-slate-700 outline-none">{QUARTERLY_PERIOD_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}</select>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {viewMode === 'grid' ? (
          <div className="p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredClients.map((client, idx) => {
              const statusInfo = getStatus(client.id);
              const r1Done = statusInfo.r1;
              const r3bLabel = getStatusLabel(statusInfo.r3b);
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
                    <span className={`px-2 py-0.5 rounded-md font-black uppercase ${r1Done ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'}`}>
                      IFF: {r1Done ? 'Filed' : 'Pending'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-black uppercase ${
                      r3bLabel === 'Filed' ? 'bg-emerald-100 text-emerald-800' : r3bLabel === 'Challan' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      3B: {r3bLabel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <span className="text-[9px] font-black uppercase text-slate-400">{client.gstProfile?.regType || 'QRMP'}</span>
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
          <table className={`w-full text-left border-collapse table-auto min-w-full compact-table ${compactMode ? 'compact-mode' : ''}`}>
            <thead className="sticky top-0 z-30 bg-slate-100">
              <tr className="bg-slate-50 border-b border-slate-200 shadow-sm">
                <th className="sticky top-0 z-30 bg-slate-100 px-[5.5px] py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200">S.No.</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-[5.5px] py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200 min-w-[150px]">Trade Name</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-[5.5px] py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200 min-w-[110px]">Mobile No.</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-[5.5px] py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200 min-w-[140px]">GSTIN</th>

                {isAllQuartersMode ? (
                  QUARTER_CONFIGS.map(q => (
                    <th key={q.key} className="sticky top-0 z-30 bg-slate-100 px-1 py-2 text-[10px] font-black uppercase text-slate-800 border-b border-slate-200 text-center min-w-[125px]">
                      <div className="flex items-center justify-center gap-0.5">
                        <TableFilter 
                          label={q.label} 
                          isActive={!!quarterFilters[q.key] && quarterFilters[q.key] !== 'All'}
                        >
                          {['All', '3B Filed', '3B Challan', '3B Pending', 'R1 Filed', 'R1 Pending'].map(f => (
                            <button 
                              key={f} 
                              onClick={() => setQuarterFilters(prev => ({ ...prev, [q.key]: f }))} 
                              className={`w-full text-left px-2.5 py-1.5 text-[10px] font-black uppercase rounded-lg ${
                                (quarterFilters[q.key] || 'All') === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              {f === 'R1 Filed' ? 'All IFF/R1 Filed' : f === 'R1 Pending' ? 'Any IFF/R1 Pend' : f}
                            </button>
                          ))}
                        </TableFilter>
                      </div>
                    </th>
                  ))
                ) : (
                  <>
                    <th className="sticky top-0 z-30 bg-slate-100 px-[5.5px] py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200 text-center min-w-[180px]">
                       <div className="flex justify-center flex-col items-center">
                         <TableFilter label="IFF/R1 (Months)" isActive={r1Filter !== 'All'}>
                           {['All', 'Filed', 'Pending'].map(f => <button key={f} onClick={() => setR1Filter(f as any)} className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase rounded-lg ${r1Filter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{f}</button>)}
                         </TableFilter>
                       </div>
                    </th>
                    <th className="sticky top-0 z-30 bg-slate-100 px-[5.5px] py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200 text-center">
                       <div className="flex justify-center flex-col items-center">
                         <TableFilter label="GSTR-3B" isActive={r3bFilter !== 'All'}>
                           {['All', 'Filed', 'Challan', 'Pending'].map(f => <button key={f} onClick={() => setR3bFilter(f as any)} className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase rounded-lg ${r3bFilter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{f}</button>)}
                         </TableFilter>
                       </div>
                    </th>
                    <th className="sticky top-0 z-30 bg-slate-100 px-[5.5px] py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200">User ID</th>
                    <th className="sticky top-0 z-30 bg-slate-100 px-[5.5px] py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200">Password</th>
                    <th className="sticky top-0 z-30 bg-slate-100 px-[5.5px] py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200">Remark</th>
                  </>
                )}

                <th className="sticky top-0 z-30 bg-slate-100 px-[5.5px] py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groupedClients.map(({ sector, clients: sectorClients }) => (
                <React.Fragment key={sector}>
                <tr>
                  <td colSpan={isAllQuartersMode ? 10 : 10} className="sticky top-[27px] z-20 bg-slate-200/95 backdrop-blur-md font-bold text-slate-800 py-0.5 px-2 uppercase text-[9px] tracking-widest border-y border-slate-300 shadow-xs">{sector} ({sectorClients.length})</td>
                </tr>
                {sectorClients.map((client, idx) => {
              const st = getStatus(client.id);
              const r3bStatus = getStatusLabel(st.r3b);
              const isEditingPass = editingPasswordId === client.id;
              const theme = getClientColorTheme(client);
              return (
                <tr key={client.id} className={`transition-all border-b border-slate-100 last:border-0 animate-in fade-in slide-in-from-bottom-1 duration-150 ${isAllQuartersMode ? 'h-[44px]' : 'h-[30px]'} ${theme.rowClass}`}>
                  <td className="px-2 py-[1px] font-black text-indigo-400 font-mono text-[11px] truncate">{(idx + 1).toString().padStart(2, '0')}</td>
                  <td className="px-2 py-[1px] truncate max-w-[200px]" title={client.tradeName}>
                    <div className={`truncate leading-tight text-[11.5px] ${theme.tradeNameClass}`}>{client.tradeName || '---'}</div>
                    <div className={`text-[9px] truncate leading-tight ${theme.legalNameClass}`} title={client.legalName}>{client.legalName || '---'}</div>
                  </td>
  
                  <td className="px-2 py-[1px] font-black text-slate-500 text-[11px] truncate">{client.mobile || '---'}</td>
                    <td className=" px-4 py-[2px]">
                      <div className="flex items-center gap-2">
                        <span className={`truncate ${theme.gstinClass}`}>{client.gstProfile?.gstin}</span>
                        {client.gstProfile?.gstin && (
                          <button onClick={() => (navigator.clipboard.writeText(client.gstProfile?.gstin || '').then(() => { toast.success('GSTIN Copied!'); window.open('https://services.gst.gov.in/services/searchtp', '_blank'); }))} className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0" title="Search Taxpayer">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          </button>
                        )}
                      </div>
                    </td>

                    {isAllQuartersMode ? (
                      QUARTER_CONFIGS.map(qConfig => (
                        <td key={qConfig.key} className="px-1 py-1 text-center border-x border-slate-100/80 align-middle">
                          <div className="flex flex-col gap-0.5 text-[9px]">
                            <div className="grid grid-cols-3 gap-0.5">
                              {qConfig.months.map(m => {
                                const mPeriod = `${selectedYear}_${m.name}`;
                                const mSt = getStatus(client.id, mPeriod);
                                return (
                                  <button
                                    key={m.name}
                                    type="button"
                                    onClick={() => toggleStatus(client.id, 'r1', mPeriod)}
                                    className={`px-0.5 py-0.5 rounded text-[8px] font-black uppercase border text-center transition-all ${
                                      mSt.r1
                                        ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                        : 'bg-slate-50 text-slate-400 border-slate-200'
                                    }`}
                                    title={`${m.name}: ${mSt.r1 ? 'Filed' : 'Pending'}`}
                                  >
                                    {m.short}
                                  </button>
                                );
                              })}
                            </div>
                            {(() => {
                              const r3bPeriod = `${selectedYear}_${qConfig.r3bMonth}`;
                              const st3B = getStatus(client.id, r3bPeriod);
                              const label3B = getStatusLabel(st3B.r3b);
                              return (
                                <button
                                  type="button"
                                  onClick={() => toggleStatus(client.id, 'r3b', r3bPeriod)}
                                  className={`w-full px-1 py-0.5 rounded text-[8px] font-black uppercase border flex items-center justify-between gap-0.5 transition-all ${
                                    label3B === 'Filed'
                                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                      : label3B === 'Challan'
                                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                                      : 'bg-slate-50 text-slate-400 border-slate-200'
                                  }`}
                                  title={`Toggle ${qConfig.key} GSTR-3B`}
                                >
                                  <span className="text-[7px] text-slate-400">3B</span>
                                  <span>{label3B === 'Filed' ? 'Filed' : label3B === 'Challan' ? 'Chal' : 'Pend'}</span>
                                </button>
                              );
                            })()}
                          </div>
                        </td>
                      ))
                    ) : (
                      <>
                        <td className=" px-4 py-[2px] text-center">
                          {activeQuarterConfig ? (
                            <div className="flex flex-col gap-1 items-center justify-center">
                              <div className="flex items-center gap-1 justify-center flex-wrap">
                                {activeQuarterConfig.months.map(m => {
                                  const mPeriod = `${selectedYear}_${m.name}`;
                                  const mSt = getStatus(client.id, mPeriod);
                                  return (
                                    <button
                                      key={m.name}
                                      onClick={() => toggleStatus(client.id, 'r1', mPeriod)}
                                      className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border flex items-center gap-1 transition-all ${
                                        mSt.r1 ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                                      }`}
                                      title={`${m.name} (${m.type}): ${mSt.r1 ? 'Filed' : 'Pending'}`}
                                    >
                                      <span>{m.short} {m.type}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => toggleStatus(client.id, 'r1')} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border flex items-center justify-center gap-1 mx-auto ${st.r1 ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-400'}`}>
                               {st.r1 ? 'Filed' : 'Pending'}
                               <svg className="h-2.5 w-2.5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                          )}
                        </td>
                        <td className=" px-4 py-[2px] text-center">
                           {activeQuarterConfig ? (
                             (() => {
                               const r3bPeriod = `${selectedYear}_${activeQuarterConfig.r3bMonth}`;
                               const st3B = getStatus(client.id, r3bPeriod);
                               const label3B = getStatusLabel(st3B.r3b);
                               return (
                                 <button onClick={() => toggleStatus(client.id, 'r3b', r3bPeriod)} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border flex items-center justify-center gap-1 mx-auto transition-all ${
                                    label3B === 'Filed' 
                                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200' 
                                      : label3B === 'Challan' 
                                        ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200' 
                                        : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                                 }`} title={`Click to cycle ${activeQuarterConfig.key} 3B`}>
                                    {label3B}
                                    <svg className="h-2.5 w-2.5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                 </button>
                               );
                             })()
                           ) : isQuarterEnd ? (
                             <button onClick={() => toggleStatus(client.id, 'r3b')} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border flex items-center justify-center gap-1 mx-auto transition-all ${
                                r3bStatus === 'Filed' 
                                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200' 
                                  : r3bStatus === 'Challan' 
                                    ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200' 
                                    : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                             }`} title="Click to cycle: Pending → Challan → Filed">
                                {r3bStatus}
                                <svg className="h-2.5 w-2.5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                             </button>
                           ) : <span className="text-[10px] font-black text-slate-300">N/A</span>}
                        </td>
                        <td className=" px-4 py-[2px] font-black text-slate-700 text-[12px] truncate">{client.gstProfile?.username}</td>
                        <td className=" px-4 py-[2px]">
                           <div className="flex items-center gap-2 group/pass">
                              {isEditingPass ? (
                                <input autoFocus value={newPassVal} onChange={e => setNewPassVal(e.target.value)} onBlur={handleUpdatePassword} onKeyDown={e => e.key === 'Enter' && handleUpdatePassword()} className="bg-white border border-indigo-200 rounded px-2 h-7 text-[11px] font-black w-24 outline-none" />
                              ) : (
                                <>
                                   <span className="font-black text-indigo-400 text-[12px] truncate">{client.gstProfile?.password}</span>
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
                        <td className=" px-4 py-[2px] truncate max-w-[150px]">
                           <EditableRemark value={st?.remark || status?.remark || getStatus?.(client.id)?.remark || ''} onSave={val => updateRemark(client.id, val)} />
                         </td>
                      </>
                    )}
                     <td className=" px-4 py-[2px] text-right">
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

      {/* Dossier Modal removed - replaced by GSTDetailModal */}
    </div>
  );
};

export default QuarterlyFiling;
