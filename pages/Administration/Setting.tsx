
import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';

const Setting: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'firm'>('profile');

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 max-w-full mx-auto w-full overflow-hidden">
      
      <div className="flex items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
            <p className="text-sm font-black text-emerald-600 leading-none uppercase">Verified Practice</p>
          </div>
        </div>
        <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar">
           {[
             { id: 'profile', label: 'User Profile' },
             { id: 'firm', label: 'Firm Identity' },
             { id: 'security', label: 'Vault Security' }
           ].map(tab => (
             <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
               className={`px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shrink-0 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}>
               {tab.label}
             </button>
           ))}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-y-auto no-scrollbar p-10">
         {activeTab === 'profile' && (
           <div className="max-w-3xl space-y-10 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-8 pb-10 border-b border-slate-100">
                 <div className="h-24 w-24 rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center text-4xl font-black shadow-2xl">
                   {user?.username?.substring(0,2).toUpperCase()}
                 </div>
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{user?.username}</h3>
                    <p className="text-indigo-600 text-xs font-black uppercase tracking-widest mt-1">Authorized Consultant</p>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Account ID</label>
                    <input readOnly value={user?.user_id} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-black text-slate-800 outline-none" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Email Address</label>
                    <input readOnly value={user?.email_id} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-black text-slate-800 outline-none" />
                 </div>
              </div>
           </div>
         )}

         {activeTab === 'firm' && (
           <div className="max-w-3xl space-y-8 animate-in slide-in-from-bottom-4 duration-300">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Practice Branding</h3>
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 ml-1">Legal Firm Name</label>
                    <input value={user?.firm_name || ''} className="w-full border-2 border-slate-100 bg-slate-50 rounded-2xl p-5 font-black text-slate-900 focus:border-indigo-600 focus:bg-white outline-none transition-all uppercase" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 ml-1">Firm GSTN (Optional)</label>
                    <input value={user?.gstn || ''} placeholder="ADD GSTN" className="w-full border-2 border-slate-100 bg-slate-50 rounded-2xl p-5 font-black text-slate-900 focus:border-indigo-600 focus:bg-white outline-none transition-all uppercase" />
                 </div>
              </div>
              <div className="pt-4">
                 <button className="bg-indigo-600 text-white font-black uppercase tracking-widest px-10 py-5 rounded-2xl shadow-xl hover:bg-slate-900 transition-all text-[11px]">Save Firm Profile</button>
              </div>
           </div>
         )}

         {activeTab === 'security' && (
           <div className="max-w-3xl space-y-10 animate-in slide-in-from-bottom-4 duration-300">
              <div className="p-8 bg-amber-50 border border-amber-100 rounded-[2rem] flex items-start gap-6">
                 <div className="h-12 w-12 bg-amber-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                 </div>
                 <div>
                    <h4 className="text-lg font-black text-amber-900 uppercase tracking-tight leading-none mb-2">Security Protocol</h4>
                    <p className="text-amber-800/70 text-sm font-medium">Resetting your master password will invalidate all active firm tokens. Staff must re-authenticate following any credential rotation.</p>
                 </div>
              </div>
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 ml-1">New Master Password</label>
                    <input type="password" placeholder="••••••••••••" className="w-full border-2 border-slate-100 bg-slate-50 rounded-2xl p-5 font-black text-slate-900 focus:border-indigo-600 focus:bg-white outline-none transition-all" />
                 </div>
                 <button className="bg-slate-900 text-white font-black uppercase tracking-widest px-10 py-5 rounded-2xl shadow-xl hover:bg-indigo-600 transition-all text-[11px]">Rotate Vault Access</button>
              </div>
           </div>
         )}
      </div>
    </div>
  );
};

export default Setting;
