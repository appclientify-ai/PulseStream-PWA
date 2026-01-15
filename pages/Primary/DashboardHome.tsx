
import React, { useState, useEffect } from 'react';
import MetricCard from '../../components/MetricCard';
import ComplianceRunway from '../../components/ComplianceRunway';
import LegalEscalationFeed from '../../components/LegalEscalationFeed';
import { api } from '../../services/api.ts';
import { MetricData, LitigationRecord } from '../../types';
import Loader from '../../components/Loader';

interface DashboardHomeProps {
  setActiveView: (view: string) => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ setActiveView }) => {
  const [metrics, setMetrics] = useState<MetricData[]>([
    { label: 'Total Entities', value: 0, trend: 'stable' },
    { label: 'Active Litigation', value: 0, trend: 'stable' },
    { label: 'Pending Returns', value: 0, trend: 'stable' },
    { label: 'Collections (MTD)', value: 0, trend: 'stable' }
  ]);
  const [escalations, setEscalations] = useState<LitigationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const summary = await api.getDashboardSummary();
        
        setMetrics([
          { label: 'Total Entities', value: summary.clients.length, trend: 'up' },
          { label: 'Active Litigation', value: summary.litigation.filter(l => l.status === 'Pending').length, trend: 'stable' },
          { label: 'Pending Returns', value: 12, trend: 'down' }, // Example static for demo
          { label: 'Firm Backlog', value: summary.work.filter(w => w.status !== 'Completed').length, trend: 'up' }
        ]);

        setEscalations(summary.litigation.filter(l => l.status === 'Pending').slice(0, 5));
      } catch (err) {
        console.error("Summary failed", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSummary();
  }, []);

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <MetricCard 
            key={i} 
            metric={m} 
            priority={m.label.includes('Litigation') && m.value > 0 ? 'high' : 'low'}
            onClick={() => {
              if (m.label.includes('Entities')) setActiveView('gst-portfolio');
              if (m.label.includes('Litigation')) setActiveView('lit-notice-pending');
              if (m.label.includes('Returns')) setActiveView('compliance-monthly');
            }}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ComplianceRunway 
            month="May 2025" 
            stats={{
              requested: 45,
              prepared: 32,
              filed: 28,
              total: 50
            }}
          />
          
          <div className="mt-8 bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black uppercase tracking-tight">Recent Activity Log</h3>
                <button onClick={() => setActiveView('trash')} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:underline">Full Audit Trail</button>
             </div>
             <div className="space-y-6">
                {[1,2,3].map(i => (
                  <div key={i} className="flex gap-4 items-start pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                     <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     </div>
                     <div>
                        <p className="text-sm font-black text-slate-800 uppercase">System Sync: Record ID #{Math.floor(Math.random()*10000)}</p>
                        <p className="text-xs text-slate-400 mt-1 font-medium">Auto-backup completed for master GST vault. Secure encryption verified.</p>
                        <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-2">{i}h ago</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <LegalEscalationFeed 
            items={escalations} 
            onAction={() => setActiveView('lit-notice-pending')} 
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
