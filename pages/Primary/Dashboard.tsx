
import React, { useState, useEffect, useCallback, Suspense, lazy, useMemo } from 'react';
import { socketService } from '../../services/socket.ts';
import { INITIAL_METRICS } from '../../constants.ts';
import { AppState, Message, MetricData, ActiveView } from '../../types.ts';
import { useAuth } from '../../auth/AuthContext.tsx';
import { useOffline } from '../../hooks/useOffline.ts';
import { usePWA } from '../../hooks/usePWA.ts';
import { api } from '../../services/api.ts';

import Sidebar from '../../components/Sidebar.tsx';
import Header from '../../components/Header.tsx';
import MetricCard from '../../components/MetricCard.tsx';
import ChatPanel from '../../components/ChatPanel.tsx';
import Loader from '../../components/Loader.tsx';
import InstallBanner from '../../components/InstallBanner.tsx';

// LAZY IMPORTS - Note: ESM requires extensions here too if the bundler isn't handling it,
// but usually Vite handles .tsx in dynamic imports. Standardizing with .tsx for consistency.
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
const InvoiceSetting = lazy(() => import('../Administration/invoice/invoicesetting.tsx'));
const PaymentReceived = lazy(() => import('../Administration/invoice/PaymentReceived.tsx'));
const DueDateSetting = lazy(() => import('../Administration/DueDateSetting.tsx'));
const Setting = lazy(() => import('../Administration/Setting.tsx'));
const Trash = lazy(() => import('../Administration/Trash.tsx'));

const VIEW_CONFIG: Record<string, { label: string; description: string }> = {
  'dashboard': { label: 'Dashboard', description: 'Real-time overview of your professional firm performance.' },
  'gst-portfolio': { label: 'GST Portfolio', description: 'Centralized management of client GST portal access and tracking.' },
  'it-portfolio': { label: 'IT Portfolio', description: 'Secure vault for Income Tax profiles and historical filings.' },
  'compliance-monthly': { label: 'Monthly Filing', description: 'Tracking GSTR-1 and GSTR-3B status for regular taxpayers.' },
  'compliance-quarterly': { label: 'Quarterly Filing', description: 'Management of QRMP scheme returns and tax payments.' },
  'compliance-composition': { label: 'Composition Filing', description: 'CMP-08 and GSTR-4 compliance for composition dealers.' },
  'compliance-gstr4': { label: 'GSTR-4 Annual', description: 'Manage annual compliance for composition taxpayers.' },
  'compliance-gstr9': { label: 'GSTR-9 & 9C', description: 'Annual reconciliation and audit returns for GST compliance.' },
  'compliance-itr': { label: 'ITR Returns', description: 'Income Tax Return management for all entity types.' },
  'compliance-taxaudit': { label: 'Audit & Financials', description: 'Combined suite for Balance Sheet finalization and Tax Audit reporting.' },
  'lit-notice-pending': { label: 'Pending Notices', description: 'Action required: Notices awaiting official response.' },
  'lit-notice-filed': { label: 'Filed Notices', description: 'Historical record of submitted notice replies.' },
  'lit-notice-drop': { label: 'Drop Orders', description: 'Closed proceedings and dropped show cause notices.' },
  'lit-notice-demand': { label: 'Demand Orders', description: 'Confirmed tax, interest, and penalty demands.' },
  'lit-appeal-pending': { label: 'Pending Appeals', description: 'Appeals in progress before Commissioner (Appeals).' },
  'lit-appeal-filed': { label: 'Filed Appeals', description: 'Form GST APL-01 submission tracking.' },
  'lit-appeal-drop': { label: 'Appeal Results: Favorable', description: 'Appeals concluded with relief for the taxpayer.' },
  'lit-appeal-demand': { label: 'Appeal Results: Sustained', description: 'Appeals resulting in confirmed demands.' },
  'lit-tribunal-pending': { label: 'Tribunal Pending', description: 'Matters currently before the GSTAT.' },
  'lit-tribunal-filed': { label: 'Tribunal Filed', description: 'Second level appeals submitted to the Tribunal.' },
  'lit-tribunal-drop': { label: 'Tribunal Drop Orders', description: 'Matters successfully dismissed by GSTAT.' },
  'lit-tribunal-demand': { label: 'Tribunal Demands', description: 'Demands confirmed at the Tribunal level.' },
  'lit-hc-pending': { label: 'High Court Pending', description: 'Writ petitions and Tax Appeals currently in session.' },
  'lit-hc-filed': { label: 'High Court Filed', description: 'Documentation of cases submitted to the High Court.' },
  'lit-hc-drop': { label: 'High Court Relief', description: 'Favorable High Court judgments and stay orders.' },
  'lit-hc-demand': { label: 'High Court Demands', description: 'Sustained demands confirmed after High Court litigation.' },
  'misc-gst-reg': { label: 'GST Registration', description: 'Manage new applications, amendments, and certificate downloads.' },
  'misc-food-lic': { label: 'Food Licenses', description: 'FSSAI registration and license management suite.' },
  'misc-msme': { label: 'MSME Registration', description: 'Udyam certificate management and validation.' },
  'misc-work': { label: 'Miscellaneous Work', description: 'PAN, TAN, DSC, and other professional firm services.' },
  'reminders': { label: 'Compliance Reminders', description: 'Scheduled document submission and filing alerts.' },
  'messenger': { label: 'Bulk Messenger', description: 'Communicate with all clients via WhatsApp, Email, and SMS.' },
  'admin-invoices': { label: 'Invoices', description: 'Generate and track professional service billing for clients.' },
  'admin-add-invoice': { label: 'Invoice Composer', description: 'Advanced multi-item billing engine with auto-serials.' },
  'admin-invoice-setting': { label: 'Invoice Setting', description: 'Configure firm branding, logos, signatures and bank details.' },
  'admin-payments': { label: 'Payments Received', description: 'Log and monitor professional fees collected from clients.' },
  'admin-duedates': { label: 'Due Date Setting', description: 'Configure automatic reminders and firm compliance calendars.' },
  'settings': { label: 'Setting', description: 'Manage firm profile, user permissions, and security.' },
  'trash': { label: 'Trash Bin', description: 'Recently deleted records and documents (Retained for 30 days).' }
};

