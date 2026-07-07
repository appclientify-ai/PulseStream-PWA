
import React, { useState } from 'react';
import { Client } from '../types';
import { formatDate } from '../exportUtils';

interface ITDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onEdit?: (client: Client) => void;
}

const ITDetailModal: React.FC<ITDetailModalProps> = ({ isOpen, onClose, client, onEdit }) => {
  if (!isOpen || !client) return null;

  const Field = ({ label, value, isMono = false, className = '' }: { label: string, value?: string | number, isMono?: boolean, className?: string }) => (
    <div className={`space-y-1 ${className}`}>
      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
      <div className={`min-h-[20px] text-sm font-bold text-slate-900 ${isMono ? 'font-mono tracking-wider' : ''} border-b border-slate-100 pb-1`}>
        {value || '---'}
      </div>
    </div>
  );

  const PasswordField = ({ label, value, className = '' }: { label: string, value?: string, className?: string }) => {
    const [show, setShow] = useState(false);
    return (
      <div className={`space-y-1 ${className}`}>
        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
        <div className="flex items-center justify-between border-b border-slate-100 pb-1">
          <div className="min-h-[20px] text-sm font-bold text-slate-900 font-mono tracking-wider">
            {value ? (show ? value : '••••••••') : '---'}
          </div>
          {value && (
            <button onClick={() => setShow(!show)} className="text-slate-400 hover:text-indigo-600 transition-colors ml-2">
              {show ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  const handlePortalLogin = () => {
    if (client.itProfile?.pan && client.itProfile?.password) {
      const loginUrl = `https://eportal.incometax.gov.in/iec/foservices/#/login`;
      window.open(loginUrl, '_blank');
      navigator.clipboard.writeText(client.itProfile.pan);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/70 backdrop-blur-xl p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl max-h-[95vh] bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
             <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
             </div>
             <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">IT Master Profile</h2>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Full Compliance Dossier</p>
             </div>
          </div>
          <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-colors">
            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 overflow-y-auto no-scrollbar flex-1 space-y-10">
          
          {/* 1. Administrative Control */}
          <section className="space-y-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">1. Administrative Control <div className="h-px flex-1 bg-slate-100" /></h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Field label="Lifecycle Status" value={client.status} />
            </div>
          </section>

          {/* 2. IT Credentials */}
          <section className="space-y-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">2. IT Credentials <div className="h-px flex-1 bg-slate-100" /></h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <Field label="PAN Identity" value={client.itProfile?.pan} isMono />
              <PasswordField label="Portal Password" value={client.itProfile?.password} />
              <div>
                <button onClick={handlePortalLogin} className="w-full h-[42px] bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-all shadow-md flex items-center justify-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                  Portal Login
                </button>
              </div>
            </div>
          </section>

          {/* 3. Entity Information */}
          <section className="space-y-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">3. Entity Information <div className="h-px flex-1 bg-slate-100" /></h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Legal Name (As per PAN)" value={client.legalName} />
              <Field label="Trade Name (Optional)" value={client.tradeName} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Field label="DOB / Incorporation" value={formatDate(client.itProfile?.dob)} />
              <Field label="Father's Name" value={client.itProfile?.fatherName} />
              <Field label="Mobile No" value={client.mobile} isMono />
              <Field label="Email Address" value={client.email} />
            </div>
          </section>

          {/* 4. Professional Profile */}
          <section className="space-y-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">4. Professional Profile <div className="h-px flex-1 bg-slate-100" /></h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Field label="Nature of Work" value={client.itProfile?.natureOfWork} />
              <Field label="Employment Type" value={client.itProfile?.employmentType} />
            </div>
          </section>

          {/* 5. Bank Details */}
          <section className="space-y-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">5. Bank Details <div className="h-px flex-1 bg-slate-100" /></h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <Field label="Bank Name" value={client.bankDetails?.bankName} />
              <Field label="A/C Number" value={client.bankDetails?.accountNo} isMono />
              <Field label="IFSC Code" value={client.bankDetails?.ifsc} isMono />
            </div>
          </section>

          {/* 6. Vault Remarks */}
          <section className="space-y-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">6. Vault Remarks <div className="h-px flex-1 bg-slate-100" /></h4>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 min-h-[100px]">
              <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap">{client.remarks || 'No legacy history documented.'}</p>
            </div>
          </section>

        </div>

        <footer className="px-8 py-6 border-t border-slate-100 bg-slate-50 flex justify-between shrink-0">
          {onEdit && (
            <button onClick={() => onEdit(client)} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-900 transition-all shadow-lg">Modify Profile</button>
          )}
          <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-all shadow-lg ml-auto">Close Profile</button>
        </footer>
      </div>
    </div>
  );
};

export default ITDetailModal;
