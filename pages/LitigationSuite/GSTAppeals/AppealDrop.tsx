import React, { useState, useEffect, useMemo } from 'react';
import { LitigationRecord, Client } from '../../../types';
import { mockBackend } from '../../../services/mockBackend';
import Loader from '../../../components/Loader';
import NoticeForm from '../../Clientform/NoticeForm';

const AppealDrop: React.FC = () => {
  const [records, setRecords] = useState<LitigationRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<Partial<LitigationRecord> | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<LitigationRecord | null>(null);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [recs, clis] = await Promise.all([
        mockBackend.getLitigationRecords(),
        mockBackend.getClients()
      ]);
      setRecords(recs.filter(r => r.category === 'Appeal' && r.status === 'Drop'));
      setClients(clis);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSave = async (data: Partial<LitigationRecord>) => {
    await mockBackend.saveLitigationRecord({ ...data, category: 'Appeal' });
    setIsModalOpen(false);
    setIsViewModalOpen(false);
    fetchAll();
  };

  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
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
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Appeal Reliefs</p>
            <p className="text-xl font-black text-slate-900 leading-none">{records.length}</p>
          </div>
        </div>
        <div className="relative flex-1 group w-full">
          <input type="text" placeholder="Search relief orders..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse table-fixed min-w-[1250px]">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[60px]">S.No.</th>
                <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[220px]">Trade Name</th>
                <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[180px]">GSTIN</th>
                <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[120px]">Order U/s</th>
                <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[150px]">Order Ref No</th>
                <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[120px]">Order Date</th>
                <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[140px] text-center">Status</th>
                <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr><td colSpan={8} className="py-32 text-center text-slate-300 font-black uppercase tracking-[0.2em] text-sm">No relief cases found</td></tr>
              ) : (
                filteredRecords.map((rec, idx) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-4 py-5 text-[11px] font-black text-slate-300">{(idx + 1).toString().padStart(2, '0')}</td>
                    <td className="px-4 py-5 text-[11px] font-black text-slate-900 uppercase truncate" title={rec.clientName}>{rec.clientName}</td>
                    <td className="px-4 py-5 text-[11px] font-black text-indigo-600 font-mono tracking-widest">{clients.find(c => c.id === rec.clientId)?.gstProfile?.gstin || 'N/A'}</td>
                    <td className="px-4 py-5 text-[11px] font-black text-slate-600 uppercase">{rec.section || '---'}</td>
                    <td className="px-4 py-5 text-[11px] font-black text-slate-700 uppercase truncate">{rec.referenceNo}</td>
                    <td className="px-4 py-5 text-[11px] font-black text-emerald-600 uppercase">{formatDisplayDate(rec.orderDate || rec.issuedDate)}</td>
                    <td className="px-4 py-5 text-center">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                         rec.isDemandPaid ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                       }`}>
                         {rec.isDemandPaid ? 'Demand Paid' : 'Relief Granted'}
                       </span>
                    </td>
                    <td className="px-4 py-5 text-right whitespace-nowrap">
                       <button onClick={() => { setViewingRecord(rec); setIsViewModalOpen(true); }} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center shadow-sm">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg>
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isViewModalOpen && viewingRecord && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col animate-in zoom-in-95">
              <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
                 <div className="min-w-0">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight truncate">{viewingRecord.clientName}</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Legal Identity: {clients.find(c => c.id === viewingRecord.clientId)?.legalName || '---'}</p>
                 </div>
                 <div className="flex items-center gap-2">
                    <button onClick={() => { setSelectedRecord(viewingRecord); setIsModalOpen(true); }} className="bg-indigo-600 text-white font-black uppercase text-[10px] px-6 py-3 rounded-xl shadow-lg hover:bg-slate-900 transition-all">Edit Record</button>
                    <button onClick={() => setIsViewModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-colors"><svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg></button>
                 </div>
              </div>
              <div className="p-10 grid grid-cols-2 gap-8">
                 <div><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Outcome Status</p><p className={`text-base font-black uppercase ${viewingRecord.isDemandPaid ? 'text-orange-600' : 'text-emerald-600'}`}>{viewingRecord.isDemandPaid ? 'DEMAND PAID' : 'CLOSED (RELIEF)'}</p></div>
                 <div><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Order Section</p><p className="text-base font-black text-slate-900">U/s {viewingRecord.section}</p></div>
                 <div><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Order Ref No</p><p className="text-base font-black text-slate-900 uppercase">{viewingRecord.referenceNo}</p></div>
                 <div><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Order Date</p><p className="text-base font-black text-slate-900">{formatDisplayDate(viewingRecord.orderDate || viewingRecord.issuedDate)}</p></div>
                 <div className="col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-100"><p className="text-[10px] font-black uppercase text-slate-400 mb-2">Internal Staff Remarks</p><p className="text-sm font-medium text-slate-600 italic leading-relaxed">{viewingRecord.remarks || 'No notes.'}</p></div>
              </div>
              <div className="p-8 border-t border-slate-100 flex justify-end gap-3 shrink-0"><button onClick={() => setIsViewModalOpen(false)} className="px-8 py-3 bg-slate-100 text-slate-600 font-black uppercase text-[10px] rounded-xl transition-colors">Close</button></div>
           </div>
        </div>
      )}

      <NoticeForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} clients={clients} category="Appeal" initialData={selectedRecord} />
    </div>
  );
};

export default AppealDrop;