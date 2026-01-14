
import React, { useState } from 'react';
import { Client } from '../../types';
import { api } from '../../services/api.ts';
import GSTClientFormModal from '../Clientform/GSTClientFormModal.tsx';

interface GSTViewProps {
  client: Client;
  onBack: () => void;
  onDataChange: () => void;
}

const GSTviewicon: React.FC<GSTViewProps> = ({ client, onBack, onDataChange }) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const copy = (text?: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      alert('Vault Item Copied');
    }
  };

  const handleDelete = async () => {
    if (confirm(`Permanently wipe all records for ${client.tradeName}? This cannot be undone.`)) {
      setIsDeleting(true);
      try {
        await api.deleteClient(client.id);
        onDataChange();
      } catch (err) {
        alert("Deletion failed.");
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 animate-in zoom-in-95">
        
        {/* Modal Header */}
        <header className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-6">
             <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2-2h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011-1v5m-4 0h4" /></svg>
             </div>
             <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none truncate max-w-[300px]">{client.tradeName || client.legalName}</h2>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-2">GST Statutory Identity</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => setIsEditOpen(true)} className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm">Modify</button>
             <button onClick={handleDelete} disabled={isDeleting} className="px-6 py-3 bg-rose-50 text-rose-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm">Delete</button>
             <div className="w-[1px] h-8 bg-slate-200 mx-2" />
             <button onClick={onBack} className="p-3 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all shadow-sm">
                <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
             </button>
          </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-10 space-y-10">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                 <section className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 mb-6 flex items-center gap-3">Entity Profile <div className="h-px flex-1 bg-slate-200" /></h4>
                    <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                       <div><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">GSTIN Identifier</p><div className="flex items-center gap-3"><span className="text-lg font-black text-slate-900 font-mono tracking-widest uppercase">{client.gstProfile?.gstin}</span><button onClick={() => copy(client.gstProfile?.gstin)} className="text-indigo-400 hover:text-indigo-600"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2-2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2" /></svg></button></div></div>
                       <div><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Status</p><span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase">{client.gstProfile?.gstStatus}</span></div>
                       <div><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Filing Cycle</p><p className="text-base font-black text-slate-700">{client.gstProfile?.filingFreq} • {client.gstProfile?.regType}</p></div>
                       <div><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Legal Name</p><p className="text-sm font-bold text-slate-500 uppercase truncate">{client.legalName}</p></div>
                    </div>
                 </section>

                 <section className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/10 blur-3xl rounded-full" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400 mb-6 relative z-10">Access Credentials</h4>
                    <div className="grid grid-cols-2 gap-8 relative z-10">
                       <div className="space-y-4">
                          <p className="text-[10px] font-bold text-slate-500 uppercase border-b border-white/5 pb-2">Common Portal</p>
                          <div className="flex justify-between items-center"><span className="text-xs text-slate-400">User ID</span><span className="text-sm font-black">{client.gstProfile?.username}</span></div>
                          <div className="flex justify-between items-center"><span className="text-xs text-slate-400">Password</span><span className="text-sm font-black text-indigo-400 tracking-widest">••••••••</span></div>
                       </div>
                       <div className="space-y-4">
                          <p className="text-[10px] font-bold text-slate-500 uppercase border-b border-white/5 pb-2">E-Way Bill</p>
                          <div className="flex justify-between items-center"><span className="text-xs text-slate-400">User ID</span><span className="text-sm font-black">{client.gstProfile?.ewayUsername || '---'}</span></div>
                          <div className="flex justify-between items-center"><span className="text-xs text-slate-400">Password</span><span className="text-sm font-black text-indigo-400 tracking-widest">{client.gstProfile?.ewayPassword ? '••••••••' : '---'}</span></div>
                       </div>
                    </div>
                 </section>
              </div>

              <div className="space-y-8">
                 <section className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Banking Sync</h4>
                    <div className="space-y-3">
                       <div className="bg-white p-4 rounded-2xl border border-slate-100">
                          <p className="text-[9px] font-black text-slate-300 uppercase mb-1">Account Number</p>
                          <p className="text-sm font-black text-slate-800 font-mono tracking-tight">{client.bankDetails?.accountNo || '---'}</p>
                       </div>
                       <div className="bg-white p-4 rounded-2xl border border-slate-100">
                          <p className="text-[9px] font-black text-slate-300 uppercase mb-1">IFSC Code</p>
                          <p className="text-sm font-black text-indigo-600 font-mono uppercase tracking-widest">{client.bankDetails?.ifsc || '---'}</p>
                       </div>
                    </div>
                 </section>

                 <section className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Personnel</h4>
                    <div className="space-y-2">
                       {client.gstProfile?.stakeholders.map(s => (
                          <div key={s.id} className="p-3 bg-white rounded-xl border border-slate-100">
                             <p className="text-xs font-black uppercase truncate">{s.name}</p>
                             <p className="text-[9px] font-bold text-slate-400 mt-0.5">{s.pan} • {s.mobile}</p>
                          </div>
                       ))}
                    </div>
                 </section>
              </div>
           </div>
        </div>

        <footer className="px-10 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-center shrink-0">
           <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.5em]">Practice Intelligence System</p>
        </footer>
      </div>

      <GSTClientFormModal 
         isOpen={isEditOpen} 
         onClose={() => setIsEditOpen(false)} 
         onSave={(updated) => {
            onDataChange();
            setIsEditOpen(false);
            onBack(); // Close both windows to refresh
         }} 
         initialData={client}
      />
    </div>
  );
};

export default GSTviewicon;
