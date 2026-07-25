import { ErrorBoundary } from '../../components/ErrorBoundary.tsx';

import { useParams, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useCallback, Suspense, lazy, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MetricData, ActiveView, LitigationRecord, Client, InvoiceRecord } from '../../types.ts';
import { useAuth } from '../../auth/AuthContext.tsx';
import { useOffline } from '../../hooks/useOffline.ts';
import { usePWA } from '../../hooks/usePWA.ts';
import { api } from '../../services/api.ts';
import { socketService } from '../../services/socket.ts';

import Sidebar, { NavItem } from '../../components/Sidebar.tsx';
import MobileBottomNav from '../../components/MobileBottomNav.tsx';
import Header from '../../components/Header.tsx';
import Loader from '../../components/Loader.tsx';
import InstallBanner from '../../components/InstallBanner.tsx';
import CommandPalette from '../../components/CommandPalette.tsx';
import GSTClientFormModal from '../Clientform/GSTClientFormModal.tsx';
import ITClientFormModal from '../Clientform/ITClientFormModal.tsx';
import { YEARS, FY_MONTHS, FY_QUARTERS, getDefaultPeriod, isClientVisibleInPeriod, periodToDate } from '../Compliance/GSTReturn/filinglogic/MonthlyFilingLogic';
import { formatDate } from '../../dateUtils.ts';

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
const ClientLedger = lazy(() => import('../Administration/invoice/ClientLedger.tsx'));
const DueDateSetting = lazy(() => import('../Administration/DueDateSetting.tsx'));
const Setting = lazy(() => import('../Administration/Setting.tsx'));
const Trash = lazy(() => import('../Administration/Trash.tsx'));

const InvoiceSetting = lazy(() => import('../Administration/invoice/invoicesetting.tsx'));

