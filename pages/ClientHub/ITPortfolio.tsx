
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ItMasterPortfolio from './ItMasterPortfolio';
import ITClientFormModal from '../Clientform/ITClientFormModal';
import { api } from '../../services/api.ts';
import { Client } from '../../types';

const ITPortfolio: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
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

  const stats = useMemo(() => {
    return {
      total: clients.length,
      // Fix: Comparison between status and 'Active' is now valid as 'Active' is included in ClientStatus union
      active: clients.filter(c => c.status === 'Active' || c.status === 'Active Filing').length,
      inactive: clients.filter(c => c.status === 'Inactive').length
    };
  }, [clients]);

  const categories = useMemo(() => {
    const cSet = new Set<string>();
    clients.forEach(c => {
      if (c.itProfile?.category) cSet.add(c.itProfile.category);
    });
    return Array.from(cSet).sort();
  }, [clients]);

  const handleRefresh = () => {
    setRefreshTrigger(p => p + 1);
  };

  return (
    <div className="flex flex-col h-full space-y-4 pb-4 overflow-hidden animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
            <p className="text-xl font-black text-slate-900 leading-none">{stats.total}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Active</p>
            <p className="text-xl font-black text-emerald-600 leading-none">{stats.active}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Inactive</p>
            <p className="text-xl font-black text-slate-400 leading-none">{stats.inactive}</p>
          </div>
        </div>

        <div className="relative flex-1 group w-full">
          <input 
            type="text" 
            placeholder="Search IT Portfolio by PAN, Name or Father's Name..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3.5 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600/10 transition-all outline-none" 
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select 
            value={categoryFilter} 
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border-none rounded-xl px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-600 focus:ring-2 focus:ring-emerald-600/10 outline-none cursor-pointer"
          >
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-emerald-600 text-white font-black uppercase tracking-tight px-8 h-11 rounded-xl shadow-lg hover:bg-slate-900 transition-all flex items-center gap-2 text-xs shrink-0"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            Add IT Client
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <ItMasterPortfolio 
          key={refreshTrigger} 
          externalSearch={search} 
          categoryFilter={categoryFilter}
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