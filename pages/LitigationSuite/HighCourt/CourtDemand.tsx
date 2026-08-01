import React, { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useModuleData } from '../../../hooks/useModuleData.ts';
import { LitigationRecord, Client } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';
import NoticeForm from '../../Clientform/NoticeForm';
import LitigationDetailModal from '../../../components/LitigationDetailModal';
import GSTViewIcon from '../../../components/GSTViewIcon';
import { toast } from 'sonner';
import { EditableRemark } from '../../../components/EditableRemark';
import { EditableCaseHistory } from '../../../components/EditableCaseHistory';
import { formatDate } from '../../../dateUtils';

const CourtDemand: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: allRecords = [], isLoading: isRecordsLoading } = useModuleData<LitigationRecord[]>('highcourt_records');

  const { data: clients = [], isLoading: isClientsLoading } = useModuleData<Client[]>('clients');

  const records = useMemo(() => allRecords.filter(r => r.status === 'Demand'), [allRecords]);
  const isLoading = isRecordsLoading || isClientsLoading;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<Partial<LitigationRecord> | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<LitigationRecord | null>(null);
  const [activeStatusMenuId, setActiveStatusMenuId] = useState<string | null>(null);

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

  const updateRecordStatus = async (record: LitigationRecord, newStatus: LitigationRecord['status'], isPaid: boolean = false) => {
    try {
      const updated = { ...record, status: newStatus };
      if (newStatus === 'Drop') {
        updated.isDemandPaid = isPaid;
      }
      await api.saveHighCourtRecord(updated);
      refreshData();
      toast.success(newStatus === 'Drop' ? 'Demand marked as Paid & Closed' : 'Status reverted successfully');
    } catch (err) {
      toast.error("Outcome update failed.");
    }
    setActiveStatusMenuId(null);
  };

  const formatDisplayDate = (dateStr?: string) => {
    return formatDate(dateStr);
  };

  const filteredRecords = useMemo(() => {
    const s = search.toLowerCase();
    return records.filter(r => {
      const client = clients.find(c => c.id === r.clientId);
      return (r.clientName || '').toLowerCase().includes(s) || 
             ((r.tioRefNo || r.referenceNo || r.filingNo || '').toLowerCase().includes(s)) ||
             (client?.gstProfile?.gstin || '').toLowerCase().includes(s);
    });
  }, [records, clients, search]);

  if (isLoading) return <Loader />;

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col space-y-4 overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Confirmed Demands</p>
            <p className="text-xl font-black text-slate-900 leading-none">{records.length}</p>
          </div>
        </div>
        <div className="relative flex-1 group w-full">
          <input type="text" placeholder="Search sustained High Court matters..." value={search} onChange={e => setSearch(e.target.value)}
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
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Filing No.</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Section</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Judgment Date</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-center">Outcome</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Remark</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr><td colSpan={9} className=" py-32 text-center text-slate-300 font-black uppercase tracking-widest text-sm">No Unfavorable Court Orders Recorded</td></tr>
              ) : (
                filteredRecords.map((rec, idx) => {
                  const client = clients.find(c => c.id === rec.clientId);
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
                      <td className=" px-6 py-5 font-mono font-bold text-slate-800 uppercase">
                        {rec.filingNo ? (
                          <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-mono">
                            {rec.filingNo}
                          </span>
                        ) : (
                          <span className="text-slate-300">---</span>
                        )}
                      </td>
                      <td className=" px-6 py-5 font-black text-slate-600">U/s {rec.section || '---'}</td>
                      <td className=" px-6 py-5 font-black text-red-500 uppercase">{formatDisplayDate(rec.tioDate || rec.orderDate || rec.issuedDate)}</td>
                      <td className={` px-6 py-5 text-center relative overflow-visible ${activeStatusMenuId === rec.id ? "z-50" : "z-0"}`}>
                        <div className="relative inline-block w-full">
                           <button onClick={() => setActiveStatusMenuId(activeStatusMenuId === rec.id ? null : rec.id)}
                             className="w-full px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-all flex items-center justify-between shadow-sm">
                             Sustained <svg className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                           </button>
                           {activeStatusMenuId === rec.id && (
                             <div className="absolute top-full mt-1 z-50 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl p-1 animate-in zoom-in-95 text-left flex flex-col">
                                <button onClick={() => updateRecordStatus(rec, 'Drop', true)} className="w-full px-3 py-2 text-[9px] font-black uppercase rounded-lg hover:bg-orange-50 text-orange-600 text-left">Demand Paid</button>
                                <button onClick={() => updateRecordStatus(rec, 'Filed')} className="w-full px-3 py-2 text-[9px] font-black uppercase rounded-lg hover:bg-slate-50 text-slate-600 text-left border-t border-slate-50">Revert Status</button>
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

      <NoticeForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} onDelete={handleDelete} clients={clients} category="HighCourt" initialData={selectedRecord} />
    </div>
  );
};

export default CourtDemand;
