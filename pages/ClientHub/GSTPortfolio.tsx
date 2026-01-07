
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import GstMasterPortfolio from './GstMasterPortfolio.tsx';
import GSTClientFormModal from '../Clientform/GSTClientFormModal.tsx';
import { api } from '../../services/api.ts';
import { Client } from '../../types.ts';

const GSTPortfolio: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger(p => p + 1);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getClients();
        setClients(data.filter(c => !!c.gstProfile));
      } catch (err) {
        console.error("Sync Error:", err);
      }
    };
    load();
  }, [refreshTrigger]);

  const stats = useMemo(() => {
    const total = clients.length;
    const active = clients.filter(c => c.status === 'Active Filing').length;
    return { total, active };
  }, [clients]);

  return (
    <div className="flex flex-col h-full space-y-3 pb-4 overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center gap-3 bg-white p-2.5 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-4 px-2 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-black text-slate-400 uppercase">Vault</span>
            <span className="text-lg font-black text-slate-900">{stats.total}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-black text-green-500 uppercase">Active</span>
            <span className="text-lg font-black text-green-600">{stats.active}</span>
          </div>
        </div>

        <div className="relative flex-1 group min-w-[180px] w-full">
          <input type="text" placeholder="Search master records..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none" />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto lg:ml-0">
          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white font-black uppercase tracking-tight px-6 h-10 rounded-xl shadow-lg hover:bg-slate-900 transition-all flex items-center gap-2 text-sm whitespace-nowrap">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            Add Client
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <GstMasterPortfolio 
          key={refreshTrigger} 
          externalSearch={search} 
          hideInternalSearch={true} 
          onDataChange={handleRefresh}
        />
      </div>

      <GSTClientFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={() => handleRefresh()} />
    </div>
  );
};

export default GSTPortfolio;
