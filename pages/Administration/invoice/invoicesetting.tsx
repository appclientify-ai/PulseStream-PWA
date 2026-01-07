
import React, { useState, useEffect, useRef } from 'react';
import { InvoiceSettings } from '../../../types';
import { mockBackend } from '../../../services/mockBackend';
import Loader from '../../../components/Loader';

const InvoiceSetting: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [settings, setSettings] = useState<InvoiceSettings>({
    firmName: '',
    firmAddress: '',
    firmMobile: '',
    firmEmail: '',
    firmGstin: '',
    bankName: '',
    accountNo: '',
    ifsc: '',
    upiId: '',
    invoicePrefix: 'INV/',
    terms: '',
    isGstEnabled: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const logoRef = useRef<HTMLInputElement>(null);
  const sigRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    mockBackend.getInvoiceSettings().then(data => {
      setSettings(data);
      setIsLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    await mockBackend.saveInvoiceSettings(settings);
    setTimeout(() => {
      setIsSaving(false);
      onBack();
    }, 800);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'firmLogo' | 'firmSignature') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSettings({ ...settings, [field]: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto w-full overflow-hidden">
      
      <div className="flex items-center justify-between bg-white p-4 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-all text-slate-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Invoice Configuration</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Firm Identity & Billing Logic</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={isSaving}
          className="bg-indigo-600 text-white font-black uppercase tracking-widest px-10 h-11 rounded-xl shadow-lg hover:bg-slate-900 transition-all text-xs disabled:opacity-50">
          {isSaving ? 'Updating...' : 'Commit Settings'}
        </button>
      </div>

      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-y-auto no-scrollbar p-10 space-y-12 pb-20">
        
        {/* Profile Section */}
        <section>
          <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-8 flex items-center gap-3">Firm Profile (Printing) <div className="h-px flex-1 bg-slate-100" /></h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block ml-1">Legal Firm Name</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-50 uppercase"
                  value={settings.firmName} onChange={e => setSettings({...settings, firmName: e.target.value})} placeholder="E.G. VAULT CORE TAX CONSULTANCY" />
             </div>
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block ml-1">Firm GSTIN</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-50 uppercase font-mono tracking-widest"
                  value={settings.firmGstin} onChange={e => setSettings({...settings, firmGstin: e.target.value.toUpperCase()})} placeholder="GSTIN NUMBER" />
             </div>
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block ml-1">Firm Mobile</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-50"
                  value={settings.firmMobile} onChange={e => setSettings({...settings, firmMobile: e.target.value})} placeholder="9876543210" />
             </div>
             <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block ml-1">Office Email (For Invoices)</label>
                <input type="email" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-50"
                  value={settings.firmEmail} onChange={e => setSettings({...settings, firmEmail: e.target.value})} placeholder="office@firm.com" />
             </div>
             <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block ml-1">Firm Address</label>
                <textarea className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black text-slate-900 outline-none h-24 focus:ring-4 focus:ring-indigo-50 uppercase"
                  value={settings.firmAddress} onChange={e => setSettings({...settings, firmAddress: e.target.value})} placeholder="E.G. OFFICE NO. 4, CITY, STATE" />
             </div>
          </div>
        </section>

        {/* Branding Section */}
        <section>
          <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-8 flex items-center gap-3">Logo & Signature <div className="h-px flex-1 bg-slate-100" /></h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Firm Logo (JPG/PNG)</label>
                <div onClick={() => logoRef.current?.click()} className="h-40 w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all overflow-hidden p-4">
                   {settings.firmLogo ? (
                     <img src={settings.firmLogo} alt="Logo" className="h-full object-contain" />
                   ) : (
                     <div className="text-center">
                        <svg className="h-8 w-8 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <p className="text-[9px] font-black text-slate-400 uppercase">Click to upload firm logo</p>
                     </div>
                   )}
                   <input type="file" ref={logoRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'firmLogo')} />
                </div>
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Digital Signature (Transparent PNG)</label>
                <div onClick={() => sigRef.current?.click()} className="h-40 w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all overflow-hidden p-4">
                   {settings.firmSignature ? (
                     <img src={settings.firmSignature} alt="Signature" className="h-full object-contain" />
                   ) : (
                     <div className="text-center">
                        <svg className="h-8 w-8 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        <p className="text-[9px] font-black text-slate-400 uppercase">Click to upload firm signature</p>
                     </div>
                   )}
                   <input type="file" ref={sigRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'firmSignature')} />
                </div>
             </div>
          </div>
        </section>

        {/* Logic Toggle */}
        <section className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 flex items-center justify-between">
           <div>
              <h4 className="text-sm font-black text-indigo-900 uppercase tracking-tight">Enable GST Billing</h4>
              <p className="text-[10px] font-bold text-indigo-400 uppercase mt-1">If enabled, GST tax columns and aggregate rows will appear on invoices.</p>
           </div>
           <button onClick={() => setSettings({...settings, isGstEnabled: !settings.isGstEnabled})} 
             className={`h-8 w-14 rounded-full p-1 transition-colors relative ${settings.isGstEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}>
              <div className={`h-6 w-6 bg-white rounded-full shadow-sm transition-transform ${settings.isGstEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
           </button>
        </section>

        {/* Banking Section */}
        <section>
          <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-8 flex items-center gap-3">Payment Instructions <div className="h-px flex-1 bg-slate-100" /></h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block ml-1">Bank Name</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-50 uppercase"
                  value={settings.bankName} onChange={e => setSettings({...settings, bankName: e.target.value})} placeholder="E.G. HDFC BANK" />
             </div>
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block ml-1">Account Number</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-50"
                  value={settings.accountNo} onChange={e => setSettings({...settings, accountNo: e.target.value})} placeholder="00000000000000" />
             </div>
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block ml-1">IFSC Code</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-50 uppercase"
                  value={settings.ifsc} onChange={e => setSettings({...settings, ifsc: e.target.value})} placeholder="HDFC0001234" />
             </div>
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block ml-1">UPI ID (For QR Code Generation)</label>
                <input className="w-full bg-indigo-50 border border-indigo-100 rounded-2xl p-4 font-black text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-100"
                  value={settings.upiId} onChange={e => setSettings({...settings, upiId: e.target.value})} placeholder="firm@upi" />
             </div>
          </div>
        </section>

        {/* Numbering Section */}
        <section>
          <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-8 flex items-center gap-3">Invoice Numbering <div className="h-px flex-1 bg-slate-100" /></h4>
          <div className="max-w-md">
             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block ml-1">Invoice Prefix</label>
             <div className="flex gap-4">
                <input className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-50 uppercase"
                  value={settings.invoicePrefix} onChange={e => setSettings({...settings, invoicePrefix: e.target.value})} placeholder="CA/" />
                <div className="bg-slate-100 p-4 rounded-2xl flex items-center gap-2">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Preview:</p>
                   <p className="text-xs font-black text-slate-900">{settings.invoicePrefix}2024-25/001</p>
                </div>
             </div>
          </div>
        </section>

        {/* Terms Section */}
        <section>
           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block ml-1">Global Terms & Conditions</label>
           <textarea className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] p-8 font-medium text-slate-600 outline-none h-40 focus:ring-4 focus:ring-indigo-50"
             value={settings.terms} onChange={e => setSettings({...settings, terms: e.target.value})} placeholder="Enter terms that appear at the bottom of every invoice..." />
        </section>
      </div>
    </div>
  );
};

export default InvoiceSetting;
