import React, { useState, useEffect } from 'react';

interface LitigationGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
}

export const LitigationGuidelinesModal: React.FC<LitigationGuidelinesModalProps> = ({
  isOpen,
  onClose,
  initialCategory = 'Notice'
}) => {
  const normalizeCat = (cat?: string) => {
    if (!cat) return 'Notice';
    const c = cat.toLowerCase();
    if (c === 'notice') return 'Notice';
    if (c === 'appeal') return 'Appeal';
    if (c === 'tribunal') return 'Tribunal';
    if (c === 'highcourt' || c === 'high court' || c === 'hc') return 'HighCourt';
    if (c === 'gstreg' || c === 'gst-reg' || c === 'gst registration') return 'GstReg';
    if (c === 'foodlicense' || c === 'food-lic' || c === 'food' || c === 'fssai') return 'FoodLicense';
    if (c === 'msme' || c === 'udyam') return 'Msme';
    if (c === 'worklog' || c === 'work-log' || c === 'work' || c === 'work log') return 'WorkLog';
    if (c === 'gstrules' || c === 'gst-rules' || c === 'gstrule') return 'GstRules';
    if (c === 'itrules' || c === 'it-rules' || c === 'it' || c === 'itrules') return 'ItRules';
    return 'Notice';
  };

  const [activeTab, setActiveTab] = useState<string>('Notice');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(normalizeCat(initialCategory));
      setSearchTerm('');
    }
  }, [isOpen, initialCategory]);

  if (!isOpen) return null;

  const matchesSearch = (text: string) => {
    if (!searchTerm) return true;
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  };

  const tabGroups = [
    {
      title: 'LITIGATION & APPEALS',
      accent: 'border-indigo-500 text-indigo-600 bg-indigo-50/50',
      tabs: [
        { id: 'Notice', label: 'GST Notices', icon: '📩', desc: 'S.73, S.74 & ASMT-10 scrutiny' },
        { id: 'Appeal', label: 'First Appeals (S.107)', icon: '⚖️', desc: 'APL-01 & pre-deposits' },
        { id: 'Tribunal', label: 'GSTAT Tribunal (S.112)', icon: '🏛️', desc: 'APL-05 and GSTAT rules' },
        { id: 'HighCourt', label: 'High Court & Writs', icon: '🧑‍⚖️', desc: 'S.117 & Art 226 petitions' },
      ]
    },
    {
      title: 'REGISTRATIONS & LOGS',
      accent: 'border-emerald-500 text-emerald-600 bg-emerald-50/50',
      tabs: [
        { id: 'GstReg', label: 'GST Registration', icon: '🆔', desc: 'REG-01, amendments & revokes' },
        { id: 'FoodLicense', label: 'FSSAI Food License', icon: '🍎', desc: 'Basic, State & Central lic.' },
        { id: 'Msme', label: 'MSME / Udyam', icon: '🏢', desc: 'Classification & 45-day protection' },
        { id: 'WorkLog', label: 'Work Log Office SOP', icon: '📋', desc: 'Internal audit trails & logs' },
      ]
    },
    {
      title: 'STATUTORY REFERENCE',
      accent: 'border-amber-500 text-amber-600 bg-amber-50/50',
      tabs: [
        { id: 'GstRules', label: 'GST Rules & Sec', icon: '📖', desc: 'Levy, eligibility, blocking, cash limits' },
        { id: 'ItRules', label: 'IT Rules & Sec', icon: '💼', desc: 'S.44AB audit, presumptive tax, dates' },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-2 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="w-full max-w-6xl h-[95vh] sm:h-[90vh] bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95">
        
        {/* Header Bar */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-xl sm:text-2xl shadow-inner shrink-0">
              ⚖️
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400">
                  Statutory Reference Manual
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-extrabold text-[9px] uppercase">
                  Compliance Manual v2.0
                </span>
              </div>
              <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight truncate">
                Clientify Compliance & Statutory Guidelines
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-10 w-10 sm:h-11 sm:w-11 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all shadow-sm shrink-0 ml-2"
            title="Close Guidelines"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6" />
            </svg>
          </button>
        </div>

        {/* Global Search Bar (Responsive) */}
        <div className="px-4 py-2.5 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <p className="hidden md:block text-xs font-bold text-slate-500">
            Select a manual on the left or search below to filter statutory references
          </p>
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search sections, rules or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl py-2 pl-9 pr-3 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Content Area - Split Sidebar & Details */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          
          {/* Mobile Tab Scroller (Visible on mobile only) */}
          <div className="md:hidden flex items-center gap-1.5 overflow-x-auto p-2 bg-slate-100 border-b border-slate-200 shrink-0 no-scrollbar">
            {tabGroups.flatMap(g => g.tabs).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1 ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 bg-white hover:text-slate-900 border border-slate-200'
                }`}
              >
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>

          {/* Desktop Left Sidebar (Hidden on mobile) */}
          <aside className="hidden md:flex w-72 shrink-0 bg-slate-50 border-r border-slate-200 flex-col p-4 overflow-y-auto no-scrollbar space-y-5">
            {tabGroups.map((group) => (
              <div key={group.title} className="space-y-1.5">
                <span className="text-[10px] font-black text-slate-400 tracking-widest block px-2.5">
                  {group.title}
                </span>
                <div className="space-y-1">
                  {group.tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-3 border ${
                          isActive
                            ? 'bg-white border-indigo-600 text-indigo-700 shadow-sm'
                            : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                        }`}
                      >
                        <span className="text-lg shrink-0 mt-0.5">{tab.icon}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase tracking-wide leading-snug">{tab.label}</p>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{tab.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </aside>

          {/* Right Scrollable Content Pane */}
          <main className="flex-1 p-5 sm:p-6 overflow-y-auto no-scrollbar bg-white">
            
            {/* 1. GST NOTICES */}
            {activeTab === 'Notice' && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-amber-500 text-white flex items-center justify-center text-2xl shrink-0 shadow-md">
                    📩
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-black text-amber-900 uppercase tracking-tight">
                        GST Notices & Scrutiny Framework
                      </h4>
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded border border-amber-300">
                        Standard Reply: 30 Days
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed mt-1">
                      Notices in GST are issued by revenue officers under statutory provisions for return discrepancy, audit, inspection, or non-payment of tax. Timely response in prescribed formats (ASMT-11, DRC-06) prevents ex-parte orders.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {matchesSearch("Section 73 Determination of Tax Not Paid / Short Paid / Erroneous Refund Non-Fraud Cases DRC-01A DRC-01 DRC-06 10% penalty ₹10,000") && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-amber-400 transition-all">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-black text-xs font-mono">
                          Section 73
                        </span>
                        <span className="text-[10px] font-black uppercase text-slate-400">Non-Fraud Cases</span>
                      </div>
                      <h5 className="text-sm font-black text-slate-900 leading-snug">
                        Tax Not Paid / Short Paid / Erroneous ITC (Without Fraud)
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        Issued where tax is short paid, unpaid, or ITC wrongly claimed <strong>without</strong> willful intent to evade taxes.
                      </p>
                      <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-[11px] text-slate-700 font-bold border border-slate-100">
                        <p>• <strong>Form:</strong> DRC-01A (Pre-SCN Intimation) & DRC-01 (Show Cause Notice)</p>
                        <p>• <strong>Reply Form:</strong> Form GST DRC-06 within 30 days</p>
                        <p>• <strong>Penalty:</strong> Nil if paid before SCN; 10% of tax or ₹10,000 (higher) upon final order</p>
                        <p>• <strong>Limitation:</strong> SCN issued 3 months before order deadline (3 years from Annual Return due date)</p>
                      </div>
                    </div>
                  )}

                  {matchesSearch("Section 74 Fraud / Misstatement Suppression Evade GST DRC-01 DRC-06 15% 25% 50% 100% penalty") && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-rose-400 transition-all">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-900 font-black text-xs font-mono">
                          Section 74
                        </span>
                        <span className="text-[10px] font-black uppercase text-rose-600">Fraud / Suppression</span>
                      </div>
                      <h5 className="text-sm font-black text-slate-900 leading-snug">
                        Tax Not Paid / Short Paid (Fraud & Suppression Cases)
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        Invoked where tax evasion or wrongful ITC claims involve deliberate fraud, willful misstatement, or suppression of material facts.
                      </p>
                      <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-[11px] text-slate-700 font-bold border border-slate-100">
                        <p>• <strong>Form:</strong> Form GST DRC-01 (Show Cause Notice)</p>
                        <p>• <strong>Reply Form:</strong> Form GST DRC-06 within 30 days</p>
                        <p>• <strong>Penalty:</strong> 15% (pre-SCN), 25% (within 30 days of SCN), 50% (within 30 days of Order), 100% otherwise</p>
                        <p>• <strong>Limitation:</strong> SCN issued 6 months before order deadline (5 years from Annual Return due date)</p>
                      </div>
                    </div>
                  )}

                  {matchesSearch("Section 61 Scrutiny of Returns ASMT-10 ASMT-11 ASMT-12 GSTR-1 GSTR-3B GSTR-2B discrepancy") && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-indigo-400 transition-all">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-900 font-black text-xs font-mono">
                          Section 61
                        </span>
                        <span className="text-[10px] font-black uppercase text-indigo-600">Return Scrutiny</span>
                      </div>
                      <h5 className="text-sm font-black text-slate-900 leading-snug">
                        Scrutiny of Tax Returns (Form GST ASMT-10)
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        Officers scrutinize filings (3B vs 1, 3B vs 2B ITC mismatch) and highlight discrepancies for clarification.
                      </p>
                      <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-[11px] text-slate-700 font-bold border border-slate-100">
                        <p>• <strong>Notice Form:</strong> Form GST ASMT-10 (electronic notice)</p>
                        <p>• <strong>Reply Form:</strong> Form GST ASMT-11 within 30 days explaining differences or paying tax via DRC-03</p>
                        <p>• <strong>Outcome:</strong> Acceptable reply leads to a closure order in Form GST ASMT-12</p>
                      </div>
                    </div>
                  )}

                  {matchesSearch("Section 129 130 E-Way Bill Transit Detention Seizure Confiscation MOV-06 MOV-07 MOV-09 200% penalty") && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-purple-400 transition-all">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-900 font-black text-xs font-mono">
                          Section 129 & 130
                        </span>
                        <span className="text-[10px] font-black uppercase text-purple-600">Transit Goods</span>
                      </div>
                      <h5 className="text-sm font-black text-slate-900 leading-snug">
                        Detention, Seizure & Confiscation of Goods in Transit
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        Invoked during vehicle intercepts due to missing, wrong, or expired E-Way Bills or invoice discrepancies.
                      </p>
                      <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-[11px] text-slate-700 font-bold border border-slate-100">
                        <p>• <strong>Forms:</strong> MOV-06 (Detention), MOV-07 (Notice), MOV-09 (Final order)</p>
                        <p>• <strong>Penalty u/s 129:</strong> 200% of tax payable for taxable goods (or 50% value for exempt)</p>
                        <p>• <strong>Timeline:</strong> SCN within 7 days of intercept; Order within 7 days of notice</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. FIRST APPEALS (SEC 107) */}
            {activeTab === 'Appeal' && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="bg-gradient-to-r from-indigo-600/10 via-blue-600/10 to-indigo-600/5 border border-indigo-200 rounded-3xl p-5 flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-2xl shrink-0 shadow-md">
                    ⚖️
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-black text-indigo-950 uppercase tracking-tight">
                        First Appeals before Appellate Authority (Section 107)
                      </h4>
                      <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded border border-indigo-300">
                        APL-01 Filing
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed mt-1">
                      Aggrieved taxpayers can appeal orders passed by adjudicating authorities (like S.73/74 order-in-original) before the Appellate Joint Commissioner Appeals.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matchesSearch("Limitation 3 months 90 days condonation 1 month 30 days Section 107(4)") && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <h5 className="text-xs font-black uppercase text-indigo-600 tracking-wider">
                        1. Statutory Limitation & Delay Condonation
                      </h5>
                      <div className="bg-slate-50 p-3.5 rounded-xl space-y-2 text-xs text-slate-700 font-bold border border-slate-100">
                        <p>• <strong>Time Limit:</strong> <strong>3 months (90 days)</strong> from communication date of the order.</p>
                        <p>• <strong>Extension u/s 107(4):</strong> Up to <strong>1 additional month (30 days)</strong> if genuine delay cause is demonstrated.</p>
                        <p>• <strong>Department Appeals:</strong> Within <strong>6 months</strong> from communication of order.</p>
                      </div>
                    </div>
                  )}

                  {matchesSearch("Pre-Deposit 10% disputed tax Stay of Demand automatic stay Section 107(7) ₹25 Crore") && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <h5 className="text-xs font-black uppercase text-emerald-600 tracking-wider">
                        2. Mandatory Pre-Deposit & Stay of recovery
                      </h5>
                      <div className="bg-slate-50 p-3.5 rounded-xl space-y-2 text-xs text-slate-700 font-bold border border-slate-100">
                        <p>• <strong>Admitted Tax:</strong> Paid 100% of admitted tax, interest, fees, and penalties.</p>
                        <p>• <strong>Disputed Tax:</strong> Mandatory pre-deposit of <strong>10% of disputed tax amount</strong> (capped at ₹25 Cr CGST).</p>
                        <p>• <strong>Automatic Stay u/s 107(7):</strong> Recovery of the balance 90% demand is automatically stayed upon pre-deposit payment.</p>
                      </div>
                    </div>
                  )}

                  {matchesSearch("Filing Procedure online Facts Grounds Certified copy APL-01 APL-02") && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 md:col-span-2">
                      <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                        3. Step-by-Step Filing Procedure & Certified Copy Mandate
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700 font-bold">
                        <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                          <p className="font-black text-indigo-900 mb-1">Step A: Portal Submission</p>
                          <p className="text-[11px] text-slate-600">Submit Form GST APL-01 electronically on the GST Portal along with Statement of Facts and Grounds of Appeal.</p>
                        </div>
                        <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                          <p className="font-black text-indigo-900 mb-1">Step B: Certified Copy Submission</p>
                          <p className="text-[11px] text-slate-600">Submit a certified physical copy of the appealed order to the commissioner within 7 days of online filing to obtain final Acknowledgment (GST APL-02).</p>
                        </div>
                        <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                          <p className="font-black text-indigo-900 mb-1">Step C: Adjudication Outcome</p>
                          <p className="text-[11px] text-slate-600">First Appellate Authority passes final Order-in-Appeal (OIA) under Section 107(11) ordinarily within 1 year.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. TRIBUNAL (GSTAT) */}
            {activeTab === 'Tribunal' && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-purple-600/5 border border-purple-200 rounded-3xl p-5 flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-purple-600 text-white flex items-center justify-center text-2xl shrink-0 shadow-md">
                    🏛️
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-black text-purple-950 uppercase tracking-tight">
                        GST Appellate Tribunal - GSTAT (Section 112 & 113)
                      </h4>
                      <span className="bg-purple-100 text-purple-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded border border-purple-300">
                        Form APL-05
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed mt-1">
                      Appeals against first appeal orders lie before GSTAT Principal or State benches, ensuring highly structured statutory legal protection.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matchesSearch("Section 112(1) Time Limit 3 months 90 days condonation 3 months 90 days GSTAT") && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <h5 className="text-xs font-black uppercase text-purple-700 tracking-wider">
                        1. Time Limit & Delayed Admission rules
                      </h5>
                      <div className="bg-slate-50 p-3.5 rounded-xl space-y-2 text-xs text-slate-700 font-bold border border-slate-100">
                        <p>• <strong>Standard Window:</strong> Within <strong>3 months (90 days)</strong> of order communication.</p>
                        <p>• <strong>Delay Condonation u/s 112(6):</strong> Up to <strong>3 additional months (90 days / total 180 days)</strong> if GSTAT is satisfied with delayed reason.</p>
                      </div>
                    </div>
                  )}

                  {matchesSearch("Pre-Deposit additional 20% cumulative 30% Stay of recovery Section 112(8) 112(9) ₹50 Crore") && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <h5 className="text-xs font-black uppercase text-purple-700 tracking-wider">
                        2. Mandatory Pre-Deposit & Demands Stay
                      </h5>
                      <div className="bg-slate-50 p-3.5 rounded-xl space-y-2 text-xs text-slate-700 font-bold border border-slate-100">
                        <p>• <strong>Additional Pre-deposit:</strong> A further sum of <strong>20% of disputed tax amount</strong> (making cumulative total of 30% across First Appeal & GSTAT).</p>
                        <p>• <strong>Stay u/s 112(9):</strong> On payment, recovery of the balance 70% demand stands stayed automatically.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. HIGH COURT & WRITS */}
            {activeTab === 'HighCourt' && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="bg-gradient-to-r from-slate-900/10 via-indigo-900/10 to-slate-900/5 border border-slate-300 rounded-3xl p-5 flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center text-2xl shrink-0 shadow-md">
                    ⚖️
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-black text-slate-950 uppercase tracking-tight">
                        High Court Appeals & Writ Jurisdiction
                      </h4>
                      <span className="bg-slate-200 text-slate-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded border border-slate-300">
                        Section 117 & Article 226/227
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed mt-1">
                      Appeals against GSTAT orders on substantial questions of law. Taxpayers can also file constitutional writs against arbitrary actions or natural justice violations.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matchesSearch("Section 117 High Court Appeal substantial question of law 180 days") && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                        1. Section 117 Appeals
                      </h5>
                      <div className="bg-slate-50 p-3.5 rounded-xl space-y-2 text-xs text-slate-700 font-bold border border-slate-100">
                        <p>• <strong>Condition:</strong> Only in cases involving a <strong>substantial question of law</strong>.</p>
                        <p>• <strong>Timeline:</strong> Within <strong>180 days</strong> from communication of GSTAT order.</p>
                      </div>
                    </div>
                  )}

                  {matchesSearch("Article 226 Article 227 Writ Petition natural justice Certiorari lack of jurisdiction") && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <h5 className="text-xs font-black uppercase text-indigo-700 tracking-wider">
                        2. Constitutional Writ Jurisdiction (Art. 226 & 227)
                      </h5>
                      <div className="bg-slate-50 p-3.5 rounded-xl space-y-2 text-xs text-slate-700 font-bold border border-slate-100">
                        <p>• <strong>Grounds:</strong> Natural justice violations, lack of jurisdiction, arbitrary blockings, or ex-parte assessment without hearing opportunities.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. GST REGISTRATION */}
            {activeTab === 'GstReg' && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-200 rounded-3xl p-5 flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-2xl shrink-0 shadow-md">
                    🆔
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-black text-emerald-950 uppercase tracking-tight">
                        GST Registration & Statutory Amendments
                      </h4>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded border border-emerald-300">
                        S.22 to S.30 • CGST Rules 8-26
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed mt-1">
                      Statutory threshold mandates, process timelines, core forms, and guidelines for filing new enrollment applications, amendments, cancellations, and revocation actions.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {matchesSearch("Section 22 Section 24 registration threshold Goods ₹40 Lakhs Services ₹20 Lakhs compulsory") && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <h5 className="text-xs font-black uppercase text-emerald-700 tracking-wider">
                        1. Registration Thresholds & Compulsory Mandates
                      </h5>
                      <div className="bg-slate-50 p-3.5 rounded-xl space-y-2 text-xs text-slate-700 font-bold border border-slate-100">
                        <p>• <strong>Goods Threshold:</strong> Turnover exceeds <strong>₹40 Lakhs</strong> (general category) or ₹20 Lakhs (special states).</p>
                        <p>• <strong>Services Threshold:</strong> Turnover exceeds <strong>₹20 Lakhs</strong> (general category) or ₹10 Lakhs (special states).</p>
                        <p>• <strong>Compulsory S.24:</strong> Inter-state suppliers, e-commerce operators, reverse charge taxpayers, and casual taxable persons must register regardless of turnover limits.</p>
                      </div>
                    </div>
                  )}

                  {matchesSearch("REG-01 REG-03 REG-04 REG-06 timelines physical verification 7 working days") && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <h5 className="text-xs font-black uppercase text-emerald-700 tracking-wider">
                        2. Process & Approval Timelines
                      </h5>
                      <div className="bg-slate-50 p-3.5 rounded-xl space-y-2 text-xs text-slate-700 font-bold border border-slate-100">
                        <p>• <strong>REG-01 Application:</strong> Handled with Aadhaar authentication.</p>
                        <p>• <strong>Response Time:</strong> Approved within <strong>7 working days</strong>, or SCN issued in <strong>REG-03</strong> if discrepancy is found.</p>
                        <p>• <strong>REG-04 Response:</strong> Filed within <strong>7 working days</strong>. Failure leads to rejection in REG-05.</p>
                        <p>• <strong>Physical Verification:</strong> If flagged, registration certificate (REG-06) is issued only after physical site verification reports are filed.</p>
                      </div>
                    </div>
                  )}

                  {matchesSearch("Amendment Cancellation Revocation REG-14 REG-16 REG-21 30 days") && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 lg:col-span-2">
                      <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                        3. Amendments, Cancellation & Revocation Procedures
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700 font-bold">
                        <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
                          <p className="font-black text-emerald-900 mb-1">Amendments (REG-14)</p>
                          <p className="text-[11px] text-slate-600 leading-normal">Filed within 15 days of changes. Core fields (legal name, directors, principal business address) require officer approval within 15 working days.</p>
                        </div>
                        <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
                          <p className="font-black text-emerald-900 mb-1">Cancellation (REG-16)</p>
                          <p className="text-[11px] text-slate-600 leading-normal">Voluntary application (business closed/transferred). Officer cancels via REG-19. Suo-moto cancellation for non-filing occurs via REG-17 SCN.</p>
                        </div>
                        <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
                          <p className="font-black text-emerald-900 mb-1">Revocation (REG-21)</p>
                          <p className="text-[11px] text-slate-600 leading-normal">If cancelled suo-moto, apply for revocation in Form REG-21 within <strong>30 days</strong> of the cancellation order date (provided all overdue returns are cleared first).</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 6. FOOD LICENSE (FSSAI) */}
            {activeTab === 'FoodLicense' && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="bg-gradient-to-r from-rose-500/10 via-red-500/10 to-rose-500/5 border border-rose-200 rounded-3xl p-5 flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-rose-500 text-white flex items-center justify-center text-2xl shrink-0 shadow-md">
                    🍎
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-black text-rose-950 uppercase tracking-tight">
                        FSSAI Food License Regulatory Manual
                      </h4>
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded border border-rose-300">
                        FSS Act 2006 • Food Safety Standards
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed mt-1">
                      Food business operators (FBO) must secure registrations, state licenses, or central licenses according to business capacity, location, and turnover parameters to ensure food hygiene compliance.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {matchesSearch("Basic Registration Form A Turnover ₹12 Lakhs fee ₹100 photo ID address proof") && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-rose-400 transition-all">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-900 font-mono text-[10px] font-black">
                          Form A
                        </span>
                        <span className="text-[10px] font-black uppercase text-slate-400">Basic Registration</span>
                      </div>
                      <h5 className="text-sm font-black text-slate-900 leading-snug">
                        FSSAI Basic Registration
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        Mandated for small food businesses, petty retailers, hawkers, temporary stall holders, or home kitchens.
                      </p>
                      <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-[11px] text-slate-700 font-bold border border-slate-100">
                        <p>• <strong>Eligibility:</strong> Annual turnover is <strong>under ₹12 Lakhs</strong>.</p>
                        <p>• <strong>Statutory Fee:</strong> ₹100 per year (applied up to 5 years).</p>
                        <p>• <strong>Core Documents:</strong> Photo, ID Proof (Aadhaar/Voter ID), and Business Address Proof (utility bill/rent agreement).</p>
                      </div>
                    </div>
                  )}

                  {matchesSearch("State License Form B Turnover ₹12 Lakhs ₹20 Crores fee ₹2,000 ₹5,000 layout map water report") && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-rose-400 transition-all">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="px-2.5 py-1 rounded bg-teal-50 text-teal-900 font-mono text-[10px] font-black">
                          Form B
                        </span>
                        <span className="text-[10px] font-black uppercase text-emerald-600">State License</span>
                      </div>
                      <h5 className="text-sm font-black text-slate-900 leading-snug">
                        FSSAI State License
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        Mandated for medium-sized food processors, manufacturers, hotels, large distributors, or major caterers.
                      </p>
                      <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-[11px] text-slate-700 font-bold border border-slate-100">
                        <p>• <strong>Eligibility:</strong> Turnover is between <strong>₹12 Lakhs and ₹20 Crores</strong> annually.</p>
                        <p>• <strong>Statutory Fee:</strong> ₹2,000 to ₹5,000 per year.</p>
                        <p>• <strong>Core Documents:</strong> Business layout map, list of machinery, food safety management plan (FSMS), and water potability report.</p>
                      </div>
                    </div>
                  )}

                  {matchesSearch("Central License Form B Turnover ₹20 Crores fee ₹7,500 importer exporter multi-state") && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-rose-400 transition-all">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="px-2.5 py-1 rounded bg-rose-50 text-rose-900 font-mono text-[10px] font-black">
                          Form B
                        </span>
                        <span className="text-[10px] font-black uppercase text-rose-600">Central License</span>
                      </div>
                      <h5 className="text-sm font-black text-slate-900 leading-snug">
                        FSSAI Central License
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        Mandated for importers, multi-state chains, airport catering units, large manufacturers, and central government units.
                      </p>
                      <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-[11px] text-slate-700 font-bold border border-slate-100">
                        <p>• <strong>Eligibility:</strong> Turnover <strong>exceeds ₹20 Crores</strong>, or handles food imports/exports.</p>
                        <p>• <strong>Statutory Fee:</strong> ₹7,500 per year.</p>
                        <p>• <strong>Core Documents:</strong> Import Export Code (IEC), authority letter, food safety certificates, and manufacturing process layouts.</p>
                      </div>
                    </div>
                  )}

                  {matchesSearch("Renewal 30 days before late fee ₹100 per day expiry post-expiry renewal FoSCoS 180 days") && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 lg:col-span-3">
                      <h5 className="text-xs font-black uppercase text-rose-700 tracking-wider">
                        4. Crucial Timelines & Renewal Rules (LATEST UPDATES)
                      </h5>
                      <div className="bg-slate-50 p-3.5 rounded-xl space-y-2 text-xs text-slate-700 font-bold border border-slate-100">
                        <p>• <strong>Instant Renewal Scheme:</strong> FSSAI has introduced <strong>Instant Renewal of Licenses & Registrations</strong> on the FoSCoS portal without mandatory physical inspection, provided no change is made in the food category or parameters.</p>
                        <p>• <strong>Renewal Timeline:</strong> Renewal applications can be filed starting <strong>120 days before</strong> the license expiry. The ideal statutory window is at least <strong>30 days prior</strong> to expiry.</p>
                        <p>• <strong>Late Fee (Before Expiry):</strong> Filing inside the final 30 days before the expiry date triggers a late fee of <strong>₹100 per day</strong>.</p>
                        <p>• <strong>Post-Expiry Renewal Window (NEW RULE):</strong> Food Businesses are now permitted to renew their licenses/registrations <strong>even after the expiry date up to 180 days (6 months)</strong> on FoSCoS with a tiered penalty:</p>
                        <div className="pl-4 border-l-2 border-rose-200 space-y-1 text-[11px] text-slate-600 mt-1">
                          <p>• <strong>Days 1 to 90 after Expiry:</strong> Penalty of <strong>1 time</strong> the annual license/registration fee (plus regular renewal fee).</p>
                          <p>• <strong>Days 91 to 180 after Expiry:</strong> Penalty of <strong>2 times</strong> the annual license/registration fee (plus regular renewal fee).</p>
                          <p>• <strong>After 180 Days:</strong> The license is permanently terminated and a new fresh application must be submitted.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 7. MSME / UDYAM */}
            {activeTab === 'Msme' && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="bg-gradient-to-r from-blue-500/10 via-sky-500/10 to-blue-500/5 border border-blue-200 rounded-3xl p-5 flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-500 text-white flex items-center justify-center text-2xl shrink-0 shadow-md">
                    🏢
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-black text-blue-950 uppercase tracking-tight">
                        MSME Act & Udyam Regulatory Framework
                      </h4>
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded border border-blue-300">
                        MSMED Act 2006 • Rev. July 2020
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed mt-1">
                      Udyam Registration classifying enterprises into Micro, Small, and Medium. Protects suppliers from delayed payments and provides priority sector bank lending.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {matchesSearch("MSME Classification criteria Micro Investment ₹1 Crore Turnover ₹5 Crores Small Investment ₹10 Crores Turnover ₹50 Crores Medium Investment ₹50 Crores Turnover ₹250 Crores") && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-blue-400 transition-all">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-900 font-mono text-[10px] font-black">
                          Composite Criteria
                        </span>
                        <span className="text-[10px] font-black uppercase text-slate-400">Classification</span>
                      </div>
                      <h5 className="text-sm font-black text-slate-900 leading-snug">
                        Revised MSME Classification (w.e.f. July 1, 2020)
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        Determined through composite investment and turnover thresholds linked automatically with PAN and GSTIN returns:
                      </p>
                      <div className="bg-slate-50 p-3.5 rounded-xl space-y-2 text-[11px] text-slate-700 font-bold border border-slate-100">
                        <p>• <strong>Micro Enterprise:</strong> Investment in Plant/Machinery is <strong>≤ ₹1 Crore</strong> AND Turnover is <strong>≤ ₹5 Crores</strong>.</p>
                        <p>• <strong>Small Enterprise:</strong> Investment in Plant/Machinery is <strong>≤ ₹10 Crores</strong> AND Turnover is <strong>≤ ₹50 Crores</strong>.</p>
                        <p>• <strong>Medium Enterprise:</strong> Investment in Plant/Machinery is <strong>≤ ₹50 Crores</strong> AND Turnover is <strong>≤ ₹250 Crores</strong>.</p>
                      </div>
                    </div>
                  )}

                  {matchesSearch("Section 15 Section 16 delayed payments compound interest 3 times bank rate RBI 45 days 15 days non-deductible") && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-indigo-400 transition-all">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-900 font-mono text-[10px] font-black">
                          Section 15 & 16
                        </span>
                        <span className="text-[10px] font-black uppercase text-emerald-600">Payment Protection</span>
                      </div>
                      <h5 className="text-sm font-black text-slate-900 leading-snug">
                        Statutory Delayed Payment Protection
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        Severe statutory protection under MSMED Act protecting micro & small businesses from long credit terms and delayed payments:
                      </p>
                      <div className="bg-slate-50 p-3.5 rounded-xl space-y-2 text-[11px] text-slate-700 font-bold border border-slate-100">
                        <p>• <strong>Limitation:</strong> Buyer must pay the MSME supplier within <strong>45 days</strong> (if agreement exists in writing) or within <strong>15 days</strong> (if no written agreement exists).</p>
                        <p>• <strong>Compound Interest:</strong> Delayed payments attract compound interest with monthly rests at <strong>3 times the bank rate</strong> notified by the RBI.</p>
                        <p>• <strong>Tax Treatment:</strong> This interest is strictly <strong>non-deductible</strong> as business expenditure under the Income Tax Act.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 8. WORK LOG OFFICE SOPS */}
            {activeTab === 'WorkLog' && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="bg-gradient-to-r from-slate-900/10 via-slate-800/10 to-slate-900/5 border border-slate-300 rounded-3xl p-5 flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-slate-800 text-white flex items-center justify-center text-2xl shrink-0 shadow-md">
                    📋
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-black text-slate-950 uppercase tracking-tight">
                        Internal Practice Management & Work Log SOPs
                      </h4>
                      <span className="bg-slate-200 text-slate-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded border border-slate-300">
                        Firm Office SOPs
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed mt-1">
                      Office manual guidelines, timesheet logging protocols, audit trails, and data safety instructions for handling professional services in tax practice.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matchesSearch("Work sheet audit trails log logins OTP activity client communication 24 hours") && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                        1. Work Sheet Logging & Audit Trail Mandate
                      </h5>
                      <div className="bg-slate-50 p-3.5 rounded-xl space-y-2 text-xs text-slate-700 font-bold border border-slate-100">
                        <p>• <strong>Timesheet Log:</strong> Every team member must update their client work logs and hourly task descriptions within <strong>24 hours</strong> of task execution.</p>
                        <p>• <strong>Audit Trail:</strong> Record and timestamp all portal logins, OTP requests, tax submissions, and drafting versions to ensure full internal transparency.</p>
                        <p>• <strong>Client Communication:</strong> File a copy of all official client approvals (over emails/messages) inside the client dossier before submitting final returns or petitions.</p>
                      </div>
                    </div>
                  )}

                  {matchesSearch("Professional negligence prevention calendar due dates indemnity insurance 7 days") && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <h5 className="text-xs font-black uppercase text-red-600 tracking-wider">
                        2. Professional Negligence Prevention SOP
                      </h5>
                      <div className="bg-slate-50 p-3.5 rounded-xl space-y-2 text-xs text-slate-700 font-bold border border-slate-100">
                        <p>• <strong>Due Date Buffer:</strong> Program client data collection checklists at least <strong>7 days prior</strong> to standard statutory due dates to prevent penalties and systemic stress.</p>
                        <p>• <strong>Independent Review:</strong> All drafts of appeals, writ petitions, and tax audit forms (3CD) must undergo peer review by senior partners before submission.</p>
                        <p>• <strong>Indemnity Records:</strong> Store digital confirmation logs of representations for audit safety.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 9. GST RULES & SECTIONS REFERENCE */}
            {activeTab === 'GstRules' && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-emerald-500/5 border border-emerald-200 rounded-3xl p-5 flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-2xl shrink-0 shadow-md">
                    📖
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-black text-emerald-950 uppercase tracking-tight">
                        Statutory Reference: GST Sections & Rules
                      </h4>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded border border-emerald-300">
                        CGST Act 2017
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed mt-1">
                      Quick statutory access to crucial sections of CGST Act, 2017 and rules governing levy, conditions of Input Tax Credit (ITC), and cash ledger limits.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {matchesSearch("Section 9 Levy and collection of GST Reverse Charge Mechanism RCM u/s 9(3) 9(4)") && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="px-2.5 py-1 rounded bg-indigo-100 text-indigo-900 font-mono text-xs font-black">
                          Section 9
                        </span>
                        <span className="text-[10px] font-black uppercase text-indigo-600">Levy of Tax</span>
                      </div>
                      <h5 className="text-sm font-black text-slate-900 leading-snug">
                        Levy & Collection of GST
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        Statutory basis for charging GST on supply of goods or services.
                      </p>
                      <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-[11px] text-slate-700 font-bold border border-slate-100">
                        <p>• <strong>u/s 9(1):</strong> Levy of central tax on all intra-state supplies.</p>
                        <p>• <strong>RCM u/s 9(3):</strong> Governs reverse charge supplies notified by the government (e.g. GTA, legal fees, director fees).</p>
                        <p>• <strong>RCM u/s 9(4):</strong> Levy of reverse charge on supplies from unregistered suppliers to specific classes of registered persons.</p>
                      </div>
                    </div>
                  )}

                  {matchesSearch("Section 16 Eligibility conditions Input Tax Credit ITC Section 16(2) Section 16(4) 30th November") && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-900 font-mono text-xs font-black">
                          Section 16
                        </span>
                        <span className="text-[10px] font-black uppercase text-emerald-600">ITC conditions</span>
                      </div>
                      <h5 className="text-sm font-black text-slate-900 leading-snug">
                        Eligibility & Conditions for Claiming Input Tax Credit
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        Sets forth strict conditions to claim Input Tax Credit (ITC):
                      </p>
                      <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-[11px] text-slate-700 font-bold border border-slate-100">
                        <p>• <strong>Four Golden Rules u/s 16(2):</strong> (a) Possession of tax invoice, (b) Receipt of goods/services, (c) Tax actually paid by supplier to Government, (d) Return filed u/s 39.</p>
                        <p>• <strong>Time Limit u/s 16(4):</strong> No ITC can be claimed after <strong>30th November</strong> of the following financial year, or date of filing relevant Annual Return (whichever is earlier).</p>
                      </div>
                    </div>
                  )}

                  {matchesSearch("Section 17(5) Blocked credits motor vehicles catering insurance health club") && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-900 font-mono text-xs font-black">
                          Section 17(5)
                        </span>
                        <span className="text-[10px] font-black uppercase text-rose-600">Blocked Credits</span>
                      </div>
                      <h5 className="text-sm font-black text-slate-900 leading-snug">
                        Statutory Blocked Credits (No ITC)
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        Lists expenses on which Input Tax Credit is strictly blocked by law:
                      </p>
                      <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-[11px] text-slate-700 font-bold border border-slate-100">
                        <p>• <strong>Blockings:</strong> Motor vehicles (passenger capacity ≤ 13, except for training/supply), food and beverages, outdoor catering, beauty treatment, life insurance, and health club memberships.</p>
                        <p>• <strong>Works Contract:</strong> Blocked for immovable property construction, except when it is a supply of works contract service or for plant & machinery.</p>
                      </div>
                    </div>
                  )}

                  {matchesSearch("Rule 36(4) Rule 86B GSTR-2B 1% cash ledger output tax") && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-900 font-mono text-xs font-black">
                          Rules 36(4) & 86B
                        </span>
                        <span className="text-[10px] font-black uppercase text-amber-700">Crucial Rules</span>
                      </div>
                      <h5 className="text-sm font-black text-slate-900 leading-snug">
                        ITC Matching (Rule 36(4)) & Cash Limits (Rule 86B)
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        Strict operational boundaries introduced to check tax evasions:
                      </p>
                      <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-[11px] text-slate-700 font-bold border border-slate-100">
                        <p>• <strong>Rule 36(4):</strong> ITC can be claimed in GSTR-3B only if it is uploaded by the supplier and reflected in GSTR-2B (0% provisional credit is allowed on unmatched invoices).</p>
                        <p>• <strong>Rule 86B:</strong> Restricts use of ITC in Electronic Credit Ledger to discharge output tax. Taxpayer cannot pay more than <strong>99%</strong> of output liability using ITC (must pay minimum 1% in cash) if taxable supply exceeds ₹50 Lakhs in a month.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 10. INCOME TAX RULES & SECTIONS REFERENCE */}
            {activeTab === 'ItRules' && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-200 rounded-3xl p-5 flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-amber-500 text-white flex items-center justify-center text-2xl shrink-0 shadow-md">
                    💼
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-black text-amber-950 uppercase tracking-tight">
                        Statutory Reference: Income Tax Sections & Rules
                      </h4>
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded border border-amber-300">
                        Income Tax Act 1961
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed mt-1">
                      Quick statutory reference for Income Tax Act, 1961 covering mandatory audits, presumptive taxation benefits, and standard return timelines.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {matchesSearch("Section 44AB Tax Audit mandatory turnover ₹10 Crores ₹2 Crores Form 3CA 3CD 3CB 30th September") && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="px-2.5 py-1 rounded bg-indigo-100 text-indigo-900 font-mono text-xs font-black">
                          Section 44AB
                        </span>
                        <span className="text-[10px] font-black uppercase text-indigo-600">Tax Audit</span>
                      </div>
                      <h5 className="text-sm font-black text-slate-900 leading-snug">
                        Mandatory Tax Audit Provisions
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        Mandated for specific businesses and professionals to file audit reports certified by chartered accountants:
                      </p>
                      <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-[11px] text-slate-700 font-bold border border-slate-100">
                        <p>• <strong>General Business:</strong> Turnover exceeds <strong>₹2 Crores</strong>.</p>
                        <p>• <strong>Digital Business:</strong> Turnover exceeds <strong>₹10 Crores</strong> (provided cash receipts and cash payments do not exceed 5% of total transactions).</p>
                        <p>• <strong>Professionals:</strong> Gross receipts exceed <strong>₹50 Lakhs</strong>.</p>
                        <p>• <strong>Due Date:</strong> Report in Form 3CA/3CD or 3CB/3CD must be filed by <strong>30th September</strong> of the assessment year.</p>
                      </div>
                    </div>
                  )}

                  {matchesSearch("Section 44AD presumptive taxation business turnover ₹2 Crores ₹3 Crores 8% 6% profit") && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-900 font-mono text-xs font-black">
                          Section 44AD
                        </span>
                        <span className="text-[10px] font-black uppercase text-emerald-600">Presumptive Business</span>
                      </div>
                      <h5 className="text-sm font-black text-slate-900 leading-snug">
                        Presumptive Taxation for Small Businesses
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        Allows eligible taxpayers to declare profits at minimum rates without maintaining detailed account books:
                      </p>
                      <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-[11px] text-slate-700 font-bold border border-slate-100">
                        <p>• <strong>Eligibility:</strong> Individual/HUF/Partnership with turnover <strong>≤ ₹2 Crores</strong> (extended to <strong>₹3 Crores</strong> if digital receipts are ≥ 95%).</p>
                        <p>• <strong>Presumed Income:</strong> Declared at <strong>8%</strong> of turnover (cash transactions) or <strong>6%</strong> of turnover (digital bank/UPI payments).</p>
                      </div>
                    </div>
                  )}

                  {matchesSearch("Section 44ADA presumptive taxation professional receipts ₹50 Lakhs ₹75 Lakhs 50% profit") && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="px-2.5 py-1 rounded bg-purple-100 text-purple-900 font-mono text-xs font-black">
                          Section 44ADA
                        </span>
                        <span className="text-[10px] font-black uppercase text-purple-600">Presumptive Prof</span>
                      </div>
                      <h5 className="text-sm font-black text-slate-900 leading-snug">
                        Presumptive Taxation for Professionals
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        Simplified income taxation for doctors, lawyers, engineers, accountants, and notified professionals:
                      </p>
                      <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-[11px] text-slate-700 font-bold border border-slate-100">
                        <p>• <strong>Eligibility:</strong> Gross receipts <strong>≤ ₹50 Lakhs</strong> (extended to <strong>₹75 Lakhs</strong> if cash receipts are ≤ 5%).</p>
                        <p>• <strong>Presumed Income:</strong> Declared at <strong>50%</strong> of the gross receipts as business profit.</p>
                      </div>
                    </div>
                  )}

                  {matchesSearch("Section 139 return filing due dates 31st July 31st October belated return revised return 31st December") && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-900 font-mono text-xs font-black">
                          Section 139
                        </span>
                        <span className="text-[10px] font-black uppercase text-rose-600">ITR timelines</span>
                      </div>
                      <h5 className="text-sm font-black text-slate-900 leading-snug">
                        Statutory Timelines for Return of Income
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        Strict statutory windows to avoid late fees (Section 234F):
                      </p>
                      <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-[11px] text-slate-700 font-bold border border-slate-100">
                        <p>• <strong>Non-Audit Due Date:</strong> <strong>31st July</strong> of the Assessment Year.</p>
                        <p>• <strong>Audit Due Date:</strong> <strong>31st October</strong> of the Assessment Year.</p>
                        <p>• <strong>Belated (139(4)) & Revised (139(5)):</strong> Can be filed up to <strong>31st December</strong> of the relevant Assessment Year.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </main>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Clientify Legal Tech • Statutory Compliance Vault
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 sm:px-6 sm:py-2.5 bg-slate-900 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md"
          >
            Close Manual
          </button>
        </div>

      </div>
    </div>
  );
};

export default LitigationGuidelinesModal;
