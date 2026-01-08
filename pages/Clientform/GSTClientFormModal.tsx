import React, { useState, useEffect } from 'react';
import { Client, ConstitutionType, GstStatus, GstRegType, GstFilingFreq, ClientStatus, JurisdictionType } from '../../types.ts';
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
  const [activeTab, setActiveTab] = useState<'basic' | 'filing' | 'admin'>('basic');
  
  const [formData, setFormData] = useState<Partial<Client>>({
    legalName: '',
    tradeName: '',
    email: '',
    mobile: '',
    status: 'Active Filing',
    gstProfile: {
      gstin: '', pan: '', username: '', password: '', gstStatus: 'Active',
      regDate: '', regType: 'Regular', filingFreq: 'Monthly',
      constitution: 'Proprietorship', stakeholders: [],
      accountantName: '', accountantMobile: '', address: '',
      jurisdictionType: 'State', sector: '', range: ''
    },
    bankDetails: { bankName: '', accountNo: '', ifsc: '' },
    remarks: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        legalName: '', tradeName: '', email: '', mobile: '', status: 'Active Filing',
        gstProfile: {
          gstin: '', pan: '', username: '', password: '', gstStatus: 'Active',
          regDate: '', regType: 'Regular', filingFreq: 'Monthly',
          constitution: 'Proprietorship', stakeholders: [],
          accountantName: '', accountantMobile: '', address: '',
          jurisdictionType: 'State', sector: '', range: ''
        },
        bankDetails: { bankName: '', accountNo: '', ifsc: '' },
        remarks: ''
      });
    }
    setError(null);
    setActiveTab('basic');
  }, [initialData, isOpen]);

  const handleGstinChange = (val: string) => {
    const gstin = val.toUpperCase().slice(0, 15);
    let pan = formData.gstProfile?.pan || '';
    if (gstin.length >= 10) {
      pan = gstin.substring(2, 12);
    }
    setFormData(prev => ({
      ...prev,
      gstProfile: { ...prev.gstProfile!, gstin, pan }
    }));
  };

  const handleReturnLogic = (type: GstRegType) => {
    setFormData(prev => ({
      ...prev,
      gstProfile: {
        ...prev.gstProfile!,
        regType: type,
        filingFreq: type === 'Composition' ? 'Quarterly' : prev.gstProfile?.filingFreq || 'Monthly'
      }
    }));
  };

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
      setError(err.message || "Failed to save to cloud vault.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-hidden">
      <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0 rounded-t-[2rem]">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">GST Master Record</h2>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">Practice Management Hub</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
          </button>
        </div>

        <div className="flex border-b border-slate-100 bg-white shrink-0 overflow-x-auto no-scrollbar">
           {[
             { id: 'basic', label: '1. Basic Identity' },
             { id: 'filing', label: '2. Filing Config' },
             { id: 'admin', label: '3. Administrative' }
           ].map((t) => (
             <button key={t.id} onClick={() => setActiveTab(t.id as any)} 
               className={`flex-1 py-4 px-6 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === t.id ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
               {t.label}
             </button>
           ))}
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl font-bold border border-red-100 text-xs">{error}</div>}
          
          {activeTab === 'basic' && (
            <div className="space-y-8 animate-in fade-in duration-300">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Legal Name (As per PAN)</label>
                    <input className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold uppercase outline-none focus:ring-4 focus:ring-indigo-50" value={formData.legalName} onChange={e => setFormData({...formData, legalName: e.target.value})} placeholder="Full Entity Name" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Trade/Business Name</label>
                    <input className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold uppercase outline-none focus:ring-4 focus:ring-indigo-50" value={formData.tradeName} onChange={e => setFormData({...formData, tradeName: e.target.value})} placeholder="Brand Name" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">GSTIN</label>
                    <input className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-black uppercase font-mono tracking-widest outline-none focus:ring-4 focus:ring-indigo-50" placeholder="22AAAAA0000A1Z5" value={formData.gstProfile?.gstin} onChange={e => handleGstinChange(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">PAN (Auto-extracted)</label>
                    <input className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-black uppercase font-mono tracking-widest outline-none" value={formData.gstProfile?.pan} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, pan: e.target.value.toUpperCase()}})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Mobile No</label>
                    <input className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold outline-none" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} placeholder="Primary Contact" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Email Address</label>
                    <input className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold outline-none lowercase" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="office@client.com" />
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'filing' && (
            <div className="space-y-8 animate-in fade-in duration-300">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Taxpayer Category</label>
                    <select className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold outline-none" value={formData.gstProfile?.regType} onChange={e => handleReturnLogic(e.target.value as GstRegType)}>
                       <option value="Regular">Regular Taxpayer</option>
                       <option value="Composition">Composition Dealer</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Filing Frequency</label>
                    <select disabled={formData.gstProfile?.regType === 'Composition'} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold outline-none disabled:opacity-50" value={formData.gstProfile?.filingFreq} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, filingFreq: e.target.value as GstFilingFreq}})}>
                       <option value="Monthly">Monthly</option>
                       <option value="Quarterly">Quarterly (QRMP)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Vault Status</label>
                    <select className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold outline-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as ClientStatus})}>
                       <option value="Active Filing">Active Filing</option>
                       <option value="Inactive">Inactive</option>
                       <option value="Case-by-Case">Litigation Only</option>
                    </select>
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Effective Reg. Date</label>
                    <input type="date" className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold outline-none" value={formData.gstProfile?.regDate} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, regDate: e.target.value}})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Portal Password</label>
                    <input className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold outline-none" value={formData.gstProfile?.password} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, password: e.target.value}})} placeholder="Secure Password" />
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="space-y-8 animate-in fade-in duration-300">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Jurisdiction</label>
                    <select className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold outline-none" value={formData.gstProfile?.jurisdictionType} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, jurisdictionType: e.target.value as JurisdictionType}})}>
                       <option value="State">State Jurisdiction</option>
                       <option value="Center">Central Jurisdiction</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Sector/Circle</label>
                    <input className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold outline-none uppercase" value={formData.gstProfile?.sector} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, sector: e.target.value}})} placeholder="E.G. CIRCLE 4" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Range/Ward</label>
                    <input className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold outline-none uppercase" value={formData.gstProfile?.range} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, range: e.target.value}})} placeholder="E.G. WARD 12" />
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Accountant Name</label>
                    <input className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold outline-none" value={formData.gstProfile?.accountantName} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, accountantName: e.target.value}})} placeholder="Contact Person" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Bank Account No.</label>
                    <input className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold outline-none" value={formData.bankDetails?.accountNo} onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails!, accountNo: e.target.value}})} placeholder="Primary Bank A/c" />
                  </div>
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Internal Notes</label>
                  <textarea className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-medium text-slate-600 outline-none h-24" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} placeholder="Staff instructions or history..." />
               </div>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0 rounded-b-[2rem]">
          <button onClick={onClose} className="flex-1 py-4 rounded-xl text-slate-500 font-black uppercase tracking-widest text-[10px] border border-slate-200 hover:bg-white transition-all">Discard</button>
          <button onClick={handleSave} disabled={isSaving} className="flex-[2] bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-xl shadow-xl hover:bg-slate-900 transition-all active:scale-[0.98]">
            {isSaving ? 'Syncing...' : 'Save Master Record'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GSTClientFormModal;