const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const isOnline = useOffline();
  const { installPrompt, triggerInstall } = usePWA();
  const { view } = useParams<{ view: string }>();
  const navigate = useNavigate();
  const activeView = (view as ActiveView) || 'dashboard';
  const [viewExtra, setViewExtra] = useState<any>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const queryClient = useQueryClient();

  // Quick Nav Modal State
  const [navigationFolder, setNavigationFolder] = useState<NavItem | null>(null);

  // React Query for Dashboard Summary
  const {
    data: summary,
    isLoading: isSummaryLoading
  } = useQuery({
    queryKey: ['dashboard_summary'],
    queryFn: () => api.getDashboardSummary(),
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
  });

  // React Query for Filing Data Cache
  const {
    data: filingDataCache = {}
  } = useQuery<Record<string, any>>({
    queryKey: ['filing_data_cache'],
    queryFn: async () => {
      const keys = [
        'clientify_monthly_filing_v3',
        'clientify_quarterly_filing_v3',
        'clientify_composition_filing_v3',
        'clientify_gstr4_filing_v1',
        'clientify_gstr9_filing_data_v2',
        'clientify_itr_filing_data_v2',
        'clientify_audit_fin_data_v3',
        'clientify_gstr9_watchlist_v2'
      ];
      const results = await Promise.all(
        keys.map(async (k) => {
          const val = await api.getAppData(k);
          return [k, val || {}];
        })
      );
      return Object.fromEntries(results);
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });

  const clients: Client[] = useMemo(() => summary?.clients || [], [summary]);
  const invoices: InvoiceRecord[] = useMemo(() => summary?.invoices || [], [summary]);
  const litigation: LitigationRecord[] = useMemo(() => summary?.litigation || [], [summary]);
  const miscWork: any[] = useMemo(() => summary?.work || [], [summary]);
  const gstReg: any[] = useMemo(() => summary?.gstReg || [], [summary]);
  const foodLic: any[] = useMemo(() => summary?.foodLic || [], [summary]);
  const msme: any[] = useMemo(() => summary?.msme || [], [summary]);
  const payments: any[] = useMemo(() => summary?.payments || [], [summary]);

  const isInitialLoad = isSummaryLoading && !summary;

  // Form Modals
  const [isGstModalOpen, setIsGstModalOpen] = useState(false);
  const [isItModalOpen, setIsItModalOpen] = useState(false);

  // Period Filters for Dashboard Boxes
  const def = getDefaultPeriod();

  const getCurrentAY = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const startYear = currentMonth >= 3 ? currentYear : currentYear - 1;
    return `${startYear}-${(startYear + 1).toString().slice(-2)}`;
  };

  const getPrevFY = (fy: string) => {
    const parts = fy.split('-');
    if (parts.length === 2) {
      const start = parseInt(parts[0], 10);
      const end = parseInt(parts[1], 10);
      return `${start - 1}-${(end - 1).toString().padStart(2, '0')}`;
    }
    return fy;
  };

  const [monthlyFilter, setMonthlyFilter] = useState({ year: def.year, month: def.month });
  const [quarterlyFilter, setQuarterlyFilter] = useState({ year: def.quarterYear, quarter: def.quarter });
  const [compositionFilter, setCompositionFilter] = useState({ year: def.quarterYear, quarter: def.quarter });
  const [annualFilter, setAnnualFilter] = useState({ year: getPrevFY(def.year) });
  const [itrFilter, setItrFilter] = useState({ ay: getCurrentAY() });

  useEffect(() => {
    if (isOnline) { 
      socketService.connect(); 
      const syncHandler = (e: any) => { 
        console.log('Real-time sync event received:', e.detail);
        queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
        queryClient.invalidateQueries({ queryKey: ['filing_data_cache'] });
      };
      window.addEventListener('clientify_db_change', syncHandler);
      return () => {
        window.removeEventListener('clientify_db_change', syncHandler);
        socketService.disconnect();
      };
    }
  }, [isOnline, queryClient]);

  const handleViewChange = (view: ActiveView, extra?: any) => {
    navigate(`/${view}`);
    setViewExtra(extra || null);
    setNavigationFolder(null);
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
    const data = filingDataCache[storageKey] || {};
    
    let year = '';
    let month = '';
    let qrmpIsQuarterEnd = false;
    
    if (type === 'quarterly' || type === 'composition') {
      const [y, q] = periodKey.split('_');
      year = y;
      if (q && q.includes('Q1')) month = 'June';
      else if (q && q.includes('Q2')) month = 'September';
      else if (q && q.includes('Q3')) month = 'December';
      else if (q && q.includes('Q4')) month = 'March';
      else month = q || '';
      qrmpIsQuarterEnd = true;
    } else if (type === 'monthly') {
      const parts = periodKey.split('_');
      year = parts[0] || '';
      month = parts[1] || '';
    } else {
      year = periodKey; // annual
      month = 'March'; // default to end of FY
    }

    const actualPeriodKey = type === 'quarterly' ? `${year}_${month}` : periodKey;
    const periodData = data[actualPeriodKey] || {};
        
    let total = 0;
    let filed = 0;
    let r1 = 0;
    let r3b = 0;
    let cmp08 = 0;
    
    if (type === 'monthly') {
      const applicable = (clients || []).filter(c => c && c.gstProfile?.regType === 'Regular' && c.gstProfile?.filingFreq === 'Monthly' && isClientVisibleInPeriod(c, year, month));
      total = applicable.length;
      r1 = applicable.filter(c => periodData[c.id]?.r1).length;
      r3b = applicable.filter(c => periodData[c.id]?.r3b).length;
      filed = r3b;
    } else if (type === 'quarterly') {
      const checkQrmpVisibility = (c: Client) => {
        if (!c || !c.gstProfile) return false;
        const visibleInMonth = isClientVisibleInPeriod(c, year, month);
        if (qrmpIsQuarterEnd) {
          if (c.gstProfile.cancelDate && c.gstProfile.gstStatus === 'Closed') {
            const cancelDate = new Date(c.gstProfile.cancelDate);
            if (!isNaN(cancelDate.getTime())) {
              const periodDate = periodToDate(year, month);
              const lastVisibleMonthDate = new Date(cancelDate.getFullYear(), cancelDate.getMonth(), 1);
              if (periodDate > lastVisibleMonthDate) return true;
            }
          }
        }
        return visibleInMonth;
      };
      const applicable = (clients || []).filter(c => c && c.gstProfile?.regType === 'Regular' && c.gstProfile?.filingFreq === 'Quarterly' && checkQrmpVisibility(c));
      total = applicable.length;
      r1 = applicable.filter(c => periodData[c.id]?.r1).length;
      r3b = applicable.filter(c => periodData[c.id]?.r3b).length;
      filed = r3b;
    } else if (type === 'composition') {
      const applicable = (clients || []).filter(c => c && c.gstProfile?.regType === 'Composition' && isClientVisibleInPeriod(c, year, month));
      total = applicable.length;
      cmp08 = applicable.filter(c => periodData[c.id]?.cmp08).length;
      filed = cmp08;
    } else if (type === 'itr') {
      const applicable = (clients || []).filter(c => c && c.itProfile && (c.status === 'Active' || c.status === 'Active Filing'));
      total = applicable.length;
      filed = applicable.filter(c => periodData[c.id]?.filed).length;
    } else if (type === 'gstr4') {
       const applicable = (clients || []).filter(c => c && c.gstProfile?.regType === 'Composition' && (c.status === 'Active' || c.status === 'Active Filing'));
       total = applicable.length;
       filed = applicable.filter(c => periodData[c.id]?.filed).length;
    } else if (type === 'gstr9') {
       const watchlistObj = filingDataCache['clientify_gstr9_watchlist_v2'] || {};
       const currentWatchlist: string[] = watchlistObj[periodKey] || [];
       const applicable = (clients || []).filter(c => c && c.gstProfile?.regType === 'Regular' && currentWatchlist.includes(c.id) && (c.status === 'Active' || c.status === 'Active Filing'));
       total = applicable.length;
       filed = applicable.filter(c => periodData[c.id]?.gstr9).length;
    } else if (type === 'audit') {
       const applicable = (clients || []).filter(c => c && c.itProfile?.advisoryWork?.taxAudit);
       total = applicable.length;
       filed = applicable.filter(c => periodData[c.id]?.auditFiled).length;
    }

    return { total, filed, pending: Math.max(0, total - filed), r1, r3b, cmp08 };
  };

  const getLitCounts = (forum: 'Notice' | 'Appeal' | 'Tribunal' | 'HighCourt', stage: 'Pending' | 'Filed' | 'Drop' | 'Demand') => {
    return litigation.filter(r => r.category === forum && r.status === stage).length;
  };

  const SectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="mb-6 border-l-4 border-indigo-600 pl-4">
      <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 leading-none">{title}</h2>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5">{subtitle}</p>
    </div>
  );

  const SubSectionTitle = ({ title }: { title: string }) => (
    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-4 px-2">{title}</h3>
  );

  const DetailedCard = ({ label, subLabel, periodControls, stats, viewId, icon, color }: any) => (
    <div 
      onClick={() => handleViewChange(viewId)}
      className="group bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:border-indigo-400 hover:shadow-xl transition-all cursor-pointer overflow-hidden relative"
    >
      <div className={`absolute top-0 right-0 h-24 w-24 -mr-8 -mt-8 opacity-5 rounded-full ${color}`} />
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-2xl ${color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`} title={label}>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">{icon}</svg>
          </div>
          <div>
            <h4 className="text-base font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600">{label}</h4>
            {periodControls ? (
              <div className="mt-1" onClick={(e) => e.stopPropagation()}>{periodControls}</div>
            ) : (
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subLabel}</p>
            )}
          </div>
        </div>
        <div className="text-right">
           <span className="block text-3xl font-black text-slate-900 leading-none">{stats.total}</span>
           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        {stats.items.map((item: any, i: number) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-wide">{item.label}</span>
            <div className="flex items-center gap-3">
               <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                 <div className={`h-full rounded-full ${item.color || 'bg-indigo-500'}`} style={{ width: `${(item.value / (stats.total || 1)) * 100}%` }} />
               </div>
               <span className="font-black text-slate-700 w-6 text-right">{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const CompactCard = ({ label, count, viewId, icon, color }: any) => (
    <div 
      onClick={() => handleViewChange(viewId)}
      className="group bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:border-indigo-400 hover:shadow-xl transition-all cursor-pointer overflow-hidden relative"
    >
      <div className={`absolute top-0 right-0 h-12 w-12 -mr-4 -mt-4 opacity-5 rounded-full ${color}`} />
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-lg ${color} flex items-center justify-center text-white shadow-sm`} title={label}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">{icon}</svg>
          </div>
          <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight group-hover:text-indigo-600 truncate max-w-[120px]">{label}</span>
        </div>
        <span className="text-base font-black text-slate-900">{count}</span>
      </div>
    </div>
  );

  const LitigationBlock = ({ forum, label, icon }: any) => {
    const forums: Record<string, string> = { 'Notice': 'lit-notice', 'Appeal': 'lit-appeal', 'Tribunal': 'lit-tribunal', 'HighCourt': 'lit-hc' };
    const prefix = forums[forum];

    const pendingCount = getLitCounts(forum, 'Pending');
    const filedCount = getLitCounts(forum, 'Filed');
    const droppedCount = getLitCounts(forum, 'Drop');
    const demandCount = getLitCounts(forum, 'Demand');

    const sortedPending = useMemo(() => {
      const pendingList = litigation.filter(r => r.category === forum && r.status === 'Pending');
      return [...pendingList].sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }).slice(0, 5);
    }, [forum]);

    const forumSingular = forum === 'HighCourt' ? 'Matter' : forum;

    const items = [
      { id: 'pending', statusLabel: `Pending ${forumSingular}`, count: pendingCount, color: 'bg-rose-50 border-rose-100 hover:border-rose-300 text-rose-700', bulletColor: 'bg-rose-500', iconPath: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3" /> },
      { id: 'filed', statusLabel: `Filed ${forumSingular}`, count: filedCount, color: 'bg-indigo-50 border-indigo-100 hover:border-indigo-300 text-indigo-700', bulletColor: 'bg-indigo-500', iconPath: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /> },
      { id: 'drop', statusLabel: `Dropped ${forumSingular}`, count: droppedCount, color: 'bg-emerald-50 border-emerald-100 hover:border-emerald-300 text-emerald-700', bulletColor: 'bg-emerald-500', iconPath: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4" /> },
      { id: 'demand', statusLabel: `Demand ${forumSingular}`, count: demandCount, color: 'bg-amber-50 border-amber-100 hover:border-amber-300 text-amber-700', bulletColor: 'bg-amber-500', iconPath: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01" /> }
    ];

    const isOverdue = (dateStr: string) => {
      if (!dateStr) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const d = new Date(dateStr);
      return d < today;
    };

    const isNearDue = (dateStr: string) => {
      if (!dateStr) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const d = new Date(dateStr);
      const diffTime = d.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 5;
    };

    return (
      <div className="space-y-4">
        {/* Header Title */}
        <div className="flex items-center gap-3 px-2">
           <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">{icon}</svg>
           <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{label}</h4>
        </div>

        {/* Combined Main Card */}
        <div className="bg-white border border-slate-200/80 rounded-[2rem] p-6 lg:p-8 shadow-sm hover:shadow-md transition-all">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Side: Vertical list of status routes */}
            <div className="space-y-3.5 pr-0 lg:pr-4">
              <div className="mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Action Forums</span>
              </div>
              {items.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => handleViewChange(`${prefix}-${item.id}`)}
                  className="group/row flex items-center justify-between p-4 rounded-2xl border bg-[#fbfcfd] border-slate-100 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`h-8 w-8 rounded-lg ${item.bulletColor} text-white flex items-center justify-center shadow-sm group-hover/row:scale-105 transition-transform`}>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">{item.iconPath}</svg>
                    </div>
                    <span className="text-sm font-black text-slate-800 group-hover/row:text-slate-900 uppercase tracking-tight">{item.statusLabel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900 bg-white border border-slate-150 px-3 py-1 rounded-xl shadow-xs min-w-[2.5rem] text-center">
                      {item.count}
                    </span>
                    <svg className="w-4 h-4 text-slate-300 group-hover/row:text-slate-500 group-hover/row:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Side: Top 5 Pending items */}
            <div className="flex flex-col border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Top 5 Pending Deadlines</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border border-slate-100 rounded-full px-2.5 py-0.5">
                  Priority
                </span>
              </div>
              
              {sortedPending.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
                  <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3 border border-emerald-100/50">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-xs font-black text-slate-700 uppercase tracking-tight">All Caught Up</p>
                  <p className="text-[10px] font-medium text-slate-400 mt-1 max-w-[200px]">No pending items require active responses.</p>
                </div>
              ) : (
                <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar max-h-[280px]">
                  {sortedPending.map((item) => {
                    const overdue = isOverdue(item.dueDate);
                    const neardue = isNearDue(item.dueDate);
                    const formattedDate = item.dueDate ? formatDate(item.dueDate) : 'No Due Date';
                    
                    return (
                      <div 
                        key={item.id}
                        onClick={() => handleViewChange(`${prefix}-pending`)}
                        className="p-3.5 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/10 transition-all cursor-pointer flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-slate-800 truncate uppercase tracking-tight">{item.clientName}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate uppercase tracking-wider">
                            Ref: {item.referenceNo || 'N/A'} <span className="mx-1 text-slate-200">|</span> Sec: {item.section || 'N/A'}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                            overdue 
                              ? 'bg-rose-50 border-rose-100 text-rose-600' 
                              : neardue 
                              ? 'bg-amber-50 border-amber-100 text-amber-600' 
                              : 'bg-slate-50 border-slate-100 text-slate-600'
                          }`}>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="whitespace-nowrap">{formattedDate}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': {
        const monthlyStats = getFilingCounts('monthly', `${monthlyFilter.year}_${monthlyFilter.month}`);
        const quarterlyStats = getFilingCounts('quarterly', `${quarterlyFilter.year}_${quarterlyFilter.quarter}`);
        const compStats = getFilingCounts('composition', `${compositionFilter.year}_${compositionFilter.quarter}`);
        const gstr4Stats = getFilingCounts('gstr4', `${annualFilter.year}`); // Using monthly year as default for annual
        const gstr9Stats = getFilingCounts('gstr9', `${annualFilter.year}`);
        const itrStats = getFilingCounts('itr', itrFilter.ay);
        const auditStats = getFilingCounts('audit', itrFilter.ay);
        const pendingNotices = litigation.filter(r => r.category === 'Notice' && r.status === 'Pending').length;
        const pendingAppeals = litigation.filter(r => r.category === 'Appeal' && r.status === 'Pending').length;
        const pendingTribunals = litigation.filter(r => r.category === 'Tribunal' && r.status === 'Pending').length;
        const pendingCourt = litigation.filter(r => r.category === 'HighCourt' && r.status === 'Pending').length;
        const totalPending = pendingNotices + pendingAppeals + pendingTribunals + pendingCourt;


        return (
          <div className="w-full mx-auto space-y-16 animate-in fade-in duration-700 pb-32">
            {installPrompt && <InstallBanner onInstall={triggerInstall} />}
            
            
            {/* Sector 1: Client Hub */}
            <section>
              <SectionHeader title="Client Hub" subtitle="Master Portfolio Repositories" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div onClick={() => handleViewChange('gst-portfolio')} className="group bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm hover:border-indigo-400 hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden">
                   <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-600/5 -mr-10 -mt-10 rounded-full blur-3xl group-hover:bg-indigo-600/10 transition-colors" />
                   <div className="flex items-start justify-between relative z-10">
                      <div>
                        <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg mb-6 group-hover:scale-110 transition-transform">
                           <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" /></svg>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">GST Portfolio</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Active Regular & Comp. Entities</p>
                      </div>
                      <div className="text-right">
                        <p className="text-4xl font-black text-slate-900">{(clients || []).filter(c => c && !!c.gstProfile).length}</p>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mt-1">Total Vault</p>
                      </div>
                   </div>
                </div>
                <div onClick={() => handleViewChange('it-portfolio')} className="group bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm hover:border-emerald-400 hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden">
                   <div className="absolute top-0 right-0 h-40 w-40 bg-emerald-600/5 -mr-10 -mt-10 rounded-full blur-3xl group-hover:bg-emerald-600/10 transition-colors" />
                   <div className="flex items-start justify-between relative z-10">
                      <div>
                        <div className="h-14 w-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg mb-6 group-hover:scale-110 transition-transform">
                           <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857" /></svg>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">IT Portfolio</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Personal & Corporate Direct Tax</p>
                      </div>
                      <div className="text-right">
                        <p className="text-4xl font-black text-slate-900">{(clients || []).filter(c => c && !!c.itProfile).length}</p>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mt-1">Total Vault</p>
                      </div>
                   </div>
                </div>
              </div>
            </section>

            {/* Sector 2: Compliance */}
            <section>
              <SectionHeader title="Compliance Matrix" subtitle="Statutory Filing Lifecycle" />
              <div className="space-y-10">
                 <div>
                    <SubSectionTitle title="Filing Cycles" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                       <DetailedCard 
                         label="Monthly" 
                         periodControls={
                           <div className="flex gap-1">
                              <select 
                                 className="bg-transparent border-none text-[10px] uppercase font-bold text-slate-400 cursor-pointer focus:ring-0 p-0"
                                 value={monthlyFilter.month} 
                                 onChange={(e) => setMonthlyFilter({ ...monthlyFilter, month: e.target.value })}
                              >
                                {FY_MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                              <select 
                                 className="bg-transparent border-none text-[10px] uppercase font-bold text-slate-500 cursor-pointer focus:ring-0 p-0"
                                 value={monthlyFilter.year}
                                 onChange={(e) => setMonthlyFilter({ ...monthlyFilter, year: e.target.value })}
                              >
                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                              </select>
                           </div>
                         }
                         stats={{
                           total: monthlyStats.total,
                           items: [
                             { label: 'GSTR-1', value: monthlyStats.r1, color: 'bg-indigo-500' },
                             { label: 'GSTR-3B', value: monthlyStats.r3b, color: 'bg-emerald-500' }
                           ]
                         }}
                         viewId="compliance-monthly" 
                         color="bg-indigo-600" 
                         icon={<path d="M8 7V3m8 4V3m-9 8h10" />} 
                       />
                       <DetailedCard 
                         label="Quarterly" 
                         periodControls={
                           <div className="flex gap-1">
                              <select 
                                 className="bg-transparent border-none text-[10px] uppercase font-bold text-slate-400 cursor-pointer focus:ring-0 p-0"
                                 value={quarterlyFilter.quarter} 
                                 onChange={(e) => setQuarterlyFilter({ ...quarterlyFilter, quarter: e.target.value })}
                              >
                                {FY_QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
                              </select>
                              <select 
                                 className="bg-transparent border-none text-[10px] uppercase font-bold text-slate-500 cursor-pointer focus:ring-0 p-0"
                                 value={quarterlyFilter.year}
                                 onChange={(e) => setQuarterlyFilter({ ...quarterlyFilter, year: e.target.value })}
                              >
                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                              </select>
                           </div>
                         }
                         stats={{
                           total: quarterlyStats.total,
                           items: [
                             { label: 'IFF/R1', value: quarterlyStats.r1, color: 'bg-blue-500' },
                             { label: 'GSTR-3B', value: quarterlyStats.r3b, color: 'bg-emerald-500' }
                           ]
                         }}
                         viewId="compliance-quarterly" 
                         color="bg-blue-600" 
                         icon={<path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />} 
                       />
                       <DetailedCard 
                         label="Composition" 
                         periodControls={
                           <div className="flex gap-1">
                              <select 
                                 className="bg-transparent border-none text-[10px] uppercase font-bold text-slate-400 cursor-pointer focus:ring-0 p-0"
                                 value={compositionFilter.quarter} 
                                 onChange={(e) => setCompositionFilter({ ...compositionFilter, quarter: e.target.value })}
                              >
                                {FY_QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
                              </select>
                              <select 
                                 className="bg-transparent border-none text-[10px] uppercase font-bold text-slate-500 cursor-pointer focus:ring-0 p-0"
                                 value={compositionFilter.year}
                                 onChange={(e) => setCompositionFilter({ ...compositionFilter, year: e.target.value })}
                              >
                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                              </select>
                           </div>
                         }
                         stats={{
                           total: compStats.total,
                           items: [
                             { label: 'CMP-08', value: compStats.cmp08, color: 'bg-amber-500' },
                             { label: 'Pending', value: compStats.total - compStats.cmp08, color: 'bg-slate-300' }
                           ]
                         }}
                         viewId="compliance-composition" 
                         color="bg-amber-600" 
                         icon={<path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5" />} 
                       />
                    </div>
                 </div>
                 <div>
                    <SubSectionTitle title="Annual Returns" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <DetailedCard 
                         label="GSTR-04 Annual" 
                          periodControls={
                               <select 
                                  className="bg-transparent border-none text-[10px] uppercase font-bold text-slate-400 cursor-pointer focus:ring-0 p-0"
                                  value={annualFilter.year}
                                  onChange={(e) => setAnnualFilter({ ...annualFilter, year: e.target.value })}
                               >
                                 {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                               </select>
                          }
                         stats={{
                           total: gstr4Stats.total,
                           items: [
                             { label: 'Filed', value: gstr4Stats.filed, color: 'bg-indigo-500' },
                             { label: 'Pending', value: gstr4Stats.total - gstr4Stats.filed, color: 'bg-slate-300' }
                           ]
                         }}
                         viewId="compliance-gstr4" 
                         color="bg-indigo-400" 
                         icon={<path d="M12 8v4l3 3" />} 
                       />
                       <DetailedCard 
                         label="GSTR-9/9C Audit" 
                          periodControls={
                               <select 
                                  className="bg-transparent border-none text-[10px] uppercase font-bold text-slate-400 cursor-pointer focus:ring-0 p-0"
                                  value={annualFilter.year}
                                  onChange={(e) => setAnnualFilter({ ...annualFilter, year: e.target.value })}
                               >
                                 {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                               </select>
                          }
                         stats={{
                           total: gstr9Stats.total,
                           items: [
                             { label: 'Filed', value: gstr9Stats.filed, color: 'bg-indigo-800' },
                             { label: 'Pending', value: gstr9Stats.total - gstr9Stats.filed, color: 'bg-slate-300' }
                           ]
                         }}
                         viewId="compliance-gstr9" 
                         color="bg-indigo-800" 
                         icon={<path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7" />} 
                       />
                    </div>
                 </div>
                 <div>
                    <SubSectionTitle title="IT & Audit" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <DetailedCard 
                         label="ITR Returns" 
                          periodControls={
                               <div className="flex gap-1 items-center">
                                 <span className="text-[10px] font-bold text-slate-400 uppercase">AY</span>
                                 <select 
                                    className="bg-transparent border-none text-[10px] uppercase font-bold text-slate-400 cursor-pointer focus:ring-0 p-0"
                                    value={itrFilter.ay}
                                    onChange={(e) => setItrFilter({ ...itrFilter, ay: e.target.value })}
                                 >
                                   {YEARS.map(y => {
                                      const startYear = parseInt(y.split('-')[0]);
                                      const ay = `${startYear + 1}-${(startYear + 2).toString().slice(-2)}`;
                                      return <option key={ay} value={ay}>{ay}</option>;
                                   })}
                                 </select>
                               </div>
                          }
                         stats={{
                           total: itrStats.total,
                           items: [
                             { label: 'Filed', value: itrStats.filed, color: 'bg-emerald-600' },
                             { label: 'Pending', value: itrStats.total - itrStats.filed, color: 'bg-slate-300' }
                           ]
                         }}
                         viewId="compliance-itr" 
                         color="bg-emerald-600" 
                         icon={<path d="M17 9V7a2 2 0 00-2-2H5" />} 
                       />
                       <DetailedCard 
                         label="Audit & B/S" 
                          periodControls={
                               <div className="flex gap-1 items-center">
                                 <span className="text-[10px] font-bold text-slate-400 uppercase">AY</span>
                                 <select 
                                    className="bg-transparent border-none text-[10px] uppercase font-bold text-slate-400 cursor-pointer focus:ring-0 p-0"
                                    value={itrFilter.ay}
                                    onChange={(e) => setItrFilter({ ...itrFilter, ay: e.target.value })}
                                 >
                                   {YEARS.map(y => {
                                      const startYear = parseInt(y.split('-')[0]);
                                      const ay = `${startYear + 1}-${(startYear + 2).toString().slice(-2)}`;
                                      return <option key={ay} value={ay}>{ay}</option>;
                                   })}
                                 </select>
                               </div>
                          }
                         stats={{
                           total: auditStats.total,
                           items: [
                             { label: 'Filed', value: auditStats.filed, color: 'bg-emerald-400' },
                             { label: 'Pending', value: auditStats.total - auditStats.filed, color: 'bg-slate-300' }
                           ]
                         }}
                         viewId="compliance-taxaudit" 
                         color="bg-emerald-400" 
                         icon={<path d="M9 12h6m-6 4h6" />} 
                       />
                    </div>
                 </div>
              </div>
            </section>

            {/* Sector 3: Litigation */}
            <section>
              <SectionHeader title="Litigation Suite" subtitle="Legal Defense Command" />
              <div className="grid grid-cols-1 gap-12">
                 <LitigationBlock forum="Notice" label="GST Notices" icon={<path d="M12 9v2m0 4h.01" />} />
                 <LitigationBlock forum="Appeal" label="GST Appeals" icon={<path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2" />} />
                 <LitigationBlock forum="Tribunal" label="GSTAT (Tribunal)" icon={<path d="M3 6l3 1m0 0l-3 9" />} />
                 <LitigationBlock forum="HighCourt" label="High Court Matters" icon={<path d="M8 14v20c0 4.418 7.163 8 16 8" />} />
              </div>
            </section>

            {/* Sector 4: Services */}
            <section>
              <SectionHeader title="Service Desk" subtitle="New Enrollments & Work Logs" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 <CompactCard label="GST Reg." count={gstReg.length} viewId="misc-gst-reg" color="bg-indigo-500" icon={<path d="M9 12l2 2 4-4" />} />
                 <CompactCard label="Food License" count={foodLic.length} viewId="misc-food-lic" color="bg-emerald-500" icon={<path d="M3 3h2l.4 2" />} />
                 <CompactCard label="MSME Reg." count={msme.length} viewId="misc-msme" color="bg-blue-500" icon={<path d="M21 13.255A23.931 23.931 0 0112 15" />} />
                 <CompactCard label="Work Log" count={miscWork.length} viewId="misc-work" color="bg-slate-700" icon={<path d="M12 8v4l3 3" />} />
              </div>
            </section>

            {/* Sector 5: Admin */}
            <section>
              <SectionHeader title="Administration" subtitle="Back-Office Controls" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                 <CompactCard label="Message" count={0} viewId="messenger" color="bg-indigo-600" icon={<path d="M8 10h.01M12 10h.01" />} />
                 <CompactCard label="Reminders" count={0} viewId="reminders" color="bg-rose-500" icon={<path d="M15 17h5l-1.405-1.405" />} />
                 <CompactCard label="Invoices" count={invoices.filter(i => i.status !== 'Paid').length} viewId="admin-invoices" color="bg-slate-900" icon={<path d="M9 14l6-6" />} />
                 <CompactCard label="Payments" count={payments.length} viewId="admin-payments" color="bg-emerald-600" icon={<path d="M17 9V7a2 2 0 00-2-2" />} />
                 <CompactCard label="Due Date" count={0} viewId="admin-duedates" color="bg-amber-600" icon={<path d="M8 7V3m8 4V3" />} />
                 <CompactCard label="Trash" count={0} viewId="trash" color="bg-slate-400" icon={<path d="M19 7l-.867 12.142" />} />
              </div>
            </section>
          </div>
        );
      }
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
      case 'admin-invoicesetting': return <InvoiceSetting onBack={() => handleViewChange('admin-invoices')} />;
      case 'admin-payments': return <PaymentReceived onViewChange={handleViewChange} />;
      case 'admin-client-ledger': {
        const fromView = (viewExtra && typeof viewExtra === 'string') ? viewExtra : 'admin-payments';
        return <ClientLedger onBack={() => handleViewChange(fromView as any)} />;
      }
      case 'admin-duedates': return <DueDateSetting />;
      case 'settings': return <Setting />;
      case 'trash': return <Trash />;
      default: return <div className="p-20 text-center text-slate-300 font-black uppercase tracking-widest text-sm">Synchronizing Secure Module...</div>;
    }
  };

  const headerInfo = useMemo(() => {
    const mappings: Record<string, { label: string; desc: string }> = {
      'dashboard': { label: 'Dashboard', desc: 'Practice Intelligence Operating System' },
      'gst-portfolio': { label: 'GST Portfolio', desc: 'Master GST Client Vault' },
      'it-portfolio': { label: 'IT Portfolio', desc: 'Master Income Tax Client Vault' },
      'compliance-monthly': { label: 'Monthly Returns', desc: 'GSTR-1 and GSTR-3B Lifecycle' },
      'compliance-quarterly': { label: 'Quarterly Returns', desc: 'QRMP and IFF Compliance Hub' },
      'compliance-composition': { label: 'Composition Returns', desc: 'CMP-08 Quarterly Filing Unit' },
      'compliance-gstr4': { label: 'GSTR-4 Annual', desc: 'Composition Annual Return Audit' },
      'compliance-gstr9': { label: 'GSTR-9/9C Audit', desc: 'Statutory Annual Reconciliation Unit' },
      'compliance-itr': { label: 'ITR Returns', desc: 'Direct Tax Filing Lifecycle' },
      'compliance-taxaudit': { label: 'Audit & Financials', desc: '3CA/3CD and Balance Sheet Unit' },
      'lit-notice-pending': { label: 'Pending Notices', desc: 'Live GST Notice Response Tracking' },
      'lit-notice-filed': { label: 'Filed Notices', desc: 'Archived Submissions Awaiting Orders' },
      'lit-notice-drop': { label: 'Closed Notices', desc: 'Notices Dropped or Relief Granted' },
      'lit-notice-demand': { label: 'Confirmed Demands', desc: 'Notices Resulting in Tax Demands' },
      'lit-appeal-pending': { label: 'Pending Appeals', desc: 'First Appeals Drafting and Advisory' },
      'lit-appeal-filed': { label: 'Filed Appeals', desc: 'Appeals Awaiting Adjudication' },
      'lit-appeal-drop': { label: 'Relief Appeals', desc: 'Appeals Decided in Taxpayer Favor' },
      'lit-appeal-demand': { label: 'Sustained Appeals', desc: 'Appeals resulting in Confirmed Liabilities' },
      'lit-tribunal-pending': { label: 'Pending Tribunal', desc: 'GSTAT Preparation and Advisory' },
      'lit-tribunal-filed': { label: 'Filed Tribunal', desc: 'GSTAT Matters Awaiting Bench Hearing' },
      'lit-tribunal-drop': { label: 'Relief Tribunal', desc: 'Favorable Tribunal Orders Archived' },
      'lit-tribunal-demand': { label: 'Sustained Tribunal', desc: 'Confirmed Tribunal Assessment Demands' },
      'lit-hc-pending': { label: 'Pending High Court', desc: 'Writ Petition and Counsel Drafting' },
      'lit-hc-filed': { label: 'Filed High Court', desc: 'HC Matters Awaiting Adjudication' },
      'lit-hc-drop': { label: 'Relief High Court', desc: 'Favorable HC Judgments Archived' },
      'lit-hc-demand': { label: 'Sustained High Court', desc: 'Confirmed High Court Tax Liabilities' },
      'misc-gst-reg': { label: 'GST Registration', desc: 'New Enrollment and Amendment Tracking' },
      'misc-food-lic': { label: 'Food License', desc: 'FSSAI Registration and Renewal Hub' },
      'misc-msme': { label: 'MSME Registration', desc: 'Udyam Registration and Certificate Tracking' },
      'misc-work': { label: 'Work Log', desc: 'Miscellaneous Staff Task Management' },
      'messenger': { label: 'Vault Messenger', desc: 'Secure Internal Practice Communication' },
      'reminders': { label: 'Reminders', desc: 'Statutory Compliance Deadline Monitor' },
      'admin-invoices': { label: 'Invoices', desc: 'Professional Billing and Receivables' },
      'admin-add-invoice': { label: 'Draft Invoice', desc: 'New Professional Bill Preparation' },
      'admin-invoicesetting': { label: 'Invoice Settings', desc: 'Configure Firm Billing Details' },
      'admin-payments': { label: 'Payments', desc: 'Collection Realization and History' },
      'admin-client-ledger': { label: 'Client Ledger', desc: 'Overview of balances' },
      'admin-duedates': { label: 'Due Dates', desc: 'Global Compliance Calendar Matrix' },
      'settings': { label: 'Vault Settings', desc: 'Firm Configuration and Security Protocols' },
      'trash': { label: 'Vault Audit', desc: 'Permanent Record and Activity Logs' }
    };
    return mappings[activeView] || { label: 'Module Access', desc: 'Authorized Vault Module Sync' };
  }, [activeView]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#fcfdfe] relative">
      <Sidebar 
        activeView={activeView} 
        onViewChange={handleViewChange} 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        onOpenFolder={setNavigationFolder}
      />
      <main className={`flex flex-1 flex-col overflow-hidden relative transition-all duration-500 ${isSidebarCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-72'}`}>
        <Header 
          isConnected={isOnline} 
          currentUser={user} 
          onMenuClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          activeViewLabel={headerInfo.label} 
          activeViewDescription={headerInfo.desc}
          onViewChange={handleViewChange}
        />
        <div className="flex-1 flex flex-col min-h-0 pt-4 md:pt-8 pb-20 md:pb-12 px-3 sm:px-6 overflow-y-auto no-scrollbar scroll-smooth">
          {isInitialLoad && activeView === 'dashboard' ? <Loader /> : (
            <Suspense fallback={<Loader />}>{renderContent()}</Suspense>
          )}
        </div>
      </main>

      <MobileBottomNav 
        activeView={activeView} 
        onViewChange={handleViewChange} 
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />

      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} onViewChange={handleViewChange} />
      
      <GSTClientFormModal isOpen={isGstModalOpen} onClose={() => setIsGstModalOpen(false)} onSave={() => queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] })} />
      <ITClientFormModal isOpen={isItModalOpen} onClose={() => setIsItModalOpen(false)} onSave={() => queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] })} />
    </div>
  );
};

export default Dashboard;
