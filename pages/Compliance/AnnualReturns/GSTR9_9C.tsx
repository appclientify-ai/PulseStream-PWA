import React, { useState, useEffect, useMemo } from 'react';
import { Client } from '../../../types';
import { mockBackend } from '../../../services/mockBackend';
import GSTClientFormModal from '../../Clientform/GSTClientFormModal';
import Loader from '../../../components/Loader';
import { useGSTR9Logic } from './GSTR9_9Clogic';
import { YEARS } from '../GSTReturn/filinglogic/MonthlyFilingLogic';

const GSTR9_9C: React.FC = () => {
  const getPreviousFY = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const startYear = currentMonth >= 3 ? currentYear - 1 : currentYear - 2;
    return `${startYear}-${(startYear + 1).toString().slice(-2)}`;
  };

  const [allClients, setAllClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState(getPreviousFY());
  
  // Column Filters
  const [gstr9Filter, setGstr9Filter] = useState<'All' | 'Filed' | 'Pending'>('All');
  const [gstr9cFilter, setGstr9cFilter] = useState<'All' | 'Filed' | 'Pending'>('All');
  const [activeHeaderFilter, setActiveHeaderFilter] = useState<'gstr9' | 'gstr9c' | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [pendingClientToAdd, setPendingClientToAdd] = useState<Client | null>(null);
  const [addSearch, setAddSearch] = useState('');
  const [nineCApplicableInput, setNineCApplicableInput] = useState<string>('true');
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  
  // Inline editing states for Table
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  // Detail Modal Specific Password States
  const [showPassInModal, setShowPassInModal] = useState(false);
  const [isEditingPassInModal, setIsEditingPassInModal] = useState(false);
  const [modalPassValue, setModalPassValue] = useState('');

  const { 
    getStatus, 
    toggleStatus, 
    watchlist, 
    addToWatchlist, 
    update9CApplicability,
    removeFromWatchlist,
    hasFilingInYear,
    is9CApplicable,
    updateDueDate,
    getDueDate
  } = useGSTR9Logic(selectedYear);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const data = await mockBackend.getClients();
      setAllClients(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  /**
   * REVISED LOGIC: A client added to FY 'X' should automatically show in all FYs >= 'X'.
   * It should NOT show in FYs < 'X'.
   */
  const trackedClients = useMemo(() => {
    const selectedStartYear = parseInt(selectedYear.split('-')[0]);
    const activeIds = new Set<string>();

    Object.entries(watchlist).forEach(([fy, ids]) => {
      const fyStart = parseInt(fy.split('-')[0]);
      if (fyStart <= selectedStartYear) {
        ids.forEach(id => activeIds.add(id));
      }
    });

    return allClients.filter(c => {
      const isRegular = c.gstProfile?.regType === 'Regular';
      if (!isRegular) return false;
      const inWatchlistRecord = activeIds.has(c.id);
      const hasHistory = hasFilingInYear(c.id, selectedYear);
      return inWatchlistRecord || hasHistory;
    });
  }, [allClients, watchlist, selectedYear, hasFilingInYear]);

  const filteredDisplayList = useMemo(() => {
    const s = search.toLowerCase();
    let list = trackedClients.filter(c => 
      (c.legalName || '').toLowerCase().includes(s) || 
      (c.tradeName || '').toLowerCase().includes(s) || 
      (c.gstProfile?.gstin && c.gstProfile.gstin.toLowerCase().includes(s)) || 
      (c.mobile || '').includes(s)
    );

    if (gstr9Filter !== 'All') {
      list = list.filter(c => {
        const status = getStatus(c.id);
        return gstr9Filter === 'Filed' ? status.gstr9 : !status.gstr9;
      });
    }

    if (gstr9cFilter !== 'All') {
      list = list.filter(c => {
        if (!is9CApplicable(c.id)) return false; 
        const status = getStatus(c.id);
        return gstr9cFilter === 'Filed' ? status.gstr9c : !status.gstr9c;
      });
    }

    return list;
  }, [trackedClients, search, gstr9Filter, gstr9cFilter, getStatus, is9CApplicable]);

  const stats = useMemo(() => {
    const list = trackedClients; 
    const gstr9Filed = list.filter(c => getStatus(c.id).gstr9).length;
    const gstr9cFiled = list.filter(c => getStatus(c.id).gstr9c).length;
    return { total: list.length, gstr9Filed, gstr9cFiled };
  }, [trackedClients, getStatus]);

  const clientsAvailableToAdd = useMemo(() => {
    const s = addSearch.toLowerCase();
    const selectedStartYear = parseInt(selectedYear.split('-')[0]);
    
    // Determine which IDs are ALREADY tracked for this year or previous years
    const alreadyTrackedIds = new Set<string>();
    Object.entries(watchlist).forEach(([fy, ids]) => {
      const fyStart = parseInt(fy.split('-')[0]);
      if (fyStart <= selectedStartYear) {
        ids.forEach(id => alreadyTrackedIds.add(id));
      }
    });

    return allClients.filter(c => 
      c.gstProfile?.regType === 'Regular' && 
      !alreadyTrackedIds.has(c.id) &&
      ((c.legalName || '').toLowerCase().includes(s) || 
       (c.tradeName || '').toLowerCase().includes(s) || 
       (c.gstProfile?.gstin || '').toLowerCase().includes(s))
    );
  }, [allClients, watchlist, addSearch, selectedYear]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const saveQuickPassword = async (client: Client) => {
    try {
      const updated = { ...client, gstProfile: { ...client.gstProfile!, password: newPasswordValue } };
      await mockBackend.saveClient(updated);
      setAllClients(prev => prev.map(c => c.id === client.id ? (updated as Client) : c));
      setEditingPasswordId(null);
    } catch (err) { alert("Update failed"); }
  };

  const saveQuickPasswordFromModal = async () => {
    if (!selectedClient) return;
    try {
      const updatedClient = {
        ...selectedClient,
        gstProfile: { ...selectedClient.gstProfile!, password: modalPassValue }
      };
      await mockBackend.saveClient(updatedClient);
      setSelectedClient(updatedClient as Client);
      setIsEditingPassInModal(false);
      fetchClients();
    } catch (err) { alert("Update failed"); }
  };

  const handleExport = () => {
    const headers = ["S.No", "Trade Name", "Legal Name", "GSTIN", "User ID", "Password", "GSTR-9", "GSTR-9 Date", "GSTR-9C", "GSTR-9C Date"].join(",");
    const rows = filteredDisplayList.map((c, i) => {
      const st = getStatus(c.id);
      return [
        i + 1, c.tradeName, c.legalName, c.gstProfile?.gstin, c.gstProfile?.username, c.gstProfile?.password,
        st.gstr9 ? "FILED" : "PENDING", st.gstr9Date || "N/A",
        st.gstr9c ? "FILED" : "PENDING", st.gstr9cDate || "N/A"
      ].join(",");
    }).join("\n");

    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([headers + "\n" + rows], { type: 'text/csv' }));
    link.download = `GSTR9_Annual_Compliance_${selectedYear}.csv`;
    link.click();
  };

  const shareViaWhatsApp = (text: string) => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const getCredText = (client: Client) => `*GST Credentials for ${client.tradeName || client.legalName}*\n\n*GSTIN:* ${client.gstProfile?.gstin}\n*Username:* ${client.gstProfile?.username}\n*Password:* ${client.gstProfile?.password}\n\n_Shared via Clientify_`;

  const getFullShareText = (client: Client) => {
    const stakeholders = client.gstProfile?.stakeholders?.map(s => `• ${s.name} (${s.pan})`).join('\n') || 'None';
    return `*Clientify: Master Profile Share*\n\n*Trade Name:* ${client.tradeName}\n*Legal Name:* ${client.legalName}\n*GSTIN:* ${client.gstProfile?.gstin}\n*Mobile:* ${client.mobile}\n*Email:* ${client.email}\n\n*Login Credentials:*\n*Username:* ${client.gstProfile?.username}\n*Password:* ${client.gstProfile?.password}\n\n*Personnel:*\n${stakeholders}`;
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 max-w-full mx-auto w-full overflow-hidden">
      
      {/* Header Toolbar */}
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">FY {selectedYear}</p>
            <p className="text-xl font-black text-slate-900 leading-none">{stats.total}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">9 Filed</p>
            <p className="text-xl font-black text-emerald-600 leading-none">{stats.gstr9Filed}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">9C Filed</p>
            <p className="text-xl font-black text-indigo-600 leading-none">{stats.gstr9cFiled}</p>
          </div>
        </div>

        <div className="relative flex-1 w-full group">
          <input type="text" placeholder="Search regular entity or GSTIN..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex bg-slate-50 rounded-xl p-1">
             <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} 
               className="bg-transparent border-none rounded-lg px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer">
               {YEARS.map(y => <option key={y} value={y}>FY {y}</option>)}
             </select>
          </div>

          <div className="flex items-center bg-slate-50 rounded-xl px-4 py-3 gap-2 border border-transparent focus-within:border-indigo-100 transition-all">
            <span className="text-[9px] font-black text-slate-400 uppercase whitespace-nowrap">Due:</span>
            <input type="date" value={getDueDate()} onChange={e => updateDueDate(e.target.value)} className="bg-transparent border-none p-0 text-[11px] font-black text-slate-600 outline-none cursor-pointer uppercase" />
          </div>

          <button onClick={() => { setPendingClientToAdd(null); setAddSearch(''); setIsAddModalOpen(true); }} className="bg-indigo-600 text-white font-black uppercase tracking-tight px-6 h-11 rounded-xl shadow-lg hover:bg-slate-900 transition-all flex items-center gap-2 text-xs">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            Add Client
          </button>
          <button onClick={handleExport} className="h-11 w-11 flex items-center justify-center bg-slate-900 text-white rounded-xl shadow-lg hover:bg-emerald-600 transition-all" title="Export to CSV">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          </button>
        </div>
      </div>

      {/* Main Matrix Content */}
      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse table-fixed min-w-[1300px]">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-5 text-[12px] font-black uppercase tracking-widest text-slate-400 w-[60px]">S.No</th>
                <th className="px-4 py-5 text-[12px] font-black uppercase tracking-widest text-slate-400 w-[180px]">Trade Name</th>
                <th className="px-4 py-5 text-[12px] font-black uppercase tracking-widest text-slate-400 w-[200px]">GSTIN</th>
                
                <th className="px-4 py-5 text-[12px] font-black uppercase tracking-widest text-slate-400 text-center w-[120px] relative">
                  <button onClick={() => setActiveHeaderFilter(activeHeaderFilter === 'gstr9' ? null : 'gstr9')} className="flex items-center justify-center gap-1 w-full uppercase">
                    GSTR-9 <svg className={`h-3 w-3 transition-transform ${activeHeaderFilter === 'gstr9' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {activeHeaderFilter === 'gstr9' && (
                    <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 animate-in zoom-in-95">
                      {['All', 'Filed', 'Pending'].map(f => (
                        <button key={f} onClick={() => { setGstr9Filter(f as any); setActiveHeaderFilter(null); }} 
                          className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase rounded-lg transition-colors ${gstr9Filter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
                </th>

                <th className="px-4 py-5 text-[12px] font-black uppercase tracking-widest text-slate-400 text-center w-[120px] relative">
                  <button onClick={() => setActiveHeaderFilter(activeHeaderFilter === 'gstr9c' ? null : 'gstr9c')} className="flex items-center justify-center gap-1 w-full uppercase">
                    GSTR-9C <svg className={`h-3 w-3 transition-transform ${activeHeaderFilter === 'gstr9c' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {activeHeaderFilter === 'gstr9c' && (
                    <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 animate-in zoom-in-95">
                      {['All', 'Filed', 'Pending'].map(f => (
                        <button key={f} onClick={() => { setGstr9cFilter(f as any); setActiveHeaderFilter(null); }} 
                          className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase rounded-lg transition-colors ${gstr9cFilter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
                </th>

                <th className="px-4 py-5 text-[12px] font-black uppercase tracking-widest text-slate-400 w-[140px]">User ID</th>
                <th className="px-4 py-5 text-[12px] font-black uppercase tracking-widest text-slate-400 w-[180px]">Password</th>
                <th className="px-4 py-5 text-[12px] font-black uppercase tracking-widest text-slate-400 text-right w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDisplayList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-32 text-center">
                    <div className="flex flex-col items-center">
                      <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">No entities found for current filters</p>
                      {(search || gstr9Filter !== 'All' || gstr9cFilter !== 'All') && (
                        <button onClick={() => { setSearch(''); setGstr9Filter('All'); setGstr9cFilter('All'); }} className="mt-4 text-indigo-600 font-black uppercase text-[10px] tracking-widest hover:underline">Clear All Filters</button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDisplayList.map((client, idx) => {
                  const status = getStatus(client.id);
                  const isPassVisible = visiblePasswords.has(client.id);
                  const isEditingPass = editingPasswordId === client.id;
                  const is9cApp = is9CApplicable(client.id);

                  return (
                    <tr key={client.id} className="group hover:bg-slate-50/50 transition-all">
                      <td className="px-4 py-5 text-[11px] font-black text-slate-300">{(idx + 1).toString().padStart(2, '0')}</td>
                      <td className="px-4 py-5">
                        <p className="text-[11px] font-black text-slate-900 uppercase truncate" title={client.tradeName}>{client.tradeName || client.legalName || '---'}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase truncate">{client.legalName}</p>
                      </td>
                      <td className="px-4 py-5">
                         <div className="flex items-center gap-2 group/gstin">
                            <span className="text-[11px] font-black text-indigo-600 font-mono tracking-widest">{client.gstProfile?.gstin}</span>
                            <button onClick={() => { copyToClipboard(client.gstProfile?.gstin || ''); window.open('https://services.gst.gov.in/services/searchtp', '_blank'); }} 
                               className="h-6 w-6 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center opacity-0 group-hover/gstin:opacity-100">
                               <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0(7 7 0 0114 0z" /></svg>
                            </button>
                         </div>
                      </td>
                      
                      <td className="px-4 py-5 text-center">
                         <button onClick={() => toggleStatus(client.id, 'gstr9')} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${status.gstr9 ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                           {status.gstr9 ? 'Filed' : 'Pending'}
                         </button>
                         {status.gstr9 && status.gstr9Date && <p className="text-[8px] font-black text-slate-300 mt-1 uppercase">{status.gstr9Date}</p>}
                      </td>

                      <td className="px-4 py-5 text-center">
                         {!is9cApp ? (
                           <button 
                             onClick={() => { if(confirm(`Enable GSTR-9C tracking for ${client.tradeName || client.legalName}?`)) update9CApplicability(client.id, true); }}
                             className="text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-indigo-600 hover:underline transition-all"
                           >
                             N/A
                           </button>
                         ) : (
                           <>
                             <button onClick={() => toggleStatus(client.id, 'gstr9c')} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${status.gstr9c ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                               {status.gstr9c ? 'Filed' : 'Pending'}
                             </button>
                             {status.gstr9c && status.gstr9cDate && <p className="text-[8px] font-black text-slate-300 mt-1 uppercase">{status.gstr9cDate}</p>}
                           </>
                         )}
                      </td>

                      <td className="px-4 py-5">
                        <p className="text-[11px] font-black text-slate-700 truncate">{client.gstProfile?.username}</p>
                      </td>
                      
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-2 group/pass">
                           {isEditingPass ? (
                             <div className="flex items-center gap-1 z-10">
                               <input autoFocus value={newPasswordValue} onChange={e => setNewPasswordValue(e.target.value)} className="bg-white border border-indigo-200 rounded-lg px-2 h-8 text-[10px] font-black w-24 outline-none" />
                               <button onClick={() => saveQuickPassword(client)} className="h-8 w-8 bg-green-600 text-white rounded-lg flex items-center justify-center shadow-sm"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></button>
                             </div>
                           ) : (
                             <>
                               <span className="text-[11px] font-black text-indigo-600 tracking-wider truncate max-w-[80px]">{isPassVisible ? client.gstProfile?.password : '••••••••'}</span>
                               <div className="flex gap-1">
                                 <button onClick={() => setVisiblePasswords(prev => { const n = new Set(prev); n.has(client.id) ? n.delete(client.id) : n.add(client.id); return n; })} className="p-1 text-slate-300 hover:text-indigo-600 transition-colors">
                                    {isPassVisible ? <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg> : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg>}
                                 </button>
                                 <button onClick={() => { setEditingPasswordId(client.id); setNewPasswordValue(client.gstProfile?.password || ''); }} className="p-1 text-slate-300 hover:text-amber-600 transition-colors opacity-0 group-hover/pass:opacity-100">
                                   <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                 </button>
                               </div>
                             </>
                           )}
                        </div>
                      </td>
                      <td className="px-4 py-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                           <button onClick={() => { copyToClipboard(client.gstProfile?.username || ''); window.open('https://services.gst.gov.in/services/login', '_blank'); }} className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                           </button>
                           <button onClick={() => { setSelectedClient(client); setIsDetailModalOpen(true); setShowPassInModal(false); setIsEditingPassInModal(false); setModalPassValue(client.gstProfile?.password || ''); }} className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center">
                             <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg>
                           </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <GSTClientFormModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={() => fetchClients()} initialData={selectedClient} />

      {/* ADD CLIENT TO FY WATCHLIST MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8 flex flex-col space-y-6 animate-in zoom-in-95">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Add to {selectedYear} Tracking</h3>
            <div className="relative">
              <input type="text" placeholder="Search available clients..." value={addSearch} onChange={e => setAddSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-bold text-sm outline-none" />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 no-scrollbar">
              {clientsAvailableToAdd.map(c => (
                <button key={c.id} onClick={() => setPendingClientToAdd(c)} className={`w-full text-left p-3 rounded-xl border transition-all ${pendingClientToAdd?.id === c.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:bg-slate-50'}`}>
                  <p className="text-xs font-black text-slate-900 uppercase">{c.tradeName || c.legalName}</p>
                  <p className="text-[10px] text-slate-400 font-mono tracking-tighter">{c.gstProfile?.gstin}</p>
                </button>
              ))}
            </div>
            {pendingClientToAdd && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={nineCApplicableInput === 'true'} onChange={e => setNineCApplicableInput(e.target.checked ? 'true' : 'false')} className="h-4 w-4 accent-indigo-600" />
                  <span className="text-xs font-black text-slate-600 uppercase">GSTR-9C Applicable for this client?</span>
                </label>
                <div className="flex gap-3">
                  <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-black uppercase text-[10px]">Cancel</button>
                  <button onClick={() => { addToWatchlist(pendingClientToAdd.id, nineCApplicableInput === 'true'); setIsAddModalOpen(false); }} className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px]">Confirm Add</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPREHENSIVE DETAIL MODAL */}
      {isDetailModalOpen && selectedClient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl max-h-[95vh] bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="px-6 md:px-10 py-6 md:py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="min-w-0">
                 <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none uppercase truncate">{selectedClient.tradeName || selectedClient.legalName}</h2>
                 <p className="text-xs md:text-sm font-bold text-slate-500 mt-2 uppercase tracking-widest truncate">{selectedClient.legalName}</p>
              </div>
              <div className="flex items-center gap-2 md:gap-3 shrink-0">
                <button onClick={() => { if(confirm('Remove from watchlist?')) removeFromWatchlist(selectedClient.id); setIsDetailModalOpen(false); }} className="h-9 md:h-10 px-4 md:px-6 bg-white border border-red-100 text-red-600 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-red-50">Untrack</button>
                <button onClick={() => { setIsEditModalOpen(true); setIsDetailModalOpen(false); }} className="h-9 md:h-10 px-6 md:px-8 bg-indigo-600 text-white rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-900 transition-all">Edit</button>
                <button onClick={() => setIsDetailModalOpen(false)} className="h-9 md:h-10 w-9 md:w-10 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-colors"><svg className="h-5 md:h-6 w-5 md:w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg></button>
              </div>
            </div>
            <div className="p-6 md:p-10 overflow-y-auto no-scrollbar flex-1 space-y-8 md:space-y-12">
               <section>
                  <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 mb-6 flex items-center gap-3">Annual Overview (FY {selectedYear}) <div className="h-px flex-1 bg-slate-100" /></h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div>
                           <p className="text-[9px] font-black uppercase text-slate-400">GSTR-9 Status</p>
                           <p className="text-sm font-black text-slate-900 uppercase">{getStatus(selectedClient.id).gstr9 ? 'FILED' : 'PENDING'}</p>
                        </div>
                        <button onClick={() => toggleStatus(selectedClient.id, 'gstr9')} className="bg-white border border-slate-200 text-indigo-600 font-black uppercase text-[10px] px-4 py-2 rounded-lg hover:bg-indigo-600 hover:text-white transition-all">Toggle</button>
                     </div>
                     <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div>
                           <p className="text-[9px] font-black uppercase text-slate-400">GSTR-9C Status</p>
                           <p className="text-sm font-black text-slate-900 uppercase">{!is9CApplicable(selectedClient.id) ? 'N/A' : (getStatus(selectedClient.id).gstr9c ? 'FILED' : 'PENDING')}</p>
                        </div>
                        {is9CApplicable(selectedClient.id) && (
                           <button onClick={() => toggleStatus(selectedClient.id, 'gstr9c')} className="bg-white border border-slate-200 text-indigo-600 font-black uppercase text-[10px] px-4 py-2 rounded-lg hover:bg-indigo-600 hover:text-white transition-all">Toggle</button>
                        )}
                     </div>
                     <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex items-center justify-between col-span-1 md:col-span-2">
                        <div className="min-w-0 flex-1">
                           <p className="text-[9px] font-black uppercase text-indigo-400">GSTR-9C Requirement</p>
                           <p className="text-xs font-bold text-slate-500 mt-1 italic">Sets whether audit reconciliation is required for this entity globally.</p>
                        </div>
                        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shrink-0">
                           <button onClick={() => update9CApplicability(selectedClient.id, true)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${is9CApplicable(selectedClient.id) ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Applicable</button>
                           <button onClick={() => update9CApplicability(selectedClient.id, false)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${!is9CApplicable(selectedClient.id) ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Not Required</button>
                        </div>
                     </div>
                  </div>
               </section>

               <section>
                  <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 mb-6 flex items-center gap-3">Login Credentials <div className="h-px flex-1 bg-slate-100" /></h4>
                  <div className="flex flex-col md:flex-row gap-4 items-stretch">
                     <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div><p className="text-[9px] font-black uppercase text-slate-400">User ID</p><p className="text-sm font-black text-slate-900">{selectedClient.gstProfile?.username}</p></div>
                        <button onClick={() => copyToClipboard(selectedClient.gstProfile?.username || '')} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-indigo-600 shadow-sm transition-all"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2" /></svg></button>
                     </div>
                     <div className="flex-[1.5] bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                        <div className="flex-1">
                           <p className="text-[9px] font-black uppercase text-slate-400">Vault Password</p>
                           {isEditingPassInModal ? <input autoFocus value={modalPassValue} onChange={e => setModalPassValue(e.target.value)} className="bg-white border border-indigo-200 rounded-lg px-2 h-10 w-full font-black text-sm" /> : <p className="text-base font-black text-slate-900 tracking-wider">{showPassInModal ? selectedClient.gstProfile?.password : '••••••••'}</p>}
                        </div>
                        <div className="flex gap-1.5">
                           {!isEditingPassInModal ? (
                             <>
                               <button onClick={() => setShowPassInModal(!showPassInModal)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-indigo-600 shadow-sm transition-all"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg></button>
                               <button onClick={() => setIsEditingPassInModal(true)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-indigo-600 shadow-sm transition-all"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                             </>
                           ) : (
                             <button onClick={saveQuickPasswordFromModal} className="h-10 w-10 bg-green-600 text-white rounded-xl flex items-center justify-center shadow-lg transition-all"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></button>
                           )}
                        </div>
                     </div>
                  </div>
               </section>
            </div>
            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-center gap-4 shrink-0">
               <button onClick={() => shareViaWhatsApp(getCredText(selectedClient))} className="flex items-center gap-3 h-14 px-8 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-600 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm">
                  <svg className="h-5 w-5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg> WhatsApp Credentials</button>
               <button onClick={() => shareViaWhatsApp(getFullShareText(selectedClient))} className="flex items-center gap-4 h-14 px-10 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-xl hover:bg-slate-900 transition-all">Share All (WA)</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GSTR9_9C;