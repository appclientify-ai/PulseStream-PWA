
import React, { useState, useEffect, useMemo } from 'react';
import { Client, JurisdictionType } from '../../types.ts';
import { api } from '../../services/api.ts';
import Loader from '../../components/Loader.tsx';
import GSTClientFormModal from '../Clientform/GSTClientFormModal.tsx';

interface GstMasterPortfolioProps {
  externalSearch?: string;
  hideInternalSearch?: boolean;
  jurisdictionFilter?: JurisdictionType | 'All';
  onDataChange?: () => void;
}

const GstMasterPortfolio: React.FC<GstMasterPortfolioProps> = ({ 
  externalSearch = '', 
  hideInternalSearch = false,
  jurisdictionFilter = 'All',
  onDataChange
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetch = async () => {
    setIsLoading(true);
    try {
      const data = await api.getClients();
      setClients(data.filter(c => !!c.gstProfile));
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const handleDataChange = () => {
    fetch();
    if (onDataChange) onDataChange();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Permanently delete this client from master records?')) {
      await api.deleteClient(id);
      handleDataChange();
    }
  };

  const filteredClients = useMemo(() => {
    let list = clients;
    if (jurisdictionFilter !== 'All') {
      list = list.filter(c => c.gstProfile?.jurisdictionType === jurisdictionFilter);
    }
    const s = externalSearch.toLowerCase();
    return list.filter(c => 
      c.legalName.toLowerCase().includes(s) || 
      c.tradeName?.toLowerCase().includes(s) ||
      (c.gstProfile?.gstin && c.gstProfile.gstin.toLowerCase().includes(s))
    );
  }, [clients, externalSearch, jurisdictionFilter]);

  if (isLoading) return <div className="p-20 text-center text-slate-300 font-black uppercase tracking-[0.2em] animate-pulse">Syncing Records...</div>;

  return (
    <div className="overflow-x-auto no-scrollbar flex-1">
      <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
        <thead className="sticky top-0 z-20">
          <tr className="bg-slate-50 border-b border-slate-100">
            <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[70px]">S.No</th>
            <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[240px]">Legal Name</th>
            <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[180px]">GSTIN</th>
            <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[140px]">Reg Type</th>
            <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[140px]">Freq</th>
            <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[180px]">Username</th>
            <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[140px] text-center">Status</th>
            <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right w-[140px]">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredClients.map((client, idx) => (
            <tr key={client.id} className="hover:bg-indigo-50/30 transition-all group">
              <td className="px-6 py-5 font-black text-slate-300">{(idx + 1).toString().padStart(2, '0')}</td>
              <td className="px-6 py-5">
                 <p className="font-black text-slate-900 uppercase truncate" title={client.legalName}>{client.legalName}</p>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{client.tradeName || '---'}</p>
              </td>
              <td className="px-6 py-5 font-black text-indigo-600 font-mono tracking-widest uppercase">{client.gstProfile?.gstin}</td>
              <td className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase">{client.gstProfile?.regType}</td>
              <td className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase">{client.gstProfile?.filingFreq}</td>
              <td className="px-6 py-5 text-[11px] font-black text-slate-700">{client.gstProfile?.username}</td>
              <td className="px-6 py-5 text-center">
                <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">{client.status}</span>
              </td>
              <td className="px-6 py-5 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-2">
                   <button onClick={() => { setSelectedClient(client); setIsEditModalOpen(true); }} className="h-9 w-9 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center shadow-sm">
                      <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                   </button>
                   <button onClick={() => handleDelete(client.id)} className="h-9 w-9 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-red-600 transition-all flex items-center justify-center shadow-sm">
                      <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                   </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <GSTClientFormModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleDataChange} initialData={selectedClient} />
    </div>
  );
};

export default GstMasterPortfolio;
