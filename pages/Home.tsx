
import React from 'react';

interface HomeProps {
  onGetStarted: () => void;
}

const Home: React.FC<HomeProps> = ({ onGetStarted }) => {
  return (
    <div className="flex min-h-screen flex-col items-center bg-slate-50 px-6 pb-24 pt-32">
      <div className="fixed top-0 -z-10 h-screen w-full overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-100/50 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-blue-100/50 blur-[120px]" />
      </div>
      
      <div className="max-w-5xl text-center">
        <h1 className="mb-4 text-7xl font-black tracking-tighter text-indigo-600 md:text-9xl animate-in fade-in slide-in-from-top-8 duration-700">
          Clientify
        </h1>
        
        <h2 className="mb-6 text-3xl font-black tracking-tight text-slate-900 md:text-5xl animate-in fade-in slide-in-from-top-6 duration-700 delay-100">
          Secure Your <span className="text-indigo-600">Client Vault.</span>
        </h2>
        
        <p className="mb-12 text-lg font-bold italic text-slate-400 md:text-xl uppercase tracking-[0.2em] animate-in fade-in duration-1000 delay-300">
          "Precision in Compliance, Excellence in Consulting."
        </p>

        <p className="mb-12 text-xl font-medium leading-relaxed text-slate-500 md:text-2xl max-w-3xl mx-auto">
          The high-performance management tool for CA firms & Tax Consultants. Centralize IDs, documents, and compliance tracking with absolute precision.
        </p>
        
        <div className="flex flex-col gap-6 sm:flex-row sm:justify-center">
          <button 
            onClick={onGetStarted}
            className="rounded-3xl bg-indigo-600 px-12 py-6 text-xl font-black text-white transition-all hover:bg-slate-900 hover:shadow-2xl hover:shadow-indigo-500/20 active:scale-95"
          >
            Access Consultant Dashboard
          </button>
        </div>
      </div>

      <div className="mt-32 grid grid-cols-1 gap-10 md:grid-cols-3 max-w-7xl w-full">
        {[
          { 
            title: 'Litigation Center', 
            desc: 'Real-time tracking for GST notices and appeals. Never miss a hearing or a drop order deadline again.',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          },
          { 
            title: 'Credential Vault', 
            desc: 'A secure internal storage for all client portal IDs and passwords. Rapid retrieval for professional staff.',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2m10 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2m10 0h-10" />
          },
          { 
            title: 'Compliance Hub', 
            desc: 'Complete oversight for Monthly, Quarterly, and Annual GST returns. Synced across your entire firm.',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          }
        ].map((f, i) => (
          <div key={i} className="group rounded-[2.5rem] border border-slate-200 bg-white p-10 transition-all hover:border-indigo-400 hover:shadow-2xl hover:shadow-slate-200/50">
            <div className="mb-6 h-16 w-16 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white shadow-sm">
               <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">{f.icon}</svg>
            </div>
            <h3 className="mb-4 text-2xl font-black text-slate-900 tracking-tight">{f.title}</h3>
            <p className="text-lg font-medium text-slate-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      <footer className="mt-40 text-center pb-10">
         <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 mb-2">Designed & Developed By</p>
         <div className="text-2xl font-black text-indigo-600 tracking-tighter">
            Advocate Prakhar Gupta
         </div>
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Innovation in Legal Tech Since 2026</p>
      </footer>
    </div>
  );
};

export default Home;
