
import React, { useState, useEffect, useMemo } from 'react';
import { LitigationRecord, Client, LitigationStatus } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';
import NoticeForm from '../../Clientform/NoticeForm';
import GSTViewIcon from '../../../components/GSTViewIcon';
import { toast } from 'sonner';


const NoticeFiled: React.FC = () => {
  const [records, setRecords] = useState<LitigationRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<Partial<LitigationRecord> | null>(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<LitigationRecord | null>(null);

  const [sectionFilter, setSectionFilter] = useState('All');
  const [activeHeaderFilter, setActiveHeaderFilter] = useState<'section' | null>(null);

  // Inline Status Dropdown State
  const [activeStatusMenuId, setActiveStatusMenuId] = useState<string | null>(null);
  const [isReissueMode, setIsReissueMode] = useState(false);

  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
  const [recordToUpdate, setRecordToUpdate] = useState<LitigationRecord | null>(null);
  const [outcomeStatus, setOutcomeStatus] = useState<LitigationStatus>('Drop');
  const [outcomeDate, setOutcomeDate] = useState(new Date().toISOString().split('T')[0]);
  const [outcomeRefNo, setOutcomeRefNo] = useState('');

  const [isLoginBoxOpen, setIsLoginBoxOpen] = useState(false);
  const [selectedClientForLogin, setSelectedClientForLogin] = useState<Client | null>(null);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [recs, clis] = await Promise.all([
        api.getLitigationRecords(),
        api.getClients()
      ]);
      setRecords(recs.filter(r => r.category === 'Notice' && r.status === 'Filed'));
      setClients(clis);
    } catch (err) {
      console.error("Vault sync failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const syncHandler = () => { console.log('Syncing data...'); fetchAll(); };
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, []);

  
  const handleDelete = async (id: string) => {
    try {
      await api.deleteLitigationRecord(id);
      toast.success('Record deleted successfully');
      setIsModalOpen(false);
      fetchAll();
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };

  const handleSave = async (data: Partial<LitigationRecord>) => {
    await api.saveLitigationRecord({ ...data, category: 'Notice' });
    setIsModalOpen(false);
    setIsViewModalOpen(false);
    setIsReissueMode(false);
    fetchAll();
  };

  const updateRecordStatus = async (record: LitigationRecord, newStatus: LitigationStatus) => {
    setRecordToUpdate(record);
    setOutcomeStatus(newStatus);
    setOutcomeDate(new Date().toISOString().split('T')[0]);
    setOutcomeRefNo('');
    setIsOutcomeModalOpen(true);
    setActiveStatusMenuId(null);
  };

  const submitOutcome = async () => {
    if (!recordToUpdate) return;
    try {
      const updated = {
        ...recordToUpdate,
        status: outcomeStatus,
        orderDate: outcomeDate,
        referenceNo: outcomeRefNo || recordToUpdate.referenceNo
      };
      await api.saveLitigationRecord(updated);
      setIsOutcomeModalOpen(false);
      setRecordToUpdate(null);
      fetchAll();
      toast.success("Outcome updated successfully");
    } catch (err) { toast.error("Outcome update failed."); }
  };

  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    return `${d}-${m}-${y}`;
  };

  const sections = useMemo(() => Array.from(new Set(records.map(r => r.section).filter(Boolean))).sort(), [records]);

  const filteredRecords = useMemo(() => {
    const s = search.toLowerCase();
    let list = records.filter(r => {
      const client = clients.find(c => c.id === r.clientId);
      return (r.clientName || '').toLowerCase().includes(s) || 
             (r.referenceNo || '').toLowerCase().includes(s) ||
             (client?.gstProfile?.gstin || '').toLowerCase().includes(s);
    });
    if (sectionFilter !== 'All') list = list.filter(r => r.section === sectionFilter);
    return list;
  }, [records, clients, search, sectionFilter]);

  if (isLoading) return <Loader />;

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col space-y-4 overflow-hidden">
      
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Filed Replies</p>
            <p className="text-xl font-black text-slate-900 leading-none">{records.length}</p>
          </div>
        </div>

        <div className="relative flex-1 w-full group">
          <input 
            type="text" 
            placeholder="Search filed notices by Trade Name, GSTIN or Order Reference..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all" 
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1 min-h-[300px] pb-32">
          <table className="w-full text-left border-collapse table-auto min-w-full">
            <thead className=" sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className=" px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">S. No.</th>
                <th className=" px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Trade Name</th>
                <th className=" px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">GSTIN</th>
                <th className=" px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 relative">
                  <div className="flex items-center gap-1">
                    Section
                    <button onClick={() => setActiveHeaderFilter(activeHeaderFilter === 'section' ? null : 'section')} className="p-1 hover:bg-white rounded transition-colors shadow-sm">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>
                  {activeHeaderFilter === 'section' && (
                    <div className="absolute top-full mt-1 z-50 left-0 w-40 bg-white border border-slate-200 rounded-xl shadow-xl p-1 animate-in zoom-in-95 flex flex-col gap-1">
                      <button onClick={() => { setSectionFilter('All'); setActiveHeaderFilter(null); }} className={`w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg ${sectionFilter === 'All' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>All</button>
                      {sections.map(s => (
                        <button key={s} onClick={() => { setSectionFilter(s); setActiveHeaderFilter(null); }} className={`w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg ${sectionFilter === s ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>U/s {s}</button>
                      ))}
                    </div>
                  )}
                </th>
                <th className=" px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Tax Period</th>
                <th className=" px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Filing Date</th>
                <th className=" px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">Status Update</th>
                <th className=" px-4 py-5 text-[11px] font-black uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr><td colSpan={8} className=" py-32 text-center text-slate-300 font-black uppercase tracking-[0.2em] text-sm">No filed notices in vault</td></tr>
              ) : (
                filteredRecords.map((rec, idx) => {
                  const client = clients.find(c => c.id === rec.clientId);
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/50 transition-all group text-[12px]">
                      <td className=" px-4 py-5 text-slate-300 font-black">{(idx + 1).toString().padStart(2, '0')}</td>
                      <td className=" px-4 py-5">
                        <p className="text-[11px] font-black text-slate-900 truncate" title={rec.clientName}>{rec.clientName}</p>
                        <p className="text-[8px] font-bold text-slate-400 truncate">{rec.referenceNo}</p>
                      </td>
                      <td className=" px-4 py-5 text-[11px] font-black text-indigo-600 font-mono tracking-widest">
                        <div className="flex items-center gap-2">
                          <span>{client?.gstProfile?.gstin || 'N/A'}</span>
                          {client?.gstProfile?.gstin && (
                            <button 
                              onClick={() => (navigator.clipboard.writeText(client.gstProfile?.gstin || '').then(() => { toast.success('GSTIN Copied!'); window.open('https://services.gst.gov.in/services/searchtp', '_blank'); }))}
                              className="p-1 hover:bg-indigo-50 rounded-lg text-indigo-400 hover:text-indigo-600 transition-colors"
                              title="Search Taxpayer"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className=" px-4 py-5 text-[11px] font-black text-slate-600 uppercase">
                        {rec.section ? `U/s ${rec.section}` : '---'}
                      </td>
                      <td className=" px-4 py-5 text-[11px] font-black text-slate-700 uppercase">
                        {rec.taxPeriod || '---'}
                      </td>
                      <td className=" px-4 py-5 text-[11px] font-black text-emerald-600 uppercase">{formatDisplayDate(rec.filedDate)}</td>
                      
                      <td className={` px-4 py-5 text-center relative overflow-visible ${activeStatusMenuId === rec.id ? "z-50" : "z-0"}`}>
                        <div className="relative inline-block w-full">
                           <button 
                             onClick={() => setActiveStatusMenuId(activeStatusMenuId === rec.id ? null : rec.id)}
                             className="w-full px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 transition-all flex items-center justify-between shadow-sm"
                           >
                             Update <svg className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                           </button>
                           {activeStatusMenuId === rec.id && (
                             <div className="absolute top-full mt-1 z-50 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl p-1 animate-in zoom-in-95 text-left flex flex-col">
                                <button onClick={() => updateRecordStatus(rec, 'Drop')} className="w-full px-3 py-2 text-[9px] font-black uppercase rounded-lg hover:bg-emerald-50 text-emerald-600 text-left">Drop Order</button>
                                <button onClick={() => { 
                                  setSelectedRecord(rec); 
                                  setIsReissueMode(true); 
                                  setIsModalOpen(true); 
                                  setActiveStatusMenuId(null);
                                }} className="w-full px-3 py-2 text-[9px] font-black uppercase rounded-lg hover:bg-indigo-50 text-indigo-600 border-t border-slate-50 text-left">Notice Reissued</button>
                                <button onClick={() => updateRecordStatus(rec, 'Demand')} className="w-full px-3 py-2 text-[9px] font-black uppercase rounded-lg hover:bg-red-50 text-red-600 border-t border-slate-50 text-left">Demand Order</button>
                             </div>
                           )}
                        </div>
                      </td>

                      <td className="px-4 py-5 text-right ">
                         <div className="flex items-center justify-end gap-2">
                            <button 
                               onClick={() => { 
                                 if (client) {
                                   setSelectedClientForLogin(client);
                                   setIsLoginBoxOpen(true);
                                 }
                               }} 
                               className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center shadow-sm"
                               title="Portal Login"
                            >
                               <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            </button>
                            {client && <GSTViewIcon client={client} onDataChange={fetchAll} />}
                            <button 
                              onClick={() => { setViewingRecord(rec); setIsViewModalOpen(true); }}
                              className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center shadow-sm"
                              title="View Notice Details"
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
      </div>

      {isViewModalOpen && viewingRecord && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col animate-in zoom-in-95 flex flex-col gap-1">
              <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                 <div className="min-w-0">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight truncate">{viewingRecord.clientName}</h3>
                    <p className="text-[10px] font-bold text-slate-500 tracking-widest mt-1">Ref: {viewingRecord.referenceNo}</p>
                 </div>
                 <div className="flex items-center gap-2">
                    <button onClick={() => { setSelectedRecord(viewingRecord); setIsReissueMode(false); setIsModalOpen(true); }} className="bg-indigo-600 text-white font-black uppercase text-[10px] px-6 py-3 rounded-xl shadow-lg">Modify Record</button>
                    <button onClick={() => setIsViewModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-colors"><svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg></button>
                 </div>
              </div>
              <div className="p-10 grid grid-cols-2 gap-8">
                 <div><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Entity GSTIN</p><p className="text-base font-black text-indigo-600 font-mono">{clients.find(c => c.id === viewingRecord.clientId)?.gstProfile?.gstin || 'N/A'}</p></div>
                 <div><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Section</p><p className="text-base font-black text-slate-900">U/s {viewingRecord.section}</p></div>
                 <div><p className="text-[10px] font-black text-slate-400 mb-1">Tax Period</p><p className="text-base font-black text-slate-900">{viewingRecord.taxPeriod || 'N/A'}</p></div>
                 <div><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Notice Date</p><p className="text-base font-black text-slate-900">{formatDisplayDate(viewingRecord.issuedDate)}</p></div>
                 <div><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Reply Date</p><p className="text-base font-black text-emerald-600">{formatDisplayDate(viewingRecord.filedDate)}</p></div>
                 <div className="col-span-2"><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Reply Ref / ARN</p><p className="text-base font-black text-slate-900 font-mono tracking-widest">{viewingRecord.replyReferenceNo || 'N/A'}</p></div>
                 <div className="col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Staff Remarks</p>
                    <p className="text-sm font-medium text-slate-600 italic leading-relaxed">{viewingRecord.remarks || 'No notes found.'}</p>
                 </div>
              </div>
              <div className="p-8 border-t border-slate-100 flex justify-end gap-3 shrink-0"><button onClick={() => setIsViewModalOpen(false)} className="px-8 py-3 bg-slate-100 text-slate-600 font-black uppercase text-[10px] rounded-xl transition-colors">Close</button></div>
           </div>
        </div>
      )}

      {isOutcomeModalOpen && recordToUpdate && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            <div className="p-8 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-2">Outcome Update</p>
                 <h3 className="text-xl font-black truncate">{outcomeStatus === 'Drop' ? 'Drop Order' : 'Demand Order'}</h3>
              </div>
              <button onClick={() => setIsOutcomeModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"><svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg></button>
            </div>
            <div className="p-10 space-y-6">
               <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 block">Order Date</label>
                    <input type="date" value={outcomeDate} onChange={e => setOutcomeDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold outlined-none focus:border-indigo-600 transition-all font-mono text-slate-900" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 block">Order Reference No.</label>
                    <input type="text" value={outcomeRefNo} onChange={e => setOutcomeRefNo(e.target.value)} placeholder="Ref No..." className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold outlined-none focus:border-indigo-600 transition-all font-mono text-slate-900" />
                  </div>
               </div>
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button onClick={() => setIsOutcomeModalOpen(false)} className="flex-1 py-4 bg-slate-200 text-slate-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-300 transition-all">Cancel</button>
              <button onClick={submitOutcome} className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Portal Login Modal */}
      {isLoginBoxOpen && selectedClientForLogin && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
              <div className="p-8 bg-slate-900 text-white flex items-center justify-between shrink-0">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-2">Portal Access Bridge</p>
                    <h3 className="text-xl font-black truncate">{selectedClientForLogin.tradeName}</h3>
                 </div>
                 <button onClick={() => setIsLoginBoxOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"><svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg></button>
              </div>
              <div className="p-10 space-y-8">
                 <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col gap-4">
                    <div>
                       <p className="text-[9px] font-black uppercase text-slate-400 mb-1">GSTIN Identity</p>
                       <p className="text-lg font-black text-indigo-600 font-mono tracking-widest uppercase">{selectedClientForLogin.gstProfile?.gstin}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                       <div><p className="text-[9px] font-black text-slate-400 mb-1">User ID</p><p className="text-sm font-black text-slate-900 truncate">{selectedClientForLogin.gstProfile?.username}</p></div>
                       <div><p className="text-[9px] font-black text-slate-400 mb-1">Password</p><p className="text-sm font-black text-indigo-600 tracking-widest">{selectedClientForLogin.gstProfile?.password}</p></div>
                    </div>
                 </div>
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100">
                 <button onClick={() => { navigator.clipboard.writeText(selectedClientForLogin.gstProfile?.username || ''); window.open('https://services.gst.gov.in/services/login', '_blank'); }} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs tracking-widest hover:bg-slate-900 transition-all shadow-2xl flex items-center justify-center gap-3">
                    Launch Portal & Sync ID
                 </button>
              </div>
           </div>
        </div>
      )}

      <NoticeForm 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setIsReissueMode(false); }} 
        onSave={handleSave} onDelete={handleDelete} 
        clients={clients} 
        category="Notice" 
        initialData={selectedRecord}
        isReissue={isReissueMode}
      />
    </div>
  );
};

export default NoticeFiled;
