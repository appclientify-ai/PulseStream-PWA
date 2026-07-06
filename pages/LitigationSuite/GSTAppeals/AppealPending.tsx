import React, { useState, useEffect, useMemo } from 'react';
import { LitigationRecord, Client, LitigationStatus } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';
import NoticeForm from '../../Clientform/NoticeForm';
import GSTViewIcon from '../../../components/GSTViewIcon';
import { toast } from 'sonner';
import { ExportMenu } from '../../../components/ExportMenu';
import { exportToCSV, printList } from '../../../exportUtils';


const AppealPending: React.FC = () => {
  const [records, setRecords] = useState<LitigationRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeHeaderFilter, setActiveHeaderFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('All');
  const [selectedRecord, setSelectedRecord] = useState<Partial<LitigationRecord> | null>(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<LitigationRecord | null>(null);
  const [activeStatusMenuId, setActiveStatusMenuId] = useState<string | null>(null);

  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [recordToReply, setRecordToReply] = useState<LitigationRecord | null>(null);
  const [replyDate, setReplyDate] = useState(new Date().toISOString().split('T')[0]);
  const [replyRefNo, setReplyRefNo] = useState('');

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [recs, clis] = await Promise.all([
        api.getLitigationRecords(),
        api.getClients()
      ]);
      setRecords(recs.filter(r => r.category === 'Appeal' && r.status === 'Pending'));
      setClients(clis);
    } catch (err) {
      console.error("Appeal Vault Sync Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSave = async (data: Partial<LitigationRecord>) => {
    await api.saveLitigationRecord({ ...data, category: 'Appeal' });
    setIsModalOpen(false);
    setIsViewModalOpen(false);
    fetchAll();
  };

  const updateRecordStatus = async (record: LitigationRecord, newStatus: LitigationStatus) => {
    try {
      const updated = { ...record, status: newStatus };
      await api.saveLitigationRecord(updated);
      fetchAll();
    } catch (err) {
      toast.error("Status update failed.");
    }
    setActiveStatusMenuId(null);
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
      fetchAll();
      toast.success("Appeal marked as replied");
    } catch (err) { toast.error("Status update failed"); }
  };

  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    return `${d}-${m}-${y}`;
  };

  const getAppealTiming = (dueDate?: string) => {
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
    return records.filter(r => {
      const client = clients.find(c => c.id === r.clientId);
      return (r.clientName || '').toLowerCase().includes(s) || 
             (r.referenceNo || '').toLowerCase().includes(s) ||
             (client?.gstProfile?.gstin || '').toLowerCase().includes(s);
    });
  }, [records, clients, search]);


  const handleExportCSV = () => {
    const headers = ['ID', 'Trade Name', 'GSTIN', 'Order U/s', 'Order Ref', 'Order Date', 'Due Date', 'Status'];
    const rows = filteredRecords.map(r => {
      const c = clients.find(cl => cl.id === r.clientId);
      return [
        r.id.substring(0,6),
        r.clientName,
        c?.gstProfile?.gstin || '---',
        'U/s ' + r.section,
        r.referenceNo || '---',
        r.issuedDate,
        r.dueDate,
        r.status
      ];
    });
    exportToCSV(headers, rows, 'Pending_Appeals.csv');
  };

  const handleExportPDF = () => {
    const headers = ['Trade Name', 'GSTIN', 'Order U/s', 'Order Ref', 'Order Date', 'Due Date', 'Status'];
    const rows = filteredRecords.map(r => {
      const c = clients.find(cl => cl.id === r.clientId);
      return [
        r.clientName,
        c?.gstProfile?.gstin || '---',
        'U/s ' + r.section,
        r.referenceNo || '---',
        r.issuedDate,
        r.dueDate,
        r.status
      ];
    });
    printList('Pending Appeals', headers, rows);
  };

  if (isLoading) return <Loader />;

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col space-y-4 overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Queue</p>
            <p className="text-xl font-black text-slate-900 leading-none">{records.length}</p>
          </div>
        </div>
        <div className="relative flex-1 group w-full">
          <input type="text" placeholder="Search appeal queue by trade name or order reference..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <ExportMenu onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
        <button onClick={() => { setSelectedRecord(null); setIsModalOpen(true); }} className="bg-indigo-600 text-white font-black uppercase tracking-widest px-8 h-11 rounded-xl shadow-lg hover:bg-slate-900 transition-all text-xs flex items-center gap-2 shrink-0">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
          Record Appeal
        </button>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1 min-h-[300px] pb-32">
          <table className="w-full text-left border-collapse table-auto min-w-full">
            <thead className=" sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">S.No.</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Trade Identity</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">GSTIN</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Order U/s</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Order Ref</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Order Date</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Due Date</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Due Days</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr><td colSpan={10} className=" py-32 text-center text-slate-300 font-black uppercase tracking-widest text-sm">No Pending Appeals Archived</td></tr>
              ) : (
                filteredRecords.map((rec, idx) => {
                  const timing = getAppealTiming(rec.dueDate);
                  const client = clients.find(c => c.id === rec.clientId);
                  return (
                    <tr key={rec.id} className="hover:bg-indigo-50/20 transition-all group text-[12px]">
                      <td className=" px-6 py-5 text-slate-300 font-black">{(idx + 1).toString().padStart(2, '0')}</td>
                      <td className=" px-6 py-5">
                         <p className="font-black text-slate-900 truncate" title={rec.clientName}>{rec.clientName}</p>
                         <p className="text-[9px] font-bold text-slate-400 tracking-tighter truncate mt-0.5">{client?.legalName}</p>
                      </td>
                      <td className=" px-6 py-5 font-black text-indigo-600 font-mono tracking-widest uppercase">
                        <div className="flex items-center gap-2">
                          <span>{client?.gstProfile?.gstin || 'N/A'}</span>
                          {client?.gstProfile?.gstin && (
                            <button 
                              onClick={() => setSearch(client.gstProfile?.gstin || '')}
                              className="p-1 hover:bg-indigo-50 rounded-lg text-indigo-400 hover:text-indigo-600 transition-colors"
                              title="Search by GSTIN"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className=" px-6 py-5 font-black text-slate-600">U/s {rec.section || '---'}</td>
                      <td className=" px-6 py-5 font-black text-slate-700 truncate">{rec.referenceNo}</td>
                      <td className=" px-6 py-5 font-black text-slate-500 uppercase">{formatDisplayDate(rec.orderDate || rec.issuedDate)}</td>
                      <td className=" px-6 py-5 font-black text-red-500 uppercase">{formatDisplayDate(rec.dueDate)}</td>
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
                              <button onClick={() => { setRecordToReply(rec); setIsReplyModalOpen(true); setActiveStatusMenuId(null); }} className="w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg hover:bg-emerald-50 text-emerald-600">Appeal Filed</button>
                           </div>
                         )}
                      </td>
                      <td className="px-6 py-5 text-right ">
                         <div className="flex items-center justify-end gap-1">
                            {client?.gstProfile && <GSTViewIcon client={client} onDataChange={fetchAll} />}
                            <button onClick={() => { setViewingRecord(rec); setIsViewModalOpen(true); }} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center shadow-sm ml-auto">
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

      {isViewModalOpen && viewingRecord && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col animate-in zoom-in-95 overflow-hidden">
              <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
                 <div className="min-w-0">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight truncate">{viewingRecord.clientName}</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Appeal Profile • Awaiting Submission</p>
                 </div>
                 <div className="flex items-center gap-2">
                    <button onClick={() => { setSelectedRecord(viewingRecord); setIsModalOpen(true); }} className="bg-indigo-600 text-white font-black uppercase text-[10px] px-6 py-3 rounded-xl shadow-lg hover:bg-slate-900 transition-all">Edit Record</button>
                    <button onClick={() => setIsViewModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-colors"><svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg></button>
                 </div>
              </div>
              <div className="p-10 grid grid-cols-2 gap-8 flex-1 overflow-y-auto no-scrollbar">
                 <div><p className="text-[10px] font-black uppercase text-slate-400 mb-1">GSTIN Identity</p><p className="text-base font-black text-indigo-600 font-mono">{clients.find(c => c.id === viewingRecord.clientId)?.gstProfile?.gstin || 'N/A'}</p></div>
                 <div><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Adjudication Section</p><p className="text-base font-black text-slate-900">U/s {viewingRecord.section}</p></div>
                 <div><p className="text-[10px] font-black text-slate-400 mb-1">Adjudication Ref No</p><p className="text-base font-black text-slate-900">{viewingRecord.referenceNo}</p></div>
                 <div><p className="text-[10px] font-black text-slate-400 mb-1">Tax Period</p><p className="text-base font-black text-slate-900">{viewingRecord.taxPeriod || 'N/A'}</p></div>
                 <div><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Order Date</p><p className="text-base font-black text-slate-900">{formatDisplayDate(viewingRecord.orderDate || viewingRecord.issuedDate)}</p></div>
                 <div><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Final Appeal Due</p><p className="text-base font-black text-red-500">{formatDisplayDate(viewingRecord.dueDate)}</p></div>
                 <div className="col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-100"><p className="text-[10px] font-black uppercase text-slate-400 mb-2">Staff Remarks</p><p className="text-sm font-medium text-slate-600 italic leading-relaxed">{viewingRecord.remarks || 'No internal history logged.'}</p></div>
              </div>
              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0"><button onClick={() => setIsViewModalOpen(false)} className="px-10 py-4 bg-white border border-slate-200 text-slate-600 font-black uppercase text-[10px] rounded-xl shadow-sm hover:bg-slate-100 transition-all">Dismiss View</button></div>
           </div>
        </div>
      )}

      {isReplyModalOpen && recordToReply && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            <div className="p-8 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-2">Status Update</p>
                 <h3 className="text-xl font-black truncate">Mark as Filed</h3>
              </div>
              <button onClick={() => setIsReplyModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"><svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg></button>
            </div>
            <div className="p-10 space-y-6">
               <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 block">Appeal Filing Date</label>
                    <input type="date" value={replyDate} onChange={e => setReplyDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold outlined-none focus:border-indigo-600 transition-all font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 block">ARN No.</label>
                    <input type="text" value={replyRefNo} onChange={e => setReplyRefNo(e.target.value)} placeholder="ARN or Ref Code..." className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold outlined-none focus:border-indigo-600 transition-all font-mono text-slate-900" />
                  </div>
               </div>
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button onClick={() => setIsReplyModalOpen(false)} className="flex-1 py-4 bg-slate-200 text-slate-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-300 transition-all">Cancel</button>
              <button onClick={submitReply} className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all">Confirm</button>
            </div>
          </div>
        </div>
      )}
      <NoticeForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} clients={clients} category="Appeal" initialData={selectedRecord} />
    </div>
  );
};

export default AppealPending;