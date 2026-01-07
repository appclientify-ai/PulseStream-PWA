
import React from 'react';

interface BasePageProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
}

const BasePage: React.FC<BasePageProps> = ({ title, subtitle, icon }) => {
  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Title and Description removed from here - moved to Header */}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm">
             <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Active Work Items</h3>
                <button className="text-indigo-600 font-black text-sm uppercase tracking-widest hover:underline">+ Add Entry</button>
             </div>
             <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 font-bold">#{i}</div>
                      <div>
                        <p className="text-lg font-bold text-slate-900">Standard Client Process {i}</p>
                        <p className="text-sm text-slate-500 uppercase tracking-widest font-black">Draft Version</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-slate-400">MAY 2025</span>
                      <button className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 12z" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
        
        <div className="space-y-8">
           <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Recent Activity</h3>
              <div className="space-y-6">
                 {[1,2].map(i => (
                   <div key={i} className="flex gap-4">
                      <div className="h-2 w-2 rounded-full bg-indigo-600 mt-2 shrink-0" />
                      <div>
                         <p className="text-base font-bold text-slate-800">New document received from client.</p>
                         <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">2 hours ago</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default BasePage;
