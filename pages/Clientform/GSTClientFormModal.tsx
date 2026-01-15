
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
    status: 'Active',
    gstProfile: {
      gstin: '',
      pan: '',
      username: '',
      password: '',
      ewayBillUsername: '',
      ewayBillPassword: '',
      gstatUsername: '',
      gstatPassword: '',
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
      jurisdictionType: 'State'
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
      status: 'Active',
      gstProfile: {
        gstin: '',
        pan: '',
        username: '',
        password: '',
        ewayBillUsername: '',
        ewayBillPassword: '',
        gstatUsername: '',
        gstatPassword: '',
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
        jurisdictionType: 'State'
      },
      bankDetails: { bankName: '', accountNo: '', ifsc: '' },
      remarks: ''
    });
    setError(null);
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

  const handleRegTypeChange = (type: GstRegType) => {
    setFormData(prev => ({
      ...prev,
      gstProfile: {
        ...prev.gstProfile!,
        regType: type,
        filingFreq: type === 'Composition' ? 'Quarterly' : prev.gstProfile?.filingFreq || 'Monthly'
      }
    }));
  };

  const handleConstitutionChange = (val: ConstitutionType) => {
    setFormData(prev => {
      const nextGst = { ...prev.gstProfile!, constitution: val };
      if (val === 'Proprietorship' && nextGst.pan && nextGst.stakeholders.length > 0) {
        nextGst.stakeholders[0] = { ...nextGst.stakeholders[0], pan: nextGst.pan };
      }
      return { ...prev, gstProfile: nextGst };
    });
  };

  const updateStakeholder = (id: string, field: keyof Stakeholder, val: string) => {
    setFormData(prev => {
      const updatedStakeholders = prev.gstProfile!.stakeholders.map(s => 
        s.id === id ? { ...s, [field]: val } : s
      );
      return { ...prev, gstProfile: { ...prev.gstProfile!, stakeholders: updatedStakeholders } };
    });
  };

  const addStakeholder = () => {
    setFormData(prev => ({
      ...prev,
      gstProfile: { ...prev.gstProfile!, stakeholders: [...prev.gstProfile!.stakeholders, defaultStakeholder()] }
    }));
  };

  const removeStakeholder = (id: string) => {
    setFormData(prev => {
      if (prev.gstProfile!.stakeholders.length <= 1) return prev;
      return { ...prev, gstProfile: { ...prev.gstProfile!, stakeholders: prev.gstProfile!.stakeholders.filter(s => s.id !== id) } };
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
      setError(err.message || "Failed to archive profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-slate-200">
        
        <header className="px-10 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase leading-none">{initialData ? 'Update Profile' : 'New GST Enrollment'}</h2>
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-1.5">Authorized Compliance Record</p>
          </div>
          <button onClick={onClose} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all">
            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar p-10 space-y-10">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-[10px] font-black uppercase text-rose-600 text-center animate-in shake">
              {error}
            </div>
          )}

          <section className="space-y-6">
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">Basic Info <div className="h-px flex-1 bg-slate-100" /></h4>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black uppercase text-slate-400">Trade Name</label>
                   <input className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-black uppercase outline-none focus:border-indigo-600 transition-all text-xs" value={formData.tradeName} onChange={e => setFormData({...formData, tradeName: e.target.value.toUpperCase()})} placeholder="Business Name" />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black uppercase text-slate-400">Constitution</label>
                   <select className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold text-xs outline-none cursor-pointer" value={formData.gstProfile?.constitution} onChange={e => handleConstitutionChange(e.target.value as ConstitutionType)}>
                      <option value="Proprietorship">Proprietorship</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Company">Private/Public Ltd</option>
                      <option value="HUF">HUF</option>
                   </select>
                </div>
                <div className="space-y-1.5 col-span-2">
                   <label className="text-[9px] font-black uppercase text-slate-400">Legal Name (PAN)</label>
                   <input className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-black uppercase outline-none focus:border-indigo-600 transition-all text-xs" value={formData.legalName} onChange={e => setFormData({...formData, legalName: e.target.value.toUpperCase()})} placeholder="As per PAN" />
                </div>
             </div>
          </section>

          <section className="space-y-6">
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">GST Portal Vault <div className="h-px flex-1 bg-slate-100" /></h4>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-indigo-50/20 p-6 rounded-2xl border border-indigo-100/50">
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black uppercase text-indigo-400">GSTIN Identifier</label>
                   <input className="w-full bg-white border border-indigo-100 p-3 rounded-xl font-black uppercase font-mono tracking-widest outline-none focus:border-indigo-600 transition-all text-indigo-600 text-xs" value={formData.gstProfile?.gstin} onChange={e => handleGstinChange(e.target.value)} placeholder="GSTIN" />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black uppercase text-indigo-400">Entity PAN</label>
                   <input className="w-full bg-white border border-indigo-100 p-3 rounded-xl font-black uppercase font-mono tracking-widest outline-none focus:border-indigo-600 transition-all text-indigo-600 text-xs" value={formData.gstProfile?.pan} onChange={e => handleEntityPanChange(e.target.value)} placeholder="PAN NO" />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black uppercase text-indigo-400">User ID</label>
                   <input className="w-full bg-white border border-indigo-100 p-3 rounded-xl font-bold outline-none text-xs" value={formData.gstProfile?.username} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, username: e.target.value}})} placeholder="Login ID" />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black uppercase text-indigo-400">Password</label>
                   <div className="relative">
                      <input type={showPassword ? "text" : "password"} className="w-full bg-white border border-indigo-100 p-3 rounded-xl font-bold outline-none text-xs" value={formData.gstProfile?.password} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, password: e.target.value}})} placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? '🙈' : '👁️'}</button>
                   </div>
                </div>
             </div>
          </section>

          <section className="space-y-6">
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">Extended Portals <div className="h-px flex-1 bg-slate-100" /></h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                   <h5 className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2">🚚 E-Way Bill Portal</h5>
                   <div className="grid grid-cols-2 gap-4">
                      <input className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold outline-none" value={formData.gstProfile?.ewayBillUsername} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, ewayBillUsername: e.target.value}})} placeholder="EWB User ID" />
                      <input className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold outline-none" value={formData.gstProfile?.ewayBillPassword} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, ewayBillPassword: e.target.value}})} placeholder="EWB Password" />
                   </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                   <h5 className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2">🏛️ GSTAT Tribunal Portal</h5>
                   <div className="grid grid-cols-2 gap-4">
                      <input className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold outline-none" value={formData.gstProfile?.gstatUsername} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, gstatUsername: e.target.value}})} placeholder="GSTAT User ID" />
                      <input className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold outline-none" value={formData.gstProfile?.gstatPassword} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, gstatPassword: e.target.value}})} placeholder="GSTAT Password" />
                   </div>
                </div>
             </div>
          </section>

          <section className="space-y-6">
             <div className="flex items-center justify-between"><h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Members</h4><button type="button" onClick={addStakeholder} className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-black uppercase text-[9px]">+ Add</button></div>
             <div className="space-y-2">
                {formData.gstProfile?.stakeholders.map((s, idx) => (
                  <div key={s.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                     <input className="bg-white border border-slate-200 p-2.5 rounded-lg text-[10px] font-black uppercase outline-none" value={s.name} onChange={e => updateStakeholder(s.id, 'name', e.target.value.toUpperCase())} placeholder="NAME" />
                     <input className="bg-white border border-slate-200 p-2.5 rounded-lg text-[10px] font-black font-mono uppercase outline-none" value={s.pan} onChange={e => updateStakeholder(s.id, 'pan', e.target.value.toUpperCase().slice(0, 10))} placeholder="PAN" />
                     <div className="flex gap-2">
                        <input className="flex-1 bg-white border border-slate-200 p-2.5 rounded-lg text-[10px] font-black outline-none" value={s.mobile} onChange={e => updateStakeholder(s.id, 'mobile', e.target.value.replace(/\D/g, ''))} placeholder="MOBILE" />
                        <button type="button" onClick={() => removeStakeholder(s.id)} className="p-2 text-rose-300 hover:text-rose-600 transition-colors"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                     </div>
                  </div>
                ))}
             </div>
          </section>
        </div>

        <footer className="px-10 py-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
           <button onClick={onClose} className="px-6 py-3 text-slate-500 font-black uppercase text-[10px]">Discard</button>
           <button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] px-10 py-3.5 rounded-xl shadow-xl hover:bg-slate-900 transition-all disabled:opacity-50">{isSaving ? 'Saving...' : 'Sync Record'}</button>
        </footer>
      </div>
    </div>
  );
};

export default GSTClientFormModal;
