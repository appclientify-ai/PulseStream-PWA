
import React from 'react';
import { LitigationRecord } from '../types';
import { formatDate } from '../dateUtils';

interface LegalEscalationFeedProps {
  items: LitigationRecord[];
  onAction: (id: string) => void;
}

const LegalEscalationFeed: React.FC<LegalEscalationFeedProps> = ({ items, onAction }) => {
  return (
    <div className="glass-card rounded-[2.5rem] p-8 border border-slate-200 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6 shrink-0">
        <div>
          <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Litigation Pulse</h3>
          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-1">High Stakes Escalations</p>
        </div>
        <span className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black animate-pulse-priority">
          {items.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-2">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-30 grayscale">
            <svg className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-sm font-black uppercase tracking-widest">No Priority Flares</p>
          </div>
        ) : (
          items.map(item => (
            <div 
              key={item.id} 
              onClick={() => onAction(item.id)}
              className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-rose-400 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full traffic-red" />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Section {item.section}</span>
                </div>
                <span className="text-[10px] font-black text-rose-600 uppercase bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                   Priority
                </span>
              </div>
              <h4 className="font-black text-slate-900 uppercase text-sm truncate group-hover:text-indigo-600 transition-colors">
                {item.clientName}
              </h4>
              <div className="mt-4 flex items-center justify-between">
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[150px]">Ref: {item.referenceNo}</p>
                 <p className="text-[10px] font-black text-slate-900 uppercase">Due: {formatDate(item.dueDate)}</p>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-6 pt-6 border-t border-slate-100 shrink-0">
         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center italic">Monitor 90-day appeal windows here</p>
      </div>
    </div>
  );
};

export default LegalEscalationFeed;
