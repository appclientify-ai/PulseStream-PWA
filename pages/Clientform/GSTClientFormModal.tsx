
import React, { useState, useEffect } from 'react';
import { 
  Client, 
  ConstitutionType, 
  GstRegType, 
  GstFilingFreq, 
  ClientStatus, 
  Stakeholder,
  GstStatus
} from '../../types.ts';
import { api } from '../../services/api.ts';

interface GSTClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
  initialData?: Client | null;
}

const GSTClientFormModal: React.FC<GSTClientFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const defaultStakeholder = (): Stakeholder => ({
    id: Math.random().toString(36).substr(2, 9),
    name: '',
    mobile: '',
    pan: '',
    itPassword: '',
    address: ''
  });

  const [formData, setFormData] = useState<Partial<Client>>({
    legalName: '',
    tradeName: '',
    email: '',
    mobile: '',
    status: 'Active Filing',
    gstProfile: {
      gstin: '',
      pan: '',
      username: '',
      password: '',
      gstStatus: 'Active',
      regDate: '',
      cancelDate: '',
      regType: 'Regular',
      filingFreq: 'Monthly',
      constitution: 'Proprietorship',
      stakeholders: [defaultStakeholder()],
      accountantName: '',
      accountantMobile: '',
      address: '',
      jurisdictionType: 'State',
      ewayUsername: '',
      ewayPassword: '',
      gstatUsername: '',
      gstatPassword: ''
    },
    bankDetails: { bankName: '', accountNo: '', ifsc: '' },
    remarks: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          ...initialData,
          gstProfile: {
            ...initialData.gstProfile!,
            stakeholders: initialData.gstProfile?.stakeholders || [defaultStakeholder()]
          }
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialData]);

  const resetForm = () => {
    setFormData({
      legalName: '',
      tradeName: '',
      email: '',
      mobile: '',
      status: 'Active Filing',
      gstProfile: {
        gstin: '',
        pan: '',
        username: '',
        password: '',
        gstStatus: 'Active',
        regDate: '',
        cancelDate: '',
        regType: 'Regular',
        filingFreq: 'Monthly',
        constitution: 'Proprietorship',
        stakeholders: [defaultStakeholder()],
        accountantName: '',
        accountantMobile: '',
        address: '',
        jurisdictionType: 'State',
        ewayUsername: '',
        ewayPassword: '',
        gstatUsername: '',
        gstatPassword: ''
      },
      bankDetails: { bankName: '', accountNo: '', ifsc: '' },
      remarks: ''
    });
    setError(null);
  };

  const syncEntityDetails = (constitution: ConstitutionType, firstStakeholder: Stakeholder) => {
    if (!firstStakeholder) return;
    
    let derivedName = formData.legalName || '';
    let derivedPan = formData.gstProfile?.pan || '';

    if (constitution === 'Proprietorship') {
      derivedName = firstStakeholder.name;
      if (firstStakeholder.pan) derivedPan = firstStakeholder.pan;
    } else if (constitution === 'HUF') {
      derivedName = firstStakeholder.name.includes('HUF') ? firstStakeholder.name : `${firstStakeholder.name} HUF`;
    }

    setFormData(prev => ({ 
      ...prev, 
      legalName: derivedName.toUpperCase(),
      gstProfile: {
        ...prev.gstProfile!,
        pan: derivedPan.toUpperCase()
      }
    }));
  };

  const handleGstinChange = (val: string) => {
    const gstin = val.toUpperCase().trim().slice(0, 15);
    let pan = formData.gstProfile?.pan || '';
    if (gstin.length >= 12) pan = gstin.substring(2, 12);

    setFormData(prev => {
      const nextGst = { ...prev.gstProfile!, gstin, pan };
      if (nextGst.constitution === 'Proprietorship' && nextGst.stakeholders.length > 0) {
        nextGst.stakeholders[0] = { ...nextGst.stakeholders[0], pan };
      }
      return { ...prev, gstProfile: nextGst };
    });
  };

  const handleEntityPanChange = (val: string) => {
    const pan = val.toUpperCase().slice(0, 10);
    setFormData(prev => {
      const nextGst = { ...prev.gstProfile!, pan };
      if (nextGst.constitution === 'Proprietorship' && nextGst.stakeholders.length > 0) {
        nextGst.stakeholders[0] = { ...nextGst.stakeholders[0], pan };
      }
      return { ...prev, gstProfile: nextGst };
    });
  };

  const handleConstitutionChange = (val: ConstitutionType) => {
    setFormData(prev => {
      const nextGst = { ...prev.gstProfile!, constitution: val };
      if (val === 'Proprietorship' && nextGst.pan && nextGst.stakeholders.length > 0) {
        nextGst.stakeholders[0] = { ...nextGst.stakeholders[0], pan: nextGst.pan };
      }
      return { ...prev, gstProfile: nextGst };
    });
    const firstStakeholder = formData.gstProfile?.stakeholders[0];
    if (firstStakeholder) syncEntityDetails(val, firstStakeholder);
  };

  const updateStakeholder = (id: string, field: keyof Stakeholder, val: string) => {
    setFormData(prev => {
      const updatedStakeholders = prev.gstProfile!.stakeholders.map(s => 
        s.id === id ? { ...s, [field]: val } : s
      );
      if (updatedStakeholders[0].id === id) {
        setTimeout(() => syncEntityDetails(prev.gstProfile!.constitution, updatedStakeholders[0]), 0);
      }
      return {
        ...prev,
        gstProfile: {
          ...prev.gstProfile!,
          stakeholders: updatedStakeholders
        }
      };
    });
  };

  const handleSave = async () => {
    setError(null);
    if (!formData.tradeName) return setError("Trade Name is mandatory.");
    if (!formData.gstProfile?.gstin) return setError("GSTIN identifier required.");
    
    setIsSaving(true);
    try {
      const saved = await api.saveClient(formData);
      onSave(saved);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save client.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const isProprietorship = formData.gstProfile?.constitution === 'Proprietorship';

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/70 backdrop-blur-xl p-4 overflow-hidden animate-in fade-in duration-300">
      <div className="w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-slate-200">
        
        <header className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-4">
             <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2-2h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011-1v5m-4 0h4" /></svg>
             </div>
             <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">{initialData ? 'Update Profile' : 'New GST Enrollment'}</h2>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-2">Authorized Tax Compliance Matrix</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all shadow-sm">
            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar p-10 space-y-12">
          {error && (
            <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] font-black uppercase tracking-widest text-rose-600 text-center animate-in shake duration-300">
              {error}
            </div>
          )}

          <section className="space-y-6">
             <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 flex items-center gap-3">Administrative Status <div className="h-px flex-1 bg-slate-100" /></h4>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Relationship Status</label>
                   <select 
                     className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-50 transition-all cursor-pointer"
                     value={formData.status} 
                     onChange={e => setFormData({...formData, status: e.target.value as ClientStatus})}
                   >
                      <option value="Active Filing">Active Filing Service</option>
                      <option value="Litigation">Litigation / Case Work</option>
                      <option value="Inactive">Inactive / Suspended</option>
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Trade Name (Brand)</label>
                   <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black uppercase outline-none focus:border-indigo-600 focus:bg-white transition-all" value={formData.tradeName} onChange={e => setFormData({...formData, tradeName: e.target.value.toUpperCase()})} placeholder="BUSINESS NAME" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Legal Form (Constitution)</label>
                   <select 
                     className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none cursor-pointer focus:ring-4 focus:ring-indigo-50"
                     value={formData.gstProfile?.constitution} 
                     onChange={e => handleConstitutionChange(e.target.value as ConstitutionType)}
                   >
                      <option value="Proprietorship">Proprietorship</option>
                      <option value="Partnership">Partnership Firm</option>
                      <option value="HUF">HUF</option>
                      <option value="Company">Private/Public Limited</option>
                      <option value="Trust">Trust / NGO</option>
                      <option value="Society">Co-operative Society</option>
                      <option value="Other">Other</option>
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Legal Name (As per PAN)</label>
                   <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black uppercase outline-none focus:border-indigo-600 focus:bg-white transition-all" value={formData.legalName} onChange={e => setFormData({...formData, legalName: e.target.value.toUpperCase()})} placeholder="LEGAL ENTITY NAME" />
                </div>
             </div>
          </section>

          <section className="space-y-6">
             <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 flex items-center gap-3">Portal Credentials <div className="h-px flex-1 bg-slate-100" /></h4>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-indigo-50/20 p-8 rounded-[2rem] border border-indigo-100/50">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest ml-1">GSTIN Identifier</label>
                   <input className="w-full bg-white border border-indigo-100 p-4 rounded-2xl font-black uppercase font-mono tracking-[0.2em] outline-none" value={formData.gstProfile?.gstin} onChange={e => handleGstinChange(e.target.value)} placeholder="GSTIN NO" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest ml-1">Portal User ID</label>
                   <input className="w-full bg-white border border-indigo-100 p-4 rounded-2xl font-bold outline-none" value={formData.gstProfile?.username} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, username: e.target.value}})} placeholder="Login ID" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest ml-1">Secret Password</label>
                   <div className="relative">
                      <input type={showPassword ? "text" : "password"} className="w-full bg-white border border-indigo-100 p-4 rounded-2xl font-bold outline-none" value={formData.gstProfile?.password} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, password: e.target.value}})} placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">{showPassword ? '🙈' : '👁️'}</button>
                   </div>
                </div>
             </div>
          </section>

          <section className="space-y-6">
             <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 flex items-center gap-3">Extended Portal Access <div className="h-px flex-1 bg-slate-100" /></h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                   <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-2">E-Way Bill Portal</p>
                   <div className="grid grid-cols-2 gap-4">
                      <input className="bg-white border border-slate-200 p-3 rounded-xl font-bold text-xs" value={formData.gstProfile?.ewayUsername} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, ewayUsername: e.target.value}})} placeholder="EWB User ID" />
                      <input className="bg-white border border-slate-200 p-3 rounded-xl font-bold text-xs" value={formData.gstProfile?.ewayPassword} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, ewayPassword: e.target.value}})} placeholder="EWB Password" />
                   </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                   <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-2">GSTAT (Tribunal) Portal</p>
                   <div className="grid grid-cols-2 gap-4">
                      <input className="bg-white border border-slate-200 p-3 rounded-xl font-bold text-xs" value={formData.gstProfile?.gstatUsername} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, gstatUsername: e.target.value}})} placeholder="GSTAT User ID" />
                      <input className="bg-white border border-slate-200 p-3 rounded-xl font-bold text-xs" value={formData.gstProfile?.gstatPassword} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, gstatPassword: e.target.value}})} placeholder="GSTAT Password" />
                   </div>
                </div>
             </div>
          </section>

          <section className="space-y-6">
             <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 flex items-center gap-3">Banking Sync <div className="h-px flex-1 bg-slate-100" /></h4>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                <input className="bg-white border border-slate-200 p-4 rounded-2xl font-black uppercase text-xs" value={formData.bankDetails?.bankName} onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails!, bankName: e.target.value.toUpperCase()}})} placeholder="BANK NAME" />
                <input className="bg-white border border-slate-200 p-4 rounded-2xl font-black font-mono text-xs" value={formData.bankDetails?.accountNo} onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails!, accountNo: e.target.value}})} placeholder="ACCOUNT NO" />
                <input className="bg-white border border-slate-200 p-4 rounded-2xl font-black font-mono text-xs uppercase" value={formData.bankDetails?.ifsc} onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails!, ifsc: e.target.value.toUpperCase()}})} placeholder="IFSC CODE" />
             </div>
          </section>

          <section className="space-y-6">
             <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 flex items-center gap-3">Firm Remarks <div className="h-px flex-1 bg-slate-100" /></h4>
             <textarea className="w-full bg-slate-50 border border-slate-200 p-6 rounded-[2rem] font-bold text-xs h-32 outline-none focus:ring-4 focus:ring-indigo-50" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} placeholder="Internal office notes..." />
          </section>
        </div>

        <footer className="px-10 py-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-4 shrink-0">
           <button onClick={onClose} className="px-10 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:text-slate-900 transition-colors uppercase">Cancel</button>
           <button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-[10px] px-14 py-5 rounded-2xl shadow-2xl hover:bg-slate-900 transition-all disabled:opacity-50">
             {isSaving ? 'Saving...' : 'Save Client'}
           </button>
        </footer>
      </div>
    </div>
  );
};

export default GSTClientFormModal;
