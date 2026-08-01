import React from 'react';
import { LitigationRecord, Client } from '../types';
import EditableCaseHistory from './EditableCaseHistory';
import { formatISOToDDMMYYYY } from '../dateUtils';

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
  if (!isOpen || !record) return null;

  const client = clients.find(c => c.id === record.clientId);
  const isNotice = record.category === 'Notice';
  const isAppeal = record.category === 'Appeal';
  const isTribunal = record.category === 'Tribunal';
  const isHighCourt = record.category === 'HighCourt' || record.category === 'High Court';

  const formatDisplayDate = (d?: string) => {
    if (!d) return 'N/A';
    return formatISOToDDMMYYYY(d);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Filed':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Demand':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'Drop':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      default:
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-3 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95">
        
        {/* Dark Premium Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-black text-[10px] uppercase tracking-wider">
                {record.category} Case Details
              </span>
              <span className={`px-2 py-0.5 rounded-md border font-black text-[10px] uppercase tracking-wider ${getStatusBadge(record.status)}`}>
                {record.status}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight truncate max-w-md">
              {record.clientName}
            </h3>
            <p className="text-xs font-mono text-slate-400 font-bold mt-0.5">
              Ref No: {record.referenceNo || 'N/A'}
            </p>
          </div>
          <div className="flex items-center gap-2">
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

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto no-scrollbar flex-1 text-slate-900">
          
          {/* Statutory Banner Cards */}
          {isNotice && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
              <span className="text-xl">📩</span>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide">GST Notice Statutory Overview</h4>
                  <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200 uppercase">
                    30 Days Statutory Limit
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                  Notice under <strong>Section {record.section || '73/74'}</strong>. Ensure formal DRC-06 / ASMT-11 reply is submitted within statutory deadline.
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
                  First Appeal before Appellate Authority filed in <strong>Form GST APL-01</strong>. Pre-deposit of 10% disputed tax is mandatory u/s 107(6).
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
                    20% Disputed Pre-Deposit
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                  Appellate Tribunal appeal filed in <strong>Form GST APL-05</strong> within 90 days of Order-in-Appeal communication u/s 112.
                </p>
              </div>
            </div>
          )}

          {isHighCourt && (
            <div className="bg-gradient-to-r from-slate-100 to-indigo-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
              <span className="text-xl">🏛️</span>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">High Court Appeal / Writ Petition Overview</h4>
                  <span className="text-[10px] font-black text-slate-800 bg-slate-200 px-2 py-0.5 rounded border border-slate-300 uppercase">
                    Section 117 • Art 226/227
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                  Appeal u/s 117 on substantial questions of law (180 days) or Constitutional Writ Petition under Article 226/227.
                </p>
              </div>
            </div>
          )}

          {/* Key Metric Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Entity GSTIN / PAN</p>
              <p className="text-sm font-black text-indigo-600 font-mono tracking-wide">
                {client?.gstProfile?.gstin || client?.itProfile?.pan || 'N/A'}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Filing No. / Filing Ref</p>
              <p className="text-sm font-black text-slate-900 font-mono">
                {record.filingNo ? (
                  <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-700">
                    {record.filingNo}
                  </span>
                ) : 'N/A'}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Section / Statutory Provision</p>
              <p className="text-sm font-black text-slate-900">
                {record.section ? `Section ${record.section}` : 'N/A'}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Tax Period / FY</p>
              <p className="text-sm font-black text-slate-900">{record.taxPeriod || 'N/A'}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Issued Notice / Order Date</p>
              <p className="text-sm font-black text-slate-900">{formatDisplayDate(record.issuedDate)}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Statutory Due Date</p>
              <p className={`text-sm font-black ${record.status === 'Pending' ? 'text-rose-600' : 'text-slate-900'}`}>
                {formatDisplayDate(record.dueDate)}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Reply / Filing Date</p>
              <p className="text-sm font-black text-slate-900">{formatDisplayDate(record.filedDate)}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Reply Reference / ARN</p>
              <p className="text-sm font-black text-emerald-700 font-mono">{record.replyReferenceNo || 'N/A'}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Adjudication / Order Date</p>
              <p className="text-sm font-black text-slate-900">{formatDisplayDate(record.orderDate)}</p>
            </div>
          </div>

          {/* Previous Notice / History Card */}
          {record.isReissued && (
            <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-200">
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <span>🔁</span>
                <span>Escalation / Preceding Case History</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Preceding Ref No</p>
                  <p className="text-xs font-black text-slate-800 font-mono">{record.previousNoticeRef || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Preceding Section</p>
                  <p className="text-xs font-black text-slate-800">{record.previousNoticeSection ? `Section ${record.previousNoticeSection}` : 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Editable Case History */}
          <EditableCaseHistory
            value={record.caseHistory || ''}
            onSave={async (val) => {
              record.caseHistory = val;
              if (onDataChange) onDataChange();
            }}
          />

          {/* Staff Remarks */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-1">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Staff Remarks & Internal Notes</p>
            <p className="text-xs font-medium text-slate-700 italic leading-relaxed whitespace-pre-wrap">
              {record.remarks || 'No internal remarks recorded.'}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
            GST Litigation Vault
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
