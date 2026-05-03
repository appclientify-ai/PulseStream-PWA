
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Client, ClientStatus } from '../../types';
import { api } from '../../services/api.ts';
import ITClientFormModal from '../Clientform/ITClientFormModal';
import ITViewIcon from '../../components/ITViewIcon';
import GSTViewIcon from '../../components/GSTViewIcon';

interface ItMasterPortfolioProps {
  externalSearch?: string;
  onDataChange?: () => void;
}

const ItMasterPortfolio: React.FC<ItMasterPortfolioProps> = ({ 
  externalSearch = '', 
  onDataChange
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);

  // Password Visibility State
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  // Actions Menu State (Fixed Positioning)
  const [activeActionsId, setActiveActionsId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const actionsRef = useRef<HTMLDivElement>(null);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const data = await api.getClients();
      setClients((data || []).filter(c => !!c.itProfile));
    } catch (error) {
      console.error("IT Sync Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  // Handle closing menu on click outside or scroll
  useEffect(() => {
    const handleClose = (event: any) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setActiveActionsId(null);
      }
    };
    const handleScroll = () => setActiveActionsId(null);

    if (activeActionsId) {
      document.addEventListener('mousedown', handleClose);
      window.addEventListener('scroll', handleScroll, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClose);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [activeActionsId]);

  const handleDataChange = () => {
    fetchClients();
    if (onDataChange) onDataChange();
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsEditModalOpen(true);
  };

  const filteredClients = useMemo(() => {
    let list = clients || [];
    if (statusFilter !== 'All') {
      list = list.filter(c => c?.status === statusFilter);
    }
    const s = (externalSearch || '').toLowerCase();
    return list.filter(c => {
      if (!c) return false;
      return (c.legalName || '').toLowerCase().includes(s) || 
      (c.itProfile?.pan || '').toLowerCase().includes(s) ||
      (c.itProfile?.fatherName || '').toLowerCase().includes(s) ||
      String(c.mobile || '').toLowerCase().includes(s);
    });
  }, [clients, externalSearch, statusFilter]);

  const togglePassword = (id: string) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const shareViaWhatsApp = (text: string) => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
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

  if (isLoading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-20 space-y-4">
       <div className="h-10 w-10 border-4 border-slate-100 border-t-emerald-600 rounded-full animate-spin" />
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Accessing IT Vault</p>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <div className="overflow-x-auto no-scrollbar flex-1 w-full">
        <table className="w-full text-left border-collapse table-auto overflow-hidden min-w-[1300px]">
          <thead className="whitespace-nowrap sticky top-0 z-20">
            <tr className="bg-slate-50 border-b border-slate-200 shadow-sm">
              <th className="whitespace-nowrap px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900 w-[100px]">S.No.</th>
              <th className="whitespace-nowrap px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900 w-[240px]">Name</th>
              <th className="whitespace-nowrap px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900 w-[200px]">Father Name</th>
              <th className="whitespace-nowrap px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900 w-[140px]">Mobile No.</th>
              <th className="whitespace-nowrap px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900 w-[160px]">Pan No.</th>
              <th className="whitespace-nowrap px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900 w-[160px]">Password</th>
              <th className="whitespace-nowrap px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900 w-[120px] relative">
                <div className="flex items-center gap-1">
                  Status
                  <button onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)} className="p-1 hover:bg-slate-200 rounded transition-colors">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                  </button>
                </div>
                {isStatusFilterOpen && (
                  <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-[400] p-1 animate-in zoom-in-95 flex flex-col gap-1">
                    {['All', 'Active', 'Inactive'].map(f => (
                      <button key={f} onClick={() => { setStatusFilter(f); setIsStatusFilterOpen(false); }} className={`w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg ${statusFilter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{f}</button>
                    ))}
                  </div>
                )}
              </th>
              <th className="whitespace-nowrap px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900 text-right w-[110px]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredClients.length === 0 ? (
              <tr><td colSpan={8} className="whitespace-nowrap py-32 text-center text-slate-300 font-black uppercase tracking-widest text-sm">No IT master records found</td></tr>
            ) : (
              filteredClients.map((client, idx) => (
                <tr key={client.id} className="hover:bg-emerald-50/10 transition-all group border-b border-slate-50 last:border-0 h-[44px]">
                  <td className="whitespace-nowrap px-[5.5px] py-[2px] font-black text-emerald-600 font-mono text-[12px] truncate">
                    {(idx + 1).toString().padStart(2, '0')}
                  </td>
                  <td className="whitespace-nowrap px-[5.5px] py-[2px]">
                     <p className="font-black text-slate-900 uppercase truncate text-[12px]" title={client.legalName}>{client.legalName}</p>
                  </td>
                  <td className="whitespace-nowrap px-[5.5px] py-[2px]">
                     <p className="font-bold text-slate-600 uppercase truncate text-[12px]" title={client.itProfile?.fatherName}>{client.itProfile?.fatherName || '---'}</p>
                  </td>
                  <td className="whitespace-nowrap px-[5.5px] py-[2px]">
                     <p className="font-black text-slate-500 text-[12px]">{client.mobile || '---'}</p>
                  </td>
                  <td className="whitespace-nowrap px-[5.5px] py-[2px]">
                     <div className="flex items-center gap-2 group/pan">
                        <span className="font-black font-mono tracking-widest uppercase text-[12px] text-emerald-600">{client.itProfile?.pan}</span>
                        <button 
                           onClick={() => { copyToClipboard(client.itProfile?.pan || ''); }}
                           className="h-6 w-6 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center opacity-0 group-hover/pan:opacity-100 shadow-sm border border-emerald-100"
                           title="Copy PAN"
                        >
                           <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2-2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>
                        </button>
                     </div>
                  </td>
                  <td className="whitespace-nowrap px-[5.5px] py-[2px]">
                     <div className="flex items-center gap-2 group/pass">
                        <span className="font-black text-slate-400 text-[12px] tracking-widest">
                           {visiblePasswords.has(client.id) ? client.itProfile?.password : '••••••••'}
                        </span>
                        <button onClick={() => togglePassword(client.id)} className="p-1 text-slate-300 hover:text-indigo-600 opacity-0 group-hover/pass:opacity-100 transition-all">
                           {visiblePasswords.has(client.id) ? '🙈' : '👁️'}
                        </button>
                     </div>
                  </td>
                  <td className="whitespace-nowrap px-[5.5px] py-[2px]">
                     <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                       client.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'
                     }`}>
                       {client.status}
                     </span>
                  </td>
                  <td className="whitespace-nowrap px-[5.5px] py-[2px] text-right overflow-visible">
                     <div className="flex items-center justify-end gap-1">
                        <ITViewIcon 
                          client={client}
                          onEdit={handleEdit}
                          onDataChange={handleDataChange}
                          className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center shadow-sm"
                        />
                        {client.gstProfile && <GSTViewIcon client={client} onDataChange={handleDataChange} />}
                        
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

      {/* Global Actions Menu - Fixed Positioned */}
      {activeActionsId && selectedClient && (
        <div 
          ref={actionsRef}
          style={{ top: menuPosition.top, left: menuPosition.left }}
          className="fixed w-64 bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl z-[9999] p-2 animate-in zoom-in-95 origin-top-right overflow-hidden text-left"
        >
          <div className="px-3 py-2 border-b border-slate-50 mb-1">
             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">IT Operations</p>
             <p className="text-[10px] font-black text-slate-900 truncate uppercase mt-0.5">{selectedClient.legalName}</p>
          </div>
          <button onClick={() => { 
              copyToClipboard(selectedClient!.itProfile?.username || ''); 
              window.open('https://eportal.incometax.gov.in/iec/foservices/#/login', '_blank'); 
              setActiveActionsId(null); 
          }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 rounded-xl transition-colors text-left group">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">IT Portal Login</span>
          </button>
          <button onClick={() => { 
              const creds = `*Income Tax Credentials*\n*Entity:* ${selectedClient!.legalName}\n*PAN:* ${selectedClient!.itProfile?.pan}\n*Password:* ${selectedClient!.itProfile?.password}`;
              shareViaWhatsApp(creds);
              setActiveActionsId(null);
          }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-50 rounded-xl transition-colors text-left group">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">WhatsApp Creds</span>
          </button>
          <div className="my-1 border-t border-slate-100" />
          <button onClick={() => { setIsEditModalOpen(true); setActiveActionsId(null); }} 
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-left group">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Modify Record</span>
          </button>
          <button onClick={() => { if(confirm('Delete IT profile permanently?')) api.deleteClient(selectedClient!.id).then(fetchClients); setActiveActionsId(null); }} 
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 rounded-xl transition-colors text-left group">
              <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Delete Record</span>
          </button>
        </div>
      )}

      <ITClientFormModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleDataChange} initialData={selectedClient} />

      {/* Full Detail View Modal removed - replaced by ITViewIcon */}
    </div>
  );
};

export default ItMasterPortfolio;
