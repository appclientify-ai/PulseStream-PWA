
import React from 'react';
import { Client } from '../types';

interface GSTDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
}

const GSTDetailModal: React.FC<GSTDetailModalProps> = ({ isOpen, onClose, client }) => {
  if (!isOpen || !client) return null;

  const getStakeholderLabel = (constitution: string = 'Proprietorship') => {
    switch (constitution) {
      case 'Proprietorship': return 'Proprietor';
      case 'Partnership': return 'Partner';
      case 'HUF': return 'Member / Karta';
      case 'Company': return 'Director';
      case 'Trust': return 'Trustee';
      case 'Society': return 'Member';
      default: return 'Stakeholder';
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/70 backdrop-blur-xl p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl max-h-[95vh] bg-white rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase truncate">{client.tradeName || client.legalName}</h2>
            <p className="text-sm font-bold text-slate-500 mt-2 uppercase tracking-widest truncate">{client.legalName}</p>
          </div>
          <button onClick={onClose} className="h-11 w-11 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
          </button>
        </div>

        <div className="p-10 overflow-y-auto no-scrollbar flex-1 space-y-12">
          {/* 1. Compliance Overview */}
          <section className="space-y-6">
            <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 flex items-center gap-3">Compliance Overview <div className="h-px flex-1 bg-slate-100" /></h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">GSTIN Identity</p><p className="text-sm font-black text-indigo-600 font-mono tracking-widest uppercase">{client.gstProfile?.gstin}</p></div>
              <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">Status</p><p className={`text-sm font-black uppercase ${client.gstProfile?.gstStatus === 'Closed' ? 'text-red-600' : 'text-emerald-600'}`}>{client.gstProfile?.gstStatus || 'Active'}</p></div>
              <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">Registration Date</p><p className="text-sm font-black text-slate-900">{client.gstProfile?.regDate || '---'}</p></div>
              {client.gstProfile?.gstStatus === 'Closed' && (
                <div><p className="text-[9px] font-black uppercase text-rose-400 mb-1">Cancellation Date</p><p className="text-sm font-black text-rose-600">{client.gstProfile?.cancelDate || '---'}</p></div>
              )}
              <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">Tax Scheme</p><p className="text-sm font-black text-slate-900 uppercase">{client.gstProfile?.regType} ({client.gstProfile?.filingFreq})</p></div>
              <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">Constitution</p><p className="text-sm font-black text-slate-900 uppercase">{client.gstProfile?.constitution}</p></div>
              <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">Jurisdiction</p><p className="text-sm font-black text-slate-900 uppercase">{client.gstProfile?.jurisdictionType} ({client.gstProfile?.jurisdictionType === 'State' ? client.gstProfile?.sector : client.gstProfile?.range})</p></div>
              <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">Relationship</p><p className="text-sm font-black text-indigo-600 uppercase">{client.status}</p></div>
            </div>
          </section>

          {/* 2. Credentials Vault */}
          <section className="space-y-6">
            <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 flex items-center gap-3">Credentials Vault <div className="h-px flex-1 bg-slate-100" /></h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">GST Portal</p>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">User ID</p>
                  <p className="text-sm font-black text-slate-900 uppercase">{client.gstProfile?.username}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Password</p>
                  <p className="text-sm font-black text-indigo-600 tracking-widest">{client.gstProfile?.password}</p>
                </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">E-Way Bill</p>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">User ID</p>
                  <p className="text-sm font-black text-slate-900 uppercase">{client.gstProfile?.ewayBillId || '---'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Password</p>
                  <p className="text-sm font-black text-indigo-600 tracking-widest">{client.gstProfile?.ewayBillPass || '---'}</p>
                </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">GSTAT Portal</p>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">User ID</p>
                  <p className="text-sm font-black text-slate-900 uppercase">{client.gstProfile?.gstatId || '---'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Password</p>
                  <p className="text-sm font-black text-indigo-600 tracking-widest">{client.gstProfile?.gstatPass || '---'}</p>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Stakeholders */}
          <section className="space-y-6">
            <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 flex items-center gap-3">{getStakeholderLabel(client.gstProfile?.constitution)} Details <div className="h-px flex-1 bg-slate-100" /></h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.gstProfile?.stakeholders.map((s, idx) => (
                <div key={s.id} className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">#{idx + 1} {getStakeholderLabel(client.gstProfile?.constitution)}</p>
                    <p className="text-base font-black text-slate-900 uppercase">{s.name}</p>
                    <p className="text-[10px] font-bold text-slate-500 font-mono tracking-widest uppercase">{s.pan}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm font-black text-slate-700">{s.mobile}</p>
                    <p className="text-[10px] font-bold text-slate-400 lowercase">{s.itPassword}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Financial & Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <section className="space-y-6">
              <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 flex items-center gap-3">Financial Hub <div className="h-px flex-1 bg-slate-100" /></h4>
              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 grid grid-cols-2 gap-8">
                <div className="col-span-2"><p className="text-[9px] font-black uppercase text-slate-400 mb-1">Primary Bank</p><p className="text-sm font-black text-slate-900 uppercase">{client.bankDetails?.bankName || '---'}</p></div>
                <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">A/C Number</p><p className="text-sm font-black text-slate-900 font-mono tracking-tight">{client.bankDetails?.accountNo || '---'}</p></div>
                <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">IFSC Code</p><p className="text-sm font-black text-indigo-600 font-mono tracking-widest">{client.bankDetails?.ifsc || '---'}</p></div>
              </div>
            </section>
            
            <section className="space-y-6">
              <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 flex items-center gap-3">Contacts & History <div className="h-px flex-1 bg-slate-100" /></h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-50/30 p-6 rounded-2xl border border-indigo-100/50">
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Firm Accountant</p>
                  <p className="text-sm font-black text-slate-900 uppercase">{client.gstProfile?.accountantName || '---'}</p>
                  <p className="text-[10px] font-bold text-slate-500 mt-1">{client.gstProfile?.accountantMobile || '---'}</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Entity Primary</p>
                  <p className="text-sm font-black text-slate-900">{client.mobile}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 lowercase truncate">{client.email}</p>
                </div>
                <div className="col-span-2 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Internal Office Notes</p>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed italic">{client.remarks || 'No legacy history documented.'}</p>
                </div>
              </div>
            </section>
          </div>
        </div>

        <footer className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">Archived on {new Date(client.createdAt || Date.now()).toLocaleDateString()}</span>
          <button onClick={onClose} className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-2xl hover:bg-slate-900 transition-all">Close Review</button>
        </footer>
      </div>
    </div>
  );
};

export default GSTDetailModal;
