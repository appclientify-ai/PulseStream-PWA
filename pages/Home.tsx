
import React from 'react';

interface HomeProps {
  onGetStarted: () => void;
}

const Home: React.FC<HomeProps> = ({ onGetStarted }) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 pt-20">
      <div className="absolute top-0 -z-10 h-screen w-full bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.15),rgba(15,23,42,0))]"></div>
      
      <div className="max-w-4xl text-center">
        <div className="mb-4 inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-400">
          PulseStream 2.0 is live
        </div>
        <h1 className="mb-6 text-5xl font-black tracking-tight text-white md:text-7xl">
          Real-time Data at <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Scale.</span>
        </h1>
        <p className="mb-10 text-lg leading-relaxed text-slate-400 md:text-xl">
          A high-performance PWA for collaborative workflows. Stream, analyze, and communicate with your team in real-time, anywhere in the world.
        </p>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button 
            onClick={onGetStarted}
            className="rounded-2xl bg-blue-600 px-10 py-4 text-lg font-bold text-white transition-all hover:bg-blue-500 hover:shadow-2xl hover:shadow-blue-500/40 active:scale-95"
          >
            Get Started Free
          </button>
          <button className="rounded-2xl border border-slate-800 bg-slate-900/50 px-10 py-4 text-lg font-bold text-white backdrop-blur-sm transition-all hover:bg-slate-800">
            View Demo
          </button>
        </div>
      </div>

      <div className="mt-24 grid grid-cols-1 gap-8 md:grid-cols-3 max-w-6xl">
        {[
          { title: 'Ultra Low Latency', desc: 'Global websocket network ensuring <50ms delivery.' },
          { title: 'PWA Ready', desc: 'Installable on iOS, Android, and Desktop with offline support.' },
          { title: 'Secure by Design', desc: 'End-to-end encryption for all real-time streams.' }
        ].map((f, i) => (
          <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900/30 p-8">
            <h3 className="mb-2 text-xl font-bold text-white">{f.title}</h3>
            <p className="text-slate-400">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
