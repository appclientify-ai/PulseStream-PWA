
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ItMasterPortfolio from './ItMasterPortfolio';
import ITClientFormModal from '../Clientform/ITClientFormModal';
import { api } from '../../services/api.ts';
import { Client } from '../../types';

const ITPortfolio: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);

  const loadData = useCallback(async () => {
    try {
      const data = await api.getClients();
      setClients(data.filter(c => !!c.itProfile));
    } catch (err) {
      console.error("IT Vault Sync Error:", err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [refreshTrigger, loadData]);

  const filteredCount = useMemo(() => {
    const s = search.toLowerCase();
    return clients.filter(c => 
      c.legalName.toLowerCase().includes(s) || 
      (c.itProfile?.pan || '').toLowerCase().includes(s)
    ).length;
  }, [clients, search]);

  const handleRefresh = () => {
    setRefreshTrigger(p => p + 1);
  };

  return (
    <div className="flex flex-col h-full space-y-4 pb-4 overflow-hidden animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        
        <div className="flex items-center gap-3 px-4 border-r border-slate-100 hidden md:flex shrink-0">
            <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              {filteredCount} Master Files
            </span>
        </div>

        <div className="relative flex-1 group w-full">
          <input 
            type="text" 
            placeholder="Search IT Portfolio by PAN, Name or Father's Name..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600/10 transition-all outline-none" 
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-emerald-600 text-white font-black uppercase tracking-tight px-8 h-11 rounded-xl shadow-lg hover:bg-slate-900 transition-all flex items-center gap-2 text-xs shrink-0"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
          Add Profile
        </button>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <ItMasterPortfolio 
          key={refreshTrigger} 
          externalSearch={search} 
          onDataChange={handleRefresh}
        />
      </div>

      <ITClientFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={() => handleRefresh()} 
      />
    </div>
  );
};

export default ITPortfolio;
