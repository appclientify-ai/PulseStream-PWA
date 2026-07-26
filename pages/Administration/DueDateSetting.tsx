import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { socketService } from '../../services/socket';
import Loader from '../../components/Loader';
import { YEARS, FY_MONTHS, FY_QUARTERS } from '../Compliance/GSTReturn/filinglogic/MonthlyFilingLogic';
import { formatISOToDDMMYYYY } from '../../dateUtils';

type ReturnCategory = 'GST_MONTHLY' | 'GST_QUARTERLY' | 'GST_COMPOSITION' | 'INCOME_TAX' | 'AUDIT_FINANCIALS' | 'ANNUAL_RETURNS';

const CATEGORIES: { id: ReturnCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'GST_MONTHLY', label: 'GST Monthly', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
  { id: 'GST_QUARTERLY', label: 'GST Quarterly', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /> },
  { id: 'GST_COMPOSITION', label: 'Composition', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /> },
  { id: 'INCOME_TAX', label: 'Income Tax', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /> },
  { id: 'AUDIT_FINANCIALS', label: 'Audit & B/S', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
  { id: 'ANNUAL_RETURNS', label: 'Annual Returns', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
];

export const calculateDefaultDueDate = (moduleId: string, yearStr: string, period: string): string => {
  const startYear = parseInt(yearStr.split('-')[0], 10) || 2024;
  const endYear = startYear + 1;

  if (moduleId === 'monthly_r1' || moduleId === 'monthly_r3b') {
    const dueDay = moduleId === 'monthly_r1' ? '11' : '20';
    const monthMap: Record<string, { year: number; dueMonth: string }> = {
      April: { year: startYear, dueMonth: '05' },
      May: { year: startYear, dueMonth: '06' },
      June: { year: startYear, dueMonth: '07' },
      July: { year: startYear, dueMonth: '08' },
      August: { year: startYear, dueMonth: '09' },
      September: { year: startYear, dueMonth: '10' },
      October: { year: startYear, dueMonth: '11' },
      November: { year: startYear, dueMonth: '12' },
      December: { year: endYear, dueMonth: '01' },
      January: { year: endYear, dueMonth: '02' },
      February: { year: endYear, dueMonth: '03' },
      March: { year: endYear, dueMonth: '04' },
    };
    const info = monthMap[period];
    if (info) {
      return `${info.year}-${info.dueMonth}-${dueDay}`;
    }
  }

  if (moduleId === 'quarterly_iff' || moduleId === 'quarterly_r3b') {
    const isIff = moduleId === 'quarterly_iff';
    const day = isIff ? '13' : '22';
    if (period.includes('Q1')) return `${startYear}-07-${day}`;
    if (period.includes('Q2')) return `${startYear}-10-${day}`;
    if (period.includes('Q3')) return `${endYear}-01-${day}`;
    if (period.includes('Q4')) return `${endYear}-04-${day}`;
  }

  if (moduleId === 'composition_cmp08') {
    if (period.includes('Q1')) return `${startYear}-07-18`;
    if (period.includes('Q2')) return `${startYear}-10-18`;
    if (period.includes('Q3')) return `${endYear}-01-18`;
    if (period.includes('Q4')) return `${endYear}-04-18`;
  }

  if (moduleId === 'audit_bs') return `${endYear}-09-15`;
  if (moduleId === 'audit_tax') return `${endYear}-09-30`;
  if (moduleId === 'itr_return') return `${endYear}-07-31`;
  if (moduleId === 'annual_gstr4') return `${endYear}-04-30`;
  if (moduleId === 'annual_gstr9') return `${endYear}-12-31`;
  if (moduleId === 'annual_gstr9c') return `${endYear}-12-31`;

  return '';
};

const DateField: React.FC<{
  label?: string;
  value: string;
  onChange: (val: string) => void;
  accentColor?: 'indigo' | 'emerald' | 'amber' | 'blue' | 'rose' | 'slate';
  placeholder?: string;
}> = ({ label, value, onChange, accentColor = 'indigo', placeholder = 'DD/MM/YYYY' }) => {
  const formattedDisplay = value ? formatISOToDDMMYYYY(value) : placeholder;

  const colorStyles = {
    indigo: {
      box: 'border-indigo-200 bg-indigo-50/40 text-indigo-900 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100',
      pill: 'bg-indigo-600 text-white',
    },
    emerald: {
      box: 'border-emerald-200 bg-emerald-50/40 text-emerald-900 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100',
      pill: 'bg-emerald-600 text-white',
    },
    amber: {
      box: 'border-amber-200 bg-amber-50/40 text-amber-900 focus-within:border-amber-600 focus-within:ring-2 focus-within:ring-amber-100',
      pill: 'bg-amber-600 text-white',
    },
    blue: {
      box: 'border-blue-200 bg-blue-50/40 text-blue-900 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100',
      pill: 'bg-blue-600 text-white',
    },
    rose: {
      box: 'border-rose-200 bg-rose-50/40 text-rose-900 focus-within:border-rose-600 focus-within:ring-2 focus-within:ring-rose-100',
      pill: 'bg-rose-600 text-white',
    },
    slate: {
      box: 'border-slate-200 bg-slate-50 text-slate-900 focus-within:border-slate-600 focus-within:ring-2 focus-within:ring-slate-100',
      pill: 'bg-slate-700 text-white',
    }
  }[accentColor];

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</label>}
      <div className={`relative flex items-center justify-between rounded-xl border px-3 py-2 transition-all cursor-pointer group ${colorStyles.box}`}>
        <div className="flex items-center gap-2 min-w-0">
          <svg className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className={`px-2.5 py-1 rounded-md text-xs font-black tracking-wide font-mono shrink-0 ${value ? colorStyles.pill : 'bg-slate-200 text-slate-500'}`}>
            {formattedDisplay}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 pl-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-700">
            Set
          </span>
          <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
        />
      </div>
    </div>
  );
};

