
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LitigationRecord, Client, LitigationStatus } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';
import NoticeForm from '../../Clientform/NoticeForm';

const NoticePending: React.FC = () => {
  const [records, setRecords] = useState<LitigationRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<Partial<LitigationRecord> | null>(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<LitigationRecord | null>(null);
  const [activeStatusMenuId, setActiveStatusMenuId] = useState<string | null>(null);
  const [sectionFilter, setSectionFilter] = useState('All');
  const [daysLeftFilter, setDaysLeftFilter] = useState<'All' | 'Critical' | 'Healthy'>('All');
  const [activeHeaderFilter, setActiveHeaderFilter] = useState<'section' | 'days' | null>(null);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [recs, clis] = await Promise.all([api.getLitigationRecords(), api.getClients()]);
      setRecords(recs.filter(r => r.category === 'Notice' && r.status === 'Pending'));
      setClients(clis);
    } catch (err) { console.error("Failed to sync notice vault:", err); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const getClientDisplayId = useCallback((clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return '---';
    
    if (client.gstProfile) {
      const isState = client.gstProfile.jurisdictionType === 'State';
      const val = isState ? client.gstProfile.sector : client.gstProfile.range;
      const prefix = isState ? 'S' : 'C';
      const sameGroup = clients.filter(c => 
        c.gstProfile &&
        c.gstProfile.jurisdictionType === client.gstProfile?.jurisdictionType &&
        (isState ? c.gstProfile.sector === val : c.gstProfile.range === val)
      ).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      const rank = sameGroup.findIndex(c => c.id === client.id) + 1;
      return `${prefix}/${val || '?'}/${rank}`;
    } else if (client.itProfile) {
      const itGroup = clients.filter(c => !!c.itProfile).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      const rank = itGroup.findIndex(c => c.id === client.id) + 1;
      return `IT/${rank.toString().padStart(2, '0')}`;
    }
    return '---';
  }, [clients]);

  const handleSave = async (data: Partial<LitigationRecord>) => {
    if (!data.clientId || !data.referenceNo) { alert("Missing Client or Reference No."); return; }
    await api.saveLitigationRecord({ ...data, category: 'Notice' });
    setIsModalOpen(false); setIsViewModalOpen(false); fetchAll();
  };

  const updateRecordStatus = async (record: LitigationRecord, newStatus: LitigationStatus) => {
    try {
      const updated = { ...record, status: newStatus };
      await api.saveLitigationRecord(updated);
      fetchAll();
    } catch (err) { alert("Status update failed."); }
    setActiveStatusMenuId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Permanently remove this notice record from the secure vault?')) {
      try { await api.delete(`/items/${id}`); fetchAll(); } catch (err) { alert("Deletion failed."); }
    }
  };

  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    return `${d}-${m}-${y}`;
  };

  const getDaysLeft = (dueDate: string) => {
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = due.getTime() - now.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
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
    if (daysLeftFilter !== 'All') {
      list = list.filter(r => {
        const dl = getDaysLeft(r.dueDate);
        return daysLeftFilter === 'Critical' ? dl <= 7 : dl > 7;
      });
    }
    return list;
  }, [records, clients, search, sectionFilter, daysLeftFilter]);

  if (isLoading) return <Loader />;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col space-y-4 overflow-hidden">
      
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Live Notices</p>
            <p className="text-xl font-black text-slate-900 leading-none">{records.length}</p>
          </div>
        </div>

        <div className="relative flex-1 w-full group">
          <input 
            type="text" 
            placeholder="Search by Trade Name, GSTIN or Order Reference..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all" 
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <button 
          onClick={() => { setSelectedRecord(null); setIsModalOpen(true); }}
          className="bg-indigo-600 text-white font-black uppercase tracking-widest px-8 h-11 rounded-xl shadow-lg hover:bg-slate-900 transition-all text-xs flex items-center gap-2 shrink-0"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
          Record Notice
        </button>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse table-fixed min-w-[1400px]">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[100px]">ID</th>
                <th className="px-4 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[220px]">Trade Name</th>
                <th className="px-4 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[180px]">GSTIN</th>
                <th className="px-4 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[140px] relative">
                  <div className="flex items-center gap-1">Section <button onClick={() => setActiveHeaderFilter(activeHeaderFilter === 'section' ? null : 'section')} className="p-1 rounded shadow-sm"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg></button></div>
                  {activeHeaderFilter === 'section' && (
                    <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 animate-in zoom-in-95">
                      <button onClick={() => { setSectionFilter('All'); setActiveHeaderFilter(null); }} className={`w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg ${sectionFilter === 'All' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>All</button>
                      {sections.map(s => <button key={s} onClick={() => { setSectionFilter(s); setActiveHeaderFilter(null); }} className={`w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg ${sectionFilter === s ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>U/s {s}</button>)}
                    </div>
                  )}
                </th>
                <th className="px-4 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[150px]">Tax Period</th>
                <th className="px-4 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[120px]">Notice Date</th>
                <th className="px-4 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[150px] relative">
                  <div className="flex items-center gap-1">Deadline <button onClick={() => setActiveHeaderFilter(activeHeaderFilter === 'days' ? null : 'days')} className="p-1 rounded shadow-sm"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg></button></div>
                  {activeHeaderFilter === 'days' && (
                    <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 animate-in zoom-in-95">
                      {['All', 'Critical', 'Healthy'].map(opt => <button key={opt} onClick={() => { setDaysLeftFilter(opt as any); setActiveHeaderFilter(null); }} className={`w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg ${daysLeftFilter === opt ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{opt}</button>)}
                    </div>
                  )}
                </th>
                <th className="px-4 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center w-[160px]">Status</th>
                <th className="px-4 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr><td colSpan={10} className="py-32 text-center text-slate-300 font-black uppercase tracking-[0.2em] text-sm">No Pending Notices in Vault</td></tr>
              ) : (
                filteredRecords.map((rec, idx) => {
                  const dl = getDaysLeft(rec.dueDate);
                  const isOverdue = dl < 0;
                  const isCritical = dl <= 7 && dl >= 0;
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/50 transition-all group h-[52px]">
                      <td className="px-4 py-2 font-black text-indigo-400 font-mono text-[11px] truncate">
                        {getClientDisplayId(rec.clientId)}
                      </td>
                      <td className="px-4 py-2">
                        <p className="text-[12px] font-black text-slate-900 uppercase truncate" title={rec.clientName}>{rec.clientName}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase truncate">{rec.referenceNo}</p>
                      </td>
                      <td className="px-4 py-2 text-[12px] font-black text-indigo-600 font-mono tracking-widest">
                        <div className="flex items-center gap-2">
                          <span>{clients.find(c => c.id === rec.clientId)?.gstProfile?.gstin || 'N/A'}</span>
                          {clients.find(c => c.id === rec.clientId)?.gstProfile?.gstin && (
                            <button 
                              onClick={() => setSearch(clients.find(c => c.id === rec.clientId)?.gstProfile?.gstin || '')}
                              className="p-1 hover:bg-indigo-50 rounded-lg text-indigo-400 hover:text-indigo-600 transition-colors"
                              title="Search by GSTIN"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-[12px] font-black text-slate-600 uppercase">{rec.section ? `U/s ${rec.section}` : '---'}</td>
                      <td className="px-4 py-2 text-[12px] font-black text-slate-700 uppercase">{rec.taxPeriod || '---'}</td>
                      <td className="px-4 py-2 text-[12px] font-black text-slate-500 uppercase">{formatDisplayDate(rec.issuedDate)}</td>
                      <td className="px-4 py-2">
                         <div className="flex items-center gap-1.5">
                            <div className={`h-1.5 w-1.5 rounded-full ${isOverdue || isCritical ? 'bg-red-500 animate-pulse' : 'bg-amber-400'}`} />
                            <span className={`text-[12px] font-black ${isOverdue || isCritical ? 'text-red-500' : 'text-slate-700'}`}>
                              {dl < 0 ? `${Math.abs(dl)} Overdue` : `${dl} Days`}
                            </span>
                         </div>
                      </td>
                      <td className="px-4 py-2 text-center relative overflow-visible">
                         <button onClick={() => setActiveStatusMenuId(activeStatusMenuId === rec.id ? null : rec.id)} className={`w-full px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-between ${isOverdue ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                            {isOverdue ? 'Overdue' : 'Pending'} <svg className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                         </button>
                         {activeStatusMenuId === rec.id && (
                           <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 animate-in zoom-in-95 text-left">
                              <button onClick={() => updateRecordStatus(rec, 'Filed')} className="w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg hover:bg-emerald-50 text-emerald-600">Mark Filed</button>
                           </div>
                         )}
                      </td>
                      <td className="px-4 py-2 text-right whitespace-nowrap">
                         <div className="flex items-center justify-end gap-2">
                            <button 
                               onClick={() => { setViewingRecord(rec); setIsViewModalOpen(true); }} 
                               className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-sm group/btn"
                               title="View Details"
                            >
                               <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg>
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
      
      {/* Detail Modals */}
      {isViewModalOpen && viewingRecord && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col animate-in zoom-in-95">
              <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                 <div className="min-w-0">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight truncate">{viewingRecord.clientName}</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Ref: {viewingRecord.referenceNo}</p>
                 </div>
                 <div className="flex items-center gap-2">
                    <button onClick={() => { setSelectedRecord(viewingRecord); setIsModalOpen(true); setIsViewModalOpen(false); }} className="bg-indigo-600 text-white font-black uppercase text-[10px] px-6 py-3 rounded-xl shadow-lg">Modify Record</button>
                    <button onClick={() => setIsViewModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-colors"><svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg></button>
                 </div>
              </div>
              <div className="p-10 grid grid-cols-2 gap-8">
                 <div><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Entity GSTIN</p><p className="text-base font-black text-indigo-600 font-mono">{clients.find(c => c.id === viewingRecord.clientId)?.gstProfile?.gstin || 'N/A'}</p></div>
                 <div><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Section</p><p className="text-base font-black text-slate-900">U/s {viewingRecord.section}</p></div>
                 <div><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Tax Period</p><p className="text-base font-black text-slate-900 uppercase">{viewingRecord.taxPeriod || 'N/A'}</p></div>
                 <div><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Notice Date</p><p className="text-base font-black text-slate-900">{formatDisplayDate(viewingRecord.issuedDate)}</p></div>
                 <div><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Deadline</p><p className="text-base font-black text-red-600">{formatDisplayDate(viewingRecord.dueDate)}</p></div>
                 <div className="col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Staff Remarks</p>
                    <p className="text-sm font-medium text-slate-600 italic leading-relaxed">{viewingRecord.remarks || 'No notes found.'}</p>
                 </div>
              </div>
              <div className="p-8 border-t border-slate-100 flex justify-end gap-3 shrink-0"><button onClick={() => setIsViewModalOpen(false)} className="px-8 py-3 bg-slate-100 text-slate-600 font-black uppercase text-[10px] rounded-xl transition-colors">Close</button></div>
           </div>
        </div>
      )}

      <NoticeForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} clients={clients} category="Notice" initialData={selectedRecord} />
    </div>
  );
};

export default NoticePending;
