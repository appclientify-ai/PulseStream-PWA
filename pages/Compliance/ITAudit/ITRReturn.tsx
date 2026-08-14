
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useModuleData } from '../../../hooks/useModuleData.ts';
import { formatDate } from '../../../exportUtils';
import { Client } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';
import ITViewIcon from '../../../components/ITViewIcon';
import GSTViewIcon from '../../../components/GSTViewIcon';
import { TableFilter } from '../../../components/TableFilter';
import { useITRReturnLogic, RefundStatus } from './ITRReturnlogic';
import { EditableRemark } from '../../../components/EditableRemark';
import { YEARS } from '../GSTReturn/filinglogic/MonthlyFilingLogic';
import { toast } from 'sonner';
import { ExportMenu } from '../../../components/ExportMenu';
import { exportToCSV, printList } from '../../../exportUtils';
import { useGlobalDueDates } from '../../../hooks/useGlobalDueDates';
import { formatISOToDDMMYYYY } from '../../../dateUtils';
import { ViewControl } from '../../../components/ViewControl';

const ITRReturn: React.FC = () => {
  const queryClient = useQueryClient();
  const getPreviousAY = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const startYear = currentMonth >= 3 ? currentYear : currentYear - 1;
    return `${startYear}-${(startYear + 1).toString().slice(-2)}`;
  };

  const { data: pageData, isLoading: isPageLoading } = useModuleData('itr_filing_page_data');

  const clients = useMemo(() => pageData?.clients || [], [pageData]);
  const allClientsBase = clients;

  const [search, setSearch] = useState('');
  const [selectedAY, setSelectedAY] = useState(getPreviousAY());
  
  const { getGlobalDueDate } = useGlobalDueDates(selectedAY);
  const itrDueDate = getGlobalDueDate('itr_return', 'Annual');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'All' | 'Filed' | 'Prepared' | 'Pending'>('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [refundStatusFilter, setRefundStatusFilter] = useState<'All' | 'Pending' | 'Received' | 'No Refund'>('All');
  const [isRefundFilterOpen, setIsRefundFilterOpen] = useState(false);
  const [itrFilter, setItrFilter] = useState<'All' | 'ITR-1' | 'ITR-2' | 'ITR-3' | 'ITR-4' | 'N/A'>('All');

  // Modals & Tools
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoginBoxOpen, setIsLoginBoxOpen] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  // Actions Menu State
  const [activeActionsId, setActiveActionsId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const actionsRef = useRef<HTMLDivElement>(null);

  const { getStatus, toggleStatus, updateRemark, updateFilingDate, cycleRefundStatus, updateDueDate, getDueDate } = useITRReturnLogic(
    selectedAY,
    pageData?.filingData,
    pageData?.dueDates
  );

  const isClientsLoading = isPageLoading && !pageData;

  const handleRefreshClients = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['itr_filing_page_data'] });
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
    const itGroup = clients.slice().sort((a, b) => (new Date(a.createdAt || 0).getTime()) - (new Date(b.createdAt || 0).getTime()));
    const rank = itGroup.findIndex(c => c.id === client.id) + 1;
    return `IT/${rank.toString().padStart(2, '0')}`;
  }, [clients]);

    const stats = useMemo(() => {
    const total = clients.length;
    let filed = 0;
    let pending = 0;
    let prepared = 0;
    clients.forEach(c => {
      const st = getStatus(c.id);
      if (st.filed) filed++;
      else if (st.prepared) prepared++;
      else pending++;
    });
    return { total, filed, prepared, pending };
  }, [clients, getStatus]);

  const filteredClients = useMemo(() => {
    let list = clients.filter(c => 
      (c.legalName || '').toLowerCase().includes(search.toLowerCase()) || 
      (c.tradeName || '').toLowerCase().includes(search.toLowerCase()) || 
      (c.itProfile?.pan || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.itProfile?.fatherName || '').toLowerCase().includes(search.toLowerCase())
    );
    
    if (statusFilter !== 'All') {
      list = list.filter(c => {
         const st = getStatus(c.id);
         if (statusFilter === 'Filed') return st.filed;
         if (statusFilter === 'Prepared') return st.prepared && !st.filed;
         if (statusFilter === 'Pending') return !st.filed && !st.prepared;
         return true;
      });
    }

    if (refundStatusFilter !== 'All') {
      list = list.filter(c => {
        const rs = getStatus(c.id).refundStatus || 'N/A';
        if (refundStatusFilter === 'Pending') return rs === 'Pending';
        if (refundStatusFilter === 'Received') return rs === 'Issued' || rs === 'Processed';
        if (refundStatusFilter === 'No Refund') return rs === 'N/A';
        return true;
      });
    }

    if (itrFilter !== 'All') {
      list = list.filter(c => {
        const itr = c.itProfile?.itrFiled || 'N/A';
        return itr === itrFilter;
      });
    }

    return [...list].sort((a, b) => (a.legalName || '').localeCompare(b.legalName || ''));
  }, [clients, search, statusFilter, refundStatusFilter, itrFilter, getStatus]);

  const handleExportCSV = () => {
    const headers = ["ID", "Name", "ITR", "Father Name", "Status", "Filing Date", "Refund Status", "PAN", "Password"].join(",");
    const rows = filteredClients.map(c => {
      const s = getStatus(c.id);
      return [
        getClientDisplayId(c),
        c.legalName,
        c.itProfile?.itrFiled || 'N/A',
        c.itProfile?.fatherName || '---',
        s.filed ? 'Filed' : (s.prepared ? 'Prepared' : 'Pending'),
        s.date || '---',
        s.refundStatus || 'N/A',
        c.itProfile?.pan || '---',
        c.itProfile?.password || '---'
      ];
    });
    exportToCSV(headers.split(','), rows, 'IT_Returns.csv');
  };

  const handleExportPDF = () => {
    const headers = ["ID", "Name", "ITR", "Father Name", "Status", "Filing Date", "Refund Status", "PAN"];
    const rows = filteredClients.map(c => {
      const s = getStatus(c.id);
      return [
        getClientDisplayId(c),
        c.legalName,
        c.itProfile?.itrFiled || 'N/A',
        c.itProfile?.fatherName || '---',
        s.filed ? 'Filed' : (s.prepared ? 'Prepared' : 'Pending'),
        s.date || '---',
        s.refundStatus || 'N/A',
        c.itProfile?.pan || '---'
      ];
    });
    printList('IT Returns', headers, rows);
  };

  const openActionsMenu = (e: React.MouseEvent, client: Client) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + window.scrollY + 8, left: rect.right - 256 });
    setActiveActionsId(client.id);
    setSelectedClient(client);
  };

  const saveQuickPassword = async (client: Client) => {
    try {
      const updated = { ...client, itProfile: { ...client.itProfile!, password: newPasswordValue } };
      await api.saveClient(updated);
      handleRefreshClients();
      setEditingPasswordId(null);
    } catch (err) { toast.error("Update failed."); }
  };

  const getRefundColor = (st?: RefundStatus) => {
    switch (st) {
      case 'Issued': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Processed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Adjusted': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'Pending': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      default: return 'bg-slate-50 text-slate-300 border-slate-100';
    }
  };

  const shareViaWhatsApp = (text: string) => {
    window.location.href = `whatsapp://send?text=${encodeURIComponent(text)}`;
  };

  if (isClientsLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-2 landscape:space-y-1 pb-2 overflow-hidden animate-in fade-in duration-500 max-w-full mx-auto w-full">
      
      {/* Header Search & Count Bar */}
      <div className="flex flex-col lg:flex-row items-center gap-3 landscape:gap-1 bg-white p-2.5 landscape:p-1 rounded-[1.5rem] landscape:rounded-xl border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button 
            onClick={() => setStatusFilter('All')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              statusFilter === 'All' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>Total</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-xs font-black">{stats.total}</span>
          </button>
          <button 
            onClick={() => setStatusFilter('Filed')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              statusFilter === 'Filed' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <span>Filed</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-xs font-black">{stats.filed}</span>
          </button>
          <button 
            onClick={() => setStatusFilter('Prepared')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              statusFilter === 'Prepared' ? 'bg-amber-600 text-white shadow-sm' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <span>Prepared</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-xs font-black">{stats.prepared}</span>
          </button>
          <button 
            onClick={() => setStatusFilter('Pending')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              statusFilter === 'Pending' ? 'bg-rose-600 text-white shadow-sm' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <span>Pending</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-xs font-black">{stats.pending}</span>
          </button>
        </div>

        <div className="relative flex-1 group w-full">
          <input type="text" placeholder="Search active IT client, PAN, or Father Name..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-2.5 landscape:py-1 pl-10 pr-3 font-bold text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all" />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <ViewControl 
            viewMode={viewMode} 
            onViewChange={setViewMode} 
          />
          <ExportMenu onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
          <select value={selectedAY} onChange={e => setSelectedAY(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 landscape:h-8 text-[11px] font-black uppercase tracking-widest text-slate-700 outline-none cursor-pointer">{YEARS.map(y => <option key={y} value={y}>AY {y}</option>)}</select>
          <div className="flex items-center bg-slate-50 rounded-xl px-3 h-10 landscape:h-8 gap-1.5 border border-slate-200 focus-within:border-indigo-200 transition-all">
            <span className="text-[9px] font-black text-slate-400 uppercase">Due:</span>
            <input type="date" value={getDueDate()} onChange={e => updateDueDate(e.target.value)} className="bg-transparent border-none p-0 text-[11px] font-black text-slate-700 outline-none cursor-pointer uppercase" />
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {viewMode === 'grid' ? (
          <div className="p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredClients.map((client, idx) => {
              const status = getStatus(client.id);
              const isPassVisible = visiblePasswords.has(client.id);
              return (
                <div key={client.id} className="p-3.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl shadow-xs transition-all flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">#{idx + 1}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-black text-slate-700 font-mono">{client.panProfile?.pan || 'NO PAN'}</span>
                        {client.panProfile?.pan && (
                          <button onClick={() => { navigator.clipboard.writeText(client.panProfile?.pan || ''); toast.success('PAN Copied!'); window.open('https://eportal.incometax.gov.in', '_blank'); }} className="p-1 text-slate-400 hover:text-indigo-600" title="Search PAN on IT Portal">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <h4 className="text-xs font-black text-slate-900 truncate" title={client.legalName}>{client.legalName || client.tradeName}</h4>
                    <p className="text-[10px] font-bold text-slate-500 truncate">S/O: {client.panProfile?.fatherName || 'N/A'}</p>

                    {/* Credentials Section */}
                    <div className="mt-2 p-2.5 bg-white rounded-xl border border-slate-200/80 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-[9px] text-slate-400 uppercase">PAN / ID:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-bold text-slate-800">{client.panProfile?.pan || '---'}</span>
                          {client.panProfile?.pan && (
                            <button onClick={() => { navigator.clipboard.writeText(client.panProfile?.pan || ''); toast.success('PAN copied'); }} className="p-0.5 text-slate-300 hover:text-indigo-600 transition-all inline-flex" title="Copy PAN">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-[9px] text-slate-400 uppercase">PWD:</span>
                        <div className="flex items-center gap-1">
                          {editingPasswordId === client.id ? (
                            <input 
                              autoFocus 
                              value={newPasswordValue} 
                              onChange={e => setNewPasswordValue(e.target.value)} 
                              onBlur={() => saveQuickPassword(client)} 
                              onKeyDown={e => e.key === 'Enter' && saveQuickPassword(client)} 
                              className="bg-white border border-indigo-200 rounded px-1.5 py-0.5 text-[10px] font-bold w-20 outline-none h-5" 
                            />
                          ) : (
                            <>
                              <span className="font-mono font-bold text-indigo-500">{client.itProfile?.password || '---'}</span>
                              <button 
                                onClick={() => { setEditingPasswordId(client.id); setNewPasswordValue(client.itProfile?.password || ''); }} 
                                className="p-0.5 text-slate-300 hover:text-amber-500 transition-all inline-flex"
                                title="Edit Password"
                              >
                                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                              <button 
                                onClick={() => { 
                                  navigator.clipboard.writeText(client.panProfile?.pan || ''); 
                                  window.open('https://eportal.incometax.gov.in', '_blank'); 
                                }} 
                                className="p-0.5 text-slate-300 hover:text-indigo-600 transition-all inline-flex" 
                                title="Login to Portal"
                              >
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-[10px]">
                    <span className="font-bold text-slate-500">ITR Status ({status.itrType || 'ITR'}):</span>
                    <button onClick={() => updateField(client.id, 'status', status.status === 'Filed' ? 'Pending' : status.status === 'Prepared' ? 'Filed' : 'Prepared')} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                      status.status === 'Filed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : status.status === 'Prepared' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-rose-100 text-rose-800 border-rose-200'
                    }`}>
                      {status.status || 'Pending'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <span className="text-[9px] font-black text-slate-400 uppercase">AY {selectedAY}</span>
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
          <table className="w-full text-left border-collapse table-fixed min-w-full itr-returns-table min-w-[1150px]">
            <thead className="sticky top-0 z-30 bg-slate-100">
              <tr className="bg-slate-50 border-b border-slate-200 shadow-sm font-bold uppercase tracking-wider text-slate-900">
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[50px] text-center whitespace-nowrap">S.No.</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[22%] min-w-[170px]">Name</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[8%] min-w-[80px] text-center whitespace-nowrap">
                  <div className="flex justify-center flex-col items-center">
                    <TableFilter label="ITR" isActive={itrFilter !== 'All'}>
                      {['All', 'ITR-1', 'ITR-2', 'ITR-3', 'ITR-4', 'N/A'].map(f => (
                        <button key={f} onClick={() => setItrFilter(f as any)} className={`w-full text-left px-3 py-2 text-[var(--app-font-size)] font-black uppercase rounded-lg ${itrFilter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-700'}`}>{f}</button>
                      ))}
                    </TableFilter>
                  </div>
                </th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[10%] min-w-[105px] text-center whitespace-nowrap">
                  <div className="flex justify-center flex-col items-center">
                    <TableFilter label="Status" isActive={statusFilter !== 'All'}>
                      {['All', 'Filed', 'Prepared', 'Pending'].map(f => <button key={f} onClick={() => setStatusFilter(f as any)} className={`w-full text-left px-3 py-2 text-[var(--app-font-size)] font-black uppercase rounded-lg ${statusFilter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-700'}`}>{f}</button>)}
                    </TableFilter>
                  </div>
                </th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[11%] min-w-[115px] text-center whitespace-nowrap">Filing Date</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[12%] min-w-[115px] text-center whitespace-nowrap">
                  <div className="flex justify-center flex-col items-center">
                    <TableFilter label="Refund Status" isActive={refundStatusFilter !== 'All'}>
                      {['All', 'Pending', 'Received', 'No Refund'].map(f => (
                        <button key={f} onClick={() => setRefundStatusFilter(f as any)} className={`w-full text-left px-3 py-2 text-[var(--app-font-size)] font-black uppercase rounded-lg ${refundStatusFilter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-700'}`}>{f}</button>
                      ))}
                    </TableFilter>
                  </div>
                </th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[12%] min-w-[130px] whitespace-nowrap">Pan No.</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[12%] min-w-[120px] whitespace-nowrap">Password</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 w-[13%] min-w-[150px]">Remark</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-3 py-1.5 border-b border-slate-200 text-right w-[95px] whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-20 text-center text-slate-300 font-bold uppercase tracking-wider text-[var(--app-font-size)]">
                    No matching IT return records found
                  </td>
                </tr>
              ) : (
                filteredClients.map((client, idx) => {
                  const status = getStatus(client.id);
                  const isEditingPass = editingPasswordId === client.id;
                  return (
                    <tr key={client.id} className="group hover:bg-indigo-50/10 transition-all border-b border-slate-100 last:border-0 animate-in fade-in slide-in-from-bottom-1 duration-150">
                      <td className="px-3 py-1.5 font-black text-indigo-400 font-mono text-center whitespace-nowrap">
                        {(idx + 1).toString().padStart(2, '0')}
                      </td>
                      <td className="px-3 py-1.5 truncate min-w-[170px]" title={client.legalName}>
                        <div className="font-semibold text-slate-900 truncate text-[var(--app-font-size)] leading-normal">{client.legalName || '---'}</div>
                        {client.tradeName && (
                          <p className="trade-subtitle truncate leading-tight font-medium" title={client.tradeName}>
                            Trade: {client.tradeName}
                          </p>
                        )}
                        <p className="father-subtitle truncate leading-tight font-medium text-slate-500" title={client.itProfile?.fatherName}>
                          {client.itProfile?.fatherName ? `Father: ${client.itProfile.fatherName}` : 'Father: ---'}
                        </p>
                      </td>
                      <td className="px-3 py-1.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <span className="inline-flex items-center justify-center bg-indigo-50/80 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md font-black text-[var(--app-font-size)] tracking-wide">
                            {client.itProfile?.itrFiled || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <button 
                            onClick={() => toggleStatus(client.id)} 
                            className={`px-2.5 py-0.5 rounded-full font-black uppercase border transition-all text-center inline-flex items-center justify-center text-[var(--app-font-size)] ${
                              status.filed ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : (status.prepared ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-400 border-slate-200')
                            }`}
                          >
                            {status.filed ? 'Filed' : (status.prepared ? 'Prepared' : 'Pending')}
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 text-center whitespace-nowrap">
                        {status.filed ? (
                          <input 
                            type="date" 
                            value={status.date || ''} 
                            onChange={e => updateFilingDate(client.id, e.target.value)} 
                            className="bg-transparent border-none p-0 text-[var(--app-font-size)] font-semibold text-slate-700 outline-none uppercase cursor-pointer text-center" 
                          />
                        ) : (
                          <span className="text-slate-300 font-semibold text-[var(--app-font-size)]">---</span>
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <button 
                            onClick={() => status.filed && cycleRefundStatus(client.id)} 
                            disabled={!status.filed} 
                            className={`px-2.5 py-0.5 rounded-full font-black uppercase border transition-all text-center inline-flex items-center justify-center text-[var(--app-font-size)] ${getRefundColor(status.refundStatus)} ${
                              !status.filed ? 'opacity-30 cursor-not-allowed' : 'hover:shadow-xs cursor-pointer'
                            }`}
                          >
                            {status.refundStatus || 'N/A'}
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 group/pan">
                          <span className="font-semibold font-mono tracking-wider text-emerald-600 uppercase text-[var(--app-font-size)]">
                            {client.itProfile?.pan || '---'}
                          </span>
                          {client.itProfile?.pan && (
                            <button 
                              onClick={() => { 
                                navigator.clipboard.writeText(client.itProfile?.pan || ''); 
                                toast.success('PAN Copied!'); 
                              }} 
                              className="h-5 w-5 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center opacity-0 group-hover/pan:opacity-100 shadow-xs border border-emerald-100 shrink-0" 
                              title="Copy PAN"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 group/pass">
                          {isEditingPass ? (
                            <input 
                              autoFocus 
                              value={newPasswordValue} 
                              onChange={e => setNewPasswordValue(e.target.value)} 
                              onBlur={() => saveQuickPassword(client)} 
                              onKeyDown={e => { if (e.key === 'Enter') saveQuickPassword(client); }} 
                              className="bg-white border border-indigo-200 rounded px-2 h-7 font-semibold w-24 outline-none text-[var(--app-font-size)]" 
                            />
                          ) : (
                            <>
                              <span className="font-semibold text-indigo-500 font-mono tracking-wider truncate text-[var(--app-font-size)]">
                                {client.itProfile?.password || '---'}
                              </span>
                              <button 
                                onClick={() => { setEditingPasswordId(client.id); setNewPasswordValue(client.itProfile?.password || ''); }} 
                                className="p-1 text-slate-300 hover:text-amber-500 opacity-0 group-hover/pass:opacity-100 transition-all shrink-0" 
                                title="Edit Password"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                              {client.itProfile?.pan && (
                                <button 
                                  onClick={() => { 
                                    navigator.clipboard.writeText(client.itProfile?.pan || client.itProfile?.username || ''); 
                                    toast.success('PAN/User ID copied');
                                    window.open('https://eportal.incometax.gov.in/iec/foservices/#/login', '_blank'); 
                                  }} 
                                  className="p-1 text-slate-300 hover:text-indigo-600 opacity-0 group-hover/pass:opacity-100 transition-all shrink-0" 
                                  title="Login to IT Portal"
                                >
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-1.5 truncate min-w-[150px]">
                        <EditableRemark value={status?.remark || getStatus?.(client.id)?.remark || ''} onSave={val => updateRemark(client.id, val)} />
                      </td>
                      <td className="px-3 py-1.5 text-right whitespace-nowrap w-[95px] overflow-visible">
                        <div className="flex items-center justify-end gap-1">
                          <ITViewIcon client={client} onDataChange={handleRefreshClients} />
                          {client.gstProfile && <GSTViewIcon client={client} onDataChange={handleRefreshClients} />}
                          <button 
                            onClick={() => { setSelectedClient(client); setIsLoginBoxOpen(true); }} 
                            className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center shadow-xs" 
                            title="Login Tool"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                          </button>
                          <button 
                            onClick={(e) => openActionsMenu(e, client)} 
                            className={`h-7 w-7 rounded-lg border transition-all flex items-center justify-center shadow-xs ${activeActionsId === client.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white'}`}
                            title="Actions"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
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

      {/* ACTIONS MENU */}
      {activeActionsId && selectedClient && (
        <div ref={actionsRef} style={{ top: menuPosition.top, left: menuPosition.left }} className="fixed w-64 bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl z-[9999] p-2 animate-in zoom-in-95 origin-top-right overflow-hidden text-left">
          <button onClick={() => { shareViaWhatsApp(`*IT Return Credentials*\n*Entity:* ${selectedClient.legalName}\n*PAN:* ${selectedClient.itProfile?.pan}\n*User ID:* ${selectedClient.itProfile?.username}\n*Password:* ${selectedClient.itProfile?.password}`); setActiveActionsId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-50 rounded-xl transition-colors text-left group">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Share Creds</span>
          </button>
          <button onClick={() => { shareViaWhatsApp(`*IT Return Profile*\nName: ${selectedClient.legalName || 'N/A'}\nMobile: ${selectedClient.mobile || 'N/A'}\nEmail: ${selectedClient.email || 'N/A'}\n\n*IT Details*\nPAN: ${selectedClient.itProfile?.pan || 'N/A'}\nFather Name: ${selectedClient.itProfile?.fatherName || 'N/A'}\nDOB: ${formatDate(selectedClient.itProfile?.dob)}\nAddress: ${selectedClient.itProfile?.address || 'N/A'}`); setActiveActionsId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-50 rounded-xl transition-colors text-left group border-t border-slate-50">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Share Full Detail</span>
          </button>
        </div>
      )}

      {/* LOGIN BOX MODAL */}
      {isLoginBoxOpen && selectedClient && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
              <div className="p-8 bg-slate-900 text-white flex items-center justify-between shrink-0">
                 <div><p className="text-[10px] font-black tracking-[0.4em] text-indigo-400 mb-2">Portal Access</p><h3 className="text-xl font-black truncate">{selectedClient.legalName}</h3></div>
                 <button onClick={() => setIsLoginBoxOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"><svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg></button>
              </div>
              <div className="p-10 space-y-8">
                 <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col gap-4">
                    <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">PAN Identity</p><p className="text-lg font-black text-indigo-600 font-mono tracking-widest">{selectedClient.itProfile?.pan}</p></div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                       <div><p className="text-[9px] font-black text-slate-400 mb-1">User ID</p><p className="text-sm font-black text-slate-900 font-mono break-all select-all">{selectedClient.itProfile?.username}</p></div>
                       <div><p className="text-[9px] font-black text-slate-400 mb-1">Password</p><p className="text-sm font-black text-indigo-600 font-mono tracking-wider break-all select-all">{selectedClient.itProfile?.password}</p></div>
                    </div>
                 </div>
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100"><button onClick={() => { navigator.clipboard.writeText(selectedClient.itProfile?.username || ''); window.open('https://eportal.incometax.gov.in/iec/foservices/#/login', '_blank'); }} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs tracking-widest hover:bg-slate-900 transition-all shadow-2xl flex items-center justify-center gap-3">Launch IT Portal & Copy ID</button></div>
           </div>
        </div>
      )}

      {/* FULL CLIENT DETAIL VIEW MODAL removed - replaced by ITViewIcon */}

      {/* DETAIL VIEW MODAL removed - replaced by ITDetailModal */}
    </div>
  );
};

export default ITRReturn;
