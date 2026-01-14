
import React, { useState, useEffect, useCallback, Suspense, lazy, useMemo } from 'react';
import { MetricData, ActiveView, LitigationRecord, Client, InvoiceRecord } from '../../types.ts';
import { useAuth } from '../../auth/AuthContext.tsx';
import { useOffline } from '../../hooks/useOffline.ts';
import { usePWA } from '../../hooks/usePWA.ts';
import { api } from '../../services/api.ts';
import { socketService } from '../../services/socket.ts';

import Sidebar from '../../components/Sidebar.tsx';
import Header from '../../components/Header.tsx';
import Loader from '../../components/Loader.tsx';
import InstallBanner from '../../components/InstallBanner.tsx';
import CommandPalette from '../../components/CommandPalette.tsx';
import GSTClientFormModal from '../Clientform/GSTClientFormModal.tsx';
import ITClientFormModal from '../Clientform/ITClientFormModal.tsx';
import { YEARS, FY_MONTHS, FY_QUARTERS, getDefaultPeriod } from '../Compliance/GSTReturn/filinglogic/MonthlyFilingLogic';

// Lazy components
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

// Modals as Windows
const GSTviewicon = lazy(() => import('./GSTviewicon.tsx'));
const ITviewicon = lazy(() => import('./ITviewicon.tsx'));

