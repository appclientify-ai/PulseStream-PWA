
import React, { useState, useEffect, useMemo } from 'react';
import { Client } from '../../types';
import { api } from '../../services/api.ts';
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
  
  const [isItModalOpen, setIsItModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const data = await api.getClients();
      setClients(data.filter(c => !!c.itProfile) || []);
    } catch (error) {
      console.error("Sync Error:", error);
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
    const s = (externalSearch || '').toLowerCase();
    return list.filter(c => 
      (c.legalName || '').toLowerCase().includes(s) || 
      (c.itProfile?.pan && c.itProfile.pan.toLowerCase().includes(s))
    );
  }, [clients, externalSearch, categoryFilter]);

  if (isLoading) return <div className="p-10 text-center text-slate-400 font-bold uppercase text-xs">Syncing IT Vault...</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-white overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse table-auto min-w-[1000px]">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400">S.No.</th>
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400">Legal Name</th>
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400">PAN No.</th>
                <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client, idx) => (
                <tr key={client.id} className="hover:bg-emerald-50/30 transition-all text-[12px]">
                  <td className="px-4 py-5 text-slate-300 font-black">{(idx + 1).toString().padStart(2, '0')}</td>
                  <td className="px-4 py-5 font-black text-slate-900 uppercase">{client.legalName}</td>
                  <td className="px-4 py-5 font-black text-emerald-600 font-mono tracking-widest">{client.itProfile?.pan}</td>
                  <td className="px-4 py-5 text-right">
                     <button onClick={() => { setSelectedClient(client); setIsItModalOpen(true); }} className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 hover:text-emerald-600 flex items-center justify-center border border-slate-100">
                        <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg>
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ITClientFormModal isOpen={isItModalOpen} onClose={() => setIsItModalOpen(false)} onSave={handleDataChange} initialData={selectedClient} />
    </div>
  );
};

export default ItMasterPortfolio;
