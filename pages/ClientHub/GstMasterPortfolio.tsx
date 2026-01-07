
import React, { useState, useEffect, useMemo } from 'react';
import { Client, JurisdictionType } from '../../types.ts';
import { api } from '../../services/api.ts';
import Loader from '../../components/Loader.tsx';

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

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        const data = await api.getClients();
        setClients(data);
      } catch (err) {
        console.error("Fetch failed", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  const filteredClients = useMemo(() => {
    let list = clients;
    if (jurisdictionFilter !== 'All') {
      list = list.filter(c => c.gstProfile?.jurisdictionType === jurisdictionFilter);
    }
    const s = externalSearch.toLowerCase();
    return list.filter(c => 
      c.legalName.toLowerCase().includes(s) || 
      (c.gstProfile?.gstin && c.gstProfile.gstin.toLowerCase().includes(s))
    );
  }, [clients, externalSearch, jurisdictionFilter]);

  if (isLoading) return <div className="p-10 text-center text-slate-400 font-bold">Syncing Records...</div>;

  return (
    <div className="overflow-x-auto no-scrollbar flex-1">
      <table className="w-full text-left border-collapse table-auto">
        <thead className="sticky top-0 z-20">
          <tr className="bg-slate-50 border-b border-slate-100">
            <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400">Legal Name</th>
            <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400">GSTIN</th>
            <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400">Status</th>
            <th className="px-4 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredClients.map((client) => (
            <tr key={client.id} className="hover:bg-indigo-50/30 transition-all">
              <td className="px-4 py-5 font-black text-slate-900 uppercase">{client.legalName}</td>
              <td className="px-4 py-5 font-black text-indigo-600 font-mono tracking-widest">{client.gstProfile?.gstin}</td>
              <td className="px-4 py-5">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-green-100 text-green-700">{client.status}</span>
              </td>
              <td className="px-4 py-5 text-right">
                <button className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center">
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GstMasterPortfolio;
