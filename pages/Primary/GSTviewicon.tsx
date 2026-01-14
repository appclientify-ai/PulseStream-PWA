
import React from 'react';
import { Client } from '../../types';

interface GSTViewProps {
  client: Client;
  onBack: () => void;
}

const GSTviewicon: React.FC<GSTViewProps> = ({ client, onBack }) => {
  const copy = (text?: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      alert('Copied to clipboard');
    }
  };

  return (
    <div className="w-full flex flex-col h-full bg-white">
      <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
         <div className="flex items-center gap-6 min-w-0">
            <div className="min-w-0">
               <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight truncate leading-none">{client.tradeName || client.legalName}</h2>
               <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mt-3">{client.legalName}</p>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center gap-2">
               <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">{client.status}</span>
            </div>
            <button onClick={onBack} className="p-3 hover:bg-slate-200 rounded-xl transition-colors">
               <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
            </button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-8">
              <section className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-8">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-600 flex items-center gap-3">Primary Statutory Profile <div className="h-px flex-1 bg-slate-100" /></h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    <div className="space-y-1">
                       <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">GSTIN Identifier</p>
                       <p className="text-lg font-black text-indigo-600 font-mono tracking-widest uppercase flex items-center gap-3">
                          {client.gstProfile?.gstin} 
                          <button onClick={() => copy(client.gstProfile?.gstin)} className="text-slate-300 hover:text-indigo-600"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2-2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2" /></svg></button>
                       </p>
                    </div>
                    <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">GST Status</p><p className="text-base font-black text-slate-900 uppercase">{client.gstProfile?.gstStatus}</p></div>
                    <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Registration Date</p><p className="text-base font-black text-slate-900">{client.gstProfile?.regDate || '---'}</p></div>
                    <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Constitution</p><p className="text-base font-black text-slate-900 uppercase">{client.gstProfile?.constitution}</p></div>
                 </div>
              </section>

              <section className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/10 blur-3xl rounded-full" />
                 <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400 mb-8 flex items-center gap-3 relative z-10">Portal Vault & Credentials <div className="h-px flex-1 bg-white/10" /></h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    <div className="space-y-4">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/10 pb-2">Common Portal</p>
                       <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-400">User ID</span><span className="text-sm font-black uppercase tracking-wider">{client.gstProfile?.username}</span></div>
                       <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-400">Password</span><span className="text-sm font-black text-indigo-400">••••••••</span></div>
                    </div>
                    <div className="space-y-4">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/10 pb-2">E-Way Bill Portal</p>
                       <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-400">User ID</span><span className="text-sm font-black uppercase tracking-wider">{client.gstProfile?.ewayUsername || '---'}</span></div>
                       <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-400">Password</span><span className="text-sm font-black text-indigo-400">{client.gstProfile?.ewayPassword ? '••••••••' : '---'}</span></div>
                    </div>
                 </div>
              </section>
           </div>

           <div className="space-y-8">
              <section className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-6">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Banking Sync</h4>
                 <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-2xl">
                       <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Bank Name</p>
                       <p className="text-sm font-black text-slate-800 uppercase">{client.bankDetails?.bankName || '---'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl">
                       <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Account No</p>
                       <p className="text-sm font-black text-slate-800 font-mono">{client.bankDetails?.accountNo || '---'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl">
                       <p className="text-[9px] font-black uppercase text-slate-400 mb-1">IFSC Code</p>
                       <p className="text-sm font-black text-indigo-600 font-mono tracking-widest">{client.bankDetails?.ifsc || '---'}</p>
                    </div>
                 </div>
              </section>
           </div>
        </div>
      </div>
    </div>
  );
};

export default GSTviewicon;
