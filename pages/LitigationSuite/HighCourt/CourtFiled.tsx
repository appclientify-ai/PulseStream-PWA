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

const CourtFiled: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: allRecords = [], isLoading: isRecordsLoading } = useModuleData<LitigationRecord[]>('highcourt_records');

  const { data: clients = [], isLoading: isClientsLoading } = useModuleData<Client[]>('clients');

  const records = useMemo(() => allRecords.filter(r => r.status === 'Filed'), [allRecords]);
  const isLoading = isRecordsLoading || isClientsLoading;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
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

  const updateHearingDate = async (record: LitigationRecord, date: string) => {
    try {
      await api.saveHighCourtRecord({ ...record, hearingDate: date });
      refreshData();
      toast.success("Hearing date scheduled");
    } catch (err) {
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
        referenceNo: outcomeRefNo || recordToUpdate.referenceNo
      };
      await api.saveHighCourtRecord(updated);
      setIsOutcomeModalOpen(false);
      setRecordToUpdate(null);
      refreshData();
      toast.success(`High Court litigation marked as ${outcomeStatus === 'Drop' ? 'Relief / Closed' : 'Sustained'}`);
    } catch (err) {
      toast.error("Failed to update outcome");
    }
  };

  const formatDisplayDate = (dateStr?: string) => {
    return formatDate(dateStr);
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

  const filteredRecords = useMemo(() => {
    const s = search.toLowerCase();
    return records.filter(r => {
      const client = clients.find(c => c.id === r.clientId);
      return (r.clientName || '').toLowerCase().includes(s) || 
             ((r.tioRefNo || r.referenceNo || '').toLowerCase().includes(s)) ||
             (client?.gstProfile?.gstin || '').toLowerCase().includes(s);
    });
  }, [records, clients, search]);

  if (isLoading) return <Loader />;

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col space-y-4 overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">HC Filed</p>
            <p className="text-xl font-black text-slate-900 leading-none">{records.length}</p>
          </div>
        </div>
        <div className="relative flex-1 group w-full">
          <input type="text" placeholder="Search filed High Court matters..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1 min-h-[300px] pb-32">
          <table className="w-full text-left border-collapse table-auto min-w-full">
            <thead className=" sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">S.No.</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Trade Name</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Matter U/s</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Filing Date</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Hearing Date</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Status Ref.</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-center">Outcome Update</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Remark</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr><td colSpan={10} className=" py-32 text-center text-slate-300 font-black uppercase tracking-widest text-sm">No Filed Matters Found</td></tr>
              ) : (
                filteredRecords.map((rec, idx) => {
                  const client = clients.find(c => c.id === rec.clientId);
                  const hDays = getHearingDaysLeft(rec.hearingDate);
                  return (
                    <tr key={rec.id} className="hover:bg-indigo-50/20 transition-all group text-[12px]">
                      <td className=" px-6 py-5 text-slate-300 font-black">{(idx + 1).toString().padStart(2, '0')}</td>
                      <td className=" px-6 py-5">
                        <p className="font-black text-slate-900 truncate" title={rec.clientName}>{rec.clientName}</p>
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
                      <td className=" px-6 py-5 font-black text-slate-600">U/s {rec.section || '---'}</td>
                      <td className=" px-6 py-5 font-black text-slate-500 uppercase">{formatDisplayDate(rec.filedDate)}</td>
                      <td className=" px-6 py-5">
                         <input type="date" value={rec.hearingDate || ''} onChange={(e) => updateHearingDate(rec, e.target.value)}
                           className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-black text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-100 transition-all" />
                      </td>
                      <td className=" px-6 py-5">
                         {hDays !== null ? (
                           <span className={`text-[10px] font-black uppercase ${hDays < 0 ? 'text-red-500' : hDays <= 7 ? 'text-orange-500' : 'text-emerald-600'}`}>
                              {hDays < 0 ? `${Math.abs(hDays)} Overdue` : `${hDays} Days Left`}
                           </span>
                         ) : <span className="text-slate-300 font-black text-[9px] uppercase tracking-tighter">Schedule Pending</span>}
                      </td>
                      <td className={` px-6 py-5 text-center relative overflow-visible ${activeStatusMenuId === rec.id ? "z-50" : "z-0"}`}>
                        <div className="relative inline-block w-full">
                           <button onClick={() => setActiveStatusMenuId(activeStatusMenuId === rec.id ? null : rec.id)}
                             className="w-full px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 transition-all flex items-center justify-between shadow-sm">
                             Outcome <svg className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                           </button>
                           {activeStatusMenuId === rec.id && (
                             <div className="absolute top-full mt-1 z-50 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl p-1 animate-in zoom-in-95 text-left flex flex-col">
                               <button onClick={() => openOutcomeModal(rec, 'Drop')} className="w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg hover:bg-emerald-50 text-emerald-600">Relief Granted</button>
                               <button onClick={() => openOutcomeModal(rec, 'Demand')} className="w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg hover:bg-red-50 text-red-600 border-t border-slate-50">Sustained</button>
                             </div>
                           )}
                        </div>
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
                            {client && <GSTViewIcon client={client} onDataChange={refreshData} />}
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
                      className={`p-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${
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
                      className={`p-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${
                        outcomeStatus === 'Demand'
                          ? 'bg-red-50 text-red-700 border-red-300 ring-2 ring-red-600/10'
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
                <button type="button" onClick={() => { setIsOutcomeModalOpen(false); setRecordToUpdate(null); }} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-black uppercase text-[10px] rounded-xl shadow-sm hover:bg-slate-100 transition-all">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-indigo-600 text-white font-black uppercase text-[10px] rounded-xl shadow-lg hover:bg-slate-900 transition-all">Submit Outcome</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <NoticeForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} onDelete={handleDelete} clients={clients} category="HighCourt" initialData={selectedRecord} />
    </div>
  );
};

export default CourtFiled;
