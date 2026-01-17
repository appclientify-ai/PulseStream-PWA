
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { ActiveView, LitigationRecord, Client } from '../../types.ts';
import { useAuth } from '../../auth/AuthContext.tsx';
import { api } from '../../services/api.ts';
import Sidebar from '../../components/Sidebar.tsx';
import Header from '../../components/Header.tsx';
import Loader from '../../components/Loader.tsx';

// Lazy loading sub-pages
const GSTPortfolio = lazy(() => import('../ClientHub/GSTPortfolio.tsx'));
const ITPortfolio = lazy(() => import('../ClientHub/ITPortfolio.tsx'));
const MonthlyFiling = lazy(() => import('../Compliance/GSTReturn/MonthlyFiling.tsx'));
const QuarterlyFiling = lazy(() => import('../Compliance/GSTReturn/QuarterlyFiling.tsx'));
const CompositionFiling = lazy(() => import('../Compliance/GSTReturn/CompositionFiling.tsx'));
const GSTR4 = lazy(() => import('../Compliance/AnnualReturns/GSTR4.tsx'));
const GSTR9_9C = lazy(() => import('../Compliance/AnnualReturns/GSTR9_9C.tsx'));
const ITRReturn = lazy(() => import('../Compliance/ITAudit/ITRReturn.tsx'));
const TAXAudit = lazy(() => import('../Compliance/ITAudit/TAXAudit.tsx'));
const NoticePending = lazy(() => import('../LitigationSuite/GSTNotices/NoticePending.tsx'));
const NoticeFiled = lazy(() => import('../LitigationSuite/GSTNotices/NoticeFiled.tsx'));
const AppealPending = lazy(() => import('../LitigationSuite/GSTAppeals/AppealPending.tsx'));
const MSMERegistration = lazy(() => import('../Miscellaneous/MSMERegistration.tsx'));
const Invoices = lazy(() => import('../Administration/invoice/Invoices.tsx'));
const DueDateSetting = lazy(() => import('../Administration/DueDateSetting.tsx'));
const Setting = lazy(() => import('../Administration/Setting.tsx'));
const Reminders = lazy(() => import('../Administration/Reminders.tsx'));

