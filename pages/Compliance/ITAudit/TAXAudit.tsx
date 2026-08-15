import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useModuleData } from '../../../hooks/useModuleData.ts';
import { Client } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';
import { useTaxAuditLogic, BSStatus } from './TAXAuditlogic';
import { EditableRemark } from '../../../components/EditableRemark';
import { YEARS } from '../GSTReturn/filinglogic/MonthlyFilingLogic';
import GSTViewIcon from '../../../components/GSTViewIcon';
import ITViewIcon from '../../../components/ITViewIcon';
import { TableFilter } from '../../../components/TableFilter';
import { useGlobalDueDates } from '../../../hooks/useGlobalDueDates';
import { formatISOToDDMMYYYY } from '../../../dateUtils';
import { ViewControl } from '../../../components/ViewControl';
import { toast } from 'sonner';

const TAXAudit: React.FC = () => {
  const queryClient = useQueryClient();
  const getPreviousFY = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const startYear = currentMonth >= 3 ? currentYear - 1 : currentYear - 2;
    return `${startYear}-${(startYear + 1).toString().slice(-2)}`;
  };

  const { data: pageData, isLoading: isPageLoading } = useModuleData('tax_audit_filing_page_data');

  const allClients = useMemo(() => pageData?.clients || [], [pageData]);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState(getPreviousFY());
  
  const { getGlobalDueDate, updateGlobalDueDate } = useGlobalDueDates(selectedYear);
  const auditTaxDueDate = getGlobalDueDate('audit_tax', 'Annual');
  
  const [bsFilter, setBsFilter] = useState<'All' | BSStatus>('All');
  const [auditFilter, setAuditFilter] = useState<'All' | 'Filed' | 'Pending'>('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [pendingClientForAdd, setPendingClientForAdd] = useState<Client | null>(null);
  const [newCaName, setNewCaName] = useState('');

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [editCaName, setEditCaName] = useState('');

  const { getStatus, toggleAuditStatus, setBSStatus, updateCaName, updateRemark, updateDueDate, getDueDate, watchlist, addToWatchlist, removeFromWatchlist } = useTaxAuditLogic(
    selectedYear,
    pageData?.watchlist,
    pageData?.filingData,
    pageData?.dueDates
  );

  const currentDueDate = auditTaxDueDate || getDueDate() || '';

  const handleDueDateChange = async (val: string) => {
    updateDueDate(val);
    await updateGlobalDueDate('audit_tax', 'Annual', val);
    toast.success('Due Date Updated Globally');
  };

  const isClientsLoading = isPageLoading && !pageData;

  const handleRefreshClients = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['tax_audit_filing_page_data'] });
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  }, [queryClient]);

  useEffect(() => {
    const syncHandler = () => handleRefreshClients();
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, [handleRefreshClients]);

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

    return allClients.filter(c => activeIds.has(c.id));
  }, [allClients, watchlist, selectedYear]);

  const filteredTracked = useMemo(() => {
    const s = search.toLowerCase();
    let list = trackedClients.filter(c => 
      (c.legalName || '').toLowerCase().includes(s) || 
      (c.tradeName || '').toLowerCase().includes(s) || 
      (c.itProfile?.pan || '').toLowerCase().includes(s) ||
      (c.gstProfile?.gstin || '').toLowerCase().includes(s)
    );

    if (bsFilter !== 'All') {
      list = list.filter(c => getStatus(c.id).bsStatus === bsFilter);
    }
    if (auditFilter !== 'All') {
      list = list.filter(c => auditFilter === 'Filed' ? getStatus(c.id).auditFiled : !getStatus(c.id).auditFiled);
    }

    return list;
  }, [trackedClients, search, bsFilter, auditFilter, getStatus]);

  const availableToAdd = useMemo(() => {
    const s = addSearch.toLowerCase();
    const selectedStartYear = parseInt(selectedYear.split('-')[0]);
    
    const alreadyTrackedIds = new Set<string>();
    Object.keys(watchlist).forEach(fy => {
      const ids = watchlist[fy] as string[];
      const fyStart = parseInt(fy.split('-')[0]);
      if (fyStart <= selectedStartYear) {
        ids.forEach(id => alreadyTrackedIds.add(id));
      }
    });

    return allClients.filter(c => 
      !alreadyTrackedIds.has(c.id) && 
      ((c.legalName || '').toLowerCase().includes(s) || 
       (c.tradeName || '').toLowerCase().includes(s) || 
       (c.itProfile?.pan || '').toLowerCase().includes(s) || 
       (c.gstProfile?.gstin || '').toLowerCase().includes(s))
    ).slice(0, 10);
  }, [allClients, watchlist, addSearch, selectedYear]);

  const handleFinalizeAdd = () => {
    if (!pendingClientForAdd) return;
    addToWatchlist(pendingClientForAdd.id);
    if (newCaName.trim()) {
      updateCaName(pendingClientForAdd.id, newCaName.trim());
    }
    setPendingClientForAdd(null);
    setNewCaName('');
    setIsAddModalOpen(false);
  };

  const handleUpdateView = () => {
    if (viewingClient) {
      updateCaName(viewingClient.id, editCaName.trim());
      setIsViewModalOpen(false);
    }
  };

  const cycleBSStatus = (clientId: string) => {
    const current = getStatus(clientId).bsStatus;
    const flow: BSStatus[] = ['Pending', 'Document Required', 'In progress', 'Ready'];
    const nextIdx = (flow.indexOf(current) + 1) % flow.length;
    setBSStatus(clientId, flow[nextIdx]);
  };

  const stats = useMemo(() => {
    const total = trackedClients.length;
    const audited = trackedClients.filter(c => getStatus(c.id).auditFiled).length;
    const bsReady = trackedClients.filter(c => getStatus(c.id).bsStatus === 'Ready').length;
    const pendingAudit = total - audited;
    return {
      total,
      audited,
      bsReady,
      pendingAudit
    };
  }, [trackedClients, getStatus]);

  if (isClientsLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-2 landscape:space-y-1 pb-2 overflow-hidden animate-in fade-in duration-500 max-w-full mx-auto w-full">
      
      {/* Mobile & Tablet Compact Stats Strip */}
      <div className="flex items-center justify-between w-full lg:hidden gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl shadow-xs text-xs font-bold text-slate-700 shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
          <button 
            type="button"
            onClick={() => { setBsFilter('All'); setAuditFilter('All'); }}
            className={`px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-tight transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              bsFilter === 'All' && auditFilter === 'All' 
                ? 'bg-slate-900 text-white font-black shadow-xs' 
                : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
            }`}
          >
            Total: <strong className={bsFilter === 'All' && auditFilter === 'All' ? 'text-white' : 'font-black text-slate-900'}>{stats.total}</strong>
          </button>
          <button 
            type="button"
            onClick={() => { setBsFilter(prev => prev === 'Ready' ? 'All' : 'Ready'); setAuditFilter('All'); }}
            className={`px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-tight transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              bsFilter === 'Ready' 
                ? 'bg-emerald-600 text-white font-black shadow-xs' 
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            B/S Ready: <strong className={bsFilter === 'Ready' ? 'text-white' : 'font-black text-emerald-900'}>{stats.bsReady}</strong>
          </button>
          <button 
            type="button"
            onClick={() => { setAuditFilter(prev => prev === 'Filed' ? 'All' : 'Filed'); setBsFilter('All'); }}
            className={`px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-tight transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              auditFilter === 'Filed' 
                ? 'bg-indigo-600 text-white font-black shadow-xs' 
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            Audited: <strong className={auditFilter === 'Filed' ? 'text-white' : 'font-black text-indigo-900'}>{stats.audited}</strong>
          </button>
          <button 
            type="button"
            onClick={() => { setAuditFilter(prev => prev === 'Pending' ? 'All' : 'Pending'); setBsFilter('All'); }}
            className={`px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-tight transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              auditFilter === 'Pending' 
                ? 'bg-rose-600 text-white font-black shadow-xs' 
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Pending: <strong className={auditFilter === 'Pending' ? 'text-white' : 'font-black text-rose-900'}>{stats.pendingAudit}</strong>
          </button>
        </div>
        <div className="flex items-center gap-1 text-[10px] uppercase tracking-tight font-black text-slate-500 whitespace-nowrap shrink-0">
          <span>Due:</span>
          <input 
            type="date" 
            value={currentDueDate} 
            onChange={e => handleDueDateChange(e.target.value)} 
            className="bg-transparent border-none p-0 text-[10px] font-black text-indigo-600 outline-none uppercase cursor-pointer" 
          />
        </div>
      </div>

      {/* Header Search & Count Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 landscape:gap-1 bg-white p-2 md:p-2.5 landscape:p-1 rounded-[1.5rem] landscape:rounded-xl border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-1.5 shrink-0 flex-nowrap overflow-x-auto no-scrollbar max-w-full py-0.5">
          <button 
            onClick={() => { setBsFilter('All'); setAuditFilter('All'); }} 
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap ${
              bsFilter === 'All' && auditFilter === 'All' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>Total</span>
            <span className={`px-1.5 py-0.2 rounded-md text-xs font-black ${
              bsFilter === 'All' && auditFilter === 'All' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
            }`}>{stats.total}</span>
          </button>
          <button 
            onClick={() => { setBsFilter(prev => prev === 'Ready' ? 'All' : 'Ready'); setAuditFilter('All'); }} 
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap ${
              bsFilter === 'Ready' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <span>B/S Ready</span>
            <span className={`px-1.5 py-0.2 rounded-md text-xs font-black ${
              bsFilter === 'Ready' ? 'bg-emerald-500 text-white' : 'bg-emerald-200 text-emerald-900'
            }`}>{stats.bsReady}</span>
          </button>
          <button 
            onClick={() => { setAuditFilter(prev => prev === 'Filed' ? 'All' : 'Filed'); setBsFilter('All'); }} 
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap ${
              auditFilter === 'Filed' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            <span>Audited</span>
            <span className={`px-1.5 py-0.2 rounded-md text-xs font-black ${
              auditFilter === 'Filed' ? 'bg-indigo-500 text-white' : 'bg-indigo-200 text-indigo-900'
            }`}>{stats.audited}</span>
          </button>
          <button 
            onClick={() => { setAuditFilter(prev => prev === 'Pending' ? 'All' : 'Pending'); setBsFilter('All'); }} 
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap ${
              auditFilter === 'Pending' 
                ? 'bg-rose-600 text-white shadow-sm' 
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <span>Pending</span>
            <span className={`px-1.5 py-0.2 rounded-md text-xs font-black ${
              auditFilter === 'Pending' ? 'bg-rose-500 text-white' : 'bg-rose-200 text-rose-900'
            }`}>{stats.pendingAudit}</span>
          </button>
          {currentDueDate && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200/80 text-xs font-black uppercase whitespace-nowrap shrink-0">
              <span className="text-indigo-500 font-bold">Audit Due:</span>
              <span className="font-mono">{formatISOToDDMMYYYY(currentDueDate)}</span>
            </div>
          )}
        </div>

        <div className="relative flex-1 w-full group">
          <input type="text" placeholder="Search Trade Name, Legal Name, GSTIN, or PAN..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-2.5 landscape:py-1 pl-10 pr-3 font-bold text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all" />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <ViewControl 
            viewMode={viewMode} 
            onViewChange={setViewMode} 
          />
          <button onClick={() => { setPendingClientForAdd(null); setAddSearch(''); setIsAddModalOpen(true); }} className="h-10 landscape:h-8 px-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:bg-slate-900 transition-all flex items-center gap-1.5 shrink-0">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            Add To Audit
          </button>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} 
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 landscape:h-8 text-[11px] font-black uppercase tracking-widest text-slate-700 outline-none cursor-pointer">
            {YEARS.map(y => <option key={y} value={y}>FY {y}</option>)}
          </select>
          {/* Dynamic & Editable Due Date Badge on the Far Right */}
          <div className="flex items-center bg-slate-50 rounded-xl px-3 h-10 landscape:h-8 gap-1.5 border border-slate-200 focus-within:border-indigo-300 transition-all" title="Audit Due Date (Click to Edit)">
            <span className="text-[10px] font-black text-slate-400 uppercase">Due:</span>
            <input 
              type="date" 
              value={currentDueDate} 
              onChange={e => handleDueDateChange(e.target.value)} 
              className="bg-transparent border-none p-0 text-[11px] font-black text-indigo-700 outline-none cursor-pointer uppercase" 
            />
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {viewMode === 'grid' ? (
          <div className="p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTracked.map((client, idx) => {
              const status = getStatus(client.id);
              return (
                <div key={client.id} className="p-3.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl shadow-xs transition-all flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">#{idx + 1}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-slate-500 font-mono">{client.gstProfile?.gstin || client.itProfile?.pan || 'NO ID'}</span>
                        {(client.gstProfile?.gstin || client.itProfile?.pan) && (
                          <button onClick={() => { navigator.clipboard.writeText(client.gstProfile?.gstin || client.itProfile?.pan || ''); toast.success('ID Copied!'); window.open(client.gstProfile?.gstin ? 'https://services.gst.gov.in/services/searchtp' : 'https://eportal.incometax.gov.in', '_blank'); }} className="p-0.5 text-slate-400 hover:text-indigo-600 transition-colors inline-flex" title="Search Taxpayer">
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
                        <span className="font-mono font-bold text-slate-800">{client.gstProfile?.username || client.itProfile?.pan || '---'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-[9px] text-slate-400 uppercase">PWD:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-bold text-indigo-500">{client.gstProfile?.password || client.itProfile?.password || '---'}</span>
                          {(client.gstProfile?.password || client.itProfile?.password) && (
                            <button 
                              onClick={() => { 
                                navigator.clipboard.writeText(client.gstProfile?.password || client.itProfile?.password || ''); 
                                toast.success('Password Copied!'); 
                              }} 
                              className="p-0.5 text-slate-300 hover:text-indigo-600 transition-all inline-flex"
                              title="Copy Password"
                            >
                              <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m-6 4h6m-6 4h6" /></svg>
                            </button>
                          )}
                          <button 
                            onClick={() => window.open(client.gstProfile?.gstin ? 'https://services.gst.gov.in/services/login' : 'https://eportal.incometax.gov.in', '_blank')} 
                            className="p-0.5 text-slate-300 hover:text-emerald-600 transition-all inline-flex" 
                            title="Login to Portal"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-[10px]">
                    <span className="font-bold text-slate-500">Audit Status:</span>
                    <span className={`px-2.5 py-0.5 rounded-md font-black uppercase ${status.auditFiled ? 'bg-indigo-100 text-indigo-800' : status.bsStatus === 'Ready' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                      {status.auditFiled ? 'Audited' : status.bsStatus === 'Ready' ? 'B/S Ready' : 'In Progress'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <span className="text-[9px] font-black text-slate-400 uppercase">FY {selectedYear}</span>
                    <button onClick={() => { setViewingClient(client); setEditCaName(status.caName || ''); setIsViewModalOpen(true); }} className="px-2.5 py-1 text-[10px] font-black uppercase bg-indigo-600 text-white rounded-lg shadow-xs hover:bg-slate-900 transition-colors">
                      Actions
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
        <div className="overflow-auto no-scrollbar flex-1 w-full relative h-full">
          <table className="w-full text-left border-collapse table-fixed min-w-full tax-audit-table min-w-[1100px]">
            <thead className="sticky top-0 z-30 bg-slate-100">
              <tr className="bg-slate-50 border-b border-slate-200 shadow-sm font-bold uppercase tracking-wider text-slate-900">
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[55px] text-center whitespace-nowrap">S.No.</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[24%] min-w-[180px]">Entity Name</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[16%] min-w-[150px] whitespace-nowrap">GSTIN / PAN</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[14%] min-w-[130px] whitespace-nowrap">Resp. CA</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[13%] min-w-[125px] text-center whitespace-nowrap">
                  <div className="flex justify-center flex-col items-center">
                    <TableFilter label="Balance Sheet" isActive={bsFilter !== 'All'}>
                      {['All', 'Document Required', 'In progress', 'Ready', 'Pending'].map(f => (
                        <button key={f} onClick={() => setBsFilter(f as any)} className={`w-full text-left px-3 py-2 text-[var(--app-font-size)] font-black uppercase rounded-lg ${bsFilter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-700'}`}>{f}</button>
                      ))}
                    </TableFilter>
                  </div>
                </th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[11%] min-w-[110px] text-center whitespace-nowrap">
                  <div className="flex justify-center flex-col items-center">
                    <TableFilter label="Audit Status" isActive={auditFilter !== 'All'}>
                      {['All', 'Filed', 'Pending'].map(f => (
                        <button key={f} onClick={() => setAuditFilter(f as any)} className={`w-full text-left px-3 py-2 text-[var(--app-font-size)] font-black uppercase rounded-lg ${auditFilter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-700'}`}>{f}</button>
                      ))}
                    </TableFilter>
                  </div>
                </th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[14%] min-w-[180px]">Remark</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 text-right w-[95px] whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTracked.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-slate-300 font-bold uppercase tracking-wider text-[var(--app-font-size)]">
                    No audit records tracked for FY {selectedYear}
                  </td>
                </tr>
              ) : (
                filteredTracked.map((client, idx) => {
                  const status = getStatus(client.id);
                  const bsColors: Record<string, string> = {
                    'Ready': 'bg-emerald-100 text-emerald-700 border-emerald-200',
                    'In progress': 'bg-amber-100 text-amber-700 border-amber-200',
                    'Document Required': 'bg-blue-100 text-blue-700 border-blue-200',
                    'Pending': 'bg-slate-100 text-slate-400 border-slate-200'
                  };
                  return (
                    <tr key={client.id} className="group hover:bg-indigo-50/10 transition-all border-b border-slate-100 last:border-0 animate-in fade-in slide-in-from-bottom-1 duration-150">
                      <td className="px-3 py-1.5 font-black text-indigo-400 font-mono text-center whitespace-nowrap">
                        {(idx + 1).toString().padStart(2, '0')}
                      </td>
                      <td className="px-3 py-1.5 truncate min-w-[180px]" title={client.tradeName || client.legalName}>
                        <div className="font-semibold text-slate-900 truncate text-[var(--app-font-size)] leading-normal">
                          {client.tradeName || client.legalName || '---'}
                        </div>
                        {client.tradeName && client.legalName && (
                          <p className="legal-subtitle truncate leading-tight font-medium text-slate-500" title={client.legalName}>
                            Legal: {client.legalName}
                          </p>
                        )}
                        {!client.tradeName && client.itProfile?.fatherName && (
                          <p className="legal-subtitle truncate leading-tight font-medium text-slate-500" title={client.itProfile.fatherName}>
                            Father: {client.itProfile.fatherName}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 group/id">
                          <span className="font-semibold font-mono tracking-wider text-indigo-600 uppercase text-[var(--app-font-size)]">
                            {client.gstProfile?.gstin || client.itProfile?.pan || 'N/A'}
                          </span>
                          {(client.gstProfile?.gstin || client.itProfile?.pan) && (
                            <button 
                              onClick={() => { 
                                const identifier = client.gstProfile?.gstin || client.itProfile?.pan || '';
                                navigator.clipboard.writeText(identifier); 
                                toast.success('ID Copied!'); 
                              }} 
                              className="h-5 w-5 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center opacity-0 group-hover/id:opacity-100 shadow-xs border border-indigo-100 shrink-0" 
                              title="Copy GSTIN / PAN"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap">
                        <span className="font-semibold text-slate-700 uppercase truncate text-[var(--app-font-size)]">
                          {status.caName || '---'}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <button 
                            onClick={() => cycleBSStatus(client.id)} 
                            className={`px-2.5 py-0.5 rounded-full font-black uppercase border transition-all text-center inline-flex items-center justify-center text-[var(--app-font-size)] cursor-pointer hover:shadow-xs ${bsColors[status.bsStatus] || bsColors.Pending}`}
                          >
                            {status.bsStatus}
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <button 
                            onClick={() => toggleAuditStatus(client.id)} 
                            className={`px-2.5 py-0.5 rounded-full font-black uppercase border transition-all text-center inline-flex items-center justify-center text-[var(--app-font-size)] cursor-pointer hover:shadow-xs ${
                              status.auditFiled 
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200 border-slate-200'
                            }`}
                          >
                            {status.auditFiled ? 'Filed' : 'Pending'}
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 truncate min-w-[180px]">
                        <EditableRemark value={status.remark || ''} onSave={val => updateRemark(client.id, val)} />
                      </td>
                      <td className="px-3 py-1.5 text-right whitespace-nowrap w-[95px] overflow-visible">
                        <div className="flex items-center justify-end gap-1">
                          {client.itProfile && <ITViewIcon client={client} onDataChange={handleRefreshClients} />}
                          {client.gstProfile && <GSTViewIcon client={client} onDataChange={handleRefreshClients} />}
                          <button 
                            onClick={() => { setViewingClient(client); setEditCaName(status.caName || ''); setIsViewModalOpen(true); }} 
                            className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center shadow-xs" 
                            title="Audit Details & CA Assignment"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {/* VIEW MODAL (SHOWS FULL DETAILS + CA NAME EDIT) */}
      {isViewModalOpen && viewingClient && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 flex flex-col gap-1">
              <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
                 <div className="min-w-0">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight truncate">{viewingClient.legalName}</h3>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Audit Review Profile • FY {selectedYear}</p>
                 </div>
                 <button onClick={() => setIsViewModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-all">
                    <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
                 <section>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 mb-6 flex items-center gap-3">Assignment & Authority <div className="h-px flex-1 bg-slate-100" /></h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                       <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50">
                          <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-2 block ml-1">Responsible Auditor (CA)</label>
                          <input autoFocus value={editCaName} onChange={e => setEditCaName(e.target.value)} 
                            className="w-full bg-white border border-indigo-200 rounded-xl py-4 px-5 font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-lg uppercase" 
                            placeholder="Full CA Name..."
                          />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                             <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Audit Status</p>
                             <p className={`text-xs font-black uppercase ${getStatus(viewingClient.id).auditFiled ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {getStatus(viewingClient.id).auditFiled ? 'Completed' : 'Pending'}
                             </p>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                             <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Financials</p>
                             <p className="text-xs font-black text-slate-700 uppercase">{getStatus(viewingClient.id).bsStatus}</p>
                          </div>
                       </div>
                    </div>
                 </section>

                 <section>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 mb-6 flex items-center gap-3">Entity Background <div className="h-px flex-1 bg-slate-100" /></h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase text-slate-400">Trade Name</p>
                          <p className="text-sm font-black text-slate-900 truncate">{viewingClient.tradeName || '---'}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase text-slate-400">Permanent ID (PAN)</p>
                          <p className="text-sm font-black text-indigo-600 font-mono tracking-widest uppercase">{viewingClient.itProfile?.pan || 'N/A'}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase text-slate-400">Mobile Contact</p>
                          <p className="text-sm font-black text-slate-900">{viewingClient.mobile || '---'}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase text-slate-400">Portal User ID</p>
                          <p className="text-sm font-black text-slate-900">{viewingClient.itProfile?.username || viewingClient.gstProfile?.username || 'N/A'}</p>
                       </div>
                    </div>
                 </section>

                 {viewingClient.remarks && (
                    <section>
                       <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 mb-6 flex items-center gap-3">Office Notes <div className="h-px flex-1 bg-slate-100" /></h4>
                       <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                          <p className="text-sm font-medium text-slate-600 italic leading-relaxed">{viewingClient.remarks}</p>
                       </div>
                    </section>
                 )}
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4 shrink-0">
                <button onClick={() => { if(confirm('Cease audit tracking for this entity?')) { removeFromWatchlist(viewingClient.id); setIsViewModalOpen(false); } }} 
                   className="flex-1 py-4 text-red-500 font-black uppercase tracking-widest text-[10px] border border-red-100 rounded-xl hover:bg-red-50 transition-all">Untrack Entity</button>
                <button onClick={handleUpdateView} 
                   className="flex-[2] bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-xl shadow-xl hover:bg-slate-900 transition-all">Update & Close Profile</button>
              </div>
           </div>
        </div>
      )}      {/* ADD CLIENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-8 flex flex-col space-y-6 animate-in zoom-in-95 flex flex-col gap-1">
              <div className="flex items-center justify-between shrink-0">
                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                   {pendingClientForAdd ? 'Authorized Auditor' : `Track for FY ${selectedYear}`}
                 </h3>
                 <button onClick={() => { setIsAddModalOpen(false); setPendingClientForAdd(null); }} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-all">
                   <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
                 </button>
              </div>

              {!pendingClientForAdd ? (
                <>
                  <div className="relative shrink-0">
                     <input type="text" placeholder="Search Master Vault..." value={addSearch} onChange={e => setAddSearch(e.target.value)}
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-5 font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-50 transition-all" />
                     <svg className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <div className="flex-1 max-h-[400px] overflow-y-auto space-y-2 pr-2 no-scrollbar">
                     {availableToAdd.length === 0 ? (
                       <p className="text-center py-10 text-slate-400 font-bold uppercase text-xs tracking-widest">No available entities found</p>
                     ) : (
                       availableToAdd.map(c => (
                         <button key={c.id} onClick={() => { setPendingClientForAdd(c); setNewCaName(''); }} 
                           className="w-full text-left p-4 rounded-2xl border border-slate-100 hover:border-indigo-600 hover:bg-indigo-50/50 transition-all flex items-center justify-between group">
                            <div className="min-w-0 flex-1">
                               <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 truncate">{c.tradeName || c.legalName || '---'}</p>
                               <p className="text-xs font-bold text-slate-500 truncate leading-tight">{c.legalName ? `Legal: ${c.legalName}` : '---'}</p>
                               <p className="text-[10px] text-slate-400 font-mono tracking-tight mt-1">{c.gstProfile?.gstin || c.itProfile?.pan || 'NO IDENTIFIER'}</p>
                            </div>
                            <svg className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 shrink-0 ml-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                         </button>
                       ))
                     )}
                  </div>
                </>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Target Entity</p>
                    <p className="text-base font-black text-indigo-900 leading-tight">{pendingClientForAdd.tradeName || '---'}</p>
                    <p className="text-xs font-bold text-indigo-600/70 tracking-tight mt-1">{pendingClientForAdd.legalName ? `Legal Name: ${pendingClientForAdd.legalName}` : '---'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block ml-1">Responsible CA Name (Signatory)</label>
                    <input autoFocus type="text" placeholder="Full Professional Name" value={newCaName} onChange={e => setNewCaName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-lg uppercase" />
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setPendingClientForAdd(null)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-500 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-slate-50">Back</button>
                    <button onClick={handleFinalizeAdd} className="flex-[2] bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-xl hover:bg-slate-900 transition-all">Confirm Audit Tracking</button>
                  </div>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default TAXAudit;