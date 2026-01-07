
import React, { useState, useEffect, useMemo } from 'react';
import { Client } from '../../types';
import { api } from '../../services/api';
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
      const data = await api.get('/clients');
      setClients(data.filter((c: any) => !!c.itProfile) || []);
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
      await api.delete(`/clients/${id}`);
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
      const id = selectedClient.id || (selectedClient as any)._id;
      await api.post('/clients', {
        ...selectedClient,
        id,
        itProfile: { ...selectedClient.itProfile!, password: tempPassword }
      });
      fetchClients();
      setTimeout(() => setIsSavingPass(false), 800);
    } catch (err) {
      setIsSavingPass(false);
    }
  };

  const openPortalLogin = async (client: Client, finalPass?: string) => {
    if (finalPass && finalPass !== client.itProfile?.password) {
      const id = client.id || (client as any)._id;
      await api.post('/clients', {
        ...client,
        id,
        itProfile: { ...client.itProfile!, password: finalPass }
      });
      handleDataChange();
    }
    copyToClipboard(client.itProfile?.username || '');
    window.open('https://eportal.incometax.gov.in/iec/foservices/#/login', '_blank');
  };

  const saveQuickPasswordFromView = async () => {
    if (!selectedClient) return;
    const id = selectedClient.id || (selectedClient as any)._id;
    try {
      await api.post('/clients', {
        ...selectedClient,
        id,
        itProfile: { ...selectedClient.itProfile!, password: localPassValue }
      });
      setIsEditingPassword(false);
      handleDataChange();
    } catch (e) {}
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
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap relative">Status</th>
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400 text-right">action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client, idx) => {
                const tradeOrCompany = client.itProfile?.incomeType === 'Salary' 
                  ? client.itProfile?.companyName 
                  : client.tradeName;

                return (
                  <tr key={client.id || (client as any)._id} className={`group transition-all text-[12px] ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40 hover:bg-emerald-50/30'}`}>
                    <td className="px-4 py-5"><span className="font-black text-slate-300">{(idx + 1).toString().padStart(2, '0')}</span></td>
                    <td className="px-4 py-5"><p className="font-black text-slate-900 uppercase">{client.legalName}</p></td>
                    <td className="px-4 py-5"><p className="font-bold text-slate-500 uppercase">{client.itProfile?.fatherName || '---'}</p></td>
                    <td className="px-4 py-5"><p className="font-black text-slate-700 uppercase">{tradeOrCompany || '---'}</p></td>
                    <td className="px-4 py-5"><span className="font-black text-emerald-600 font-mono tracking-widest uppercase">{client.itProfile?.pan}</span></td>
                    <td className="px-4 py-5 whitespace-nowrap">
                       <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${client.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                         {client.status || 'Active'}
                       </span>
                    </td>
                    <td className="px-4 py-5 text-right whitespace-nowrap">
                       <div className="flex items-center justify-end gap-2">
                          <button onClick={() => { setSelectedClient(client); setIsDetailModalOpen(true); setShowPassInView(false); setIsEditingPassword(false); setLocalPassValue(client.itProfile?.password || ''); }}
                            className="h-8 w-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 shadow-sm flex items-center justify-center transition-all">
                               <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg>
                          </button>
                          <button onClick={() => { setSelectedClient(client); setTempPassword(client.itProfile?.password || ''); setIsLoginModalOpen(true); }}
                            className="h-8 w-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 shadow-sm flex items-center justify-center transition-all">
                             <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                          </button>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ITClientFormModal isOpen={isItModalOpen} onClose={() => setIsItModalOpen(false)} onSave={() => handleDataChange()} initialData={selectedClient} />

      {/* DETAIL MODAL */}
      {isDetailModalOpen && selectedClient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
            <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{selectedClient.legalName}</h2>
                 <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Cloud Protected IT Record</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => handleEdit(selectedClient)} className="h-10 px-8 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">Edit</button>
                <button onClick={() => setIsDetailModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-200">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
                </button>
              </div>
            </div>
            <div className="p-10 overflow-y-auto no-scrollbar flex-1 space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-slate-50 p-6 rounded-2xl">
                     <p className="text-[9px] font-black text-slate-400 uppercase">PAN Number</p>
                     <p className="text-lg font-black text-indigo-600 font-mono tracking-widest uppercase">{selectedClient.itProfile?.pan}</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl">
                     <p className="text-[9px] font-black text-slate-400 uppercase">Vault Password</p>
                     <p className="text-lg font-black text-slate-900">{selectedClient.itProfile?.password}</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItMasterPortfolio;
