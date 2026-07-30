
import React from 'react';

interface HomeProps {
  onGetStarted: () => void;
}

const Home: React.FC<HomeProps> = ({ onGetStarted }) => {
  return (
    <div className="flex min-h-screen flex-col items-center bg-white selection:bg-indigo-100 selection:text-indigo-900 scroll-smooth">
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[10%] top-[-10%] h-[600px] rounded-full bg-indigo-50/50 blur-[120px] animate-pulse" />
        <div className="absolute right-[5%] bottom-[5%] h-[500px] rounded-full bg-blue-50/50 blur-[120px]" />
      </div>
      
      {/* Hero Section */}
      <section className="flex flex-col items-center px-6 pb-20 pt-32 text-center max-w-7xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 mb-8 border border-indigo-100 animate-in fade-in slide-in-from-top-4 duration-1000">
           <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
           </span>
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Enterprise Grade Compliance Vault</span>
        </div>

        <div className="mb-8 flex items-center justify-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h1 className="text-6xl font-black tracking-tight text-slate-900 md:text-8xl lg:text-9xl leading-none">
            Client<span className="text-indigo-600">ify.</span>
          </h1>
        </div>
        
        <p className="mb-12 text-xl font-medium leading-relaxed text-slate-500 md:text-2xl max-w-3xl mx-auto animate-in fade-in duration-1000 delay-300">
          The high-performance operating system for modern Tax Consultants. Securely manage IDs, automate tracking, and master complex litigation with absolute clarity.
        </p>
        
        <div className="flex flex-col gap-6 sm:flex-row sm:justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
          <button 
            onClick={onGetStarted}
            className="group relative rounded-2xl bg-slate-900 px-12 py-6 text-lg font-black text-white transition-all hover:bg-indigo-600 hover:shadow-[0_20px_50px_rgba(79,70,229,0.3)] active:scale-95 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-3">
              Initialize Firm Vault
              <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </span>
          </button>
        </div>
      </section>

      {/* Platform Section */}
      <section id="platform" className="w-full bg-slate-50 py-20 border-y border-slate-100 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-center">
             <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-6">The Next-Gen <span className="text-indigo-600">Platform.</span></h2>
             <p className="text-slate-500 font-bold uppercase tracking-widest text-sm max-w-2xl mx-auto">Engineered for high-throughput practice management</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { 
                title: 'Executive Pulse', 
                desc: 'A real-time nerve center that visualizes your firm load, receivables, and filing velocity in a single high-density dashboard.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
                color: 'text-indigo-600',
                bg: 'bg-indigo-50'
              },
              { 
                title: 'ID Vault', 
                desc: 'Secure repository for GST and Income Tax credentials with zero-click copy-paste and direct portal integration.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />,
                color: 'text-emerald-600',
                bg: 'bg-emerald-50'
              },
              { 
                title: 'Litigation Suite', 
                desc: 'Intelligent lifecycle tracking for GST notices and appeals. Never miss a 90-day filing window again.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />,
                color: 'text-rose-600',
                bg: 'bg-rose-50'
              }
            ].map((f, i) => (
              <div key={i} className="group rounded-[2.5rem] bg-white p-10 border border-slate-200 transition-all hover:border-indigo-400 hover:shadow-2xl">
                <div className={`mb-8 h-16 w-16 rounded-3xl ${f.bg} flex items-center justify-center ${f.color} transition-all group-hover:scale-110 shadow-sm`}>
                   <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">{f.icon}</svg>
                </div>
                <h3 className="mb-4 text-2xl font-black text-slate-900 tracking-tight uppercase">{f.title}</h3>
                <p className="text-lg font-medium text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-16 px-6 max-w-7xl w-full">
         <div className="rounded-[3.5rem] bg-indigo-950 p-10 md:p-16 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px]" />
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
               <div>
                  <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-8">Advanced Vault Security.</h2>
                  <p className="text-xl text-slate-400 leading-relaxed mb-10">Your client data is protected by the same encryption standards used by global financial institutions. Clientify is architected for total privacy and zero-trust access.</p>
                  <div className="space-y-6">
                     {[
                       { title: 'AES-256 Encryption', detail: 'All data at rest is encrypted using the most robust cryptographic standard available.' },
                       { title: 'Isolated Vaults', detail: 'Each practitioner has a dedicated, logically isolated data partition.' },
                       { title: 'SOC2 Ready Compliance', detail: 'Strict access control logs and regular security audits of our cloud infrastructure.' }
                     ].map((item, idx) => (
                       <div key={idx} className="flex gap-4">
                          <div className="h-6 w-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                             <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </div>
                          <div>
                             <p className="font-black text-sm uppercase tracking-widest text-indigo-300">{item.title}</p>
                             <p className="text-slate-400 text-sm mt-1">{item.detail}</p>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
               <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
                  <div className="space-y-6 text-center">
                     <div className="mx-auto h-20 w-20 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6">
                        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                     </div>
                     <p className="text-xs font-black uppercase text-indigo-400 tracking-widest">Active Protection Status</p>
                     <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 w-full animate-pulse" />
                     </div>
                     <p className="text-2xl font-black text-white">FULLY SECURED</p>
                     <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em]">Zero Data Breaches to Date</p>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="mt-10 w-full border-t border-slate-100 bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
               <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-black overflow-hidden border border-slate-200 shadow-2xs shrink-0">
                 <img 
                   src="/icon.png" 
                   alt="Logo" 
                   className="relative z-10 h-full w-full object-cover rounded-full" 
                   onError={(e) => {
                     const target = e.target as HTMLImageElement;
                     if (!target.dataset.triedIcon) {
                       target.dataset.triedIcon = 'true';
                       target.src = '/icon.svg';
                     } else {
                       target.style.display = 'none';
                     }
                   }}
                 />
                 <span className="absolute z-0 text-sm font-black text-white">C</span>
               </div>
               <span className="text-2xl font-black text-slate-900 tracking-tighter">Client<span className="text-indigo-600">ify</span></span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Vault for Legal Excellence</p>
          </div>
          
          <div className="text-center">
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">Developed By</p>
             <div className="text-2xl font-black text-indigo-600 tracking-tighter hover:text-slate-900 transition-colors cursor-default">
                Advocate Prakhar Gupta
             </div>
             <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">Innovation in Legal Tech Since 2026</p>
          </div>

          <div className="flex items-center gap-6">
             <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">Privacy Policy</button>
             <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">Terms of Service</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
