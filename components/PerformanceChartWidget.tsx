import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Client } from '../types';

interface Props {
  clients: Client[];
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const PerformanceChartWidget: React.FC<Props> = ({ clients }) => {
  const chartData = useMemo(() => {
    const data = [];
    const saved = localStorage.getItem('clientify_monthly_filing_v3');
    const filingData = saved ? JSON.parse(saved) : {};

    const applicableClients = (clients || []).filter(c => c && c.gstProfile?.regType === 'Regular' && c.gstProfile?.filingFreq === 'Monthly');
    const total = applicableClients.length;

    // Last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i - 1, 1);
      const monthIdx = d.getMonth();
      const calYear = d.getFullYear();
      
      const fyStr = monthIdx >= 3 
        ? `${calYear}-${(calYear + 1).toString().slice(-2)}` 
        : `${calYear - 1}-${calYear.toString().slice(-2)}`;
      
      const monthName = MONTH_NAMES[monthIdx];
      const periodKey = `${fyStr}_${monthName}`;
      
      const periodData = filingData[periodKey] || {};
      const completed = applicableClients.filter(c => periodData[c.id]?.r3b).length;
      
      data.push({
        name: monthName.slice(0, 3) + ' ' + calYear.toString().slice(-2),
        Completed: completed,
        Pending: total - completed,
        total
      });
    }

    return data;
  }, [clients]);

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm flex flex-col h-full relative overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 relative z-10">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
          <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Monthly Performance
        </h3>
      </div>
      <div className="flex-1 w-full min-h-[200px] relative z-10 -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} dx={-10} allowDecimals={false} />
            <Tooltip 
               cursor={{ fill: '#f8fafc' }}
               contentStyle={{ borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
               itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
               labelStyle={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
            <Bar dataKey="Completed" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} barSize={32} />
            <Bar dataKey="Pending" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceChartWidget;
