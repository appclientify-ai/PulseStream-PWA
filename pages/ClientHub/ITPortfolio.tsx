import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ItMasterPortfolio from './ItMasterPortfolio';
import ITClientFormModal from '../Clientform/ITClientFormModal';
import { mockBackend } from '../../services/mockBackend';
import { Client, ClientStatus } from '../../types';

const CSV_HEADERS = [
  "Legal Name", "Trade Name", "Mobile", "Email", "Client Status",
  "PAN", "IT Category", "Portal Username", "Portal Password",
  "Bank Name", "Account No", "IFSC", "Remarks"
];

const ITPortfolio: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [showDataOptions, setShowDataOptions] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  const loadData = useCallback(async () => {
    const data = await mockBackend.getClients();
    setClients(data.filter(c => !!c.itProfile));
  }, []);

  useEffect(() => {
    loadData();
  }, [refreshTrigger, loadData]);

  const stats = useMemo(() => {
    const total = clients.length;
    const active = clients.filter(c => c.status === 'Active').length;
    const inactive = clients.filter(c => c.status === 'Inactive').length;
    return { total, active, inactive };
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
    const rows = clients.map(c => [
      c.legalName,
      c.tradeName,
      c.mobile,
      c.email || "",
      c.status,
      c.itProfile?.pan || "",
      c.itProfile?.category || "",
      c.itProfile?.username || "",
      c.itProfile?.password || "",
      c.bankDetails?.bankName || "",
      c.bankDetails?.accountNo || "",
      c.bankDetails?.ifsc || "",
      `"${(c.remarks || "").replace(/"/g, '""')}"`
    ]);
    const csvContent = [CSV_HEADERS, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `IT_Portfolio_Full_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    setShowDataOptions(false);
  };

  const handleImportTemplateCSV = () => {
    const csvContent = [CSV_HEADERS].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "IT_Clientify_Template.csv");
    link.click();
    setShowDataOptions(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').slice(1);
      const allClients = await mockBackend.getClients();
      
      let newCount = 0;
      let updatedCount = 0;
      
      for (const row of rows) {
        if (!row.trim()) continue;
        const cols = row.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length < 6) continue;
        
        const pan = cols[5];
        if (!pan) continue;

        const existing = allClients.find(c => c.itProfile?.pan === pan);

        try {
          await mockBackend.saveClient({
            id: existing?.id,
            legalName: cols[0],
            tradeName: cols[1],
            mobile: cols[2],
            email: cols[3],
            status: (cols[4] as ClientStatus) || 'Active',
            itProfile: {
              pan,
              category: cols[6] || 'Individual',
              username: cols[7] || pan,
              password: cols[8] || '',
            },
            bankDetails: {
              bankName: cols[9] || '',
              accountNo: cols[10] || '',
              ifsc: cols[11] || ''
            },
            remarks: cols[12]
          });
          existing ? updatedCount++ : newCount++;
        } catch (err) {}
      }
      alert(`Import Result:\n• New: ${newCount}\n• Updated: ${updatedCount}`);
      handleRefresh();
      setShowDataOptions(false);
    };
    reader.readAsText(file);
    event.target.value = ''; 
  };

  return (
    <div className="flex flex-col h-full space-y-3 pb-4 overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center gap-3 bg-white p-2.5 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        
        {/* Status Indicators */}
        <div className="flex items-center gap-4 px-2 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="flex flex-col items-center min-w-[32px]">
            <span className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Total</span>
            <span className="text-lg font-black text-slate-900 leading-none">{stats.total}</span>
          </div>
          <div className="flex flex-col items-center min-w-[32px]">
            <span className="text-[9px] font-black text-emerald-500 uppercase leading-none mb-1">Active</span>
            <span className="text-lg font-black text-emerald-600 leading-none">{stats.active}</span>
          </div>
          <div className="flex flex-col items-center min-w-[32px]">
            <span className="text-[9px] font-black text-red-500 uppercase leading-none mb-1">Inact</span>
            <span className="text-lg font-black text-red-600 leading-none">{stats.inactive}</span>
          </div>
        </div>

        {/* Unified Search */}
        <div className="relative flex-1 group min-w-[180px] w-full">
          <input type="text" placeholder="Search PAN or legal name..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600/10 transition-all outline-none" />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 shrink-0">
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border-none rounded-xl px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-600 focus:ring-2 focus:ring-emerald-600/10 outline-none">
            <option value="All">Category: All</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 ml-auto lg:ml-0">
          <div className="relative">
            <button onClick={() => setShowDataOptions(!showDataOptions)} className="h-10 w-10 flex items-center justify-center bg-slate-100 rounded-xl text-slate-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
               <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7zm4 4h8m-8 4h5" /></svg>
            </button>
            {showDataOptions && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-2 animate-in zoom-in-95">
                <button onClick={handleImportTemplateCSV} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 rounded-xl">Download Template</button>
                <label className="w-full block px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-slate-50 rounded-xl cursor-pointer">
                  Bulk Import IT <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>
                <button onClick={handleExportCSV} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 rounded-xl border-t border-slate-50 mt-1">Export IT Data</button>
              </div>
            )}
          </div>

          <button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 text-white font-black uppercase tracking-tight px-4 h-10 rounded-xl shadow-lg hover:bg-slate-900 transition-all flex items-center gap-2 text-sm">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            <span className="hidden sm:inline">Add IT Client</span>
            <span className="sm:hidden">+</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <ItMasterPortfolio 
          key={refreshTrigger} 
          externalSearch={search} 
          hideInternalSearch={true} 
          categoryFilter={categoryFilter}
          onDataChange={handleRefresh}
        />
      </div>

      <ITClientFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={() => handleRefresh()} />
    </div>
  );
};

export default ITPortfolio;