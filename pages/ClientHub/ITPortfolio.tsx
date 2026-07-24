
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
      setClients((data || []).filter(c => c && c.itProfile));
    } catch (err) {
      console.error("IT Vault Sync Error:", err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [refreshTrigger, loadData]);


  useEffect(() => {
    const syncHandler = () => loadData();
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, [loadData]);
  const stats = useMemo(() => {
    const total = clients.length;
    const active = (clients || []).filter(c => c?.status === 'Active' || c?.status === 'Active Filing').length;
    const inactive = (clients || []).filter(c => c?.status === 'Inactive').length;
    return { total, active, inactive };
  }, [clients]);

  const handleRefresh = () => {
    setRefreshTrigger(p => p + 1);
  };

  return (
    <div className="flex flex-col h-full space-y-2 landscape:space-y-1 pb-2 overflow-hidden animate-in fade-in duration-500">
      
      {/* Compact stats strip for Mobile & Tablet */}
      <div className="flex items-center justify-between w-full md:hidden gap-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl shadow-xs text-xs font-bold text-slate-700 shrink-0">
        <span className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-tight">Total: <strong className="font-black text-slate-900">{stats.total}</strong></span>
        <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-tight">Active: <strong className="font-black text-emerald-900">{stats.active}</strong></span>
        <span className="bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-tight">Inactive: <strong className="font-black text-amber-900">{stats.inactive}</strong></span>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-3 landscape:gap-1 bg-white p-2.5 landscape:p-1 rounded-[1.5rem] landscape:rounded-xl border border-slate-200 shadow-sm shrink-0">
        
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Vault</p>
            <p className="text-xl font-black text-slate-900 leading-none">{stats.total}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Active</p>
            <p className="text-xl font-black text-emerald-600 leading-none">{stats.active}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Inactive</p>
            <p className="text-xl font-black text-amber-600 leading-none">{stats.inactive}</p>
          </div>
        </div>

        <div className="relative flex-1 group w-full">
          <input 
            type="text" 
            placeholder="Search IT Portfolio by PAN, Name or Father's Name..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-2.5 landscape:py-1 pl-10 pr-3 font-bold text-xs text-slate-900 focus:ring-2 focus:ring-emerald-100 transition-all outline-none" 
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-emerald-600 text-white font-black uppercase tracking-tight px-5 landscape:px-3 h-10 landscape:h-8 rounded-xl shadow-md hover:bg-slate-900 transition-all flex items-center gap-1.5 text-[11px] landscape:text-[10px] shrink-0"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            Add Profile
          </button>
        </div>
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
