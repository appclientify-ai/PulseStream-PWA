import React, { useState, useEffect } from 'react';
import { 
  Client, 
  ConstitutionType, 
  GstRegType, 
  GstFilingFreq, 
  ClientStatus, 
  Stakeholder,
  GstStatus,
  JurisdictionType
} from '../../types.ts';
import { api } from '../../services/api.ts';
import { toast } from 'sonner';

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

  const createStakeholder = (): Stakeholder => ({
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
      stakeholders: [createStakeholder()],
      accountantName: '',
      accountantMobile: '',
      address: '',
      jurisdictionType: 'State',
      sector: '',
      range: '',
      ewayBillId: '',
      ewayBillPass: '',
      gstatId: '',
      gstatPass: ''
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
            stakeholders: initialData.gstProfile?.stakeholders || [createStakeholder()]
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
        stakeholders: [createStakeholder()],
        accountantName: '',
        accountantMobile: '',
        address: '',
        jurisdictionType: 'State',
        sector: '',
        range: '',
        ewayBillId: '',
        ewayBillPass: '',
        gstatId: '',
        gstatPass: ''
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
    setFormData(prev => ({
      ...prev,
      gstProfile: { ...prev.gstProfile!, gstin, pan }
    }));
  };

  const handleRegTypeChange = (type: GstRegType) => {
    setFormData(prev => ({
      ...prev,
      gstProfile: {
        ...prev.gstProfile!,
        regType: type,
        // Composition taxpayers automatically route to Quarterly cycle
        filingFreq: type === 'Composition' ? 'Quarterly' : prev.gstProfile?.filingFreq || 'Monthly'
      }
    }));
  };

  const addStakeholder = () => {
    setFormData(prev => ({
      ...prev,
      gstProfile: {
        ...prev.gstProfile!,
        stakeholders: [...prev.gstProfile!.stakeholders, createStakeholder()]
      }
    }));
  };

  const removeStakeholder = (id: string) => {
    setFormData(prev => ({
      ...prev,
      gstProfile: {
        ...prev.gstProfile!,
        stakeholders: prev.gstProfile!.stakeholders.filter(s => s.id !== id)
      }
    }));
  };

  const getStakeholderLabel = (constitution: ConstitutionType = 'Proprietorship') => {
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

  const handleSave = async () => {
    setError(null);
    if (!formData.tradeName) return setError("Trade Name is required.");
    if (!formData.gstProfile?.gstin) return setError("GSTIN is required.");
    
    setIsSaving(true);
    try {
      const saved = await api.saveClient(formData);
      onSave(saved);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to sync vault.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/70 backdrop-blur-xl p-4 overflow-hidden animate-in fade-in duration-300">
      <div className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-slate-200">
        
        <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-4">
             <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" /></svg>
             </div>
             <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{initialData ? 'Edit Client Profile' : 'Add New GST Client'}</h2>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Master Compliance Vault Entry</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10">
          {error && <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600 text-center">{error}</div>}

          {/* 1. Management Details */}
          <section className="space-y-6">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">1. Management Details <div className="h-px flex-1 bg-slate-100" /></h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Client Status</label>
                <select className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as ClientStatus})}>
                  <option value="Active">Active</option>
                  <option value="Litigation">Litigation</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </section>

          {/* 2. GST Credentials */}
          <section className="space-y-6">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">2. GST Credentials <div className="h-px flex-1 bg-slate-100" /></h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">GSTIN</label>
                <div className="relative">
                  <input className="w-full bg-indigo-50/30 border border-indigo-100 p-3 rounded-xl font-black uppercase font-mono tracking-widest text-indigo-600 outline-none" value={formData.gstProfile?.gstin} onChange={e => handleGstinChange(e.target.value)} placeholder="GSTIN No." />
                  <button type="button" onClick={() => (navigator.clipboard.writeText(formData.gstProfile?.gstin || '').then(() => { toast.success('GSTIN Copied!'); window.open('https://services.gst.gov.in/services/searchtp', '_blank'); }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-600"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">PAN No.</label>
                <input readOnly className="w-full bg-slate-100 border border-slate-200 p-3 rounded-xl font-black uppercase font-mono tracking-widest text-slate-500 outline-none" value={formData.gstProfile?.pan} placeholder="Auto PAN" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">GST User ID</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none" value={formData.gstProfile?.username} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, username: e.target.value}})} placeholder="Login ID" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">GST Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none" value={formData.gstProfile?.password} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, password: e.target.value}})} placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600">{showPassword ? '🙈' : '👁️'}</button>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Business Info */}
          <section className="space-y-6">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">3. Business Information <div className="h-px flex-1 bg-slate-100" /></h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Trade Name</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold uppercase outline-none focus:border-indigo-600 transition-all" value={formData.tradeName} onChange={e => setFormData({...formData, tradeName: e.target.value.toUpperCase()})} placeholder="Entity Trading Name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Legal Name</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold uppercase outline-none focus:border-indigo-600 transition-all" value={formData.legalName} onChange={e => setFormData({...formData, legalName: e.target.value.toUpperCase()})} placeholder="Legal Registered Name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Business Type</label>
                  <select className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none" value={formData.gstProfile?.constitution} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, constitution: e.target.value as ConstitutionType}})}>
                    <option value="Proprietorship">Proprietorship</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Company">Company</option>
                    <option value="HUF">HUF</option>
                    <option value="Trust">Trust</option>
                    <option value="Society">Society</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Taxpayer Type</label>
                  <select className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none" value={formData.gstProfile?.regType} onChange={e => handleRegTypeChange(e.target.value as GstRegType)}>
                    <option value="Regular">Regular</option>
                    <option value="Composition">Composition</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Filing Frequency</label>
                  <select disabled={formData.gstProfile?.regType === 'Composition'} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none disabled:opacity-50" value={formData.gstProfile?.filingFreq} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, filingFreq: e.target.value as GstFilingFreq}})}>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Jurisdiction</label>
                  <select className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none" value={formData.gstProfile?.jurisdictionType} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, jurisdictionType: e.target.value as JurisdictionType}})}>
                    <option value="State">State</option>
                    <option value="Center">Center</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Registration Date</label>
                  <input type="date" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none uppercase" value={formData.gstProfile?.regDate} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, regDate: e.target.value}})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">GSTN Status</label>
                  <select className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none" value={formData.gstProfile?.gstStatus} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, gstStatus: e.target.value as GstStatus}})}>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Closed">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {formData.gstProfile?.jurisdictionType === 'State' ? (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Sector</label>
                    <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none" value={formData.gstProfile?.sector} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, sector: e.target.value.toUpperCase()}})} placeholder="Sector" />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Range</label>
                    <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none" value={formData.gstProfile?.range} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, range: e.target.value.toUpperCase()}})} placeholder="Range" />
                  </div>
                )}
                {formData.gstProfile?.gstStatus === 'Closed' && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-2">
                    <label className="text-[10px] font-black uppercase text-rose-400 tracking-widest ml-1">Cancellation Date</label>
                    <input type="date" className="w-full bg-rose-50 border border-rose-100 p-3 rounded-xl font-bold outline-none uppercase text-rose-600" value={formData.gstProfile?.cancelDate} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, cancelDate: e.target.value}})} />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 4. Dynamic Stakeholder Details */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3 flex-1">4. {getStakeholderLabel(formData.gstProfile?.constitution)} Details <div className="h-px flex-1 bg-slate-100" /></h4>
              {formData.gstProfile?.constitution !== 'Proprietorship' && (
                <button type="button" onClick={addStakeholder} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">+ Add {getStakeholderLabel(formData.gstProfile?.constitution)}</button>
              )}
            </div>
            
            <div className="space-y-4">
              {formData.gstProfile?.stakeholders.map((s, idx) => (
                <div key={s.id} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 relative group/stake">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Name</label>
                      <input className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold uppercase w-full" value={s.name} onChange={e => {
                        const next = [...formData.gstProfile!.stakeholders];
                        next[idx].name = e.target.value.toUpperCase();
                        setFormData({...formData, gstProfile: {...formData.gstProfile!, stakeholders: next}});
                      }} placeholder="Full Name" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Mobile</label>
                      <input className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold w-full" value={s.mobile} onChange={e => {
                        const next = [...formData.gstProfile!.stakeholders];
                        next[idx].mobile = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFormData({...formData, gstProfile: {...formData.gstProfile!, stakeholders: next}});
                      }} placeholder="Mobile No" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">PAN</label>
                      <input className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold uppercase font-mono w-full" value={s.pan} onChange={e => {
                        const next = [...formData.gstProfile!.stakeholders];
                        next[idx].pan = e.target.value.toUpperCase().slice(0, 10);
                        setFormData({...formData, gstProfile: {...formData.gstProfile!, stakeholders: next}});
                      }} placeholder="PAN No" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Email</label>
                      <input className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold lowercase w-full" value={s.itPassword} onChange={e => {
                        const next = [...formData.gstProfile!.stakeholders];
                        next[idx].itPassword = e.target.value;
                        setFormData({...formData, gstProfile: {...formData.gstProfile!, stakeholders: next}});
                      }} placeholder="Email Address" />
                    </div>
                  </div>
                  {formData.gstProfile!.stakeholders.length > 1 && (
                    <button type="button" onClick={() => removeStakeholder(s.id)} className="absolute -right-2 -top-2 h-8 w-8 bg-rose-50 text-rose-500 rounded-full border border-rose-100 flex items-center justify-center shadow-lg opacity-0 group-hover/stake:opacity-100 transition-all">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Portals & Filing Sync */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
             <div className="space-y-6">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">5. Filing & Contact <div className="h-px flex-1 bg-slate-100" /></h4>
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Accountant Name</label>
                    <input className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold uppercase w-full" value={formData.gstProfile?.accountantName} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, accountantName: e.target.value.toUpperCase()}})} placeholder="NAME" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Accountant Mobile</label>
                    <input className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold w-full" value={formData.gstProfile?.accountantMobile} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, accountantMobile: e.target.value.replace(/\D/g, '').slice(0, 10)}})} placeholder="MOBILE" />
                  </div>
                </div>
             </div>
             <div className="space-y-6">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">6. E-Way Bill <div className="h-px flex-1 bg-slate-100" /></h4>
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">User ID</label>
                    <input className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold w-full" value={formData.gstProfile?.ewayBillId} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, ewayBillId: e.target.value}})} placeholder="USER ID" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Password</label>
                    <input type="password" password className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold w-full" value={formData.gstProfile?.ewayBillPass} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, ewayBillPass: e.target.value}})} placeholder="••••••••" />
                  </div>
                </div>
             </div>
             <div className="space-y-6">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">7. GSTAT Portal <div className="h-px flex-1 bg-slate-100" /></h4>
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">User ID</label>
                    <input className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold w-full" value={formData.gstProfile?.gstatId} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, gstatId: e.target.value}})} placeholder="USER ID" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Password</label>
                    <input type="password" password className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold w-full" value={formData.gstProfile?.gstatPass} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, gstatPass: e.target.value}})} placeholder="••••••••" />
                  </div>
                </div>
             </div>
          </section>

          {/* Bank & Notes */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
             <div className="space-y-6">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">8. Bank Details <div className="h-px flex-1 bg-slate-100" /></h4>
                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Bank Name</label>
                    <input className="bg-white border border-slate-200 p-3 rounded-xl text-sm font-black uppercase w-full" value={formData.bankDetails?.bankName} onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails!, bankName: e.target.value.toUpperCase()}})} placeholder="Bank Name" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Account Number</label>
                    <input className="bg-white border border-slate-200 p-3 rounded-xl text-sm font-black font-mono tracking-widest w-full" value={formData.bankDetails?.accountNo} onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails!, accountNo: e.target.value}})} placeholder="0000 0000 0000" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">IFSC Code</label>
                    <input className="bg-white border border-slate-200 p-3 rounded-xl text-sm font-black font-mono tracking-widest uppercase w-full" value={formData.bankDetails?.ifsc} onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails!, ifsc: e.target.value.toUpperCase()}})} placeholder="IFSC" />
                  </div>
                </div>
             </div>
             <div className="space-y-6">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">9. Office Notes <div className="h-px flex-1 bg-slate-100" /></h4>
                <textarea className="w-full h-[220px] bg-slate-50 border border-slate-200 rounded-[2rem] p-6 font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-100 transition-all resize-none" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} placeholder="Archive internal history..." />
             </div>
          </section>
        </div>

        <footer className="px-8 py-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
           <button onClick={onClose} className="px-6 py-3 text-slate-500 font-black uppercase tracking-widest text-[10px]">Discard</button>
           <button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] px-10 py-3.5 rounded-xl shadow-xl hover:bg-slate-900 transition-all disabled:opacity-50">
             {isSaving ? 'Synchronizing...' : 'Encrypt & Sync to Vault'}
           </button>
        </footer>
      </div>
    </div>
  );
};

export default GSTClientFormModal;