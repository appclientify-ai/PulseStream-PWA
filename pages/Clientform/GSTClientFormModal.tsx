
import React, { useState, useEffect } from 'react';
import { Client, GSTProfile, ConstitutionType, GstStatus, GstRegType, GstFilingFreq, ClientStatus, JurisdictionType } from '../../types.ts';
import { api } from '../../services/api.ts';

interface GSTClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
  initialData?: Client | null;
}

const GSTClientFormModal: React.FC<GSTClientFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Client>>({
    legalName: '',
    tradeName: '',
    email: '',
    mobile: '',
    status: 'Active Filing',
    gstProfile: {
      gstin: '', username: '', password: '', gstStatus: 'Active',
      regDate: '', regType: 'Regular', filingFreq: 'Monthly',
      constitution: 'Proprietorship', stakeholders: [],
      accountantName: '', accountantMobile: '', address: '',
      jurisdictionType: 'State', sector: '', range: ''
    },
    bankDetails: { bankName: '', accountNo: '', ifsc: '' }
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        legalName: '', tradeName: '', email: '', mobile: '', status: 'Active Filing',
        gstProfile: {
          gstin: '', username: '', password: '', gstStatus: 'Active',
          regDate: '', regType: 'Regular', filingFreq: 'Monthly',
          constitution: 'Proprietorship', stakeholders: [],
          accountantName: '', accountantMobile: '', address: '',
          jurisdictionType: 'State', sector: '', range: ''
        },
        bankDetails: { bankName: '', accountNo: '', ifsc: '' }
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);
    try {
      if (!formData.legalName) throw new Error("Legal Name is required");
      if (!formData.gstProfile?.gstin) throw new Error("GSTIN is required");

      const saved = await api.saveClient(formData);
      onSave(saved);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to sync with vault.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-hidden">
      <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-4">
             <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2-2h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011-1v5m-4 0h4" /></svg>
             </div>
             <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">GST Client Master</h2>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">Statuatory Compliance Vault</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-xl transition-colors">
            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar">
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl font-bold border border-red-100">{error}</div>}
          
          <section className="space-y-6">
            <h3 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.25em] flex items-center gap-3">Business Information <div className="h-px flex-1 bg-slate-100" /></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Full Legal Name (as per PAN)</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold uppercase outline-none focus:ring-4 focus:ring-indigo-50 transition-all" value={formData.legalName} onChange={e => setFormData({...formData, legalName: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Trade/Business Name</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold uppercase outline-none focus:ring-4 focus:ring-indigo-50 transition-all" value={formData.tradeName} onChange={e => setFormData({...formData, tradeName: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">GSTIN Number</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black uppercase font-mono tracking-widest outline-none focus:ring-4 focus:ring-indigo-50 transition-all" placeholder="22AAAAA0000A1Z5" value={formData.gstProfile?.gstin} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, gstin: e.target.value.toUpperCase()}})} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Primary Contact No.</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-50 transition-all" maxLength={10} value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '')})} />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.25em] flex items-center gap-3">Portal Credentials <div className="h-px flex-1 bg-slate-100" /></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Portal Username</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-50 transition-all" value={formData.gstProfile?.username} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, username: e.target.value}})} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Portal Password</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-50 transition-all" value={formData.gstProfile?.password} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, password: e.target.value}})} />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.25em] flex items-center gap-3">Internal Coordination <div className="h-px flex-1 bg-slate-100" /></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Accountant/Staff Name</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold uppercase outline-none focus:ring-4 focus:ring-indigo-50 transition-all" value={formData.gstProfile?.accountantName} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, accountantName: e.target.value}})} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Accountant Mobile</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-50 transition-all" maxLength={10} value={formData.gstProfile?.accountantMobile} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, accountantMobile: e.target.value.replace(/\D/g, '')}})} />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.25em] flex items-center gap-3">Statutory Details <div className="h-px flex-1 bg-slate-100" /></h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Registration Date</label>
                <input type="date" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-50 transition-all uppercase" value={formData.gstProfile?.regDate} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, regDate: e.target.value}})} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Registration Type</label>
                <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-50" value={formData.gstProfile?.regType} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, regType: e.target.value as GstRegType}})}>
                   <option value="Regular">Regular (Normal)</option>
                   <option value="Composition">Composition Scheme</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Filing Frequency</label>
                <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-50" value={formData.gstProfile?.filingFreq} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, filingFreq: e.target.value as GstFilingFreq}})}>
                   <option value="Monthly">Monthly Filing</option>
                   <option value="Quarterly">Quarterly (QRMP)</option>
                </select>
              </div>
            </div>
          </section>
        </div>

        <div className="p-10 border-t border-slate-100 flex gap-4 bg-slate-50 shrink-0">
          <button onClick={onClose} className="flex-1 py-5 rounded-[1.5rem] text-slate-500 font-black uppercase tracking-widest text-[11px] border border-slate-200 hover:bg-white transition-all">Discard</button>
          <button onClick={handleSave} disabled={isSaving} className="flex-[2] bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-[11px] py-5 rounded-[1.5rem] shadow-xl hover:bg-slate-900 transition-all active:scale-[0.98] disabled:opacity-50">
            {isSaving ? 'Synchronizing...' : 'Save to Master Vault'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GSTClientFormModal;
