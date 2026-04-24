
import React, { useState, useEffect, useMemo } from 'react';
import { LitigationRecord, Client, LitigationStatus, LitigationCategory } from '../../types';
import { api } from '../../services/api.ts';
import Loader from '../../components/Loader';
import NoticeForm from '../Clientform/NoticeForm';

interface LitigationModuleProps {
  category: LitigationCategory;
  status: LitigationStatus;
}

const LitigationModule: React.FC<LitigationModuleProps> = ({ category, status }) => {
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
        api.getLitigationRecords(),
        api.getClients()
      ]);
      setRecords(recs.filter(r => r.category === category && r.status === status));
      setClients(clis);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [category, status]);

  const handleSave = async (data: Partial<LitigationRecord>) => {
    await api.saveLitigationRecord({ ...data, category });
    setIsModalOpen(false);
    setIsViewModalOpen(false);
    fetchAll();
  };

  const updateRecordStatus = async (id: string, newStatus: LitigationStatus) => {
    const rec = records.find(r => r.id === id);
    if (rec) {
      await api.saveLitigationRecord({ ...rec, status: newStatus });
      fetchAll();
    }
  };

  const filteredRecords = useMemo(() => {
    const s = search.toLowerCase();
    return records.filter(r => 
      (r.clientName || '').toLowerCase().includes(s) || 
      (r.referenceNo || '').toLowerCase().includes(s)
    );
  }, [records, search]);

  if (isLoading) return <Loader />;

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col space-y-4 overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="relative flex-1 group w-full">
          <input type="text" placeholder={`Search ${category}...`} value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        {status === 'Pending' && (
          <button onClick={() => { setSelectedRecord(null); setIsModalOpen(true); }} className="bg-indigo-600 text-white font-black uppercase tracking-widest px-8 h-11 rounded-xl shadow-lg hover:bg-slate-900 transition-all text-xs flex items-center gap-2 shrink-0">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            Add Case
          </button>
        )}
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse table-auto overflow-hidden min-w-[1100px]">
            <thead className="whitespace-nowrap sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="whitespace-nowrap px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[70px]">S.No.</th>
                <th className="whitespace-nowrap px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[240px]">Entity</th>
                <th className="whitespace-nowrap px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[200px]">Ref No</th>
                <th className="whitespace-nowrap px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[140px]">Date</th>
                <th className="whitespace-nowrap px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((rec, idx) => (
                <tr key={rec.id} className="hover:bg-slate-50/50 transition-all text-[12px]">
                  <td className="whitespace-nowrap px-6 py-5 text-slate-300 font-black">{(idx + 1).toString().padStart(2, '0')}</td>
                  <td className="whitespace-nowrap px-6 py-5 font-black text-slate-900 uppercase truncate">{rec.clientName}</td>
                  <td className="whitespace-nowrap px-6 py-5 font-black text-slate-600 uppercase truncate">{rec.referenceNo}</td>
                  <td className="whitespace-nowrap px-6 py-5 font-black text-slate-400">{rec.issuedDate}</td>
                  <td className="px-6 py-5 text-right whitespace-nowrap">
                     <button onClick={() => { setViewingRecord(rec); setIsViewModalOpen(true); }} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 flex items-center justify-center">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 12z" /></svg>
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <NoticeForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} clients={clients} category={category} initialData={selectedRecord} />
    </div>
  );
};

export default LitigationModule;
