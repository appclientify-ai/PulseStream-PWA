
import React, { useState, useEffect } from 'react';
import { mockBackend } from '../../services/mockBackend';
import Loader from '../../components/Loader';

const Trash: React.FC = () => {
  const [trashItems, setTrashItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Note: Simulation of trash using a local key as mockBackend doesn't explicitly store deleted clients
  const fetchTrash = async () => {
    setIsLoading(true);
    const saved = localStorage.getItem('clientify_vault_trash');
    setTrashItems(saved ? JSON.parse(saved) : []);
    setIsLoading(false);
  };

  useEffect(() => { fetchTrash(); }, []);

  const clearTrash = () => {
    if (confirm('Permanently purge all items from vault trash? This action is irreversible.')) {
      localStorage.removeItem('clientify_vault_trash');
      setTrashItems([]);
    }
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between shrink-0">
        <div>
           <h2 className="text-3xl font-black text-slate-900 tracking-tight">Vault Trash</h2>
           <p className="text-slate-500 font-medium">Deleted records are retained here for 30 days before permanent purging.</p>
        </div>
        <button onClick={clearTrash} disabled={trashItems.length === 0} className="bg-red-600 text-white font-black uppercase tracking-widest px-8 py-4 rounded-2xl shadow-xl hover:bg-slate-900 transition-all text-xs disabled:opacity-30 disabled:shadow-none">
          Empty Trash
        </button>
      </div>

      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Record Identity</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Deleted Date</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trashItems.length === 0 ? (
                <tr><td colSpan={4} className="py-32 text-center text-slate-300 font-black uppercase tracking-[0.2em] text-sm">Vault trash is empty</td></tr>
              ) : (
                trashItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-red-50/20 transition-colors">
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-slate-900 uppercase">{item.legalName || item.title || 'Unknown Record'}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">ID: {item.id}</p>
                    </td>
                    <td className="px-8 py-6">
                       <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest">{item.gstProfile ? 'GST CLIENT' : item.itProfile ? 'IT CLIENT' : 'RECORD'}</span>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-sm font-black text-slate-600">May 12, 2025</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <button className="text-[10px] font-black uppercase text-indigo-600 hover:underline">Restore</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Trash;
