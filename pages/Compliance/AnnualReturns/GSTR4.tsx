
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { formatDate } from '../../../exportUtils';
import { Client } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';
import GSTViewIcon from '../../../components/GSTViewIcon';
import { useGSTR4Logic } from './GSTR4logic';
import { YEARS, isClientVisibleInFY } from '../GSTReturn/filinglogic/MonthlyFilingLogic';
import { toast } from 'sonner';
import { ExportMenu } from '../../../components/ExportMenu';
import { exportToCSV, printList } from '../../../exportUtils';

const GSTR4: React.FC = () => {
  const getPreviousFY = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const startYear = currentMonth >= 3 ? currentYear - 1 : currentYear - 2;
    return `${startYear}-${(startYear + 1).toString().slice(-2)}`;
  };

  const [clients, setClients] = useState<Client[]>([]);
  const [allClientsBase, setAllClientsBase] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState(getPreviousFY());
  const [statusFilter, setStatusFilter] = useState<'All' | 'Filed' | 'Pending'>('All');

  // Modals & Tools
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [newPassVal, setNewPassVal] = useState('');
  
  // Actions Menu State
  const [activeActionsId, setActiveActionsId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const actionsRef = useRef<HTMLDivElement>(null);

  const { getStatus, toggleStatus, updateDueDate, getDueDate } = useGSTR4Logic(selectedYear);

  const [cmp08Data, setCmp08Data] = useState<Record<string, Record<string, { cmp08: boolean }>>>({});

  const fetchClients = async (isSync = false) => {
    if (!isSync) setIsLoading(true);
    try {
      const data = await api.getClients();
      setAllClientsBase(data);
      setClients((data || []).filter(c => c && c.gstProfile?.regType === 'Composition'));
    } finally { setIsLoading(false); }
  };

useEffect(() => { 
    fetchClients(); 
    api.getAppData('clientify_composition_filing_v3').then(data => {
      if (data) setCmp08Data(data);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const handleClose = (event: any) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setActiveActionsId(null);
      }
    };
    if (activeActionsId) document.addEventListener('mousedown', handleClose);
    return () => document.removeEventListener('mousedown', handleClose);
  }, [activeActionsId]);

  const getClientDisplayId = useCallback((client: Client) => {
    if (!client.gstProfile) return '---';
    const isState = client.gstProfile.jurisdictionType === 'State';
    const val = isState ? client.gstProfile.sector : client.gstProfile.range;
    const prefix = isState ? 'S' : 'C';
    const sameGroup = allClientsBase.filter(c => 
      c.gstProfile?.jurisdictionType === client.gstProfile?.jurisdictionType &&
      (isState ? c.gstProfile?.sector === val : c.gstProfile?.range === val)
    ).sort((a, b) => (new Date(a.createdAt || 0).getTime()) - (new Date(b.createdAt || 0).getTime()));
    const rank = sameGroup.findIndex(c => c.id === client.id) + 1;
    return `${prefix}/${val || '?'}/${rank}`;
  }, [allClientsBase]);

    const stats = useMemo(() => {
    let total = 0, filed = 0, pending = 0;
    const baseClients = clients.filter(c => isClientVisibleInFY(c, selectedYear));
    total = baseClients.length;
    baseClients.forEach(c => {
      if (getStatus(c.id).filed) filed++;
      else pending++;
    });
    return { total, filed, pending };
  }, [clients, selectedYear, getStatus]);


  useEffect(() => {
    const syncHandler = () => fetchClients();
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, []);
  const filteredClients = useMemo(() => {
    let list = clients.filter(c => 
      isClientVisibleInFY(c, selectedYear) &&
      ((c.legalName || '').toLowerCase().includes(search.toLowerCase()) || 
       (c.tradeName || '').toLowerCase().includes(search.toLowerCase()) || 
       (c.gstProfile?.gstin || '').toLowerCase().includes(search.toLowerCase()))
    );
    if (statusFilter !== 'All') list = list.filter(c => statusFilter === 'Filed' ? getStatus(c.id).filed : !getStatus(c.id).filed);
    return list;
  }, [clients, search, statusFilter, getStatus, selectedYear]);

  
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
    const headers = ["ID", "Trader", "GSTIN", "Status", "User ID", "Password"].join(",");
    const rows = filteredClients.map(c => [
      getClientDisplayId(c), 
      c.tradeName, 
      c.gstProfile?.gstin, 
      getStatus(c.id).filed ? 'Filed' : 'Pending',
      c.gstProfile?.gstPortalUsername || '---',
      c.gstProfile?.gstPortalPassword || '---'
    ]);
    exportToCSV(headers.split(','), rows, 'GSTR4_Composition.csv');
};

const handleExportPDF = () => {
    const headers = ["ID", "Trader", "GSTIN", "Status"];
    const rows = filteredClients.map(c => [
      getClientDisplayId(c), 
      c.tradeName, 
      c.gstProfile?.gstin, 
      getStatus(c.id).filed ? 'Filed' : 'Pending'
    ]);
    printList('GSTR-4 Composition Returns', headers, rows);
};

  const openActionsMenu = (e: React.MouseEvent, client: Client) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + window.scrollY + 8, left: rect.right - 256 });
    setActiveActionsId(client.id);
    setSelectedClient(client);
  };

  const shareViaWhatsApp = (text: string) => {
    window.location.href = `whatsapp://send?text=${encodeURIComponent(text)}`;
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-4 px-2 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">GSTR-4 Total</p>
            <p className="text-xl font-black text-slate-900 leading-none">{stats.total}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">Filed</p>
            <p className="text-xl font-black text-indigo-600 leading-none">{stats.filed}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Pending</p>
            <p className="text-xl font-black text-rose-600 leading-none">{stats.pending}</p>
          </div>
        </div>
        <div className="relative flex-1 group w-full">
          <input type="text" placeholder="Search composition annual entity..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ExportMenu onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer">{YEARS.map(y => <option key={y} value={y}>FY {y}</option>)}</select>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1 w-full">
          <table className="w-full text-left border-collapse table-auto overflow-hidden">
            <thead className=" sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-200 shadow-sm text-[14px] font-bold uppercase tracking-widest text-slate-900">
                <th className=" px-4 py-3">S.No.</th>
                <th className=" px-4 py-3">Trader Name</th>
                <th className=" px-4 py-3">Legal Name</th>
                <th className=" px-4 py-3">GSTIN</th>
                <th className=" px-4 py-3 text-center">CMP-08 Status</th>
                <th className=" px-4 py-3 text-center">GSTR-4 Status</th>
                <th className=" px-4 py-3">User ID</th>
                <th className=" px-4 py-3">Password</th>
                <th className=" px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client, idx) => {
                const status = getStatus(client.id);
                const isEditingPass = editingPasswordId === client.id;
                return (
                  <tr key={client.id} className="hover:bg-indigo-50/10 transition-all group h-[44px] text-[12px]">
                    <td className=" px-4 py-[2px] font-black text-indigo-400 font-mono">{(idx + 1).toString().padStart(2, '0')}</td>
                    <td className=" px-4 py-[2px] truncate max-w-[200px]" title={client.tradeName}>
     <div className="font-black text-slate-900 truncate leading-tight text-[12px]">{client.tradeName || '---'}</div>
     <div className="font-bold text-[9px] text-slate-500 truncate leading-tight" title={client.legalName}>{client.legalName || '---'}</div>
   </td>
   <td className=" px-4 py-[2px] truncate max-w-[150px]">
     <input type="text" value={status.remark || ''} onChange={e => updateRemark(client.id, e.target.value)} placeholder="Add remark..." className="w-full bg-transparent border-none p-0 text-[11px] font-bold text-slate-600 focus:ring-0 outline-none placeholder-slate-300" />
   </td>
                    <td className=" px-4 py-[2px] font-black text-indigo-600 font-mono tracking-widest uppercase">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{client.gstProfile?.gstin}</span>
                        {client.gstProfile?.gstin && (
                          <button onClick={() => (navigator.clipboard.writeText(client.gstProfile?.gstin || '').then(() => { toast.success('GSTIN Copied!'); window.open('https://services.gst.gov.in/services/searchtp', '_blank'); }))} className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0" title="Search Taxpayer">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className=" px-4 py-[2px] text-center">
                      <div className="flex justify-center gap-1">
                        {[
                          { label: 'Q1', q: 'April-June (Q1)' },
                          { label: 'Q2', q: 'July-September (Q2)' },
                          { label: 'Q3', q: 'October-December (Q3)' },
                          { label: 'Q4', q: 'January-March (Q4)' }
                        ].map(qInfo => {
                           const isFiled = cmp08Data[`${selectedYear}_${qInfo.q}`]?.[client.id]?.cmp08;
                           return (
                             <span key={qInfo.label} title={qInfo.q} className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border ${isFiled ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                               {qInfo.label}
                             </span>
                           );
                        })}
                      </div>
                    </td>
                    <td className=" px-4 py-[2px] text-center">
                       <button onClick={() => toggleStatus(client.id)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${status.filed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>{status.filed ? 'Filed' : 'Pending'}</button>
                    </td>
                    <td className=" px-4 py-[2px] font-black text-slate-700 truncate">{client.gstProfile?.username}</td>
                    <td className=" px-4 py-[2px] font-black text-indigo-600 tracking-wider">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-indigo-400 text-[12px] truncate">{client.gstProfile?.password}</span>
                        {client.gstProfile?.username && (
                          <button onClick={() => { 
                            navigator.clipboard.writeText(client.gstProfile?.username || ''); 
                            window.open('https://services.gst.gov.in/services/login', '_blank'); 
                          }} className="p-1 text-slate-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all shrink-0" title="Login to GST Portal">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className=" px-4 py-[2px] text-right  overflow-visible">
                       <div className="flex items-center justify-end gap-1">
                          <GSTViewIcon client={client} onDataChange={fetchClients} />
                          <button onClick={(e) => openActionsMenu(e, client)} className={`h-8 w-8 rounded-lg border transition-all flex items-center justify-center shadow-sm ${activeActionsId === client.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white'}`}><svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg></button>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FIXED ACTIONS MENU */}
      {activeActionsId && selectedClient && (
        <div ref={actionsRef} style={{ top: menuPosition.top, left: menuPosition.left }} className="fixed w-64 bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl z-[9999] p-2 animate-in zoom-in-95 origin-top-right overflow-hidden text-left">
          <button onClick={() => { shareViaWhatsApp(`*GSTR-4 Annual Credentials*\n*Entity:* ${selectedClient.tradeName}\n*GSTIN:* ${selectedClient.gstProfile?.gstin}\n*User ID:* ${selectedClient.gstProfile?.username}\n*Password:* ${selectedClient.gstProfile?.password}`); setActiveActionsId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-50 rounded-xl transition-colors text-left group">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Share Creds</span>
          </button>
          <button onClick={() => { shareViaWhatsApp(`*Entity Profile*\nTrade Name: ${selectedClient.tradeName || 'N/A'}\nLegal Name: ${selectedClient.legalName || 'N/A'}\nMobile: ${selectedClient.mobile || 'N/A'}\nEmail: ${selectedClient.email || 'N/A'}\n\n*GST Details*\nGSTIN: ${selectedClient.gstProfile?.gstin || 'N/A'}\nStatus: ${selectedClient.gstProfile?.gstStatus || 'N/A'}\nReg Type: ${selectedClient.gstProfile?.regType || 'N/A'}\nFiling: ${selectedClient.gstProfile?.filingFreq || 'N/A'}\nReg Date: ${formatDate(selectedClient.gstProfile?.regDate)}\nJurisdiction: ${selectedClient.gstProfile?.jurisdictionType || 'N/A'}\nSector/Range: ${selectedClient.gstProfile?.sector || selectedClient.gstProfile?.range || 'N/A'}`); setActiveActionsId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-50 rounded-xl transition-colors text-left group border-t border-slate-50">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Share Full Detail</span>
          </button>
        </div>
      )}

      {/* FULL CLIENT DETAIL VIEW MODAL removed - replaced by GSTViewIcon */}
    </div>
  );
};

export default GSTR4;
