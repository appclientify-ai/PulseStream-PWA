
import React from 'react';
import { Client } from '../types';

interface ITDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
}

const ITDetailModal: React.FC<ITDetailModalProps> = ({ isOpen, onClose, client }) => {
  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/70 backdrop-blur-xl p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl max-h-[95vh] bg-white rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase truncate">{client.legalName}</h2>
            <p className="text-sm font-bold text-slate-500 mt-2 uppercase tracking-widest truncate">{client.tradeName || 'IT Dossier'}</p>
          </div>
          <button onClick={onClose} className="h-11 w-11 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
          </button>
        </div>

        <div className="p-10 overflow-y-auto no-scrollbar flex-1 space-y-12">
          {/* 1. Core Identity */}
          <section className="space-y-6">
            <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 flex items-center gap-3">Core Identity <div className="h-px flex-1 bg-slate-100" /></h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">PAN Identity</p><p className="text-sm font-black text-indigo-600 font-mono tracking-widest uppercase">{client.itProfile?.pan}</p></div>
              <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">DOB / Incorporation</p><p className="text-sm font-black text-slate-900 uppercase">{client.itProfile?.dob || '---'}</p></div>
              <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">Father's Name</p><p className="text-sm font-black text-slate-900 uppercase">{client.itProfile?.fatherName || '---'}</p></div>
              <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">Status</p><p className="text-sm font-black text-emerald-600 uppercase">{client.status}</p></div>
              <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">Mobile No</p><p className="text-sm font-black text-slate-900">{client.mobile}</p></div>
              <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">Email Address</p><p className="text-sm font-black text-slate-900 lowercase truncate">{client.email}</p></div>
            </div>
          </section>

          {/* 2. Credentials */}
          <section className="space-y-6">
            <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 flex items-center gap-3">Credentials <div className="h-px flex-1 bg-slate-100" /></h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">IT Portal</p>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">User ID (PAN)</p>
                  <p className="text-sm font-black text-slate-900 uppercase">{client.itProfile?.pan}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Password</p>
                  <p className="text-sm font-black text-indigo-600 tracking-widest">{client.itProfile?.password}</p>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Professional Profile */}
          <section className="space-y-6">
            <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 flex items-center gap-3">Professional Profile <div className="h-px flex-1 bg-slate-100" /></h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">Nature of Work</p><p className="text-sm font-black text-slate-900 uppercase">{client.itProfile?.natureOfWork}</p></div>
              {client.itProfile?.natureOfWork === 'Salaried' && (
                <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">Employment Type</p><p className="text-sm font-black text-slate-900 uppercase">{client.itProfile?.employmentType}</p></div>
              )}
              {(client.itProfile?.natureOfWork === 'Business' || client.itProfile?.natureOfWork === 'Profession') && (
                <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">Business Name</p><p className="text-sm font-black text-slate-900 uppercase">{client.itProfile?.businessName || '---'}</p></div>
              )}
            </div>
          </section>

          {/* 4. Financial & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <section className="space-y-6">
              <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 flex items-center gap-3">Bank Details <div className="h-px flex-1 bg-slate-100" /></h4>
              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 grid grid-cols-2 gap-8">
                <div className="col-span-2"><p className="text-[9px] font-black uppercase text-slate-400 mb-1">Primary Bank</p><p className="text-sm font-black text-slate-900 uppercase">{client.bankDetails?.bankName || '---'}</p></div>
                <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">A/C Number</p><p className="text-sm font-black text-slate-900 font-mono tracking-tight">{client.bankDetails?.accountNo || '---'}</p></div>
                <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">IFSC Code</p><p className="text-sm font-black text-indigo-600 font-mono tracking-widest">{client.bankDetails?.ifsc || '---'}</p></div>
              </div>
            </section>
            
            <section className="space-y-6">
              <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 flex items-center gap-3">Vault Remarks <div className="h-px flex-1 bg-slate-100" /></h4>
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 h-full">
                <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Internal History / Notes</p>
                <p className="text-xs font-medium text-slate-600 leading-relaxed italic">{client.remarks || 'No legacy history documented.'}</p>
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

export default ITDetailModal;
