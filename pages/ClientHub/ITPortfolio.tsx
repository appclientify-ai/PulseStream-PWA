
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ItMasterPortfolio from './ItMasterPortfolio';
import ITClientFormModal from '../Clientform/ITClientFormModal';
import { api } from '../../services/api.ts';
import { Client } from '../../types';

interface ITPortfolioProps {
  onViewChange?: (view: string, extra?: any) => void;
}

const ITPortfolio: React.FC<ITPortfolioProps> = ({ onViewChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [clients, setClients] = useState<Client[]>([]);
  const [isUtilityOpen, setIsUtilityOpen] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

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

  const handleExportCSV = () => {
    const headers = ["Legal Name", "Mobile", "Email", "PAN", "Category", "User ID", "Password", "Status", "Father Name", "DOB", "Nature of Work"].join(",");
    const rows = clients.map(c => [
      c.legalName, c.mobile, c.email, c.itProfile?.pan, c.itProfile?.category,
      c.itProfile?.username, c.itProfile?.password, c.status,
      c.itProfile?.fatherName, c.itProfile?.dob, c.itProfile?.natureOfWork
    ].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `IT_Portfolio_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsUtilityOpen(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim() !== '');
      if (lines.length < 2) return;
      
      const importedClients: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
        if (cols.length < 4) continue;
        
        importedClients.push({
          legalName: cols[0],
          mobile: cols[1],
          email: cols[2],
          status: cols[7] || 'Active',
          itProfile: {
            pan: cols[3],
            category: cols[4] || 'Individual',
            username: cols[5] || cols[3],
            password: cols[6],
            fatherName: cols[8],
            dob: cols[9],
            natureOfWork: cols[10] || 'Others',
            advisoryWork: { itrFiling: true, taxAudit: false, balanceSheet: false, appeals: false }
          }
        });
      }

      if (confirm(`Attempting to import ${importedClients.length} IT clients. Proceed?`)) {
        for (const c of importedClients) {
          await api.saveClient(c);
        }
        handleRefresh();
        alert('Bulk import completed.');
      }
    };
    reader.readAsText(file);
    if (importFileRef.current) importFileRef.current.value = '';
    setIsUtilityOpen(false);
  };

  return (
    <div className="flex flex-col h-full space-y-4 pb-4 overflow-hidden animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        
        <div className="flex items-center gap-4 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
            <p className="text-xl font-black text-slate-900 leading-none">{stats.total}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-4">
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Active</p>
            <p className="text-xl font-black text-emerald-600 leading-none">{stats.active}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-4">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Inact.</p>
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
          <div className="relative">
             <button onClick={() => setIsUtilityOpen(!isUtilityOpen)} className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-emerald-600 flex items-center justify-center shadow-sm transition-all hover:bg-white"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></button>
             {isUtilityOpen && (
               <>
                 <div className="fixed inset-0 z-40" onClick={() => setIsUtilityOpen(false)} />
                 <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-2 animate-in zoom-in-95 origin-top-right overflow-hidden">
                    <button onClick={() => importFileRef.current?.click()} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 rounded-xl transition-all text-left group">
                       <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg></div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Bulk Import (CSV)</span>
                    </button>
                    <button onClick={handleExportCSV} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 rounded-xl transition-all text-left group border-t border-slate-50 mt-1">
                       <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Export All (CSV)</span>
                    </button>
                 </div>
               </>
             )}
             <input type="file" ref={importFileRef} className="hidden" accept=".csv" onChange={handleImport} />
          </div>
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
          onViewDetail={(c) => onViewChange?.('it-view-detail', c)}
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
