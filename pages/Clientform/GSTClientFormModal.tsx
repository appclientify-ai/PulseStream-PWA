
import React, { useState, useEffect } from 'react';
import { 
  Client, 
  ConstitutionType, 
  GstRegType, 
  GstFilingFreq, 
  ClientStatus, 
  Stakeholder 
} from '../../types.ts';
import { api } from '../../services/api.ts';

interface GSTClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
  initialData?: Client | null;
  context?: 'gst';
}

const GSTClientFormModal: React.FC<GSTClientFormModalProps> = ({ isOpen, onClose, onSave, initialData, context = 'gst' }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [existingClients, setExistingClients] = useState<Client[]>([]);

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
      regType: 'Regular',
      filingFreq: 'Monthly',
      constitution: 'Proprietorship',
      stakeholders: [defaultStakeholder()],
      advisoryWork: {
        returns: true,
        notices: false,
        appeals: false,
        audit: false
      }
    },
    bankDetails: { bankName: '', accountNo: '', ifsc: '' },
    remarks: ''
  });

  useEffect(() => {
    if (isOpen) {
      api.getClients().then(setExistingClients);
      if (initialData) {
        setFormData(initialData);
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
        regType: 'Regular',
        filingFreq: 'Monthly',
        constitution: 'Proprietorship',
        stakeholders: [defaultStakeholder()],
        advisoryWork: { returns: true, notices: false, appeals: false, audit: false }
      },
      bankDetails: { bankName: '', accountNo: '', ifsc: '' },
      remarks: ''
    });
    setError(null);
  };

  const handleGstinChange = (val: string) => {
    const gstin = val.toUpperCase().trim().slice(0, 15);
    let pan = formData.gstProfile?.pan || '';
    
    // Auto-derive PAN from GSTIN (Positions 3-12)
    if (gstin.length >= 10) {
      pan = gstin.substring(2, 12);
    }

    const nextData = {
      ...formData,
      gstProfile: {
        ...formData.gstProfile!,
        gstin,
        pan,
        stakeholders: formData.gstProfile!.stakeholders.map((s, idx) => 
          idx === 0 ? { ...s, pan: pan } : s
        )
      }
    };
    handleBusinessLogicSync(nextData);
  };

  const handleBusinessLogicSync = (nextData: Partial<Client>) => {
    const profile = nextData.gstProfile!;
    
    // Force Quarterly for Composition
    if (profile.regType === 'Composition') {
      profile.filingFreq = 'Quarterly';
    }

    // Auto-Legal Name sync (Proprietorship = First Stakeholder Name, Company = Trade Name)
    if (profile.constitution === 'Proprietorship' && profile.stakeholders[0]?.name) {
      nextData.legalName = profile.stakeholders[0].name.toUpperCase();
    } else if (profile.constitution === 'Company' && nextData.tradeName) {
      nextData.legalName = nextData.tradeName.toUpperCase();
    }

    setFormData({ ...nextData });
  };

  const addStakeholder = () => {
    const next = { ...formData };
    next.gstProfile!.stakeholders.push(defaultStakeholder());
    setFormData(next);
  };

  const removeStakeholder = (id: string) => {
    const next = { ...formData };
    if (next.gstProfile!.stakeholders.length > 1) {
      next.gstProfile!.stakeholders = next.gstProfile!.stakeholders.filter(s => s.id !== id);
      setFormData(next);
    }
  };

  const updateStakeholder = (id: string, field: keyof Stakeholder, val: string) => {
    const next = { ...formData };
    next.gstProfile!.stakeholders = next.gstProfile!.stakeholders.map(s => 
      s.id === id ? { ...s, [field]: val } : s
    );
    handleBusinessLogicSync(next);
  };

  const handleSave = async () => {
    setError(null);
    const profile = formData.gstProfile!;

    if (!formData.legalName) return setError("Principal Legal Name is required.");
    if (profile.gstin.length !== 15) return setError("GSTIN must be exactly 15 characters.");
    
    const isDuplicate = existingClients.some(c => 
      c.gstProfile?.gstin === profile.gstin && c.id !== initialData?.id
    );
    if (isDuplicate) return setError(`GSTIN ${profile.gstin} is already registered.`);

    setIsSaving(true);
    try {
      const saved = await api.saveClient(formData);
      onSave(saved);
      onClose();
    } catch (err: any) {
      setError(err.message || "Save failed.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const stakeholderTitle = formData.gstProfile?.constitution === 'Proprietorship' ? 'Proprietor' : 
                          formData.gstProfile?.constitution === 'Partnership' ? 'Partner' : 'Director';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-hidden animate-in fade-in duration-300">
      <div className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        
        <header className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-4">
             <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2-2h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011-1v5m-4 0h4" /></svg>
             </div>
             <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">
                   {initialData ? 'Edit GST Client' : 'Add New GST Client'}
                </h2>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-2">Professional Compliance Vault</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all shadow-sm">
            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar p-10 space-y-12">
          {error && (
            <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] font-black uppercase tracking-widest text-rose-600 text-center">
              {error}
            </div>
          )}

          <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="col-span-full border-l-4 border-indigo-600 pl-4 mb-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">1. Management</h3>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Client Status</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-50 transition-all cursor-pointer"
                  value={formData.status} 
                  onChange={e => setFormData({...formData, status: e.target.value as ClientStatus})}
                >
                   <option value="Active Filing">Active</option>
                   <option value="Inactive">Inactive</option>
                </select>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Work Email</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none focus:bg-white transition-all lowercase" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="office@firm.com" />
             </div>
          </fieldset>

          <fieldset className="space-y-6">
             <div className="col-span-full border-l-4 border-indigo-600 pl-4 mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">2. GST Credentials</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">GSTIN Identifier</label>
                   <div className="flex gap-2">
                      <input 
                        className="flex-1 bg-indigo-50/30 border-2 border-indigo-100 p-4 rounded-2xl font-black uppercase font-mono tracking-[0.2em] outline-none focus:border-indigo-600 focus:bg-white transition-all text-indigo-600" 
                        value={formData.gstProfile?.gstin} 
                        onChange={e => handleGstinChange(e.target.value)} 
                        placeholder="22AAAAA0000A1Z5" 
                      />
                      <button 
                        type="button"
                        onClick={() => { 
                          navigator.clipboard.writeText(formData.gstProfile?.gstin || ''); 
                          window.open('https://services.gst.gov.in/services/searchtp', '_blank'); 
                        }}
                        className="bg-slate-900 text-white px-5 rounded-2xl hover:bg-indigo-600 transition-all font-black text-[10px] uppercase tracking-widest"
                      >
                        Search TP
                      </button>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">GST User ID</label>
                      <div className="flex gap-2">
                        <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none" value={formData.gstProfile?.username} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, username: e.target.value}})} placeholder="Login ID" />
                        <button type="button" onClick={() => { navigator.clipboard.writeText(formData.gstProfile?.username || ''); window.open('https://services.gst.gov.in/services/login', '_blank'); }} className="bg-slate-100 p-3 rounded-2xl hover:bg-indigo-100 text-indigo-600 transition-all">
                           <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </button>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Password</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"}
                          className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none" 
                          value={formData.gstProfile?.password} 
                          onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, password: e.target.value}})} 
                          placeholder="••••••••" 
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600">
                          {showPassword ? <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg> : <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg>}
                        </button>
                      </div>
                   </div>
                </div>
             </div>
          </fieldset>

          <fieldset className="space-y-6">
             <div className="col-span-full border-l-4 border-indigo-600 pl-4 mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">3. Business Information</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Trade Name</label>
                   <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black uppercase outline-none focus:border-indigo-600 focus:bg-white transition-all" value={formData.tradeName} onChange={e => handleBusinessLogicSync({...formData, tradeName: e.target.value})} placeholder="RELIANCE STORE" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">Legal Identity (Auto)</label>
                   <input readOnly className="w-full bg-slate-100 border border-slate-200 p-4 rounded-2xl font-black uppercase text-slate-500 cursor-not-allowed outline-none" value={formData.legalName} placeholder="Derived from Business Type..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 col-span-full">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Business Type</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none"
                        value={formData.gstProfile?.constitution} 
                        onChange={e => handleBusinessLogicSync({...formData, gstProfile: {...formData.gstProfile!, constitution: e.target.value as ConstitutionType}})}
                      >
                         <option value="Proprietorship">Individual</option>
                         <option value="Partnership">Partnership</option>
                         <option value="Company">Company</option>
                         <option value="HUF">HUF</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Taxpayer Type</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none"
                        value={formData.gstProfile?.regType} 
                        onChange={e => handleBusinessLogicSync({...formData, gstProfile: {...formData.gstProfile!, regType: e.target.value as GstRegType}})}
                      >
                         <option value="Regular">Regular</option>
                         <option value="Composition">Composition</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Filing Frequency</label>
                      <select 
                        disabled={formData.gstProfile?.regType === 'Composition'}
                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none disabled:opacity-50"
                        value={formData.gstProfile?.filingFreq} 
                        onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, filingFreq: e.target.value as GstFilingFreq}})}
                      >
                         <option value="Monthly">Monthly</option>
                         <option value="Quarterly">Quarterly</option>
                      </select>
                   </div>
                </div>
             </div>
          </fieldset>

          <fieldset className="space-y-6">
             <div className="flex items-center justify-between border-l-4 border-indigo-600 pl-4 mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">{stakeholderTitle} Details</h3>
                {formData.gstProfile?.constitution !== 'Proprietorship' && (
                  <button type="button" onClick={addStakeholder} className="text-[10px] font-black uppercase text-indigo-600 hover:underline">+ Add Member</button>
                )}
             </div>
             <div className="space-y-8">
                {formData.gstProfile?.stakeholders.map((s, idx) => (
                  <div key={s.id} className="relative p-8 rounded-3xl bg-slate-50 border border-slate-100 group animate-in slide-in-from-left-4">
                     {idx > 0 && (
                       <button onClick={() => removeStakeholder(s.id)} className="absolute top-4 right-4 h-8 w-8 bg-white border border-rose-100 text-rose-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                         <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
                       </button>
                     )}
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Name</label>
                           <input className="w-full bg-white border border-slate-200 p-3.5 rounded-xl font-bold uppercase outline-none focus:ring-4 focus:ring-indigo-100" value={s.name} onChange={e => updateStakeholder(s.id, 'name', e.target.value)} placeholder="Full Name" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Mobile</label>
                           <input maxLength={10} className="w-full bg-white border border-slate-200 p-3.5 rounded-xl font-bold outline-none" value={s.mobile} onChange={e => updateStakeholder(s.id, 'mobile', e.target.value.replace(/\D/g, ''))} placeholder="9876543210" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">PAN</label>
                           <input maxLength={10} className="w-full bg-white border border-slate-200 p-3.5 rounded-xl font-black uppercase font-mono tracking-widest outline-none" value={s.pan} onChange={e => updateStakeholder(s.id, 'pan', e.target.value.toUpperCase())} placeholder="ABCDE1234F" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">IT Password</label>
                           <input className="w-full bg-white border border-slate-200 p-3.5 rounded-xl font-bold outline-none" value={s.itPassword} onChange={e => updateStakeholder(s.id, 'itPassword', e.target.value)} placeholder="IT Portal Pass" />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                           <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Residential Address</label>
                           <input className="w-full bg-white border border-slate-200 p-3.5 rounded-xl font-medium outline-none" value={s.address} onChange={e => updateStakeholder(s.id, 'address', e.target.value)} placeholder="Full physical address..." />
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </fieldset>

          <fieldset className="space-y-6">
             <div className="col-span-full border-l-4 border-indigo-600 pl-4 mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">4. Advisory Work</h3>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                {[
                   { id: 'returns', label: 'GST Returns' },
                   { id: 'notices', label: 'Notice Reply' },
                   { id: 'appeals', label: 'Appeals' },
                   { id: 'audit', label: 'GST Audit' }
                ].map((item) => (
                  <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                     <div className={`h-6 w-6 rounded-lg border-2 transition-all flex items-center justify-center ${formData.gstProfile?.advisoryWork?.[item.id as keyof typeof formData.gstProfile.advisoryWork] ? 'bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-100' : 'bg-white border-slate-200 group-hover:border-indigo-400'}`}>
                        {formData.gstProfile?.advisoryWork?.[item.id as keyof typeof formData.gstProfile.advisoryWork] && (
                           <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                        )}
                     </div>
                     <input 
                       type="checkbox" 
                       className="hidden" 
                       checked={formData.gstProfile?.advisoryWork?.[item.id as keyof typeof formData.gstProfile.advisoryWork]} 
                       onChange={() => setFormData({...formData, gstProfile: {...formData.gstProfile!, advisoryWork: {...formData.gstProfile!.advisoryWork!, [item.id]: !formData.gstProfile!.advisoryWork![item.id as keyof typeof formData.gstProfile.advisoryWork]}}})} 
                     />
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">{item.label}</span>
                  </label>
                ))}
             </div>
          </fieldset>

          <fieldset className="space-y-6 pb-6">
             <div className="col-span-full border-l-4 border-indigo-600 pl-4 mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">5. Bank Details</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Bank Name</label>
                   <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none uppercase" value={formData.bankDetails?.bankName} onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails!, bankName: e.target.value}})} placeholder="HDFC / SBI" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">A/C Number</label>
                   <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black font-mono tracking-widest outline-none" value={formData.bankDetails?.accountNo} onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails!, accountNo: e.target.value}})} placeholder="000000000000" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">IFSC Code</label>
                   <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black font-mono tracking-widest outline-none uppercase" value={formData.bankDetails?.ifsc} onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails!, ifsc: e.target.value.toUpperCase()}})} placeholder="HDFC0000123" />
                </div>
             </div>
          </fieldset>
        </div>

        <footer className="px-10 py-8 border-t border-slate-100 bg-slate-50 flex items-center justify-end shrink-0 rounded-b-[2.5rem] gap-4">
           <button onClick={onClose} className="px-10 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:text-slate-800 transition-colors">Discard</button>
           <button 
             onClick={handleSave} 
             disabled={isSaving}
             className="bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-[10px] px-12 py-5 rounded-2xl shadow-xl hover:bg-slate-900 transition-all active:scale-[0.98] disabled:opacity-50"
           >
             {isSaving ? 'Saving...' : 'Commit Record'}
           </button>
        </footer>

      </div>
    </div>
  );
};

export default GSTClientFormModal;
