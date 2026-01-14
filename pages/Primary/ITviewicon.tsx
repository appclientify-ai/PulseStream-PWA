
import React from 'react';
import { Client } from '../../types';

interface ITViewProps {
  client: Client;
  onBack: () => void;
}

const ITviewicon: React.FC<ITViewProps> = ({ client, onBack }) => {
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
               <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight truncate leading-none">{client.legalName}</h2>
               <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mt-3">Direct Tax Vault Profile</p>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2">
               <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">{client.status}</span>
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
                 <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600 flex items-center gap-3">Assessment Identity <div className="h-px flex-1 bg-slate-100" /></h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    <div className="space-y-1">
                       <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Permanent Account No (PAN)</p>
                       <p className="text-xl font-black text-emerald-600 font-mono tracking-widest uppercase flex items-center gap-3">
                          {client.itProfile?.pan} 
                          <button onClick={() => copy(client.itProfile?.pan)} className="text-slate-300 hover:text-emerald-600 transition-colors"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2-2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2" /></svg></button>
                       </p>
                    </div>
                    <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Category</p><p className="text-base font-black text-slate-900 uppercase">{client.itProfile?.category}</p></div>
                    <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Father's / Partner Name</p><p className="text-base font-black text-slate-900 uppercase">{client.itProfile?.fatherName || '---'}</p></div>
                    <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Date of Birth / Inc.</p><p className="text-base font-black text-slate-900">{client.itProfile?.dob || '---'}</p></div>
                 </div>
              </section>

              <section className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 h-40 w-40 bg-emerald-500/10 blur-3xl rounded-full" />
                 <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400 mb-8 flex items-center gap-3 relative z-10">E-Filing Portal Access <div className="h-px flex-1 bg-white/10" /></h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    <div className="space-y-2">
                       <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Portal User ID</p>
                       <p className="text-xl font-black uppercase tracking-tight">{client.itProfile?.username}</p>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Secured Password</p>
                       <p className="text-xl font-black text-emerald-400 tracking-[0.2em]">••••••••</p>
                    </div>
                 </div>
              </section>
           </div>

           <div className="space-y-8">
              <section className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-6">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Professional Matrix</h4>
                 <div className="space-y-5">
                    <div>
                       <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Nature of Work</p>
                       <p className="text-sm font-black text-slate-800 uppercase">{client.itProfile?.natureOfWork || '---'}</p>
                    </div>
                    {client.itProfile?.employmentType && (
                      <div>
                         <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Employment Type</p>
                         <p className="text-sm font-black text-slate-800 uppercase">{client.itProfile.employmentType}</p>
                      </div>
                    )}
                 </div>
              </section>
              <section className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-6">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Sync</h4>
                 <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
                       <div className="min-w-0">
                          <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Primary Mobile</p>
                          <p className="text-sm font-black text-slate-800">{client.mobile}</p>
                       </div>
                       <button onClick={() => window.open(`https://wa.me/91${client.mobile}`, '_blank')} className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></button>
                    </div>
                 </div>
              </section>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ITviewicon;
