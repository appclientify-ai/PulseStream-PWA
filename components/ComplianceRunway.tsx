
import React from 'react';

interface ComplianceRunwayProps {
  month: string;
  stats: {
    requested: number;
    prepared: number;
    filed: number;
    total: number;
  };
}

const ComplianceRunway: React.FC<ComplianceRunwayProps> = ({ month, stats }) => {
  const filedPercentage = (stats.filed / stats.total) * 100;
  const preparedPercentage = (stats.prepared / stats.total) * 100;
  
  return (
    <div className="glass-card rounded-[2.5rem] p-10 border border-slate-200 relative overflow-hidden group">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 leading-none">Compliance Runway</h3>
          <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-[0.3em] mt-3">{month} Filing Lifecycle</p>
        </div>
        <div className="bg-slate-900 text-white rounded-2xl px-6 py-4 shadow-xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 text-center">Filing Velocity</p>
          <p className="text-xl font-black text-center">{Math.round(filedPercentage)}%</p>
        </div>
      </div>

      <div className="space-y-12 relative">
        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
          <span>Data Intake</span>
          <span>Quality Check</span>
          <span>Statutory Submission</span>
        </div>
        
        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden relative border border-white p-0.5">
          {/* Base Track */}
          <div className="absolute inset-0 bg-slate-100/50" />
          {/* Prepared Progress */}
          <div 
            className="absolute inset-y-0 left-0 bg-indigo-200 transition-all duration-1000 ease-out rounded-full" 
            style={{ width: `${preparedPercentage}%` }} 
          />
          {/* Filed Progress */}
          <div 
            className="absolute inset-y-0 left-0 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-1000 ease-out rounded-full" 
            style={{ width: `${filedPercentage}%` }} 
          />
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Requested</p>
            <p className="text-2xl font-black text-slate-900">{stats.requested}</p>
          </div>
          <div className="bg-indigo-50/30 rounded-2xl p-5 border border-indigo-100">
            <p className="text-[10px] font-black uppercase text-indigo-400 mb-2">Prepared</p>
            <p className="text-2xl font-black text-indigo-600">{stats.prepared}</p>
          </div>
          <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100">
            <p className="text-[10px] font-black uppercase text-emerald-400 mb-2">Success</p>
            <p className="text-2xl font-black text-emerald-600">{stats.filed}</p>
          </div>
        </div>
      </div>

      {/* Decorative runway markings */}
      <div className="absolute bottom-0 left-0 right-0 h-1 flex gap-2">
         {[...Array(20)].map((_, i) => (
           <div key={i} className="h-full flex-1 bg-slate-100/50" />
         ))}
      </div>
    </div>
  );
};

export default ComplianceRunway;
