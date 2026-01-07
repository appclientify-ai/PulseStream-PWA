
import React, { useState, useEffect, useMemo } from 'react';
import Loader from '../../components/Loader';
import { YEARS, FY_MONTHS, FY_QUARTERS } from '../Compliance/GSTReturn/filinglogic/MonthlyFilingLogic';

type ReturnCategory = 'GST_MONTHLY' | 'GST_QUARTERLY' | 'GST_COMPOSITION' | 'ANNUAL_RETURNS' | 'INCOME_TAX' | 'AUDIT_FINANCIALS';

const CATEGORIES: { id: ReturnCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'GST_MONTHLY', label: 'GST Monthly', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
  { id: 'GST_QUARTERLY', label: 'GST Quarterly', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /> },
  { id: 'GST_COMPOSITION', label: 'Composition', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /> },
  { id: 'INCOME_TAX', label: 'Income Tax', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /> },
  { id: 'AUDIT_FINANCIALS', label: 'Audit & B/S', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
  { id: 'ANNUAL_RETURNS', label: 'Annual Returns', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
];

const DueDateSetting: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(YEARS[0]);
  const [activeCategory, setActiveCategory] = useState<ReturnCategory>('GST_MONTHLY');
  const [isLoading, setIsLoading] = useState(true);
  const [dates, setDates] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const STORAGE_KEY = 'clientify_global_compliance_dates_v1';

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setDates(JSON.parse(saved));
    setIsLoading(false);
  }, []);

  const handleDateChange = (moduleId: string, period: string, value: string) => {
    const key = `${moduleId}_${selectedYear}_${period}`;
    setDates(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dates));
    setTimeout(() => setIsSaving(false), 600);
  };

  const getDateValue = (moduleId: string, period: string) => {
    const key = `${moduleId}_${selectedYear}_${period}`;
    return dates[key] || '';
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-500 max-w-full mx-auto w-full overflow-hidden">
      
      {/* Dynamic Header Toolbar */}
      <div className="flex flex-col lg:flex-row items-center justify-between bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm shrink-0 gap-4">
        <div className="flex items-center gap-6">
           <div className="shrink-0">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Compliance Calendar</h2>
              <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] mt-1.5">Master Due Date Management</p>
           </div>
           <div className="h-10 w-[1px] bg-slate-100 hidden md:block" />
           <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:inline">Financial Year:</span>
              <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
                className="bg-slate-50 border-none rounded-xl px-4 py-2 text-[11px] font-black uppercase outline-none cursor-pointer hover:bg-slate-100 transition-colors">
                {YEARS.map(y => <option key={y} value={y}>FY {y}</option>)}
              </select>
           </div>
        </div>

        <div className="flex-1 flex justify-center overflow-x-auto no-scrollbar gap-1.5 px-4">
           {CATEGORIES.map(cat => (
             <button 
               key={cat.id} 
               onClick={() => setActiveCategory(cat.id)}
               className={`px-5 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
                 activeCategory === cat.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
               }`}
             >
               <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">{cat.icon}</svg>
               {cat.label}
             </button>
           ))}
        </div>

        <button onClick={handleSave} disabled={isSaving}
          className="bg-indigo-600 text-white font-black uppercase tracking-[0.2em] px-10 h-12 rounded-xl shadow-xl hover:bg-slate-900 transition-all text-[10px] disabled:opacity-50 shrink-0">
          {isSaving ? 'Syncing...' : 'Save Matrix'}
        </button>
      </div>

      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
         <div className="overflow-y-auto no-scrollbar flex-1 p-8">
            
            {/* GST MONTHLY VIEW */}
            {activeCategory === 'GST_MONTHLY' && (
              <div className="space-y-6">
                <div className="grid grid-cols-12 px-6 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <div className="col-span-4">Filing Period (Months)</div>
                  <div className="col-span-4 text-center">GSTR-1 Due Date</div>
                  <div className="col-span-4 text-center">GSTR-3B Due Date</div>
                </div>
                <div className="space-y-2">
                  {FY_MONTHS.map(month => (
                    <div key={month} className="grid grid-cols-12 items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                      <div className="col-span-4 flex items-center gap-3">
                         <div className="h-8 w-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center font-black text-[10px] text-slate-300">
                           {month.substring(0,3).toUpperCase()}
                         </div>
                         <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{month}</span>
                      </div>
                      <div className="col-span-4 px-8">
                         <input type="date" value={getDateValue('monthly_r1', month)} 
                           onChange={e => handleDateChange('monthly_r1', month, e.target.value)}
                           className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-50 transition-all" />
                      </div>
                      <div className="col-span-4 px-8">
                         <input type="date" value={getDateValue('monthly_r3b', month)} 
                           onChange={e => handleDateChange('monthly_r3b', month, e.target.value)}
                           className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black text-emerald-600 outline-none focus:ring-4 focus:ring-emerald-50 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GST QUARTERLY VIEW */}
            {activeCategory === 'GST_QUARTERLY' && (
              <div className="space-y-6">
                <div className="grid grid-cols-12 px-6 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <div className="col-span-4">Quarterly Period</div>
                  <div className="col-span-4 text-center">IFF / GSTR-1 Date</div>
                  <div className="col-span-4 text-center">GSTR-3B Date</div>
                </div>
                <div className="space-y-2">
                  {FY_QUARTERS.map(q => (
                    <div key={q} className="grid grid-cols-12 items-center bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                      <div className="col-span-4 flex items-center gap-4">
                         <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                           {q.includes('Q1') ? 'Q1' : q.includes('Q2') ? 'Q2' : q.includes('Q3') ? 'Q3' : 'Q4'}
                         </div>
                         <span className="text-base font-black text-slate-700 uppercase tracking-tight">{q}</span>
                      </div>
                      <div className="col-span-4 px-8">
                         <input type="date" value={getDateValue('quarterly_iff', q)} 
                           onChange={e => handleDateChange('quarterly_iff', q, e.target.value)}
                           className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-sm font-black text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-100 transition-all" />
                      </div>
                      <div className="col-span-4 px-8">
                         <input type="date" value={getDateValue('quarterly_r3b', q)} 
                           onChange={e => handleDateChange('quarterly_r3b', q, e.target.value)}
                           className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-sm font-black text-emerald-600 outline-none focus:ring-4 focus:ring-emerald-100 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GST COMPOSITION VIEW */}
            {activeCategory === 'GST_COMPOSITION' && (
              <div className="space-y-6">
                <div className="grid grid-cols-12 px-6 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <div className="col-span-6">Filing Period</div>
                  <div className="col-span-6 text-center">CMP-08 Due Date</div>
                </div>
                <div className="space-y-2">
                  {FY_QUARTERS.map(q => (
                    <div key={q} className="grid grid-cols-12 items-center bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                      <div className="col-span-6 flex items-center gap-4">
                         <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-xs">
                           {q.includes('Q1') ? 'Q1' : q.includes('Q2') ? 'Q2' : q.includes('Q3') ? 'Q3' : 'Q4'}
                         </div>
                         <span className="text-base font-black text-slate-700 uppercase tracking-tight">{q}</span>
                      </div>
                      <div className="col-span-6 px-16">
                         <input type="date" value={getDateValue('composition_cmp08', q)} 
                           onChange={e => handleDateChange('composition_cmp08', q, e.target.value)}
                           className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-sm font-black text-amber-600 outline-none focus:ring-4 focus:ring-amber-100 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AUDIT & FINANCIALS VIEW */}
            {activeCategory === 'AUDIT_FINANCIALS' && (
              <div className="max-w-4xl mx-auto space-y-12 pt-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                       <div className="flex items-center gap-3">
                         <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                           <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                         </div>
                         <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Balance Sheet Prep</h3>
                       </div>
                       <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                          <label className="text-[10px] font-black uppercase text-slate-400 block mb-3 ml-1 tracking-widest">Target Deadline</label>
                          <input type="date" value={getDateValue('audit_bs', 'Annual')} 
                            onChange={e => handleDateChange('audit_bs', 'Annual', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-4 font-black text-blue-600 outline-none focus:ring-4 focus:ring-blue-50 transition-all text-lg" />
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="flex items-center gap-3">
                         <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                           <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" /></svg>
                         </div>
                         <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Tax Audit (3CA/3CD)</h3>
                       </div>
                       <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                          <label className="text-[10px] font-black uppercase text-slate-400 block mb-3 ml-1 tracking-widest">Statutory Due Date</label>
                          <input type="date" value={getDateValue('audit_tax', 'Annual')} 
                            onChange={e => handleDateChange('audit_tax', 'Annual', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-4 font-black text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-50 transition-all text-lg" />
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {/* INCOME TAX VIEW */}
            {activeCategory === 'INCOME_TAX' && (
              <div className="max-w-2xl mx-auto space-y-6 pt-12">
                 <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden mb-10">
                    <div className="absolute -top-10 -right-10 h-40 w-40 bg-indigo-500/20 rounded-full blur-3xl" />
                    <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Income Tax Returns</h3>
                    <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest">Assessment Year Compliance</p>
                 </div>
                 <div className="space-y-4">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
                       <span className="text-sm font-black text-slate-700 uppercase tracking-widest">Standard ITR Deadline</span>
                       <input type="date" value={getDateValue('itr_return', 'Annual')} 
                         onChange={e => handleDateChange('itr_return', 'Annual', e.target.value)}
                         className="bg-white border border-slate-200 rounded-xl px-6 py-3 font-black text-indigo-600 outline-none shadow-sm" />
                    </div>
                 </div>
              </div>
            )}

            {/* ANNUAL RETURNS VIEW */}
            {activeCategory === 'ANNUAL_RETURNS' && (
              <div className="max-w-5xl mx-auto space-y-8 pt-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-4">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] border-b border-slate-200 pb-3">Form GSTR-4</h4>
                    <input type="date" value={getDateValue('annual_gstr4', 'Annual')} 
                      onChange={e => handleDateChange('annual_gstr4', 'Annual', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-4 font-black text-amber-600 outline-none" />
                  </div>
                  <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-4">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] border-b border-slate-200 pb-3">Form GSTR-9</h4>
                    <input type="date" value={getDateValue('annual_gstr9', 'Annual')} 
                      onChange={e => handleDateChange('annual_gstr9', 'Annual', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-4 font-black text-indigo-600 outline-none" />
                  </div>
                  <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-4">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] border-b border-slate-200 pb-3">Form GSTR-9C</h4>
                    <input type="date" value={getDateValue('annual_gstr9c', 'Annual')} 
                      onChange={e => handleDateChange('annual_gstr9c', 'Annual', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-4 font-black text-emerald-600 outline-none" />
                  </div>
                </div>
              </div>
            )}

         </div>
      </div>

      <div className="p-8 rounded-[2.5rem] bg-indigo-950 text-white shadow-2xl relative overflow-hidden shrink-0">
         <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent" />
         <div className="flex items-center justify-between relative z-10">
            <div>
               <h4 className="text-lg font-black uppercase tracking-tight leading-none mb-2">Automated Notifications</h4>
               <p className="text-indigo-300 text-[10px] font-medium uppercase tracking-widest">Dates saved in this matrix will automatically trigger WhatsApp and Email alerts for matching clients.</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-indigo-300">
               <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </div>
         </div>
      </div>
    </div>
  );
};

export default DueDateSetting;
