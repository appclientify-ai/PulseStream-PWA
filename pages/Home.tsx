import React, { useState } from 'react';

interface HomeProps {
  onGetStarted: (targetPath?: string) => void;
}

type ModuleCategory = 'all' | 'gst' | 'itr' | 'litigation' | 'vault';

interface ModuleItem {
  id: string;
  title: string;
  badge: string;
  category: 'gst' | 'itr' | 'litigation' | 'vault';
  targetPath: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

const Home: React.FC<HomeProps> = ({ onGetStarted }) => {
  const currentYear = new Date().getFullYear();
  const [activeCategory, setActiveCategory] = useState<ModuleCategory>('all');

  const modules: ModuleItem[] = [
    {
      id: 'dashboard',
      title: 'Executive Pulse Dashboard',
      badge: 'Nerve Center',
      category: 'vault',
      targetPath: 'dashboard',
      desc: 'Real-time firm workload analytics, compliance filing status counters, statutory deadline tickers, and client activity logs.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800'
    },
    {
      id: 'gst-portfolio',
      title: 'GST Client Master Hub',
      badge: 'Master Directory',
      category: 'gst',
      targetPath: 'gst-portfolio',
      desc: 'Unified GST master database with jurisdiction tags, trade names, state jurisdictions, one-click portal links, and status badges.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800'
    },
    {
      id: 'gst-monthly',
      title: 'Monthly GST Filings',
      badge: 'GSTR-1 & 3B',
      category: 'gst',
      targetPath: 'gst-monthly',
      desc: 'Comprehensive monthly return tracking for GSTR-1, IFF, and GSTR-3B with interactive status count filters, grid view, and CSV export.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800'
    },
    {
      id: 'gst-quarterly',
      title: 'Quarterly QRMP Suite',
      badge: 'QRMP Compliance',
      category: 'gst',
      targetPath: 'gst-quarterly',
      desc: 'Dedicated QRMP compliance monitor for IFF filing months 1 & 2 and quarterly GSTR-3B return status tracking.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800'
    },
    {
      id: 'gst-composition',
      title: 'Composition Tax (CMP-08)',
      badge: 'CMP-08 & GSTR-4',
      category: 'gst',
      targetPath: 'gst-composition',
      desc: 'Quarterly CMP-08 self-assessed tax payment tracker and GSTR-4 annual return status management for composition taxpayers.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800'
    },
    {
      id: 'gstr9-9c',
      title: 'GSTR-9 & 9C Annual Audit',
      badge: 'Annual Compliance',
      category: 'gst',
      targetPath: 'gstr9-9c',
      desc: 'Financial year annual return tracking, GSTR-9C reconciliation audit manager, turnover eligibility filters, and compliance records.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800'
    },
    {
      id: 'itr-filing',
      title: 'Income Tax Return Suite',
      badge: 'ITR-1 to ITR-7',
      category: 'itr',
      targetPath: 'itr-filing',
      desc: 'Income Tax Return filing lifecycle manager for individuals, firms, companies, and trusts. Tracks computation, 3CA/3CB audits, and refunds.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
        </svg>
      ),
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-950/50 border-violet-200 dark:border-violet-800'
    },
    {
      id: 'lit-notice-pending',
      title: 'Litigation & Notice Vault',
      badge: 'GST & High Court',
      category: 'litigation',
      targetPath: 'lit-notice-pending',
      desc: 'End-to-end lifecycle tracking for GST statutory notices (Sec 61, 73, 74, DRC-01), First Appeals (APL-01), GSTAT Tribunals, and High Court Writs.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      ),
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800'
    },
    {
      id: 'credentials',
      title: 'Portal Credential Vault',
      badge: 'AES-256 Vault',
      category: 'vault',
      targetPath: 'credentials',
      desc: 'Encrypted manager for portal usernames, passwords, and PINs across GST, Income Tax, Traces, e-Way bill, and MCA portals with 1-click copy.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 0121 9z" />
        </svg>
      ),
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800'
    },
    {
      id: 'gstin-search',
      title: 'GSTIN & PAN Quick Search',
      badge: 'Portal Verification',
      category: 'vault',
      targetPath: 'gstin-search',
      desc: 'Instant lookup tool to search taxpayer registration status, jurisdiction details, legal trade name, and return filing history.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      color: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800'
    },
    {
      id: 'ai-response-writer',
      title: 'Notice AI Response Drafter',
      badge: 'AI Legal Drafter',
      category: 'litigation',
      targetPath: 'ai-response-writer',
      desc: 'Intelligent AI assistant to draft legal replies, grounds of appeal, and statutory explanations for tax show-cause notices.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      color: 'text-pink-600 dark:text-pink-400',
      bg: 'bg-pink-50 dark:bg-pink-950/50 border-pink-200 dark:border-pink-800'
    },
    {
      id: 'setting',
      title: 'Practice & Theme Settings',
      badge: 'Custom Canvas',
      category: 'vault',
      targetPath: 'setting',
      desc: 'Customize canvas themes including Simple Light, Midnight Dark, Neo 3D, and 3D Glass modes along with practice branding.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'text-slate-600 dark:text-slate-400',
      bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
    }
  ];

  const filteredModules = activeCategory === 'all' 
    ? modules 
    : modules.filter(m => m.category === activeCategory);

  return (
    <div className="flex min-h-screen flex-col items-center bg-slate-900/5 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white scroll-smooth font-sans overflow-x-hidden">
      {/* Ambient Gradient Backdrop */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute left-[10%] top-[-10%] h-[500px] w-[500px] sm:h-[700px] sm:w-[700px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/20 blur-[120px] animate-pulse" />
        <div className="absolute right-[5%] bottom-[5%] h-[400px] w-[400px] sm:h-[600px] sm:w-[600px] rounded-full bg-blue-500/10 dark:bg-blue-600/20 blur-[140px]" />
        <div className="absolute left-[35%] top-[40%] h-[300px] w-[300px] rounded-full bg-amber-500/5 blur-[100px]" />
      </div>

      {/* Top Floating Announcement Bar */}
      <div className="w-full bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white text-[11px] sm:text-xs font-bold py-2.5 px-4 text-center border-b border-indigo-500/20 shadow-xs flex items-center justify-center gap-2 flex-wrap">
        <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[9px] uppercase tracking-widest font-black">v2026.1 Enterprise</span>
        <span className="text-slate-300">Intelligent GST, Income Tax & Litigation Management Suite for Modern Tax Practices</span>
        <button 
          onClick={() => onGetStarted('dashboard')}
          className="ml-2 text-indigo-300 hover:text-white underline font-black text-[10px] uppercase tracking-wider transition-colors inline-flex items-center gap-1"
        >
          <span>Launch Vault</span>
          <span>→</span>
        </button>
      </div>
      
      {/* Hero Section */}
      <section className="flex flex-col items-center px-4 sm:px-6 pt-10 sm:pt-16 pb-10 text-center max-w-7xl w-full">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-slate-900/80 px-4 py-2 mb-6 sm:mb-8 border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-700">
           <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
           </span>
           <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200">Practice Intelligence Vault</span>
        </div>

        <div className="mb-6 sm:mb-8 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-6 duration-700">
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.05] max-w-5xl">
            Client<span className="text-indigo-600 dark:text-indigo-400">ify.</span>
          </h1>
          <p className="mt-3 text-xs sm:text-sm font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60 px-4 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-900">
            High-Performance Tax & Legal OS
          </p>
        </div>
        
        <p className="mb-8 text-base sm:text-xl md:text-2xl font-medium leading-relaxed text-slate-600 dark:text-slate-300 max-w-3xl mx-auto animate-in fade-in duration-700 delay-200">
          Streamline client management, GST return filings, Income Tax audits, portal credential vaults, and litigation notices in one high-velocity interface.
        </p>
        
        {/* Interactive Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <button 
            onClick={() => onGetStarted('dashboard')}
            className="w-full sm:w-auto min-h-[52px] rounded-2xl bg-slate-900 dark:bg-indigo-600 px-8 py-4 text-sm sm:text-base font-black text-white transition-all hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:shadow-xl hover:shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-3 shrink-0"
          >
            <span>Initialize Practice Vault</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </button>
          <a 
            href="#modules"
            className="w-full sm:w-auto min-h-[52px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-4 text-sm font-black text-slate-700 dark:text-slate-200 transition-all hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2"
          >
            <span>Explore Modules</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
          </a>
        </div>
      </section>

      {/* NEW MODULAR DASHBOARD SUMMARY CARDS SECTION */}
      <section className="w-full max-w-7xl px-4 sm:px-6 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Key Platform Activity Overview */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Platform Activity</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Real-time Practice Pulse</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-200 dark:border-emerald-800">Live Sync</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Monthly GST Filings</p>
                      <p className="text-[10px] text-slate-500">142 GSTR-1/3B Filed • 18 Pending</p>
                    </div>
                  </div>
                  <button onClick={() => onGetStarted('gst-monthly')} className="text-indigo-600 dark:text-indigo-400 hover:underline text-xs font-black">View</button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Income Tax & Audits</p>
                      <p className="text-[10px] text-slate-500">86 ITR Returns • 12 Audit Drafts</p>
                    </div>
                  </div>
                  <button onClick={() => onGetStarted('itr-filing')} className="text-indigo-600 dark:text-indigo-400 hover:underline text-xs font-black">View</button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Litigation & Appeals</p>
                      <p className="text-[10px] text-slate-500">8 Active SCNs • 4 Hearings Scheduled</p>
                    </div>
                  </div>
                  <button onClick={() => onGetStarted('lit-notice-pending')} className="text-indigo-600 dark:text-indigo-400 hover:underline text-xs font-black">View</button>
                </div>
              </div>
            </div>

            <button onClick={() => onGetStarted('dashboard')} className="mt-5 w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-200 text-xs font-black transition-colors flex items-center justify-center gap-1.5">
              <span>Open Executive Dashboard</span>
              <span>→</span>
            </button>
          </div>

          {/* Card 2: Upcoming Statutory Compliance Deadlines */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Upcoming Deadlines</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Statutory Due Date Tickers</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-[10px] font-black border border-amber-200 dark:border-amber-800">Critical</span>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-300">GSTR-1 Monthly Return</span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Sales Statement Filing</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400">11th Month</span>
                    <p className="text-[10px] text-slate-500">Due in 3 days</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">GSTR-3B Summary Return</span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Monthly Tax Liability</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">20th Month</span>
                    <p className="text-[10px] text-slate-500">Due in 12 days</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400">GST Sec 73 SCN Reply</span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Reply to Demand Notice</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-rose-600 dark:text-rose-400">Statutory 30 Days</span>
                    <p className="text-[10px] text-slate-500">5 Days Left</p>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={() => onGetStarted('due-dates')} className="mt-5 w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950 text-slate-700 dark:text-slate-200 text-xs font-black transition-colors flex items-center justify-center gap-1.5">
              <span>View All Compliance Timelines</span>
              <span>→</span>
            </button>
          </div>

          {/* Card 3: Recent Notifications & Practice Alerts */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Recent Notifications</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Alerts & Reminders</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-[10px] font-black border border-rose-200 dark:border-rose-800">4 Unread</span>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500 mt-1 shrink-0"></span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">DSC Token Expiry Warning</p>
                    <p className="text-[10px] text-slate-500">Digital signature for Apex Infra expires in 7 days.</p>
                  </div>
                  <button onClick={() => onGetStarted('credentials')} className="text-indigo-600 dark:text-indigo-400 text-[10px] font-black hover:underline shrink-0">Vault</button>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500 mt-1 shrink-0"></span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">GSTAT Hearing Reminder</p>
                    <p className="text-[10px] text-slate-500">Re: Zenith Trade Tribunal Appeal hearing on 18th Aug.</p>
                  </div>
                  <button onClick={() => onGetStarted('lit-notice-pending')} className="text-indigo-600 dark:text-indigo-400 text-[10px] font-black hover:underline shrink-0">Litigation</button>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500 mt-1 shrink-0"></span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">New Client Onboarding</p>
                    <p className="text-[10px] text-slate-500">New GST registration document set uploaded for Review.</p>
                  </div>
                  <button onClick={() => onGetStarted('gst-reg')} className="text-indigo-600 dark:text-indigo-400 text-[10px] font-black hover:underline shrink-0">Reg Hub</button>
                </div>
              </div>
            </div>

            <button onClick={() => onGetStarted('reminders')} className="mt-5 w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-700 dark:text-slate-200 text-xs font-black transition-colors flex items-center justify-center gap-1.5">
              <span>Manage Notifications & Reminders</span>
              <span>→</span>
            </button>
          </div>

        </div>
      </section>

      {/* Interactive Platform Modules Grid */}
      <section id="modules" className="w-full bg-slate-100/60 dark:bg-slate-900/60 py-12 sm:py-20 border-y border-slate-200/80 dark:border-slate-800 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 text-center space-y-3">
             <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-widest border border-indigo-200 dark:border-indigo-800">
               End-To-End Practice Operating System
             </div>
             <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
               Built for <span className="text-indigo-600 dark:text-indigo-400">Tax & Legal Professionals</span>
             </h2>
             <p className="text-slate-600 dark:text-slate-300 font-medium text-sm sm:text-base max-w-2xl mx-auto">
               Engineered to eliminate administrative friction and keep your firm audit-ready 24/7.
             </p>

             {/* Interactive Category Filter Pills */}
             <div className="flex items-center justify-center gap-2 pt-4 flex-wrap">
               {[
                 { id: 'all', label: 'All Modules' },
                 { id: 'gst', label: 'GST Compliance' },
                 { id: 'itr', label: 'Income Tax' },
                 { id: 'litigation', label: 'Litigation & Appeals' },
                 { id: 'vault', label: 'Vault & Tools' }
               ].map((cat) => (
                 <button
                   key={cat.id}
                   onClick={() => setActiveCategory(cat.id as ModuleCategory)}
                   className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                     activeCategory === cat.id
                       ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105'
                       : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                   }`}
                 >
                   {cat.label}
                 </button>
               ))}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredModules.map((m) => (
              <div 
                key={m.id} 
                onClick={() => onGetStarted(m.targetPath)}
                className="group rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-7 border border-slate-200 dark:border-slate-800 transition-all hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-xl flex flex-col justify-between cursor-pointer text-left active:scale-[0.98]"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`h-12 w-12 rounded-2xl ${m.bg} border flex items-center justify-center ${m.color} shadow-xs group-hover:scale-110 transition-transform`}>
                      {m.icon}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                      {m.badge}
                    </span>
                  </div>
                  <h3 className="mb-2 text-xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{m.title}</h3>
                  <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">{m.desc}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline">Open Module</span>
                  <span className="text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1.5 transition-transform font-bold">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer & Copyright Section */}
      <footer className="mt-auto w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-10 px-4 sm:px-6">
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
               <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Client<span className="text-indigo-600 dark:text-indigo-400">ify</span></span>
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Tax Practice Intelligence Vault</p>
          </div>
          
          {/* Developer & Legal Credit */}
          <div className="text-center space-y-1">
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Developed & Maintained By</p>
             <div className="text-xl sm:text-2xl font-black text-indigo-700 dark:text-indigo-400 tracking-tight transition-colors">
                Advocate Prakhar Gupta
             </div>
             <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">High Court & Direct/Indirect Tax Counsel</p>
          </div>

          {/* Copyright Notice */}
          <div className="text-center md:text-right space-y-1.5">
             <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black">
               <span>© {currentYear} Clientify</span>
               <span className="text-slate-300 dark:text-slate-600">•</span>
               <span className="text-indigo-600 dark:text-indigo-400">All Rights Reserved</span>
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
