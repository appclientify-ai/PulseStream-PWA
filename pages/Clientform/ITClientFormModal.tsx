
import React, { useState, useEffect, useMemo } from 'react';
import { Client, ITProfile, NatureOfWork, ClientStatus, ConstitutionType } from '../../types.ts';
import { api } from '../../services/api.ts';

interface ITClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
  initialData?: Client | null;
}

const ITClientFormModal: React.FC<ITClientFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [existingClients, setExistingClients] = useState<Client[]>([]);
  const [gstLookupQuery, setGstLookupQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<Client>>({
    legalName: '',
    mobile: '',
    email: '',
    // Fix: 'Active' is now assignable to ClientStatus after updating types.ts
    status: 'Active',
    itProfile: {
      pan: '',
      username: '',
      password: '',
      category: 'Individual',
      fatherName: '',
      dob: '',
      natureOfWork: 'Salaried',
      employmentType: 'Private',
      businessName: '',
      constitution: 'Proprietorship',
      advisoryWork: {
        itrFiling: true,
        taxAudit: false,
        balanceSheet: false,
        appeals: false
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
        setGstLookupQuery('');
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialData]);

  const resetForm = () => {
    setFormData({
      // Fix: 'Active' is now assignable to ClientStatus after updating types.ts
      legalName: '', mobile: '', email: '', status: 'Active',
      itProfile: {
        pan: '', username: '', password: '', category: 'Individual',
        fatherName: '', dob: '', natureOfWork: 'Salaried',
        employmentType: 'Private', businessName: '',
        constitution: 'Proprietorship',
        advisoryWork: { itrFiling: true, taxAudit: false, balanceSheet: false, appeals: false }
      },
      bankDetails: { bankName: '', accountNo: '', ifsc: '' },
      remarks: ''
    });
    setError(null);
    setGstLookupQuery('');
  };

  const handleGstClientSelect = (gstMatch: Client) => {
    setFormData(prev => ({
      ...prev,
      legalName: gstMatch.legalName,
      tradeName: gstMatch.tradeName,
      mobile: gstMatch.mobile,
      email: gstMatch.email,
      bankDetails: gstMatch.bankDetails || prev.bankDetails,
      itProfile: {
        ...prev.itProfile!,
        pan: gstMatch.gstProfile?.pan || gstMatch.gstProfile?.gstin?.substring(2, 12) || prev.itProfile?.pan || '',
        username: gstMatch.gstProfile?.pan || gstMatch.gstProfile?.gstin?.substring(2, 12) || prev.itProfile?.username || '',
        constitution: gstMatch.gstProfile?.constitution || prev.itProfile?.constitution,
        businessName: gstMatch.tradeName || prev.itProfile?.businessName,
        natureOfWork: gstMatch.gstProfile ? 'Business' : prev.itProfile?.natureOfWork,
        category: gstMatch.gstProfile?.constitution === 'Proprietorship' ? 'Individual' : 
                  gstMatch.gstProfile?.constitution === 'HUF' ? 'HUF' :
                  gstMatch.gstProfile?.constitution === 'Partnership' ? 'Firm' : 
                  gstMatch.gstProfile?.constitution === 'Company' ? 'Company' : 'Individual'
      }
    }));
    setGstLookupQuery(gstMatch.legalName);
    setIsDropdownOpen(false);
  };

  const filteredGstClients = useMemo(() => {
    if (!gstLookupQuery || initialData) return [];
    const s = gstLookupQuery.toLowerCase();
    return existingClients.filter(c => 
      c.legalName.toLowerCase().includes(s) || 
      (c.tradeName || '').toLowerCase().includes(s) ||
      (c.gstProfile?.gstin || '').toLowerCase().includes(s)
    ).slice(0, 5);
  }, [existingClients, gstLookupQuery, initialData]);

  const handlePanChange = (val: string) => {
    const pan = val.toUpperCase().trim().slice(0, 10);
    setFormData(prev => ({
      ...prev,
      itProfile: { ...prev.itProfile!, pan, username: pan }
    }));
  };

  const handleSave = async () => {
    setError(null);
    const profile = formData.itProfile!;

    const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;
    if (!formData.legalName) return setError("Principal Legal Name is required.");
    if (!panRegex.test(profile.pan)) return setError("Invalid PAN format (e.g. ABCDE1234F).");
    if (formData.mobile && !/^\d{10}$/.test(formData.mobile)) return setError("Mobile must be 10 digits.");

    setIsSaving(true);
    try {
      const saved = await api.saveClient(formData);
      onSave(saved);
      onClose();
    } catch (err: any) {
      setError(err.message || "Cloud vault synchronization failed.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const fatherLabel = useMemo(() => {
     const cat = formData.itProfile?.category;
     if (cat === 'Individual') return "Father's / Spouse Name";
     if (cat === 'HUF') return "Karta's Full Name";
     return "First Partner / Director Name";
  }, [formData.itProfile?.category]);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-hidden animate-in fade-in duration-300">
      <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        
        <header className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-4">
             <div className="h-12 w-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
             </div>
             <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">
                   {initialData ? 'Edit IT Record' : 'New IT Enrollment'}
                </h2>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mt-2">Direct Tax Intelligence Unit</p>
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

          {!initialData && (
            <section className="space-y-4">
              <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600 flex items-center gap-3">GST Vault Bridge <div className="h-px flex-1 bg-slate-100" /></h4>
              <div className="relative">
                 <input 
                   type="text" 
                   value={gstLookupQuery}
                   onChange={e => { setGstLookupQuery(e.target.value); setIsDropdownOpen(true); }}
                   onFocus={() => setIsDropdownOpen(true)}
                   className="w-full bg-emerald-50/30 border-2 border-dashed border-emerald-200 rounded-2xl p-4 font-bold text-sm outline-none focus:border-emerald-600 transition-all uppercase" 
                   placeholder="Search existing GST client to fetch details..."
                 />
                 {isDropdownOpen && filteredGstClients.length > 0 && (
                   <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[310] overflow-hidden p-2">
                      {filteredGstClients.map(c => (
                        <button key={c.id} type="button" onClick={() => handleGstClientSelect(c)} className="w-full text-left px-4 py-3 hover:bg-emerald-50 rounded-xl transition-all border-b border-slate-50 last:border-0">
                           <p className="text-xs font-black text-slate-900 uppercase truncate">{c.legalName}</p>
                           <p className="text-[9px] text-emerald-600 font-mono font-black uppercase">GSTIN: {c.gstProfile?.gstin || 'N/A'}</p>
                        </button>
                      ))}
                   </div>
                 )}
              </div>
            </section>
          )}

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Lifecycle Status</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-emerald-50 transition-all cursor-pointer"
                  value={formData.status} 
                  onChange={e => setFormData({...formData, status: e.target.value as ClientStatus})}
                >
                   <option value="Active">Active Relationship</option>
                   <option value="Active Filing">Active Filing Service</option>
                   <option value="Inactive">Inactive / Suspended</option>
                </select>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">PAN Identity</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black uppercase font-mono tracking-[0.2em] outline-none focus:border-emerald-600 focus:bg-white transition-all text-emerald-600" 
                  value={formData.itProfile?.pan} 
                  onChange={e => handlePanChange(e.target.value)} 
                  placeholder="ABCDE1234F" 
                />
             </div>
          </section>

          <section className="space-y-6">
             <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600 flex items-center gap-3">Principal Information <div className="h-px flex-1 bg-slate-100" /></h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Name (As per PAN)</label>
                   <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black uppercase outline-none focus:border-indigo-600 focus:bg-white transition-all" value={formData.legalName} onChange={e => setFormData({...formData, legalName: e.target.value.toUpperCase()})} placeholder="E.G. JOHN DOE" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">{fatherLabel}</label>
                   <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold uppercase outline-none focus:bg-white" value={formData.itProfile?.fatherName} onChange={e => setFormData({...formData, itProfile: {...formData.itProfile!, fatherName: e.target.value.toUpperCase()}})} placeholder="Principal Member Name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">DOB / Incorp.</label>
                      <input type="date" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none uppercase" value={formData.itProfile?.dob} onChange={e => setFormData({...formData, itProfile: {...formData.itProfile!, dob: e.target.value}})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Category</label>
                      <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none cursor-pointer"
                        value={formData.itProfile?.category} onChange={e => setFormData({...formData, itProfile: {...formData.itProfile!, category: e.target.value}})}>
                        <option value="Individual">Individual</option>
                        <option value="Firm">Partnership Firm</option>
                        <option value="HUF">HUF</option>
                        <option value="Company">Private Limited</option>
                        <option value="Trust">Trust / AOP</option>
                      </select>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mobile No</label>
                      <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '')})} placeholder="9876543210" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email ID</label>
                      <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none lowercase" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="office@client.com" />
                   </div>
                </div>
             </div>
          </section>

          <section className="space-y-6">
             <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600 flex items-center gap-3">Professional Matrix <div className="h-px flex-1 bg-slate-100" /></h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nature of Work</label>
                   <select 
                     className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none"
                     value={formData.itProfile?.natureOfWork}
                     onChange={e => setFormData({...formData, itProfile: {...formData.itProfile!, natureOfWork: e.target.value as NatureOfWork}})}
                   >
                      <option value="Salaried">Salaried Employee</option>
                      <option value="Business">Business Enterprise</option>
                      <option value="Profession">Professional Practice</option>
                      <option value="House Property">House Property Income</option>
                      <option value="Capital Gain">Capital Gains</option>
                      <option value="Others">Others / Miscellaneous</option>
                   </select>
                </div>
                
                {(formData.itProfile?.natureOfWork === 'Business' || formData.itProfile?.natureOfWork === 'Profession') && (
                  <div className="space-y-2 animate-in slide-in-from-right-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Business Constitution</label>
                     <select 
                        className="w-full bg-white border border-emerald-200 p-4 rounded-2xl font-black outline-none focus:ring-4 focus:ring-emerald-50"
                        value={formData.itProfile?.constitution}
                        onChange={e => setFormData({...formData, itProfile: {...formData.itProfile!, constitution: e.target.value as ConstitutionType}})}
                     >
                        <option value="Proprietorship">Proprietorship</option>
                        <option value="Partnership">Partnership Firm</option>
                        <option value="HUF">HUF</option>
                        <option value="Company">Private/Public Limited</option>
                        <option value="Other">Other</option>
                     </select>
                  </div>
                )}

                {formData.itProfile?.natureOfWork === 'Salaried' && (
                  <div className="space-y-2 animate-in slide-in-from-right-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Employment Type</label>
                     <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none"
                       value={formData.itProfile?.employmentType} onChange={e => setFormData({...formData, itProfile: {...formData.itProfile!, employmentType: e.target.value}})}>
                        <option value="Private">Private Sector</option>
                        <option value="Government">Government</option>
                        <option value="PSU">PSU / Statutory Body</option>
                        <option value="Pensioners">Pensioner</option>
                     </select>
                  </div>
                )}
             </div>
          </section>

          <section className="space-y-6">
             <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600 flex items-center gap-3">Portal Credentials <div className="h-px flex-1 bg-slate-100" /></h4>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-emerald-50/20 p-8 rounded-[2rem] border border-emerald-100/50">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-emerald-400 tracking-widest ml-1">Portal User ID</label>
                   <input className="w-full bg-white border border-emerald-100 p-4 rounded-2xl font-bold outline-none focus:border-emerald-600" value={formData.itProfile?.username} onChange={e => setFormData({...formData, itProfile: {...formData.itProfile!, username: e.target.value}})} placeholder="Username" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-emerald-400 tracking-widest ml-1">Portal Password</label>
                   <div className="relative">
                      <input type={showPassword ? "text" : "password"} className="w-full bg-white border border-emerald-100 p-4 rounded-2xl font-bold outline-none focus:border-emerald-600" value={formData.itProfile?.password} onChange={e => setFormData({...formData, itProfile: {...formData.itProfile!, password: e.target.value}})} placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors">{showPassword ? '🙈' : '👁️'}</button>
                   </div>
                </div>
                <div className="flex items-end">
                   <button type="button" onClick={() => { navigator.clipboard.writeText(formData.itProfile?.username || ''); window.open('https://eportal.incometax.gov.in/iec/foservices/#/login', '_blank'); }} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 transition-all shadow-xl">Portal Sync</button>
                </div>
             </div>
          </section>

          <section>
             <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600 mb-6 flex items-center gap-3">Firm Remarks <div className="h-px flex-1 bg-slate-100" /></h4>
             <textarea className="w-full bg-slate-50 border border-slate-200 p-6 rounded-[2rem] font-bold text-xs h-32 outline-none focus:ring-4 focus:ring-indigo-50 transition-all" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} placeholder="Internal notes, dependency trackers or specific instructions..." />
          </section>
        </div>

        <footer className="px-10 py-8 border-t border-slate-100 bg-slate-50 flex items-center justify-end shrink-0 gap-4">
           <button onClick={onClose} className="px-10 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:text-slate-800 transition-colors">Cancel</button>
           <button 
             onClick={handleSave} 
             disabled={isSaving}
             className="bg-emerald-600 text-white font-black uppercase tracking-[0.2em] text-[10px] px-12 py-5 rounded-2xl shadow-xl hover:bg-slate-900 transition-all active:scale-[0.98] disabled:opacity-50"
           >
             {isSaving ? 'Synchronizing...' : (initialData ? 'Update Client' : 'Save Client')}
           </button>
        </footer>

      </div>
    </div>
  );
};

export default ITClientFormModal;