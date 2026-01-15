
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ItMasterPortfolio from './ItMasterPortfolio';
import ITClientFormModal from '../Clientform/ITClientFormModal';
import { api } from '../../services/api.ts';
import { Client } from '../../types';
import { ModuleStatCard } from '../../components/DashboardUI';

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
    const total = clients.length;
    const individual = clients.filter(c => c.itProfile?.category === 'Individual').length;
    const others = total - individual;
    return { total, individual, others };
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
    <div className="flex flex-col h-full space-y-8 pb-4 overflow-hidden animate-in fade-in duration-500">
      
      {/* Summary Section - Dashboard UI Style */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ModuleStatCard 
              title="IT Portfolio" 
              icon="💻" 
              stats={[
                  { label: 'Total Vault', value: stats.total },
                  { label: 'Active Files', value: stats.total }
              ]}
              chartData={{ value: stats.total, total: stats.total }}
          />
          <ModuleStatCard 
              title="Individual Base" 
              icon="👤" 
              stats={[
                  { label: 'Files', value: stats.individual, color: 'text-indigo-600' },
                  { label: 'Ratio', value: `${Math.round((stats.individual/stats.total)*100)}%` }
              ]}
              chartData={{ value: stats.individual, total: stats.total }}
          />
          <ModuleStatCard 
              title="Audit Potential" 
              icon="🔍" 
              stats={[
                  { label: 'Non-Individual', value: stats.others, color: 'text-amber-600' },
                  { label: 'Audit Ready', value: '14' }
              ]}
          />
      </section>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="relative flex-1 group w-full">
          <input 
            type="text" 
            placeholder="Search IT Portfolio by PAN, Name or Father's Name..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3.5 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-4 focus:ring-indigo-50 transition-all outline-none" 
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select 
            value={categoryFilter} 
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border-none rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-indigo-600 text-white font-black uppercase tracking-widest px-8 h-12 rounded-xl shadow-lg hover:bg-slate-900 transition-all text-xs flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            Add Profile
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
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
