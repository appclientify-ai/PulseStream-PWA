
import React from 'react';
import { MetricData } from '../types';

interface MetricCardProps {
  metric: MetricData;
}

const MetricCard: React.FC<MetricCardProps> = ({ metric }) => {
  const isPositive = metric.trend === 'up';
  return (
    <div className="rounded-3xl bg-white p-8 border border-slate-200 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-black uppercase tracking-widest text-slate-400">{metric.label}</span>
        <div className={`rounded-full px-3 py-1 text-xs font-bold ${isPositive ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
          {isPositive ? '↑ ACTIVE' : '→ STABLE'}
        </div>
      </div>
      <h2 className="text-5xl font-black text-slate-900 tracking-tighter">
        {metric.label.includes('Progress') ? `${metric.value}%` : metric.value}
      </h2>
      <div className="mt-6 h-2 w-full rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-indigo-600 transition-all duration-1000" style={{ width: `${Math.min(100, metric.value)}%` }} />
      </div>
    </div>
  );
};

export default MetricCard;
