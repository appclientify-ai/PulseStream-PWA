import React, { useState, useEffect } from 'react';
import { Client, ClientStatus, ITProfile } from '../../types';
import { mockBackend } from '../../services/mockBackend';

interface ITClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
  initialData?: Client | null;
}

const IT_PORTAL_LOGIN_URL = 'https://eportal.incometax.gov.in/iec/foservices/#/login';

const ITClientFormModal: React.FC<ITClientFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Client>>({
    legalName: '',
    tradeName: '',
    email: '',
    mobile: '',
    status: 'Active',
    itProfile: {
      pan: '',
      category: 'Individual',
      username: '',
      password: '',
      fatherName: '',
      incomeType: 'Business',
      companyName: ''
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
        status: 'Active',
        itProfile: {
          pan: '',
          category: 'Individual',
          username: '',
          password: '',
          fatherName: '',
          incomeType: 'Business',
          companyName: ''
        },
        bankDetails: { bankName: '', accountNo: '', ifsc: '' },
        remarks: ''
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleItChange = (field: keyof ITProfile, value: any) => {
    setFormData(prev => ({
      ...prev,
      itProfile: { ...prev.itProfile!, [field]: value }
    }));
  };

  const handlePanChange = async (val: string) => {
    const pan = val.toUpperCase().slice(0, 10);
    handleItChange('pan', pan);
    handleItChange('username', pan); // Default username to PAN

    if (pan.length === 10 && !initialData) {
      setIsFetching(true);
      try {
        const clients = await mockBackend.getClients();
        // Cross-reference with GST Portfolio using PAN logic (3rd to 12th char of GSTIN)
        const match = clients.find(c => 
          (c.itProfile?.pan === pan) || 
          (c.gstProfile?.gstin && c.gstProfile.gstin.substring(2, 12) === pan)
        );

        if (match) {
          setFormData(prev => ({
            ...prev,
            legalName: match.legalName || prev.legalName,
            tradeName: match.tradeName || prev.tradeName,
            mobile: match.mobile || prev.mobile,
            email: match.email || prev.email,
            bankDetails: match.bankDetails ? { ...match.bankDetails } : prev.bankDetails,
            itProfile: {
              ...prev.itProfile!,
              category: match.gstProfile?.constitution || prev.itProfile?.category || 'Individual',
              username: pan,
            }
          }));
        }
      } catch (err) {
        console.error("PAN Fetch Error:", err);
      } finally {
        setTimeout(() => setIsFetching(false), 500);
      }
    }
  };

  const copyAndLogin = () => {
    navigator.clipboard.writeText(formData.itProfile?.pan || '');
    window.open(IT_PORTAL_LOGIN_URL, '_blank');
  };

  const validatePan = (pan: string) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateMobile = (mobile: string) => /^[6-9]\d{9}$/.test(mobile);
  const validateAccountNo = (acc: string) => /^\d{9,18}$/.test(acc);

  const handleSave = async () => {
    setError(null);
    try {
      if (!formData.legalName) throw new Error("Legal Name is required");
      
      if (!formData.itProfile?.pan || !validatePan(formData.itProfile.pan)) {
        throw new Error("Invalid PAN format (e.g. ABCDE1234F)");
      }

      if (formData.mobile && !validateMobile(formData.mobile)) {
        throw new Error("Mobile Number must be 10 digits starting with 6-9");
      }

      if (formData.email && !validateEmail(formData.email)) {
        throw new Error("Please enter a valid professional email address");
      }

      if (formData.bankDetails?.accountNo && !validateAccountNo(formData.bankDetails.accountNo)) {
        throw new Error("Bank Account Number should be 9 to 18 digits");
      }

      const saved = await mockBackend.saveClient(formData);
      onSave(saved);
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-hidden">
      <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">IT Client Vault</h2>
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
          
          {/* Status and PAN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Client Status</label>
              <div className="flex p-1 bg-slate-100 rounded-xl">
                 <button 
                   onClick={() => setFormData({...formData, status: 'Active'})}
                   className={`flex-1 py-2.5 text-[10px] font-black uppercase rounded-lg transition-all ${formData.status === 'Active' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                 >Active</button>
                 <button 
                   onClick={() => setFormData({...formData, status: 'Inactive'})}
                   className={`flex-1 py-2.5 text-[10px] font-black uppercase rounded-lg transition-all ${formData.status === 'Inactive' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                 >Inactive</button>
              </div>
            </div>

            <div className="relative">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">PAN Number</label>
              <input 
                maxLength={10}
                className={`w-full border-2 rounded-xl p-3 font-black uppercase tracking-[0.3em] text-lg outline-none transition-all ${isFetching ? 'border-emerald-500 bg-emerald-50' : 'bg-slate-50 border-slate-200 focus:border-emerald-500 focus:bg-white'}`}
                value={formData.itProfile?.pan} 
                onChange={e => handlePanChange(e.target.value)} 
                placeholder="ABCDE1234F" 
              />
              {isFetching && (
                <div className="absolute right-3 bottom-3 flex items-center gap-2">
                  <span className="text-[9px] font-black text-emerald-600 animate-pulse uppercase">Syncing GST Vault...</span>
                  <div className="h-2 w-2 bg-emerald-600 rounded-full animate-bounce" />
                </div>
              )}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Password and Login */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Portal Password</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input type={showPassword ? "text" : "password"} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold outline-none focus:ring-2 focus:ring-emerald-100"
                    value={formData.itProfile?.password} onChange={e => handleItChange('password', e.target.value)} placeholder="Vault Password" />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400">
                    {showPassword ? <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg> : <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg>}
                  </button>
                </div>
                <button onClick={copyAndLogin} className="px-6 bg-emerald-600 text-white font-black uppercase text-[10px] rounded-xl shadow-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Login to Portal
                </button>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Legal Name & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Legal Name (Name)</label>
              <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold uppercase outline-none focus:ring-2 focus:ring-emerald-100"
                value={formData.legalName} onChange={e => setFormData({...formData, legalName: e.target.value})} placeholder="AS PER PAN CARD" />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">ITR Category</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold outline-none"
                value={formData.itProfile?.category} onChange={e => handleItChange('category', e.target.value)}>
                <option value="Individual">Individual</option>
                <option value="HUF">HUF</option>
                <option value="Partnership">Partnership / LLP</option>
                <option value="Company">Company</option>
                <option value="Trust">Trust / AOP</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Income Type</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold outline-none"
                value={formData.itProfile?.incomeType} onChange={e => handleItChange('incomeType', e.target.value)}>
                <option value="Business">Business / Profession</option>
                <option value="Salary">Salary</option>
                <option value="Both">Both (Business & Salary)</option>
              </select>
            </div>

            {/* Conditional Logic: Trade Name vs Company Name */}
            <div className="md:col-span-2">
               {formData.itProfile?.incomeType === 'Salary' ? (
                 <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Employer / Company Name</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold outline-none focus:ring-2 focus:ring-emerald-100"
                      value={formData.itProfile?.companyName} onChange={e => handleItChange('companyName', e.target.value)} placeholder="Organization where client works" />
                 </div>
               ) : (
                 <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Trade / Firm Name</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold outline-none focus:ring-2 focus:ring-emerald-100"
                      value={formData.tradeName} onChange={e => setFormData({...formData, tradeName: e.target.value})} placeholder="Professional firm or business name" />
                 </div>
               )}
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Father's Name</label>
              <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold uppercase outline-none"
                value={formData.itProfile?.fatherName} onChange={e => handleItChange('fatherName', e.target.value)} placeholder="Full Name of Father" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Mobile Number</label>
                <input type="tel" maxLength={10} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold outline-none"
                  value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '')})} placeholder="10-digit number" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Email Address</label>
                <input type="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold outline-none"
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="client@example.com" />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Bank Details */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
               <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
               Bank Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Bank Name</label>
                <input className="w-full bg-white border border-slate-200 rounded-xl p-3 font-bold outline-none focus:ring-2 focus:ring-emerald-100"
                  value={formData.bankDetails?.bankName} onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails!, bankName: e.target.value}})} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Account Number</label>
                <input type="tel" maxLength={18} className="w-full bg-white border border-slate-200 rounded-xl p-3 font-bold outline-none focus:ring-2 focus:ring-emerald-100"
                  value={formData.bankDetails?.accountNo} onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails!, accountNo: e.target.value.replace(/\D/g, '')}})} placeholder="9-18 digits" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">IFSC Code</label>
                <input maxLength={11} className="w-full bg-white border border-slate-200 rounded-xl p-3 font-bold uppercase outline-none focus:ring-2 focus:ring-emerald-100"
                  value={formData.bankDetails?.ifsc} onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails!, ifsc: e.target.value.toUpperCase()}})} placeholder="SBIN0001234" />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Remarks */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Remark / Staff Notes</label>
            <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold h-24 text-sm outline-none focus:ring-2 focus:ring-emerald-100"
              value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} placeholder="Add any specific notes for this client vault..." />
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-100 flex gap-4 bg-slate-50/50">
          <button onClick={onClose} className="flex-1 py-4 rounded-xl text-slate-500 font-black uppercase text-[10px] border border-slate-200">Discard</button>
          <button onClick={handleSave} className="flex-[2] bg-emerald-600 text-white font-black uppercase text-[10px] py-4 rounded-xl shadow-xl hover:bg-slate-900 transition-all">
            {initialData ? 'Update IT Vault' : 'Save IT Client'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ITClientFormModal;