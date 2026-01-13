
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import GstMasterPortfolio from './GstMasterPortfolio.tsx';
import GSTClientFormModal from '../Clientform/GSTClientFormModal.tsx';
import { api } from '../../services/api.ts';
import { Client, LitigationRecord } from '../../types.ts';

const GSTPortfolio: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [isUtilityOpen, setIsUtilityOpen] = useState(false);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger(p => p + 1);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getClients();
        setClients(data.filter(c => !!c.gstProfile));
      } catch (err) {
        console.error("Vault Sync Error:", err);
      }
    };
    load();
  }, [refreshTrigger]);

  const stats = useMemo(() => {
    return {
      total: clients.length,
      active: clients.filter(c => c.status === 'Active' || c.status === 'Active Filing').length,
      litigation: clients.filter(c => c.status === 'Litigation').length,
      inactive: clients.filter(c => c.status === 'Inactive').length
    };
  }, [clients]);

  const handleExport = () => {
    const data = JSON.stringify(clients, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GST_Portfolio_Export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    setIsUtilityOpen(false);
  };

  return (
    <div className="flex flex-col h-full space-y-4 pb-4 overflow-hidden animate-in fade-in duration-500">
      
      {/* Dynamic Command Strip */}
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Vault</p>
            <p className="text-xl font-black text-slate-900 leading-none">{stats.total}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">Active</p>
            <p className="text-xl font-black text-indigo-600 leading-none">{stats.active}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Litigation</p>
            <p className="text-xl font-black text-rose-600 leading-none">{stats.litigation}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Inactive</p>
            <p className="text-xl font-black text-slate-400 leading-none">{stats.inactive}</p>
          </div>
        </div>

        <div className="relative flex-1 group w-full">
          <input 
            type="text" 
            placeholder="Search GST Portfolio by Trade Name, GSTIN or PAN..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3.5 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-4 focus:ring-indigo-50 transition-all outline-none" 
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <button 
              onClick={() => setIsUtilityOpen(!isUtilityOpen)}
              className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center shadow-sm"
              title="Bulk Utilities"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            </button>
            
            {isUtilityOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-2 animate-in zoom-in-95 origin-top-right">
                 <button onClick={handleExport} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 rounded-xl transition-all text-left group">
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-white"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Export Excel/CSV</span>
                 </button>
                 <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 rounded-xl transition-all text-left group">
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-white"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Import Template</span>
                 </button>
              </div>
            )}
          </div>

          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-indigo-600 text-white font-black uppercase tracking-widest px-8 h-12 rounded-xl shadow-lg hover:bg-slate-900 transition-all text-xs shrink-0 flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            Enroll Client
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <GstMasterPortfolio 
          key={refreshTrigger} 
          externalSearch={search} 
          onDataChange={handleRefresh}
        />
      </div>

      <GSTClientFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={() => handleRefresh()} 
      />
    </div>
  );
};

export default GSTPortfolio;
