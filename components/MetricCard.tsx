import React from 'react';
import { MetricData } from '../types';

interface MetricCardProps {
  metric: MetricData;
}

const MetricCard: React.FC<MetricCardProps> = ({ metric }) => {
  const isUp = metric.trend === 'up';
  
  return (
    <div className="group rounded-[2.5rem] bg-white p-8 border border-slate-200 shadow-sm transition-all hover:shadow-2xl hover:border-indigo-100 hover:-translate-y-1 relative overflow-hidden">
      {/* Decorative accent */}
      <div className={`absolute top-0 right-0 h-24 w-24 -mr-8 -mt-8 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity ${isUp ? 'bg-indigo-600' : 'bg-slate-400'}`} />
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{metric.label}</span>
        <div className={`flex items-center gap-1 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest border ${
          isUp ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100'
        }`}>
          {isUp ? (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          ) : (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14" /></svg>
          )}
          {isUp ? 'Trending' : 'Stable'}
        </div>
      </div>

      <div className="flex items-baseline gap-2 relative z-10">
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter">
          {metric.value}
        </h2>
        {isUp && <span className="text-xs font-black text-indigo-500 mb-1">+Sync</span>}
      </div>

      <div className="mt-8 h-1.5 w-full rounded-full bg-slate-50 relative z-10 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${isUp ? 'bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.3)]' : 'bg-slate-300'}`} 
          style={{ width: `${Math.max(10, Math.min(100, metric.value))}%` }} 
        />
      </div>
    </div>
  );
};

export default MetricCard;