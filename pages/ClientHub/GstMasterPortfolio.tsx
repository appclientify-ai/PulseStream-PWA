
import React, { useState, useEffect, useMemo } from 'react';
import { Client } from '../../types.ts';
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
    if (confirm('Permanently remove this record from the master vault?')) {
      try {
        await api.deleteClient(id);
        handleDataChange();
      } catch (err) {
        alert("Delete operation failed.");
      }
    }
  };

  const filteredClients = useMemo(() => {
    const s = externalSearch.toLowerCase();
    return clients.filter(c => 
      c.legalName.toLowerCase().includes(s) || 
      (c.tradeName || '').toLowerCase().includes(s) ||
      (c.gstProfile?.gstin || '').toLowerCase().includes(s)
    );
  }, [clients, externalSearch]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
              <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[260px]">Client Identity</th>
              <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[180px]">GSTIN</th>
              <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[140px]">Tax Type</th>
              <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[120px]">Freq.</th>
              <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[180px]">Portal Creds</th>
              <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[120px] text-center">Status</th>
              <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right w-[130px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-32 text-center">
                  <p className="text-slate-300 font-black uppercase tracking-widest text-sm">No Master Records Found</p>
                </td>
              </tr>
            ) : (
              filteredClients.map((client, idx) => (
                <tr key={client.id} className="hover:bg-indigo-50/20 transition-all group">
                  <td className="px-6 py-5 font-black text-slate-300 text-xs">{(idx + 1).toString().padStart(2, '0')}</td>
                  <td className="px-6 py-5">
                     <p className="font-black text-slate-900 uppercase truncate text-sm" title={client.legalName}>{client.legalName}</p>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate mt-0.5">{client.tradeName || 'No Trade Name'}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 group/gstin">
                      <span className="font-black text-indigo-600 font-mono tracking-widest uppercase text-xs">{client.gstProfile?.gstin}</span>
                      <button onClick={() => copyToClipboard(client.gstProfile?.gstin || '')} className="p-1 text-slate-300 hover:text-indigo-600 opacity-0 group-hover/gstin:opacity-100 transition-all">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${client.gstProfile?.regType === 'Regular' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                      {client.gstProfile?.regType}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase">{client.gstProfile?.filingFreq}</td>
                  <td className="px-6 py-5">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black text-slate-700">{client.gstProfile?.username}</p>
                      <p className="text-[9px] font-bold text-slate-300 font-mono tracking-tighter">PASSWORD ENCRYPTED</p>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${client.status === 'Active Filing' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400'}`}>
                      {client.status === 'Active Filing' ? 'Active' : 'Case Only'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                       <button onClick={() => { setSelectedClient(client); setIsEditModalOpen(true); }} className="h-8 w-8 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center shadow-sm">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
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
      <GSTClientFormModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSave={handleDataChange} 
        initialData={selectedClient} 
      />
    </div>
  );
};

export default GstMasterPortfolio;
