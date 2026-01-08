import React from 'react';

interface HomeProps {
  onGetStarted: () => void;
}

const Home: React.FC<HomeProps> = ({ onGetStarted }) => {
  return (
    <div className="flex min-h-screen flex-col items-center bg-white selection:bg-indigo-100 selection:text-indigo-900">
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[10%] top-[-10%] h-[600px] w-[600px] rounded-full bg-indigo-50/50 blur-[120px] animate-pulse" />
        <div className="absolute right-[5%] bottom-[5%] h-[500px] w-[500px] rounded-full bg-blue-50/50 blur-[120px]" />
      </div>
      
      {/* Hero Section */}
      <section className="flex flex-col items-center px-6 pb-32 pt-48 text-center max-w-7xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 mb-8 border border-indigo-100 animate-in fade-in slide-in-from-top-4 duration-1000">
           <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
           </span>
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Enterprise Grade Compliance Vault</span>
        </div>

        <h1 className="mb-8 text-6xl font-black tracking-tight text-slate-900 md:text-8xl lg:text-9xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          Precision <span className="text-indigo-600">Unveiled.</span>
        </h1>
        
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

        <div className="mt-20 flex flex-wrap justify-center items-center gap-12 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
           {['SOC2 COMPLIANT', 'AES-256 ENCRYPTED', 'REAL-TIME SYNC', 'PWA ENABLED'].map(trust => (
             <span key={trust} className="text-[11px] font-black tracking-[0.3em] text-slate-900">{trust}</span>
           ))}
        </div>
      </section>

      {/* Feature Matrix */}
      <section className="w-full bg-slate-50 py-32 border-y border-slate-100 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-left">
             <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4 uppercase">Practice Modules</h2>
             <p className="text-slate-500 font-bold uppercase tracking-widest text-sm italic">Engineered for legal precision</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { 
                title: 'Litigation Center', 
                desc: 'Intelligent lifecycle tracking for GST notices, appeals, and tribunal matters. Never miss a statutory deadline again.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />,
                color: 'text-indigo-600',
                bg: 'bg-indigo-50'
              },
              { 
                title: 'Portal Credentials', 
                desc: 'Secure, encrypted internal vault for all client GST & Income Tax credentials. Rapid one-click access for staff members.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />,
                color: 'text-emerald-600',
                bg: 'bg-emerald-50'
              },
              { 
                title: 'Compliance Hub', 
                desc: 'Centralized oversight for Monthly, Quarterly, and Annual returns. Real-time filing status shared across the entire firm.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
                color: 'text-blue-600',
                bg: 'bg-blue-50'
              }
            ].map((f, i) => (
              <div key={i} className="group rounded-[2.5rem] bg-white p-10 border border-slate-200 transition-all hover:border-indigo-400 hover:shadow-2xl hover:-translate-y-2">
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

      {/* Trust & Security Section */}
      <section className="py-32 px-6 max-w-7xl w-full">
         <div className="rounded-[3.5rem] bg-slate-900 p-12 md:p-24 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px]" />
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
               <div>
                  <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-8">Architected for <span className="text-indigo-400">Total Security.</span></h2>
                  <p className="text-xl text-slate-400 leading-relaxed mb-10">Clientify is not just a tool; it's a fortress for your professional data. We use industry-standard encryption protocols to ensure that sensitive client credentials and litigation history remain private and secure.</p>
                  <div className="flex flex-wrap gap-4">
                     <div className="px-6 py-3 bg-white/5 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest">End-to-End Encryption</div>
                     <div className="px-6 py-3 bg-white/5 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest">Biometric Ready</div>
                     <div className="px-6 py-3 bg-white/5 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest">Auto-Snapshot Backups</div>
                  </div>
               </div>
               <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
                  <div className="space-y-6">
                     {[
                       { label: 'Client Privacy', val: '100%' },
                       { label: 'Uptime Reliability', val: '99.9%' },
                       { label: 'Filing Accuracy', val: 'Precision' }
                     ].map(metric => (
                       <div key={metric.label}>
                          <div className="flex justify-between mb-2">
                             <span className="text-xs font-black uppercase text-slate-500 tracking-widest">{metric.label}</span>
                             <span className="text-xs font-black text-indigo-400">{metric.val}</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/10 rounded-full">
                             <div className="h-full bg-indigo-500 rounded-full w-full" />
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="mt-20 w-full border-t border-slate-100 bg-white py-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
               <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
               </div>
               <span className="text-2xl font-black text-slate-900 tracking-tighter">Clientify</span>
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