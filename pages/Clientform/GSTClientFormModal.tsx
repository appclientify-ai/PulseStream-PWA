
import React, { useState, useEffect } from 'react';
import { 
  Client, 
  ConstitutionType, 
  GstRegType, 
  GstFilingFreq, 
  ClientStatus, 
  Stakeholder,
  GstStatus,
  BankDetails
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

  // Logic to auto-fetch Legal Name and PAN based on Constitution and Stakeholder 0
  const syncEntityDetails = (constitution: ConstitutionType, firstStakeholder: Stakeholder) => {
    if (!firstStakeholder) return;
    
    let derivedName = formData.legalName || '';
    let derivedPan = formData.gstProfile?.pan || '';

    if (constitution === 'Proprietorship') {
      derivedName = firstStakeholder.name;
      derivedPan = firstStakeholder.pan;
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
    
    // Auto extract PAN from GSTIN (chars 3 to 12)
    if (gstin.length >= 12) {
      pan = gstin.substring(2, 12);
    }

    setFormData(prev => ({
      ...prev,
      gstProfile: {
        ...prev.gstProfile!,
        gstin,
        pan,
        // Manual User ID preference - don't auto-set username to gstin anymore as per request
      }
    }));
  };

  const handleRegTypeChange = (type: GstRegType) => {
    setFormData(prev => ({
      ...prev,
      gstProfile: {
        ...prev.gstProfile!,
        regType: type,
        // Auto-select Quarterly for Composition taxpayers
        filingFreq: type === 'Composition' ? 'Quarterly' : prev.gstProfile?.filingFreq || 'Monthly'
      }
    }));
  };

  const handleConstitutionChange = (val: ConstitutionType) => {
    const firstStakeholder = formData.gstProfile?.stakeholders[0];
    setFormData(prev => ({
      ...prev,
      gstProfile: { ...prev.gstProfile!, constitution: val }
    }));
    if (firstStakeholder) syncEntityDetails(val, firstStakeholder);
  };

  const updateStakeholder = (id: string, field: keyof Stakeholder, val: string) => {
    setFormData(prev => {
      const updatedStakeholders = prev.gstProfile!.stakeholders.map(s => 
        s.id === id ? { ...s, [field]: val } : s
      );
      
      // If updating first member name/pan and constitution is Proprietorship/HUF, sync Entity Details
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

  const addStakeholder = () => {
    setFormData(prev => ({
      ...prev,
      gstProfile: {
        ...prev.gstProfile!,
        stakeholders: [...prev.gstProfile!.stakeholders, defaultStakeholder()]
      }
    }));
  };

  const removeStakeholder = (id: string) => {
    setFormData(prev => {
      if (prev.gstProfile!.stakeholders.length <= 1) return prev;
      return {
        ...prev,
        gstProfile: {
          ...prev.gstProfile!,
          stakeholders: prev.gstProfile!.stakeholders.filter(s => s.id !== id)
        }
      };
    });
  };

  const validateFormats = () => {
    const mobileRegex = /^[0-9]{10}$/;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (formData.mobile && !mobileRegex.test(formData.mobile)) return "Invalid 10-digit mobile number.";
    if (formData.gstProfile?.pan && !panRegex.test(formData.gstProfile.pan)) return "Invalid PAN format (e.g. ABCDE1234F).";
    if (formData.gstProfile?.gstin && !gstinRegex.test(formData.gstProfile.gstin)) return "Invalid GSTIN format.";
    
    // Validate stakeholders
    for (const s of formData.gstProfile?.stakeholders || []) {
      if (s.pan && !panRegex.test(s.pan)) return `Invalid PAN format for member: ${s.name || 'Member'}`;
      if (s.mobile && !mobileRegex.test(s.mobile)) return `Invalid 10-digit mobile for member: ${s.name || 'Member'}`;
    }

    return null;
  };

  const handleSave = async () => {
    setError(null);
    if (!formData.tradeName) return setError("Trade Name is mandatory.");
    if (!formData.gstProfile?.gstin) return setError("GSTIN identifier required.");
    
    const formatError = validateFormats();
    if (formatError) return setError(formatError);

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
            <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] font-black uppercase tracking-widest text-rose-600 animate-in shake duration-300 text-center">
              {error}
            </div>
          )}

          {/* 1. Administrative Status */}
          <section className="space-y-6">
             <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 flex items-center gap-3">Administrative Status <div className="h-px flex-1 bg-slate-100" /></h4>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Professional Status</label>
                   <select 
                     className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-50 transition-all cursor-pointer"
                     value={formData.status} 
                     onChange={e => setFormData({...formData, status: e.target.value as ClientStatus})}
                   >
                      <option value="Active">Active Relationship</option>
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
                      <option value="HUF">HUF (Hindu Undivided Family)</option>
                      <option value="Company">Private/Public Limited</option>
                      <option value="Trust">Trust / NGO</option>
                      <option value="Society">Co-operative Society</option>
                      <option value="Other">Other / Miscellaneous</option>
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Legal Name (As per PAN)</label>
                   <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black uppercase outline-none focus:border-indigo-600 focus:bg-white transition-all" value={formData.legalName} onChange={e => setFormData({...formData, legalName: e.target.value.toUpperCase()})} placeholder="LEGAL ENTITY NAME" />
                </div>
             </div>
          </section>

          {/* 2. GST Credentials */}
          <section className="space-y-6">
             <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 flex items-center gap-3">Portal Credentials <div className="h-px flex-1 bg-slate-100" /></h4>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-indigo-50/20 p-8 rounded-[2rem] border border-indigo-100/50">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest ml-1">GSTIN Identifier</label>
                   <div className="relative">
                      <input 
                        className="w-full bg-white border border-indigo-100 p-4 rounded-2xl font-black uppercase font-mono tracking-[0.2em] outline-none focus:border-indigo-600 transition-all text-indigo-600" 
                        value={formData.gstProfile?.gstin} 
                        onChange={e => handleGstinChange(e.target.value)} 
                        placeholder="GSTIN NO" 
                      />
                      <button type="button" onClick={() => window.open(`https://services.gst.gov.in/services/searchtp?gstin=${formData.gstProfile?.gstin}`, '_blank')} className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-300 hover:text-indigo-600 transition-colors"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></button>
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest ml-1">Entity PAN No.</label>
                   <input 
                     className="w-full bg-white border border-indigo-100 p-4 rounded-2xl font-black uppercase font-mono tracking-[0.2em] outline-none focus:border-indigo-600 transition-all text-indigo-600" 
                     value={formData.gstProfile?.pan} 
                     onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, pan: e.target.value.toUpperCase().slice(0, 10)}})} 
                     placeholder="ABCDE1234F" 
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest ml-1">Portal User ID</label>
                   <div className="relative">
                      <input className="w-full bg-white border border-indigo-100 p-4 rounded-2xl font-bold outline-none focus:border-indigo-600" value={formData.gstProfile?.username} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, username: e.target.value}})} placeholder="Login ID" />
                      <button type="button" onClick={() => { navigator.clipboard.writeText(formData.gstProfile?.username || ''); alert('ID Copied'); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-300 hover:text-indigo-600"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2-2v12a2 2 0 002 2h10a2 2 0 002-2v-1" /></svg></button>
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest ml-1">Secret Password</label>
                   <div className="relative">
                      <input type={showPassword ? "text" : "password"} className="w-full bg-white border border-indigo-100 p-4 rounded-2xl font-bold outline-none focus:border-indigo-600" value={formData.gstProfile?.password} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, password: e.target.value}})} placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">{showPassword ? '🙈' : '👁️'}</button>
                   </div>
                </div>
             </div>
          </section>

          {/* 3. Filing Metadata */}
          <section className="space-y-6">
             <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 flex items-center gap-3">Statutory Configuration <div className="h-px flex-1 bg-slate-100" /></h4>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">GSTIN Status</label>
                   <select 
                     className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none"
                     value={formData.gstProfile?.gstStatus} 
                     onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, gstStatus: e.target.value as GstStatus}})}
                   >
                      <option value="Active">GSTIN: Active</option>
                      <option value="Suspended">GSTIN: Suspended</option>
                      <option value="Closed">GSTIN: Cancelled</option>
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Taxpayer Category</label>
                   <select 
                     className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-50"
                     value={formData.gstProfile?.regType} 
                     onChange={e => handleRegTypeChange(e.target.value as GstRegType)}
                   >
                      <option value="Regular">Regular Taxpayer</option>
                      <option value="Composition">Composition Taxpayer</option>
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Filing Cycle</label>
                   <select 
                     className={`w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none ${formData.gstProfile?.regType === 'Composition' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                     disabled={formData.gstProfile?.regType === 'Composition'}
                     value={formData.gstProfile?.filingFreq} 
                     onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, filingFreq: e.target.value as GstFilingFreq}})}
                   >
                      <option value="Monthly">Monthly Filing</option>
                      <option value="Quarterly">Quarterly (QRMP)</option>
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Registration Date</label>
                   <input type="date" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black uppercase text-xs" value={formData.gstProfile?.regDate} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, regDate: e.target.value}})} />
                </div>
             </div>
          </section>

          {/* 5. Stakeholders */}
          <section className="space-y-6">
             <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600">Personnel / Members</h4>
                {!isProprietorship && (
                  <button type="button" onClick={addStakeholder} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">+ Add Member</button>
                )}
             </div>
             <div className="space-y-3">
                {formData.gstProfile?.stakeholders.map((s, idx) => (
                  <div key={s.id} className="group relative grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 animate-in fade-in zoom-in-95">
                     <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Member Name</label>
                        <input className="w-full bg-white border border-slate-200 p-3 rounded-xl font-black text-[10px] uppercase outline-none focus:border-indigo-600" value={s.name} onChange={e => updateStakeholder(s.id, 'name', e.target.value.toUpperCase())} placeholder="FULL LEGAL NAME" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Member PAN</label>
                        <input className="w-full bg-white border border-slate-200 p-3 rounded-xl font-black font-mono tracking-widest text-[10px] uppercase outline-none focus:border-indigo-600" value={s.pan} onChange={e => updateStakeholder(s.id, 'pan', e.target.value.toUpperCase().slice(0, 10))} placeholder="ABCDE1234F" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Contact Mobile</label>
                        <div className="flex gap-2">
                           <input className="w-full bg-white border border-slate-200 p-3 rounded-xl font-black text-[10px] outline-none focus:border-indigo-600" value={s.mobile} onChange={e => updateStakeholder(s.id, 'mobile', e.target.value.replace(/\D/g, ''))} placeholder="MOBILE NO" />
                           {formData.gstProfile!.stakeholders.length > 1 && (
                             <button type="button" onClick={() => removeStakeholder(s.id)} className="h-10 w-10 shrink-0 bg-white border border-rose-100 text-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center rounded-xl">
                               <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                             </button>
                           )}
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </section>

          {/* 4. Contact Details */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <div className="space-y-6">
                <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 flex items-center gap-3">Accountant Contact <div className="h-px flex-1 bg-slate-100" /></h4>
                <div className="grid grid-cols-2 gap-4">
                   <input className="bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold text-xs uppercase" value={formData.gstProfile?.accountantName} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, accountantName: e.target.value.toUpperCase()}})} placeholder="ACCOUNTANT NAME" />
                   <input className="bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold text-xs" value={formData.gstProfile?.accountantMobile} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, accountantMobile: e.target.value.replace(/\D/g, '')}})} placeholder="CONTACT NO" />
                </div>
             </div>
             <div className="space-y-6">
                <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 flex items-center gap-3">Contact Information <div className="h-px flex-1 bg-slate-100" /></h4>
                <div className="grid grid-cols-2 gap-4">
                   <input className="bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold text-xs" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '')})} placeholder="ENTITY MOBILE" />
                   <input className="bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold text-xs lowercase" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="ENTITY EMAIL" />
                </div>
             </div>
          </section>

          {/* 6. Banking */}
          <section className="space-y-6">
             <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 flex items-center gap-3">Banking Sync <div className="h-px flex-1 bg-slate-100" /></h4>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Primary Bank Name</label>
                   <input className="w-full bg-white border border-slate-200 p-4 rounded-2xl font-black uppercase outline-none focus:border-indigo-600 transition-all text-xs" value={formData.bankDetails?.bankName} onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails!, bankName: e.target.value.toUpperCase()}})} placeholder="BANK IDENTITY" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Account Number</label>
                   <input className="w-full bg-white border border-slate-200 p-4 rounded-2xl font-black font-mono outline-none focus:border-indigo-600 transition-all text-xs" value={formData.bankDetails?.accountNo} onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails!, accountNo: e.target.value}})} placeholder="0000 0000 0000" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">IFSC Code</label>
                   <input className="w-full bg-white border border-slate-200 p-4 rounded-2xl font-black font-mono tracking-widest outline-none focus:border-indigo-600 transition-all text-xs uppercase" value={formData.bankDetails?.ifsc} onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails!, ifsc: e.target.value.toUpperCase()}})} placeholder="IFSC CODE" />
                </div>
             </div>
          </section>

          <section className="space-y-6">
             <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 flex items-center gap-3">Firm Remarks <div className="h-px flex-1 bg-slate-100" /></h4>
             <textarea className="w-full bg-slate-50 border border-slate-200 p-6 rounded-[2rem] font-bold text-xs h-32 outline-none focus:ring-4 focus:ring-indigo-50 transition-all" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} placeholder="Internal office notes, legacy history, or specific instructions..." />
          </section>
        </div>

        <footer className="px-10 py-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-4 shrink-0">
           <button onClick={onClose} className="px-10 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:text-slate-900 transition-colors">Discard</button>
           <button 
             onClick={handleSave} 
             disabled={isSaving}
             className="bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-[10px] px-14 py-5 rounded-2xl shadow-2xl hover:bg-slate-900 transition-all active:scale-[0.98] disabled:opacity-50"
           >
             {isSaving ? 'Synchronizing...' : (initialData ? 'Update Vault Record' : 'Commit To Archive')}
           </button>
        </footer>
      </div>
    </div>
  );
};

export default GSTClientFormModal;
