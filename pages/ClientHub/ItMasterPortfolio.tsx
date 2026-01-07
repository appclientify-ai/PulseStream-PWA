import React, { useState, useEffect, useMemo } from 'react';
import { Client } from '../../types';
import { mockBackend } from '../../services/mockBackend';
import ITClientFormModal from '../Clientform/ITClientFormModal';
import Loader from '../../components/Loader';

interface ItMasterPortfolioProps {
  externalSearch?: string;
  hideInternalSearch?: boolean;
  categoryFilter?: string;
  onDataChange?: () => void;
}

const ItMasterPortfolio: React.FC<ItMasterPortfolioProps> = ({ 
  externalSearch = '', 
  hideInternalSearch = false,
  categoryFilter = 'All',
  onDataChange
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isItModalOpen, setIsItModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [statusColFilter, setStatusColFilter] = useState<string>('All');
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  
  const [tempPassword, setTempPassword] = useState('');
  const [showPassInView, setShowPassInView] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [localPassValue, setLocalPassValue] = useState('');
  const [showPassInLogin, setShowPassInLogin] = useState(false);
  const [isSavingPass, setIsSavingPass] = useState(false);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const data = await mockBackend.getClients();
      setClients(data.filter(c => !!c.itProfile) || []);
    } catch (error) {
      console.error("Failed to fetch clients", error);
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDataChange = () => {
    fetchClients();
    if (onDataChange) onDataChange();
  };

  const filteredClients = useMemo(() => {
    let list = Array.isArray(clients) ? clients : [];
    
    if (categoryFilter !== 'All') {
      list = list.filter(c => c.itProfile?.category === categoryFilter);
    }

    if (statusColFilter !== 'All') {
      list = list.filter(c => c.status === statusColFilter);
    }

    const s = (externalSearch || search || '').toLowerCase();
    return list.filter(c => 
      (c.legalName || '').toLowerCase().includes(s) || 
      (c.tradeName || '').toLowerCase().includes(s) || 
      (c.itProfile?.pan && c.itProfile.pan.toLowerCase().includes(s)) || 
      (c.mobile || '').includes(s)
    );
  }, [clients, search, externalSearch, categoryFilter, statusColFilter]);

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsItModalOpen(true);
    setIsDetailModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this IT record from vault?')) {
      await mockBackend.deleteClient(id);
      setIsDetailModalOpen(false);
      handleDataChange();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const shareViaWhatsApp = (text: string) => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleUpdateGatewayPassword = async () => {
    if (!selectedClient) return;
    setIsSavingPass(true);
    try {
      const updatedClient = {
        ...selectedClient,
        itProfile: { ...selectedClient.itProfile!, password: tempPassword }
      };
      await mockBackend.saveClient(updatedClient);
      setSelectedClient(updatedClient);
      handleDataChange();
      setTimeout(() => setIsSavingPass(false), 800);
    } catch (err) {
      setIsSavingPass(false);
    }
  };

  const openPortalLogin = async (client: Client, finalPass?: string) => {
    if (finalPass && finalPass !== client.itProfile?.password) {
      const updatedClient = {
        ...client,
        itProfile: { ...client.itProfile!, password: finalPass }
      };
      await mockBackend.saveClient(updatedClient);
      handleDataChange();
    }
    copyToClipboard(client.itProfile?.username || '');
    window.open('https://eportal.incometax.gov.in/iec/foservices/#/login', '_blank');
  };

  const saveQuickPasswordFromView = async () => {
    if (!selectedClient) return;
    const updatedClient = {
      ...selectedClient,
      itProfile: { ...selectedClient.itProfile!, password: localPassValue }
    };
    await mockBackend.saveClient(updatedClient);
    setSelectedClient(updatedClient);
    setIsEditingPassword(false);
    handleDataChange();
  };

  const getCredText = (client: Client) => {
    return `*IT Credentials for ${client.legalName}*\n\n*PAN:* ${client.itProfile?.pan}\n*Username:* ${client.itProfile?.username}\n*Password:* ${client.itProfile?.password}\n\n_Shared via Clientify_`;
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="flex-1 bg-white overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse table-auto min-w-[1000px]">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400">S.No.</th>
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400">Name</th>
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400">Father name</th>
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400">Trade/company name</th>
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Pan No.</th>
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">mobile no</th>
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap relative">
                   <div className="flex items-center gap-1.5">
                      Client Status
                      <button onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)} className={`h-6 w-6 rounded-md flex items-center justify-center transition-colors ${statusColFilter !== 'All' ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400 hover:bg-slate-200'}`}>
                         <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                      </button>
                   </div>
                   {isStatusFilterOpen && (
                     <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 animate-in zoom-in-95">
                        {['All', 'Active', 'Inactive'].map(opt => (
                           <button key={opt} onClick={() => { setStatusColFilter(opt); setIsStatusFilterOpen(false); }} className={`w-full text-left px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg ${statusColFilter === opt ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{opt}</button>
                        ))}
                     </div>
                   )}
                </th>
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400 text-right">action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.length === 0 ? (
                <tr><td colSpan={8} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No IT records found</td></tr>
              ) : (
                filteredClients.map((client, idx) => {
                  const tradeOrCompany = client.itProfile?.incomeType === 'Salary' 
                    ? client.itProfile?.companyName 
                    : client.tradeName;

                  return (
                    <tr key={client.id} className={`group transition-all text-[12px] ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40 hover:bg-emerald-50/30'}`}>
                      <td className="px-4 py-5"><span className="font-black text-slate-300">{(idx + 1).toString().padStart(2, '0')}</span></td>
                      <td className="px-4 py-5">
                        <p className="font-black text-slate-900 leading-tight truncate max-w-[180px] uppercase">{client.legalName}</p>
                      </td>
                      <td className="px-4 py-5">
                        <p className="font-bold text-slate-500 uppercase truncate max-w-[160px]">{client.itProfile?.fatherName || '---'}</p>
                      </td>
                      <td className="px-4 py-5">
                        <p className="font-black text-slate-700 truncate max-w-[160px] uppercase">{tradeOrCompany || '---'}</p>
                      </td>
                      <td className="px-4 py-5 whitespace-nowrap">
                         <span className="font-black text-emerald-600 font-mono tracking-widest uppercase">{client.itProfile?.pan}</span>
                      </td>
                      <td className="px-4 py-5 whitespace-nowrap">
                         <span className="font-black text-slate-600 tracking-wider">{client.mobile || '---'}</span>
                      </td>
                      <td className="px-4 py-5 whitespace-nowrap">
                         <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                           client.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                         }`}>
                           {client.status || 'Active'}
                         </span>
                      </td>
                      <td className="px-4 py-5 text-right whitespace-nowrap">
                         <div className="flex items-center justify-end gap-2">
                            <button onClick={() => { setSelectedClient(client); setIsDetailModalOpen(true); setShowPassInView(false); setIsEditingPassword(false); setLocalPassValue(client.itProfile?.password || ''); }}
                              className="h-8 w-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 shadow-sm flex items-center justify-center transition-all">
                               <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg>
                            </button>
                            <div className="relative">
                               <button 
                                 onClick={() => setActiveMenuId(activeMenuId === client.id ? null : client.id)}
                                 className="h-8 w-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-900 shadow-sm flex items-center justify-center transition-all"
                               >
                                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01" /></svg>
                               </button>
                               {activeMenuId === client.id && (
                                 <>
                                   <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)} />
                                   <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-1.5 animate-in zoom-in-95">
                                     <div className="px-3 py-2 border-b border-slate-50 mb-1">
                                        <p className="text-[10px] font-black uppercase text-emerald-600 truncate">{client.legalName}</p>
                                     </div>
                                     <button onClick={() => { setSelectedClient(client); setTempPassword(client.itProfile?.password || ''); setIsLoginModalOpen(true); setActiveMenuId(null); }}
                                       className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-colors"
                                     >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                        Login Gateway
                                     </button>
                                     <div className="h-px bg-slate-100 my-1" />
                                     <button onClick={() => { shareViaWhatsApp(getCredText(client)); setActiveMenuId(null); }}
                                       className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl">
                                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                        WhatsApp Credentials
                                     </button>
                                   </div>
                                 </>
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
      </div>

      <ITClientFormModal isOpen={isItModalOpen} onClose={() => setIsItModalOpen(false)} onSave={() => handleDataChange()} initialData={selectedClient} />

      {/* DETAIL MODAL matching design request */}
      {isDetailModalOpen && selectedClient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{selectedClient.legalName}</h2>
                 <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">IT Vault Record</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => handleDelete(selectedClient.id)} className="h-10 px-6 bg-white border border-red-100 text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50">Delete</button>
                <button onClick={() => handleEdit(selectedClient)} className="h-10 px-8 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-900 transition-all">Edit</button>
                <button onClick={() => setIsDetailModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-200">
                  <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
                </button>
              </div>
            </div>
            
            <div className="p-10 overflow-y-auto no-scrollbar flex-1 space-y-10">
               <section>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600 mb-6 flex items-center gap-3">Basic Identity <div className="h-px flex-1 bg-slate-100" /></h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                     <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">PAN Identifier</p><p className="text-lg font-black text-emerald-600 font-mono tracking-widest uppercase">{selectedClient.itProfile?.pan}</p></div>
                     <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">Entity Category</p><p className="text-sm font-black text-slate-900 uppercase">{selectedClient.itProfile?.category}</p></div>
                     <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">Father's Name</p><p className="text-sm font-black text-slate-900 uppercase">{selectedClient.itProfile?.fatherName || 'N/A'}</p></div>
                     <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">Income Type</p><p className="text-sm font-black text-slate-900 uppercase">{selectedClient.itProfile?.incomeType || 'N/A'}</p></div>
                     
                     <div className="md:col-span-2">
                        <p className="text-[9px] font-black uppercase text-slate-400 mb-1">{selectedClient.itProfile?.incomeType === 'Salary' ? 'Employer / Company' : 'Trade / Firm Name'}</p>
                        <p className="text-sm font-black text-slate-900 uppercase">{selectedClient.itProfile?.incomeType === 'Salary' ? (selectedClient.itProfile?.companyName || 'N/A') : (selectedClient.tradeName || 'N/A')}</p>
                     </div>
                     <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">Mobile</p><p className="text-sm font-black text-slate-900">{selectedClient.mobile || 'N/A'}</p></div>
                     <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">Status</p><p className="text-sm font-black text-emerald-600 uppercase">{selectedClient.status}</p></div>
                  </div>
               </section>

               <section>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600 mb-6 flex items-center gap-3">Vault Credentials <div className="h-px flex-1 bg-slate-100" /></h4>
                  <div className="flex flex-col md:flex-row gap-4 items-stretch">
                     <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div><p className="text-[9px] font-black uppercase text-slate-400">User ID (PAN)</p><p className="text-base font-black text-slate-900 font-mono tracking-widest uppercase">{selectedClient.itProfile?.username}</p></div>
                        <button onClick={() => { copyToClipboard(selectedClient.itProfile?.username || ''); alert('Copied'); }} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-emerald-600 shadow-sm transition-all"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg></button>
                     </div>
                     <div className="flex-[1.5] bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                        <div className="flex-1">
                           <p className="text-[9px] font-black uppercase text-slate-400">Vault Password</p>
                           {isEditingPassword ? <input autoFocus value={localPassValue} onChange={e => setLocalPassValue(e.target.value)} className="bg-white border border-emerald-200 rounded-lg px-2 h-10 w-full font-black text-sm" /> : <p className="text-base font-black text-slate-900 tracking-wider">{showPassInView ? selectedClient.itProfile?.password : '••••••••'}</p>}
                        </div>
                        <div className="flex gap-1.5">
                           {!isEditingPassword ? (
                             <>
                               <button onClick={() => setShowPassInView(!showPassInView)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-emerald-600 shadow-sm transition-all"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg></button>
                               <button onClick={() => setIsEditingPassword(true)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-emerald-600 shadow-sm transition-all"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                             </>
                           ) : (
                             <button onClick={saveQuickPasswordFromView} className="h-10 w-10 bg-green-600 text-white rounded-xl flex items-center justify-center shadow-lg transition-all"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></button>
                           )}
                        </div>
                     </div>
                     <button onClick={() => openPortalLogin(selectedClient)} className="px-8 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-900 transition-all flex items-center gap-2 shrink-0">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg> Login
                     </button>
                  </div>
               </section>

               <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600 mb-6 flex items-center gap-3">Bank Details <div className="h-px flex-1 bg-slate-100" /></h4>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                       <div className="flex justify-between"><span className="text-[9px] font-black uppercase text-slate-400">Bank</span><span className="text-sm font-black text-slate-900">{selectedClient.bankDetails?.bankName || 'N/A'}</span></div>
                       <div className="flex justify-between"><span className="text-[9px] font-black uppercase text-slate-400">Account</span><span className="text-sm font-black text-slate-900 font-mono tracking-tight">{selectedClient.bankDetails?.accountNo || 'N/A'}</span></div>
                       <div className="flex justify-between"><span className="text-[9px] font-black uppercase text-slate-400">IFSC</span><span className="text-sm font-black text-emerald-600 font-mono tracking-widest">{selectedClient.bankDetails?.ifsc || 'N/A'}</span></div>
                    </div>
                 </div>
                 <div>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600 mb-6 flex items-center gap-3">Staff Notes <div className="h-px flex-1 bg-slate-100" /></h4>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 min-h-[120px]">
                       <p className="text-sm font-medium text-slate-600 italic leading-relaxed">{selectedClient.remarks || 'No internal remarks for this client.'}</p>
                    </div>
                 </div>
               </section>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-6 shrink-0">
               <div className="flex items-center justify-between gap-4"><div className="flex-1 h-px bg-slate-200" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap px-2">Vault Share Suite</span><div className="flex-1 h-px bg-slate-200" /></div>
               <div className="flex flex-wrap items-center justify-center gap-4">
                  <button onClick={() => shareViaWhatsApp(getCredText(selectedClient))} className="flex items-center gap-3 h-14 px-8 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-600 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm">
                     <svg className="h-5 w-5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                     WhatsApp Credentials
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* PORTAL GATEWAY MODAL */}
      {isLoginModalOpen && selectedClient && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-lg p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 flex flex-col space-y-6 animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                 <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2m10 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2m10 0h-10" /></svg></div>
                 <button onClick={() => setIsLoginModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-100"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg></button>
              </div>
              <div className="text-center space-y-1"><h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{selectedClient.legalName}</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IT Portal Gateway</p></div>
              <div className="space-y-4 pt-2">
                 <div><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">PAN / ID</label>
                    <div className="flex gap-2">
                       <input readOnly value={selectedClient.itProfile?.username} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-slate-800 outline-none" />
                       <button onClick={() => { copyToClipboard(selectedClient.itProfile?.username || ''); alert('Copied'); }} className="px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-emerald-600 transition-all"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2" /></svg></button>
                    </div>
                 </div>
                 <div><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Portal Password</label>
                    <div className="relative flex gap-2">
                       <div className="relative flex-1">
                          <input type={showPassInLogin ? "text" : "password"} value={tempPassword} onChange={e => setTempPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-slate-800 pr-12 outline-none focus:ring-4 focus:ring-emerald-50 transition-all" />
                          <button onClick={() => setShowPassInLogin(!showPassInLogin)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors">{showPassInLogin ? <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg> : <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>}</button>
                       </div>
                       <button onClick={handleUpdateGatewayPassword} disabled={isSavingPass || tempPassword === selectedClient.itProfile?.password}
                         className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${isSavingPass ? 'bg-green-600 text-white' : tempPassword !== selectedClient.itProfile?.password ? 'bg-emerald-600 text-white hover:bg-slate-900' : 'bg-slate-100 text-slate-300'}`}>
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                       </button>
                    </div>
                 </div>
              </div>
              <button onClick={() => { openPortalLogin(selectedClient, tempPassword); setIsLoginModalOpen(false); }}
                className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-900 transition-all active:scale-95 flex items-center justify-center gap-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> Login to IT Portal
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default ItMasterPortfolio;