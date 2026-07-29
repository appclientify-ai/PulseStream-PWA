import React, { useState } from 'react';

interface LitigationGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: 'Notice' | 'Appeal' | 'Tribunal' | 'HighCourt' | 'High Court' | string;
}

export const LitigationGuidelinesModal: React.FC<LitigationGuidelinesModalProps> = ({
  isOpen,
  onClose,
  initialCategory = 'Notice'
}) => {
  const normalizeCat = (cat?: string) => {
    if (!cat) return 'Notice';
    if (cat === 'HighCourt' || cat === 'High Court') return 'HighCourt';
    if (cat === 'Appeal') return 'Appeal';
    if (cat === 'Tribunal') return 'Tribunal';
    return 'Notice';
  };

  const [activeTab, setActiveTab] = useState<'Notice' | 'Appeal' | 'Tribunal' | 'HighCourt'>(
    normalizeCat(initialCategory) as any
  );
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95">
        
        {/* Header Bar */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-xl shadow-inner">
              ⚖️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400">
                  Statutory Reference Manual
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-extrabold text-[9px] uppercase">
                  CGST Act & Rules Guide
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Litigation Statutory Guidelines
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all shadow-sm"
            title="Close Guidelines"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6" />
            </svg>
          </button>
        </div>

        {/* Navigation Tabs & Quick Search */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1 bg-slate-200/70 rounded-2xl">
            <button
              onClick={() => setActiveTab('Notice')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'Notice'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
              }`}
            >
              <span>📩</span> GST Notices
            </button>
            <button
              onClick={() => setActiveTab('Appeal')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'Appeal'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
              }`}
            >
              <span>⚖️</span> First Appeals (Sec 107)
            </button>
            <button
              onClick={() => setActiveTab('Tribunal')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'Tribunal'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
              }`}
            >
              <span>🏛️</span> GSTAT Tribunal (Sec 112)
            </button>
            <button
              onClick={() => setActiveTab('HighCourt')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'HighCourt'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
              }`}
            >
              <span>⚖️</span> High Court & Writs
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Filter sections or terms..."
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

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto no-scrollbar flex-1 space-y-6 text-slate-900">
          
          {/* NOTICE TAB */}
          {activeTab === 'Notice' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Top Highlight Banner */}
              <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-200 rounded-3xl p-5 flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-2xl shrink-0 shadow-md">
                  📩
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-black text-amber-900 uppercase tracking-tight">
                      GST Notices & Scrutiny Framework
                    </h4>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border border-amber-300">
                      Standard Reply Time: 30 Days
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    Notices in GST are issued by revenue officers under statutory provisions for return discrepancy, audit, inspection, or non-payment of tax. Timely response in prescribed formats (ASMT-11, DRC-06) prevents adverse ex-parte best-judgment assessment orders.
                  </p>
                </div>
              </div>

              {/* Grid of Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Section 73 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-amber-400 transition-all">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-black text-xs font-mono">
                      Section 73
                    </span>
                    <span className="text-[10px] font-black uppercase text-slate-400">Non-Fraud Cases</span>
                  </div>
                  <h5 className="text-sm font-black text-slate-900">
                    Determination of Tax Not Paid / Short Paid / Erroneous Refund (Without Fraud)
                  </h5>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Issued where tax is not paid, short paid, or ITC is wrongly availed <strong>WITHOUT</strong> any intention of fraud, wilful misstatement, or suppression of facts.
                  </p>
                  <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-[11px] text-slate-700 font-semibold border border-slate-100">
                    <p>• <strong>Form:</strong> DRC-01A (Pre-SCN Intimation) / DRC-01 (Show Cause Notice)</p>
                    <p>• <strong>Reply Form:</strong> Form GST DRC-06 within 30 days</p>
                    <p>• <strong>Penalty:</strong> Nil if paid before SCN; 10% of tax or ₹10,000 (whichever is higher) upon order</p>
                    <p>• <strong>Limitation:</strong> SCN issued at least 3 months prior to order deadline (3 years from Annual Return due date)</p>
                  </div>
                </div>

                {/* Section 74 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-rose-400 transition-all">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-900 font-black text-xs font-mono">
                      Section 74
                    </span>
                    <span className="text-[10px] font-black uppercase text-rose-600">Fraud / Misstatement</span>
                  </div>
                  <h5 className="text-sm font-black text-slate-900">
                    Determination of Tax in Cases of Fraud, Wilful Misstatement or Suppression
                  </h5>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Invoked where tax evasion or wrongful ITC claims involve deliberate fraud, intentional misrepresentation, or deliberate suppression of material facts.
                  </p>
                  <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-[11px] text-slate-700 font-semibold border border-slate-100">
                    <p>• <strong>Form:</strong> Form GST DRC-01 (Show Cause Notice)</p>
                    <p>• <strong>Reply Form:</strong> Form GST DRC-06 within 30 days</p>
                    <p>• <strong>Penalty:</strong> 15% (if paid before SCN), 25% (if paid within 30 days of SCN), 50% (within 30 days of Order), 100% otherwise</p>
                    <p>• <strong>Limitation:</strong> SCN issued at least 6 months prior to order deadline (5 years from Annual Return due date)</p>
                  </div>
                </div>

                {/* Section 61 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-indigo-400 transition-all">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-900 font-black text-xs font-mono">
                      Section 61
                    </span>
                    <span className="text-[10px] font-black uppercase text-indigo-600">Scrutiny of Returns</span>
                  </div>
                  <h5 className="text-sm font-black text-slate-900">
                    Scrutiny of Returns (Form GST ASMT-10)
                  </h5>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Proper Officer scrutinizes GSTR-1, GSTR-3B, GSTR-2A/2B and flags discrepancies (e.g. GSTR-3B vs 2B ITC mismatch, turnover mismatch).
                  </p>
                  <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-[11px] text-slate-700 font-semibold border border-slate-100">
                    <p>• <strong>Notice Issued in:</strong> Form GST ASMT-10</p>
                    <p>• <strong>Reply Form:</strong> Form GST ASMT-11 within 30 days explaining discrepancies or accepting liability via DRC-03</p>
                    <p>• <strong>Closure:</strong> Acceptable explanation leads to closure order in Form GST ASMT-12</p>
                  </div>
                </div>

                {/* Section 129 & 130 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-purple-400 transition-all">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-900 font-black text-xs font-mono">
                      Section 129 & 130
                    </span>
                    <span className="text-[10px] font-black uppercase text-purple-600">E-Way Bill / Transit Detention</span>
                  </div>
                  <h5 className="text-sm font-black text-slate-900">
                    Detention, Seizure & Confiscation of Goods in Transit
                  </h5>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Invoked during interception of goods in transit due to missing/expired E-Way Bill or document discrepancies.
                  </p>
                  <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-[11px] text-slate-700 font-semibold border border-slate-100">
                    <p>• <strong>Form:</strong> MOV-06 (Detention), MOV-07 (Notice u/s 129), MOV-09 (Order)</p>
                    <p>• <strong>Penalty u/s 129:</strong> 200% of tax payable for taxable goods (or 50% of goods value for exempted)</p>
                    <p>• <strong>Timeline:</strong> Notice within 7 days of detention; Order within 7 days of notice</p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* FIRST APPEALS TAB */}
          {activeTab === 'Appeal' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-gradient-to-r from-indigo-600/10 via-blue-600/10 to-indigo-600/5 border border-indigo-200 rounded-3xl p-5 flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl shrink-0 shadow-md">
                  ⚖️
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-black text-indigo-950 uppercase tracking-tight">
                      First Appeals before Appellate Authority (Section 107)
                    </h4>
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border border-indigo-300">
                      Form GST APL-01
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    Any person aggrieved by an Adjudication Order passed by an Adjudicating Authority (e.g., DRC-07 order under Section 73/74) can file a First Appeal before the Appellate Authority (Joint Commissioner / Additional Commissioner / Commissioner Appeals).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Key Timelines & Form */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <h5 className="text-xs font-black uppercase text-indigo-600 tracking-wider">
                    1. Statutory Limitation & Condonation
                  </h5>
                  <div className="bg-slate-50 p-3.5 rounded-xl space-y-2 text-xs text-slate-700 font-medium border border-slate-100">
                    <p>• <strong>Standard Filing Time Limit:</strong> Within <strong>3 months (90 days)</strong> from the date of communication of the impugned order to the taxpayer.</p>
                    <p>• <strong>Delay Condonation u/s 107(4):</strong> The Appellate Authority can condone delay of up to <strong>1 additional month (30 days)</strong> if sufficient cause is demonstrated.</p>
                    <p>• <strong>Departmental Appeal u/s 107(2):</strong> Commissioner may direct a subordinate officer to appeal within <strong>6 months</strong> from order date.</p>
                  </div>
                </div>

                {/* Pre-Deposit Requirement */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <h5 className="text-xs font-black uppercase text-emerald-600 tracking-wider">
                    2. Mandatory Pre-Deposit & Stay of Demand
                  </h5>
                  <div className="bg-slate-50 p-3.5 rounded-xl space-y-2 text-xs text-slate-700 font-medium border border-slate-100">
                    <p>• <strong>Full Payment:</strong> 100% of admitted tax, interest, fine, fee, and penalty arising from the order.</p>
                    <p>• <strong>Disputed Tax Pre-Deposit:</strong> A sum equal to <strong>10% of the remaining disputed tax amount</strong> (capped at ₹25 Crore CGST and ₹25 Crore SGST / UTGST).</p>
                    <p>• <strong>Automatic Stay u/s 107(7):</strong> Upon payment of the mandatory 10% pre-deposit, recovery proceedings for the balance 90% demand stand <strong>deemed stayed</strong> automatically.</p>
                  </div>
                </div>

                {/* Mandatory Procedure & Documents */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 md:col-span-2">
                  <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                    3. Filing Procedure & Verification Checklist
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700 font-medium">
                    <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                      <p className="font-black text-indigo-900 mb-1">Step A: Online Filing</p>
                      <p className="text-[11px] text-slate-600">Submit Form GST APL-01 electronically on the GST Portal along with Statement of Facts (SOF) and Grounds of Appeal (GOA).</p>
                    </div>
                    <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                      <p className="font-black text-indigo-900 mb-1">Step B: Certified Copy</p>
                      <p className="text-[11px] text-slate-600">Submit a certified copy of the order within 7 days of online filing to obtain final Acknowledgment (GST APL-02).</p>
                    </div>
                    <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                      <p className="font-black text-indigo-900 mb-1">Step C: Order Outcome</p>
                      <p className="text-[11px] text-slate-600">Appellate Authority issues final Order-in-Appeal (OIA) under Section 107(11) within 1 year of appeal filing.</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TRIBUNAL TAB */}
          {activeTab === 'Tribunal' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-purple-600/5 border border-purple-200 rounded-3xl p-5 flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-2xl shrink-0 shadow-md">
                  🏛️
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-black text-purple-950 uppercase tracking-tight">
                      GST Appellate Tribunal - GSTAT (Section 112 & 113)
                    </h4>
                    <span className="bg-purple-100 text-purple-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border border-purple-300">
                      Section 112 • Form GST APL-05
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    Appeals against Order-in-Appeal passed under Section 107 or Revisional Order passed under Section 108 lie before the GST Appellate Tribunal (GSTAT) under <strong>Section 112 of CGST Act, 2017</strong>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Filing Provisions */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-black uppercase text-purple-700 tracking-wider">
                      1. Governing Section & Time Limit
                    </h5>
                    <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-900 font-mono text-[10px] font-bold">
                      u/s 112(1)
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl space-y-2 text-xs text-slate-700 font-medium border border-slate-100">
                    <p>• <strong>Statutory Forum:</strong> GST Appellate Tribunal (GSTAT Principal / State Benches)</p>
                    <p>• <strong>Prescribed Form:</strong> Form GST APL-05</p>
                    <p>• <strong>Limitation Period:</strong> Within <strong>3 months (90 days)</strong> from the date on which the order sought to be appealed against is communicated.</p>
                    <p>• <strong>Condonation of Delay u/s 112(6):</strong> GSTAT may admit an appeal after the 3-month period up to an additional <strong>3 months (90 days / total 180 days)</strong> if satisfied that there was sufficient cause.</p>
                  </div>
                </div>

                {/* Pre-Deposit */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-black uppercase text-purple-700 tracking-wider">
                      2. Mandatory Pre-Deposit u/s 112(8)
                    </h5>
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 font-mono text-[10px] font-bold">
                      20% Additional
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl space-y-2 text-xs text-slate-700 font-medium border border-slate-100">
                    <p>• <strong>First Appeal Pre-deposit:</strong> 10% already paid during First Appeal under Section 107.</p>
                    <p>• <strong>Tribunal Additional Pre-deposit:</strong> A further sum equal to <strong>20% of the remaining disputed tax amount</strong> (capped at ₹50 Crore CGST / SGST).</p>
                    <p>• <strong>Cumulative Total Pre-deposit:</strong> Total <strong>30% of disputed tax demand</strong> paid across First Appeal & GSTAT.</p>
                    <p>• <strong>Automatic Stay u/s 112(9):</strong> On payment of 20% pre-deposit, recovery of balance demand remains stayed until appeal disposal.</p>
                  </div>
                </div>

                {/* Cross Objections & Dept Appeals */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 md:col-span-2">
                  <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                    3. Memorandum of Cross-Objections & Orders of Tribunal
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 font-medium">
                    <div className="bg-purple-50/50 p-3.5 rounded-xl border border-purple-100">
                      <p className="font-black text-purple-900 mb-1">Memorandum of Cross-Objections (Form GST APL-06)</p>
                      <p className="text-[11px] text-slate-600">Respondent can file Memorandum of Cross-Objections within 45 days of receipt of notice of appeal. Disposed of as if it were an appeal filed within limitation.</p>
                    </div>
                    <div className="bg-purple-50/50 p-3.5 rounded-xl border border-purple-100">
                      <p className="font-black text-purple-900 mb-1">Order of Appellate Tribunal (Section 113)</p>
                      <p className="text-[11px] text-slate-600">GSTAT may confirm, modify, or annul the decision, or refer back the case. Order to be passed ordinarily within 1 year from filing date.</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* HIGH COURT TAB */}
          {activeTab === 'HighCourt' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-gradient-to-r from-slate-900/10 via-indigo-900/10 to-slate-900/5 border border-slate-300 rounded-3xl p-5 flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl shrink-0 shadow-md">
                  ⚖️
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-black text-slate-950 uppercase tracking-tight">
                      High Court Appeals & Constitutional Writ Jurisdiction
                    </h4>
                    <span className="bg-slate-200 text-slate-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border border-slate-300">
                      Sec 117 & Art 226/227
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    Appeals against GSTAT State Bench orders lie before the High Court under <strong>Section 117 of CGST Act</strong> on substantial questions of law. Additionally, Constitutional Writs under <strong>Article 226 & 227</strong> can be invoked directly against unconstitutional provisions or natural justice violations.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Section 117 Appeal */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-black text-xs font-mono">
                      Section 117
                    </span>
                    <span className="text-[10px] font-black uppercase text-indigo-600">Statutory Appeal</span>
                  </div>
                  <h5 className="text-sm font-black text-slate-900">
                    Appeal to High Court on Substantial Question of Law
                  </h5>
                  <div className="bg-slate-50 p-3.5 rounded-xl space-y-1.5 text-[11px] text-slate-700 font-medium border border-slate-100">
                    <p>• <strong>Condition:</strong> High Court must be satisfied that the case involves a <strong>substantial question of law</strong>.</p>
                    <p>• <strong>Limitation Period:</strong> Within <strong>180 days</strong> from the date of communication of GSTAT order.</p>
                    <p>• <strong>Bench Structure:</strong> Heard by a Division Bench (minimum 2 Judges) of the High Court.</p>
                    <p>• <strong>Condonation:</strong> High Court may admit appeal after 180 days if satisfied with sufficient cause.</p>
                  </div>
                </div>

                {/* Article 226 & 227 Writs */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-900 text-white font-black text-xs font-mono">
                      Article 226 & 227
                    </span>
                    <span className="text-[10px] font-black uppercase text-indigo-600">Writ Jurisdiction</span>
                  </div>
                  <h5 className="text-sm font-black text-slate-900">
                    Extraordinary Writ Petitions (Certiorari / Mandamus)
                  </h5>
                  <div className="bg-slate-50 p-3.5 rounded-xl space-y-1.5 text-[11px] text-slate-700 font-medium border border-slate-100">
                    <p>• <strong>Grounds for Invoking:</strong> Violation of Principles of Natural Justice (Audi Alteram Partem), Total lack of statutory jurisdiction, Violation of Fundamental Rights, or Ultra Vires rules.</p>
                    <p>• <strong>Maintainability:</strong> Allowed even without exhausting statutory remedies when orders are demonstrably arbitrary or passed without opportunity of hearing.</p>
                  </div>
                </div>

                {/* Section 118 Supreme Court */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 md:col-span-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-black text-xs font-mono">
                      Section 118
                    </span>
                    <span className="text-[10px] font-black uppercase text-amber-700">Supreme Court Appeal</span>
                  </div>
                  <h5 className="text-sm font-black text-slate-900">
                    Appeal to Supreme Court of India
                  </h5>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    An appeal lies directly to the Supreme Court from: (a) Any judgment or order passed by the High Court in an appeal u/s 117 certified to be fit for appeal to SC, or (b) Any order passed by the National / Regional Benches of GSTAT involving disputes regarding place of supply.
                  </p>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Clientify Legal Tech • Statutory Compliance Vault
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md"
          >
            Close Manual
          </button>
        </div>

      </div>
    </div>
  );
};

export default LitigationGuidelinesModal;
