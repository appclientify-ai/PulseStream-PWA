import React, { useState, useEffect, useRef } from 'react';
import { Client, GSTProfile, Stakeholder, ConstitutionType, GstStatus, GstRegType, GstFilingFreq, ClientStatus, JurisdictionType } from '../../types';
import { mockBackend } from '../../services/mockBackend';

interface GSTClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
  initialData?: Client | null;
}

const GSTClientFormModal: React.FC<GSTClientFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<Client>>({
    legalName: '',
    tradeName: '',
    email: '',
    mobile: '',
    status: 'Active Filing',
    gstProfile: {
      gstin: '',
      username: '',
      password: '',
      gstStatus: 'Active',
      regDate: '',
      regType: 'Regular',
      filingFreq: 'Monthly',
      constitution: 'Proprietorship',
      stakeholders: [],
      address: '',
      jurisdictionType: 'State',
      sector: '',
      range: '',
      accountantName: '',
      accountantMobile: '',
    },
    bankDetails: {
      bankName: '',
      accountNo: '',
      ifsc: ''
    },
    remarks: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        legalName: '',
        tradeName: '',
        email: '',
        mobile: '',
        status: 'Active Filing',
        gstProfile: {
          gstin: '',
          username: '',
          password: '',
          gstStatus: 'Active',
          regDate: '',
          regType: 'Regular',
          filingFreq: 'Monthly',
          constitution: 'Proprietorship',
          stakeholders: [],
          address: '',
          jurisdictionType: 'State',
          sector: '',
          range: '',
          accountantName: '',
          accountantMobile: '',
        },
        bankDetails: { bankName: '', accountNo: '', ifsc: '' }
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  useEffect(() => {
    const gstin = formData.gstProfile?.gstin || '';
    if (gstin.length >= 12) {
      const pan = gstin.substring(2, 12);
      if (formData.gstProfile?.constitution === 'Proprietorship') {
        const stakeholders = [{
          id: 'proprietor_1',
          name: formData.legalName || '',
          pan: pan,
          mobile: formData.mobile || ''
        }];
        setFormData(prev => ({
          ...prev,
          gstProfile: { ...prev.gstProfile!, stakeholders }
        }));
      }
    }
  }, [formData.gstProfile?.gstin, formData.gstProfile?.constitution, formData.legalName, formData.mobile]);

  const handleGstChange = (field: keyof GSTProfile, value: any) => {
    setFormData(prev => {
      const updatedProfile = { ...prev.gstProfile!, [field]: value };
      if (field === 'regType' && value === 'Composition') {
        updatedProfile.filingFreq = 'Quarterly';
      }
      return { ...prev, gstProfile: updatedProfile };
    });
  };

  const addStakeholder = () => {
    handleGstChange('stakeholders', [
      ...(formData.gstProfile?.stakeholders || []),
      { id: Date.now().toString(), name: '', mobile: '', pan: '' }
    ]);
  };

  const removeStakeholder = (id: string) => {
    handleGstChange('stakeholders', (formData.gstProfile?.stakeholders || []).filter(s => s.id !== id));
  };

  const updateStakeholder = (id: string, field: keyof Stakeholder, value: string) => {
    handleGstChange('stakeholders', (formData.gstProfile?.stakeholders || []).map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const validateGstin = (gst: string) => {
    const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return regex.test(gst);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateMobile = (mobile: string) => {
    return /^[6-9]\d{9}$/.test(mobile);
  };

  const validateAccountNo = (acc: string) => {
    return /^\d{9,18}$/.test(acc);
  };

  const handleSave = async () => {
    setError(null);
    try {
      if (!formData.legalName) throw new Error("Legal Name is required");
      
      if (!formData.gstProfile?.gstin || !validateGstin(formData.gstProfile.gstin)) {
        throw new Error("Invalid GSTIN Format (e.g. 27AAAAA0000A1Z5)");
      }

      if (formData.mobile && !validateMobile(formData.mobile)) {
        throw new Error("Mobile Number must be 10 digits starting with 6-9");
      }

      if (formData.email && !validateEmail(formData.email)) {
        throw new Error("Please enter a valid Email Address");
      }

      if (formData.bankDetails?.accountNo && !validateAccountNo(formData.bankDetails.accountNo)) {
        throw new Error("Bank Account Number should be between 9 to 18 digits");
      }

      // Validate Stakeholders
      for (const s of (formData.gstProfile?.stakeholders || [])) {
        if (s.mobile && !validateMobile(s.mobile)) {
          throw new Error(`Invalid mobile for personnel: ${s.name || 'Unnamed'}`);
        }
      }

      const saved = await mockBackend.saveClient(formData);
      onSave(saved);
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        handleGstChange('certificateUrl', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const copyAndLogin = () => {
    navigator.clipboard.writeText(formData.gstProfile?.username || '');
    window.open('https://services.gst.gov.in/services/login', '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-hidden">
      <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Add GST Client</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {error && (
          <div className="mx-8 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 font-bold text-sm animate-in shake duration-300">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          
          {/* Section: Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Client Status</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold outline-none"
                value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as ClientStatus})}>
                <option value="Active Filing">Active Filing</option>
                <option value="Case-by-Case">Case-by-Case</option>
                <option value="Inactive (Temporary)">Inactive (Temporary)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Legal Name</label>
              <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold uppercase"
                value={formData.legalName} onChange={e => setFormData({...formData, legalName: e.target.value})} placeholder="AS PER PAN" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Trade Name</label>
              <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold"
                value={formData.tradeName} onChange={e => setFormData({...formData, tradeName: e.target.value})} placeholder="Business Name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Mobile Number</label>
                <input type="tel" maxLength={10} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold"
                  value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '')})} placeholder="10 digit number" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Email Address</label>
                <input type="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold"
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="client@example.com" />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section: GST Credentials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">GSTIN Identification</label>
              <input maxLength={15} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black uppercase tracking-widest text-lg"
                value={formData.gstProfile?.gstin} onChange={e => handleGstChange('gstin', e.target.value.toUpperCase())} placeholder="27XXXXX0000X1Z5" />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Portal Username</label>
              <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold"
                value={formData.gstProfile?.username} onChange={e => handleGstChange('username', e.target.value)} />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Portal Password</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input type={showPassword ? "text" : "password"} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold"
                    value={formData.gstProfile?.password} onChange={e => handleGstChange('password', e.target.value)} />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400">
                    {showPassword ? <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg> : <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg>}
                  </button>
                </div>
                <button onClick={copyAndLogin} className="px-4 bg-indigo-600 text-white font-black uppercase text-[10px] rounded-xl shadow-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Login
                </button>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section: Registration Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">GSTIN Status</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold outline-none"
                value={formData.gstProfile?.gstStatus} onChange={e => handleGstChange('gstStatus', e.target.value as GstStatus)}>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Reg. Date</label>
              <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold"
                value={formData.gstProfile?.regDate} onChange={e => handleGstChange('regDate', e.target.value)} />
            </div>
            {formData.gstProfile?.gstStatus === 'Cancelled' && (
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Cancel Date</label>
                <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-red-600"
                  value={formData.gstProfile?.cancelDate} onChange={e => handleGstChange('cancelDate', e.target.value)} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Reg. Type</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold outline-none"
                value={formData.gstProfile?.regType} onChange={e => handleGstChange('regType', e.target.value as GstRegType)}>
                <option value="Regular">Regular</option>
                <option value="Composition">Composition</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Filing Freq</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold outline-none disabled:opacity-50"
                disabled={formData.gstProfile?.regType === 'Composition'}
                value={formData.gstProfile?.filingFreq} onChange={e => handleGstChange('filingFreq', e.target.value as GstFilingFreq)}>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
              </select>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section: Constitution & Personnel */}
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Constitution</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold outline-none"
                value={formData.gstProfile?.constitution} onChange={e => handleGstChange('constitution', e.target.value as ConstitutionType)}>
                <option value="Proprietorship">Proprietorship</option>
                <option value="Partnership">Partnership</option>
                <option value="HUF">HUF</option>
                <option value="Company">Company</option>
                <option value="Trust">Trust</option>
              </select>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Personnel Details</h4>
                {formData.gstProfile?.constitution !== 'Proprietorship' && (
                  <button onClick={addStakeholder} className="text-[9px] font-black uppercase bg-indigo-600 text-white px-3 py-1.5 rounded-lg shadow-sm">+ Add Personnel</button>
                )}
              </div>
              
              <div className="space-y-4">
                {(formData.gstProfile?.stakeholders || []).map((s) => (
                  <div key={s.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-white p-4 rounded-xl shadow-sm border border-slate-100 animate-in slide-in-from-left-2">
                    <div className="md:col-span-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">Name</label>
                      <input className="w-full border-slate-200 rounded-lg p-2 text-sm font-bold disabled:bg-slate-50 uppercase"
                        disabled={formData.gstProfile?.constitution === 'Proprietorship'}
                        value={s.name} onChange={e => updateStakeholder(s.id, 'name', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">PAN</label>
                      <input maxLength={10} className="w-full border-slate-200 rounded-lg p-2 text-sm font-bold disabled:bg-slate-50 uppercase"
                        disabled={formData.gstProfile?.constitution === 'Proprietorship'}
                        value={s.pan} onChange={e => updateStakeholder(s.id, 'pan', e.target.value.toUpperCase())} />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">Mobile</label>
                      <input type="tel" maxLength={10} className="w-full border-slate-200 rounded-lg p-2 text-sm font-bold"
                        value={s.mobile} onChange={e => updateStakeholder(s.id, 'mobile', e.target.value.replace(/\D/g, ''))} />
                    </div>
                    {formData.gstProfile?.constitution !== 'Proprietorship' && (
                      <button onClick={() => removeStakeholder(s.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                         <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section: Bank Details */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Bank Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Bank Name</label>
                <input className="w-full bg-white border border-slate-200 rounded-xl p-3 font-bold"
                  value={formData.bankDetails?.bankName} onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails!, bankName: e.target.value}})} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Account Number</label>
                <input type="tel" maxLength={18} className="w-full bg-white border border-slate-200 rounded-xl p-3 font-bold"
                  value={formData.bankDetails?.accountNo} onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails!, accountNo: e.target.value.replace(/\D/g, '')}})} placeholder="9-18 digits" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">IFSC Code</label>
                <input maxLength={11} className="w-full bg-white border border-slate-200 rounded-xl p-3 font-bold uppercase"
                  value={formData.bankDetails?.ifsc} onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails!, ifsc: e.target.value.toUpperCase()}})} placeholder="SBIN0001234" />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section: Accountant Details */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Accountant Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Accountant Name</label>
                <input className="w-full bg-white border border-slate-200 rounded-xl p-3 font-bold"
                  value={formData.gstProfile?.accountantName} onChange={e => handleGstChange('accountantName', e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Accountant Mobile</label>
                <input type="tel" maxLength={10} className="w-full bg-white border border-slate-200 rounded-xl p-3 font-bold"
                  value={formData.gstProfile?.accountantMobile} onChange={e => handleGstChange('accountantMobile', e.target.value.replace(/\D/g, ''))} />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section: Document & Remarks */}
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">GST Certificate (PDF)</label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 group hover:border-indigo-300 transition-colors cursor-pointer"
                   onClick={() => fileInputRef.current?.click()}>
                 <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                 </div>
                 <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileUpload} />
                 <span className="text-xs font-bold text-slate-500 truncate max-w-[300px]">
                    {formData.gstProfile?.certificateUrl?.startsWith('data:') ? 'Document Ready for Vault' : (formData.gstProfile?.certificateUrl || 'Click to upload PDF')}
                 </span>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Address</label>
              <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold h-24"
                value={formData.gstProfile?.address} onChange={e => handleGstChange('address', e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Remarks</label>
              <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold h-24"
                value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 flex gap-4 bg-slate-50/50">
          <button onClick={onClose} className="flex-1 py-4 rounded-xl text-slate-500 font-black uppercase text-[10px] border border-slate-200">Discard</button>
          <button onClick={handleSave} className="flex-[2] bg-indigo-600 text-white font-black uppercase text-[10px] py-4 rounded-xl shadow-xl hover:bg-slate-900 transition-all">
            {initialData ? 'Update Entity' : 'Save New GST Client'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GSTClientFormModal;