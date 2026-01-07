import React, { useState, useEffect, useMemo } from 'react';
import { Client, GstStatus } from '../../../types';
import { mockBackend } from '../../../services/mockBackend';
import GSTClientFormModal from '../../Clientform/GSTClientFormModal';
import Loader from '../../../components/Loader';
import { useMonthlyFilingLogic, MONTHS, YEARS, getDefaultPeriod } from './filinglogic/MonthlyFilingLogic';

const MonthlyFiling: React.FC = () => {
  const defaultPeriod = getDefaultPeriod();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState(defaultPeriod.year);
  const [selectedMonth, setSelectedMonth] = useState(defaultPeriod.month);
  
  // Table Filters
  const [r1Filter, setR1Filter] = useState<'All' | 'Filed' | 'Pending'>('All');
  const [r3bFilter, setR3bFilter] = useState<'All' | 'Filed' | 'Pending'>('All');
  const [activeHeaderFilter, setActiveHeaderFilter] = useState<'r1' | 'r3b' | null>(null);

  // Modals
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Detail Modal Specific States
  const [showPassInView, setShowPassInView] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [localPassValue, setLocalPassValue] = useState('');
  
  // Inline States for Table
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  const { getStatus, toggleStatus, updateDueDate, getDueDate } = useMonthlyFilingLogic(selectedYear, selectedMonth);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const data = await mockBackend.getClients();
      const filtered = data.filter(c => 
        c.status === 'Active Filing' && 
        c.gstProfile?.regType === 'Regular' &&
        c.gstProfile?.filingFreq === 'Monthly' &&
        (c.gstProfile?.gstStatus === 'Active' || c.gstProfile?.gstStatus === 'Suspended')
      );
      setClients(filtered);
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchClients(); }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    if (!dateStr.includes('-')) return dateStr;
    const parts = dateStr.split('-');
    if (parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return dateStr;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const shareViaWhatsApp = (text: string) => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const getCredText = (client: Client) => `*GST Credentials for ${client.tradeName || client.legalName}*\n\n*GSTIN:* ${client.gstProfile?.gstin}\n*Username:* ${client.gstProfile?.username}\n*Password:* ${client.gstProfile?.password}\n\n_Shared via Clientify_`;

  const getCertText = (client: Client) => `*GST Registration Details: ${client.tradeName || client.legalName}*\n\n*GSTIN:* ${client.gstProfile?.gstin}\n*Status:* ${client.gstProfile?.gstStatus}\n*Reg Date:* ${formatDate(client.gstProfile?.regDate)}\n\n_Shared via Clientify_`;

  const getFullShareText = (client: Client) => {
    const stakeholders = client.gstProfile?.stakeholders?.map(s => `• ${s.name} (${s.pan})`).join('\n') || 'None';
    return `*Clientify: Master Profile Share*\n\n*Trade Name:* ${client.tradeName}\n*Legal Name:* ${client.legalName}\n*GSTIN:* ${client.gstProfile?.gstin}\n*Mobile:* ${client.mobile}\n*Email:* ${client.email}\n\n*Login Credentials:*\n*Username:* ${client.gstProfile?.username}\n*Password:* ${client.gstProfile?.password}\n\n*Personnel:*\n${stakeholders}`;
  };

  const handleFileShare = async (client: Client) => {
    const dataUrl = client.gstProfile?.certificateUrl;
    if (dataUrl && dataUrl.startsWith('data:application/pdf')) {
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], `${client.gstProfile?.gstin || 'GST'}_Certificate.pdf`, { type: 'application/pdf' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: `${client.tradeName} GST Certificate`, text: getCertText(client) });
          return;
        }
      } catch (err) {}
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${client.gstProfile?.gstin}_Certificate.pdf`;
      link.click();
      shareViaWhatsApp(getCertText(client) + "\n\n(Certificate downloaded separately)");
    } else {
      shareViaWhatsApp(getCertText(client));
    }
  };

  const saveQuickPassword = async (client: Client) => {
    try {
      const updated = { ...client, gstProfile: { ...client.gstProfile!, password: newPasswordValue } };
      await mockBackend.saveClient(updated);
      setClients(prev => prev.map(c => c.id === client.id ? (updated as Client) : c));
      setEditingPasswordId(null);
    } catch (err) { alert("Update failed"); }
  };

  const saveQuickPasswordFromView = async () => {
    if (!selectedClient) return;
    const updatedClient = {
      ...selectedClient,
      gstProfile: { ...selectedClient.gstProfile!, password: localPassValue }
    };
    await mockBackend.saveClient(updatedClient);
    setSelectedClient(updatedClient as Client);
    setIsEditingPassword(false);
    fetchClients();
  };

  const filteredClients = useMemo(() => {
    let list = clients.filter(c => 
      (c.legalName || '').toLowerCase().includes(search.toLowerCase()) || 
      (c.tradeName || '').toLowerCase().includes(search.toLowerCase()) || 
      (c.gstProfile?.gstin || '').toLowerCase().includes(search.toLowerCase())
    );
    if (r1Filter !== 'All') list = list.filter(c => r1Filter === 'Filed' ? getStatus(c.id).r1 : !getStatus(c.id).r1);
    if (r3bFilter !== 'All') list = list.filter(c => r3bFilter === 'Filed' ? getStatus(c.id).r3b : !getStatus(c.id).r3b);
    return list;
  }, [clients, search, r1Filter, r3bFilter, getStatus]);

  const stats = useMemo(() => {
    const total = filteredClients.length;
    const r1Filed = filteredClients.filter(c => c.gstProfile?.gstStatus === 'Active' && getStatus(c.id).r1).length;
    const r3bFiled = filteredClients.filter(c => c.gstProfile?.gstStatus === 'Active' && getStatus(c.id).r3b).length;
    return { total, r1Filed, r3bFiled };
  }, [filteredClients, getStatus]);

  const handleExport = () => {
    const headers = ["S.No", "Trade Name", "Legal Name", "GSTIN", "User ID", "Password", "GSTR-1", "GSTR-3B"].join(",");
    const rows = filteredClients.map((c, i) => [
      i + 1, c.tradeName, c.legalName, c.gstProfile?.gstin, c.gstProfile?.username, c.gstProfile?.password,
      getStatus(c.id).r1 ? "FILED" : "PENDING", getStatus(c.id).r3b ? "FILED" : "PENDING"
    ].join(",")).join("\n");
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([headers + "\n" + rows], { type: 'text/csv' }));
    link.download = `Monthly_Filing_${selectedMonth}_${selectedYear}.csv`;
    link.click();
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 max-w-full mx-auto w-full overflow-hidden">
      
      {/* Header Toolbar */}
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{selectedMonth}</p><p className="text-xl font-black text-slate-900 leading-none">{stats.total}</p></div>
          <div className="text-center"><p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">R1 Filed</p><p className="text-xl font-black text-emerald-600 leading-none">{stats.r1Filed}</p></div>
          <div className="text-center"><p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">3B Filed</p><p className="text-xl font-black text-indigo-600 leading-none">{stats.r3bFiled}</p></div>
        </div>

        <div className="relative flex-1 w-full group">
          <input type="text" placeholder="Search entity or GSTIN..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer">{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer">{MONTHS.map(m => <option key={m} value={m}>{m}</option>)}</select>
          
          <div className="flex items-center bg-slate-50 rounded-xl px-4 py-3 gap-2 border border-transparent focus-within:border-indigo-100 transition-all">
            <span className="text-[9px] font-black text-slate-400 uppercase whitespace-nowrap">Due:</span>
            <input type="date" value={getDueDate()} onChange={e => updateDueDate(e.target.value)} className="bg-transparent border-none p-0 text-[11px] font-black text-slate-600 outline-none cursor-pointer uppercase" />
          </div>

          <button onClick={handleExport} className="h-11 w-11 flex items-center justify-center bg-slate-900 text-white rounded-xl shadow-lg hover:bg-emerald-600 transition-all"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse table-fixed min-w-[1250px]">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400 w-[60px]">S.No</th>
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400 w-[180px]">Trade Name</th>
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400 w-[180px]">Legal Name</th>
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400 w-[200px]">GSTIN</th>
                
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400 text-center w-[110px] relative">
                  <button onClick={() => setActiveHeaderFilter(activeHeaderFilter === 'r1' ? null : 'r1')} className="flex items-center justify-center gap-1 w-full uppercase">
                    GSTR-1 <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {activeHeaderFilter === 'r1' && (
                    <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 animate-in zoom-in-95">
                      {['All', 'Filed', 'Pending'].map(f => <button key={f} onClick={() => { setR1Filter(f as any); setActiveHeaderFilter(null); }} className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase rounded-lg ${r1Filter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50'}`}>{f}</button>)}
                    </div>
                  )}
                </th>

                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400 text-center w-[110px] relative">
                  <button onClick={() => setActiveHeaderFilter(activeHeaderFilter === 'r3b' ? null : 'r3b')} className="flex items-center justify-center gap-1 w-full uppercase">
                    GSTR-3B <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {activeHeaderFilter === 'r3b' && (
                    <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 animate-in zoom-in-95">
                      {['All', 'Filed', 'Pending'].map(f => <button key={f} onClick={() => { setR3bFilter(f as any); setActiveHeaderFilter(null); }} className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase rounded-lg ${r3bFilter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50'}`}>{f}</button>)}
                    </div>
                  )}
                </th>

                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400 w-[140px]">User ID</th>
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400 w-[180px]">Password</th>
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400 text-right w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client, idx) => {
                const st = getStatus(client.id);
                const isVisible = visiblePasswords.has(client.id);
                const isEditingPass = editingPasswordId === client.id;
                const isSuspended = client.gstProfile?.gstStatus === 'Suspended';

                return (
                  <tr key={client.id} className="group hover:bg-slate-50/50 transition-all">
                    <td className="px-4 py-5 text-[12px] font-black text-slate-300">{(idx + 1).toString().padStart(2, '0')}</td>
                    <td className="px-4 py-5 text-[12px] font-black text-slate-900 uppercase truncate">{client.tradeName || '---'}</td>
                    <td className="px-4 py-5 text-[12px] font-bold text-slate-500 uppercase truncate">{client.legalName}</td>
                    <td className="px-4 py-5">
                       <div className="flex items-center gap-1.5">
                          <span className="text-[12px] font-black text-indigo-600 font-mono tracking-widest">{client.gstProfile?.gstin}</span>
                          <button onClick={() => { navigator.clipboard.writeText(client.gstProfile?.gstin || ''); window.open('https://services.gst.gov.in/services/searchtp', '_blank'); }} 
                            className="h-6 w-6 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></button>
                       </div>
                    </td>
                    <td className="px-4 py-5 text-center">
                       {isSuspended ? <span className="text-[9px] font-black uppercase text-red-400 bg-red-50 px-2 py-1 rounded">N/A</span> : 
                       <button onClick={() => toggleStatus(client.id, 'r1')} className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${st.r1 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                         {st.r1 ? 'Filed' : 'Pending'}</button>}
                    </td>
                    <td className="px-4 py-5 text-center">
                       {isSuspended ? <span className="text-[9px] font-black uppercase text-red-400 bg-red-50 px-2 py-1 rounded">N/A</span> : 
                       <button onClick={() => toggleStatus(client.id, 'r3b')} className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${st.r3b ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                         {st.r3b ? 'Filed' : 'Pending'}</button>}
                    </td>
                    <td className="px-4 py-5 truncate text-[12px] font-black text-slate-700">{client.gstProfile?.username}</td>
                    <td className="px-4 py-5">
                       <div className="flex items-center gap-2 group/pass">
                          {isEditingPass ? (
                             <div className="flex items-center gap-1 z-10">
                                <input autoFocus value={newPasswordValue} onChange={e => setNewPasswordValue(e.target.value)} className="bg-white border border-indigo-200 rounded-lg px-2 h-8 text-[10px] font-black w-24 outline-none" />
                                <button onClick={() => saveQuickPassword(client)} className="h-8 w-8 bg-green-600 text-white rounded-lg flex items-center justify-center shadow-sm"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></button>
                             </div>
                          ) : (
                             <>
                                <span className="text-[12px] font-black text-indigo-600 tracking-wider truncate max-w-[80px]">{isVisible ? client.gstProfile?.password : '••••••••'}</span>
                                <div className="flex gap-1">
                                   <button onClick={() => setVisiblePasswords(prev => { const n = new Set(prev); n.has(client.id) ? n.delete(client.id) : n.add(client.id); return n; })} className="p-1 text-slate-300 hover:text-indigo-600 transition-colors">
                                      {isVisible ? <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg> : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg>}
                                   </button>
                                   <button onClick={() => { setEditingPasswordId(client.id); setNewPasswordValue(client.gstProfile?.password || ''); }} className="p-1 text-slate-300 hover:text-amber-600 transition-colors opacity-0 group-hover/pass:opacity-100"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                </div>
                             </>
                          )}
                       </div>
                    </td>
                    <td className="px-4 py-5 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <button onClick={() => { navigator.clipboard.writeText(client.gstProfile?.username || ''); window.open('https://services.gst.gov.in/services/login', '_blank'); }} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></button>
                          <button onClick={() => { setSelectedClient(client); setIsDetailModalOpen(true); setLocalPassValue(client.gstProfile?.password || ''); setShowPassInView(false); setIsEditingPassword(false); }} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg></button>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <GSTClientFormModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={() => fetchClients()} initialData={selectedClient} />

      {/* COMPREHENSIVE VIEW DETAILS MODAL */}
      {isDetailModalOpen && selectedClient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl max-h-[95vh] bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="px-6 md:px-10 py-6 md:py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="min-w-0">
                 <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none uppercase truncate">{selectedClient.tradeName || selectedClient.legalName}</h2>
                 <p className="text-xs md:text-sm font-bold text-slate-500 mt-2 uppercase tracking-widest truncate">{selectedClient.legalName}</p>
              </div>
              <div className="flex items-center gap-2 md:gap-3 shrink-0">
                <button onClick={() => { if(confirm('Delete record?')) mockBackend.deleteClient(selectedClient.id).then(() => { setIsDetailModalOpen(false); fetchClients(); }); }} className="h-9 md:h-10 px-4 md:px-6 bg-white border border-red-100 text-red-600 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-red-50">Delete</button>
                <button onClick={() => { setIsEditModalOpen(true); setIsDetailModalOpen(false); }} className="h-9 md:h-10 px-6 md:px-8 bg-indigo-600 text-white rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-900 transition-all">Edit</button>
                <button onClick={() => setIsDetailModalOpen(false)} className="h-9 md:h-10 w-9 md:w-10 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-colors"><svg className="h-5 md:h-6 w-5 md:w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg></button>
              </div>
            </div>
            <div className="p-6 md:p-10 overflow-y-auto no-scrollbar flex-1 space-y-8 md:space-y-12">
               <section>
                  <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 mb-6 flex items-center gap-3">Business Profile <div className="h-px flex-1 bg-slate-100" /></h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
                     <div className="space-y-1 col-span-1 md:col-span-2">
                        <p className="text-[9px] font-black uppercase text-slate-400 mb-1">GSTIN Identification</p>
                        <div className="flex items-center gap-2">
                          <p className="text-base md:text-lg font-black text-indigo-600 font-mono tracking-widest">{selectedClient.gstProfile?.gstin}</p>
                          <button onClick={() => { copyToClipboard(selectedClient.gstProfile?.gstin || ''); window.open('https://services.gst.gov.in/services/searchtp', '_blank'); }} className="h-8 w-8 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                             <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          </button>
                        </div>
                     </div>
                     <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400">Status</p><p className="text-sm md:text-base font-black text-slate-900 uppercase">{selectedClient.status}</p></div>
                     <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400">Mobile</p><p className="text-sm md:text-base font-black text-slate-900">{selectedClient.mobile}</p></div>
                     <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400">Reg. Date</p><p className="text-sm md:text-base font-black text-slate-900">{formatDate(selectedClient.gstProfile?.regDate)}</p></div>
                     <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400">Reg. Type</p><p className="text-sm md:text-base font-black text-slate-900">{selectedClient.gstProfile?.regType} ({selectedClient.gstProfile?.filingFreq})</p></div>
                     <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400">Constitution</p><p className="text-sm md:text-base font-black text-slate-900">{selectedClient.gstProfile?.constitution}</p></div>
                  </div>
               </section>

               <section>
                  <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 mb-6 flex items-center gap-3">Login Credential <div className="h-px flex-1 bg-slate-100" /></h4>
                  <div className="flex flex-col md:flex-row gap-4 items-stretch">
                     <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div className="space-y-0.5"><p className="text-[9px] font-black uppercase text-slate-400">Portal User ID</p><p className="text-sm md:text-base font-black text-slate-900">{selectedClient.gstProfile?.username}</p></div>
                        <button onClick={() => copyToClipboard(selectedClient.gstProfile?.username || '')} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-indigo-600 shadow-sm transition-all"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2" /></svg></button>
                     </div>
                     <div className="flex-[1.5] bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4 min-w-0">
                        <div className="flex-1 space-y-0.5 min-w-0">
                           <p className="text-[9px] font-black uppercase text-slate-400">Vault Password</p>
                           {isEditingPassword ? (
                             <div className="flex items-center gap-2">
                               <input autoFocus value={localPassValue} onChange={(e) => setLocalPassValue(e.target.value)} className="bg-white border border-indigo-200 rounded-lg px-2 py-1 text-sm font-black w-full outline-none h-10" />
                               <button onClick={saveQuickPasswordFromView} className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors shrink-0"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></button>
                             </div>
                           ) : (
                             <p className="text-sm md:text-base font-black text-slate-900 tracking-wider truncate">{showPassInView ? selectedClient.gstProfile?.password : '••••••••'}</p>
                           )}
                        </div>
                        {!isEditingPassword && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => setShowPassInView(!showPassInView)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-indigo-600 shadow-sm transition-all">{showPassInView ? <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg> : <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>}</button>
                            <button onClick={() => setIsEditingPassword(true)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-indigo-600 shadow-sm transition-all"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                          </div>
                        )}
                     </div>
                     <button onClick={() => { copyToClipboard(selectedClient.gstProfile?.username || ''); window.open('https://services.gst.gov.in/services/login', '_blank'); }} className="px-8 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-slate-900 transition-all flex items-center gap-2 shrink-0 h-[64px] md:h-auto"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>Login</button>
                  </div>
               </section>

               <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div>
                    <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 mb-6 flex items-center gap-3">Bank Details <div className="h-px flex-1 bg-slate-100" /></h4>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                       <div className="flex justify-between"><span className="text-[9px] font-black uppercase text-slate-400">Bank Name</span><span className="text-sm font-black text-slate-900">{selectedClient.bankDetails?.bankName || 'N/A'}</span></div>
                       <div className="flex justify-between"><span className="text-[9px] font-black uppercase text-slate-400">Account No</span><span className="text-sm font-black text-slate-900 font-mono tracking-tight">{selectedClient.bankDetails?.accountNo || 'N/A'}</span></div>
                       <div className="flex justify-between"><span className="text-[9px] font-black uppercase text-slate-400">IFSC Code</span><span className="text-sm font-black text-indigo-600 font-mono tracking-widest">{selectedClient.bankDetails?.ifsc || 'N/A'}</span></div>
                    </div>
                 </div>
                 <div>
                    <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 mb-6 flex items-center gap-3">Accountant <div className="h-px flex-1 bg-slate-100" /></h4>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                       <div className="flex justify-between"><span className="text-[9px] font-black uppercase text-slate-400">Name</span><span className="text-sm font-black text-slate-900">{selectedClient.gstProfile?.accountantName || 'N/A'}</span></div>
                       <div className="flex justify-between"><span className="text-[9px] font-black uppercase text-slate-400">Mobile</span><span className="text-sm font-black text-slate-900">{selectedClient.gstProfile?.accountantMobile || 'N/A'}</span></div>
                       <div className="pt-2"><button onClick={() => shareViaWhatsApp(`*Accountant Detail: ${selectedClient.tradeName}*\n\nName: ${selectedClient.gstProfile?.accountantName}\nMobile: ${selectedClient.gstProfile?.accountantMobile}`)} className="text-[9px] font-black uppercase text-indigo-600 hover:underline">Share Accountant Detail</button></div>
                    </div>
                 </div>
               </section>

               {selectedClient.gstProfile?.stakeholders && selectedClient.gstProfile.stakeholders.length > 0 && (
                 <section>
                    <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 mb-6 flex items-center gap-3">Authorized Personnel <div className="h-px flex-1 bg-slate-100" /></h4>
                    <div className="space-y-3">
                       {selectedClient.gstProfile.stakeholders.map(s => (
                         <div key={s.id} className="flex items-center justify-between p-4 md:p-5 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-x-auto no-scrollbar">
                            <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4 md:gap-20">
                               <div><p className="text-[9px] font-black uppercase text-slate-400">Full Name</p><p className="text-sm font-black text-slate-900 uppercase whitespace-nowrap">{s.name}</p></div>
                               <div><p className="text-[9px] font-black uppercase text-slate-400">PAN Number</p><p className="text-sm font-black text-indigo-600 font-mono tracking-widest uppercase">{s.pan}</p></div>
                               <div><p className="text-[9px] font-black uppercase text-slate-400">Contact Number</p><p className="text-sm font-black text-slate-900">{s.mobile}</p></div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </section>
               )}
            </div>
            <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-4 md:gap-6 shrink-0">
               <div className="flex items-center justify-between gap-4"><div className="flex-1 h-px bg-slate-200" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap px-2">Secure Information Share</span><div className="flex-1 h-px bg-slate-200" /></div>
               <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
                  <button onClick={() => shareViaWhatsApp(getCredText(selectedClient))} className="flex items-center gap-3 h-12 md:h-14 px-4 md:px-8 bg-white border border-slate-200 rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-600 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm">
                     <svg className="h-5 w-5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg> WhatsApp Credentials</button>
                  <button onClick={() => handleFileShare(selectedClient)} className="flex items-center gap-3 h-12 md:h-14 px-4 md:px-8 bg-white border border-slate-200 rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-600 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm"><svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Share Document</button>
                  <button onClick={() => shareViaWhatsApp(getFullShareText(selectedClient))} className="flex items-center gap-3 md:gap-4 h-12 md:h-14 px-6 md:px-10 bg-indigo-600 text-white rounded-2xl font-black text-[11px] md:text-xs uppercase tracking-[0.15em] shadow-xl hover:bg-slate-900 transition-all flex-1 md:flex-none justify-center">Share All (WA)</button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Fixed incorrect default export name from QuarterlyFiling to MonthlyFiling
export default MonthlyFiling;