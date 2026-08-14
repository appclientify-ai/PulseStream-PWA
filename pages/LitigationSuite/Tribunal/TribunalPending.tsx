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
import { EditableRemark } from '../../../components/EditableRemark';
import { formatDate } from '../../../dateUtils';
import ViewControl from '../../../components/ViewControl';
import { ExportMenu } from '../../../components/ExportMenu';
import { exportToCSV, printList } from '../../../exportUtils';

type DueFilter = 'All' | 'gt15' | 'gt5' | 'urgent';

const TribunalPending: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: allRecords = [], isLoading: isRecordsLoading } = useModuleData<LitigationRecord[]>('tribunal_records');
  const { data: clients = [], isLoading: isClientsLoading } = useModuleData<Client[]>('clients');

  const records = useMemo(() => allRecords.filter(r => r.status === 'Pending'), [allRecords]);
  const isLoading = (isRecordsLoading || isClientsLoading) && allRecords.length === 0;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [dueFilter, setDueFilter] = useState<DueFilter>('All');
  const [selectedRecord, setSelectedRecord] = useState<Partial<LitigationRecord> | null>(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<LitigationRecord | null>(null);
  const [activeStatusMenuId, setActiveStatusMenuId] = useState<string | null>(null);

  const [isFilingModalOpen, setIsFilingModalOpen] = useState(false);
  const [recordToFiled, setRecordToFiled] = useState<LitigationRecord | null>(null);
  const [filingDate, setFilingDate] = useState(new Date().toISOString().split('T')[0]);
  const [filingNo, setFilingNo] = useState('');
  const [caseNo, setCaseNo] = useState('');

  const [isLoginBoxOpen, setIsLoginBoxOpen] = useState(false);
  const [selectedClientForLogin, setSelectedClientForLogin] = useState<Client | null>(null);

  const refreshData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['tribunal_records'] });
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  }, [queryClient]);

  useEffect(() => {
    const syncHandler = () => { refreshData(); };
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, [refreshData]);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTribunalRecord(id);
      toast.success('Record deleted successfully');
      setIsModalOpen(false);
      refreshData();
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };

  const handleSave = async (data: Partial<LitigationRecord>) => {
    await api.saveTribunalRecord({ ...data, category: 'Tribunal' });
    setIsModalOpen(false);
    setIsViewModalOpen(false);
    refreshData();
  };

  const openFilingModal = (record: LitigationRecord) => {
    setRecordToFiled(record);
    setFilingDate(record.filedDate || new Date().toISOString().split('T')[0]);
    setFilingNo(record.filingNo || record.replyReferenceNo || '');
    setCaseNo(record.caseNo || '');
    setIsFilingModalOpen(true);
    setActiveStatusMenuId(null);
  };

  const handleConfirmFiled = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordToFiled) return;
    try {
      const updated = {
        ...recordToFiled,
        status: 'Filed' as LitigationStatus,
        filedDate: filingDate,
        filingNo: filingNo,
        caseNo: caseNo,
        replyReferenceNo: filingNo || caseNo || recordToFiled.replyReferenceNo,
        category: 'Tribunal' as const
      };
      await api.saveTribunalRecord(updated);
      setIsFilingModalOpen(false);
      setRecordToFiled(null);
      setFilingNo('');
      setCaseNo('');
      refreshData();
      toast.success("Tribunal Appeal marked as Filed");
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const getDaysLeft = (dueDate?: string) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = due.getTime() - now.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  };

  const stats = useMemo(() => {
    const total = records.length;
    let gt15 = 0;
    let gt5 = 0;
    let urgent = 0;

    records.forEach(r => {
      const dl = getDaysLeft(r.dueDate);
      if (dl === null) return;
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
             ((r.aioArn || r.oioRefNo || r.referenceNo || r.filingNo || '').toLowerCase().includes(s)) ||
             (client?.gstProfile?.gstin || '').toLowerCase().includes(s);
    });

    if (dueFilter === 'gt15') {
      list = list.filter(r => {
        const dl = getDaysLeft(r.dueDate);
        return dl !== null && dl > 15;
      });
    } else if (dueFilter === 'gt5') {
      list = list.filter(r => {
        const dl = getDaysLeft(r.dueDate);
        return dl !== null && dl > 5 && dl <= 15;
      });
    } else if (dueFilter === 'urgent') {
      list = list.filter(r => {
        const dl = getDaysLeft(r.dueDate);
        return dl !== null && dl <= 5;
      });
    }

    return [...list].sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [records, clients, search, dueFilter]);

  const handleExportCSV = () => {
    const headers = ['S.No.', 'Trade Name', 'GSTIN', 'Filing/Case No.', 'Order U/s', 'Order Date', 'Due Date', 'Due Days'];
    const rows = filteredRecords.map((r, idx) => {
      const c = clients.find(cl => cl.id === r.clientId);
      const dl = getDaysLeft(r.dueDate);
      return [
        (idx + 1).toString().padStart(2, '0'),
        r.clientName,
        c?.gstProfile?.gstin || '---',
        r.filingNo || r.caseNo || '---',
        'U/s ' + (r.section || '---'),
        r.aioDate || r.oioDate || r.orderDate || r.issuedDate || '---',
        r.dueDate || '---',
        dl !== null ? `${dl} Days` : '---'
      ];
    });
    exportToCSV(headers, rows, 'GSTAT_Pending.csv');
  };

  const handleExportPDF = () => {
    const headers = ['Trade Name', 'GSTIN', 'Filing/Case No.', 'Order U/s', 'Order Date', 'Due Date', 'Due Days'];
    const rows = filteredRecords.map(r => {
      const c = clients.find(cl => cl.id === r.clientId);
      const dl = getDaysLeft(r.dueDate);
      return [
        r.clientName,
        c?.gstProfile?.gstin || '---',
        r.filingNo || r.caseNo || '---',
        'U/s ' + (r.section || '---'),
        r.aioDate || r.oioDate || r.orderDate || r.issuedDate || '---',
        r.dueDate || '---',
        dl !== null ? `${dl} Days` : '---'
      ];
    });
    printList('GSTAT Pending Appeals', headers, rows);
  };

  if (isLoading) return <Loader />;

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col space-y-3 overflow-hidden">
      
      {/* Top Controls Bar */}
      <div className="flex flex-col lg:flex-row items-center gap-3 bg-white p-2.5 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        
        {/* Count Badges (Clickable Filters) */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button 
            type="button"
            onClick={() => setDueFilter('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
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
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              dueFilter === 'gt15' 
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30' 
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
            }`}
          >
            <span>&gt; 15 Days Left</span>
            <span className={`px-1.5 py-0.2 rounded-md text-xs font-black ${
              dueFilter === 'gt15' ? 'bg-white/20 text-white' : 'bg-emerald-200 text-emerald-900'
            }`}>{stats.gt15}</span>
          </button>

          <button 
            type="button"
            onClick={() => setDueFilter(prev => prev === 'gt5' ? 'All' : 'gt5')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              dueFilter === 'gt5' 
                ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/30' 
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
            }`}
          >
            <span>&gt; 5 Days Left</span>
            <span className={`px-1.5 py-0.2 rounded-md text-xs font-black ${
              dueFilter === 'gt5' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-900'
            }`}>{stats.gt5}</span>
          </button>

          <button 
            type="button"
            onClick={() => setDueFilter(prev => prev === 'urgent' ? 'All' : 'urgent')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
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
        <div className="relative flex-1 group w-full">
          <input 
            type="text" 
            placeholder="Search GSTAT queue by Trade Name, GSTIN or Case Ref..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-2 pl-10 pr-3 font-bold text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all" 
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        {/* View & Export Controls */}
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
            onClick={() => { setSelectedRecord(null); setIsModalOpen(true); }} 
            className="bg-indigo-600 text-white font-black uppercase tracking-wider px-3.5 py-2 rounded-xl shadow-sm hover:bg-slate-900 transition-all text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            <span>Record Matter</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {viewMode === 'grid' ? (
          <div className="p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecords.length === 0 ? (
              <div className="col-span-full py-24 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
                No pending GSTAT matters found
              </div>
            ) : (
              filteredRecords.map((rec, idx) => {
                const client = clients.find(c => c.id === rec.clientId);
                const dl = getDaysLeft(rec.dueDate);

                return (
                  <div key={rec.id} className="p-4 bg-slate-50/70 hover:bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                          #{((idx + 1).toString().padStart(2, '0'))}
                        </span>
                        {dl !== null ? (
                          <span className={`text-xs font-bold ${dl < 0 ? 'text-rose-600' : dl <= 5 ? 'text-rose-600' : dl <= 15 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {dl < 0 ? `${Math.abs(dl)}d Overdue` : `${dl}d Left`}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">No Due Date</span>
                        )}
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
                        <span className="font-bold text-[10px] text-slate-400 uppercase">Case / Filing:</span>
                        <span className="font-mono font-semibold text-slate-800 truncate max-w-[140px]">{rec.filingNo || rec.caseNo || '---'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-[10px] text-slate-400 uppercase">Order U/s:</span>
                        <span className="font-semibold text-slate-800">{rec.section ? `U/s ${rec.section}` : '---'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-[10px] text-slate-400 uppercase">Due Date:</span>
                        <span className="font-bold text-rose-600">{formatDate(rec.dueDate)}</span>
                      </div>
                    </div>

                    <div className="pt-1">
                      <EditableRemark 
                        value={rec.remarks || ''} 
                        onSave={async (val) => {
                          await api.saveTribunalRecord({ ...rec, remarks: val });
                          refreshData();
                        }} 
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                      <button 
                        onClick={() => openFilingModal(rec)}
                        className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
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
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2 border-b border-slate-200 w-[22%] min-w-[180px]">Trade Name</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2 border-b border-slate-200 w-[14%] min-w-[120px] whitespace-nowrap">Filing / Case No.</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2 border-b border-slate-200 w-[11%] min-w-[90px] whitespace-nowrap">Order U/s</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2 border-b border-slate-200 w-[11%] min-w-[95px] whitespace-nowrap">Order Date</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2 border-b border-slate-200 w-[11%] min-w-[95px] whitespace-nowrap">Due Date</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2 border-b border-slate-200 w-[11%] min-w-[95px] whitespace-nowrap">Due Days</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2 border-b border-slate-200 w-[12%] min-w-[110px] text-center whitespace-nowrap">Status</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2 border-b border-slate-200 w-[14%] min-w-[150px]">Remark</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2 border-b border-slate-200 text-right w-[110px] whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-24 text-center text-slate-400 font-bold uppercase tracking-wider">
                      No pending GSTAT records
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec, idx) => {
                    const client = clients.find(c => c.id === rec.clientId);
                    const dl = getDaysLeft(rec.dueDate);

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
                        <td className="px-3 py-2 font-mono whitespace-nowrap text-slate-700">
                          {rec.filingNo || rec.caseNo ? (
                            <span className="font-bold">{rec.filingNo || rec.caseNo}</span>
                          ) : (
                            <span className="text-slate-300">---</span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-700 whitespace-nowrap">
                          {rec.section ? `U/s ${rec.section}` : '---'}
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-600 whitespace-nowrap">
                          {formatDate(rec.aioDate || rec.oioDate || rec.orderDate || rec.issuedDate)}
                        </td>
                        <td className="px-3 py-2 font-bold text-rose-600 uppercase whitespace-nowrap">
                          {formatDate(rec.dueDate)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {dl !== null ? (
                            <span className={`font-semibold ${dl < 0 ? 'text-rose-600 font-bold' : dl <= 5 ? 'text-rose-600 font-bold' : dl <= 15 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {dl < 0 ? `${Math.abs(dl)}d Overdue` : `${dl}d Left`}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">No Due Date</span>
                          )}
                        </td>
                        <td className={`px-3 py-2 text-center relative whitespace-nowrap ${activeStatusMenuId === rec.id ? "z-50" : "z-0"}`}>
                          <button 
                            onClick={() => openFilingModal(rec)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all flex items-center justify-center gap-1 mx-auto cursor-pointer"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            <span>Mark Filed</span>
                          </button>
                        </td>
                        <td className="px-3 py-2 truncate min-w-[150px]">
                          <EditableRemark 
                            value={rec.remarks || ''} 
                            onSave={async (val) => {
                              await api.saveTribunalRecord({ ...rec, remarks: val });
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

      <NoticeForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave} 
        onDelete={handleDelete} 
        clients={clients} 
        category="Tribunal" 
        initialData={selectedRecord} 
      />

      {isFilingModalOpen && recordToFiled && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <form onSubmit={handleConfirmFiled} className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl flex flex-col animate-in zoom-in-95 overflow-hidden border border-slate-200">
            <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-black tracking-tight">Mark as Tribunal Filed</h3>
                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mt-0.5 truncate max-w-[280px]">{recordToFiled.clientName}</p>
              </div>
              <button type="button" onClick={() => { setIsFilingModalOpen(false); setRecordToFiled(null); }} className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors">
                <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">Date of Filing (GSTAT) <span className="text-red-500">*</span></label>
                <input
                  required
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-xs outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                  value={filingDate}
                  onChange={e => setFilingDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">Tribunal Filing No. <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  placeholder="e.g. GSTAT/FIL/2024/00812"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-xs outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 font-mono uppercase"
                  value={filingNo}
                  onChange={e => setFilingNo(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">Tribunal Case No. (If Allotted)</label>
                <input
                  type="text"
                  placeholder="e.g. APL-5/DEL/2024/01"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-xs outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 font-mono uppercase"
                  value={caseNo}
                  onChange={e => setCaseNo(e.target.value)}
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5 shrink-0">
              <button type="button" onClick={() => { setIsFilingModalOpen(false); setRecordToFiled(null); }} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold uppercase text-[10px] rounded-xl shadow-xs hover:bg-slate-100 transition-all">Cancel</button>
              <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-bold uppercase text-[10px] rounded-xl shadow-sm hover:bg-slate-900 transition-all">Confirm Filed</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TribunalPending;