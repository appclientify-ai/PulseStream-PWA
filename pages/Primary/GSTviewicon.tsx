
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
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
         <div className="flex items-center gap-6">
            <button onClick={onBack} className="h-12 w-12 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
               <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div className="min-w-0">
               <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight truncate leading-none">{client.tradeName || client.legalName}</h2>
               <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mt-3">{client.legalName}</p>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <div className="px-5 py-2.5 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center gap-2">
               <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">{client.status}</span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            <section className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm space-y-10">
               <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 flex items-center gap-3">Primary Statutory Profile <div className="h-px flex-1 bg-slate-100" /></h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                  <div className="space-y-1">
                     <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">GSTIN Identifier</p>
                     <p className="text-xl font-black text-indigo-600 font-mono tracking-widest uppercase flex items-center gap-3">
                        {client.gstProfile?.gstin} 
                        <button onClick={() => copy(client.gstProfile?.gstin)} className="text-slate-300 hover:text-indigo-600"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2-2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2" /></svg></button>
                     </p>
                  </div>
                  <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">GST Status</p><p className="text-lg font-black text-slate-900 uppercase">{client.gstProfile?.gstStatus}</p></div>
                  <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Registration Date</p><p className="text-lg font-black text-slate-900">{client.gstProfile?.regDate || '---'}</p></div>
                  <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Constitution</p><p className="text-lg font-black text-slate-900 uppercase">{client.gstProfile?.constitution}</p></div>
               </div>
            </section>

            <section className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/10 blur-3xl rounded-full" />
               <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-400 mb-10 flex items-center gap-3 relative z-10">Portal Vault & Credentials <div className="h-px flex-1 bg-white/10" /></h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                  <div className="space-y-6">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/10 pb-2">Common Portal</p>
                     <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-400">User ID</span><span className="text-base font-black uppercase tracking-wider">{client.gstProfile?.username}</span></div>
                     <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-400">Password</span><span className="text-base font-black text-indigo-400">••••••••</span></div>
                  </div>
                  <div className="space-y-6">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/10 pb-2">E-Way Bill Portal</p>
                     <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-400">User ID</span><span className="text-base font-black uppercase tracking-wider">{client.gstProfile?.ewayUsername || '---'}</span></div>
                     <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-400">Password</span><span className="text-base font-black text-indigo-400">{client.gstProfile?.ewayPassword ? '••••••••' : '---'}</span></div>
                  </div>
                  <div className="space-y-6">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/10 pb-2">GSTAT Tribunal</p>
                     <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-400">User ID</span><span className="text-base font-black uppercase tracking-wider">{client.gstProfile?.gstatUsername || '---'}</span></div>
                     <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-400">Password</span><span className="text-base font-black text-indigo-400">{client.gstProfile?.gstatPassword ? '••••••••' : '---'}</span></div>
                  </div>
               </div>
            </section>
         </div>

         <div className="space-y-8">
            <section className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm space-y-6">
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

            <section className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm space-y-6">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Authorized Members</h4>
               <div className="space-y-3">
                  {client.gstProfile?.stakeholders.map(s => (
                     <div key={s.id} className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                        <p className="text-sm font-black text-slate-900 uppercase truncate">{s.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-1">PAN: {s.pan} • MOB: {s.mobile}</p>
                     </div>
                  ))}
               </div>
            </section>
         </div>
      </div>
    </div>
  );
};

export default GSTviewicon;