const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [litigation, setLitigation] = useState<LitigationRecord[]>([]);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const summary = await api.getDashboardSummary();
      setClients(summary.clients);
      setLitigation(summary.litigation);
    } catch (e) {
      console.error("Dashboard sync error");
    }
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleViewChange = (view: ActiveView) => {
    setActiveView(view);
    window.scrollTo(0, 0);
  };

  const SectionHeader = ({ title, icon }: { title: string; icon: string }) => (
    <div className="flex items-center gap-3 mb-6 mt-12 first:mt-0 px-2">
      <span className="text-xl">{icon}</span>
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{title}</h3>
    </div>
  );

  const DashboardCard = ({ 
    title, 
    viewId, 
    stats, 
    icon, 
    dueDate, 
    selector, 
    statusCircle = "N/A" 
  }: { 
    title: string; 
    viewId: string; 
    stats: { label: string; value: number | string; color?: string }[]; 
    icon: React.ReactNode;
    dueDate?: string;
    selector?: React.ReactNode;
    statusCircle?: string;
  }) => (
    <div className="bg-white rounded-[1rem] border border-slate-100 shadow-sm flex flex-col hover:border-indigo-200 hover:shadow-md transition-all group h-full">
      <div className="p-6 flex-1">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 text-slate-400 group-hover:text-indigo-600 transition-colors">{icon}</div>
            <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-tight">{title}</h4>
          </div>
          {dueDate && (
            <div className="text-right">
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Due Date:</p>
              <p className="text-[9px] font-black text-slate-500">{dueDate}</p>
            </div>
          )}
        </div>

        {selector && <div className="mb-6">{selector}</div>}

        <div className="flex items-center gap-6">
          <div className="flex-1 space-y-4">
            {stats.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</span>
                <span className={`text-[13px] font-black ${s.color || 'text-slate-900'}`}>{s.value}</span>
              </div>
            ))}
          </div>
          <div className="h-16 w-16 rounded-full border-4 border-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0">
            {statusCircle}
          </div>
        </div>
      </div>
      <button 
        onClick={() => handleViewChange(viewId)}
        className="w-full py-3 bg-indigo-50/50 text-indigo-600 rounded-b-[1rem] font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 hover:text-white transition-all border-t border-slate-50"
      >
        View Details
      </button>
    </div>
  );

  const renderDashboard = () => (
    <div className="max-w-full mx-auto px-6 py-6 pb-40 animate-in fade-in duration-700">
      
      <SectionHeader title="Client Management" icon="👥" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard 
          title="GST Clients" 
          viewId="gst-portfolio"
          icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          stats={[
            { label: 'Total Clients', value: clients.filter(c => !!c.gstProfile).length },
            { label: 'Active Filing', value: clients.filter(c => c.status === 'Active').length },
            { label: 'Inactive/Other', value: clients.filter(c => c.status !== 'Active').length }
          ]}
        />
        <DashboardCard 
          title="Income Tax Clients" 
          viewId="it-portfolio"
          icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857" /></svg>}
          stats={[
            { label: 'Total Clients', value: clients.filter(c => !!c.itProfile).length },
            { label: 'Active Filing', value: clients.filter(c => !!c.itProfile && c.status === 'Active').length },
            { label: 'Inactive/Other', value: clients.filter(c => !!c.itProfile && c.status !== 'Active').length }
          ]}
        />
      </div>

      <SectionHeader title="Tax & Compliance" icon="📈" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard 
          title="Monthly Returns" 
          viewId="compliance-monthly"
          dueDate="20/01/2026"
          icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          selector={
            <div className="flex gap-2">
              <select className="bg-slate-50 border-none rounded-lg px-2 py-1 text-[9px] font-black uppercase text-slate-500"><option>F.Y.: 2025-26</option></select>
              <select className="bg-slate-50 border-none rounded-lg px-2 py-1 text-[9px] font-black uppercase text-slate-500"><option>December</option></select>
            </div>
          }
          stats={[
            { label: 'Pending GSTR-1', value: 0, color: 'text-rose-500' },
            { label: 'Pending GSTR-3B', value: 0, color: 'text-rose-500' },
            { label: 'Total Filed', value: 0, color: 'text-emerald-500' }
          ]}
        />
        <DashboardCard 
          title="Quarterly Returns" 
          viewId="compliance-quarterly"
          dueDate="21/04/2026"
          icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
          selector={
            <div className="flex gap-2">
              <select className="bg-slate-50 border-none rounded-lg px-2 py-1 text-[9px] font-black uppercase text-slate-500"><option>F.Y.: 2025-26</option></select>
              <select className="bg-slate-50 border-none rounded-lg px-2 py-1 text-[9px] font-black uppercase text-slate-500"><option>Q4 (Jan-Mar)</option></select>
            </div>
          }
          stats={[
            { label: 'Pending GSTR-1', value: 0, color: 'text-rose-500' },
            { label: 'Pending GSTR-3B', value: 0, color: 'text-rose-500' },
            { label: 'Total Filed', value: 0, color: 'text-emerald-500' }
          ]}
        />
        <DashboardCard 
          title="Composition Returns" 
          viewId="compliance-composition"
          dueDate="17/04/2026"
          icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>}
          selector={
            <div className="flex gap-2">
              <select className="bg-slate-50 border-none rounded-lg px-2 py-1 text-[9px] font-black uppercase text-slate-500"><option>F.Y.: 2025-26</option></select>
              <select className="bg-slate-50 border-none rounded-lg px-2 py-1 text-[9px] font-black uppercase text-slate-500"><option>Q4 (Jan-Mar)</option></select>
            </div>
          }
          stats={[
            { label: 'Pending CMP-08', value: 0, color: 'text-rose-500' },
            { label: 'Filed CMP-08', value: 0, color: 'text-emerald-500' }
          ]}
        />
      </div>

      <SectionHeader title="Annual Returns" icon="📅" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard 
          title="GSTR-4 Annual" 
          viewId="compliance-gstr4"
          dueDate="30/04/2026"
          icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          selector={<select className="bg-slate-50 border-none rounded-lg px-2 py-1 text-[9px] font-black uppercase text-slate-500"><option>F.Y.: 2025-26</option></select>}
          stats={[{ label: 'Pending', value: 0, color: 'text-rose-500' }, { label: 'Filed', value: 0, color: 'text-emerald-500' }]}
        />
        <DashboardCard 
          title="GSTR-9/9C Annual" 
          viewId="compliance-gstr9"
          dueDate="31/12/2026"
          icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586" /></svg>}
          selector={<select className="bg-slate-50 border-none rounded-lg px-2 py-1 text-[9px] font-black uppercase text-slate-500"><option>F.Y.: 2025-26</option></select>}
          stats={[{ label: 'Pending GSTR-9', value: 0, color: 'text-rose-500' }, { label: 'Pending GSTR-9C', value: 0, color: 'text-rose-500' }]}
        />
      </div>

      <SectionHeader title="Income Tax & Audit" icon="💼" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard 
          title="Income Tax Returns" 
          viewId="compliance-itr"
          dueDate="31/07/2026"
          icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          selector={<select className="bg-slate-50 border-none rounded-lg px-2 py-1 text-[9px] font-black uppercase text-slate-500"><option>A.Y.: 2026-27</option></select>}
          stats={[{ label: 'Pending', value: 0, color: 'text-rose-500' }, { label: 'Filed', value: 0, color: 'text-emerald-500' }]}
        />
        <DashboardCard 
          title="Audit" 
          viewId="compliance-taxaudit"
          dueDate="31/10/2026"
          icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
          selector={<select className="bg-slate-50 border-none rounded-lg px-2 py-1 text-[9px] font-black uppercase text-slate-500"><option>F.Y.: 2025-26</option></select>}
          stats={[{ label: 'Pending', value: 0, color: 'text-rose-500' }, { label: 'Completed', value: 0, color: 'text-emerald-500' }]}
        />
        <DashboardCard 
          title="Balance Sheet" 
          viewId="compliance-taxaudit"
          dueDate="31/10/2026"
          icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
          selector={<select className="bg-slate-50 border-none rounded-lg px-2 py-1 text-[9px] font-black uppercase text-slate-500"><option>F.Y.: 2025-26</option></select>}
          stats={[{ label: 'Pending', value: 0, color: 'text-rose-500' }, { label: 'Finalized', value: 0, color: 'text-emerald-500' }]}
        />
      </div>

      <SectionHeader title="Miscellaneous Work" icon="📁" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard title="GST Registrations" viewId="misc-gst-reg" icon="📝" statusCircle="0" stats={[{ label: 'In Progress', value: 0 }]} />
        <DashboardCard title="Food Licenses" viewId="misc-food-lic" icon="🍔" statusCircle="0" stats={[{ label: 'In Progress', value: 0 }]} />
        <DashboardCard title="MSME Registrations" viewId="misc-msme" icon="🏢" statusCircle="0" stats={[{ label: 'In Progress', value: 0 }]} />
        <DashboardCard title="Other Work" viewId="misc-work" icon="💼" statusCircle="0" stats={[{ label: 'In Progress', value: 0 }]} />
      </div>

      <SectionHeader title="Administrative" icon="⚙️" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard title="Due Date Reminders" viewId="admin-duedates" icon="⏰" statusCircle="0" stats={[{ label: 'Total Active', value: 0 }]} />
        <DashboardCard title="Reminder Messages" viewId="reminders" icon="💬" statusCircle="0" stats={[{ label: 'Clients to Remind', value: 0 }]} />
        <DashboardCard title="Payment Details" viewId="admin-payments" icon="💳" statusCircle="0" stats={[{ label: 'Invoices Pending', value: 0 }]} />
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <Sidebar activeView={activeView} onViewChange={handleViewChange} isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} onOpenFolder={() => {}} />
      <main className={`flex flex-1 flex-col overflow-hidden transition-all duration-500 ${isSidebarCollapsed ? 'ml-20' : 'ml-80'}`}>
        <Header isConnected={true} currentUser={user} onMenuClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} activeViewLabel={activeView} activeViewDescription="" onViewChange={handleViewChange} />
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <Suspense fallback={<Loader />}>
            {activeView === 'dashboard' ? renderDashboard() : (
              <div className="p-4 h-full">
                {activeView === 'gst-portfolio' && <GSTPortfolio />}
                {activeView === 'it-portfolio' && <ITPortfolio />}
                {activeView === 'compliance-monthly' && <MonthlyFiling />}
                {activeView === 'compliance-quarterly' && <QuarterlyFiling />}
                {activeView === 'compliance-composition' && <CompositionFiling />}
                {activeView === 'compliance-gstr4' && <GSTR4 />}
                {activeView === 'compliance-gstr9' && <GSTR9_9C />}
                {activeView === 'compliance-itr' && <ITRReturn />}
                {activeView === 'compliance-taxaudit' && <TAXAudit />}
                {activeView === 'lit-notice-pending' && <NoticePending />}
                {activeView === 'lit-notice-filed' && <NoticeFiled />}
                {activeView === 'lit-appeal-pending' && <AppealPending />}
                {activeView === 'misc-msme' && <MSMERegistration />}
                {activeView === 'admin-invoices' && <Invoices onViewChange={handleViewChange} />}
                {activeView === 'admin-duedates' && <DueDateSetting />}
                {activeView === 'settings' && <Setting />}
                {activeView === 'reminders' && <Reminders />}
              </div>
            )}
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
