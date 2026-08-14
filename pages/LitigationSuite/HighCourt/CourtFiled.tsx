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

type HearingFilter = 'All' | 'gt15' | 'gt5' | 'urgent';

const CourtFiled: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: allRecords = [], isLoading: isRecordsLoading } = useModuleData<LitigationRecord[]>('highcourt_records');
  const { data: clients = [], isLoading: isClientsLoading } = useModuleData<Client[]>('clients');

  const records = useMemo(() => allRecords.filter(r => r.status === 'Filed'), [allRecords]);
  const isLoading = (isRecordsLoading || isClientsLoading) && allRecords.length === 0;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [hearingFilter, setHearingFilter] = useState<HearingFilter>('All');
  const [selectedRecord, setSelectedRecord] = useState<Partial<LitigationRecord> | null>(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<LitigationRecord | null>(null);
  const [activeStatusMenuId, setActiveStatusMenuId] = useState<string | null>(null);

  // Outcome Transition Modal state
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
  const [recordToUpdate, setRecordToUpdate] = useState<LitigationRecord | null>(null);
  const [outcomeStatus, setOutcomeStatus] = useState<LitigationStatus>('Drop');
  const [outcomeDate, setOutcomeDate] = useState(new Date().toISOString().split('T')[0]);
  const [outcomeRefNo, setOutcomeRefNo] = useState('');

  const [isLoginBoxOpen, setIsLoginBoxOpen] = useState(false);
  const [selectedClientForLogin, setSelectedClientForLogin] = useState<Client | null>(null);

  const refreshData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['highcourt_records'] });
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  }, [queryClient]);

  useEffect(() => {
    const syncHandler = () => { refreshData(); };
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, [refreshData]);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteHighCourtRecord(id);
      toast.success('Record deleted successfully');
      setIsModalOpen(false);
      refreshData();
    } catch {
      toast.error('Failed to delete record');
    }
  };

  const handleSave = async (data: Partial<LitigationRecord>) => {
    await api.saveHighCourtRecord({ ...data, category: 'HighCourt' });
    setIsModalOpen(false);
    setIsViewModalOpen(false);
    refreshData();
  };

  const updateHearingDate = async (record: LitigationRecord, date: string) => {
    try {
      await api.saveHighCourtRecord({ ...record, hearingDate: date });
      refreshData();
      toast.success("Hearing date scheduled");
    } catch {
      toast.error("Hearing date update failed.");
    }
  };

  const openOutcomeModal = (record: LitigationRecord, newStatus: LitigationStatus) => {
    setRecordToUpdate(record);
    setOutcomeStatus(newStatus);
    setOutcomeDate(new Date().toISOString().split('T')[0]);
    setOutcomeRefNo('');
    setIsOutcomeModalOpen(true);
    setActiveStatusMenuId(null);
  };

  const handleConfirmOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordToUpdate) return;
    try {
      const updated = {
        ...recordToUpdate,
        status: outcomeStatus,
        orderDate: outcomeDate,
        referenceNo: outcomeRefNo || recordToUpdate.referenceNo,
        category: 'HighCourt' as const
      };
      await api.saveHighCourtRecord(updated);
      setIsOutcomeModalOpen(false);
      setRecordToUpdate(null);
      refreshData();
      toast.success(`High Court litigation marked as ${outcomeStatus === 'Drop' ? 'Relief Granted / Closed' : 'Sustained'}`);
    } catch {
      toast.error("Failed to update outcome");
    }
  };

  const getHearingDaysLeft = (hearingDate?: string) => {
    if (!hearingDate) return null;
    const due = new Date(hearingDate);
    due.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = due.getTime() - now.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  };

  // Stats calculation for hearing badges
  const stats = useMemo(() => {
    const total = records.length;
    let gt15 = 0;
    let gt5 = 0;
    let urgent = 0;

    records.forEach(r => {
      const hd = getHearingDaysLeft(r.hearingDate);
      if (hd === null) return;
      if (hd > 15) gt15++;
      else if (hd > 5 && hd <= 15) gt5++;
      else urgent++;
    });

    return { total, gt15, gt5, urgent };
  }, [records]);

  const filteredRecords = useMemo(() => {
    const s = search.toLowerCase();
    let list = records.filter(r => {
      const client = clients.find(c => c.id === r.clientId);
      return (r.clientName || '').toLowerCase().includes(s) || 
             ((r.tioRefNo || r.referenceNo || r.filingNo || '').toLowerCase().includes(s)) ||
             (client?.gstProfile?.gstin || '').toLowerCase().includes(s);
    });

    if (hearingFilter === 'gt15') {
      list = list.filter(r => {
        const hd = getHearingDaysLeft(r.hearingDate);
        return hd !== null && hd > 15;
      });
    } else if (hearingFilter === 'gt5') {
      list = list.filter(r => {
        const hd = getHearingDaysLeft(r.hearingDate);
        return hd !== null && hd > 5 && hd <= 15;
      });
    } else if (hearingFilter === 'urgent') {
      list = list.filter(r => {
        const hd = getHearingDaysLeft(r.hearingDate);
        return hd !== null && hd <= 5;
      });
    }

    return [...list].sort((a, b) => {
      if (!a.hearingDate && !b.hearingDate) return 0;
      if (!a.hearingDate) return 1;
      if (!b.hearingDate) return -1;
      return a.hearingDate.localeCompare(b.hearingDate);
    });
  }, [records, clients, search, hearingFilter]);

  const handleExportCSV = () => {
    const headers = ['S.No.', 'Trade Name', 'GSTIN', 'Filing/WP No.', 'Matter U/s', 'Filing Date', 'Hearing Date', 'Hearing Timeline'];
    const rows = filteredRecords.map((r, idx) => {
      const c = clients.find(cl => cl.id === r.clientId);
      const hd = getHearingDaysLeft(r.hearingDate);
      return [
        (idx + 1).toString().padStart(2, '0'),
        r.clientName,
        c?.gstProfile?.gstin || '---',
        r.filingNo || r.referenceNo || '---',
        'U/s ' + (r.section || '---'),
        r.filedDate || '---',
        r.hearingDate || '---',
        hd !== null ? (hd < 0 ? `${Math.abs(hd)}d Overdue` : `${hd}d Left`) : 'Unscheduled'
      ];
    });
    exportToCSV(headers, rows, 'HighCourt_Filed.csv');
  };

  const handleExportPDF = () => {
    const headers = ['Trade Name', 'GSTIN', 'Filing/WP No.', 'Matter U/s', 'Filing Date', 'Hearing Date', 'Hearing Timeline'];
    const rows = filteredRecords.map(r => {
      const c = clients.find(cl => cl.id === r.clientId);
      const hd = getHearingDaysLeft(r.hearingDate);
      return [
        r.clientName,
        c?.gstProfile?.gstin || '---',
        r.filingNo || r.referenceNo || '---',
        'U/s ' + (r.section || '---'),
        r.filedDate || '---',
        r.hearingDate || '---',
        hd !== null ? (hd < 0 ? `${Math.abs(hd)}d Overdue` : `${hd}d Left`) : 'Unscheduled'
      ];
    });
    printList('High Court Filed Litigations', headers, rows);
  };

  if (isLoading) return <Loader />;

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col space-y-3 overflow-hidden">
      
      {/* Top Controls Bar */}
      <div className="flex flex-col lg:flex-row items-center gap-3 bg-white p-2.5 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        
        {/* Hearing Timeline Badges (Clickable Filters) */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button 
            type="button"
            onClick={() => setHearingFilter('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              hearingFilter === 'All' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>Total</span>
            <span className={`px-1.5 py-0.2 rounded-md text-xs font-black ${
              hearingFilter === 'All' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
            }`}>{stats.total}</span>
          </button>

          <button 
            type="button"
            onClick={() => setHearingFilter(prev => prev === 'gt15' ? 'All' : 'gt15')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              hearingFilter === 'gt15' 
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30' 
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
            }`}
          >
            <span>&gt; 15 Days</span>
            <span className={`px-1.5 py-0.2 rounded-md text-xs font-black ${
              hearingFilter === 'gt15' ? 'bg-white/20 text-white' : 'bg-emerald-200 text-emerald-900'
            }`}>{stats.gt15}</span>
          </button>

          <button 
            type="button"
            onClick={() => setHearingFilter(prev => prev === 'gt5' ? 'All' : 'gt5')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              hearingFilter === 'gt5' 
                ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/30' 
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
            }`}
          >
            <span>&gt; 5 Days</span>
            <span className={`px-1.5 py-0.2 rounded-md text-xs font-black ${
              hearingFilter === 'gt5' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-900'
            }`}>{stats.gt5}</span>
          </button>

          <button 
            type="button"
            onClick={() => setHearingFilter(prev => prev === 'urgent' ? 'All' : 'urgent')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              hearingFilter === 'urgent' 
                ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-600/30 animate-pulse' 
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
            }`}
          >
            <span>Last Day / Urgent</span>
            <span className={`px-1.5 py-0.2 rounded-md text-xs font-black ${
              hearingFilter === 'urgent' ? 'bg-white/20 text-white' : 'bg-rose-200 text-rose-900'
            }`}>{stats.urgent}</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 group w-full">
          <input 
            type="text" 
            placeholder="Search filed High Court matters by Trade Name, GSTIN or Case Ref..." 
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
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {filteredRecords.length === 0 ? (
          <div className="py-32 text-center text-slate-300 font-black uppercase tracking-widest text-sm">
            No Filed High Court Matters Found
          </div>
        ) : viewMode === 'table' ? (
          /* Table View */
          <div className="overflow-x-auto no-scrollbar flex-1 min-h-[300px] pb-32">
            <table className="w-full text-left border-collapse table-auto min-w-full">
              <thead className="sticky top-0 z-20">
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-400">S.No.</th>
                  <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-400">Trade Name</th>
                  <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-400">Filing / WP No.</th>
                  <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-400">Matter U/s</th>
                  <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-400">Filing Date</th>
                  <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-400">Hearing Date</th>
                  <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-400">Hearing Timeline</th>
                  <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-widest text-center">Outcome Update</th>
                  <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-400">Remark</th>
                  <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((rec, idx) => {
                  const client = clients.find(c => c.id === rec.clientId);
                  const hDays = getHearingDaysLeft(rec.hearingDate);
                  return (
                    <tr key={rec.id} className="hover:bg-indigo-50/20 transition-all group text-[12px]">
                      <td className="px-5 py-3.5 text-slate-300 font-black">
                        {(idx + 1).toString().padStart(2, '0')}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-black text-slate-900 truncate max-w-[200px]" title={rec.clientName}>
                          {rec.clientName}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 font-mono tracking-wider">
                          <span>{client?.gstProfile?.gstin || '---'}</span>
                          {client?.gstProfile?.gstin && (
                            <button 
                              onClick={() => setSearch(client.gstProfile?.gstin || '')}
                              className="p-0.5 hover:bg-indigo-50 rounded text-indigo-400 hover:text-indigo-600 transition-colors"
                              title="Search by GSTIN"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-800 uppercase">
                        {rec.filingNo || rec.referenceNo ? (
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-mono">
                            {rec.filingNo || rec.referenceNo}
                          </span>
                        ) : (
                          <span className="text-slate-300">---</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-black text-slate-600">
                        U/s {rec.section || '---'}
                      </td>
                      <td className="px-5 py-3.5 font-black text-slate-500 uppercase">
                        {formatDate(rec.filedDate)}
                      </td>
                      <td className="px-5 py-3.5">
                        <input 
                          type="date" 
                          value={rec.hearingDate || ''} 
                          onChange={(e) => updateHearingDate(rec, e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-black text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer" 
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        {hDays !== null ? (
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            hDays < 0 
                              ? 'bg-rose-50 text-rose-600 border border-rose-200/60' 
                              : hDays <= 5 
                              ? 'bg-rose-50 text-rose-600 font-bold' 
                              : hDays <= 15 
                              ? 'bg-amber-50 text-amber-700 font-semibold' 
                              : 'bg-emerald-50 text-emerald-700 font-semibold'
                          }`}>
                            {hDays < 0 ? `${Math.abs(hDays)}d Overdue` : `${hDays}d Left`}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-black text-[9px] uppercase tracking-tighter">Schedule Pending</span>
                        )}
                      </td>
                      <td className={`px-5 py-3.5 text-center relative overflow-visible ${activeStatusMenuId === rec.id ? "z-50" : "z-0"}`}>
                        <button 
                          onClick={() => setActiveStatusMenuId(activeStatusMenuId === rec.id ? null : rec.id)}
                          className="w-full px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200/60 hover:bg-emerald-100 transition-all flex items-center justify-between shadow-xs cursor-pointer"
                        >
                          <span>Outcome</span> 
                          <svg className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {activeStatusMenuId === rec.id && (
                          <div className="absolute top-full mt-1 z-50 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl p-1 animate-in zoom-in-95 text-left flex flex-col min-w-[150px]">
                            <button 
                              onClick={() => openOutcomeModal(rec, 'Drop')} 
                              className="w-full text-left px-3 py-2 text-[10px] font-black uppercase rounded-lg hover:bg-emerald-50 text-emerald-700 transition-colors"
                            >
                              Relief Granted
                            </button>
                            <button 
                              onClick={() => openOutcomeModal(rec, 'Demand')} 
                              className="w-full text-left px-3 py-2 text-[10px] font-black uppercase rounded-lg hover:bg-rose-50 text-rose-700 border-t border-slate-50 transition-colors"
                            >
                              Sustained
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 max-w-[160px]">
                        <EditableRemark 
                          value={rec.remarks || ''} 
                          onSave={async (val) => {
                            await api.saveHighCourtRecord({ ...rec, remarks: val });
                            refreshData();
                          }} 
                        />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {client && (
                            <>
                              <GSTViewIcon client={client} onDataChange={refreshData} />
                              <button
                                onClick={() => { setSelectedClientForLogin(client); setIsLoginBoxOpen(true); }}
                                className="h-7 w-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200/60 flex items-center justify-center transition-all shadow-xs cursor-pointer"
                                title="Login to GST Portal"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => { setViewingRecord(rec); setIsViewModalOpen(true); }} 
                            className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center shadow-xs cursor-pointer" 
                            title="View Details"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid View */
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 overflow-y-auto no-scrollbar flex-1">
            {filteredRecords.map((rec, idx) => {
              const client = clients.find(c => c.id === rec.clientId);
              const hDays = getHearingDaysLeft(rec.hearingDate);
              return (
                <div key={rec.id} className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md hover:border-indigo-200 transition-all group">
                  <div className="space-y-3">
                    {/* Header line */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded">
                          #{(idx + 1).toString().padStart(2, '0')}
                        </span>
                        <h4 className="font-black text-slate-900 text-sm truncate max-w-[200px]" title={rec.clientName}>
                          {rec.clientName}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {hDays !== null ? (
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            hDays < 0 ? 'bg-rose-50 text-rose-600' : hDays <= 5 ? 'bg-rose-50 text-rose-600 font-bold' : hDays <= 15 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {hDays < 0 ? `${Math.abs(hDays)}d Overdue` : `${hDays}d Left`}
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Unscheduled</span>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-slate-400 text-[10px] uppercase">GSTIN</span>
                        <span className="font-mono font-bold text-indigo-600">{client?.gstProfile?.gstin || '---'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-slate-400 text-[10px] uppercase">Filing / WP No.</span>
                        <span className="font-mono font-bold text-slate-800">{rec.filingNo || rec.referenceNo || '---'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-slate-400 text-[10px] uppercase">Matter U/s</span>
                        <span className="font-black text-slate-800">U/s {rec.section || '---'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-slate-400 text-[10px] uppercase">Filing Date</span>
                        <span className="font-bold text-slate-700">{formatDate(rec.filedDate)}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-slate-400 text-[10px] uppercase">Hearing Date</span>
                        <input 
                          type="date" 
                          value={rec.hearingDate || ''} 
                          onChange={(e) => updateHearingDate(rec, e.target.value)}
                          className="bg-white border border-slate-200 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 outline-none" 
                        />
                      </div>
                    </div>

                    {/* Remark */}
                    <div className="pt-1 border-t border-slate-200/60">
                      <p className="text-[9px] font-bold uppercase text-slate-400 mb-0.5">Remark</p>
                      <EditableRemark 
                        value={rec.remarks || ''} 
                        onSave={async (val) => {
                          await api.saveHighCourtRecord({ ...rec, remarks: val });
                          refreshData();
                        }} 
                      />
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => openOutcomeModal(rec, 'Drop')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                      >
                        Relief
                      </button>
                      <button 
                        onClick={() => openOutcomeModal(rec, 'Demand')}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                      >
                        Sustain
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {client && (
                        <>
                          <GSTViewIcon client={client} onDataChange={refreshData} />
                          <button
                            onClick={() => { setSelectedClientForLogin(client); setIsLoginBoxOpen(true); }}
                            className="h-7 w-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200/60 flex items-center justify-center transition-all shadow-xs cursor-pointer"
                            title="Login to GST Portal"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => { setViewingRecord(rec); setIsViewModalOpen(true); }}
                        className="h-7 w-7 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center shadow-xs cursor-pointer"
                        title="View Details"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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

      {/* High Court Outcome Transition Modal */}
      {isOutcomeModalOpen && recordToUpdate && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            <form onSubmit={handleConfirmOutcome}>
              <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Record High Court Outcome</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{recordToUpdate.clientName}</p>
                </div>
                <button type="button" onClick={() => { setIsOutcomeModalOpen(false); setRecordToUpdate(null); }} className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-colors">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
                </button>
              </div>
              <div className="p-8 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Outcome Status <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOutcomeStatus('Drop')}
                      className={`p-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        outcomeStatus === 'Drop'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-600/10'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Relief Granted / Closed
                    </button>
                    <button
                      type="button"
                      onClick={() => setOutcomeStatus('Demand')}
                      className={`p-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        outcomeStatus === 'Demand'
                          ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-600/10'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Sustained
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Order / Judgment Date <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-xs outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                    value={outcomeDate}
                    onChange={e => setOutcomeDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Order / Judgment Reference No <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. WP-12345/2024 or HC-APPEAL/99/2024"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-xs outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 font-mono uppercase"
                    value={outcomeRefNo}
                    onChange={e => setOutcomeRefNo(e.target.value)}
                  />
                </div>
              </div>
              <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => { setIsOutcomeModalOpen(false); setRecordToUpdate(null); }} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-black uppercase text-[10px] rounded-xl shadow-sm hover:bg-slate-100 transition-all cursor-pointer">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-indigo-600 text-white font-black uppercase text-[10px] rounded-xl shadow-lg hover:bg-slate-900 transition-all cursor-pointer">Submit Outcome</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GST Portal Login Modal */}
      {selectedClientForLogin && (
        <GSTPortalLoginModal
          isOpen={isLoginBoxOpen}
          onClose={() => { setIsLoginBoxOpen(false); setSelectedClientForLogin(null); }}
          client={selectedClientForLogin}
        />
      )}

      <NoticeForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave} 
        onDelete={handleDelete} 
        clients={clients} 
        category="HighCourt" 
        initialData={selectedRecord} 
      />
    </div>
  );
};

export default CourtFiled;
