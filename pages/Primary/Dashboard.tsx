
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

const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const isOnline = useOffline();
  const { installPrompt, triggerInstall } = usePWA();
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [viewExtra, setViewExtra] = useState<any>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Data State
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [litigation, setLitigation] = useState<LitigationRecord[]>([]);
  const [miscWork, setMiscWork] = useState<any[]>([]);

  // Form Modals
  const [isGstModalOpen, setIsGstModalOpen] = useState(false);
  const [isItModalOpen, setIsItModalOpen] = useState(false);

  // Period Filters for Dashboard Boxes
  const def = getDefaultPeriod();
  const [monthlyFilter, setMonthlyFilter] = useState({ year: def.year, month: def.month });
  const [quarterlyFilter, setQuarterlyFilter] = useState({ year: def.year, quarter: def.quarter });
  const [compositionFilter, setCompositionFilter] = useState({ year: def.quarterYear, quarter: def.quarter });
  const [annualFilter, setAnnualFilter] = useState({ year: def.year });
  const [itrFilter, setItrFilter] = useState({ ay: def.year });

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const summary = await api.getDashboardSummary();
      setClients(summary.clients);
      setInvoices(summary.invoices);
      setLitigation(summary.litigation);
      setMiscWork(summary.work);
    } catch (err) { console.error('Dashboard Sync Failed:', err); } finally { setIsInitialLoad(false); }
  }, [token]);

  useEffect(() => {
    if (isOnline) { loadData(); socketService.connect(); }
    return () => socketService.disconnect();
  }, [isOnline, loadData]);

  const handleViewChange = (view: ActiveView, extra?: any) => {
    setActiveView(view);
    setViewExtra(extra || null);
    window.scrollTo(0, 0);
  };

  const getFilingCounts = (type: 'monthly' | 'quarterly' | 'composition' | 'gstr4' | 'gstr9' | 'itr' | 'audit', periodKey: string) => {
    const keys: Record<string, string> = {
      monthly: 'clientify_monthly_filing_v3',
      quarterly: 'clientify_quarterly_filing_v3',
      composition: 'clientify_composition_filing_v3',
      gstr4: 'clientify_gstr4_filing_v1',
      gstr9: 'clientify_gstr9_filing_data_v2',
      itr: 'clientify_itr_filing_data_v2',
      audit: 'clientify_audit_fin_data_v3'
    };
    const storageKey = keys[type];
    const saved = localStorage.getItem(storageKey);
    const data = saved ? JSON.parse(saved) : {};
    const periodData = data[periodKey] || {};
    
    let total = 0;
    let filed = 0;
    
    if (type === 'monthly') {
      const applicable = clients.filter(c => c.gstProfile?.regType === 'Regular' && c.gstProfile?.filingFreq === 'Monthly');
      total = applicable.length;
      filed = applicable.filter(c => periodData[c.id]?.r1 && periodData[c.id]?.r3b).length;
    } else if (type === 'quarterly') {
      const applicable = clients.filter(c => c.gstProfile?.regType === 'Regular' && c.gstProfile?.filingFreq === 'Quarterly');
      total = applicable.length;
      filed = applicable.filter(c => periodData[c.id]?.r1 && periodData[c.id]?.r3b).length;
    } else if (type === 'composition') {
      const applicable = clients.filter(c => c.gstProfile?.regType === 'Composition');
      total = applicable.length;
      filed = applicable.filter(c => periodData[c.id]?.cmp08).length;
    } else if (type === 'itr') {
      const applicable = clients.filter(c => !!c.itProfile);
      total = applicable.length;
      filed = applicable.filter(c => periodData[c.id]?.filed).length;
    } else {
      filed = Object.values(periodData).filter((v: any) => v.filed || v.auditFiled).length;
      total = Object.keys(periodData).length || clients.filter(c => type === 'gstr4' ? c.gstProfile?.regType === 'Composition' : !!c.gstProfile).length;
    }

    return { total, filed, pending: Math.max(0, total - filed) };
  };

  const getDueDate = (moduleId: string, period: string, year: string) => {
    const saved = localStorage.getItem('clientify_global_compliance_dates_v1');
    if (!saved) return '---';
    const dates = JSON.parse(saved);
    const key = `${moduleId}_${year}_${period}`;
    const val = dates[key];
    if (!val) return '---';
    return val.split('-').reverse().join('/');
  };

  const DashboardCard = ({ title, countObj, viewId, icon, color, filters, dueDate, action }: any) => (
    <div 
      onClick={() => handleViewChange(viewId)}
      className="group relative flex flex-col bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
           <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">{icon}</svg>
        </div>
        {countObj && (
           <div className="text-right">
              <p className="text-xl font-black text-slate-900 leading-none">{countObj.total}</p>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Records</p>
           </div>
        )}
      </div>
      <div className="mb-4">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors truncate">{title}</h3>
        {dueDate && <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-1 bg-rose-50 inline-block px-1.5 py-0.5 rounded">Due: {dueDate}</p>}
      </div>
      {filters && <div className="mb-4 flex flex-wrap gap-1" onClick={e => e.stopPropagation()}>{filters}</div>}
      {countObj && countObj.filed !== undefined && (
        <div className="flex items-center gap-2 mb-4">
           <div className="flex-1 bg-emerald-50/50 rounded-xl p-2 border border-emerald-100">
              <p className="text-emerald-700 text-xs font-black">{countObj.filed}</p>
              <p className="text-[7px] font-black text-emerald-600 uppercase tracking-widest">Filed</p>
           </div>
           <div className="flex-1 bg-amber-50/50 rounded-xl p-2 border border-amber-100">
              <p className="text-amber-700 text-xs font-black">{countObj.pending}</p>
              <p className="text-[7px] font-black text-amber-600 uppercase tracking-widest">Pending</p>
           </div>
        </div>
      )}
      <div className="mt-auto">
         {action ? (
            <button onClick={action.onClick} className={`w-full py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest text-white shadow-xl transition-all active:scale-95 ${action.color} hover:brightness-110`}>{action.label}</button>
         ) : (
            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] group-hover:translate-x-1 transition-transform inline-block">Access →</span>
         )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <div className="max-w-full mx-auto space-y-10 animate-in fade-in duration-700 pb-32">
            {installPrompt && <InstallBanner onInstall={triggerInstall} />}
            
            <section>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-6 flex items-center gap-4">Security Hub <div className="h-px flex-1 bg-slate-100" /></h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <DashboardCard title="GST Portfolio" countObj={{ total: clients.filter(c => !!c.gstProfile).length }} viewId="gst-portfolio" color="bg-indigo-600" icon={<path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2-2h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011-1v5m-4 0h4" />} action={{ label: "Add GST Client", color: "bg-indigo-600", onClick: (e: any) => { e.stopPropagation(); setIsGstModalOpen(true); } }} />
                <DashboardCard title="IT Portfolio" countObj={{ total: clients.filter(c => !!c.itProfile).length }} viewId="it-portfolio" color="bg-emerald-600" icon={<path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />} action={{ label: "Add IT Client", color: "bg-emerald-600", onClick: (e: any) => { e.stopPropagation(); setIsItModalOpen(true); } }} />
              </div>
            </section>

            <section>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-6 flex items-center gap-4">Returns Compliance <div className="h-px flex-1 bg-slate-100" /></h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                <DashboardCard title="Monthly" viewId="compliance-monthly" color="bg-indigo-500" icon={<path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />} dueDate={getDueDate('monthly_r1', monthlyFilter.month, monthlyFilter.year)} filters={<><select value={monthlyFilter.year} onChange={e => setMonthlyFilter({...monthlyFilter, year: e.target.value})} className="bg-slate-100 px-1 py-0.5 rounded text-[8px] font-black">{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select><select value={monthlyFilter.month} onChange={e => setMonthlyFilter({...monthlyFilter, month: e.target.value})} className="bg-slate-100 px-1 py-0.5 rounded text-[8px] font-black">{FY_MONTHS.map(m => <option key={m} value={m}>{m}</option>)}</select></>} countObj={getFilingCounts('monthly', `${monthlyFilter.year}_${monthlyFilter.month}`)} />
                <DashboardCard title="Quarterly" viewId="compliance-quarterly" color="bg-blue-500" icon={<path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />} dueDate={getDueDate('quarterly_iff', quarterlyFilter.quarter, quarterlyFilter.year)} filters={<><select value={quarterlyFilter.year} onChange={e => setQuarterlyFilter({...quarterlyFilter, year: e.target.value})} className="bg-slate-100 px-1 py-0.5 rounded text-[8px] font-black">{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select><select value={quarterlyFilter.quarter} onChange={e => setQuarterlyFilter({...quarterlyFilter, quarter: e.target.value})} className="bg-slate-100 px-1 py-0.5 rounded text-[8px] font-black">{FY_QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}</select></>} countObj={getFilingCounts('quarterly', `${quarterlyFilter.year}_${quarterlyFilter.quarter}`)} />
                <DashboardCard title="Composition" viewId="compliance-composition" color="bg-amber-500" icon={<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />} dueDate={getDueDate('composition_cmp08', compositionFilter.quarter, compositionFilter.year)} filters={<><select value={compositionFilter.year} onChange={e => setCompositionFilter({...compositionFilter, year: e.target.value})} className="bg-slate-100 px-1 py-0.5 rounded text-[8px] font-black">{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select><select value={compositionFilter.quarter} onChange={e => setCompositionFilter({...compositionFilter, quarter: e.target.value})} className="bg-slate-100 px-1 py-0.5 rounded text-[8px] font-black">{FY_QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}</select></>} countObj={getFilingCounts('composition', `${compositionFilter.year}_${compositionFilter.quarter}`)} />
                <DashboardCard title="ITR Return" viewId="compliance-itr" color="bg-emerald-500" icon={<path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2" />} dueDate={getDueDate('itr_return', 'Annual', itrFilter.ay)} filters={<><span className="text-[8px] font-black text-slate-400 mt-1">AY:</span><select value={itrFilter.ay} onChange={e => setItrFilter({...itrFilter, ay: e.target.value})} className="bg-slate-100 px-1 py-0.5 rounded text-[8px] font-black">{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select></>} countObj={getFilingCounts('itr', itrFilter.ay)} />
                <DashboardCard title="Audit Prep" viewId="compliance-taxaudit" color="bg-slate-800" icon={<path d="M9 12h6" />} dueDate={getDueDate('audit_tax', 'Annual', annualFilter.year)} filters={<select value={annualFilter.year} onChange={e => setAnnualFilter({...annualFilter, year: e.target.value})} className="bg-slate-100 px-1 py-0.5 rounded text-[8px] font-black">{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>} countObj={getFilingCounts('audit', annualFilter.year)} />
              </div>
            </section>

            <section>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-6 flex items-center gap-4">Operations <div className="h-px flex-1 bg-slate-100" /></h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <DashboardCard title="Invoices" viewId="admin-invoices" color="bg-violet-600" icon={<path d="M12 8" />} countObj={{ total: invoices.length }} action={{ label: "Create Invoice", color: "bg-slate-900", onClick: (e: any) => { e.stopPropagation(); handleViewChange('admin-add-invoice'); } }} />
                <DashboardCard title="Notices" viewId="lit-notice-pending" color="bg-rose-600" icon={<path d="M12 9" />} countObj={{ total: litigation.filter(l => l.category === 'Notice' && l.status === 'Pending').length }} />
                <DashboardCard title="Appeals" viewId="lit-appeal-pending" color="bg-orange-600" icon={<path d="M12 9" />} countObj={{ total: litigation.filter(l => l.category === 'Appeal' && l.status === 'Pending').length }} />
              </div>
            </section>
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
      default: return <div className="p-20 text-center text-slate-300 font-black uppercase tracking-widest text-sm">Targeting Secure Module...</div>;
    }
  };

  const activeLabel = useMemo(() => {
    if (activeView === 'dashboard') return 'Executive Control';
    // Simplified label lookup
    const views: Record<string, string> = {
      'gst-portfolio': 'GST Portfolio',
      'it-portfolio': 'IT Portfolio',
      'compliance-monthly': 'Monthly Filing',
      'admin-invoices': 'Invoices'
    };
    return views[activeView] || 'Module Access';
  }, [activeView]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#fcfdfe] relative">
      <Sidebar 
        activeView={activeView} 
        onViewChange={handleViewChange} 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      <main className={`flex flex-1 flex-col overflow-hidden relative transition-all duration-500 ${isSidebarCollapsed ? 'ml-20' : 'ml-80'}`}>
        <Header 
          isConnected={isOnline} 
          currentUser={user} 
          onMenuClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          activeViewLabel={activeLabel} 
          activeViewDescription="Practice Intelligence Operating System" 
        />
        <div className="flex-1 flex flex-col min-h-0 px-4 md:px-10 lg:px-16 pt-8 pb-12 overflow-y-auto no-scrollbar scroll-smooth">
          {isInitialLoad && activeView === 'dashboard' ? <Loader /> : (
            <Suspense fallback={<Loader />}>{renderContent()}</Suspense>
          )}
        </div>
      </main>
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} onViewChange={handleViewChange} />
      
      <GSTClientFormModal isOpen={isGstModalOpen} onClose={() => setIsGstModalOpen(false)} onSave={() => loadData()} />
      <ITClientFormModal isOpen={isItModalOpen} onClose={() => setIsItModalOpen(false)} onSave={() => loadData()} />
    </div>
  );
};

export default Dashboard;
