
import React from 'react';

interface HomeProps {
  onGetStarted: () => void;
}

const Home: React.FC<HomeProps> = ({ onGetStarted }) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 pt-20">
      <div className="absolute top-0 -z-10 h-screen w-full bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.15),rgba(15,23,42,0))]"></div>
      
      <div className="max-w-4xl text-center">
        <div className="mb-4 inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-400">
          Reimagining Tax Consulting
        </div>
        <h1 className="mb-6 text-5xl font-black tracking-tight text-white md:text-7xl">
          Automate Your <span className="bg-gradient-to-r from-indigo-400 to-blue-500 bg-clip-text text-transparent">Client Vault.</span>
        </h1>
        <p className="mb-10 text-lg leading-relaxed text-slate-400 md:text-xl">
          The all-in-one platform for CA firms and tax consultants. Manage GST filings, Income Tax documents, and client communication in one secure, real-time dashboard.
        </p>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button 
            onClick={onGetStarted}
            className="rounded-2xl bg-indigo-600 px-10 py-4 text-lg font-bold text-white transition-all hover:bg-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/40 active:scale-95"
          >
            Start Managing Clients
          </button>
          <button className="rounded-2xl border border-slate-800 bg-slate-900/50 px-10 py-4 text-lg font-bold text-white backdrop-blur-sm transition-all hover:bg-slate-800">
            View Portal Demo
          </button>
        </div>
      </div>

      <div className="mt-24 grid grid-cols-1 gap-8 md:grid-cols-3 max-w-6xl w-full">
        {[
          { title: 'GST Compliance', desc: 'Real-time tracking of GSTR-1, 3B and annual reconciliation across all clients.' },
          { title: 'Secure Tax Vault', desc: 'End-to-end encrypted storage for Income Tax documents and Audit reports.' },
          { title: 'Client Portal', desc: 'Allow clients to upload documents directly via a secure, mobile-ready interface.' }
        ].map((f, i) => (
          <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900/30 p-8 hover:border-indigo-500/50 transition-colors">
            <div className="mb-4 h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
               {i === 0 && <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
               {i === 1 && <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
               {i === 2 && <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857" /></svg>}
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">{f.title}</h3>
            <p className="text-slate-400">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;