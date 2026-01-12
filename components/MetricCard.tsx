
import React from 'react';
import { MetricData } from '../types';

interface MetricCardProps {
  metric: MetricData;
  priority?: 'high' | 'medium' | 'low';
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ metric, priority = 'low', onClick }) => {
  const isUp = metric.trend === 'up';
  
  const priorityColor = priority === 'high' ? 'border-rose-200' : priority === 'medium' ? 'border-amber-200' : 'border-slate-200';
  const glowColor = priority === 'high' ? 'bg-rose-500/10' : priority === 'medium' ? 'bg-amber-500/10' : 'bg-indigo-500/10';

  return (
    <button 
      onClick={onClick}
      className={`w-full text-left glass-card rounded-[2.5rem] p-8 border ${priorityColor} transition-all duration-300 hover:shadow-glass-silk hover:border-indigo-400 hover:-translate-y-1 relative overflow-hidden group`}
    >
      {/* Dynamic Background Glow */}
      <div className={`absolute top-0 right-0 h-32 w-32 -mr-8 -mt-8 rounded-full blur-3xl opacity-40 group-hover:opacity-60 transition-opacity ${glowColor}`} />
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <span className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 group-hover:text-indigo-600 transition-colors">{metric.label}</span>
        {priority === 'high' && (
          <div className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 relative z-10">
        <h2 className="text-6xl font-black text-slate-900 tracking-tighter transition-transform group-hover:scale-[1.02] origin-left">
          {metric.value}
        </h2>
        {isUp && (
          <div className="flex items-center text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest mb-2 shadow-sm border border-indigo-100">
            <svg className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            Active
          </div>
        )}
      </div>

      <div className="mt-8 h-1.5 w-full rounded-full bg-slate-50/50 relative z-10 overflow-hidden border border-white/40">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${
            priority === 'high' ? 'bg-rose-500' : isUp ? 'bg-indigo-600' : 'bg-slate-400'
          }`} 
          style={{ width: `${Math.max(15, Math.min(100, metric.value))}%` }} 
        />
      </div>
      
      {onClick && (
        <div className="absolute bottom-4 right-8 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
          <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </div>
      )}
    </button>
  );
};

export default MetricCard;
