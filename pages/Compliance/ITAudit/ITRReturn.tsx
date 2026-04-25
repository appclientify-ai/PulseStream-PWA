
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Client } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';
import ITViewIcon from '../../../components/ITViewIcon';
import GSTViewIcon from '../../../components/GSTViewIcon';
import { useITRReturnLogic, RefundStatus } from './ITRReturnlogic';
import { YEARS } from '../GSTReturn/filinglogic/MonthlyFilingLogic';
import { toast } from 'sonner';


const ITRReturn: React.FC = () => {
  const getPreviousAY = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const startYear = currentMonth >= 3 ? currentYear : currentYear - 1;
    return `${startYear}-${(startYear + 1).toString().slice(-2)}`;
  };

  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAY, setSelectedAY] = useState(getPreviousAY());
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'All' | 'Filed' | 'Pending'>('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [refundStatusFilter, setRefundStatusFilter] = useState<'All' | 'Pending' | 'Received' | 'No Refund'>('All');
  const [isRefundFilterOpen, setIsRefundFilterOpen] = useState(false);

  // Modals & Tools
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoginBoxOpen, setIsLoginBoxOpen] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  // Actions Menu State
  const [activeActionsId, setActiveActionsId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const actionsRef = useRef<HTMLDivElement>(null);

  const { getStatus, toggleStatus, updateFilingDate, cycleRefundStatus, updateDueDate, getDueDate } = useITRReturnLogic(selectedAY);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const data = await api.getClients();
      // Automatically show all active IT clients
      setClients(data.filter(c => !!c.itProfile && (c.status === 'Active' || c.status === 'Active Filing')));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

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
    const itGroup = clients.slice().sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    const rank = itGroup.findIndex(c => c.id === client.id) + 1;
    return `IT/${rank.toString().padStart(2, '0')}`;
  }, [clients]);

  const filteredClients = useMemo(() => {
    let list = clients.filter(c => 
      (c.legalName || '').toLowerCase().includes(search.toLowerCase()) || 
      (c.itProfile?.pan || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.itProfile?.fatherName || '').toLowerCase().includes(search.toLowerCase())
    );
    
    if (statusFilter !== 'All') {
      list = list.filter(c => statusFilter === 'Filed' ? getStatus(c.id).filed : !getStatus(c.id).filed);
    }

    if (refundStatusFilter !== 'All') {
      list = list.filter(c => {
        const rs = getStatus(c.id).refundStatus || 'N/A';
        if (refundStatusFilter === 'Pending') return rs === 'Pending';
        if (refundStatusFilter === 'Received') return rs === 'Issued' || rs === 'Processed';
        if (refundStatusFilter === 'No Refund') return rs === 'N/A';
        return true;
      });
    }

    return list;
  }, [clients, search, statusFilter, refundStatusFilter, getStatus]);

  const handleExport = () => {
    const headers = ["ID", "Name", "Father Name", "Status", "Filing Date", "Refund Status", "PAN", "Password"].join(",");
    const rows = filteredClients.map(c => {
      const s = getStatus(c.id);
      return [
        getClientDisplayId(c),
        c.legalName,
        c.itProfile?.fatherName,
        s.filed ? 'Filed' : 'Pending',
        s.date || '---',
        s.refundStatus || 'N/A',
        c.itProfile?.pan,
        c.itProfile?.password
      ].map(v => `"${v || ''}"`).join(",");
    }).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `ITR_Return_${selectedAY}.csv`; a.click();
  };

  const openActionsMenu = (e: React.MouseEvent, client: Client) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + window.scrollY + 8, left: rect.right - 256 });
    setActiveActionsId(client.id);
    setSelectedClient(client);
  };

  const saveQuickPassword = async (client: Client) => {
    try {
      const updated = { ...client, itProfile: { ...client.itProfile!, password: newPasswordValue } };
      await api.saveClient(updated);
      setClients(prev => prev.map(c => c.id === client.id ? (updated as Client) : c));
      setEditingPasswordId(null);
    } catch (err) { toast.error("Update failed."); }
  };

  const getRefundColor = (st?: RefundStatus) => {
    switch (st) {
      case 'Issued': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Processed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Adjusted': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'Pending': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      default: return 'bg-slate-50 text-slate-300 border-slate-100';
    }
  };

  const shareViaWhatsApp = (text: string) => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-4 px-2 animate-in fade-in duration-500 max-w-full mx-auto w-full overflow-hidden">
      
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total IT Return</p>
            <p className="text-xl font-black text-slate-900 leading-none">{filteredClients.length}</p>
          </div>
        </div>

        <div className="relative flex-1 group w-full">
          <input type="text" placeholder="Search active IT client, PAN, or Father Name..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handleExport} className="h-11 w-11 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm" title="Export CSV"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
          <select value={selectedAY} onChange={e => setSelectedAY(e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer">{YEARS.map(y => <option key={y} value={y}>AY {y}</option>)}</select>
          <div className="flex items-center bg-slate-50 rounded-xl px-4 py-3 gap-2 border border-transparent focus-within:border-indigo-100 transition-all">
            <span className="text-[9px] font-black text-slate-400 uppercase whitespace-nowrap">Due:</span>
            <input type="date" value={getDueDate()} onChange={e => updateDueDate(e.target.value)} className="bg-transparent border-none p-0 text-[11px] font-black text-slate-600 outline-none cursor-pointer uppercase" />
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1 w-full">
          <table className="w-full text-left border-collapse table-auto overflow-hidden min-w-[1550px]">
            <thead className="whitespace-nowrap sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-200 shadow-sm text-[14px] font-bold uppercase tracking-widest text-slate-900">
                <th className="whitespace-nowrap px-4 py-3 w-[90px]">S.No.</th>
                <th className="whitespace-nowrap px-4 py-3 w-[200px]">Name</th>
                <th className="whitespace-nowrap px-4 py-3 w-[180px]">Father Name</th>
                <th className="whitespace-nowrap px-4 py-3 w-[120px] text-center relative">
                  <div className="flex items-center justify-center gap-1">Status <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="p-1 hover:bg-slate-200 rounded transition-colors"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg></button></div>
                  {isFilterOpen && <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 animate-in zoom-in-95 flex flex-col gap-1">{['All', 'Filed', 'Pending'].map(f => <button key={f} onClick={() => { setStatusFilter(f as any); setIsFilterOpen(false); }} className={`w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg ${statusFilter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50'}`}>{f}</button>)}</div>}
                </th>
                <th className="whitespace-nowrap px-4 py-3 w-[140px]">Filing Date</th>
                <th className="whitespace-nowrap px-4 py-3 w-[140px] text-center relative">
                  <div className="flex items-center justify-center gap-1">Refund Status <button onClick={() => setIsRefundFilterOpen(!isRefundFilterOpen)} className="p-1 hover:bg-slate-200 rounded transition-colors"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg></button></div>
                  {isRefundFilterOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 animate-in zoom-in-95 flex flex-col gap-1">
                      {['All', 'Pending', 'Received', 'No Refund'].map(f => (
                        <button key={f} onClick={() => { setRefundStatusFilter(f as any); setIsRefundFilterOpen(false); }} className={`w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg ${refundStatusFilter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50'}`}>{f}</button>
                      ))}
                    </div>
                  )}
                </th>
                <th className="whitespace-nowrap px-4 py-3 w-[160px]">Pan No.</th>
                <th className="whitespace-nowrap px-4 py-3 w-[160px]">Password</th>
                <th className="whitespace-nowrap px-4 py-3 w-[110px] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client, idx) => {
                const status = getStatus(client.id);
                const isPassVisible = visiblePasswords.has(client.id);
                const isEditingPass = editingPasswordId === client.id;
                return (
                  <tr key={client.id} className="group hover:bg-indigo-50/10 transition-all h-[44px] text-[12px]">
                    <td className="whitespace-nowrap px-4 py-[2px] font-black text-indigo-400 font-mono">{(idx + 1).toString().padStart(2, '0')}</td>
                    <td className="whitespace-nowrap px-4 py-[2px] font-black text-slate-900 uppercase truncate" title={client.legalName}>{client.legalName}</td>
                    <td className="whitespace-nowrap px-4 py-[2px] font-bold text-slate-500 uppercase truncate">{client.itProfile?.fatherName || '---'}</td>
                    <td className="whitespace-nowrap px-4 py-[2px] text-center">
                       <button onClick={() => toggleStatus(client.id)} className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${status.filed ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>{status.filed ? 'Filed' : 'Pending'}</button>
                    </td>
                    <td className="whitespace-nowrap px-4 py-[2px]">
                       {status.filed ? (
                         <input type="date" value={status.date || ''} onChange={e => updateFilingDate(client.id, e.target.value)} className="bg-transparent border-none p-0 text-[11px] font-black text-slate-600 outline-none uppercase" />
                       ) : <span className="text-slate-200 font-black">---</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-[2px] text-center">
                       <button onClick={() => status.filed && cycleRefundStatus(client.id)} disabled={!status.filed} className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border transition-all ${getRefundColor(status.refundStatus)} ${!status.filed ? 'opacity-30' : 'hover:shadow-sm'}`}>
                          {status.refundStatus || 'N/A'}
                       </button>
                    </td>
                    <td className="whitespace-nowrap px-4 py-[2px] font-black text-indigo-600 font-mono tracking-widest uppercase">{client.itProfile?.pan}</td>
                    <td className="whitespace-nowrap px-4 py-[2px]">
                       <div className="flex items-center gap-2 group/pass">
                          {isEditingPass ? (
                            <div className="flex items-center gap-1">
                               <input autoFocus value={newPasswordValue} onChange={e => setNewPasswordValue(e.target.value)} onBlur={() => saveQuickPassword(client)} onKeyDown={e => { if (e.key === 'Enter') saveQuickPassword(client); }} className="bg-white border border-indigo-200 rounded px-2 h-7 text-[11px] font-black w-24 outline-none" />
                            </div>
                          ) : (
                            <>
                               <span className="font-black text-indigo-400 tracking-wider truncate">{isPassVisible ? client.itProfile?.password : '••••••••'}</span>
                               <button onClick={() => setVisiblePasswords(prev => { const n = new Set(prev); if (n.has(client.id)) { n.delete(client.id); } else { n.add(client.id); } return n; })} className="p-1 text-slate-300 hover:text-indigo-600 opacity-0 group-hover/pass:opacity-100 transition-all">{isPassVisible ? '🙈' : '👁️'}</button>
                               <button onClick={() => { setEditingPasswordId(client.id); setNewPasswordValue(client.itProfile?.password || ''); }} className="p-1 text-slate-300 hover:text-amber-500 opacity-0 group-hover/pass:opacity-100"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                            </>
                          )}
                       </div>
                    </td>
                    <td className="px-4 py-[2px] text-right whitespace-nowrap overflow-visible">
                       <div className="flex items-center justify-end gap-1">
                          <ITViewIcon client={client} onDataChange={fetchClients} />
                          {client.gstProfile && <GSTViewIcon client={client} onDataChange={fetchClients} />}
                          <button onClick={() => { setSelectedClient(client); setIsLoginBoxOpen(true); }} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center shadow-sm" title="Login Tool"><svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></button>
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

      {/* ACTIONS MENU */}
      {activeActionsId && selectedClient && (
        <div ref={actionsRef} style={{ top: menuPosition.top, left: menuPosition.left }} className="fixed w-64 bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl z-[9999] p-2 animate-in zoom-in-95 origin-top-right overflow-hidden text-left">
          <button onClick={() => { shareViaWhatsApp(`*IT Return Credentials*\n*Entity:* ${selectedClient.legalName}\n*PAN:* ${selectedClient.itProfile?.pan}\n*User ID:* ${selectedClient.itProfile?.username}\n*Password:* ${selectedClient.itProfile?.password}`); setActiveActionsId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-50 rounded-xl transition-colors text-left group">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Share Creds</span>
          </button>
          <button onClick={() => { shareViaWhatsApp(`*IT Return Profile*\nName: ${selectedClient.legalName}\nPAN: ${selectedClient.itProfile?.pan}\nMobile: ${selectedClient.mobile}`); setActiveActionsId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-50 rounded-xl transition-colors text-left group border-t border-slate-50">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Share Full Detail</span>
          </button>
        </div>
      )}

      {/* LOGIN BOX MODAL */}
      {isLoginBoxOpen && selectedClient && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
              <div className="p-8 bg-slate-900 text-white flex items-center justify-between shrink-0">
                 <div><p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-2">Portal Access</p><h3 className="text-xl font-black uppercase truncate">{selectedClient.legalName}</h3></div>
                 <button onClick={() => setIsLoginBoxOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"><svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg></button>
              </div>
              <div className="p-10 space-y-8">
                 <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col gap-4">
                    <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">PAN Identity</p><p className="text-lg font-black text-indigo-600 font-mono uppercase tracking-widest">{selectedClient.itProfile?.pan}</p></div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                       <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">User ID</p><p className="text-sm font-black text-slate-900">{selectedClient.itProfile?.username}</p></div>
                       <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">Password</p><p className="text-sm font-black text-indigo-600 tracking-widest">{selectedClient.itProfile?.password}</p></div>
                    </div>
                 </div>
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100"><button onClick={() => { navigator.clipboard.writeText(selectedClient.itProfile?.username || ''); window.open('https://eportal.incometax.gov.in/iec/foservices/#/login', '_blank'); }} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 transition-all shadow-2xl flex items-center justify-center gap-3">Launch IT Portal & Copy ID</button></div>
           </div>
        </div>
      )}

      {/* FULL CLIENT DETAIL VIEW MODAL removed - replaced by ITViewIcon */}

      {/* DETAIL VIEW MODAL removed - replaced by ITDetailModal */}
    </div>
  );
};

export default ITRReturn;