const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const isOnline = useOffline();
  const { installPrompt, triggerInstall } = usePWA();
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [viewExtra, setViewExtra] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Data State
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [litigation, setLitigation] = useState<LitigationRecord[]>([]);

  // Window states (Sub-Modals)
  const [isGstWindowOpen, setIsGstWindowOpen] = useState(false);
  const [isItWindowOpen, setIsItWindowOpen] = useState(false);
  const [selectedClientForWindow, setSelectedClientForWindow] = useState<Client | null>(null);

  const def = getDefaultPeriod();
  const [monthlyFilter] = useState({ year: def.year, month: def.month });

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const summary = await api.getDashboardSummary();
      setClients(summary.clients);
      setInvoices(summary.invoices);
      setLitigation(summary.litigation);
    } catch (err) { console.error('Dashboard Sync Failed:', err); } finally { setIsInitialLoad(false); }
  }, [token]);

  useEffect(() => {
    if (isOnline) { loadData(); socketService.connect(); }
    return () => socketService.disconnect();
  }, [isOnline, loadData]);

  const handleViewChange = (view: ActiveView, extra?: any) => {
    if (view === 'gst-view-detail') {
      setSelectedClientForWindow(extra);
      setIsGstWindowOpen(true);
      return;
    }
    if (view === 'it-view-detail') {
      setSelectedClientForWindow(extra);
      setIsItWindowOpen(true);
      return;
    }
    setActiveView(view);
    setViewExtra(extra || null);
    window.scrollTo(0, 0);
  };

  const getFilingCounts = (type: string, periodKey: string) => {
    const keys: Record<string, string> = {
      monthly: 'clientify_monthly_filing_v3',
      quarterly: 'clientify_quarterly_filing_v3',
      composition: 'clientify_composition_filing_v3',
    };
    const storageKey = keys[type];
    const saved = localStorage.getItem(storageKey || '');
    const data = saved ? JSON.parse(saved) : {};
    const periodData = data[periodKey] || {};
    
    const applicable = clients.filter(c => {
      if (type === 'monthly') return c.gstProfile?.regType === 'Regular' && c.gstProfile?.filingFreq === 'Monthly';
      if (type === 'quarterly') return c.gstProfile?.regType === 'Regular' && c.gstProfile?.filingFreq === 'Quarterly';
      if (type === 'composition') return c.gstProfile?.regType === 'Composition';
      return false;
    });
    const filed = applicable.filter(c => type === 'composition' ? periodData[c.id]?.cmp08 : (periodData[c.id]?.r1 && periodData[c.id]?.r3b)).length;
    return { total: applicable.length, filed };
  };

  const getLitCounts = (forum: string, stage: string) => litigation.filter(r => r.category === forum && r.status === stage).length;

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <div className="max-w-full mx-auto space-y-12 animate-in fade-in duration-700 pb-32">
            {installPrompt && <InstallBanner onInstall={triggerInstall} />}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div onClick={() => handleViewChange('gst-portfolio')} className="group bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm hover:border-indigo-400 hover:shadow-2xl transition-all cursor-pointer overflow-hidden relative">
                 <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-600/5 -mr-10 -mt-10 rounded-full blur-3xl group-hover:bg-indigo-600/10" />
                 <div className="flex items-start justify-between relative z-10">
                    <div>
                      <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg mb-6 group-hover:scale-110 transition-transform"><svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" /></svg></div>
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">GST Portfolio</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Active Entities</p>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-black text-slate-900">{clients.filter(c => !!c.gstProfile).length}</p>
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mt-1">Total Vault</p>
                    </div>
                 </div>
              </div>
              <div onClick={() => handleViewChange('it-portfolio')} className="group bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm hover:border-emerald-400 hover:shadow-2xl transition-all cursor-pointer overflow-hidden relative">
                 <div className="absolute top-0 right-0 h-40 w-40 bg-emerald-600/5 -mr-10 -mt-10 rounded-full blur-3xl group-hover:bg-emerald-600/10" />
                 <div className="flex items-start justify-between relative z-10">
                    <div>
                      <div className="h-14 w-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg mb-6 group-hover:scale-110 transition-transform"><svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857" /></svg></div>
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">IT Portfolio</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Direct Tax Profile</p>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-black text-slate-900">{clients.filter(c => !!c.itProfile).length}</p>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mt-1">Total Vault</p>
                    </div>
                 </div>
              </div>
            </div>
            {/* Quick Summary Section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Monthly Filing</p>
                <div className="flex items-baseline gap-2"><h4 className="text-3xl font-black text-slate-900">{getFilingCounts('monthly', `${monthlyFilter.year}_${monthlyFilter.month}`).filed}</h4><span className="text-xs font-bold text-slate-400">/ {getFilingCounts('monthly', `${monthlyFilter.year}_${monthlyFilter.month}`).total}</span></div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Pending Notices</p>
                <div className="flex items-baseline gap-2"><h4 className="text-3xl font-black text-rose-600">{getLitCounts('Notice', 'Pending')}</h4><span className="text-xs font-bold text-slate-400">Cases</span></div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Outstanding Bills</p>
                <div className="flex items-baseline gap-2"><h4 className="text-3xl font-black text-amber-600">{invoices.filter(i=>i.status!=='Paid').length}</h4><span className="text-xs font-bold text-slate-400">Draft/Sent</span></div>
              </div>
            </section>
          </div>
        );
      case 'gst-portfolio': return <GSTPortfolio onViewChange={handleViewChange} />;
      case 'it-portfolio': return <ITPortfolio />;
      case 'compliance-monthly': return <MonthlyFiling onViewChange={handleViewChange} />;
      case 'compliance-quarterly': return <QuarterlyFiling />;
      case 'compliance-composition': return <CompositionFiling />;
      case 'compliance-gstr4': return <GSTR4 />;
      case 'compliance-gstr9': return <GSTR9_9C />;
      case 'compliance-itr': return <ITRReturn />;
      case 'compliance-taxaudit': return <TAXAudit />;
      case 'admin-invoices': return <Invoices onViewChange={handleViewChange} />;
      case 'admin-add-invoice': return <AddInvoice onBack={() => handleViewChange('admin-invoices')} editingInvoice={viewExtra} />;
      case 'admin-payments': return <PaymentReceived onViewChange={handleViewChange} />;
      case 'admin-duedates': return <DueDateSetting />;
      case 'settings': return <Setting />;
      case 'trash': return <Trash />;
      case 'messenger': return <Messenger />;
      case 'reminders': return <Reminders />;
      case 'misc-gst-reg': return <GSTRegistration />;
      case 'misc-food-lic': return <FoodLicenses />;
      case 'misc-msme': return <MSMERegistration />;
      case 'misc-work': return <Miscellaneouswork />;
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
      default: return <div className="p-20 text-center text-slate-300 font-black uppercase tracking-widest text-sm">Vault Error: Module Not Found</div>;
    }
  };

  const headerInfo = useMemo(() => {
    const mappings: Record<string, { label: string; desc: string }> = {
      'dashboard': { label: 'Console', desc: 'Firm Intelligence Overview' },
      'gst-portfolio': { label: 'GST Vault', desc: 'Entity Master Repository' },
      'it-portfolio': { label: 'IT Vault', desc: 'Direct Tax Master List' },
      'compliance-monthly': { label: 'Filing Matrix', desc: 'Return Lifecycle Tracking' }
    };
    return mappings[activeView] || { label: 'Practice Hub', desc: 'Authorized Compliance Access' };
  }, [activeView]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#fcfdfe] relative">
      <Sidebar activeView={activeView} onViewChange={handleViewChange} isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      {/* Backdrop for Mobile Sidebar */}
      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 z-[90] bg-slate-900/40 backdrop-blur-md lg:hidden" />
      )}

      {/* Dynamic Content Wrapper with transitions for desktop sidebar state */}
      <main className="flex flex-1 flex-col overflow-hidden relative transition-all duration-500">
        <Header isConnected={isOnline} currentUser={user} onMenuClick={() => setIsSidebarOpen(true)} activeViewLabel={headerInfo.label} activeViewDescription={headerInfo.desc} onViewChange={handleViewChange} />
        
        {/* Main Content Scroll Area - Adjusting based on Sidebar - Logic for padding handled by CSS variable or fixed class if sidebar is absolute */}
        <div className="flex-1 flex flex-col min-h-0 px-4 md:px-10 lg:pl-[280px] pt-8 pb-12 overflow-y-auto no-scrollbar scroll-smooth transition-all duration-500" style={{ paddingLeft: isSidebarOpen || window.innerWidth >= 1024 ? '' : '1rem' }}>
          {/* Note: In standard desktop mode Sidebar is 72px (collapsed) or 280px (expanded) */}
          <div className={`transition-all duration-500 ${isSidebarOpen ? 'lg:pl-0' : 'lg:pl-[-200px]'}`}>
             {isInitialLoad ? <Loader /> : <Suspense fallback={<Loader />}>{renderContent()}</Suspense>}
          </div>
        </div>
      </main>

      {/* Global Command Palette */}
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} onViewChange={handleViewChange} />
      
      {/* WINDOW MODALS (Transformed View Components) */}
      {isGstWindowOpen && selectedClientForWindow && (
         <Suspense fallback={<Loader />}>
            <GSTviewicon 
               client={selectedClientForWindow} 
               onBack={() => setIsGstWindowOpen(false)} 
               onDataChange={() => { loadData(); setIsGstWindowOpen(false); }}
            />
         </Suspense>
      )}
      {isItWindowOpen && selectedClientForWindow && (
         <Suspense fallback={<Loader />}>
            <ITviewicon 
               client={selectedClientForWindow} 
               onBack={() => setIsItWindowOpen(false)} 
               onDataChange={() => { loadData(); setIsItWindowOpen(false); }}
            />
         </Suspense>
      )}
      
      <GSTClientFormModal isOpen={false} onClose={() => {}} onSave={() => {}} /> {/* Handled inside View components now */}
    </div>
  );
};

export default Dashboard;
