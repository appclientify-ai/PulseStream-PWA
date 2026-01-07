
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import GstMasterPortfolio from './GstMasterPortfolio';
import GSTClientFormModal from '../Clientform/GSTClientFormModal';
import { api } from '../../services/api';
import { Client, JurisdictionType, ClientStatus, GstStatus, GstRegType, GstFilingFreq, ConstitutionType } from '../../types';

const CSV_HEADERS = [
  "Legal Name", "Trade Name", "Mobile", "Email", "Client Status",
  "GSTIN", "Portal Username", "Portal Password", "GST Status", 
  "Reg Date", "Cancel Date", "Reg Type", "Filing Freq", 
  "Constitution", "Jurisdiction", "Sector", "Range", 
  "Address", "Bank Name", "Account No", "IFSC", "Remarks"
];

const GSTPortfolio: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [search, setSearch] = useState('');
  const [jurisdictionFilter, setJurisdictionFilter] = useState<JurisdictionType | 'All'>('All');
  const [sectorFilter, setSectorFilter] = useState<string>('All');
  const [rangeFilter, setRangeFilter] = useState<string>('All');
  const [showDataOptions, setShowDataOptions] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger(p => p + 1);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get('/clients');
        setClients(data.filter((c: any) => !!c.gstProfile));
      } catch (err) {
        console.error("Failed to load clients from API", err);
      }
    };
    load();
  }, [refreshTrigger]);

  const stats = useMemo(() => {
    const total = clients.length;
    const active = clients.filter(c => c.status === 'Active Filing').length;
    const caseStudy = clients.filter(c => c.status === 'Case-by-Case').length;
    const inactive = clients.filter(c => c.status.startsWith('Inactive')).length;
    return { total, active, caseStudy, inactive };
  }, [clients]);

  const sectors = useMemo(() => {
    const s = new Set<string>();
    clients.forEach(c => {
      if (c.gstProfile?.jurisdictionType === 'State' && c.gstProfile.sector) {
        s.add(c.gstProfile.sector);
      }
    });
    return Array.from(s).sort();
  }, [clients]);

  const ranges = useMemo(() => {
    const r = new Set<string>();
    clients.forEach(c => {
      if (c.gstProfile?.jurisdictionType === 'Center' && c.gstProfile.range) {
        r.add(c.gstProfile.range);
      }
    });
    return Array.from(r).sort();
  }, [clients]);

  const handleJurisdictionChange = (val: string) => {
    setJurisdictionFilter(val as any);
    setSectorFilter('All');
    setRangeFilter('All');
  };

  const handleExportCSV = () => {
    const rows = clients.map(c => [
      c.legalName,
      c.tradeName,
      c.mobile,
      c.email || "",
      c.status,
      c.gstProfile?.gstin,
      c.gstProfile?.username,
      c.gstProfile?.password || "",
      c.gstProfile?.gstStatus,
      c.gstProfile?.regDate,
      c.gstProfile?.cancelDate || "",
      c.gstProfile?.regType,
      c.gstProfile?.filingFreq,
      c.gstProfile?.constitution,
      c.gstProfile?.jurisdictionType,
      c.gstProfile?.sector || "",
      c.gstProfile?.range || "",
      `"${(c.gstProfile?.address || "").replace(/"/g, '""')}"`,
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
    link.setAttribute("download", `GST_Portfolio_Full_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    setShowDataOptions(false);
  };

  const handleImportTemplateCSV = () => {
    const csvContent = [CSV_HEADERS].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "GST_Clientify_Template.csv");
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
      
      let successCount = 0;
      let failedCount = 0;
      
      for (const row of rows) {
        if (!row.trim()) continue;
        const cols = row.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length < 6) continue;
        
        try {
          await api.post('/clients', {
            legalName: cols[0],
            tradeName: cols[1],
            mobile: cols[2],
            email: cols[3],
            status: (cols[4] as ClientStatus) || 'Active Filing',
            gstProfile: {
              gstin: cols[5],
              username: cols[6] || '',
              password: cols[7] || '',
              gstStatus: (cols[8] as GstStatus) || 'Active',
              regDate: cols[9] || new Date().toISOString().split('T')[0],
              cancelDate: cols[10] || undefined,
              regType: (cols[11] as GstRegType) || 'Regular',
              filingFreq: (cols[12] as GstFilingFreq) || 'Monthly',
              constitution: (cols[13] as ConstitutionType) || 'Proprietorship',
              jurisdictionType: (cols[14] as JurisdictionType) || 'State',
              sector: cols[15],
              range: cols[16],
              address: cols[17],
              stakeholders: []
            },
            bankDetails: {
              bankName: cols[18] || '',
              accountNo: cols[19] || '',
              ifsc: cols[20] || ''
            },
            remarks: cols[21]
          });
          successCount++;
        } catch (err) {
          failedCount++;
        }
      }
      
      alert(`Import Summary:\n• Processed: ${successCount}\n• Failed: ${failedCount}`);
      handleRefresh();
      setShowDataOptions(false);
    };
    reader.readAsText(file);
    event.target.value = ''; 
  };

  return (
    <div className="flex flex-col h-full space-y-3 pb-4 overflow-hidden">
      {/* Consolidated Toolbar */}
      <div className="flex flex-col lg:flex-row items-center gap-3 bg-white p-2.5 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        
        <div className="flex items-center gap-4 px-2 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="flex flex-col items-center min-w-[32px]">
            <span className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Total</span>
            <span className="text-lg font-black text-slate-900 leading-none">{stats.total}</span>
          </div>
          <div className="flex flex-col items-center min-w-[32px]">
            <span className="text-[9px] font-black text-green-500 uppercase leading-none mb-1">Active</span>
            <span className="text-lg font-black text-green-600 leading-none">{stats.active}</span>
          </div>
        </div>

        <div className="relative flex-1 group min-w-[180px] w-full">
          <input type="text" placeholder="Search legal name or GSTIN..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/10 transition-all outline-none" />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full lg:w-auto pb-1 lg:pb-0">
          <select value={jurisdictionFilter} onChange={e => handleJurisdictionChange(e.target.value)}
            className="bg-slate-50 border-none rounded-xl px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-600 focus:ring-2 focus:ring-indigo-600/10 outline-none shrink-0">
            <option value="All">Jurisdiction: All</option>
            <option value="State">State</option>
            <option value="Center">Center</option>
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto lg:ml-0">
          <div className="relative">
            <button onClick={() => setShowDataOptions(!showDataOptions)} className="h-10 w-10 flex items-center justify-center bg-slate-100 rounded-xl text-slate-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
               <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7zm4 4h8m-8 4h5" /></svg>
            </button>
            {showDataOptions && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-2 overflow-hidden animate-in zoom-in-95">
                <button onClick={handleImportTemplateCSV} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 rounded-xl">Download Template</button>
                <label className="w-full block px-4 py-3 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-slate-50 rounded-xl cursor-pointer">
                  Bulk Import CSV <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>
                <button onClick={handleExportCSV} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 rounded-xl border-t border-slate-50 mt-1">Export All Data</button>
              </div>
            )}
          </div>

          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white font-black uppercase tracking-tight px-4 h-10 rounded-xl shadow-lg hover:bg-slate-900 transition-all flex items-center gap-2 text-sm whitespace-nowrap">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            Add Client
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <GstMasterPortfolio 
          key={refreshTrigger} 
          externalSearch={search} 
          hideInternalSearch={true} 
          jurisdictionFilter={jurisdictionFilter}
          sectorFilter={sectorFilter}
          rangeFilter={rangeFilter}
          onDataChange={handleRefresh}
        />
      </div>

      <GSTClientFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={() => handleRefresh()} />
    </div>
  );
};

export default GSTPortfolio;
