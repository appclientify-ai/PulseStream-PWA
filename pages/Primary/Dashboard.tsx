
import React, { useState, useEffect, useCallback, Suspense, lazy, useMemo } from 'react';
import { socketService } from '../../services/socket';
import { AppState, Message, MetricData, ActiveView, Client } from '../../types';
import { useAuth } from '../../auth/AuthContext';
import { useOffline } from '../../hooks/useOffline';
import { usePWA } from '../../hooks/usePWA';
import { mockBackend } from '../../services/mockBackend';

import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import MetricCard from '../../components/MetricCard';
import ChatPanel from '../../components/ChatPanel';
import Loader from '../../components/Loader';
import InstallBanner from '../../components/InstallBanner';
import ErrorBoundary from '../../components/ErrorBoundary';
import { YEARS, MONTHS, QUARTERS, getDefaultPeriod } from '../Compliance/GSTReturn/filinglogic/MonthlyFilingLogic';

// LAZY IMPORTS
const GSTPortfolio = lazy(() => import('../ClientHub/GSTPortfolio'));
const ITPortfolio = lazy(() => import('../ClientHub/ITPortfolio'));
const MonthlyFiling = lazy(() => import('../Compliance/GSTReturn/MonthlyFiling'));
const QuarterlyFiling = lazy(() => import('../Compliance/GSTReturn/QuarterlyFiling'));
const CompositionFiling = lazy(() => import('../Compliance/GSTReturn/CompositionFiling'));
const GSTR4 = lazy(() => import('../Compliance/AnnualReturns/GSTR4'));
const GSTR9_9C = lazy(() => import('../Compliance/AnnualReturns/GSTR9_9C'));
const ITRReturn = lazy(() => import('../Compliance/ITAudit/ITRReturn'));
const TAXAudit = lazy(() => import('../Compliance/ITAudit/TAXAudit'));
const NoticePending = lazy(() => import('../LitigationSuite/GSTNotices/NoticePending'));
const NoticeFiled = lazy(() => import('../LitigationSuite/GSTNotices/NoticeFiled'));
const NoticeDrop = lazy(() => import('../LitigationSuite/GSTNotices/NoticeDrop'));
const NoticeDemand = lazy(() => import('../LitigationSuite/GSTNotices/NoticeDemand'));
const AppealPending = lazy(() => import('../LitigationSuite/GSTAppeals/AppealPending'));
const AppealFiled = lazy(() => import('../LitigationSuite/GSTAppeals/AppealFiled'));
const AppealDrop = lazy(() => import('../LitigationSuite/GSTAppeals/AppealDrop'));
const AppealDemand = lazy(() => import('../LitigationSuite/GSTAppeals/AppealDemand'));
const TribunalPending = lazy(() => import('../LitigationSuite/Tribunal/TribunalPending'));
const TribunalFiled = lazy(() => import('../LitigationSuite/Tribunal/TribunalFiled'));
const TribunalDrop = lazy(() => import('../LitigationSuite/Tribunal/TribunalDrop'));
const TribunalDemand = lazy(() => import('../LitigationSuite/Tribunal/TribunalDemand'));
const CourtPending = lazy(() => import('../LitigationSuite/HighCourt/CourtPending'));
const CourtFiled = lazy(() => import('../LitigationSuite/HighCourt/CourtFiled'));
const CourtDrop = lazy(() => import('../LitigationSuite/HighCourt/CourtDrop'));
const CourtDemand = lazy(() => import('../LitigationSuite/HighCourt/CourtDemand'));
const GSTRegistration = lazy(() => import('../Miscellaneous/GSTRegistration'));
const FoodLicenses = lazy(() => import('../Miscellaneous/FoodLicenses'));
const MSMERegistration = lazy(() => import('../Miscellaneous/MSMERegistration'));
const Miscellaneouswork = lazy(() => import('../Miscellaneous/Miscellaneouswork'));
const Reminders = lazy(() => import('../Administration/Reminders'));
const Messenger = lazy(() => import('../Administration/Messenger'));
const Invoices = lazy(() => import('../Administration/invoice/Invoices'));
const AddInvoice = lazy(() => import('../Administration/invoice/addinvoice'));
const InvoiceSetting = lazy(() => import('../Administration/invoice/invoicesetting'));
const PaymentReceived = lazy(() => import('../Administration/invoice/PaymentReceived'));
const DueDateSetting = lazy(() => import('../Administration/DueDateSetting'));
const Setting = lazy(() => import('../Administration/Setting'));
const Trash = lazy(() => import('../Administration/Trash'));

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

  // Period Filters for Stats
  const defaults = getDefaultPeriod();
  const [statYear, setStatYear] = useState(defaults.year);
  const [statMonth, setStatMonth] = useState(defaults.month);
  const [statQuarter, setStatQuarter] = useState(defaults.quarter);

  const [state, setState] = useState<AppState>({
    messages: [],
    metrics: [],
    users: [],
    isConnected: false,
    currentUser: user,
  });

  const [clients, setClients] = useState<Client[]>([]);

  const activeViewConfig = useMemo(() => VIEW_CONFIG[activeView] || { label: 'Clientify Suite', description: 'Professional Consultant Solution' }, [activeView]);

  const handleViewChange = (view: ActiveView, extra?: any) => {
    setActiveView(view);
    setViewExtra(extra || null);
  };

  const fetchBaseData = useCallback(async () => {
    const data = await mockBackend.getClients();
    setClients(data || []);
  }, []);

  useEffect(() => {
    fetchBaseData();
  }, [fetchBaseData]);

  // Real-time calculation logic for Dashboard Metrics - CRASH PROTECTED
  const dynamicMetrics = useMemo((): MetricData[] => {
    try {
      const periodMonthKey = `${statYear}_${statMonth}`;
      const periodQuarterKey = `${statYear}_${statQuarter}`;

      // Helper for safe JSON access
      const safeParse = (key: string) => {
        try {
          return JSON.parse(localStorage.getItem(key) || '{}');
        } catch { return {}; }
      };

      const monthlyData = safeParse('clientify_monthly_filing_v3');
      const quarterlyData = safeParse('clientify_quarterly_filing_v3');
      const itData = safeParse('clientify_itr_filing_data_v2');
      const litigation = Array.isArray(JSON.parse(localStorage.getItem('clientify_mock_litigation') || '[]')) 
        ? JSON.parse(localStorage.getItem('clientify_mock_litigation') || '[]')
        : [];

      // 1. GST Monthly (R1 + 3B)
      const currentMonthly = monthlyData[periodMonthKey] || {};
      const monthlyFiledCount = Object.values(currentMonthly).filter((v: any) => v && v.r1 && v.r3b).length;

      // 2. GST Quarterly (R1 + 3B)
      const currentQuarterly = quarterlyData[periodQuarterKey] || {};
      const quarterlyFiledCount = Object.values(currentQuarterly).filter((v: any) => v && v.r1 && v.r3b).length;

      // 3. ITR (For AY)
      const currentITR = itData[statYear] || {}; 
      const itrFiledCount = Object.values(currentITR).filter((v: any) => v && v.filed).length;

      // 4. Pending Notices
      const pendingNotices = litigation.filter((r: any) => r && r.category === 'Notice' && r.status === 'Pending').length;

      return [
        { label: 'Monthly Filed', value: monthlyFiledCount, trend: 'stable' },
        { label: 'Quarterly Filed', value: quarterlyFiledCount, trend: 'stable' },
        { label: 'ITR Count', value: itrFiledCount, trend: 'up' },
        { label: 'Open Notices', value: pendingNotices, trend: 'down' },
      ];
    } catch (err) {
      console.error("Metric calculation failed", err);
      return [
        { label: 'Sync Error', value: 0, trend: 'stable' },
        { label: 'Check Vault', value: 0, trend: 'stable' },
        { label: 'Check Vault', value: 0, trend: 'stable' },
        { label: 'Check Vault', value: 0, trend: 'stable' },
      ];
    }
  }, [clients, statYear, statMonth, statQuarter]);

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
          <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 overflow-y-auto h-full pr-1 no-scrollbar pb-20">
            {installPrompt && <InstallBanner onInstall={triggerInstall} />}
            
            {/* Real-time Period Controllers */}
            <div className="flex flex-wrap items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm shrink-0">
               <div className="flex items-center gap-3 pr-6 border-r border-slate-100">
                  <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">Live Monitor</h3>
                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-1">Cross-Module Status</p>
                  </div>
               </div>
               
               <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center bg-slate-50 rounded-xl px-4 py-2 gap-2 border border-slate-100">
                     <span className="text-[10px] font-black text-slate-400 uppercase">FY/AY:</span>
                     <select value={statYear} onChange={e => setStatYear(e.target.value)} 
                       className="bg-transparent border-none text-xs font-black uppercase text-slate-700 outline-none cursor-pointer">
                       {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                     </select>
                  </div>
                  <div className="flex items-center bg-slate-50 rounded-xl px-4 py-2 gap-2 border border-slate-100">
                     <span className="text-[10px] font-black text-slate-400 uppercase">Month:</span>
                     <select value={statMonth} onChange={e => setStatMonth(e.target.value)} 
                       className="bg-transparent border-none text-xs font-black uppercase text-slate-700 outline-none cursor-pointer">
                       {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                     </select>
                  </div>
                  <div className="flex items-center bg-slate-50 rounded-xl px-4 py-2 gap-2 border border-slate-100">
                     <span className="text-[10px] font-black text-slate-400 uppercase">Quarter:</span>
                     <select value={statQuarter} onChange={e => setStatQuarter(e.target.value)} 
                       className="bg-transparent border-none text-xs font-black uppercase text-slate-700 outline-none cursor-pointer">
                       {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
                     </select>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {dynamicMetrics.map((m, i) => <MetricCard key={i} metric={m} />)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 rounded-[2.5rem] bg-white p-12 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-50/50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Compliance Heatmap</h3>
                <p className="text-slate-500 mb-10 text-sm font-medium">Visualization of workflow intensity across practice staff.</p>
                <div className="h-64 flex items-end justify-between gap-4 relative z-10">
                  {[45, 75, 55, 95, 80, 88, 40, 100, 60, 82, 50, 70].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-3">
                      <div className="w-full bg-slate-50 rounded-xl group relative hover:bg-slate-100 cursor-pointer transition-all duration-300 h-full flex flex-col justify-end">
                        <div className={`w-full rounded-xl transition-all duration-1000 ${h > 80 ? 'bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'bg-indigo-300'}`} 
                          style={{ height: `${h}%` }}>
                           <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded shadow-xl transition-opacity pointer-events-none uppercase">
                             {h}% DONE
                           </div>
                        </div>
                      </div>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{MONTHS[i].substring(0,3)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <ChatPanel messages={state.messages} onSend={handleSendMessage} currentUser={user} />
            </div>

            {/* Quick Status Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 shadow-sm">
                   <h4 className="text-emerald-800 font-black uppercase text-xs tracking-widest mb-6">Staff Performance</h4>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-bold text-emerald-600 uppercase">Avg. Return Speed</span>
                         <span className="text-sm font-black text-emerald-900">2.1 Days</span>
                      </div>
                      <div className="h-1 w-full bg-emerald-200 rounded-full"><div className="h-full w-3/4 bg-emerald-600 rounded-full" /></div>
                   </div>
                </div>
                <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 shadow-sm">
                   <h4 className="text-indigo-800 font-black uppercase text-xs tracking-widest mb-6">Practice Health</h4>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-bold text-indigo-600 uppercase">Critical Deadlines</span>
                         <span className="text-sm font-black text-indigo-900">04 Found</span>
                      </div>
                      <div className="h-1 w-full bg-indigo-200 rounded-full"><div className="h-full w-1/4 bg-indigo-600 rounded-full" /></div>
                   </div>
                </div>
                <div className="p-8 bg-slate-900 rounded-[2.5rem] shadow-xl text-white">
                   <h4 className="text-slate-400 font-black uppercase text-xs tracking-widest mb-6">Vault Utilization</h4>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-bold text-slate-300 uppercase">Storage Used</span>
                         <span className="text-sm font-black text-white">12% / 100GB</span>
                      </div>
                      <div className="h-1 w-full bg-slate-700 rounded-full"><div className="h-full w-[12%] bg-white rounded-full" /></div>
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
        <div className="flex-1 flex flex-col min-h-0 px-6 lg:px-12 pt-3 pb-6 lg:pb-12 overflow-hidden">
          <ErrorBoundary>
            <Suspense fallback={<Loader />}>{renderView()}</Suspense>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
