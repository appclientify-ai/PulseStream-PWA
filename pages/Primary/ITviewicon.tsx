
import React, { useState } from 'react';
import { Client } from '../../types';
import { api } from '../../services/api.ts';
import ITClientFormModal from '../Clientform/ITClientFormModal.tsx';

interface ITViewProps {
  client: Client;
  onBack: () => void;
  onDataChange: () => void;
}

const ITviewicon: React.FC<ITViewProps> = ({ client, onBack, onDataChange }) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const copy = (text?: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      alert('Vault Item Copied');
    }
  };

  const handleDelete = async () => {
    if (confirm(`Permanently remove ${client.legalName} from the IT database?`)) {
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
      <div className="w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-slate-200 animate-in zoom-in-95">
        
        {/* Modal Header */}
        <header className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-6">
             <div className="h-14 w-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xl">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
             </div>
             <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none truncate max-w-[300px]">{client.legalName}</h2>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mt-2">IT Profile Record</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => setIsEditOpen(true)} className="px-6 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm">Modify</button>
             <button onClick={handleDelete} disabled={isDeleting} className="px-6 py-3 bg-rose-50 text-rose-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm">Delete</button>
             <div className="w-[1px] h-8 bg-slate-200 mx-2" />
             <button onClick={onBack} className="p-3 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all shadow-sm">
                <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
             </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-10 space-y-10">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-6">
                 <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600 flex items-center gap-3">Assessment Identity</h4>
                 <div className="space-y-5">
                    <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">PAN Identifier</p><div className="flex items-center gap-3"><span className="text-lg font-black text-slate-900 font-mono tracking-widest uppercase">{client.itProfile?.pan}</span><button onClick={() => copy(client.itProfile?.pan)} className="text-emerald-400 hover:text-emerald-600"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2-2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2" /></svg></button></div></div>
                    <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">Category</p><p className="text-base font-black text-slate-800 uppercase">{client.itProfile?.category}</p></div>
                    <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">Contact Sync</p><p className="text-base font-black text-slate-800">{client.mobile} • {client.email}</p></div>
                 </div>
              </section>

              <section className="bg-slate-900 rounded-[2rem] p-8 text-white flex flex-col justify-center relative overflow-hidden">
                 <div className="absolute top-0 left-0 h-full w-full bg-emerald-600/5 blur-3xl rounded-full" />
                 <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400 mb-6 relative z-10">Vault Access</h4>
                 <div className="space-y-6 relative z-10">
                    <div className="flex justify-between items-center"><span className="text-xs text-slate-400 uppercase tracking-widest">User ID</span><span className="text-lg font-black">{client.itProfile?.username}</span></div>
                    <div className="flex justify-between items-center"><span className="text-xs text-slate-400 uppercase tracking-widest">Password</span><span className="text-lg font-black text-emerald-400 tracking-[0.4em]">••••••••</span></div>
                 </div>
              </section>

              <section className="md:col-span-2 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                 <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600 mb-4">Professional Matrix</h4>
                 <div className="grid grid-cols-3 gap-6">
                    <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">Work Type</p><p className="text-sm font-black text-slate-900 uppercase">{client.itProfile?.natureOfWork || '---'}</p></div>
                    <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">Employment</p><p className="text-sm font-black text-slate-900 uppercase">{client.itProfile?.employmentType || '---'}</p></div>
                    <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">Business Name</p><p className="text-sm font-black text-slate-900 uppercase truncate">{client.itProfile?.businessName || '---'}</p></div>
                 </div>
              </section>
           </div>
        </div>

        <footer className="px-10 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-center shrink-0">
           <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.5em]">Secure Practitioner Console</p>
        </footer>
      </div>

      <ITClientFormModal 
         isOpen={isEditOpen} 
         onClose={() => setIsEditOpen(false)} 
         onSave={(updated) => {
            onDataChange();
            setIsEditOpen(false);
            onBack(); 
         }} 
         initialData={client}
      />
    </div>
  );
};

export default ITviewicon;
