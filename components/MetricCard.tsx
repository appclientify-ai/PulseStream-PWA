
import React from 'react';
import { MetricData } from '../types';

interface MetricCardProps {
  metric: MetricData;
}

const MetricCard: React.FC<MetricCardProps> = ({ metric }) => {
  const isPositive = metric.trend === 'up';
  const isNegative = metric.trend === 'down';

  return (
    <div className="group overflow-hidden rounded-2xl bg-slate-900/40 p-6 border border-slate-800 transition-all hover:border-slate-700 hover:bg-slate-900/60">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{metric.label}</span>
        <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
          isPositive ? 'bg-green-500/10 text-green-400' : 
          isNegative ? 'bg-red-500/10 text-red-400' : 'bg-slate-500/10 text-slate-400'
        }`}>
          {isPositive ? '↑' : isNegative ? '↓' : '→'} 
          {isPositive ? '8%' : isNegative ? '3%' : '0%'}
        </div>
      </div>
      
      <div className="mt-4 flex items-baseline gap-2">
        <h2 className="text-3xl font-bold text-white tabular-nums">
          {metric.label === 'Throughput' ? `${Math.round(metric.value)}mb/s` : 
           metric.label === 'Error Rate' ? `${metric.value.toFixed(2)}%` : Math.round(metric.value)}
        </h2>
      </div>

      <div className="mt-6 h-1.5 w-full rounded-full bg-slate-800/50">
        <div 
          className="h-full rounded-full bg-blue-500 transition-all duration-1000" 
          style={{ width: `${Math.min(100, (metric.value / 100) * 100)}%` }} 
        />
      </div>
    </div>
  );
};

export default MetricCard;
