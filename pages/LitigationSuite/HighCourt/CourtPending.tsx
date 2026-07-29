import React, { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useModuleData } from '../../../hooks/useModuleData.ts';
import { LitigationRecord, Client, LitigationStatus } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';
import NoticeForm from '../../Clientform/NoticeForm';
import LitigationDetailModal from '../../../components/LitigationDetailModal';
import GSTViewIcon from '../../../components/GSTViewIcon';
import { toast } from 'sonner';
import { EditableRemark } from '../../../components/EditableRemark';
import { EditableCaseHistory } from '../../../components/EditableCaseHistory';
import { formatDate } from '../../../dateUtils';

const CourtPending: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: allRecords = [], isLoading: isRecordsLoading } = useModuleData<LitigationRecord[]>('highcourt_records');

  const { data: clients = [], isLoading: isClientsLoading } = useModuleData<Client[]>('clients');

  const records = useMemo(() => allRecords.filter(r => r.status === 'Pending'), [allRecords]);
  const isLoading = isRecordsLoading || isClientsLoading;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeHeaderFilter, setActiveHeaderFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedRecord, setSelectedRecord] = useState<Partial<LitigationRecord> | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<LitigationRecord | null>(null);
  const [activeStatusMenuId, setActiveStatusMenuId] = useState<string | null>(null);

  // Filing Transition Modal state
  const [isFilingModalOpen, setIsFilingModalOpen] = useState(false);
  const [recordToUpdate, setRecordToUpdate] = useState<LitigationRecord | null>(null);
  const [filingDate, setFilingDate] = useState(new Date().toISOString().split('T')[0]);
  const [filingRefNo, setFilingRefNo] = useState('');

  const refreshData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['highcourt_records'] });
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  }, [queryClient]);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteHighCourtRecord(id);
      toast.success('Record deleted successfully');
      setIsModalOpen(false);
      refreshData();
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };

  const handleSave = async (data: Partial<LitigationRecord>) => {
    await api.saveHighCourtRecord({ ...data, category: 'HighCourt' });
    setIsModalOpen(false);
    setIsViewModalOpen(false);
    refreshData();
  };

  const openFilingModal = (record: LitigationRecord) => {
    setRecordToUpdate(record);
    setFilingDate(new Date().toISOString().split('T')[0]);
    setFilingRefNo('');
    setIsFilingModalOpen(true);
    setActiveStatusMenuId(null);
  };

  const handleConfirmFiling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordToUpdate) return;
    try {
      const updated = {
        ...recordToUpdate,
        status: 'Filed' as LitigationStatus,
        filedDate: filingDate,
        replyReferenceNo: filingRefNo
      };
      await api.saveHighCourtRecord(updated);
      setIsFilingModalOpen(false);
      setRecordToUpdate(null);
      refreshData();
      toast.success('High Court litigation successfully marked as Filed');
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const formatDisplayDate = (dateStr?: string) => {
    return formatDate(dateStr);
  };

  const getCourtTiming = (dueDate?: string) => {
    if (!dueDate) return { label: 'No Due Date', color: 'text-slate-400', dot: 'bg-slate-300' };
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const diff = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diff < 0) return { label: `${Math.abs(diff)} ${Math.abs(diff) === 1 ? 'Day' : 'Days'} Overdue`, color: 'text-red-500', dot: 'bg-red-500 animate-pulse' };
    if (diff === 0) return { label: 'Today', color: 'text-red-500', dot: 'bg-red-500 animate-pulse' };
    if (diff <= 7) return { label: `${diff} ${diff === 1 ? 'Day' : 'Days'}`, color: 'text-red-500', dot: 'bg-red-500 animate-pulse' };
    return { label: `${diff} ${diff === 1 ? 'Day' : 'Days'}`, color: 'text-slate-700', dot: 'bg-amber-400' };
  };

  const filteredRecords = useMemo(() => {
    const s = search.toLowerCase();
    const list = records.filter(r => {
      const client = clients.find(c => c.id === r.clientId);
      return (r.clientName || '').toLowerCase().includes(s) || 
             ((r.tioRefNo || r.referenceNo || '').toLowerCase().includes(s)) ||
             (client?.gstProfile?.gstin || '').toLowerCase().includes(s);
    });
    return [...list].sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [records, clients, search]);

  if (isLoading) return <Loader />;

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col space-y-4 overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">HC Pending</p>
            <p className="text-xl font-black text-slate-900 leading-none">{records.length}</p>
          </div>
        </div>
        <div className="relative flex-1 group w-full">
          <input type="text" placeholder="Search High Court queue..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <button onClick={() => { setSelectedRecord(null); setIsModalOpen(true); }} className="bg-indigo-600 text-white font-black uppercase tracking-widest px-8 h-11 rounded-xl shadow-lg hover:bg-slate-900 transition-all text-xs flex items-center gap-2 shrink-0">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
          New Matter
        </button>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1 min-h-[300px] pb-32">
          <table className="w-full text-left border-collapse table-auto min-w-full">
            <thead className=" sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">S.No.</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Trade Name</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Matter U/s</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Order Date</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Due Date</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Due Days</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-center">Status</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Remark</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr><td colSpan={10} className=" py-32 text-center text-slate-300 font-black uppercase tracking-widest text-sm">No Pending Court Matters</td></tr>
              ) : (
                filteredRecords.map((rec, idx) => {
                  const timing = getCourtTiming(rec.dueDate);
                  return (
                    <tr key={rec.id} className="hover:bg-indigo-50/20 transition-all group text-[12px]">
                      <td className=" px-6 py-5 text-slate-300 font-black">{(idx + 1).toString().padStart(2, '0')}</td>
                      <td className=" px-6 py-5">
                        <p className="font-black text-slate-900 truncate" title={rec.clientName}>{rec.clientName}</p>
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 font-mono tracking-wider">
                          <span>{clients.find(c => c.id === rec.clientId)?.gstProfile?.gstin || '---'}</span>
                          {clients.find(c => c.id === rec.clientId)?.gstProfile?.gstin && (
                            <button 
                              onClick={() => setSearch(clients.find(c => c.id === rec.clientId)?.gstProfile?.gstin || '')}
                              className="p-0.5 hover:bg-indigo-50 rounded text-indigo-400 hover:text-indigo-600 transition-colors"
                              title="Search by GSTIN"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className=" px-6 py-5 font-black text-slate-600">U/s {rec.section || '---'}</td>
                      <td className=" px-6 py-5 font-black text-slate-500 uppercase">{formatDisplayDate(rec.tioDate || rec.orderDate || rec.issuedDate)}</td>
                      <td className=" px-6 py-5 font-black text-red-500 uppercase">{formatDisplayDate(rec.dueDate) || '---'}</td>
                      <td className=" px-6 py-5">
                         <div className="flex items-center gap-2">
                            <div className={`h-1.5 w-1.5 rounded-full ${timing.dot}`} />
                            <span className={`font-black uppercase text-[10px] ${timing.color}`}>{timing.label}</span>
                         </div>
                      </td>
                      <td className={` px-6 py-5 text-center relative overflow-visible ${activeStatusMenuId === rec.id ? "z-50" : "z-0"}`}>
                         <button onClick={() => setActiveStatusMenuId(activeStatusMenuId === rec.id ? null : rec.id)}
                            className="w-full px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-50 text-slate-500 border border-slate-200 hover:bg-white transition-all flex items-center justify-between shadow-sm">
                              Pending <svg className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                          </button>
                          {activeStatusMenuId === rec.id && (
                            <div className="absolute top-full mt-1 z-50 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl p-1 animate-in zoom-in-95 text-left flex flex-col">
                              <button onClick={() => openFilingModal(rec)} className="w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg hover:bg-emerald-50 text-emerald-600">High Court Filed</button>
                            </div>
                          )}
                      </td>
                      <td className="px-6 py-5 truncate max-w-[150px]">
                        <EditableRemark 
                          value={rec.remarks || ''} 
                          onSave={async (val) => {
                            await api.saveHighCourtRecord({ ...rec, remarks: val });
                            refreshData();
                          }} 
                        />
                      </td>
                      <td className="px-6 py-5 text-right ">
                         <div className="flex items-center justify-end gap-2">
                            {clients.find(c => c.id === rec.clientId) && <GSTViewIcon client={clients.find(c => c.id === rec.clientId)!} onDataChange={refreshData} />}
                            <button onClick={() => { setViewingRecord(rec); setIsViewModalOpen(true); }} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center shadow-sm ml-auto" title="View Notice Details">
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

      {/* High Court Filing Transition Modal */}
      {isFilingModalOpen && recordToUpdate && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            <form onSubmit={handleConfirmFiling}>
              <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Record High Court Filing</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{recordToUpdate.clientName}</p>
                </div>
                <button type="button" onClick={() => { setIsFilingModalOpen(false); setRecordToUpdate(null); }} className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-colors">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
                </button>
              </div>
              <div className="p-8 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Date of Filing (High Court) <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-xs outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                    value={filingDate}
                    onChange={e => setFilingDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Writ Petition No. / Appeal No. <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. WP-12345/2024 or HC-APPEAL/99/2024"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-xs outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 font-mono uppercase"
                    value={filingRefNo}
                    onChange={e => setFilingRefNo(e.target.value)}
                  />
                </div>
              </div>
              <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => { setIsFilingModalOpen(false); setRecordToUpdate(null); }} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-black uppercase text-[10px] rounded-xl shadow-sm hover:bg-slate-100 transition-all">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-indigo-600 text-white font-black uppercase text-[10px] rounded-xl shadow-lg hover:bg-slate-900 transition-all">Submit Filing</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <NoticeForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} onDelete={handleDelete} clients={clients} category="HighCourt" initialData={selectedRecord} />
    </div>
  );
};

export default CourtPending;