const DueDateSetting: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState(YEARS[0]);
  const [activeCategory, setActiveCategory] = useState<ReturnCategory>('GST_MONTHLY');
  const [dates, setDates] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const STORAGE_KEY = 'clientify_global_compliance_dates_v1';

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await api.getAppData(STORAGE_KEY);
        if (saved) setDates(saved);
      } catch(e) { console.error(e); }
      setIsLoading(false);
    };
    load();
    const syncHandler = () => load();
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, []);

  const handleDateChange = (moduleId: string, period: string, value: string) => {
    const key = `${moduleId}_${selectedYear}_${period}`;
    setDates(prev => ({ ...prev, [key]: value }));
  };

  const handleAutoSetDefaults = () => {
    const nextDates = { ...dates };
    YEARS.forEach(yr => {
      FY_MONTHS.forEach(m => {
        const r1Key = `monthly_r1_${yr}_${m}`;
        const r3bKey = `monthly_r3b_${yr}_${m}`;
        if (!nextDates[r1Key]) nextDates[r1Key] = calculateDefaultDueDate('monthly_r1', yr, m);
        if (!nextDates[r3bKey]) nextDates[r3bKey] = calculateDefaultDueDate('monthly_r3b', yr, m);
      });
      FY_QUARTERS.forEach(q => {
        const iffKey = `quarterly_iff_${yr}_${q}`;
        const q3bKey = `quarterly_r3b_${yr}_${q}`;
        const cmpKey = `composition_cmp08_${yr}_${q}`;
        if (!nextDates[iffKey]) nextDates[iffKey] = calculateDefaultDueDate('quarterly_iff', yr, q);
        if (!nextDates[q3bKey]) nextDates[q3bKey] = calculateDefaultDueDate('quarterly_r3b', yr, q);
        if (!nextDates[cmpKey]) nextDates[cmpKey] = calculateDefaultDueDate('composition_cmp08', yr, q);
      });
      [
        ['audit_bs', 'Annual'],
        ['audit_tax', 'Annual'],
        ['itr_return', 'Annual'],
        ['annual_gstr4', 'Annual'],
        ['annual_gstr9', 'Annual'],
        ['annual_gstr9c', 'Annual'],
      ].forEach(([mod, p]) => {
        const k = `${mod}_${yr}_${p}`;
        if (!nextDates[k]) nextDates[k] = calculateDefaultDueDate(mod, yr, p);
      });
    });
    setDates(nextDates);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const finalDates = { ...dates };
    FY_MONTHS.forEach(m => {
      ['monthly_r1', 'monthly_r3b'].forEach(mod => {
        const k = `${mod}_${selectedYear}_${m}`;
        if (!finalDates[k]) finalDates[k] = calculateDefaultDueDate(mod, selectedYear, m);
      });
    });
    FY_QUARTERS.forEach(q => {
      ['quarterly_iff', 'quarterly_r3b', 'composition_cmp08'].forEach(mod => {
        const k = `${mod}_${selectedYear}_${q}`;
        if (!finalDates[k]) finalDates[k] = calculateDefaultDueDate(mod, selectedYear, q);
      });
    });
    [
      ['audit_bs', 'Annual'],
      ['audit_tax', 'Annual'],
      ['itr_return', 'Annual'],
      ['annual_gstr4', 'Annual'],
      ['annual_gstr9', 'Annual'],
      ['annual_gstr9c', 'Annual'],
    ].forEach(([mod, p]) => {
      const k = `${mod}_${selectedYear}_${p}`;
      if (!finalDates[k]) finalDates[k] = calculateDefaultDueDate(mod, selectedYear, p);
    });

    setDates(finalDates);
    await api.patchAppData(STORAGE_KEY, Object.fromEntries(Object.entries(finalDates).map(([k,v]) => [`data.${k}`, v])));
      queryClient.invalidateQueries({ queryKey: ['due_dates'] });
    socketService.emit('data_updated');
    window.dispatchEvent(new Event('clientify_db_change'));
    setTimeout(() => setIsSaving(false), 600);
  };

  const getDateValue = (moduleId: string, period: string) => {
    const key = `${moduleId}_${selectedYear}_${period}`;
    return dates[key] || calculateDefaultDueDate(moduleId, selectedYear, period);
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 max-w-full mx-auto w-full overflow-hidden pb-2">
      
      {/* Dynamic Header Toolbar */}
      <div className="flex flex-col gap-3 bg-white p-3 md:p-4 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
           <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <div>
                <h2 className="text-base md:text-lg font-black text-slate-900 uppercase tracking-tight leading-none">Compliance Due Dates</h2>
                <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mt-1">Master Statutory Calendar</p>
              </div>
           </div>

           <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:inline">Year:</span>
              <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black uppercase outline-none cursor-pointer hover:bg-slate-100 transition-colors">
                {YEARS.map(y => <option key={y} value={y}>FY {y}</option>)}
              </select>
              <button onClick={handleAutoSetDefaults} title="Fill all standard statutory default due dates"
                className="border border-slate-200 text-slate-700 font-black uppercase tracking-wider px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-all text-[10px] flex items-center gap-1">
                <svg className="h-3.5 w-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                <span className="hidden sm:inline">Auto Defaults</span>
              </button>
              <button onClick={handleSave} disabled={isSaving}
                className="bg-indigo-600 text-white font-black uppercase tracking-widest px-4 py-1.5 rounded-xl shadow-md hover:bg-slate-900 transition-all text-[10px] disabled:opacity-50">
                {isSaving ? 'Syncing...' : 'Save Matrix'}
              </button>
           </div>
        </div>

        {/* Categories scrollable on mobile/tablet, grid on desktop */}
        <div className="flex md:grid overflow-x-auto no-scrollbar md:grid-cols-6 gap-2 w-full pb-1 md:pb-0 shrink-0">
           {CATEGORIES.map(cat => (
             <button 
               key={cat.id} 
               onClick={() => setActiveCategory(cat.id)}
               className={`p-2 rounded-xl font-black uppercase text-[10px] tracking-wider transition-all flex items-center justify-center gap-1.5 shrink-0 md:shrink ${
                 activeCategory === cat.id 
                   ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                   : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
               }`}
             >
               <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">{cat.icon}</svg>
               <span className="truncate">{cat.label}</span>
             </button>
           ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
         <div className="overflow-y-auto no-scrollbar flex-1 p-4 md:p-6">
            
            {/* GST MONTHLY VIEW */}
            {activeCategory === 'GST_MONTHLY' && (
              <div className="space-y-4 max-w-6xl mx-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                   <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Monthly Return Due Dates (GSTR-1 & GSTR-3B)</h3>
                   <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">Format: DD/MM/YYYY</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {FY_MONTHS.map(month => (
                    <div key={month} className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 hover:bg-white hover:shadow-md transition-all space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                         <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{month}</span>
                         <span className="text-[9px] font-black uppercase tracking-widest bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded-md">
                           FY {selectedYear}
                         </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <DateField 
                          label="GSTR-1 Due Date" 
                          value={getDateValue('monthly_r1', month)}
                          onChange={val => handleDateChange('monthly_r1', month, val)}
                          accentColor="indigo"
                        />
                        <DateField 
                          label="GSTR-3B Due Date" 
                          value={getDateValue('monthly_r3b', month)}
                          onChange={val => handleDateChange('monthly_r3b', month, val)}
                          accentColor="emerald"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GST QUARTERLY VIEW */}
            {activeCategory === 'GST_QUARTERLY' && (
              <div className="space-y-4 max-w-5xl mx-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                   <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Quarterly Return Due Dates (QRMP Scheme)</h3>
                   <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">Format: DD/MM/YYYY</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {FY_QUARTERS.map(q => (
                    <div key={q} className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 hover:bg-white hover:shadow-md transition-all space-y-3">
                      <div className="flex items-center gap-3 border-b border-slate-200/60 pb-2">
                         <div className="h-8 w-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs shrink-0">
                           {q.includes('Q1') ? 'Q1' : q.includes('Q2') ? 'Q2' : q.includes('Q3') ? 'Q3' : 'Q4'}
                         </div>
                         <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{q}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <DateField 
                          label="IFF / GSTR-1 Date" 
                          value={getDateValue('quarterly_iff', q)}
                          onChange={val => handleDateChange('quarterly_iff', q, val)}
                          accentColor="indigo"
                        />
                        <DateField 
                          label="GSTR-3B Date" 
                          value={getDateValue('quarterly_r3b', q)}
                          onChange={val => handleDateChange('quarterly_r3b', q, val)}
                          accentColor="emerald"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GST COMPOSITION VIEW */}
            {activeCategory === 'GST_COMPOSITION' && (
              <div className="space-y-4 max-w-4xl mx-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                   <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Composition Dealer Quarterly CMP-08</h3>
                   <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">Format: DD/MM/YYYY</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {FY_QUARTERS.map(q => (
                    <div key={q} className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 hover:bg-white hover:shadow-md transition-all space-y-3">
                      <div className="flex items-center gap-3 border-b border-slate-200/60 pb-2">
                         <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xs shrink-0">
                           {q.includes('Q1') ? 'Q1' : q.includes('Q2') ? 'Q2' : q.includes('Q3') ? 'Q3' : 'Q4'}
                         </div>
                         <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{q}</span>
                      </div>

                      <DateField 
                        label="CMP-08 Due Date" 
                        value={getDateValue('composition_cmp08', q)}
                        onChange={val => handleDateChange('composition_cmp08', q, val)}
                        accentColor="amber"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AUDIT & FINANCIALS VIEW */}
            {activeCategory === 'AUDIT_FINANCIALS' && (
              <div className="max-w-3xl mx-auto space-y-4 pt-2">
                 <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Audit & Financial Year End Deadlines</h3>
                    <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">Format: DD/MM/YYYY</span>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-3">
                       <div className="flex items-center gap-3">
                         <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                           <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                         </div>
                         <div>
                           <h3 className="text-sm font-black text-slate-900 uppercase">Balance Sheet Prep</h3>
                           <p className="text-[10px] text-slate-500 font-bold uppercase">Target Completion Date</p>
                         </div>
                       </div>
                       <DateField 
                         label="Balance Sheet Target Date" 
                         value={getDateValue('audit_bs', 'Annual')} 
                         onChange={val => handleDateChange('audit_bs', 'Annual', val)}
                         accentColor="blue"
                       />
                    </div>

                    <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-3">
                       <div className="flex items-center gap-3">
                         <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                           <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" /></svg>
                         </div>
                         <div>
                           <h3 className="text-sm font-black text-slate-900 uppercase">Tax Audit (3CA/3CD)</h3>
                           <p className="text-[10px] text-slate-500 font-bold uppercase">Statutory Statutory Due Date</p>
                         </div>
                       </div>
                       <DateField 
                         label="Tax Audit Statutory Due Date" 
                         value={getDateValue('audit_tax', 'Annual')} 
                         onChange={val => handleDateChange('audit_tax', 'Annual', val)}
                         accentColor="indigo"
                       />
                    </div>
                 </div>
              </div>
            )}

            {/* INCOME TAX VIEW */}
            {activeCategory === 'INCOME_TAX' && (
              <div className="max-w-2xl mx-auto space-y-4 pt-2">
                 <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Income Tax Return Statutory Deadlines</h3>
                    <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">Format: DD/MM/YYYY</span>
                 </div>

                 <div className="bg-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 h-32 w-32 bg-indigo-500/20 rounded-full blur-2xl" />
                    <h3 className="text-lg md:text-xl font-black uppercase tracking-tight mb-1">Income Tax Returns (ITR)</h3>
                    <p className="text-indigo-300 text-xs font-bold uppercase tracking-wider mb-4">Financial Year {selectedYear}</p>

                    <DateField 
                      label="Standard Non-Audit ITR Due Date" 
                      value={getDateValue('itr_return', 'Annual')} 
                      onChange={val => handleDateChange('itr_return', 'Annual', val)}
                      accentColor="rose"
                    />
                 </div>
              </div>
            )}

            {/* ANNUAL RETURNS VIEW */}
            {activeCategory === 'ANNUAL_RETURNS' && (
              <div className="max-w-4xl mx-auto space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                   <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">GST Annual Compliance Deadlines</h3>
                   <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">Format: DD/MM/YYYY</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="border-b border-slate-200/60 pb-2">
                      <h4 className="text-sm font-black text-slate-900 uppercase">Form GSTR-4</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Composition Annual</p>
                    </div>
                    <DateField 
                      label="GSTR-4 Due Date" 
                      value={getDateValue('annual_gstr4', 'Annual')} 
                      onChange={val => handleDateChange('annual_gstr4', 'Annual', val)}
                      accentColor="amber"
                    />
                  </div>

                  <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="border-b border-slate-200/60 pb-2">
                      <h4 className="text-sm font-black text-slate-900 uppercase">Form GSTR-9</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">GST Annual Return</p>
                    </div>
                    <DateField 
                      label="GSTR-9 Due Date" 
                      value={getDateValue('annual_gstr9', 'Annual')} 
                      onChange={val => handleDateChange('annual_gstr9', 'Annual', val)}
                      accentColor="indigo"
                    />
                  </div>

                  <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="border-b border-slate-200/60 pb-2">
                      <h4 className="text-sm font-black text-slate-900 uppercase">Form GSTR-9C</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Reconciliation Statement</p>
                    </div>
                    <DateField 
                      label="GSTR-9C Due Date" 
                      value={getDateValue('annual_gstr9c', 'Annual')} 
                      onChange={val => handleDateChange('annual_gstr9c', 'Annual', val)}
                      accentColor="emerald"
                    />
                  </div>
                </div>
              </div>
            )}

         </div>
      </div>

    </div>
  );
};

export default DueDateSetting;
