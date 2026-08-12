
import React from 'react';

interface HomeProps {
  onGetStarted: (targetPath?: string) => void;
}

const Home: React.FC<HomeProps> = ({ onGetStarted }) => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex min-h-screen flex-col items-center bg-slate-900/5 selection:bg-indigo-500 selection:text-white scroll-smooth font-sans overflow-x-hidden">
      {/* Ambient Gradient Backdrop */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute left-[10%] top-[-10%] h-[500px] w-[500px] sm:h-[700px] sm:w-[700px] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse" />
        <div className="absolute right-[5%] bottom-[5%] h-[400px] w-[400px] sm:h-[600px] sm:w-[600px] rounded-full bg-blue-500/10 blur-[140px]" />
        <div className="absolute left-[35%] top-[40%] h-[300px] w-[300px] rounded-full bg-amber-500/5 blur-[100px]" />
      </div>

      {/* Top Floating Announcement Bar */}
      <div className="w-full bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white text-[11px] sm:text-xs font-bold py-2.5 px-4 text-center border-b border-indigo-500/20 shadow-xs flex items-center justify-center gap-2 flex-wrap">
        <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[9px] uppercase tracking-widest font-black">v2026.1 Enterprise</span>
        <span className="text-slate-300">Intelligent GST, Income Tax & Litigation Management Suite for Modern Tax Practices</span>
        <button 
          onClick={onGetStarted}
          className="ml-2 text-indigo-300 hover:text-white underline font-black text-[10px] uppercase tracking-wider transition-colors inline-flex items-center gap-1"
        >
          <span>Launch Vault</span>
          <span>→</span>
        </button>
      </div>
      
      {/* Hero Section */}
      <section className="flex flex-col items-center px-4 sm:px-6 pt-16 sm:pt-24 pb-16 text-center max-w-7xl w-full">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-slate-900/80 px-4 py-2 mb-6 sm:mb-8 border border-slate-200/80 shadow-xs backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-700">
           <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
           </span>
           <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-slate-800">Practice Intelligence Vault</span>
        </div>

        <div className="mb-6 sm:mb-8 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-6 duration-700">
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-slate-900 leading-[1.05] max-w-5xl">
            Client<span className="text-indigo-600">ify.</span>
          </h1>
          <p className="mt-3 text-xs sm:text-sm font-black uppercase tracking-[0.3em] text-indigo-600 bg-indigo-50/80 px-4 py-1.5 rounded-xl border border-indigo-100">
            High-Performance Tax & Legal OS
          </p>
        </div>
        
        <p className="mb-10 text-base sm:text-xl md:text-2xl font-medium leading-relaxed text-slate-600 max-w-3xl mx-auto animate-in fade-in duration-700 delay-200">
          Streamline client management, GST return filings, Income Tax audits, portal credential vaults, and litigation notices in one high-velocity interface.
        </p>
        
        {/* Interactive Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <button 
            onClick={onGetStarted}
            className="w-full sm:w-auto min-h-[52px] rounded-2xl bg-slate-900 px-8 py-4 text-sm sm:text-base font-black text-white transition-all hover:bg-indigo-600 hover:shadow-xl hover:shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-3 shrink-0"
          >
            <span>Initialize Practice Vault</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </button>
        </div>

        {/* Live Metrics Ribbon */}
        <div className="mt-14 sm:mt-16 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 w-full max-w-5xl text-left">
          {[
            { label: 'GST & ITR Compliance', value: '100%', detail: 'Automated Return Trackers', icon: '⚡' },
            { label: 'Litigation Tracking', value: '90 Days', detail: 'Statutory Notice Timelines', icon: '⚖️' },
            { label: 'Portal Credential Vault', value: 'AES-256', detail: 'Instant Password Copier', icon: '🔑' },
            { label: 'Client Communication', value: 'Instant', detail: 'Direct WhatsApp & Mailer', icon: '💬' }
          ].map((m, idx) => (
            <div key={idx} className="bg-white/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs backdrop-blur-md transition-all hover:border-indigo-300 hover:shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{m.icon}</span>
                <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">Live</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{m.value}</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{m.label}</p>
              <p className="text-[10px] font-medium text-slate-500 mt-1">{m.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Core Platform Modules Section */}
      <section id="platform" className="w-full bg-slate-100/60 py-16 sm:py-24 border-y border-slate-200/80 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 sm:mb-16 text-center space-y-3">
             <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest">
               End-To-End Architecture
             </div>
             <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
               Built for <span className="text-indigo-600">Tax Professionals</span>
             </h2>
             <p className="text-slate-600 font-medium text-sm sm:text-base max-w-2xl mx-auto">
               Engineered to eliminate administrative friction and keep your firm audit-ready 24/7.
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { 
                title: 'Executive Pulse', 
                badge: 'Dashboard',
                targetPath: 'dashboard',
                desc: 'A real-time nerve center visualizing firm load, return filing status, upcoming statutory deadlines, and client performance stats.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
                color: 'text-indigo-600',
                bg: 'bg-indigo-50 border-indigo-200'
              },
              { 
                title: 'Client Master Portfolio', 
                badge: 'Master Directory',
                targetPath: 'gst-portfolio',
                desc: 'Unified GST and Income Tax master databases with relationship tags, one-click portal login boxes, and instant search filters.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />,
                color: 'text-emerald-600',
                bg: 'bg-emerald-50 border-emerald-200'
              },
              { 
                title: 'Litigation Vault', 
                badge: 'GST & High Court',
                targetPath: 'lit-notice-pending',
                desc: 'Comprehensive lifecycle tracking for GST Notices, First Appeals (APL-01), GSTAT Tribunals (APL-05), and High Court Writs.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />,
                color: 'text-rose-600',
                bg: 'bg-rose-50 border-rose-200'
              }
            ].map((f, i) => (
              <div 
                key={i} 
                onClick={() => onGetStarted(f.targetPath)}
                className="group rounded-3xl bg-white p-8 border border-slate-200 transition-all hover:border-indigo-400 hover:shadow-xl flex flex-col justify-between cursor-pointer text-left active:scale-[0.98]"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`h-14 w-14 rounded-2xl ${f.bg} border flex items-center justify-center ${f.color} shadow-xs group-hover:scale-110 transition-transform`}>
                      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">{f.icon}</svg>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                      {f.badge}
                    </span>
                  </div>
                  <h3 className="mb-3 text-2xl font-black text-slate-900 tracking-tight">{f.title}</h3>
                  <p className="text-sm sm:text-base font-medium text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600 group-hover:underline">Explore Module</span>
                  <span className="text-indigo-600 group-hover:translate-x-1 transition-transform font-bold">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Vault Section */}
      <section id="security" className="py-16 sm:py-20 px-4 sm:px-6 max-w-7xl w-full">
         <div className="rounded-3xl sm:rounded-[3rem] bg-slate-950 p-8 sm:p-14 text-white relative overflow-hidden shadow-2xl border border-slate-800">
            <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px]" />
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
               <div className="space-y-6">
                  <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black uppercase tracking-widest">
                    Bank-Grade Security Architecture
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                    Advanced Vault Security.
                  </h2>
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                    Client credentials and litigation records are protected by encrypted data partitions, zero-trust sessions, and local device-level storage options.
                  </p>
                  
                  <div className="space-y-4 pt-2">
                     {[
                       { title: 'AES-256 Storage Encryption', detail: 'All taxpayer credentials and records are stored with industrial grade encryption.' },
                       { title: 'Isolated Multi-Practice Vaults', detail: 'Strict workspace segregation for individual consultants and multi-partner firms.' },
                       { title: 'Audit Trail & Event Logging', detail: 'Real-time record update history and staff remark timestamps.' }
                     ].map((item, idx) => (
                       <div key={idx} className="flex gap-3 items-start">
                          <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 border border-emerald-500/30">
                             <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </div>
                          <div>
                             <p className="font-black text-xs uppercase tracking-wider text-indigo-200">{item.title}</p>
                             <p className="text-slate-400 text-xs mt-0.5">{item.detail}</p>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-8 shadow-2xl text-center space-y-6">
                  <div className="mx-auto h-16 w-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 border border-indigo-500/30">
                     <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </div>
                  <div>
                     <p className="text-xs font-black uppercase text-emerald-400 tracking-widest">Active Protection Status</p>
                     <p className="text-2xl sm:text-3xl font-black text-white mt-1">SECURED & ENCRYPTED</p>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                     <div className="h-full bg-emerald-500 w-full animate-pulse" />
                  </div>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Clientify Compliance Engine • Active</p>
               </div>
            </div>
         </div>
      </section>

      {/* Footer & Copyright Section */}
      <footer className="mt-auto w-full border-t border-slate-200 bg-white py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          
          {/* Brand Info */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2.5 mb-2">
               <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white font-black overflow-hidden shadow-xs shrink-0">
                 <img 
                   src="/icon.png" 
                   alt="Logo" 
                   className="relative z-10 h-full w-full object-cover" 
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
               <span className="text-2xl font-black text-slate-900 tracking-tight">Client<span className="text-indigo-600">ify</span></span>
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Tax Practice Intelligence Vault</p>
          </div>
          
          {/* Developer & Legal Credit */}
          <div className="text-center space-y-1">
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Developed & Maintained By</p>
             <div className="text-xl sm:text-2xl font-black text-indigo-700 tracking-tight hover:text-slate-900 transition-colors">
                Advocate Prakhar Gupta
             </div>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">High Court & Direct/Indirect Tax Counsel</p>
          </div>

          {/* Copyright Notice */}
          <div className="text-center md:text-right space-y-1.5">
             <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-black">
               <span>© {currentYear} Clientify</span>
               <span className="text-slate-300">•</span>
               <span className="text-indigo-600">All Rights Reserved</span>
             </div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
               Copyright Protected • Developed by Advocate Prakhar Gupta
             </p>
          </div>

        </div>
      </footer>
    </div>
  );
};

export default Home;

