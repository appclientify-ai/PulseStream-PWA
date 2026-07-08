import React, { useState, useEffect, useMemo, useRef } from 'react';
import { formatDate } from '../../exportUtils';
import { Client, GstStatus, ClientStatus } from '../../types.ts';
import { api } from '../../services/api.ts';
import GSTClientFormModal from '../Clientform/GSTClientFormModal.tsx';
import GSTViewIcon from '../../components/GSTViewIcon';
import { toast } from 'sonner';

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
  const [shareText, setShareText] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [relFilter, setRelFilter] = useState<string>('All');
  const [activeFilterMenu, setActiveFilterMenu] = useState<'status' | 'rel' | null>(null);
  const [filterMenuPos, setFilterMenuPos] = useState({ top: 0, left: 0 });

  const openFilterMenu = (e: React.MouseEvent, type: 'status' | 'rel') => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setFilterMenuPos({ top: rect.bottom + 4, left: rect.left });
    setActiveFilterMenu(activeFilterMenu === type ? null : type);
    setActiveActionsId(null); // close other menus
  };

  // Login Tool Box State
  const [isLoginBoxOpen, setIsLoginBoxOpen] = useState(false);
  const [loginToolClient, setLoginToolClient] = useState<Client | null>(null);
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [isEditingLoginPass, setIsEditingLoginPass] = useState(false);
  const [tempPass, setTempPass] = useState('');

  // Actions Menu State (Fixed Positioning)
  const [activeActionsId, setActiveActionsId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const actionsRef = useRef<HTMLDivElement>(null);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const data = await api.getClients();
      setClients((data || []).filter(c => c && c.gstProfile));
    } catch (err) { console.error("Fetch failed", err); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchClients(); }, []);

  // Handle closing menu on click outside or scroll
  useEffect(() => {
    const handleClose = (event: any) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setActiveActionsId(null);
      }
      setActiveFilterMenu(null);
    };
    const handleScroll = () => {
      setActiveActionsId(null);
      setActiveFilterMenu(null);
    };

    if (activeActionsId || activeFilterMenu) {
      document.addEventListener('mousedown', handleClose);
      window.addEventListener('scroll', handleScroll, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClose);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [activeActionsId, activeFilterMenu]);

  const handleDataChange = () => {
    fetchClients();
    if (onDataChange) onDataChange();
  };

  const filteredClients = useMemo(() => {
    const s = (externalSearch || '').toLowerCase();
    let list = (clients || []).filter(c => {
      if (!c) return false;
      const safeString = (val: any) => typeof val === 'string' ? val.toLowerCase() : String(val || '').toLowerCase();
      
      return safeString(c.legalName).includes(s) || 
             safeString(c.tradeName).includes(s) ||
             safeString(c.gstProfile?.gstin).includes(s) ||
             safeString(c.mobile).includes(s);
    });

    if (statusFilter !== 'All') {
      list = list.filter(c => c && (c.gstProfile?.gstStatus || 'Active') === statusFilter);
    }
    if (relFilter !== 'All') {
      list = list.filter(c => c?.status === relFilter);
    }

    return list;
  }, [clients, externalSearch, statusFilter, relFilter]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleShareClick = (text: string) => {
    setShareText(text);
    setIsShareModalOpen(true);
  };
  
  const proceedShare = () => {
    const final = shareText + (selectedNote ? '\n\n*Note:*\n' + selectedNote : '');
    window.location.href = `whatsapp://send?text=${encodeURIComponent(final)}`;
    setIsShareModalOpen(false);
  };

  const handleUpdatePassword = async () => {
    if (!loginToolClient || !tempPass.trim()) return;
    try {
      const updated = { ...loginToolClient, gstProfile: { ...loginToolClient.gstProfile!, password: tempPass } };
      await api.saveClient(updated);
      setLoginToolClient(updated as Client);
      setIsEditingLoginPass(false);
      fetchClients();
    } catch (err) { toast.error("Vault update failed."); }
  };

  const openActionsMenu = (e: React.MouseEvent, client: Client) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({ 
      top: rect.bottom + window.scrollY + 8, 
      left: rect.right - 256 
    });
    setActiveActionsId(client.id);
    setSelectedClient(client);
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsEditModalOpen(true);
  };

  if (isLoading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-20 space-y-4">
       <div className="h-10 w-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Accessing Secured Vault</p>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <div className="overflow-x-auto no-scrollbar flex-1 w-full">
        <table className="w-full text-left border-collapse table-auto min-w-full">
          <thead className=" sticky top-0 z-20">
            <tr className="bg-slate-50 border-b border-slate-200 shadow-sm">
              <th className=" px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900">S.No.</th>
              <th className=" px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900">Trade Name</th>
              <th className=" px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900">Legal Name</th>
              <th className=" px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900">Mobile No</th>
              <th className=" px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900">GSTIN</th>
              <th className=" px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900">
                <div className="flex items-center gap-1">
                  Status
                  <button onClick={(e) => openFilterMenu(e, 'status')} className="p-1 hover:bg-slate-200 rounded transition-colors">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                  </button>
                </div>
              </th>
              <th className=" px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900">
                <div className="flex items-center gap-1">
                  Relationship
                  <button onClick={(e) => openFilterMenu(e, 'rel')} className="p-1 hover:bg-slate-200 rounded transition-colors">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                  </button>
                </div>
              </th>
              <th className=" px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredClients.length === 0 ? (
              <tr><td colSpan={8} className=" py-32 text-center text-slate-300 font-black uppercase tracking-widest text-sm">No records found in vault</td></tr>
            ) : (
              filteredClients.map((client, idx) => (
                <tr key={client.id} className="hover:bg-indigo-50/20 transition-all group border-b border-slate-50 last:border-0 h-[44px]">
                  <td className=" px-[5.5px] py-[2px] font-black text-indigo-400 font-mono text-[11px] truncate">
                    {(idx + 1).toString().padStart(2, '0')}
                  </td>
                  <td className=" px-[5.5px] py-[2px]">
                     <p className="font-black text-slate-900 truncate text-[12px]" title={client.tradeName}>{client.tradeName || '---'}</p>
                  </td>
                  <td className=" px-[5.5px] py-[2px]">
                     <p className="font-bold text-slate-600 truncate text-[12px]" title={client.legalName}>{client.legalName}</p>
                  </td>
                  <td className=" px-[5.5px] py-[2px]">
                     <p className="font-black text-slate-500 text-[12px]">{client.mobile || '---'}</p>
                  </td>
                  <td className=" px-[5.5px] py-[2px]">
                     <div className="flex items-center gap-2 group/gstin">
                        <span className={`font-black font-mono tracking-widest uppercase text-[12px] ${client.gstProfile?.gstStatus === 'Closed' ? 'text-red-600' : 'text-indigo-600'}`}>{client.gstProfile?.gstin}</span>
                        <button 
                           onClick={() => { navigator.clipboard.writeText(client.gstProfile?.gstin || '').then(() => { toast.success('GSTIN Copied!'); window.open('https://services.gst.gov.in/services/searchtp', '_blank'); }); }}
                           className="h-6 w-6 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center opacity-0 group-hover/gstin:opacity-100 shadow-sm border border-indigo-100"
                           title="Verify Ident."
                        >
                           <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </button>
                     </div>
                  </td>
                  <td className=" px-[5.5px] py-[2px]">
                     <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                       client.gstProfile?.gstStatus === 'Closed' ? 'bg-red-50 text-red-600 border-red-100' : 
                       client.gstProfile?.gstStatus === 'Suspended' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                       'bg-emerald-50 text-emerald-600 border-emerald-100'
                     }`}>
                       {client.gstProfile?.gstStatus || 'Active'}
                     </span>
                  </td>
                  <td className=" px-[5.5px] py-[2px]">
                     <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                       client.status === 'Active' || client.status === 'Active Filing' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                       client.status === 'Litigation' ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' :
                       'bg-slate-50 text-slate-400 border-slate-200'
                     }`}>
                       {client.status}
                     </span>
                  </td>
                  <td className=" px-[5.5px] py-[2px] text-right overflow-visible">
                     <div className="flex items-center justify-end gap-1">
                        <GSTViewIcon 
                          client={client}
                          onEdit={handleEdit}
                          onDataChange={handleDataChange}
                          className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center shadow-sm"
                        />
                        
                        <button 
                          onClick={(e) => openActionsMenu(e, client)}
                          className={`h-8 w-8 rounded-lg border transition-all flex items-center justify-center shadow-sm ${activeActionsId === client.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white'}`}
                        >
                           <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                        </button>
                     </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Global Actions Menu - Fixed Positioned to avoid clipping */}
      {activeActionsId && selectedClient && (
        <div 
          ref={actionsRef}
          style={{ top: menuPosition.top, left: menuPosition.left }}
          className="fixed w-64 bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl z-[9999] p-2 animate-in zoom-in-95 origin-top-right overflow-hidden text-left"
        >
          <div className="px-3 py-2 border-b border-slate-50 mb-1">
             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Global Operations</p>
             <p className="text-[10px] font-black text-slate-900 truncate mt-0.5">{selectedClient.tradeName || selectedClient.legalName}</p>
          </div>
          <button onClick={() => { setLoginToolClient(selectedClient!); setTempPass(selectedClient!.gstProfile?.password || ''); setIsLoginBoxOpen(true); setActiveActionsId(null); }} 
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 rounded-xl transition-colors text-left group">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Login Portal</span>
          </button>
          <button onClick={() => { 
              const creds = `*GST Credentials*\n*Entity:* ${selectedClient!.tradeName}\n*GSTIN:* ${selectedClient!.gstProfile?.gstin}\n*User ID:* ${selectedClient!.gstProfile?.username}\n*Password:* ${selectedClient!.gstProfile?.password}`;
              handleShareClick(creds);
              setActiveActionsId(null);
          }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-50 rounded-xl transition-colors text-left group border-t border-slate-50">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">WhatsApp Creds</span>
          </button>
          <button onClick={() => { 
              const fullText = `*Client Details*\nTrade Name: ${selectedClient!.tradeName || 'N/A'}\nLegal Name: ${selectedClient!.legalName || 'N/A'}\nMobile: ${selectedClient!.mobile || 'N/A'}\nEmail: ${selectedClient!.email || 'N/A'}\n\n*GST Details*\nGSTIN: ${selectedClient!.gstProfile?.gstin || 'N/A'}\nStatus: ${selectedClient!.gstProfile?.gstStatus || 'N/A'}\nReg Type: ${selectedClient!.gstProfile?.regType || 'N/A'}\nFiling: ${selectedClient!.gstProfile?.filingFreq || 'N/A'}\nReg Date: ${formatDate(selectedClient!.gstProfile?.regDate)}\nJurisdiction: ${selectedClient!.gstProfile?.jurisdictionType || 'N/A'}\nSector/Range: ${selectedClient!.gstProfile?.sector || selectedClient!.gstProfile?.range || 'N/A'}\n\n*Credentials*\nGST User ID: ${selectedClient!.gstProfile?.username || 'N/A'}\nGST Password: ${selectedClient!.gstProfile?.password || 'N/A'}\n\n*IT Details*\nPAN: ${selectedClient!.itProfile?.pan || 'N/A'}\nIT User ID: ${selectedClient!.itProfile?.username || 'N/A'}\nIT Password: ${selectedClient!.itProfile?.password || 'N/A'}`;
              handleShareClick(fullText);
              setActiveActionsId(null);
          }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-50 rounded-xl transition-colors text-left group">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.126.549 4.2 1.593 6.035L.302 23.687l5.772-1.517a12.001 12.001 0 005.957 1.57h.005c6.645 0 12.031-5.385 12.031-12.031C24.067 5.385 18.681 0 12.031 0zm0 21.724c-1.802 0-3.568-.485-5.114-1.403l-.367-.217-3.8.998 1.018-3.705-.238-.38A9.992 9.992 0 012.016 12.03c0-5.526 4.498-10.024 10.024-10.024 2.678 0 5.195 1.042 7.087 2.937 1.892 1.892 2.934 4.409 2.934 7.087 0 5.528-4.499 10.028-10.025 10.028v-.004c0-.001-.002-.001-.005-.001zM17.53 14.19c-.302-.15-1.785-.882-2.062-.983-.277-.101-.479-.151-.68.15s-.781.983-.956 1.185c-.176.201-.352.226-.653.076-.301-.15-1.275-.471-2.428-1.5-3.036-2.699-2.227-2.699-.582-5.467.243-.404-.76-2.222-1.04-2.912-.272-.676-.55-.584-.755-.595l-.645-.01c-.226 0-.594.084-.904.42-.311.336-1.191 1.163-1.191 2.836 0 1.674 1.221 3.292 1.391 3.519.17.227 2.457 3.864 5.952 5.253.81.321 1.442.513 1.934.656.812.235 1.551.202 2.138.122.656-.09 2.062-.843 2.353-1.657.292-.814.292-1.512.204-1.657-.087-.145-.313-.231-.615-.383z"/></svg></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">WhatsApp Full Info</span>
          </button>
          <div className="my-1 border-t border-slate-100" />
          <button onClick={() => { setIsEditModalOpen(true); setActiveActionsId(null); }} 
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-left group">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Modify Record</span>
          </button>
          <button onClick={() => { if(confirm('Delete client permanently from vault?')) api.deleteClient(selectedClient!.id).then(fetchClients); setActiveActionsId(null); }} 
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 rounded-xl transition-colors text-left group">
              <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Delete Permanently</span>
          </button>
        </div>
      )}

      <GSTClientFormModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleDataChange} initialData={selectedClient} />

      {/* Fixed Positioning Menus to Avoid Clipping */}
      {activeFilterMenu === 'status' && (
        <div style={{ top: filterMenuPos.top, left: filterMenuPos.left }} className="fixed w-32 bg-white border border-slate-200 rounded-[1rem] shadow-xl z-[9999] p-1 animate-in zoom-in-95 origin-top text-left">
          {['All', 'Active', 'Suspended', 'Closed'].map(f => (
            <button key={f} onClick={() => { setStatusFilter(f); setActiveFilterMenu(null); }} className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase rounded-lg ${statusFilter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{f}</button>
          ))}
        </div>
      )}

      {activeFilterMenu === 'rel' && (
        <div style={{ top: filterMenuPos.top, left: filterMenuPos.left }} className="fixed w-44 bg-white border border-slate-200 rounded-[1rem] shadow-xl z-[9999] p-1 animate-in zoom-in-95 origin-top text-left">
          {['All', 'Active', 'Active Filing', 'Litigation', 'Inactive'].map(f => (
            <button key={f} onClick={() => { setRelFilter(f); setActiveFilterMenu(null); }} className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase rounded-lg ${relFilter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{f}</button>
          ))}
        </div>
      )}

      {/* Login Tool Box Modal */}
      {isLoginBoxOpen && loginToolClient && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 border border-slate-200">
              <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
                 <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-2">Portal Access Utility</p>
                    <h3 className="text-xl font-black truncate">{loginToolClient.tradeName}</h3>
                 </div>
                 <button onClick={() => setIsLoginBoxOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"><svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg></button>
              </div>
              
              <div className="p-10 space-y-8">
                 <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Entity GSTIN</span>
                       <button onClick={() => (navigator.clipboard.writeText(loginToolClient.gstProfile?.gstin || '').then(() => { toast.success('GSTIN Copied!'); window.open('https://services.gst.gov.in/services/searchtp', '_blank'); }))} className="text-[9px] font-black uppercase text-indigo-600 hover:underline">Verify Identity</button>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                       <code className="text-lg font-black text-indigo-600 font-mono tracking-widest uppercase">{loginToolClient.gstProfile?.gstin}</code>
                       <button onClick={() => { copyToClipboard(loginToolClient.gstProfile?.gstin || ''); toast.success('Copied'); }} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2-2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2" /></svg></button>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Portal User ID</span>
                       <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                          <span className="text-sm font-black text-slate-900 truncate">{loginToolClient.gstProfile?.username}</span>
                          <button onClick={() => { copyToClipboard(loginToolClient.gstProfile?.username || ''); toast.success('Copied'); }} className="p-1.5 text-slate-300 hover:text-indigo-600 transition-colors"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2-2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2" /></svg></button>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Password</span>
                       <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                          {isEditingLoginPass ? (
                             <input 
                                autoFocus
                                value={tempPass} 
                                onChange={e => setTempPass(e.target.value)} 
                                onBlur={handleUpdatePassword}
                                onKeyDown={e => e.key === 'Enter' && handleUpdatePassword()}
                                className="bg-white border border-indigo-200 rounded-lg px-2 py-1 text-xs font-black w-full outline-none focus:ring-2 focus:ring-indigo-100"
                             />
                          ) : (
                             <>
                                <span className="text-sm font-black text-indigo-600 tracking-wider truncate">{showLoginPass ? loginToolClient.gstProfile?.password : '••••••••'}</span>
                                <div className="flex gap-1.5">
                                   <button onClick={() => setShowLoginPass(!showLoginPass)} className="p-1 text-slate-300 hover:text-indigo-600">{showLoginPass ? '🙈' : '👁️'}</button>
                                   <button onClick={() => setIsEditingLoginPass(true)} className="p-1 text-slate-300 hover:text-amber-500"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                </div>
                             </>
                          )}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100">
                 <button 
                   onClick={() => { copyToClipboard(loginToolClient.gstProfile?.username || ''); window.open('https://services.gst.gov.in/services/login', '_blank'); }}
                   className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 transition-all shadow-2xl active:scale-[0.98] flex items-center justify-center gap-3"
                 >
                    Launch Portal & Sync ID
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2-2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default GstMasterPortfolio;
