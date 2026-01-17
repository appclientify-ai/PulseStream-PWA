
import React from 'react';

interface HomeProps {
  onGetStarted: () => void;
}

const Home: React.FC<HomeProps> = ({ onGetStarted }) => {
  return (
    <div className="flex min-h-screen flex-col items-center bg-white selection:bg-indigo-100 selection:text-indigo-900">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[10%] top-[-10%] h-[600px] w-[600px] rounded-full bg-indigo-50/40 blur-[120px]" />
      </div>
      
      <section className="flex flex-col items-center px-6 pb-32 pt-48 text-center max-w-7xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-1.5 mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Advanced Practice Intelligence OS</span>
        </div>

        <h1 className="mb-10 text-7xl font-black tracking-tighter text-slate-900 md:text-9xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          Client<span className="text-indigo-600">ify.</span>
        </h1>
        
        <p className="mb-12 text-xl font-medium leading-relaxed text-slate-500 md:text-2xl max-w-2xl mx-auto">
          The high-performance operating system for modern tax consultants. Manage litigation, compliance, and client vaults with absolute clarity.
        </p>
        
        <button 
          onClick={onGetStarted}
          className="group relative rounded-2xl bg-indigo-600 px-14 py-6 text-lg font-black text-white transition-all hover:bg-slate-900 hover:shadow-2xl active:scale-95 overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-4">
            Initialize Firm OS
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </span>
        </button>
      </section>

      <footer className="mt-auto w-full border-t border-slate-50 py-10 px-10 flex justify-between items-center text-slate-400">
         <p className="text-[10px] font-black uppercase tracking-widest">© 2026 Clientify Technologies</p>
         <div className="flex gap-6">
            <button className="text-[10px] font-black uppercase tracking-widest hover:text-indigo-600">Privacy</button>
            <button className="text-[10px] font-black uppercase tracking-widest hover:text-indigo-600">Terms</button>
         </div>
      </footer>
    </div>
  );
};

export default Home;
