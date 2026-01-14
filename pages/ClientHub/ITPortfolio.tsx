
import React, { useState, useMemo } from 'react';
import ItMasterPortfolio from './ItMasterPortfolio.tsx';
import ITClientFormModal from '../Clientform/ITClientFormModal.tsx';
import { useClientData } from '../../hooks/useClientData.ts';

const ITPortfolio: React.FC = () => {
  const { clients, isLoading, fetchData } = useClientData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const stats = useMemo(() => {
    const itClients = clients.filter(c => !!c.itProfile);
    const total = itClients.length;
    const individual = itClients.filter(c => c.itProfile?.category === 'Individual').length;
    return { total, individual };
  }, [clients]);

  return (
    <div className="flex flex-col h-full space-y-4 pb-4 overflow-hidden animate-in fade-in duration-500">
      
      {/* High-Density Command Strip */}
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total IT</p>
            <p className="text-xl font-black text-slate-900 leading-none">{stats.total}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Indiv.</p>
            <p className="text-xl font-black text-emerald-600 leading-none">{stats.individual}</p>
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

        <button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-emerald-600 text-white font-black uppercase tracking-tight px-8 h-12 rounded-xl shadow-lg hover:bg-slate-900 transition-all flex items-center gap-2 text-xs shrink-0"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
          Add Profile
        </button>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <ItMasterPortfolio 
          externalSearch={search} 
          onDataChange={fetchData}
        />
      </div>

      <ITClientFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={() => fetchData()} 
      />
    </div>
  );
};

export default ITPortfolio;
