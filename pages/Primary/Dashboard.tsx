import React, { useState, useEffect, useCallback, Suspense, lazy, useMemo } from 'react';
import { INITIAL_METRICS } from '../../constants.ts';
import { MetricData, ActiveView } from '../../types.ts';
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
  'dashboard': { label: 'Firm Intelligence', desc: 'Real-time performance metrics for your practice.' },
  'gst-portfolio': { label: 'GST Master List', desc: 'Secure repository for all entity GST credentials.' },
  'it-portfolio': { label: 'IT Master List', desc: 'Consolidated income tax identifier vault.' },
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
  const [metrics, setMetrics] = useState<MetricData[]>(INITIAL_METRICS);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const activeConfig = useMemo(() => VIEW_LABELS[activeView] || { label: 'Vault Module', desc: 'Secured professional firm data.' }, [activeView]);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const summary = await api.getDashboardSummary();
      setMetrics([
        { label: 'Total Clients', value: summary.clients.length, trend: 'stable' },
        { label: 'Active Litigation', value: summary.litigation.filter(l => l.status === 'Pending').length, trend: 'up' },
        { label: 'Invoices Due', value: summary.invoices.filter(i => i.status !== 'Paid').length, trend: 'up' },
        { label: 'Firm Backlog', value: summary.work.filter(w => w.status !== 'Completed').length, trend: 'stable' },
      ]);
    } catch (err) {
      console.error('Firm Sync Failed:', err);
    } finally {
      setIsInitialLoad(false);
    }
  }, [token]);

  useEffect(() => {
    if (isOnline) {
      loadData();
      socketService.connect();
    }
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
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 h-full pb-20">
            {installPrompt && <InstallBanner onInstall={triggerInstall} />}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {metrics.map((m, i) => <MetricCard key={i} metric={m} />)}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm min-h-[400px] flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">Practice Intensity</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Monthly Load Distribution</p>
                  </div>
                  <div className="flex items-end justify-between gap-4 h-48 mt-10">
                     {[40, 70, 55, 90, 80, 60, 30, 85, 45, 50, 65, 95].map((h, i) => (
                       <div key={i} className="flex-1 bg-slate-50 rounded-xl relative group overflow-hidden h-full flex flex-col justify-end">
                          <div className="w-full bg-indigo-600/10 rounded-xl transition-all duration-1000 group-hover:bg-indigo-600" style={{ height: `${h}%` }} />
                       </div>
                     ))}
                  </div>
               </div>
               
               <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col">
                  <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/20 blur-3xl rounded-full -mr-10 -mt-10" />
                  <h3 className="text-xl font-black uppercase tracking-tight relative z-10 mb-8">High Priority</h3>
                  <div className="space-y-4 relative z-10 flex-1">
                     <button onClick={() => handleViewChange('gst-portfolio')} className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-indigo-600 transition-all">
                        <span className="text-[10px] font-black uppercase tracking-widest">Master Credentials</span>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                     </button>
                     <button onClick={() => handleViewChange('admin-invoices')} className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-indigo-600 transition-all">
                        <span className="text-[10px] font-black uppercase tracking-widest">Generate Bill</span>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                     </button>
                  </div>
                  <div className="mt-10 pt-10 border-t border-white/10 shrink-0">
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Authenticated As</p>
                     <p className="text-lg font-black uppercase truncate">{user?.username}</p>
                  </div>
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
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <Sidebar activeView={activeView} onViewChange={handleViewChange} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex flex-1 flex-col overflow-hidden relative">
        <Header 
          isConnected={isOnline} 
          currentUser={user} 
          onMenuClick={() => setIsSidebarOpen(true)} 
          activeViewLabel={activeConfig.label} 
          activeViewDescription={activeConfig.desc} 
        />
        <div className="flex-1 flex flex-col min-h-0 px-6 lg:px-12 pt-8 pb-12 overflow-y-auto no-scrollbar">
          {isInitialLoad && activeView === 'dashboard' ? <Loader /> : (
            <Suspense fallback={<Loader />}>{renderContent()}</Suspense>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
