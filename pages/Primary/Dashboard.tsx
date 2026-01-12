
import React, { useState, useEffect, useCallback, Suspense, lazy, useMemo } from 'react';
import { INITIAL_METRICS } from '../../constants.ts';
import { MetricData, ActiveView, LitigationRecord, Client, InvoiceRecord } from '../../types.ts';
import { useAuth } from '../../auth/AuthContext.tsx';
import { useOffline } from '../../hooks/useOffline.ts';
import { usePWA } from '../../hooks/usePWA.ts';
import { api } from '../../services/api.ts';
import { socketService } from '../../services/socket.ts';

import Sidebar from '../../components/Sidebar.tsx';
import Header from '../../components/Header.tsx';
import MetricCard from '../../components/MetricCard.tsx';
import Loader from '../../components/Loader.tsx';
import InstallBanner from '../../components/InstallBanner.tsx';
import GeminiAssistant from '../../components/GeminiAssistant.tsx';
import CommandPalette from '../../components/CommandPalette.tsx';
import ComplianceRunway from '../../components/ComplianceRunway.tsx';
import LegalEscalationFeed from '../../components/LegalEscalationFeed.tsx';

// Performance-First: Standardize Lazy Loading
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
const NoticeDrop = lazy(() => import('../LitigationSuite/GSTNotices/NoticeDrop.tsx'));
const NoticeDemand = lazy(() => import('../LitigationSuite/GSTNotices/NoticeDemand.tsx'));
const AppealPending = lazy(() => import('../LitigationSuite/GSTAppeals/AppealPending.tsx'));
const AppealFiled = lazy(() => import('../LitigationSuite/GSTAppeals/AppealFiled.tsx'));
const AppealDrop = lazy(() => import('../LitigationSuite/GSTAppeals/AppealDrop.tsx'));
const AppealDemand = lazy(() => import('../LitigationSuite/GSTAppeals/AppealDemand.tsx'));
const TribunalPending = lazy(() => import('../LitigationSuite/Tribunal/TribunalPending.tsx'));
const TribunalFiled = lazy(() => import('../LitigationSuite/Tribunal/TribunalFiled.tsx'));
const TribunalDrop = lazy(() => import('../LitigationSuite/Tribunal/TribunalDrop.tsx'));
const TribunalDemand = lazy(() => import('../LitigationSuite/Tribunal/TribunalDemand.tsx'));
const CourtPending = lazy(() => import('../LitigationSuite/HighCourt/CourtPending.tsx'));
const CourtFiled = lazy(() => import('../LitigationSuite/HighCourt/CourtFiled.tsx'));
const CourtDrop = lazy(() => import('../LitigationSuite/HighCourt/CourtDrop.tsx'));
const CourtDemand = lazy(() => import('../LitigationSuite/HighCourt/CourtDemand.tsx'));
const GSTRegistration = lazy(() => import('../Miscellaneous/GSTRegistration.tsx'));
const FoodLicenses = lazy(() => import('../Miscellaneous/FoodLicenses.tsx'));
const MSMERegistration = lazy(() => import('../Miscellaneous/MSMERegistration.tsx'));
const Miscellaneouswork = lazy(() => import('../Miscellaneous/Miscellaneouswork.tsx'));
const Reminders = lazy(() => import('../Administration/Reminders.tsx'));
const Messenger = lazy(() => import('../Administration/Messenger.tsx'));
const Invoices = lazy(() => import('../Administration/invoice/Invoices.tsx'));
const AddInvoice = lazy(() => import('../Administration/invoice/addinvoice.tsx'));
const PaymentReceived = lazy(() => import('../Administration/invoice/PaymentReceived.tsx'));
const DueDateSetting = lazy(() => import('../Administration/DueDateSetting.tsx'));
const Setting = lazy(() => import('../Administration/Setting.tsx'));
const Trash = lazy(() => import('../Administration/Trash.tsx'));

const VIEW_LABELS: Record<string, { label: string; desc: string }> = {
  'dashboard': { label: 'Executive Pulse', desc: 'Holistic performance and risk intelligence for your firm.' },
  'gst-portfolio': { label: 'GST Portfolio', desc: 'Secure repository for all entity GST credentials.' },
  'it-portfolio': { label: 'IT Portfolio', desc: 'Consolidated income tax identifier vault.' },
  'compliance-monthly': { label: 'Monthly Filing', desc: 'GSTR-1 and GSTR-3B tracking for regular taxpayers.' },
  'reminders': { label: 'Deadline Tracker', desc: 'High-priority statutory reminders for the firm.' },
  'admin-invoices': { label: 'Professional Billing', desc: 'Fee management and tax invoice control center.' }
};

