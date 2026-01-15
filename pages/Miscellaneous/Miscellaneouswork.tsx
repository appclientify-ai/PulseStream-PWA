
import React, { useState, useEffect, useMemo } from 'react';
import { MiscWorkRecord } from '../../types';
import { api } from '../../services/api.ts';
import WorkForm from '../Clientform/workForm';
import Loader from '../../components/Loader';

const Miscellaneouswork: React.FC = () => {
  const [records, setRecords] = useState<MiscWorkRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MiscWorkRecord | null>(null);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const data = await api.getMiscWork();
      setRecords(data);
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchRecords(); }, []);

  const filteredRecords = useMemo(() => {
    const s = search.toLowerCase();
    return records.filter(r => (r.clientName || '').toLowerCase().includes(s) || (r.description || '').toLowerCase().includes(s));
  }, [records, search]);

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-3 px-4 border-r border-slate-100 hidden md:flex shrink-0">
            <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{filteredRecords.length} Tasks active</span>
        </div>
        <div className="relative flex-1 group w-full">
          <input type="text" placeholder="Search miscellaneous queue..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 font-bold text-sm text-slate-900 focus:ring-4 focus:ring-indigo-50 transition-all outline-none" />
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <button onClick={() => { setSelectedRecord(null); setIsFormOpen(true); }} className="bg-indigo-600 text-white font-black uppercase tracking-widest px-8 h-11 rounded-xl shadow-lg hover:bg-slate-900 transition-all text-xs flex items-center gap-2 shrink-0">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
          Record task
        </button>
      </div>

      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse table-fixed min-w-[1100px]">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[60px]">S.No</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[240px]">Entity identity</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[300px]">Description</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center w-[140px]">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[140px]">Staff</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((rec, idx) => (
                <tr key={rec.id} className="hover:bg-indigo-50/20 transition-all text-[12px]">
                  <td className="px-6 py-4 text-slate-300 font-black">{(idx + 1).toString().padStart(2, '0')}</td>
                  <td className="px-6 py-4 font-black text-slate-900 uppercase truncate" title={rec.clientName}>{rec.clientName}</td>
                  <td className="px-6 py-4 font-bold text-slate-600 truncate">{rec.description}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${rec.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>{rec.status}</span>
                  </td>
                  <td className="px-6 py-4 font-black text-slate-700 truncate">{rec.assignedTo || '---'}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { setSelectedRecord(rec); setIsFormOpen(true); }} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center ml-auto group-hover:scale-110 shadow-sm"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <WorkForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSave={async(data)=>{await api.saveMiscWork(data); setIsFormOpen(false); fetchRecords();}} initialData={selectedRecord} />
    </div>
  );
};

export default Miscellaneouswork;
