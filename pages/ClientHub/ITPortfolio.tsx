
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useModuleData } from '../../hooks/useModuleData';
import ItMasterPortfolio from './ItMasterPortfolio';
import ITClientFormModal from '../Clientform/ITClientFormModal';
import { api } from '../../services/api.ts';
import { Client, ClientStatus, NatureOfWork } from '../../types';
import { toast } from 'sonner';

const ITPortfolio: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isUtilityOpen, setIsUtilityOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: clientsData } = useModuleData('it_clients');

  const clients = useMemo(() => {
    return clientsData || [];
  }, [clientsData]);

  useEffect(() => {
    let debounceTimer: any = null;
    const syncHandler = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['it_clients'] });
        queryClient.invalidateQueries({ queryKey: ['clients'] });
      }, 150);
    };
    window.addEventListener('clientify_db_change', syncHandler);
    return () => {
      window.removeEventListener('clientify_db_change', syncHandler);
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [queryClient]);

  const stats = useMemo(() => {
    const total = clients.length;
    const active = (clients || []).filter(c => c?.status === 'Active' || c?.status === 'Active Filing').length;
    const inactive = (clients || []).filter(c => c?.status === 'Inactive').length;
    return { total, active, inactive };
  }, [clients]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['it_clients'] });
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  };

  const handleExportCSV = () => {
    const headers = [
      "Legal Name", "Trade Name", "Mobile", "Email", "Address", "PAN", 
      "Portal User ID", "Portal Password", "Father Name", "DOB", 
      "Category", "Nature of Work", "Status"
    ].join(",");

    const rows = (clients || []).filter(Boolean).map(c => [
      c?.legalName, c?.tradeName, c?.mobile, c?.email, c?.address,
      c?.itProfile?.pan, c?.itProfile?.username, c?.itProfile?.password,
      c?.itProfile?.fatherName, c?.itProfile?.dob, c?.itProfile?.category,
      c?.itProfile?.natureOfWork, c?.status
    ].map(v => `"${v || ''}"`).join(",")).join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `IT_Portfolio_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsUtilityOpen(false);
    toast.success('IT Portfolio exported to CSV!');
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "Legal Name", "Trade Name", "Mobile", "Email", "Address", "PAN", 
      "Portal User ID", "Portal Password", "Father Name", "DOB (YYYY-MM-DD)", 
      "Category (Individual/HUF/Firm/Company/AOP/BOI)", 
      "Nature of Work (Salaried/Business/Profession/House Property/Capital Gain/Others)", 
      "Status (Active/Inactive)"
    ].join(",");
    
    const csvContent = "data:text/csv;charset=utf-8," + headers;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Clientify_IT_Import_Template.csv`);
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
          const panVal = (values[5] || '').toUpperCase();
          const clientData: Partial<Client> = {
            legalName: values[0] || 'Unknown Client',
            tradeName: values[1] || '',
            mobile: values[2] || '',
            email: values[3] || '',
            address: values[4] || '',
            status: (values[12] as ClientStatus) || 'Active',
            itProfile: {
              pan: panVal,
              username: values[6] || panVal || '',
              password: values[7] || '',
              fatherName: values[8] || '',
              dob: values[9] || '',
              category: values[10] || 'Individual',
              natureOfWork: (values[11] as NatureOfWork) || 'Salaried',
              employmentType: 'Private',
              businessName: values[1] || ''
            }
          };

          if (clientData.itProfile?.pan || clientData.legalName) {
            await api.saveClient(clientData);
            successCount++;
          }
        } catch (err) {
          console.error("IT Import row failed:", row, err);
          errorCount++;
        }
      }

      setIsImporting(false);
      toast.info(`IT Import finished. Success: ${successCount}, Errors: ${errorCount}`);
      handleRefresh();
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsUtilityOpen(false);
    };
    reader.readAsText(file);
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
          <div className="relative">
            <button 
              onClick={() => setIsUtilityOpen(!isUtilityOpen)}
              className={`h-10 landscape:h-8 w-10 landscape:w-8 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-emerald-600 hover:bg-white transition-all flex items-center justify-center shadow-sm ${isImporting ? 'animate-pulse' : ''}`}
              title="Bulk Utilities"
              disabled={isImporting}
            >
              {isImporting ? (
                <div className="h-4 w-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="h-5 w-5 landscape:h-4 landscape:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              )}
            </button>
            
            {isUtilityOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] p-2 animate-in zoom-in-95 origin-top-right">
                 <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 rounded-xl transition-all text-left group">
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg></div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Import IT Clients (CSV)</span>
                       <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Bulk onboarding sequence</span>
                    </div>
                 </button>
                 <button onClick={handleExportCSV} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 rounded-xl transition-all text-left group">
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Export IT Portfolio</span>
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
            className="bg-emerald-600 text-white font-black uppercase tracking-tight px-5 landscape:px-3 h-10 landscape:h-8 rounded-xl shadow-md hover:bg-slate-900 transition-all flex items-center gap-1.5 text-[11px] landscape:text-[10px] shrink-0"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            Add Profile
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <ItMasterPortfolio 
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

