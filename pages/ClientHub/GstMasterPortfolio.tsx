
import React, { useState, useEffect, useMemo } from 'react';
import { Client, JurisdictionType } from '../../types';
import { api } from '../../services/api';
import GSTClientFormModal from '../Clientform/GSTClientFormModal';
import Loader from '../../components/Loader';

interface GstMasterPortfolioProps {
  externalSearch?: string;
  hideInternalSearch?: boolean;
  jurisdictionFilter?: JurisdictionType | 'All';
  sectorFilter?: string;
  rangeFilter?: string;
  onDataChange?: () => void;
}

const GstMasterPortfolio: React.FC<GstMasterPortfolioProps> = ({ 
  externalSearch = '', 
  hideInternalSearch = false,
  jurisdictionFilter = 'All',
  sectorFilter = 'All',
  rangeFilter = 'All',
  onDataChange
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGstModalOpen, setIsGstModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  const [tempPassword, setTempPassword] = useState('');
  const [showPassInView, setShowPassInView] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [localPassValue, setLocalPassValue] = useState('');
  const [showPassInLogin, setShowPassInLogin] = useState(false);
  const [isSavingPass, setIsSavingPass] = useState(false);

  const [gstStatusColFilter, setGstStatusColFilter] = useState<string>('All');
  const [clientStatusColFilter, setClientStatusColFilter] = useState<string>('All');
  const [openFilterCol, setOpenFilterCol] = useState<'gst' | 'status' | null>(null);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/clients');
      setClients(data.filter((c: Client) => !!c.gstProfile) || []);
    } catch (error) {
      console.error("Cloud sync failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = useMemo(() => {
    let list = Array.isArray(clients) ? clients : [];
    
    if (jurisdictionFilter !== 'All') {
      list = list.filter(c => c.gstProfile?.jurisdictionType === jurisdictionFilter);
      if (jurisdictionFilter === 'State' && sectorFilter !== 'All') {
        list = list.filter(c => c.gstProfile?.sector === sectorFilter);
      }
      if (jurisdictionFilter === 'Center' && rangeFilter !== 'All') {
        list = list.filter(c => c.gstProfile?.range === rangeFilter);
      }
    }

    if (gstStatusColFilter !== 'All') {
      list = list.filter(c => c.gstProfile?.gstStatus === gstStatusColFilter);
    }
    if (clientStatusColFilter !== 'All') {
      list = list.filter(c => c.status === clientStatusColFilter);
    }

    const s = (externalSearch || '').toLowerCase();
    return list.filter(c => 
      (c.legalName || '').toLowerCase().includes(s) || 
      (c.tradeName || '').toLowerCase().includes(s) || 
      (c.gstProfile?.gstin && c.gstProfile.gstin.toLowerCase().includes(s))
    );
  }, [clients, externalSearch, jurisdictionFilter, sectorFilter, rangeFilter, gstStatusColFilter, clientStatusColFilter]);

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsGstModalOpen(true);
    setIsDetailModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Permanently delete this client from cloud vault?')) {
      await api.delete(`/clients/${id}`);
      setIsDetailModalOpen(false);
      fetchClients();
      if (onDataChange) onDataChange();
    }
  };

  const handleUpdateGatewayPassword = async () => {
    if (!selectedClient) return;
    setIsSavingPass(true);
    try {
      await api.post('/clients', {
        ...selectedClient,
        id: selectedClient.id || (selectedClient as any)._id,
        gstProfile: { ...selectedClient.gstProfile!, password: tempPassword }
      });
      fetchClients();
      setTimeout(() => setIsSavingPass(false), 800);
    } catch (err) {
      setIsSavingPass(false);
    }
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse table-auto">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400">S.No.</th>
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400">Trade Name</th>
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400">Legal Name</th>
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400">GSTIN</th>
                <th className="px-4 py-5 text-center">Status</th>
                <th className="px-4 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client, idx) => (
                <tr key={client.id || (client as any)._id} className="group hover:bg-slate-50/50 transition-all">
                  <td className="px-4 py-5 text-[12px] font-black text-slate-300">{(idx + 1).toString().padStart(2, '0')}</td>
                  <td className="px-4 py-5 font-black text-slate-900 uppercase truncate max-w-[200px]">{client.tradeName || '---'}</td>
                  <td className="px-4 py-5 font-bold text-slate-500 uppercase truncate max-w-[200px]">{client.legalName}</td>
                  <td className="px-4 py-5 font-black text-indigo-600 font-mono tracking-widest uppercase">{client.gstProfile?.gstin}</td>
                  <td className="px-4 py-5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${client.gstProfile?.gstStatus === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {client.gstProfile?.gstStatus}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button onClick={() => { setSelectedClient(client); setIsDetailModalOpen(true); setLocalPassValue(client.gstProfile?.password || ''); }} className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 12z" /></svg>
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <GSTClientFormModal isOpen={isGstModalOpen} onClose={() => setIsGstModalOpen(false)} onSave={() => fetchClients()} initialData={selectedClient} />

      {/* VIEW MODAL (Simplified for space) */}
      {isDetailModalOpen && selectedClient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl p-8 space-y-6">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-black uppercase">{selectedClient.legalName}</h3>
                <button onClick={() => setIsDetailModalOpen(false)} className="text-slate-400"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg></button>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl">
                   <p className="text-[9px] font-black text-slate-400 uppercase">GSTIN Identification</p>
                   <p className="font-black text-indigo-600 font-mono uppercase">{selectedClient.gstProfile?.gstin}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                   <p className="text-[9px] font-black text-slate-400 uppercase">Portal Password</p>
                   <p className="font-black text-slate-900">{showPassInView ? selectedClient.gstProfile?.password : '••••••••'}</p>
                </div>
             </div>
             <div className="flex gap-3">
                <button onClick={() => handleEdit(selectedClient)} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px]">Edit Cloud Record</button>
                <button onClick={() => handleDelete(selectedClient.id || (selectedClient as any)._id)} className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-black uppercase text-[10px]">Purge Record</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GstMasterPortfolio;
