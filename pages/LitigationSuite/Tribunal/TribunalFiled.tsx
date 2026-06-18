import React, { useState, useEffect, useMemo } from 'react';
import { LitigationRecord, Client, LitigationStatus } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';
import NoticeForm from '../../Clientform/NoticeForm';
import GSTViewIcon from '../../../components/GSTViewIcon';
import { toast } from 'sonner';


const TribunalFiled: React.FC = () => {
  const [records, setRecords] = useState<LitigationRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<Partial<LitigationRecord> | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<LitigationRecord | null>(null);
  const [activeStatusMenuId, setActiveStatusMenuId] = useState<string | null>(null);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [recs, clis] = await Promise.all([
        api.getLitigationRecords(),
        api.getClients()
      ]);
      setRecords(recs.filter(r => r.category === 'Tribunal' && r.status === 'Filed'));
      setClients(clis);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSave = async (data: Partial<LitigationRecord>) => {
    await api.saveLitigationRecord({ ...data, category: 'Tribunal' });
    setIsModalOpen(false);
    setIsViewModalOpen(false);
    fetchAll();
  };

  const updateHearingDate = async (record: LitigationRecord, date: string) => {
    try {
      await api.saveLitigationRecord({ ...record, hearingDate: date });
      setRecords(prev => prev.map(r => r.id === record.id ? { ...r, hearingDate: date } : r));
    } catch (err) { toast.error("Hearing date sync failed."); }
  };

  const updateRecordStatus = async (record: LitigationRecord, newStatus: LitigationStatus) => {
    try {
      const updated = { ...record, status: newStatus };
      await api.saveLitigationRecord(updated);
      fetchAll();
    } catch (err) { toast.error("Status update failed."); }
    setActiveStatusMenuId(null);
  };

  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    return `${d}-${m}-${y}`;
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
             (r.referenceNo || '').toLowerCase().includes(s) ||
             (client?.gstProfile?.gstin || '').toLowerCase().includes(s);
    });
  }, [records, clients, search]);

  if (isLoading) return <Loader />;

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col space-y-4 overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">GSTAT Filed</p>
            <p className="text-xl font-black text-slate-900 leading-none">{records.length}</p>
          </div>
        </div>
        <div className="relative flex-1 group w-full">
          <input type="text" placeholder="Search filed tribunal matters..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1 min-h-[300px] pb-32">
          <table className="w-full text-left border-collapse table-auto min-w-[1550px]">
            <thead className="whitespace-nowrap sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="whitespace-nowrap px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[70px]">S.No.</th>
                <th className="whitespace-nowrap px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[220px]">Client Identity</th>
                <th className="whitespace-nowrap px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[180px]">GSTIN</th>
                <th className="whitespace-nowrap px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[140px]">Appeal U/s</th>
                <th className="whitespace-nowrap px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[160px]">Filing Date</th>
                <th className="whitespace-nowrap px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[180px]">Hearing Date</th>
                <th className="whitespace-nowrap px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[140px]">Status Ref.</th>
                <th className="whitespace-nowrap px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center w-[160px]">Outcome Update</th>
                <th className="whitespace-nowrap px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr><td colSpan={10} className="whitespace-nowrap py-32 text-center text-slate-300 font-black uppercase tracking-widest text-sm">No Filed Tribunal Matters</td></tr>
              ) : (
                filteredRecords.map((rec, idx) => {
                  const client = clients.find(c => c.id === rec.clientId);
                  const hDays = getHearingDaysLeft(rec.hearingDate);
                  return (
                    <tr key={rec.id} className="hover:bg-indigo-50/20 transition-all group text-[12px]">
                      <td className="whitespace-nowrap px-6 py-5 text-slate-300 font-black">{(idx + 1).toString().padStart(2, '0')}</td>
                      <td className="whitespace-nowrap px-6 py-5 font-black text-slate-900 truncate" title={rec.clientName}>{rec.clientName}</td>
                      <td className="whitespace-nowrap px-6 py-5 font-black text-indigo-600 font-mono tracking-widest uppercase">
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
                      <td className="whitespace-nowrap px-6 py-5 font-black text-slate-600">U/s {rec.section || '---'}</td>
                      <td className="whitespace-nowrap px-6 py-5 font-black text-slate-500 uppercase">{formatDisplayDate(rec.filedDate)}</td>
                      <td className="whitespace-nowrap px-6 py-5">
                         <input type="date" value={rec.hearingDate || ''} onChange={(e) => updateHearingDate(rec, e.target.value)}
                           className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-black text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-100 transition-all" />
                      </td>
                      <td className="whitespace-nowrap px-6 py-5">
                         {hDays !== null ? (
                           <span className={`text-[10px] font-black uppercase ${hDays < 0 ? 'text-red-500' : hDays <= 7 ? 'text-orange-500' : 'text-emerald-600'}`}>
                              {hDays < 0 ? `${Math.abs(hDays)} Overdue` : `${hDays} Days Left`}
                           </span>
                         ) : <span className="text-slate-300 font-black text-[9px] uppercase tracking-tighter">Schedule Pending</span>}
                      </td>
                      <td className={`whitespace-nowrap px-6 py-5 text-center relative overflow-visible ${activeStatusMenuId === rec.id ? "z-50" : "z-0"}`}>
                        <div className="relative inline-block w-full">
                           <button onClick={() => setActiveStatusMenuId(activeStatusMenuId === rec.id ? null : rec.id)}
                             className="w-full px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 transition-all flex items-center justify-between shadow-sm">
                             Outcome <svg className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                           </button>
                           {activeStatusMenuId === rec.id && (
                             <div className="absolute top-full mt-1 z-50 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl p-1 animate-in zoom-in-95 text-left flex flex-col">
                                <button onClick={() => updateRecordStatus(rec, 'Drop')} className="w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg hover:bg-emerald-50 text-emerald-600">Relief Granted</button>
                                <button onClick={() => updateRecordStatus(rec, 'Demand')} className="w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg hover:bg-red-50 text-red-600 border-t border-slate-50">Sustained</button>
                             </div>
                           )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right whitespace-nowrap">
                         <div className="flex items-center justify-end gap-2">
                            {client && <GSTViewIcon client={client} onDataChange={fetchAll} />}
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

      {isViewModalOpen && viewingRecord && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col animate-in zoom-in-95 overflow-hidden">
              <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
                 <div className="min-w-0">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight truncate">{viewingRecord.clientName}</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Tribunal Case Review Profile</p>
                 </div>
                 <div className="flex items-center gap-2">
                    <button onClick={() => { setSelectedRecord(viewingRecord); setIsModalOpen(true); }} className="bg-indigo-600 text-white font-black uppercase text-[10px] px-6 py-3 rounded-xl shadow-lg hover:bg-slate-900 transition-all">Edit Record</button>
                    <button onClick={() => setIsViewModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-colors"><svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg></button>
                 </div>
              </div>
              <div className="p-10 grid grid-cols-2 gap-8 flex-1 overflow-y-auto no-scrollbar">
                 <div><p className="text-[10px] font-black uppercase text-slate-400 mb-1">GSTIN</p><p className="text-base font-black text-indigo-600 font-mono">{clients.find(c => c.id === viewingRecord.clientId)?.gstProfile?.gstin || 'N/A'}</p></div>
                 <div><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Order Section</p><p className="text-base font-black text-slate-900">U/s {viewingRecord.section}</p></div>
                 <div><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Filing Date</p><p className="text-base font-black text-emerald-600">{formatDisplayDate(viewingRecord.filedDate)}</p></div>
                 <div><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Scheduled Hearing</p><p className="text-base font-black text-indigo-600">{formatDisplayDate(viewingRecord.hearingDate)}</p></div>
                 <div className="col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-100"><p className="text-[10px] font-black uppercase text-slate-400 mb-2">Internal Case Log</p><p className="text-sm font-medium text-slate-600 italic leading-relaxed">{viewingRecord.remarks || 'No notes archived.'}</p></div>
              </div>
              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0"><button onClick={() => setIsViewModalOpen(false)} className="px-8 py-3 bg-white border border-slate-200 text-slate-600 font-black uppercase text-[10px] rounded-xl shadow-sm hover:bg-slate-100 transition-all">Close View</button></div>
           </div>
        </div>
      )}

      <NoticeForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} clients={clients} category="Tribunal" initialData={selectedRecord} />
    </div>
  );
};

export default TribunalFiled;