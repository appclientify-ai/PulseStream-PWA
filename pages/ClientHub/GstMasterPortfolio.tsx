
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Client, GstStatus, ClientStatus } from '../../types.ts';
import { api } from '../../services/api.ts';
import GSTClientFormModal from '../Clientform/GSTClientFormModal.tsx';

interface GstMasterPortfolioProps {
  externalSearch?: string;
  onDataChange?: () => void;
  onViewDetail?: (client: Client) => void;
}

const GstMasterPortfolio: React.FC<GstMasterPortfolioProps> = ({ 
  externalSearch = '', 
  onDataChange,
  onViewDetail
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [relFilter, setRelFilter] = useState<string>('All');
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [isRelFilterOpen, setIsRelFilterOpen] = useState(false);

  // Login Tool Box State
  const [isLoginBoxOpen, setIsLoginBoxOpen] = useState(false);
  const [loginToolClient, setLoginToolClient] = useState<Client | null>(null);
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [isEditingLoginPass, setIsEditingLoginPass] = useState(false);
  const [tempPass, setTempPass] = useState('');

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setActiveActionsId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDataChange = () => {
    fetch();
    if (onDataChange) onDataChange();
  };

  const filteredClients = useMemo(() => {
    const s = externalSearch.toLowerCase();
    let list = clients.filter(c => 
      c.legalName.toLowerCase().includes(s) || 
      (c.tradeName || '').toLowerCase().includes(s) ||
      (c.gstProfile?.gstin || '').toLowerCase().includes(s) ||
      (c.mobile && c.mobile.includes(s))
    );

    if (statusFilter !== 'All') list = list.filter(c => (c.gstProfile?.gstStatus || 'Active') === statusFilter);
    if (relFilter !== 'All') list = list.filter(c => c.status === relFilter);

    return list;
  }, [clients, externalSearch, statusFilter, relFilter]);

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); };
  const shareViaWhatsApp = (text: string) => { window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank'); };

  const handleUpdatePassword = async () => {
    if (!loginToolClient || !tempPass.trim()) return;
    try {
      const updated = { ...loginToolClient, gstProfile: { ...loginToolClient.gstProfile!, password: tempPass } };
      await api.saveClient(updated);
      setLoginToolClient(updated as Client);
      setIsEditingLoginPass(false);
      fetch();
    } catch (err) { alert("Vault update failed."); }
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
        <table className="w-full text-left border-collapse table-fixed min-w-[1400px]">
          <thead className="sticky top-0 z-20">
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[60px]">S.No</th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[200px]">Trade Name</th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[200px]">Legal Name</th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[130px]">Mobile No</th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[180px]">GSTIN</th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[120px] relative">
                <div className="flex items-center gap-1">Status <button onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)} className="p-1 hover:bg-slate-200 rounded"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg></button></div>
                {isStatusFilterOpen && (
                  <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-[400] p-1 animate-in zoom-in-95">
                    {['All', 'Active', 'Suspended', 'Closed'].map(f => (
                      <button key={f} onClick={() => { setStatusFilter(f); setIsStatusFilterOpen(false); }} className={`w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg ${statusFilter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{f}</button>
                    ))}
                  </div>
                )}
              </th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[150px] relative">
                <div className="flex items-center gap-1">Relationship <button onClick={() => setIsRelFilterOpen(!isRelFilterOpen)} className="p-1 hover:bg-slate-200 rounded"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg></button></div>
                {isRelFilterOpen && (
                  <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-[400] p-1 animate-in zoom-in-95">
                    {['All', 'Active Filing', 'Litigation', 'Inactive'].map(f => (
                      <button key={f} onClick={() => { setRelFilter(f); setIsRelFilterOpen(false); }} className={`w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg ${relFilter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{f}</button>
                    ))}
                  </div>
                )}
              </th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right w-[110px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredClients.map((client, idx) => (
              <tr key={client.id} className="hover:bg-indigo-50/20 transition-all group border-b border-slate-100 last:border-0 text-[12px]">
                <td className="px-4 py-2 font-black text-slate-300 text-[11px]">{idx + 1}</td>
                <td className="px-4 py-2"><p className="font-black text-slate-900 uppercase truncate" title={client.tradeName}>{client.tradeName}</p></td>
                <td className="px-4 py-2"><p className="font-bold text-slate-600 uppercase truncate text-[11px]" title={client.legalName}>{client.legalName}</p></td>
                <td className="px-4 py-2"><p className="font-black text-slate-500 text-[11px]">{client.mobile || '---'}</p></td>
                <td className="px-4 py-2">
                   <div className="flex items-center gap-2 group/gstin">
                      <span className="font-black font-mono tracking-widest uppercase text-[11px] text-indigo-600">{client.gstProfile?.gstin}</span>
                      <button onClick={() => { copyToClipboard(client.gstProfile?.gstin || ''); window.open(`https://services.gst.gov.in/services/searchtp?gstin=${client.gstProfile?.gstin}`, '_blank'); }}
                         className="h-6 w-6 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center opacity-0 group-hover/gstin:opacity-100 shadow-sm border border-indigo-100"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></button>
                   </div>
                </td>
                <td className="px-4 py-2"><span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border bg-emerald-50 text-emerald-600 border-emerald-100">{client.gstProfile?.gstStatus}</span></td>
                <td className="px-4 py-2"><span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border bg-indigo-50 text-indigo-600 border-indigo-100">{client.status}</span></td>
                <td className="px-4 py-2 text-right relative overflow-visible">
                   <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => onViewDetail?.(client)} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center shadow-sm"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg></button>
                      <div className="relative inline-block text-left">
                        <button onClick={() => setActiveActionsId(activeActionsId === client.id ? null : client.id)} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 flex items-center justify-center shadow-sm"><svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg></button>
                        {activeActionsId === client.id && (
                           <div ref={actionsRef} className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[500] p-2 animate-in zoom-in-95 origin-top-right overflow-hidden">
                              <button onClick={() => { setLoginToolClient(client); setTempPass(client.gstProfile?.password || ''); setIsLoginBoxOpen(true); setActiveActionsId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 rounded-xl transition-colors text-left group">
                                 <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></div>
                                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Login Portal</span>
                              </button>
                              <button onClick={() => { shareViaWhatsApp(`*GST Vault*\n*Client:* ${client.tradeName}\n*GSTIN:* ${client.gstProfile?.gstin}\n*User:* ${client.gstProfile?.username}\n*Pass:* ${client.gstProfile?.password}`); setActiveActionsId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-50 rounded-xl transition-colors text-left group">
                                 <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></div>
                                 <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Share Credential</span>
                              </button>
                              <div className="my-1 border-t border-slate-100" />
                              <button onClick={() => { setSelectedClient(client); setIsEditModalOpen(true); setActiveActionsId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-left group">
                                 <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></div>
                                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Edit Records</span>
                              </button>
                           </div>
                        )}
                      </div>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <GSTClientFormModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleDataChange} initialData={selectedClient} />
      {isLoginBoxOpen && loginToolClient && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 border border-slate-200">
              <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
                 <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-2">Portal Access Utility</p><h3 className="text-xl font-black uppercase truncate">{loginToolClient.tradeName}</h3></div>
                 <button onClick={() => setIsLoginBoxOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg></button>
              </div>
              <div className="p-10 space-y-8">
                 <div className="space-y-4">
                    <div className="flex items-center justify-between px-2"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Entity GSTIN</span></div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                       <code className="text-lg font-black text-indigo-600 font-mono tracking-widest uppercase">{loginToolClient.gstProfile?.gstin}</code>
                       <button onClick={() => { copyToClipboard(loginToolClient.gstProfile?.gstin || ''); alert('Copied'); }} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2-2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2" /></svg></button>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">User ID</span>
                       <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                          <span className="text-sm font-black text-slate-900 uppercase truncate">{loginToolClient.gstProfile?.username}</span>
                          <button onClick={() => { copyToClipboard(loginToolClient.gstProfile?.username || ''); alert('Copied'); }} className="p-1.5 text-slate-300 hover:text-indigo-600 transition-colors"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2-2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2" /></svg></button>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Password</span>
                       <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                          <span className="text-sm font-black text-indigo-600 tracking-wider truncate">{showLoginPass ? loginToolClient.gstProfile?.password : '••••••••'}</span>
                          <div className="flex gap-1.5">
                             <button onClick={() => setShowLoginPass(!showLoginPass)} className="p-1 text-slate-300 hover:text-indigo-600">{showLoginPass ? '🙈' : '👁️'}</button>
                             <button onClick={() => setIsEditingLoginPass(true)} className="p-1 text-slate-300 hover:text-amber-500"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100">
                 <button onClick={() => { copyToClipboard(loginToolClient.gstProfile?.username || ''); window.open('https://services.gst.gov.in/services/login', '_blank'); }}
                   className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 transition-all shadow-2xl active:scale-[0.98] flex items-center justify-center gap-3">
                    Launch Portal & Sync ID <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2-2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default GstMasterPortfolio;
