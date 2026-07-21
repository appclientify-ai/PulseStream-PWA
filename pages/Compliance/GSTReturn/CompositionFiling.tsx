
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { formatDate } from '../../../exportUtils';
import { Client } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';
import GSTViewIcon from '../../../components/GSTViewIcon';
import { exportToCSV, printList } from '../../../exportUtils';
import { TableFilter } from '../../../components/TableFilter';
import { useCompositionFilingLogic } from './filinglogic/CompositionFilingLogic';
import { getDefaultPeriod, YEARS, QUARTERS, isClientVisibleInPeriod } from './filinglogic/MonthlyFilingLogic';
import { toast } from 'sonner';

const CompositionFiling: React.FC = () => {
  const defaultPeriod = getDefaultPeriod();
  const [clients, setClients] = useState<Client[]>([]);
  const [allClientsBase, setAllClientsBase] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cmp08Filter, setCmp08Filter] = useState<'All' | 'Filed' | 'Pending'>('All');
  const [isCmp08FilterOpen, setIsCmp08FilterOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(defaultPeriod.quarterYear);
  const [selectedQuarter, setSelectedQuarter] = useState(defaultPeriod.quarter);
  
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [newPassVal, setNewPassVal] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  const [activeActionsId, setActiveActionsId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const actionsRef = useRef<HTMLDivElement>(null);

  const { getStatus, toggleStatus, updateDueDate, getDueDate } = useCompositionFilingLogic(selectedYear, selectedQuarter);

  // For Composition, visibility check uses the quarter end month
  const quarterEndMonth = useMemo(() => {
    if (selectedQuarter.includes('Q1')) return 'June';
    if (selectedQuarter.includes('Q2')) return 'September';
    if (selectedQuarter.includes('Q3')) return 'December';
    return 'March';
  }, [selectedQuarter]);

  const fetchClients = async (isSync = false) => {
    if (!isSync) setIsLoading(true);
    try {
      const data = await api.getClients();
      setAllClientsBase(data);
      setClients((data || []).filter(c => c && c.gstProfile?.regType === 'Composition'));
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchClients();
    const syncHandler = () => fetchClients(true);
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, []);

  useEffect(() => {
    const handleClose = (event: any) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) setActiveActionsId(null);
    };
    if (activeActionsId) document.addEventListener('mousedown', handleClose);
    return () => document.removeEventListener('mousedown', handleClose);
  }, [activeActionsId]);

  const openActionsMenu = (e: React.MouseEvent, client: Client) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + window.scrollY + 8, left: rect.right - 256 });
    setActiveActionsId(client.id);
    setSelectedClient(client);
  };

  const filteredClients = useMemo(() => {
    const s = search.toLowerCase();
    let list = clients.filter(c => 
      isClientVisibleInPeriod(c, selectedYear, quarterEndMonth) &&
      ((c.legalName || '').toLowerCase().includes(s) || 
       (c.tradeName || '').toLowerCase().includes(s) ||
       (c.gstProfile?.gstin || '').toLowerCase().includes(s))
    );
    if (cmp08Filter !== 'All') {
      list = list.filter(c => cmp08Filter === 'Filed' ? getStatus(c.id).cmp08 : !getStatus(c.id).cmp08);
    }
    return list;
  }, [clients, search, selectedYear, quarterEndMonth, cmp08Filter, getStatus]);

  const stats = useMemo(() => {
    const cmp08Count = filteredClients.filter(c => getStatus(c.id).cmp08).length;
    return { total: filteredClients.length, cmp08: cmp08Count };
  }, [filteredClients, getStatus]);
  
  const handleUpdatePassword = async () => {
    if (!selectedClient || !newPassVal.trim()) return;
    try {
      const updated = { ...selectedClient, gstProfile: { ...selectedClient.gstProfile!, password: newPassVal } };
      await api.saveClient(updated);
      setClients(prev => prev.map(c => c.id === selectedClient.id ? (updated as any) : c));
      setEditingPasswordId(null);
    } catch (err) { toast.error("Update failed."); }
  };
  const handleExportCSV = () => {
    const headers = ['S.No.', 'Trade Name', 'Remark', 'Mobile No.', 'GSTIN', 'CMP-08 Status', 'User ID', 'Password'];
    const rows = filteredClients.map((client, index) => [
      (index + 1).toString().padStart(2, '0'),
      client.tradeName,
      getStatus(client.id).remark || '---',
      client.mobile,
      client.gstProfile?.gstin,
      getStatus(client.id).cmp08 ? 'Filed' : 'Pending',
      client.gstProfile?.username,
      client.gstProfile?.password
    ]);
    exportToCSV(headers, rows, `Composition_Filing_${selectedQuarter}_${selectedYear}.csv`);
  };

  const handlePrint = () => {
    const headers = ['S.No.', 'Trade Name', 'Remark', 'Mobile No.', 'GSTIN', 'CMP-08 Status', 'User ID', 'Password'];
    const rows = filteredClients.map((client, index) => [
      (index + 1).toString().padStart(2, '0'),
      client.tradeName,
      getStatus(client.id).remark || '---',
      client.mobile,
      client.gstProfile?.gstin,
      getStatus(client.id).cmp08 ? 'Filed' : 'Pending',
      client.gstProfile?.username,
      client.gstProfile?.password
    ]);
    printList(`Composition Filing - ${selectedQuarter} ${selectedYear}`, headers, rows);
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-4 px-2">
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Quarter Total</p>
            <p className="text-xl font-black text-slate-900 leading-none">{stats.total}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">CMP-08 Filed</p>
            <p className="text-xl font-black text-indigo-600 leading-none">{stats.cmp08}</p>
          </div>
        </div>
        <div className="flex-1 relative group w-full">
          <input type="text" placeholder="Search composition client..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handlePrint} className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors" title="Print List">
             <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          </button>
          <button onClick={handleExportCSV} className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition-colors" title="Export Excel / CSV">
             <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </button>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer">{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
          <select value={selectedQuarter} onChange={e => setSelectedQuarter(e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer">{QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}</select>
        </div>
      </div>
      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1 w-full min-h-[300px] pb-32">
          <table className="w-full text-left border-collapse]">
            <thead className=" sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-200 shadow-sm font-bold uppercase tracking-widest text-slate-900 text-[12px]">
                <th className=" px-4 py-3">S.No.</th>
                <th className=" px-4 py-3">Trade Name</th>
                <th className=" px-4 py-3">Legal Name</th>
                <th className=" px-4 py-3">Mobile No.</th>
                <th className=" px-4 py-3">GSTIN</th>
                <th className=" px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-slate-900 text-center">
                   <div className="flex justify-center flex-col items-center">
                     <TableFilter label="CMP-08" isActive={cmp08Filter !== 'All'}>
                       {['All', 'Filed', 'Pending'].map(f => <button key={f} onClick={() => setCmp08Filter(f as any)} className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase rounded-lg ${cmp08Filter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{f}</button>)}
                     </TableFilter>
                   </div>
                </th>
                <th className=" px-4 py-3">User ID</th>
                <th className=" px-4 py-3">Password</th>
                <th className=" px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(() => {
                  let globalIdx = 0;
                  return groupedClients.map(group => (
                    <React.Fragment key={group.sector}>
                      <tr>
                        <td colSpan={15} className="px-4 py-2 bg-indigo-50/50 text-[10px] font-black uppercase text-indigo-700 tracking-widest border-y border-indigo-100">
                          Sector: {group.sector}
                        </td>
                      </tr>
                      {group.clients.map((client) => {
                        const idx = globalIdx++;
                const st = getStatus(client.id);
                const isEditingPass = editingPasswordId === client.id;
                
  const groupedClients = useMemo(() => {
    const groups = {};
    filteredClients.forEach(c => {
      const sector = c.gstProfile?.sector || 'Unassigned';
      if (!groups[sector]) groups[sector] = [];
      groups[sector].push(c);
    });
    return Object.keys(groups).sort((a, b) => {
      if (a === 'Unassigned') return 1;
      if (b === 'Unassigned') return -1;
      return a.localeCompare(b);
    }).map(s => ({ sector: s, clients: groups[s] }));
  }, [filteredClients]);

return (
                  <tr key={client.id} className="hover:bg-indigo-50/10 transition-all group h-[44px] text-[12px]">
                    <td className=" px-4 py-[2px] font-black text-indigo-400 font-mono">{(idx + 1).toString().padStart(2, '0')}</td>
                    <td className=" px-4 py-[2px] font-black truncate" title={client.tradeName}>{client.tradeName || '---'}</td>
                    <td className=" px-4 py-[2px] font-bold text-slate-600 truncate" title={client.legalName}>{client.legalName}</td>
                    <td className=" px-4 py-[2px] font-black text-slate-500 truncate">{client.mobile || '---'}</td>
                    <td className=" px-4 py-[2px] font-black text-indigo-600 font-mono tracking-widest">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{client.gstProfile?.gstin}</span>
                        {client.gstProfile?.gstin && (
                          <button onClick={() => (navigator.clipboard.writeText(client.gstProfile?.gstin || '').then(() => { toast.success('GSTIN Copied!'); window.open('https://services.gst.gov.in/services/searchtp', '_blank'); }))} className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0" title="Search Taxpayer">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className=" px-4 py-[2px] text-center"><button onClick={() => toggleStatus(client.id)} className={`px-4 py-1 rounded-full text-[10px] font-black uppercase border ${st.cmp08 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>{st.cmp08 ? 'Filed' : 'Pending'}</button></td>
                    <td className=" px-4 py-[2px] font-black text-slate-700 truncate">{client.gstProfile?.username}</td>
                    <td className=" px-4 py-[2px] font-black text-indigo-400 tracking-widest relative group/pass">
                      <div className="flex items-center gap-2">
                        <span>
                          {isEditingPass ? (
                            <input autoFocus value={newPassVal} onChange={e => setNewPassVal(e.target.value)} onBlur={handleUpdatePassword} onKeyDown={e => e.key === 'Enter' && handleUpdatePassword()} className="bg-white border border-indigo-200 rounded px-2 h-7 text-[11px] font-black w-24 outline-none" />
                          ) : (
                            <div className="flex items-center gap-2">
                               <span className="font-black text-indigo-400 text-[12px] truncate">{client.gstProfile?.password}</span>
                               <button onClick={() => { setSelectedClient(client); setEditingPasswordId(client.id); setNewPassVal(client.gstProfile?.password || ''); }} className="p-1 text-slate-300 hover:text-amber-500 opacity-0 group-hover/pass:opacity-100 transition-all shrink-0"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                               {client.gstProfile?.username && (
                                 <button onClick={() => { 
                                   navigator.clipboard.writeText(client.gstProfile?.username || ''); 
                                   window.open('https://services.gst.gov.in/services/login', '_blank'); 
                                 }} className="p-1 text-slate-300 hover:text-indigo-600 opacity-0 group-hover/pass:opacity-100 transition-all shrink-0" title="Login to GST Portal">
                                   <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                 </button>
                               )}
                            </div>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className=" px-4 py-[2px] text-right">
                       <div className="flex items-center justify-end gap-1">
                          <GSTViewIcon client={client} onDataChange={fetchClients} />
                          <button onClick={(e) => openActionsMenu(e, client)} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 flex items-center justify-center shadow-sm">
                             <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                          </button>
                       </div>
                    </td>
                  </tr>
                );
              })}
                    </React.Fragment>
                  ));
                })()
              }
            </tbody>
          </table>
        </div>
      </div>

      {activeActionsId && selectedClient && (
        <div ref={actionsRef} style={{ top: menuPosition.top, left: menuPosition.left }} className="fixed w-64 bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl z-[9999] p-2 animate-in zoom-in-95 origin-top-right text-left">
           <button onClick={() => { 
             const text = `*Entity Profile*\nTrade Name: ${selectedClient.tradeName || 'N/A'}\nLegal Name: ${selectedClient.legalName || 'N/A'}\nMobile: ${selectedClient.mobile || 'N/A'}\nEmail: ${selectedClient.email || 'N/A'}\n\n*GST Details*\nGSTIN: ${selectedClient.gstProfile?.gstin || 'N/A'}\nStatus: ${selectedClient.gstProfile?.gstStatus || 'N/A'}\nReg Type: ${selectedClient.gstProfile?.regType || 'N/A'}\nFiling: ${selectedClient.gstProfile?.filingFreq || 'N/A'}\nReg Date: ${formatDate(selectedClient.gstProfile?.regDate)}\nJurisdiction: ${selectedClient.gstProfile?.jurisdictionType || 'N/A'}\nSector/Range: ${selectedClient.gstProfile?.sector || selectedClient.gstProfile?.range || 'N/A'}\n\n*Credentials*\nGST User ID: ${selectedClient.gstProfile?.username || 'N/A'}\nGST Password: ${selectedClient.gstProfile?.password || 'N/A'}`;
             window.location.href = `whatsapp://send?text=${encodeURIComponent(text)}`;
             setActiveActionsId(null); 
           }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-left group">
              <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center text-green-500 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.126.549 4.2 1.593 6.035L.302 23.687l5.772-1.517a12.001 12.001 0 005.957 1.57h.005c6.645 0 12.031-5.385 12.031-12.031C24.067 5.385 18.681 0 12.031 0zm0 21.724c-1.802 0-3.568-.485-5.114-1.403l-.367-.217-3.8.998 1.018-3.705-.238-.38A9.992 9.992 0 012.016 12.03c0-5.526 4.498-10.024 10.024-10.024 2.678 0 5.195 1.042 7.087 2.937 1.892 1.892 2.934 4.409 2.934 7.087 0 5.528-4.499 10.028-10.025 10.028v-.004c0-.001-.002-.001-.005-.001zM17.53 14.19c-.302-.15-1.785-.882-2.062-.983-.277-.101-.479-.151-.68.15s-.781.983-.956 1.185c-.176.201-.352.226-.653.076-.301-.15-1.275-.471-2.428-1.5-3.036-2.699-2.227-2.699-.582-5.467.243-.404-.76-2.222-1.04-2.912-.272-.676-.55-.584-.755-.595l-.645-.01c-.226 0-.594.084-.904.42-.311.336-1.191 1.163-1.191 2.836 0 1.674 1.221 3.292 1.391 3.519.17.227 2.457 3.864 5.952 5.253.81.321 1.442.513 1.934.656.812.235 1.551.202 2.138.122.656-.09 2.062-.843 2.353-1.657.292-.814.292-1.512.204-1.657-.087-.145-.313-.231-.615-.383z"/></svg></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Share via WhatsApp</span>
           </button>
        </div>
      )}
    </div>
  );
};

export default CompositionFiling;
