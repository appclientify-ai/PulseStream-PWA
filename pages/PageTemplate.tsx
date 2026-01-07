
import React from 'react';

interface PageTemplateProps {
  title: string;
  description: string;
}

const PageTemplate: React.FC<PageTemplateProps> = ({ title, description }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 border-b border-slate-800 pb-6">
        <h2 className="text-3xl font-black text-white tracking-tight">{title}</h2>
        <p className="mt-2 text-slate-400">{description}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm">
          <div className="mb-4 h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white">Pending Tasks</h3>
          <p className="mt-2 text-sm text-slate-500">No active tasks found for this module.</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm">
          <div className="mb-4 h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white">Completed</h3>
          <p className="mt-2 text-sm text-slate-500">All recent activities are synced and up-to-date.</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm">
          <div className="mb-4 h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white">Upcoming Deadlines</h3>
          <p className="mt-2 text-sm text-slate-500">Check the administration panel for scheduled reminders.</p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/20 p-8 text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-slate-800 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h4 className="text-xl font-bold text-slate-300">Vault Data Placeholder</h4>
        <p className="text-slate-500 max-w-md mx-auto mt-2">This section will display real-time client data, document lists, and processing statuses as they sync from the secure backend.</p>
      </div>
    </div>
  );
};

export default PageTemplate;
