
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import Loader from '../../components/Loader';

const Trash: React.FC = () => {
  const [trashItems, setTrashItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTrash = async () => {
    setIsLoading(true);
    try {
      // In this version, we fetch recent items as a placeholder for trash
      // Since permanent delete is active, we list the "Audit Log" of recent master items
      const saved = await api.get('/items');
      setTrashItems(saved.slice(0, 10));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTrash(); }, []);

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between shrink-0">
        <div>
           <h2 className="text-3xl font-black text-slate-900 tracking-tight">System Audit</h2>
           <p className="text-slate-500 font-medium">Recent database operations and master record activity.</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="whitespace-nowrap sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="whitespace-nowrap px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Record Identity</th>
                <th className="whitespace-nowrap px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                <th className="whitespace-nowrap px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Created On</th>
                <th className="whitespace-nowrap px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Server ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trashItems.length === 0 ? (
                <tr><td colSpan={4} className="whitespace-nowrap py-32 text-center text-slate-300 font-black uppercase tracking-[0.2em] text-sm">No activity records found</td></tr>
              ) : (
                trashItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-indigo-50/20 transition-colors">
                    <td className="whitespace-nowrap px-8 py-6">
                      <p className="text-sm font-black text-slate-900 uppercase">{item.data?.legalName || item.data?.title || item.name || 'System Object'}</p>
                    </td>
                    <td className="whitespace-nowrap px-8 py-6">
                       <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest">{item.name?.replace('_', ' ')}</span>
                    </td>
                    <td className="whitespace-nowrap px-8 py-6">
                       <p className="text-sm font-black text-slate-600">{new Date(item.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="whitespace-nowrap px-8 py-6 text-right">
                       <code className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">{item._id}</code>
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