const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const isOnline = useOffline();
  const { installPrompt, triggerInstall } = usePWA();
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [viewExtra, setViewExtra] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [metrics, setMetrics] = useState<MetricData[]>(INITIAL_METRICS);
  const [priorityNotices, setPriorityNotices] = useState<LitigationRecord[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const activeConfig = useMemo(() => VIEW_LABELS[activeView] || { label: 'Vault Module', desc: 'Secured professional firm data.' }, [activeView]);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const summary = await api.getDashboardSummary();
      setMetrics([
        { label: 'Total Receivables', value: Math.round(summary.invoices.filter(i => i.status !== 'Paid').reduce((acc, i) => acc + i.totalAmount, 0) / 1000), trend: 'up' },
        { label: 'Active Litigation', value: summary.litigation.filter(l => l.status === 'Pending').length, trend: 'stable' },
        { label: 'Pending Filings', value: summary.clients.filter(c => c.status === 'Active Filing').length, trend: 'stable' },
        { label: 'Firm Backlog', value: summary.work.filter(w => w.status !== 'Completed').length, trend: 'stable' },
      ]);
      
      // Filter for priority items: Due in less than 7 days
      const now = new Date();
      const priority = summary.litigation.filter(r => {
        if (r.status !== 'Pending') return false;
        const due = new Date(r.dueDate);
        const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diff <= 7;
      }).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      
      setPriorityNotices(priority);
    } catch (err) { console.error('Firm Sync Failed:', err); } finally { setIsInitialLoad(false); }
  }, [token]);

  useEffect(() => {
    if (isOnline) { loadData(); socketService.connect(); }
    return () => socketService.disconnect();
  }, [isOnline, loadData]);

  const handleViewChange = (view: ActiveView, extra?: any) => {
    setActiveView(view);
    setViewExtra(extra || null);
    setIsSidebarOpen(false);
    window.scrollTo(0, 0);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 h-full pb-32">
            {installPrompt && <InstallBanner onInstall={triggerInstall} />}
            
            {/* High-Velocity Action Strip */}
            <div className="flex flex-wrap gap-4 items-center justify-center lg:justify-start">
               <button onClick={() => handleViewChange('gst-portfolio')} className="px-8 py-5 glass-card rounded-2xl font-black uppercase text-[11px] tracking-widest text-indigo-600 hover:bg-indigo-600 hover:text-white hover:shadow-xl transition-all flex items-center gap-3">
                 <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                 Onboard Client
               </button>
               <button onClick={() => handleViewChange('admin-add-invoice')} className="px-8 py-5 glass-card rounded-2xl font-black uppercase text-[11px] tracking-widest text-emerald-600 hover:bg-emerald-600 hover:text-white hover:shadow-xl transition-all flex items-center gap-3">
                 <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 Create Invoice
               </button>
               <button onClick={() => handleViewChange('lit-notice-pending')} className="px-8 py-5 glass-card rounded-2xl font-black uppercase text-[11px] tracking-widest text-rose-600 hover:bg-rose-600 hover:text-white hover:shadow-xl transition-all flex items-center gap-3">
                 <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                 Log Notice
               </button>
            </div>

            {/* Strategic Intelligence Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {metrics.map((m, i) => (
                <MetricCard 
                  key={i} 
                  metric={m} 
                  priority={m.label.includes('Litigation') && m.value > 5 ? 'high' : 'low'}
                  onClick={() => {
                    if (m.label.includes('Litigation')) handleViewChange('lit-notice-pending');
                    if (m.label.includes('Receivables')) handleViewChange('admin-invoices');
                    if (m.label.includes('Filings')) handleViewChange('compliance-monthly');
                  }}
                />
              ))}
            </div>
            
            {/* Operational Nerve Center */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-stretch">
               <div className="xl:col-span-2 space-y-8">
                  <ComplianceRunway 
                    month="May" 
                    stats={{ requested: 124, prepared: 82, filed: 45, total: 124 }} 
                  />
                  
                  {/* Practice Density / Load Analysis */}
                  <div className="glass-card rounded-[2.5rem] p-10 border border-slate-200 min-h-[400px] flex flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-10">
                      <div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Practice Intensity</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Firm Load Distribution (Last 12 Months)</p>
                      </div>
                      <div className="flex items-center gap-2">
                         <kbd className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-tighter shadow-sm">Ctrl + K Commands</kbd>
                      </div>
                    </div>
                    <div className="flex items-end justify-between gap-4 h-48">
                       {[40, 70, 55, 90, 80, 60, 30, 85, 45, 50, 65, 95].map((h, i) => (
                         <div key={i} className="flex-1 bg-slate-50/50 rounded-xl relative group overflow-hidden h-full flex flex-col justify-end border border-slate-100/50">
                            <div 
                              className={`w-full rounded-xl transition-all duration-1000 group-hover:bg-indigo-600 group-hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] ${h > 80 ? 'bg-rose-500/20' : h > 50 ? 'bg-indigo-600/10' : 'bg-slate-200'}`} 
                              style={{ height: `${h}%` }} 
                            />
                            <div className="absolute top-0 inset-x-0 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[8px] font-black py-1 text-center rounded-t-xl">{h}%</div>
                         </div>
                       ))}
                    </div>
                    <div className="mt-8 flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
                       <span>JUN '24</span>
                       <span>MAY '25</span>
                    </div>
                  </div>
               </div>
               
               {/* Litigation Pulse Sidebar */}
               <div className="h-full min-h-[600px]">
                 <LegalEscalationFeed 
                   items={priorityNotices} 
                   onAction={(id) => handleViewChange('lit-notice-pending')} 
                 />
               </div>
            </div>
          </div>
        );
      case 'gst-portfolio': return <GSTPortfolio />;
      case 'it-portfolio': return <ITPortfolio />;
      case 'compliance-monthly': return <MonthlyFiling />;
      case 'compliance-quarterly': return <QuarterlyFiling />;
      case 'compliance-composition': return <CompositionFiling />;
      case 'compliance-gstr4': return <GSTR4 />;
      case 'compliance-gstr9': return <GSTR9_9C />;
      case 'compliance-itr': return <ITRReturn />;
      case 'compliance-taxaudit': return <TAXAudit />;
      case 'lit-notice-pending': return <NoticePending />;
      case 'lit-notice-filed': return <NoticeFiled />;
      case 'lit-notice-drop': return <NoticeDrop />;
      case 'lit-notice-demand': return <NoticeDemand />;
      case 'lit-appeal-pending': return <AppealPending />;
      case 'lit-appeal-filed': return <AppealFiled />;
      case 'lit-appeal-drop': return <AppealDrop />;
      case 'lit-appeal-demand': return <AppealDemand />;
      case 'lit-tribunal-pending': return <TribunalPending />;
      case 'lit-tribunal-filed': return <TribunalFiled />;
      case 'lit-tribunal-drop': return <TribunalDrop />;
      case 'lit-tribunal-demand': return <TribunalDemand />;
      case 'lit-hc-pending': return <CourtPending />;
      case 'lit-hc-filed': return <CourtFiled />;
      case 'lit-hc-drop': return <CourtDrop />;
      case 'lit-hc-demand': return <CourtDemand />;
      case 'misc-gst-reg': return <GSTRegistration />;
      case 'misc-food-lic': return <FoodLicenses />;
      case 'misc-msme': return <MSMERegistration />;
      case 'misc-work': return <Miscellaneouswork />;
      case 'reminders': return <Reminders />;
      case 'messenger': return <Messenger />;
      case 'admin-invoices': return <Invoices onViewChange={handleViewChange} />;
      case 'admin-add-invoice': return <AddInvoice onBack={() => handleViewChange('admin-invoices')} editingInvoice={viewExtra} />;
      case 'admin-payments': return <PaymentReceived onViewChange={handleViewChange} />;
      case 'admin-duedates': return <DueDateSetting />;
      case 'settings': return <Setting />;
      case 'trash': return <Trash />;
      default: return <div className="p-20 text-center text-slate-300 font-black uppercase tracking-widest">Invalid View ID</div>;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#fcfdfe] relative">
      <Sidebar activeView={activeView} onViewChange={handleViewChange} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex flex-1 flex-col overflow-hidden relative">
        <Header 
          isConnected={isOnline} 
          currentUser={user} 
          onMenuClick={() => setIsSidebarOpen(true)} 
          activeViewLabel={activeConfig.label} 
          activeViewDescription={activeConfig.desc} 
        />
        <div className="flex-1 flex flex-col min-h-0 px-6 lg:px-12 pt-8 pb-12 overflow-y-auto no-scrollbar scroll-smooth">
          {isInitialLoad && activeView === 'dashboard' ? <Loader /> : (
            <Suspense fallback={<Loader />}>{renderContent()}</Suspense>
          )}
        </div>
        <GeminiAssistant activeView={activeView} />
      </main>
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} onViewChange={handleViewChange} />
    </div>
  );
};

export default Dashboard;
