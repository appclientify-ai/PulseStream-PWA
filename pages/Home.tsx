
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
          Professional Consultant Vault
        </div>
        <h1 className="mb-6 text-5xl font-black tracking-tight text-white md:text-7xl">
          Secure Your <span className="bg-gradient-to-r from-indigo-400 to-blue-500 bg-clip-text text-transparent">Client Data.</span>
        </h1>
        <p className="mb-10 text-lg leading-relaxed text-slate-400 md:text-xl">
          The ultimate consultant toolkit for CA firms. Manage IDs, passwords, and track critical deadlines for GST, Audits, and ITR in one secure, internal-only dashboard.
        </p>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button 
            onClick={onGetStarted}
            className="rounded-2xl bg-indigo-600 px-10 py-4 text-lg font-bold text-white transition-all hover:bg-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/40 active:scale-95"
          >
            Access Consultant Dashboard
          </button>
        </div>
      </div>

      <div className="mt-24 grid grid-cols-1 gap-8 md:grid-cols-3 max-w-6xl w-full">
        {[
          { title: 'Notice Tracker', desc: 'Monitor due dates for notices and pending replies. Never miss a compliance deadline again.' },
          { title: 'ID & Password Vault', desc: 'Securely store and retrieve client portal credentials for rapid filing and status checks.' },
          { title: 'Secure Doc Drop', desc: 'Allow clients to upload documents directly via a secure link without any account required.' }
        ].map((f, i) => (
          <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900/30 p-8 hover:border-indigo-500/50 transition-colors">
            <div className="mb-4 h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
               {i === 0 && <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
               {i === 1 && <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2m10 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2m10 0h-10" /></svg>}
               {i === 2 && <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>}
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
