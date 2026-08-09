import React, { useState } from 'react';
import { LitigationRecord, Client } from '../types';
import EditableCaseHistory from './EditableCaseHistory';
import { formatISOToDDMMYYYY } from '../dateUtils';
import { api } from '../services/api';
import { toast } from 'sonner';

interface LitigationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: LitigationRecord | null;
  clients?: Client[];
  onEdit?: (record: LitigationRecord) => void;
  onDataChange?: () => void;
}

export const LitigationDetailModal: React.FC<LitigationDetailModalProps> = ({
  isOpen,
  onClose,
  record,
  clients = [],
  onEdit,
  onDataChange
}) => {
  const [isSavingRemarks, setIsSavingRemarks] = useState(false);
  const [editingRemarks, setEditingRemarks] = useState(false);
  const [remarksText, setRemarksText] = useState('');

  if (!isOpen || !record) return null;

  const client = clients.find(c => c.id === record.clientId);
  const category = record.category || 'Notice';
  const isNotice = category === 'Notice';
  const isAppeal = category === 'Appeal';
  const isTribunal = category === 'Tribunal';
  const isHighCourt = category === 'HighCourt' || category === 'High Court';

  const formatDisplayDate = (d?: string) => {
    if (!d) return 'N/A';
    return formatISOToDDMMYYYY(d);
  };

  const getDaysLeft = (dueDateStr?: string) => {
    if (!dueDateStr) return null;
    const cleanStr = dueDateStr.split('T')[0];
    const parts = cleanStr.split(/[-/]/);
    let d: Date | null = null;
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else if (parts[2].length === 4) {
        d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      }
    }
    if (!d || isNaN(d.getTime())) d = new Date(dueDateStr);
    if (isNaN(d.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    const diffTime = d.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysLeft(record.dueDate);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Filed':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Demand':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'Drop':
      case 'Dropped':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      default:
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    }
  };

  const getCategoryStatusLabel = (status: string) => {
    if (isNotice) {
      if (status === 'Pending') return 'Pending Reply';
      if (status === 'Filed') return 'Reply Filed';
      if (status === 'Demand') return 'Demand Raised';
      if (status === 'Drop' || status === 'Dropped') return 'Case Dropped';
    } else if (isAppeal) {
      if (status === 'Pending') return 'Pending Appeal Filing';
      if (status === 'Filed') return 'Appeal Filed (APL-01)';
      if (status === 'Demand') return 'Order Passed';
      if (status === 'Drop' || status === 'Dropped') return 'Appeal Allowed';
    } else if (isTribunal) {
      if (status === 'Pending') return 'Pending Tribunal Filing';
      if (status === 'Filed') return 'Tribunal Filed (APL-05)';
      if (status === 'Demand') return 'Order Sustained';
      if (status === 'Drop' || status === 'Dropped') return 'Tribunal Relief Granted';
    } else if (isHighCourt) {
      if (status === 'Pending') return 'Pending Writ / Petition';
      if (status === 'Filed') return 'Petition Filed in HC';
      if (status === 'Demand') return 'Demand Sustained';
      if (status === 'Drop' || status === 'Dropped') return 'HC Relief Granted';
    }
    return status;
  };

  const handleSaveRemarks = async () => {
    setIsSavingRemarks(true);
    try {
      await api.saveLitigationRecord({ ...record, remarks: remarksText });
      record.remarks = remarksText;
      setEditingRemarks(false);
      toast.success('Remarks updated successfully!');
      if (onDataChange) onDataChange();
    } catch (err) {
      console.error('Failed to update remarks:', err);
      toast.error('Failed to update remarks');
    } finally {
      setIsSavingRemarks(false);
    }
  };

  const handleSaveHistory = async (val: string) => {
    try {
      await api.saveLitigationRecord({ ...record, caseHistory: val });
      record.caseHistory = val;
      toast.success('Case history updated successfully!');
      if (onDataChange) onDataChange();
    } catch (err) {
      console.error('Failed to update case history:', err);
      toast.error('Failed to update case history');
    }
  };

  const tradeName = client?.tradeName || record.clientName;
  const legalName = client?.legalName;
  const gstin = client?.gstProfile?.gstin;
  const pan = client?.itProfile?.pan || client?.gstProfile?.pan;
  const mobile = client?.mobile;
  const email = client?.email;
  const address = client?.address || client?.gstProfile?.address;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-3 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95">
        
        {/* Dark Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-black text-[10px] uppercase tracking-wider">
                {category} Case Vault
              </span>
              <span className={`px-2.5 py-0.5 rounded-md border font-black text-[10px] uppercase tracking-wider ${getStatusBadge(record.status)}`}>
                {getCategoryStatusLabel(record.status)}
              </span>
              {record.isReissued && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-black text-[10px] uppercase">
                  Escalated Case
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
              {tradeName}
            </h3>
            <p className="text-xs font-mono text-slate-400 font-bold mt-0.5 flex items-center gap-2 flex-wrap">
              <span>Ref No: <strong className="text-indigo-300">{record.referenceNo || 'N/A'}</strong></span>
              {record.filingNo && <span>• Filing No: <strong className="text-slate-200">{record.filingNo}</strong></span>}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(record);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <span>✏️</span>
                <span className="hidden sm:inline">Modify Record</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto no-scrollbar flex-1 text-slate-900">
          
          {/* Statutory Banner */}
          {isNotice && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
              <span className="text-xl">📩</span>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide">GST Notice Statutory Overview</h4>
                  <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200 uppercase">
                    30 Days Statutory Reply Limit
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                  Notice under <strong>Section {record.section || '73/74'}</strong>. Formal reply in Form DRC-06 or ASMT-11 must be submitted on the GST Portal within statutory timelines.
                </p>
              </div>
            </div>
          )}

          {isAppeal && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
              <span className="text-xl">⚖️</span>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wide">GST First Appeal Overview (Section 107)</h4>
                  <span className="text-[10px] font-black text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 uppercase">
                    10% Disputed Pre-Deposit
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                  First Appeal against Adjudication Order before the Appellate Authority in <strong>Form GST APL-01</strong>. Pre-deposit of 10% disputed tax is mandatory u/s 107(6).
                </p>
              </div>
            </div>
          )}

          {isTribunal && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
              <span className="text-xl">🏛️</span>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <h4 className="text-xs font-black text-purple-900 uppercase tracking-wide">GSTAT Tribunal Appeal Overview (Section 112)</h4>
                  <span className="text-[10px] font-black text-purple-800 bg-purple-100 px-2 py-0.5 rounded border border-purple-200 uppercase">
                    20% Additional Pre-Deposit
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                  Appeal before GST Appellate Tribunal (GSTAT) filed in <strong>Form GST APL-05</strong> within 90 days of Order-in-Appeal communication.
                </p>
              </div>
            </div>
          )}

          {isHighCourt && (
            <div className="bg-gradient-to-r from-slate-100 to-indigo-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
              <span className="text-xl">🏛️</span>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">High Court Litigation / Writ Petition Overview</h4>
                  <span className="text-[10px] font-black text-slate-800 bg-slate-200 px-2 py-0.5 rounded border border-slate-300 uppercase">
                    Section 117 • Article 226/227
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                  Statutory Appeal u/s 117 on substantial questions of law (180 days) or Constitutional Writ Petition under Article 226/227.
                </p>
              </div>
            </div>
          )}

          {/* SECTION 1: Taxpayer / Client Information Card */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                1. Taxpayer & Entity Details
              </h4>
              {gstin && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(gstin);
                    toast.success('GSTIN Copied!');
                    window.open('https://services.gst.gov.in/services/searchtp', '_blank');
                  }}
                  className="text-[10px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 uppercase"
                >
                  <span>🔍 Verify on GST Portal</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                <p className="text-[10px] font-black uppercase text-slate-400">Trade / Business Name</p>
                <p className="text-xs font-black text-slate-900 truncate" title={tradeName}>{tradeName}</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                <p className="text-[10px] font-black uppercase text-slate-400">Legal Entity Name</p>
                <p className="text-xs font-black text-slate-800 truncate" title={legalName || 'N/A'}>{legalName || 'N/A'}</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                <p className="text-[10px] font-black uppercase text-slate-400">GSTIN / Identification</p>
                <p className="text-xs font-black font-mono text-indigo-600 tracking-wide">{gstin || 'N/A'}</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                <p className="text-[10px] font-black uppercase text-slate-400">PAN Number</p>
                <p className="text-xs font-black font-mono text-slate-800">{pan || 'N/A'}</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                <p className="text-[10px] font-black uppercase text-slate-400">Contact Mobile</p>
                <p className="text-xs font-bold font-mono text-slate-800">{mobile || 'N/A'}</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                <p className="text-[10px] font-black uppercase text-slate-400">Email Address</p>
                <p className="text-xs font-bold text-slate-800 truncate" title={email || 'N/A'}>{email || 'N/A'}</p>
              </div>

              {client?.gstProfile && (
                <>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                    <p className="text-[10px] font-black uppercase text-slate-400">Registration Type & Freq</p>
                    <p className="text-xs font-bold text-slate-800">
                      {client.gstProfile.regType || 'Regular'} • {client.gstProfile.filingFreq || 'Monthly'}
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                    <p className="text-[10px] font-black uppercase text-slate-400">Jurisdiction & Constitution</p>
                    <p className="text-xs font-bold text-slate-800">
                      {client.gstProfile.constitution || 'Proprietorship'} ({client.gstProfile.jurisdictionType || 'State'})
                    </p>
                  </div>
                </>
              )}

              {address && (
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 col-span-1 sm:col-span-2 md:col-span-3">
                  <p className="text-[10px] font-black uppercase text-slate-400">Principal Business Address</p>
                  <p className="text-xs font-medium text-slate-700">{address}</p>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: Case Specifications & Statutory Provisions */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-200/80 pb-2">
              <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              2. {category} Specifications & Provisions
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                <p className="text-[10px] font-black uppercase text-slate-400">Act / Section / Form</p>
                <p className="text-xs font-black text-indigo-700 uppercase">
                  {record.section ? (record.section.startsWith('APL') || record.section.startsWith('Art') ? record.section : `Section ${record.section}`) : 'N/A'}
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                <p className="text-[10px] font-black uppercase text-slate-400">Tax Period / FY</p>
                <p className="text-xs font-black text-slate-900 uppercase">{record.taxPeriod || 'N/A'}</p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                <p className="text-[10px] font-black uppercase text-slate-400 truncate">
                  {isHighCourt ? 'Impugned Order Ref' : isTribunal ? 'OIA No / Ref' : isAppeal ? 'OIO / Notice Ref' : 'Notice Ref / DIN'}
                </p>
                <p className="text-xs font-black font-mono text-slate-900 uppercase truncate" title={record.referenceNo}>{record.referenceNo || 'N/A'}</p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                <p className="text-[10px] font-black uppercase text-slate-400">Filing Reference No</p>
                <p className="text-xs font-black font-mono text-slate-900 uppercase">{record.filingNo || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* SECTION 3: Key Timelines & Statutory Deadlines */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                3. Key Timelines & Statutory Deadlines
              </h4>

              {record.status === 'Pending' && daysLeft !== null && (
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${
                  daysLeft < 0 
                    ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' 
                    : daysLeft <= 7 
                    ? 'bg-amber-50 text-amber-700 border-amber-200' 
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {daysLeft < 0 
                    ? `${Math.abs(daysLeft)} Days Overdue` 
                    : daysLeft === 0 
                    ? 'Due Today!' 
                    : `${daysLeft} Days Remaining`}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                <p className="text-[10px] font-black uppercase text-slate-400">
                  {isHighCourt ? 'Impugned Order Date' : isTribunal ? 'OIA Date' : isAppeal ? 'OIO Date' : 'Issued Date'}
                </p>
                <p className="text-xs font-black text-slate-900 font-mono">{formatDisplayDate(record.issuedDate)}</p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                <p className="text-[10px] font-black uppercase text-red-600">
                  {isHighCourt ? 'HC Petition Deadline' : isTribunal ? 'Tribunal Filing Deadline' : isAppeal ? 'Appeal Filing Deadline' : 'Statutory Due Date'}
                </p>
                <p className="text-xs font-black text-red-600 font-mono">{formatDisplayDate(record.dueDate)}</p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                <p className="text-[10px] font-black uppercase text-slate-400">
                  {isHighCourt ? 'HC Filing Date' : isTribunal ? 'Tribunal Filing Date' : isAppeal ? 'APL-01 Filing Date' : 'Reply Filed Date'}
                </p>
                <p className="text-xs font-black text-emerald-700 font-mono">{formatDisplayDate(record.filedDate)}</p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                <p className="text-[10px] font-black uppercase text-slate-400">
                  {isHighCourt ? 'WP / Appeal Case No' : isTribunal ? 'APL-05 ARN / GSTAT No' : isAppeal ? 'APL-01 ARN' : 'Reply ARN / DRC-06 Ref'}
                </p>
                <p className="text-xs font-black font-mono text-emerald-700 uppercase">{record.replyReferenceNo || 'N/A'}</p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                <p className="text-[10px] font-black uppercase text-slate-400">
                  {isHighCourt ? 'HC Judgment Date' : isTribunal ? 'Tribunal Order Date' : isAppeal ? 'Appellate Order Date' : 'Order / Relief Date'}
                </p>
                <p className="text-xs font-black text-slate-900 font-mono">{formatDisplayDate(record.orderDate)}</p>
              </div>

              {record.hearingDate && (
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                  <p className="text-[10px] font-black uppercase text-indigo-600">Scheduled Hearing Date</p>
                  <p className="text-xs font-black text-indigo-600 font-mono">{formatDisplayDate(record.hearingDate)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Preceding History / Escalation Trail */}
          {(record.isReissued || record.previousNoticeRef || record.previousNoticeSection || record.oioRefNo || record.aioArn) && (
            <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200/80 space-y-2">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                <span>🔁</span>
                <span>Preceding Case History & Escalation Trail</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-indigo-100">
                {record.previousNoticeRef && (
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Preceding Ref No</p>
                    <p className="text-xs font-black font-mono text-slate-800">{record.previousNoticeRef}</p>
                  </div>
                )}
                {record.previousNoticeSection && (
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Preceding Section</p>
                    <p className="text-xs font-black text-slate-800">Section {record.previousNoticeSection}</p>
                  </div>
                )}
                {record.oioRefNo && (
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Order-In-Original Ref</p>
                    <p className="text-xs font-black font-mono text-slate-800">{record.oioRefNo} ({formatDisplayDate(record.oioDate)})</p>
                  </div>
                )}
                {record.aioArn && (
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Order-In-Appeal ARN</p>
                    <p className="text-xs font-black font-mono text-slate-800">{record.aioArn} ({formatDisplayDate(record.aioDate)})</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 5: Editable Case History & Grounds */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
              {isHighCourt ? 'Writ Petition Grounds & Bench Proceedings' : isTribunal ? 'Tribunal Appeal Grounds & Proceedings' : isAppeal ? 'Appeal Grounds & Hearing History' : 'Case History & Proceedings'}
            </h4>
            <EditableCaseHistory
              value={record.caseHistory || ''}
              onSave={handleSaveHistory}
            />
          </div>

          {/* SECTION 6: Staff Remarks & Internal Notes */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Staff Remarks & Internal Office Notes
              </h4>
              {!editingRemarks ? (
                <button
                  type="button"
                  onClick={() => {
                    setRemarksText(record.remarks || '');
                    setEditingRemarks(true);
                  }}
                  className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
                >
                  Edit Remarks
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSavingRemarks}
                    onClick={() => setEditingRemarks(false)}
                    className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSavingRemarks}
                    onClick={handleSaveRemarks}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
                  >
                    {isSavingRemarks ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {!editingRemarks ? (
              <p className="text-xs font-medium text-slate-700 italic leading-relaxed whitespace-pre-wrap bg-white p-3.5 rounded-xl border border-slate-200/80">
                {record.remarks ? record.remarks : <span className="text-slate-400">No internal staff remarks recorded.</span>}
              </p>
            ) : (
              <textarea
                value={remarksText}
                onChange={(e) => setRemarksText(e.target.value)}
                rows={3}
                placeholder="Enter internal office remarks, team assignments, or follow-up notes..."
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all resize-y"
              />
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
            GST Litigation Vault • {category} Module
          </span>
          <div className="flex items-center gap-3">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(record);
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
              >
                Modify Case
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs uppercase tracking-wider transition-all"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LitigationDetailModal;
