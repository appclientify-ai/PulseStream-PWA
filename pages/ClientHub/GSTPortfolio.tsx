import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { formatDate } from '../../exportUtils';
import GstMasterPortfolio from './GstMasterPortfolio.tsx';
import GSTClientFormModal from '../Clientform/GSTClientFormModal.tsx';
import { api } from '../../services/api.ts';
import { Client, GstRegType, GstFilingFreq, ConstitutionType, ClientStatus } from '../../types.ts';
import ErrorBoundary from '../../components/ErrorBoundary';
import { toast } from 'sonner';

const GSTPortfolioContent: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [isUtilityOpen, setIsUtilityOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger(p => p + 1);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getClients();
        setClients((data || []).filter(c => c && c.gstProfile));
      } catch (err) {
        console.error("Vault Sync Error:", err);
      }
    };
    load();
    const syncHandler = () => { console.log('Syncing data...'); load(); };
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, [refreshTrigger]);

  const stats = useMemo(() => {
    return {
      total: (clients || []).length,
      active: (clients || []).filter(c => c?.status === 'Active' || c?.status === 'Active Filing').length,
      litigation: (clients || []).filter(c => c?.status === 'Litigation').length,
      inactive: (clients || []).filter(c => c?.status === 'Inactive').length,
      monthly: (clients || []).filter(c => !c?.gstProfile?.filingFreq || c?.gstProfile?.filingFreq === 'Monthly').length
    };
  }, [clients]);

  const handleExportCSV = () => {
    const headers = [
      "Trade Name", "Legal Name", "Mobile", "Email", "Address", "GSTIN", "PAN", 
      "Portal User ID", "Portal Password", "Constitution", "Registration Date", 
      "Category", "Filing Frequency", "Status"
    ].join(",");

    const rows = (clients || []).filter(Boolean).map(c => [
      c?.tradeName, c?.legalName, c?.mobile, c?.email, c?.address,
      c?.gstProfile?.gstin, c?.gstProfile?.pan, c?.gstProfile?.username, c?.gstProfile?.password,
      c?.gstProfile?.constitution, formatDate(c?.gstProfile?.regDate), c?.gstProfile?.regType,
      c?.gstProfile?.filingFreq, c?.status
    ].map(v => `"${v || ''}"`).join(",")).join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `GST_Portfolio_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsUtilityOpen(false);
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "Trade Name", "Legal Name", "Mobile", "Email", "GSTIN", "Portal User ID", "Portal Password", 
      "Constitution (Proprietorship/Partnership/Company/HUF/Trust/Society/Other)", 
      "Registration Date (YYYY-MM-DD)", "Category (Regular/Composition)", 
      "Filing Frequency (Monthly/Quarterly)", "Status (Active/Inactive)"
    ].join(",");
    
    const csvContent = "data:text/csv;charset=utf-8," + headers;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Clientify_GST_Import_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsUtilityOpen(false);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      const rows = lines.slice(1);
      
      setIsImporting(true);
      let successCount = 0;
      let errorCount = 0;

      for (const row of rows) {
        if (!row.trim()) continue;
        const values = row.split(',').map(v => v.replace(/^"|"$/g, '').trim());
        
        try {
          const clientData: Partial<Client> = {
            tradeName: values[0] || 'Unknown Client',
            legalName: values[1] || values[0] || 'Unknown Entity',
            mobile: values[2] || '',
            email: values[3] || '',
            status: (values[11] as ClientStatus) || 'Active',
            gstProfile: {
              gstin: values[4] || '',
              pan: values[4]?.substring(2, 12) || '',
              username: values[5] || values[4] || '',
              password: values[6] || '',
              constitution: (values[7] as ConstitutionType) || 'Proprietorship',
              regDate: values[8] || '',
              regType: (values[9] as GstRegType) || 'Regular',
              filingFreq: (values[10] as GstFilingFreq) || 'Monthly',
              gstStatus: 'Active',
              stakeholders: []
            }
          };

          if (clientData.gstProfile?.gstin) {
            await api.saveClient(clientData);
            successCount++;
          }
        } catch (err) {
          console.error("Import row failed:", row, err);
          errorCount++;
        }
      }

      setIsImporting(false);
      toast.info(`Import finished. Success: ${successCount}, Errors: ${errorCount}`);
      handleRefresh();
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsUtilityOpen(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-full space-y-2 landscape:space-y-1 pb-2 overflow-hidden animate-in fade-in duration-500">
      
      {/* Compact stats strip for Mobile & Tablet */}
      <div className="flex items-center justify-between w-full md:hidden gap-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl shadow-xs text-xs font-bold text-slate-700 shrink-0 overflow-x-auto no-scrollbar">
        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-tight shrink-0">Total: <strong className="font-black text-slate-900">{stats.total}</strong></span>
        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-tight shrink-0">Active: <strong className="font-black text-emerald-900">{stats.active}</strong></span>
        <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-tight shrink-0">Inactive: <strong className="font-black text-amber-900">{stats.inactive}</strong></span>
        <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-tight shrink-0">Litigation: <strong className="font-black text-rose-900">{stats.litigation}</strong></span>
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
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Litigation</p>
            <p className="text-xl font-black text-rose-600 leading-none">{stats.litigation}</p>
          </div>
        </div>

        <div className="relative flex-1 group w-full">
          <input 
            type="text" 
            placeholder="Search GST Portfolio by Trade Name, GSTIN or PAN..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-2.5 landscape:py-1 pl-10 pr-3 font-bold text-xs text-slate-900 focus:ring-2 focus:ring-indigo-100 transition-all outline-none" 
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <button 
              onClick={() => setIsUtilityOpen(!isUtilityOpen)}
              className={`h-10 landscape:h-8 w-10 landscape:w-8 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center shadow-sm ${isImporting ? 'animate-pulse' : ''}`}
              title="Bulk Utilities"
              disabled={isImporting}
            >
              {isImporting ? (
                <div className="h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="h-5 w-5 landscape:h-4 landscape:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              )}
            </button>
            
            {isUtilityOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] p-2 animate-in zoom-in-95 origin-top-right">
                 <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 rounded-xl transition-all text-left group">
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg></div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Import Clients (CSV)</span>
                       <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Bulk onboarding sequence</span>
                    </div>
                 </button>
                 <button onClick={handleExportCSV} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 rounded-xl transition-all text-left group">
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Export Portfolio</span>
                       <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Vault snapshot download</span>
                    </div>
                 </button>
                 <div className="h-px bg-slate-100 my-1 mx-2" />
                 <button onClick={handleDownloadTemplate} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 rounded-xl transition-all text-left group">
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Import Template</span>
                       <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Excel-ready formatting</span>
                    </div>
                 </button>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleImportCSV} className="hidden" accept=".csv" />
          </div>

          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-indigo-600 text-white font-black uppercase tracking-widest px-5 landscape:px-3 h-10 landscape:h-8 rounded-xl shadow-md hover:bg-slate-900 transition-all text-[11px] landscape:text-[10px] shrink-0 flex items-center gap-1.5"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            Add GST Client
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

const GSTPortfolio: React.FC = () => {
  return (
    <ErrorBoundary fallbackTitle="GST Portfolio Module Error">
      <GSTPortfolioContent />
    </ErrorBoundary>
  );
};

export default GSTPortfolio;
