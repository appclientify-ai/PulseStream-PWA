import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useModuleData } from '../../../hooks/useModuleData.ts';
import { LitigationRecord, Client, LitigationStatus } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';
import NoticeForm from '../../Clientform/NoticeForm';
import LitigationDetailModal from '../../../components/LitigationDetailModal';
import GSTViewIcon from '../../../components/GSTViewIcon';
import GSTPortalLoginModal from '../../../components/GSTPortalLoginModal';
import { toast } from 'sonner';
import { ExportMenu } from '../../../components/ExportMenu';
import { exportToCSV, printList } from '../../../exportUtils';
import { EditableRemark } from '../../../components/EditableRemark';
import { formatDate } from '../../../dateUtils';
import ViewControl from '../../../components/ViewControl';

type DueDateFilter = 'All' | 'gt15' | 'gt5' | 'urgent';

const AppealPending: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: pageData, isLoading: isPageLoading } = useModuleData('gst_appeal_pending');

  const allRecords = useMemo(() => pageData?.litigation || [], [pageData]);
  const clients = useMemo(() => pageData?.clients || [], [pageData]);
  const records = useMemo(() => allRecords, [allRecords]);
  const isLoading = isPageLoading && !pageData;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [dueFilter, setDueFilter] = useState<DueDateFilter>('All');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [selectedRecord, setSelectedRecord] = useState<Partial<LitigationRecord> | null>(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<LitigationRecord | null>(null);
  const [activeStatusMenuId, setActiveStatusMenuId] = useState<string | null>(null);

  const [isLoginBoxOpen, setIsLoginBoxOpen] = useState(false);
  const [selectedClientForLogin, setSelectedClientForLogin] = useState<Client | null>(null);

  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [recordToReply, setRecordToReply] = useState<LitigationRecord | null>(null);
  const [replyDate, setReplyDate] = useState(new Date().toISOString().split('T')[0]);
  const [replyRefNo, setReplyRefNo] = useState('');

  const refreshData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['gst_appeal_pending'] });
    queryClient.invalidateQueries({ queryKey: ['litigation_filing_page_data'] });
    queryClient.invalidateQueries({ queryKey: ['litigationRecords'] });
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  }, [queryClient]);

  useEffect(() => {
    const syncHandler = () => { refreshData(); };
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, [refreshData]);

  const handleSave = async (data: Partial<LitigationRecord>) => {
    await api.saveLitigationRecord({ ...data, category: 'Appeal' });
    setIsModalOpen(false);
    setIsViewModalOpen(false);
    refreshData();
  };

  const submitReply = async () => {
    if (!recordToReply) return;
    try {
      const updated = { 
        ...recordToReply, 
        status: 'Filed' as LitigationStatus, 
        filedDate: replyDate, 
        replyReferenceNo: replyRefNo 
      };
      await api.saveLitigationRecord(updated);
      setIsReplyModalOpen(false);
      setRecordToReply(null);
      setReplyDate(new Date().toISOString().split('T')[0]);
      setReplyRefNo('');
      refreshData();
      toast.success("Appeal marked as filed");
    } catch (err) { toast.error("Status update failed"); }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteLitigationRecord(id);
      toast.success('Record deleted successfully');
      setIsModalOpen(false);
      refreshData();
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };

  const getDaysLeft = (dueDate?: string) => {
    if (!dueDate) return 999;
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = due.getTime() - now.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  };

  const getAppealTiming = (dueDate?: string) => {
    if (!dueDate) return { label: 'No Due Date', color: 'text-slate-400', dot: 'bg-slate-300' };
    const diff = getDaysLeft(dueDate);

    if (diff < 0) return { label: `${Math.abs(diff)}d Overdue`, color: 'text-rose-600 font-bold', dot: 'bg-rose-500 animate-pulse' };
    if (diff === 0) return { label: 'Today', color: 'text-rose-600 font-bold', dot: 'bg-rose-500 animate-pulse' };
    if (diff <= 5) return { label: `${diff}d Left`, color: 'text-rose-600 font-bold', dot: 'bg-rose-500 animate-pulse' };
    if (diff <= 15) return { label: `${diff}d Left`, color: 'text-amber-600 font-semibold', dot: 'bg-amber-500' };
    return { label: `${diff}d Left`, color: 'text-emerald-600 font-semibold', dot: 'bg-emerald-500' };
  };

  const sections = useMemo(() => Array.from(new Set(records.map(r => r.section).filter(Boolean))).sort(), [records]);

  // Dynamic statistics for top badges
  const stats = useMemo(() => {
    const total = records.length;
    let gt15 = 0;
    let gt5 = 0;
    let urgent = 0;

    records.forEach(r => {
      const dl = getDaysLeft(r.dueDate);
      if (dl > 15) gt15++;
      else if (dl > 5 && dl <= 15) gt5++;
      else urgent++;
    });

    return { total, gt15, gt5, urgent };
  }, [records]);

  const filteredRecords = useMemo(() => {
    const s = search.toLowerCase();
    let list = records.filter(r => {
      const client = clients.find(c => c.id === r.clientId);
      return (r.clientName || '').toLowerCase().includes(s) || 
             (r.referenceNo || '').toLowerCase().includes(s) ||
             (client?.gstProfile?.gstin || '').toLowerCase().includes(s);
    });

    if (sectionFilter !== 'All') {
      list = list.filter(r => r.section === sectionFilter);
    }

    if (dueFilter === 'gt15') {
      list = list.filter(r => getDaysLeft(r.dueDate) > 15);
    } else if (dueFilter === 'gt5') {
      list = list.filter(r => {
        const dl = getDaysLeft(r.dueDate);
        return dl > 5 && dl <= 15;
      });
    } else if (dueFilter === 'urgent') {
      list = list.filter(r => getDaysLeft(r.dueDate) <= 5);
    }

    return [...list].sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [records, clients, search, sectionFilter, dueFilter]);

  const handleExportCSV = () => {
    const headers = ['S.No.', 'Trade Name', 'GSTIN', 'Order U/s', 'Order Date', 'Due Date', 'Status'];
    const rows = filteredRecords.map((r, idx) => {
      const c = clients.find(cl => cl.id === r.clientId);
      return [
        (idx + 1).toString().padStart(2, '0'),
        r.clientName,
        c?.gstProfile?.gstin || '---',
        'U/s ' + (r.section || '---'),
        r.orderDate || r.issuedDate || '---',
        r.dueDate || '---',
        r.status
      ];
    });
    exportToCSV(headers, rows, 'Pending_Appeals.csv');
  };

  const handleExportPDF = () => {
    const headers = ['Trade Name', 'GSTIN', 'Order U/s', 'Order Date', 'Due Date', 'Status'];
    const rows = filteredRecords.map(r => {
      const c = clients.find(cl => cl.id === r.clientId);
      return [
        r.clientName,
        c?.gstProfile?.gstin || '---',
        'U/s ' + (r.section || '---'),
        r.orderDate || r.issuedDate || '---',
        r.dueDate || '---',
        r.status
      ];
    });
    printList('Pending Appeals', headers, rows);
  };

  if (isLoading) return <Loader />;

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col space-y-3 overflow-hidden">
      
      {/* Top Filter & Count Bar */}
      <div className="flex flex-col lg:flex-row items-center gap-3 bg-white p-2.5 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        
        {/* Count Badges (Click to Filter) */}
        <div className="flex items-center gap-2 shrink-0 flex-nowrap overflow-x-auto no-scrollbar w-full lg:w-auto max-w-full py-0.5">
          <button 
            type="button"
            onClick={() => setDueFilter(prev => prev === 'All' ? 'All' : 'All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap flex-shrink-0 ${
              dueFilter === 'All' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>Total</span>
            <span className={`px-1.5 py-0.2 rounded-md text-xs font-black ${
              dueFilter === 'All' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
            }`}>{stats.total}</span>
          </button>

          <button 
            type="button"
            onClick={() => setDueFilter(prev => prev === 'gt15' ? 'All' : 'gt15')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap flex-shrink-0 ${
              dueFilter === 'gt15' 
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30' 
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
            }`}
          >
            <span>&gt; 15 Days</span>
            <span className={`px-1.5 py-0.2 rounded-md text-xs font-black ${
              dueFilter === 'gt15' ? 'bg-white/20 text-white' : 'bg-emerald-200 text-emerald-900'
            }`}>{stats.gt15}</span>
          </button>

          <button 
            type="button"
            onClick={() => setDueFilter(prev => prev === 'gt5' ? 'All' : 'gt5')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap flex-shrink-0 ${
              dueFilter === 'gt5' 
                ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/30' 
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
            }`}
          >
            <span>&gt; 5 Days</span>
            <span className={`px-1.5 py-0.2 rounded-md text-xs font-black ${
              dueFilter === 'gt5' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-900'
            }`}>{stats.gt5}</span>
          </button>

          <button 
            type="button"
            onClick={() => setDueFilter(prev => prev === 'urgent' ? 'All' : 'urgent')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap flex-shrink-0 ${
              dueFilter === 'urgent' 
                ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-600/30 animate-pulse' 
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
            }`}
          >
            <span>Last Day / Urgent</span>
            <span className={`px-1.5 py-0.2 rounded-md text-xs font-black ${
              dueFilter === 'urgent' ? 'bg-white/20 text-white' : 'bg-rose-200 text-rose-900'
            }`}>{stats.urgent}</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 w-full group">
          <input 
            type="text" 
            placeholder="Search appeal queue by Trade Name, GSTIN or Order Ref..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-2 pl-10 pr-3 font-bold text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all" 
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <ViewControl 
            viewMode={viewMode} 
            onViewChange={setViewMode} 
          />

          <ExportMenu 
            onExportCSV={handleExportCSV} 
            onExportPDF={handleExportPDF} 
          />

          <button 
            type="button"
            onClick={() => { setSelectedRecord(null); setIsModalOpen(true); }}
            className="bg-indigo-600 text-white font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl shadow-sm hover:bg-slate-900 transition-all text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            <span>Record Appeal</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {viewMode === 'grid' ? (
          <div className="p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecords.length === 0 ? (
              <div className="col-span-full py-24 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
                No pending appeals matching current filter
              </div>
            ) : (
              filteredRecords.map((rec, idx) => {
                const timing = getAppealTiming(rec.dueDate);
                const client = clients.find(c => c.id === rec.clientId);

                return (
                  <div key={rec.id} className="p-4 bg-slate-50/70 hover:bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                          #{((idx + 1).toString().padStart(2, '0'))}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <div className={`h-2 w-2 rounded-full ${timing.dot}`} />
                          <span className={`text-xs ${timing.color}`}>{timing.label}</span>
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 truncate" title={rec.clientName}>
                        {rec.clientName || '---'}
                      </h4>
                      <p className="text-xs font-mono font-medium text-indigo-600 truncate mt-0.5">
                        {client?.gstProfile?.gstin || '---'}
                      </p>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-[10px] text-slate-400 uppercase">Order U/s:</span>
                        <span className="font-semibold text-slate-800">{rec.section ? `U/s ${rec.section}` : '---'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-[10px] text-slate-400 uppercase">Order Date:</span>
                        <span className="font-medium text-slate-700">{formatDate(rec.orderDate || rec.issuedDate)}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-[10px] text-slate-400 uppercase">Due Date:</span>
                        <span className="font-bold text-rose-600 font-mono">{formatDate(rec.dueDate)}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-[10px] text-slate-400 uppercase">Order Ref:</span>
                        <span className="font-mono text-slate-700 truncate max-w-[140px]">{rec.referenceNo || '---'}</span>
                      </div>
                    </div>

                    <div className="pt-1">
                      <EditableRemark 
                        value={rec.remarks || ''} 
                        onSave={async (val) => {
                          await api.saveLitigationRecord({ ...rec, remarks: val });
                          refreshData();
                        }} 
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                      <button 
                        onClick={() => { setRecordToReply(rec); setIsReplyModalOpen(true); }}
                        className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>Mark Filed</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {client && <GSTViewIcon client={client} onDataChange={refreshData} />}
                        <button 
                          onClick={() => { setViewingRecord(rec); setIsViewModalOpen(true); }} 
                          className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-xs cursor-pointer"
                          title="View Details"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="overflow-auto no-scrollbar flex-1 w-full relative h-full">
            <table className="w-full text-left border-collapse table-fixed min-w-[1100px]">
              <thead className="sticky top-0 z-30 bg-slate-100">
                <tr className="bg-slate-50 border-b border-slate-200 shadow-sm font-bold uppercase tracking-wider text-slate-900 text-xs">
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2 border-b border-slate-200 w-[55px] text-center whitespace-nowrap">S.No.</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2 border-b border-slate-200 w-[24%] min-w-[180px]">Trade Name</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2 border-b border-slate-200 w-[12%] min-w-[110px] whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span>Order U/s</span>
                      <select 
                        value={sectionFilter} 
                        onChange={e => setSectionFilter(e.target.value)} 
                        className="bg-transparent border-none text-[10px] uppercase font-bold text-indigo-600 outline-none cursor-pointer p-0"
                      >
                        <option value="All">All</option>
                        {sections.map(s => <option key={s} value={s}>U/s {s}</option>)}
                      </select>
                    </div>
                  </th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2 border-b border-slate-200 w-[12%] min-w-[100px] whitespace-nowrap">Order Date</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2 border-b border-slate-200 w-[12%] min-w-[110px] whitespace-nowrap">Due Date</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2 border-b border-slate-200 w-[12%] min-w-[100px] whitespace-nowrap">Due Days</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2 border-b border-slate-200 w-[13%] min-w-[110px] text-center whitespace-nowrap">Status</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2 border-b border-slate-200 w-[14%] min-w-[150px]">Remark</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2 border-b border-slate-200 text-right w-[110px] whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-24 text-center text-slate-400 font-bold uppercase tracking-wider">
                      No Pending Appeals Archived
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec, idx) => {
                    const timing = getAppealTiming(rec.dueDate);
                    const client = clients.find(c => c.id === rec.clientId);

                    return (
                      <tr key={rec.id} className="group hover:bg-indigo-50/10 transition-all border-b border-slate-100 last:border-0">
                        <td className="px-3 py-2 font-bold text-indigo-400 font-mono text-center whitespace-nowrap">
                          {(idx + 1).toString().padStart(2, '0')}
                        </td>
                        <td className="px-3 py-2 truncate min-w-[180px]">
                          <div className="font-semibold text-slate-900 truncate leading-normal" title={rec.clientName}>
                            {rec.clientName || '---'}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                            <span>{client?.gstProfile?.gstin || '---'}</span>
                            {client?.gstProfile?.gstin && (
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(client.gstProfile?.gstin || '');
                                  toast.success('GSTIN Copied!');
                                }}
                                className="p-0.5 text-slate-400 hover:text-indigo-600 transition-colors"
                                title="Copy GSTIN"
                              >
                                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m-6 4h6m-6 4h6" /></svg>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-700 whitespace-nowrap">
                          {rec.section ? `U/s ${rec.section}` : '---'}
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-700 whitespace-nowrap">
                          {formatDate(rec.orderDate || rec.issuedDate)}
                        </td>
                        <td className="px-3 py-2 font-bold text-rose-600 uppercase whitespace-nowrap">
                          {formatDate(rec.dueDate)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${timing.dot}`} />
                            <span className={timing.color}>{timing.label}</span>
                          </div>
                        </td>
                        <td className={`px-3 py-2 text-center relative whitespace-nowrap ${activeStatusMenuId === rec.id ? "z-50" : "z-0"}`}>
                          <div className="relative inline-block">
                            <button 
                              onClick={() => { setRecordToReply(rec); setIsReplyModalOpen(true); }}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 transition-all cursor-pointer"
                            >
                              <span>Pending</span>
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-2 truncate min-w-[150px]">
                          <EditableRemark 
                            value={rec.remarks || ''} 
                            onSave={async (val) => {
                              await api.saveLitigationRecord({ ...rec, remarks: val });
                              refreshData();
                            }} 
                          />
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap w-[110px]">
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={() => { 
                                if (client) {
                                  setSelectedClientForLogin(client);
                                  setIsLoginBoxOpen(true);
                                }
                              }} 
                              className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center shadow-xs"
                              title="Portal Login"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            </button>
                            {client && <GSTViewIcon client={client} onDataChange={refreshData} />}
                            <button 
                              onClick={() => { setViewingRecord(rec); setIsViewModalOpen(true); }} 
                              className="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-xs"
                              title="View Details"
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

      <LitigationDetailModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        record={viewingRecord}
        clients={clients}
        onEdit={(rec) => {
          setSelectedRecord(rec);
          setIsModalOpen(true);
        }}
        onDataChange={refreshData}
      />

      <GSTPortalLoginModal
        isOpen={isLoginBoxOpen}
        onClose={() => setIsLoginBoxOpen(false)}
        client={selectedClientForLogin}
      />

      {isReplyModalOpen && recordToReply && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-1">Status Update</p>
                 <h3 className="text-lg font-black truncate">Mark as Appeal Filed</h3>
              </div>
              <button onClick={() => setIsReplyModalOpen(false)} className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"><svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6" /></svg></button>
            </div>
            <div className="p-6 space-y-4">
               <div>
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1 mb-1.5 block">Appeal Filing Date</label>
                 <input type="date" value={replyDate} onChange={e => setReplyDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all font-mono" />
               </div>
               <div>
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1 mb-1.5 block">ARN / Appeal Ref No.</label>
                 <input type="text" value={replyRefNo} onChange={e => setReplyRefNo(e.target.value)} placeholder="ARN or Appeal Ref..." className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all font-mono text-slate-900" />
               </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button onClick={() => setIsReplyModalOpen(false)} className="flex-1 py-2.5 bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-300 transition-all">Cancel</button>
              <button onClick={submitReply} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-900 transition-all">Confirm Filing</button>
            </div>
          </div>
        </div>
      )}

      <NoticeForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave} 
        onDelete={handleDelete} 
        clients={clients} 
        category="Appeal" 
        initialData={selectedRecord} 
      />
    </div>
  );
};

export default AppealPending;