
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Client, GstStatus, ClientStatus } from '../../types.ts';
import { api } from '../../services/api.ts';
import GSTClientFormModal from '../Clientform/GSTClientFormModal.tsx';

interface GstMasterPortfolioProps {
  externalSearch?: string;
  onDataChange?: () => void;
}

const GstMasterPortfolio: React.FC<GstMasterPortfolioProps> = ({ 
  externalSearch = '', 
  onDataChange
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Filter States
  const [gstStatusFilter, setGstStatusFilter] = useState<'All' | GstStatus>('All');
  const [clientStatusFilter, setClientStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [activeFilterMenu, setActiveFilterMenu] = useState<'gst' | 'client' | null>(null);
  
  // Actions Menu State
  const [activeActionsId, setActiveActionsId] = useState<string | null>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  const fetch = async () => {
    setIsLoading(true);
    try {
      const data = await api.getClients();
      setClients(data.filter(c => !!c.gstProfile));
    } catch (err) { console.error("Fetch failed", err); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  // Handle outside clicks for menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setActiveActionsId(null);
      }
      if (activeFilterMenu && !(event.target as HTMLElement).closest('.filter-container')) {
        setActiveFilterMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeFilterMenu, activeActionsId]);

  const handleDataChange = () => {
    fetch();
    if (onDataChange) onDataChange();
  };

  const filteredClients = useMemo(() => {
    const s = externalSearch.toLowerCase();
    let list = clients.filter(c => 
      c.legalName.toLowerCase().includes(s) || 
      (c.tradeName || '').toLowerCase().includes(s) ||
      (c.gstProfile?.gstin || '').toLowerCase().includes(s)
    );

    if (gstStatusFilter !== 'All') {
      list = list.filter(c => c.gstProfile?.gstStatus === gstStatusFilter);
    }

    if (clientStatusFilter !== 'All') {
      list = list.filter(c => {
        const isActive = c.status === 'Active' || c.status === 'Active Filing';
        return clientStatusFilter === 'Active' ? isActive : !isActive;
      });
    }

    return list;
  }, [clients, externalSearch, gstStatusFilter, clientStatusFilter]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const shareCredentials = (client: Client) => {
    const text = `*GST Credentials for ${client.tradeName || client.legalName}*\n\n*GSTIN:* ${client.gstProfile?.gstin}\n*Username:* ${client.gstProfile?.username}\n*Password:* ${client.gstProfile?.password}\n\n_Securely shared via Clientify_`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareFullDetails = (client: Client) => {
    const stakeholders = client.gstProfile?.stakeholders?.map(s => `• ${s.name} (${s.pan})`).join('\n') || 'None';
    const text = `*Client Profile: ${client.legalName}*\n\n*Trade Name:* ${client.tradeName}\n*GSTIN:* ${client.gstProfile?.gstin}\n*Tax Type:* ${client.gstProfile?.regType}\n*Frequency:* ${client.gstProfile?.filingFreq}\n\n*Credentials:*\nUser: ${client.gstProfile?.username}\nPass: ${client.gstProfile?.password}\n\n*Banking:*\n${client.bankDetails?.bankName} - ${client.bankDetails?.accountNo}\n\n*Stakeholders:*\n${stakeholders}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (isLoading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-20 space-y-4">
       <div className="h-10 w-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Accessing Secured Vault</p>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="overflow-x-auto no-scrollbar flex-1">
        <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
          <thead className="sticky top-0 z-20">
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[70px]">S.No</th>
              <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[240px]">Trade Name</th>
              <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[240px]">Legal Name</th>
              <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[180px]">GSTIN</th>
              
              <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[160px] filter-container relative">
                 <div className="flex items-center gap-2">
                    GSTIN Status
                    <button onClick={() => setActiveFilterMenu(activeFilterMenu === 'gst' ? null : 'gst')} className="p-1 hover:bg-slate-200 rounded transition-colors">
                       <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                    </button>
                 </div>
                 {activeFilterMenu === 'gst' && (
                    <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-1 animate-in zoom-in-95">
                       {['All', 'Active', 'Suspended', 'Cancelled'].map(s => (
                         <button key={s} onClick={() => { setGstStatusFilter(s as any); setActiveFilterMenu(null); }} className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase rounded-lg ${gstStatusFilter === s ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{s}</button>
                       ))}
                    </div>
                 )}
              </th>

              <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[160px] filter-container relative">
                 <div className="flex items-center gap-2">
                    Client Status
                    <button onClick={() => setActiveFilterMenu(activeFilterMenu === 'client' ? null : 'client')} className="p-1 hover:bg-slate-200 rounded transition-colors">
                       <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                    </button>
                 </div>
                 {activeFilterMenu === 'client' && (
                    <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 animate-in zoom-in-95">
                       {['All', 'Active', 'Inactive'].map(s => (
                         <button key={s} onClick={() => { setClientStatusFilter(s as any); setActiveFilterMenu(null); }} className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase rounded-lg ${clientStatusFilter === s ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{s}</button>
                       ))}
                    </div>
                 )}
              </th>

              <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right w-[120px]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredClients.length === 0 ? (
              <tr><td colSpan={7} className="py-32 text-center text-slate-300 font-black uppercase tracking-widest text-sm">No Portfolio Records Match Search</td></tr>
            ) : (
              filteredClients.map((client, idx) => {
                const isClosed = client.gstProfile?.gstStatus === 'Cancelled';
                return (
                  <tr key={client.id} className="hover:bg-indigo-50/20 transition-all group">
                    <td className="px-6 py-5 font-black text-slate-300 text-xs">{(idx + 1).toString().padStart(2, '0')}</td>
                    <td className="px-6 py-5">
                       <p className="font-black text-slate-900 uppercase truncate text-sm" title={client.tradeName}>{client.tradeName || '---'}</p>
                    </td>
                    <td className="px-6 py-5">
                       <p className="font-bold text-slate-600 uppercase truncate text-xs" title={client.legalName}>{client.legalName}</p>
                    </td>
                    <td className="px-6 py-5">
                       <span className={`font-black font-mono tracking-widest uppercase text-xs ${isClosed ? 'text-red-600' : 'text-indigo-600'}`}>{client.gstProfile?.gstin}</span>
                    </td>
                    <td className="px-6 py-5">
                       <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                         isClosed ? 'bg-red-50 text-red-600 border-red-100' : 
                         client.gstProfile?.gstStatus === 'Suspended' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                         'bg-emerald-50 text-emerald-600 border-emerald-100'
                       }`}>
                         {client.gstProfile?.gstStatus || 'Active'}
                       </span>
                    </td>
                    <td className="px-6 py-5">
                       <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                         (client.status === 'Active' || client.status === 'Active Filing') ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                       }`}>
                         {client.status}
                       </span>
                    </td>
                    <td className="px-6 py-5 text-right relative overflow-visible">
                       <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => { setSelectedClient(client); setIsDetailModalOpen(true); }}
                            className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center shadow-sm"
                            title="Quick View"
                          >
                             <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg>
                          </button>
                          
                          <div className="relative inline-block text-left">
                            <button 
                              onClick={() => setActiveActionsId(activeActionsId === client.id ? null : client.id)}
                              className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center shadow-sm"
                            >
                               <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                            </button>

                            {activeActionsId === client.id && (
                               <div ref={actionsRef} className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl z-[200] p-2 animate-in slide-in-from-top-2 origin-top-right overflow-hidden">
                                  <button onClick={() => { copyToClipboard(client.gstProfile?.username || ''); window.open('https://services.gst.gov.in/services/login', '_blank'); setActiveActionsId(null); }} 
                                     className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 rounded-xl transition-colors text-left group">
                                     <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-white transition-colors"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></div>
                                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Portal Login</span>
                                  </button>
                                  <button onClick={() => { shareCredentials(client); setActiveActionsId(null); }} 
                                     className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-emerald-50 rounded-xl transition-colors text-left group">
                                     <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-white transition-colors"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg></div>
                                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Share Creds</span>
                                  </button>
                                  <button onClick={() => { shareFullDetails(client); setActiveActionsId(null); }} 
                                     className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 rounded-xl transition-colors text-left group">
                                     <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-white transition-colors"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Full Profile</span>
                                  </button>
                                  <div className="my-1 border-t border-slate-100" />
                                  <button onClick={() => { setSelectedClient(client); setIsEditModalOpen(true); setActiveActionsId(null); }} 
                                     className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-left group">
                                     <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white transition-colors"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></div>
                                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Edit Vault</span>
                                  </button>
                               </div>
                            )}
                          </div>
                       </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <GSTClientFormModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleDataChange} initialData={selectedClient} />

      {isDetailModalOpen && selectedClient && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl max-h-[95vh] bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="px-6 md:px-10 py-6 md:py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="min-w-0">
                 <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none uppercase truncate">{selectedClient.tradeName || selectedClient.legalName}</h2>
                 <p className="text-xs md:text-sm font-bold text-slate-500 mt-2 uppercase tracking-widest truncate">{selectedClient.legalName}</p>
              </div>
              <div className="flex items-center gap-2 md:gap-3 shrink-0">
                <button onClick={() => { setIsEditModalOpen(true); setIsDetailModalOpen(false); }} className="h-9 md:h-10 px-6 md:px-8 bg-indigo-600 text-white rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-900 transition-all">Edit Profile</button>
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
                          <p className={`text-base md:text-lg font-black font-mono tracking-widest ${selectedClient.gstProfile?.gstStatus === 'Cancelled' ? 'text-red-600' : 'text-indigo-600'}`}>{selectedClient.gstProfile?.gstin}</p>
                          <button onClick={() => { copyToClipboard(selectedClient.gstProfile?.gstin || ''); alert("Copied GSTIN"); }} className="h-8 w-8 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                             <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2-2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>
                          </button>
                        </div>
                     </div>
                     <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400">GSTIN Status</p><p className={`text-sm md:text-base font-black uppercase ${selectedClient.gstProfile?.gstStatus === 'Cancelled' ? 'text-red-600' : 'text-slate-900'}`}>{selectedClient.gstProfile?.gstStatus || 'Active'}</p></div>
                     <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400">Mobile</p><p className="text-sm md:text-base font-black text-slate-900">{selectedClient.mobile}</p></div>
                     <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400">Reg. Type</p><p className="text-sm md:text-base font-black text-slate-900">{selectedClient.gstProfile?.regType}</p></div>
                     <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400">Constitution</p><p className="text-sm md:text-base font-black text-slate-900">{selectedClient.gstProfile?.constitution}</p></div>
                  </div>
               </section>

               <section>
                  <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 mb-6 flex items-center gap-3">Login Credentials <div className="h-px flex-1 bg-slate-100" /></h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div className="space-y-0.5"><p className="text-[9px] font-black uppercase text-slate-400">User ID</p><p className="text-sm md:text-base font-black text-slate-900">{selectedClient.gstProfile?.username}</p></div>
                        <button onClick={() => { copyToClipboard(selectedClient.gstProfile?.username || ''); alert("Copied ID"); }} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-indigo-600 shadow-sm transition-all border border-slate-100"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2-2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2" /></svg></button>
                     </div>
                     <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div className="space-y-0.5"><p className="text-[9px] font-black uppercase text-slate-400">Password</p><p className="text-sm md:text-base font-black text-slate-900 tracking-wider">••••••••</p></div>
                        <button onClick={() => { copyToClipboard(selectedClient.gstProfile?.password || ''); alert("Copied Pass"); }} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-indigo-600 shadow-sm transition-all border border-slate-100"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2-2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2" /></svg></button>
                     </div>
                  </div>
               </section>
            </div>
            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0">
               <button onClick={() => shareFullDetails(selectedClient)} className="px-8 py-4 bg-white border border-slate-200 text-slate-900 font-black uppercase text-[10px] rounded-xl shadow-sm hover:bg-slate-100 transition-all flex items-center gap-2">
                 <svg className="h-4 w-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                 Share Profile
               </button>
               <button onClick={() => setIsDetailModalOpen(false)} className="px-10 py-4 bg-indigo-600 text-white font-black uppercase text-[10px] rounded-xl shadow-lg hover:bg-slate-900 transition-all">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GstMasterPortfolio;
