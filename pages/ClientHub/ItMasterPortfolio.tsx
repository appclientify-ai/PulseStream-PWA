
import React, { useState, useEffect, useMemo } from 'react';
import { Client } from '../../types';
import { api } from '../../services/api.ts';
import ITClientFormModal from '../Clientform/ITClientFormModal';

interface ItMasterPortfolioProps {
  externalSearch?: string;
  categoryFilter?: string;
  onDataChange?: () => void;
}

const ItMasterPortfolio: React.FC<ItMasterPortfolioProps> = ({ 
  externalSearch = '', 
  categoryFilter = 'All',
  onDataChange
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isItModalOpen, setIsItModalOpen] = useState(false);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const data = await api.getClients();
      setClients(data.filter(c => !!c.itProfile));
    } catch (error) {
      console.error("IT Sync Error:", error);
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const handleDataChange = () => {
    fetchClients();
    if (onDataChange) onDataChange();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Permanently remove this IT profile from the firm vault?')) {
      try {
        await api.deleteClient(id);
        handleDataChange();
      } catch (err) {
        alert("Operation failed.");
      }
    }
  };

  const filteredClients = useMemo(() => {
    let list = clients;
    if (categoryFilter !== 'All') {
      list = list.filter(c => c.itProfile?.category === categoryFilter);
    }
    const s = externalSearch.toLowerCase();
    return list.filter(c => 
      c.legalName.toLowerCase().includes(s) || 
      (c.itProfile?.pan || '').toLowerCase().includes(s) ||
      (c.itProfile?.fatherName || '').toLowerCase().includes(s)
    );
  }, [clients, externalSearch, categoryFilter]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isLoading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-20 space-y-4">
       <div className="h-10 w-10 border-4 border-slate-100 border-t-emerald-600 rounded-full animate-spin" />
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Accessing IT Vault</p>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="overflow-x-auto no-scrollbar flex-1">
        <table className="w-full text-left border-collapse table-fixed min-w-[1100px]">
          <thead className="sticky top-0 z-20">
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[70px]">S.No</th>
              <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[260px]">Legal Name</th>
              <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[180px]">PAN No.</th>
              <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[180px]">Father's Name</th>
              <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[150px]">Category</th>
              <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[160px]">Portal Access</th>
              <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right w-[130px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-32 text-center text-slate-300 font-black uppercase tracking-widest text-sm">
                  No IT Master Records Found
                </td>
              </tr>
            ) : (
              filteredClients.map((client, idx) => (
                <tr key={client.id} className="hover:bg-emerald-50/20 transition-all group">
                  <td className="px-6 py-5 font-black text-slate-300 text-xs">{(idx + 1).toString().padStart(2, '0')}</td>
                  <td className="px-6 py-5">
                     <p className="font-black text-slate-900 uppercase truncate text-sm">{client.legalName}</p>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{client.mobile || 'No Mobile'}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 group/pan">
                      <span className="font-black text-emerald-600 font-mono tracking-widest uppercase text-xs">{client.itProfile?.pan}</span>
                      <button onClick={() => copyToClipboard(client.itProfile?.pan || '')} className="p-1 text-slate-300 hover:text-emerald-600 opacity-0 group-hover/pan:opacity-100 transition-all">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-[11px] font-black text-slate-600 uppercase truncate">{client.itProfile?.fatherName || '---'}</td>
                  <td className="px-6 py-5">
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200">
                      {client.itProfile?.category}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                     <div className="flex flex-col">
                       <span className="text-[10px] font-black text-slate-700">{client.itProfile?.username}</span>
                       <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">SECURED ACCESS</span>
                     </div>
                  </td>
                  <td className="px-6 py-5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                       <button onClick={() => { setSelectedClient(client); setIsItModalOpen(true); }} className="h-8 w-8 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-emerald-600 hover:bg-white transition-all flex items-center justify-center shadow-sm">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.12 15L21 9l-5.88-6M3 12h18M11 16l-4-4m0 0l4-4m-4 4h14" /></svg>
                       </button>
                       <button onClick={() => handleDelete(client.id)} className="h-8 w-8 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-white transition-all flex items-center justify-center shadow-sm">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                       </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <ITClientFormModal 
        isOpen={isItModalOpen} 
        onClose={() => setIsItModalOpen(false)} 
        onSave={handleDataChange} 
        initialData={selectedClient} 
      />
    </div>
  );
};

export default ItMasterPortfolio;
