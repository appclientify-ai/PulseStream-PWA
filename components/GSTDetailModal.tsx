
import React, { useState } from 'react';
import { Client } from '../types';
import { formatDate } from '../exportUtils';

interface GSTDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onEdit?: (client: Client) => void;
}

const GSTDetailModal: React.FC<GSTDetailModalProps> = ({ isOpen, onClose, client, onEdit }) => {
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

  const Field = ({ label, value, isMono = false, className = '', action }: { label: string, value?: string | number, isMono?: boolean, className?: string, action?: React.ReactNode }) => (
    <div className={`space-y-1 ${className}`}>
      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
      <div className={`flex items-center justify-between min-h-[20px] text-sm font-bold text-slate-900 ${isMono ? 'font-mono tracking-wider' : ''} border-b border-slate-100 pb-1`}>
        <span>{value || '---'}</span>
        {action && <div className="ml-2">{action}</div>}
      </div>
    </div>
  );

  const PasswordField = ({ label, value, className = '', action }: { label: string, value?: string, className?: string, action?: React.ReactNode }) => {
    const [show, setShow] = useState(false);
    return (
      <div className={`space-y-1 ${className}`}>
        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
        <div className="flex items-center justify-between border-b border-slate-100 pb-1">
          <div className="min-h-[20px] text-sm font-bold text-slate-900 font-mono tracking-wider">
            {value ? (show ? value : '••••••••') : '---'}
          </div>
          <div className="flex items-center gap-2 ml-2">
            {value && (
              <button onClick={() => setShow(!show)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                {show ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            )}
            {action && <div>{action}</div>}
          </div>
        </div>
      </div>
    );
  };

  const handleSearchTaxpayer = (gstin?: string) => {
    if (gstin) {
      window.open(`https://services.gst.gov.in/services/searchtp?gstin=${gstin}`, '_blank');
    }
  };

  const handleLogin = (username?: string, password?: string) => {
    if (username) {
      navigator.clipboard.writeText(username);
    }
    window.open('https://services.gst.gov.in/services/login', '_blank');
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/70 backdrop-blur-xl p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl max-h-[95vh] bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
             <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0c0 .884-.896 1.75-2 1.75s-2-.866-2-1.75" /></svg>
             </div>
             <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Client Master Profile</h2>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Full Compliance Dossier</p>
             </div>
          </div>
          <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-colors">
            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 overflow-y-auto no-scrollbar flex-1 space-y-10">
          
          {/* 1. Management Details */}
          <section className="space-y-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">1. Management Details <div className="h-px flex-1 bg-slate-100" /></h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Field label="Client Status" value={client.status} />
            </div>
          </section>

          {/* 2. GST Credentials */}
          <section className="space-y-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">2. GST Credentials <div className="h-px flex-1 bg-slate-100" /></h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Field 
                label="GSTIN" 
                value={client.gstProfile?.gstin} 
                isMono 
                action={
                  client.gstProfile?.gstin ? (
                    <button onClick={() => handleSearchTaxpayer(client.gstProfile?.gstin)} className="text-slate-400 hover:text-indigo-600 transition-colors" title="Search Taxpayer">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </button>
                  ) : null
                }
              />
              <Field label="PAN No." value={client.gstProfile?.pan} isMono />
              <Field label="GST User ID" value={client.gstProfile?.username} />
              <PasswordField 
                label="GST Password" 
                value={client.gstProfile?.password} 
                action={
                  client.gstProfile?.username ? (
                    <button onClick={() => handleLogin(client.gstProfile?.username, client.gstProfile?.password)} className="text-slate-400 hover:text-indigo-600 transition-colors" title="Login to GST Portal">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </button>
                  ) : null
                }
              />
            </div>
          </section>

          {/* 3. Business Information */}
          <section className="space-y-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">3. Business Information <div className="h-px flex-1 bg-slate-100" /></h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Trade Name" value={client.tradeName} />
              <Field label="Legal Name" value={client.legalName} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Field label="Mobile No" value={client.mobile} isMono />
              <Field label="Email Address" value={client.email} />
              <Field label="Client Address" value={client.address} className="md:col-span-1" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Field label="Business Type" value={client.gstProfile?.constitution} />
              <Field label="Taxpayer Type" value={client.gstProfile?.regType} />
              <Field label="Filing Frequency" value={client.gstProfile?.filingFreq} />
              <Field label="Jurisdiction" value={client.gstProfile?.jurisdictionType} />
              <Field label="Registration Date" value={formatDate(client.gstProfile?.regDate)} />
              <Field label="GSTN Status" value={client.gstProfile?.gstStatus} />
              <Field label="Sector" value={client.gstProfile?.jurisdictionType === 'State' ? client.gstProfile?.sector : client.gstProfile?.range} />
            </div>
          </section>

          {/* 4. Proprietor Details */}
          <section className="space-y-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">4. {getStakeholderLabel(client.gstProfile?.constitution)} Details <div className="h-px flex-1 bg-slate-100" /></h4>
            <div className="grid grid-cols-1 gap-4">
              {client.gstProfile?.stakeholders?.map((s, idx) => (
                <div key={s.id || idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Field label="Name" value={s.name} />
                  <Field label="Mobile" value={s.mobile} isMono />
                  <Field label="PAN" value={s.pan} isMono />
                  <Field label="Email" value={s.email} />
                </div>
              ))}
              {(!client.gstProfile?.stakeholders || client.gstProfile.stakeholders?.length === 0) && (
                 <div className="text-xs text-slate-400 italic p-4">No stakeholders recorded.</div>
              )}
            </div>
          </section>

          {/* 5. Filing & Contact */}
          <section className="space-y-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">5. Filing & Contact <div className="h-px flex-1 bg-slate-100" /></h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Field label="Accountant Name" value={client.gstProfile?.accountantName} />
              <Field label="Accountant Mobile" value={client.gstProfile?.accountantMobile} isMono />
            </div>
          </section>

          {/* 6. E-Way Bill & 7. GSTAT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="space-y-4">
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">6. E-Way Bill <div className="h-px flex-1 bg-slate-100" /></h4>
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <Field label="User ID" value={client.gstProfile?.ewayBillId} />
                <PasswordField label="Password" value={client.gstProfile?.ewayBillPass} />
              </div>
            </section>
            <section className="space-y-4">
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">7. GSTAT Portal <div className="h-px flex-1 bg-slate-100" /></h4>
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <Field label="User ID" value={client.gstProfile?.gstatId} />
                <PasswordField label="Password" value={client.gstProfile?.gstatPass} />
              </div>
            </section>
          </div>

          {/* 8. Bank Details */}
          <section className="space-y-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">8. Bank Details <div className="h-px flex-1 bg-slate-100" /></h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <Field label="Bank Name" value={client.bankDetails?.bankName} />
              <Field label="Account Number" value={client.bankDetails?.accountNo} isMono />
              <Field label="IFSC Code" value={client.bankDetails?.ifsc} isMono />
            </div>
          </section>

          {/* 9. Office Notes */}
          <section className="space-y-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">9. Office Notes <div className="h-px flex-1 bg-slate-100" /></h4>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 min-h-[100px]">
              <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap">{client.remarks || 'No legacy history documented.'}</p>
            </div>
          </section>

        </div>

        <footer className="px-8 py-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          {onEdit && (
            <button onClick={() => { onClose(); onEdit(client); }} className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all shadow-sm">Modify Profile</button>
          )}
          <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-all shadow-lg">Close Profile</button>
        </footer>
      </div>
    </div>
  );
};

export default GSTDetailModal;
