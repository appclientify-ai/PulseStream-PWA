
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

  const handleExportCSV = () => {
    const headers = ["Trade Name", "Legal Name", "Mobile", "Email", "GSTIN", "PAN", "Status"].join(",");
    const rows = clients.map(c => [c.tradeName, c.legalName, c.mobile, c.email, c.gstProfile?.gstin, c.gstProfile?.pan, c.status].map(v => `"${v || ''}"`).join(",")).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `GST_Portfolio.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsUtilityOpen(false);
  };

  return (
    <div className="flex flex-col h-full space-y-4 pb-4 overflow-hidden animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-4 px-4 border-r border-slate-100 hidden md:flex shrink-0">
            <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              {clients.length} Total Entities
            </span>
        </div>
        <div className="relative flex-1 group w-full">
          <input 
            type="text" 
            placeholder="Search GST Portfolio by Trade Name, GSTIN or PAN..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-4 focus:ring-indigo-50 transition-all outline-none" 
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setIsUtilityOpen(!isUtilityOpen)} className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 flex items-center justify-center">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          </button>
          
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-indigo-600 text-white font-black uppercase tracking-widest px-8 h-12 rounded-xl shadow-lg hover:bg-slate-900 transition-all text-xs flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            Add GST Client
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <GstMasterPortfolio key={refreshTrigger} externalSearch={search} onDataChange={handleRefresh} />
      </div>

      <GSTClientFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={() => handleRefresh()} />
      {isUtilityOpen && <div className="fixed inset-0 z-40" onClick={() => setIsUtilityOpen(false)} />}
    </div>
  );
};

export default GSTPortfolio;
