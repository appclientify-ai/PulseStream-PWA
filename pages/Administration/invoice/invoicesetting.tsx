import React, { useState, useEffect } from 'react';
import { InvoiceSettings } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';

const InvoiceSetting: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [settings, setSettings] = useState<InvoiceSettings>({
    firmName: '', firmAddress: '', firmMobile: '', firmEmail: '', firmGstin: '',
    bankName: '', accountNo: '', ifsc: '', upiId: '', invoicePrefix: 'INV/',
    terms: '', isGstEnabled: true
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
      alert("Settings update failed.");
    } finally {
      setIsSaving(false);
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
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Invoice Prefix</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black uppercase"
                  value={settings.invoicePrefix} onChange={e => setSettings({...settings, invoicePrefix: e.target.value})} />
             </div>
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Firm GSTIN</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black uppercase font-mono"
                  value={settings.firmGstin} onChange={e => setSettings({...settings, firmGstin: e.target.value.toUpperCase()})} />
             </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default InvoiceSetting;
