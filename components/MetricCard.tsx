
import React from 'react';
import { MetricData } from '../types';

interface MetricCardProps {
  metric: MetricData;
}

const MetricCard: React.FC<MetricCardProps> = ({ metric }) => {
  const isPositive = metric.trend === 'up';
  const isDown = metric.trend === 'down';
  
  return (
    <div className="group rounded-[2.5rem] bg-white p-8 border border-slate-200 shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600/10 group-hover:bg-indigo-600 transition-colors" />
      
      <div className="flex items-center justify-between mb-6">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-indigo-600 transition-colors">{metric.label}</span>
        <div className={`rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-widest ${
          isPositive ? 'bg-emerald-50 text-emerald-600' : 
          isDown ? 'bg-rose-50 text-rose-600' : 
          'bg-indigo-50 text-indigo-600'
        }`}>
          {isPositive ? '↑ Active' : isDown ? '↓ Critical' : '→ Stable'}
        </div>
      </div>
      
      <div className="flex items-baseline gap-1">
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter">
          {metric.label.includes('Progress') ? `${metric.value}%` : metric.value}
        </h2>
        {metric.label.includes('Filed') && <span className="text-xs font-black text-slate-300 uppercase">Vault</span>}
      </div>

      <div className="mt-8 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out ${isPositive ? 'bg-emerald-500' : 'bg-indigo-600'}`} 
          style={{ width: `${Math.min(100, metric.label.includes('%') || metric.label.includes('Progress') ? metric.value : (metric.value > 0 ? 100 : 0))}%` }} 
        />
      </div>
    </div>
  );
};

export default MetricCard;