const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const isOnline = useOffline();
  const { installPrompt, triggerInstall } = usePWA();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [viewExtra, setViewExtra] = useState<any>(null);

  const [state, setState] = useState<AppState>({
    messages: [],
    metrics: INITIAL_METRICS as MetricData[],
    users: [],
    isConnected: false,
    currentUser: user,
  });

  const activeViewConfig = useMemo(() => VIEW_CONFIG[activeView] || { label: 'Clientify Suite', description: 'Professional Consultant Solution' }, [activeView]);

  const handleViewChange = (view: ActiveView, extra?: any) => {
    setActiveView(view);
    setViewExtra(extra || null);
  };

  useEffect(() => {
    const loadData = async () => {
      setIsDataLoading(true);
      try {
        const items = await api.get('/items');
        setState(prev => ({
          ...prev,
          metrics: prev.metrics.map(m => 
            m.label === 'Active Clients' ? { ...m, value: items.length || 0, trend: items.length > 0 ? 'up' : 'stable' } : m
          )
        }));
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setIsDataLoading(false);
      }
    };
    if (isOnline && token) loadData();
  }, [isOnline, token, activeView]); // Added activeView as dependency to refresh metric count when coming back from other pages

  useEffect(() => {
    if (isOnline) {
      socketService.connect();
      socketService.on('message', (msg: Message) => {
        setState(prev => ({ ...prev, messages: [...prev.messages, msg] }));
      });
      setState(prev => ({ ...prev, isConnected: true }));
    } else {
      socketService.disconnect();
      setState(prev => ({ ...prev, isConnected: false }));
    }
    return () => { socketService.disconnect(); };
  }, [isOnline]);

  const handleSendMessage = useCallback((content: string) => {
    const newMessage: Message = { id: `msg_${Date.now()}`, sender: user?.username || 'Consultant', content, timestamp: Date.now() };
    setState(prev => ({ ...prev, messages: [...prev.messages, newMessage] }));
    socketService.emit('message', newMessage);
  }, [user]);

  if (isDataLoading) return <Loader />;

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 overflow-y-auto h-full pr-1 no-scrollbar">
            {installPrompt && <InstallBanner onInstall={triggerInstall} />}
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {state.metrics.map((m, i) => <MetricCard key={i} metric={m} />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 rounded-[2.5rem] bg-white p-12 border border-slate-200 shadow-sm">
                <h3 className="text-2xl font-black text-slate-900 mb-2">Firm Performance</h3>
                <p className="text-slate-500 mb-10">Weekly compliance tracking summary</p>
                <div className="h-64 flex items-end justify-between gap-6">
                  {[40, 70, 45, 90, 65, 85, 30, 95, 50, 75].map((h, i) => (
                    <div key={i} className="flex-1 bg-indigo-50 rounded-2xl group relative hover:bg-indigo-100 cursor-pointer transition-colors">
                      <div className="absolute inset-x-0 bottom-0 bg-indigo-600 rounded-2xl transition-all duration-700" style={{ height: `${h}%` }} />
                    </div>
                  ))}
                </div>
              </div>
              <ChatPanel messages={state.messages} onSend={handleSendMessage} currentUser={user} />
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
      case 'admin-invoice-setting': return <InvoiceSetting onBack={() => handleViewChange('admin-invoices')} />;
      case 'admin-payments': return <PaymentReceived onViewChange={handleViewChange} />;
      case 'admin-duedates': return <DueDateSetting />;
      case 'settings': return <Setting />;
      case 'trash': return <Trash />;
      default: return <div className="p-20 text-center"><h2 className="text-2xl font-black">Module Not Ready</h2></div>;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <Sidebar 
        activeView={activeView} 
        onViewChange={handleViewChange} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      <main className="flex flex-1 flex-col overflow-hidden relative">
        <Header 
          isConnected={state.isConnected} 
          currentUser={user} 
          onMenuClick={() => setIsSidebarOpen(true)} 
          activeViewLabel={activeViewConfig.label}
          activeViewDescription={activeViewConfig.description}
        />
        <div className="flex-1 flex flex-col min-h-0 px-6 lg:px-12 pt-3 pb-6 lg:pb-12">
          <Suspense fallback={<Loader />}>{renderView()}</Suspense>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
