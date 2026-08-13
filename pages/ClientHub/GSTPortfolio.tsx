import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useModuleData } from '../../hooks/useModuleData';
import { formatDate } from '../../exportUtils';
import GstMasterPortfolio from './GstMasterPortfolio.tsx';
import GSTClientFormModal from '../Clientform/GSTClientFormModal.tsx';
import { api } from '../../services/api.ts';
import { Client, GstRegType, GstFilingFreq, ConstitutionType, ClientStatus } from '../../types.ts';
import ErrorBoundary from '../../components/ErrorBoundary';
import { toast } from 'sonner';

import { SectorJurisdictionFilter } from '../../components/SectorJurisdictionFilter';
import { ViewControl } from '../../components/ViewControl';

const GSTPortfolioContent: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState<string>('All');
  const [authorityFilter, setAuthorityFilter] = useState<'All' | 'State' | 'Center'>('All');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [compactMode, setCompactMode] = useState(true);
  const [isUtilityOpen, setIsUtilityOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: clientsData } = useModuleData('gst_clients');

  const clients = useMemo(() => {
    return clientsData || [];
  }, [clientsData]);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['gst_clients'] });
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  }, [queryClient]);

  useEffect(() => {
    let debounceTimer: any = null;
    const syncHandler = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['gst_clients'] });
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
    const total = (clients || []).length;
    const active = (clients || []).filter(c => c?.status === 'Active' || c?.status === 'Active Filing').length;
    const regular = (clients || []).filter(c => c?.gstProfile?.regType === 'Regular').length;
    const composition = (clients || []).filter(c => c?.gstProfile?.regType === 'Composition').length;
    const monthly = (clients || []).filter(c => !c?.gstProfile?.filingFreq || c?.gstProfile?.filingFreq === 'Monthly').length;
    const quarterly = (clients || []).filter(c => c?.gstProfile?.filingFreq === 'Quarterly').length;
    const litigation = (clients || []).filter(c => c?.status === 'Litigation').length;
    const inactive = (clients || []).filter(c => c?.status === 'Inactive' || c?.status === 'Suspended').length;

    return { total, active, regular, composition, monthly, quarterly, litigation, inactive };
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

  const quickFilterChips = [
    { label: 'All', value: 'All' },
    { label: 'Active', value: 'Active' },
    { label: 'Regular', value: 'Regular' },
    { label: 'Composition', value: 'Composition' },
    { label: 'Monthly', value: 'Monthly' },
    { label: 'Quarterly', value: 'Quarterly' },
    { label: 'Litigation', value: 'Litigation' },
    { label: 'Inactive', value: 'Inactive' },
  ];

  return (
    <div className="flex flex-col h-full space-y-1.5 pb-1 overflow-hidden animate-in fade-in duration-500">
      
      {/* Search and Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs shrink-0 w-full">
        
        {/* Search input */}
        <div className="relative flex-1 min-w-[220px] group">
          <input 
            type="text" 
            placeholder="Search GST Portfolio by Trade Name, Legal Name, GSTIN or PAN..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl py-2 pl-9 pr-8 font-bold text-xs text-slate-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all outline-none" 
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full hover:bg-slate-200"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {/* Count Pills in Search Bar Line */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0 py-1">
          <button
            onClick={() => setQuickFilter('All')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 border ${
              quickFilter === 'All' 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>Total</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-black ${
              quickFilter === 'All' ? 'bg-indigo-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
            }`}>
              {stats.total}
            </span>
          </button>

          <button
            onClick={() => setQuickFilter('Active')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 border ${
              quickFilter === 'Active' 
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                : 'bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <span>Active</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-black ${
              quickFilter === 'Active' ? 'bg-emerald-500 text-white' : 'bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100'
            }`}>
              {stats.active}
            </span>
          </button>

          <button
            onClick={() => setQuickFilter('Litigation')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 border ${
              quickFilter === 'Litigation' 
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs' 
                : 'bg-amber-50/60 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
            }`}
          >
            <span>Litigation</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-black ${
              quickFilter === 'Litigation' ? 'bg-amber-500 text-white' : 'bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-100'
            }`}>
              {stats.litigation}
            </span>
          </button>

          <button
            onClick={() => setQuickFilter('Inactive')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 border ${
              quickFilter === 'Inactive' 
                ? 'bg-slate-700 text-white border-slate-700 shadow-xs' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>Inactive</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-black ${
              quickFilter === 'Inactive' ? 'bg-slate-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}>
              {stats.inactive}
            </span>
          </button>
        </div>

        {/* Controls: View Control, Sector Filter, Utilities, Add Client */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 ml-auto">
          
          {/* Standardized View Control */}
          <ViewControl 
            viewMode={viewMode} 
            onViewChange={setViewMode} 
            compactMode={compactMode} 
            onCompactToggle={() => setCompactMode(!compactMode)} 
          />

          {/* Sector / Jurisdiction Filter Icon */}
          <SectorJurisdictionFilter
            clients={clients}
            authority={authorityFilter}
            setAuthority={setAuthorityFilter}
            selectedSectors={selectedSectors}
            setSelectedSectors={setSelectedSectors}
          />

          <div className="relative">
            <button 
              onClick={() => setIsUtilityOpen(!isUtilityOpen)}
              className={`h-9 w-9 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center shadow-xs ${isImporting ? 'animate-pulse' : ''}`}
              title="Bulk Utilities"
              disabled={isImporting}
            >
              {isImporting ? (
                <div className="h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
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
            className="bg-indigo-600 text-white font-black uppercase tracking-widest px-4 h-9 rounded-xl shadow-md hover:bg-slate-900 transition-all text-[10px] shrink-0 flex items-center gap-1.5"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            Add GST Client
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <GstMasterPortfolio 
          externalSearch={search}
          quickFilter={quickFilter}
          viewMode={viewMode}
          authorityFilter={authorityFilter}
          selectedSectors={selectedSectors}
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
