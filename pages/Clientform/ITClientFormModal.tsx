
import React, { useState, useEffect } from 'react';
import { Client, NatureOfWork, ClientStatus } from '../../types.ts';
import { api } from '../../services/api.ts';

interface ITClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
  initialData?: Client | null;
  context?: 'it';
}

const ITClientFormModal: React.FC<ITClientFormModalProps> = ({ isOpen, onClose, onSave, initialData, context = 'it' }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [existingClients, setExistingClients] = useState<Client[]>([]);
  const [isDataLinked, setIsDataLinked] = useState(false);

  const [formData, setFormData] = useState<Partial<Client>>({
    legalName: '',
    tradeName: '',
    mobile: '',
    email: '', address: '',
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
    },
    bankDetails: { bankName: '', accountNo: '', ifsc: '' },
    remarks: ''
  });

  useEffect(() => {
    if (isOpen) {
      api.getClients().then(setExistingClients);
      if (initialData) {
        setFormData(initialData);
        setIsDataLinked(false);
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialData]);

  const resetForm = () => {
    setFormData({
      legalName: '', tradeName: '', mobile: '', email: '', status: 'Active',
      itProfile: {
        pan: '', username: '', password: '', category: 'Individual',
        fatherName: '', dob: '', natureOfWork: 'Salaried',
        employmentType: 'Private', businessName: '',
      },
      bankDetails: { bankName: '', accountNo: '', ifsc: '' },
      remarks: ''
    });
    setError(null);
    setIsDataLinked(false);
  };

  const handlePanChange = (val: string) => {
    const pan = val.trim().slice(0, 10);
    setFormData(prev => ({
      ...prev,
      itProfile: { ...prev.itProfile!, pan, username: pan }
    }));

    // Smart Linkage: Auto-populate if PAN matches a profile in the vault (e.g. from GST)
    if (!initialData && pan.length === 10) {
      const match = existingClients.find(c => 
        (c.gstProfile?.pan === pan || c.gstProfile?.gstin?.substring(2, 12) === pan || c.itProfile?.pan === pan)
      );

      if (match) {
        setFormData(prev => ({
          ...prev,
          legalName: match.legalName || prev.legalName,
          tradeName: match.tradeName || prev.tradeName,
          mobile: match.mobile || prev.mobile,
          email: match.email || prev.email,
          bankDetails: match.bankDetails || prev.bankDetails,
          remarks: match.remarks || prev.remarks
        }));
        setIsDataLinked(true);
      } else {
        setIsDataLinked(false);
      }
    }
  };

  const handleSave = async () => {
    setError(null);
    const profile = formData.itProfile!;

    const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;
    if (!formData.legalName) return setError("Principal Legal Name is required.");
    if (!panRegex.test(profile.pan)) return setError("Invalid PAN format (e.g. ABCDE1234F).");
    if (formData.mobile && !/^\d{10}$/.test(formData.mobile)) return setError("Mobile must be 10 digits.");

    const isDuplicate = existingClients.some(c => 
      c.itProfile?.pan === profile.pan && c.id !== initialData?.id
    );
    if (isDuplicate) return setError(`PAN ${profile.pan} is already archived in IT records.`);

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

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-hidden animate-in fade-in duration-300">
      <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        
        <header className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-4">
             <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 002 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
             </div>
             <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                   {initialData ? 'Edit IT Record' : 'New Income Tax Profile'}
                </h2>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-2">Direct Tax Intelligence Unit</p>
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

          {isDataLinked && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
               <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Data Synchronized from Vault Reference</span>
            </div>
          )}

          <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="col-span-full border-l-4 border-indigo-600 pl-4 mb-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">1. Administrative Control</h3>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Lifecycle Status</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-50 transition-all cursor-pointer"
                  value={formData.status} 
                  onChange={e => setFormData({...formData, status: e.target.value as ClientStatus})}
                >
                   <option value="Active">Active</option>
                   <option value="Inactive">Inactive</option>
                </select>
             </div>
          </fieldset>

          <fieldset className="space-y-6">
             <div className="col-span-full border-l-4 border-indigo-600 pl-4 mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">2. IT Credentials</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">PAN Identity</label>
                   <input 
                     className="w-full bg-indigo-50/30 border-2 border-indigo-100 p-4 rounded-2xl font-black uppercase font-mono tracking-[0.2em] outline-none focus:border-indigo-600 focus:bg-white transition-all text-indigo-600" 
                     value={formData.itProfile?.pan} 
                     onChange={e => handlePanChange(e.target.value)} 
                     placeholder="ABCDE1234F" 
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Portal Password</label>
                   <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input 
                          type={showPassword ? "text" : "password"}
                          className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none focus:bg-white" 
                          value={formData.itProfile?.password} 
                          onChange={e => setFormData({...formData, itProfile: {...formData.itProfile!, password: e.target.value}})} 
                          placeholder="••••••••" 
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600">
                          {showPassword ? <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg> : <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg>}
                        </button>
                      </div>
                      <button 
                        type="button"
                        onClick={() => { 
                          navigator.clipboard.writeText(formData.itProfile?.pan || ''); 
                          window.open('https://eportal.incometax.gov.in/iec/foservices/#/login', '_blank'); 
                        }}
                        className="bg-slate-900 text-white px-5 rounded-2xl hover:bg-indigo-600 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2"
                      >
                        Portal Login
                      </button>
                   </div>
                </div>
             </div>
          </fieldset>

          <fieldset className="space-y-6">
             <div className="col-span-full border-l-4 border-indigo-600 pl-4 mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">3. Entity Information</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Legal Name (As per PAN)</label>
                   <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black outline-none focus:border-indigo-600 focus:bg-white transition-all" value={formData.legalName} onChange={e => setFormData({...formData, legalName: e.target.value})} placeholder="E.G. JOHN DOE" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 tracking-widest ml-1">Trade Name (Optional)</label>
                   <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black outline-none focus:border-indigo-600 focus:bg-white transition-all" value={formData.tradeName} onChange={e => setFormData({...formData, tradeName: e.target.value})} placeholder="BUSINESS NAME" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mobile No</label>
                   <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black outline-none focus:border-indigo-600 focus:bg-white transition-all" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})} placeholder="Mobile Number" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email ID</label>
                   <input type="email" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black outline-none focus:border-indigo-600 focus:bg-white transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email Address" />
                </div>
                <div className="space-y-2 md:col-span-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Client Address</label>
                   <textarea className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none focus:border-indigo-600 focus:bg-white transition-all resize-none" rows={2} value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Full Address" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 tracking-widest ml-1">DOB / Incorporation</label>
                   <input type="date" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none focus:bg-white transition-all uppercase" value={formData.itProfile?.dob} onChange={e => setFormData({...formData, itProfile: {...formData.itProfile!, dob: e.target.value}})} />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Father's Name</label>
                   <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none focus:bg-white transition-all" value={formData.itProfile?.fatherName} onChange={e => setFormData({...formData, itProfile: {...formData.itProfile!, fatherName: e.target.value}})} placeholder="Father's Full Name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mobile No</label>
                      <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '')})} placeholder="9876543210" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Address</label>
                      <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none lowercase" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="client@firm.com" />
                   </div>
                   <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Client Address</label>
                      <textarea className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none resize-none" rows={2} value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Full Address" />
                   </div>
                </div>
             </div>
          </fieldset>

          <fieldset className="space-y-6">
             <div className="col-span-full border-l-4 border-indigo-600 pl-4 mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">4. Professional Profile</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nature of Work</label>
                   <select 
                     className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none"
                     value={formData.itProfile?.natureOfWork}
                     onChange={e => setFormData({...formData, itProfile: {...formData.itProfile!, natureOfWork: e.target.value as NatureOfWork}})}
                   >
                      <option value="Salaried">Salaried</option>
                      <option value="Business">Business</option>
                      <option value="Profession">Profession</option>
                      <option value="House Property">House Property</option>
                      <option value="Capital Gain">Capital Gain</option>
                      <option value="Others">Others</option>
                   </select>
                </div>
                
                {formData.itProfile?.natureOfWork === 'Salaried' && (
                  <div className="space-y-2 animate-in slide-in-from-right-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Employment Type</label>
                     <select 
                       className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none"
                       value={formData.itProfile?.employmentType}
                       onChange={e => setFormData({...formData, itProfile: {...formData.itProfile!, employmentType: e.target.value}})}
                     >
                        <option value="Private">Private</option>
                        <option value="Government">Government</option>
                        <option value="PSU">PSU</option>
                        <option value="Pensioners">Pensioners</option>
                     </select>
                  </div>
                )}

                {(formData.itProfile?.natureOfWork === 'Business' || formData.itProfile?.natureOfWork === 'Profession') && (
                  <div className="space-y-2 animate-in slide-in-from-right-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Business Name</label>
                     <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black uppercase outline-none" value={formData.itProfile?.businessName} onChange={e => setFormData({...formData, itProfile: {...formData.itProfile!, businessName: e.target.value}})} placeholder="Trade Name..." />
                  </div>
                )}
             </div>
          </fieldset>

          <fieldset className="space-y-6">
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
                   <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black font-mono tracking-widest outline-none uppercase" value={formData.bankDetails?.ifsc} onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails!, ifsc: e.target.value}})} placeholder="HDFC0000123" />
                </div>
             </div>
          </fieldset>

          <fieldset className="space-y-6">
             <div className="col-span-full border-l-4 border-indigo-600 pl-4 mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">6. Vault Remarks</h3>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Internal History / Notes</label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-medium outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all min-h-[120px] resize-none" 
                  value={formData.remarks} 
                  onChange={e => setFormData({...formData, remarks: e.target.value})} 
                  placeholder="Archive internal case notes, status updates, or historical context here..." 
                />
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
             {isSaving ? 'Encrypting...' : 'Sync IT Record'}
           </button>
        </footer>

      </div>
    </div>
  );
};

export default ITClientFormModal;
