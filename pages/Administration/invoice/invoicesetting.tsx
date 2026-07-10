import React, { useState, useEffect } from 'react';
import { InvoiceSettings } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';
import { toast } from 'sonner';


const InvoiceSetting: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [settings, setSettings] = useState<InvoiceSettings>({
    firmName: '', firmAddress: '', firmMobile: '', firmEmail: '', firmGstin: '',
    bankName: '', accountNo: '', ifsc: '', upiId: '', invoicePrefix: 'INV/',
    terms: '', isGstEnabled: true, firmLogo: '', firmSignature: '', whatsappNumber: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api.getInvoiceSettings().then(data => {
      setSettings(data);
      setIsLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.saveInvoiceSettings(settings);
      onBack();
    } catch (err) {
      toast.error("Settings update failed.");
    } finally {
      setIsSaving(false);
    }
  };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'firmLogo' | 'firmSignature') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL(file.type, 0.7);
          setSettings(prev => ({ ...prev, [field]: dataUrl }));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between bg-white p-4 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-all">
            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Invoice Configuration</h2>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 text-white font-black uppercase tracking-widest px-10 h-11 rounded-xl shadow-lg hover:bg-slate-900 transition-all text-xs">
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-y-auto p-10 space-y-12 no-scrollbar">
        <section>
          <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-8">Firm Branding</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Legal Firm Name</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black uppercase"
                  value={settings.firmName} onChange={e => setSettings({...settings, firmName: e.target.value})} />
             </div>
             <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Firm Address</label>
                <textarea className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black uppercase min-h-[80px]"
                  value={settings.firmAddress} onChange={e => setSettings({...settings, firmAddress: e.target.value})} />
             </div>
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Firm Mobile No.</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black uppercase"
                  value={settings.firmMobile} onChange={e => setSettings({...settings, firmMobile: e.target.value})} />
             </div>
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Firm Email ID</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black"
                  value={settings.firmEmail} onChange={e => setSettings({...settings, firmEmail: e.target.value})} />
             </div>
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Invoice Prefix</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black uppercase"
                  value={settings.invoicePrefix} onChange={e => setSettings({...settings, invoicePrefix: e.target.value})} />
             </div>
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Firm GSTIN</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black uppercase font-mono"
                  value={settings.firmGstin} onChange={e => setSettings({...settings, firmGstin: e.target.value})} />
             </div>
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Company Logo</label>
                <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'firmLogo')} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 font-black text-xs" />
                {settings.firmLogo && <img src={settings.firmLogo} alt="Logo" className="mt-2 h-12 object-contain" />}
             </div>
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Signature</label>
                <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'firmSignature')} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 font-black text-xs" />
                {settings.firmSignature && <img src={settings.firmSignature} alt="Signature" className="mt-2 h-12 object-contain" />}
             </div>
             <div className="md:col-span-2 flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <input type="checkbox" id="gstEnabled" checked={settings.isGstEnabled} onChange={e => setSettings({...settings, isGstEnabled: e.target.checked})} className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                <label htmlFor="gstEnabled" className="text-sm font-black uppercase text-slate-700 cursor-pointer">Enable GST Calculations</label>
             </div>
          </div>
        </section>

        <section>
          <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-8">Payment & Bank Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Bank Name</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black uppercase"
                  value={settings.bankName} onChange={e => setSettings({...settings, bankName: e.target.value})} />
             </div>
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Account Number</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black uppercase font-mono"
                  value={settings.accountNo} onChange={e => setSettings({...settings, accountNo: e.target.value})} />
             </div>
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">IFSC Code</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black uppercase font-mono"
                  value={settings.ifsc} onChange={e => setSettings({...settings, ifsc: e.target.value})} />
             </div>
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">UPI ID (For Payment QR)</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black"
                  value={settings.upiId} onChange={e => setSettings({...settings, upiId: e.target.value})} />
             </div>
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">WhatsApp Number (For Message QR)</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black uppercase"
                  value={settings.whatsappNumber || ''} onChange={e => setSettings({...settings, whatsappNumber: e.target.value})} />
             </div>
             <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Terms & Conditions</label>
                <textarea className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-medium min-h-[120px]"
                  value={settings.terms} onChange={e => setSettings({...settings, terms: e.target.value})} />
             </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default InvoiceSetting;
