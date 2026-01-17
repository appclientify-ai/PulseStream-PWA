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
      setError(err.message || "Failed to save client.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/70 backdrop-blur-xl p-4 overflow-hidden animate-in fade-in duration-300">
      <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-slate-200">
        
        <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-4">
             <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{initialData ? 'Edit Client' : 'Add New GST Client'}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10">
          {error && <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600 text-center">{error}</div>}

          {/* Basic Details */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Trade Name *</label>
              <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold uppercase outline-none focus:border-indigo-600 transition-all" value={formData.tradeName} onChange={e => setFormData({...formData, tradeName: e.target.value.toUpperCase()})} placeholder="Business Name" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Legal Name</label>
              <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold uppercase outline-none focus:border-indigo-600 transition-all" value={formData.legalName} onChange={e => setFormData({...formData, legalName: e.target.value.toUpperCase()})} placeholder="Entity Legal Name" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">GSTIN *</label>
              <input className="w-full bg-indigo-50/30 border border-indigo-100 p-3 rounded-xl font-black uppercase font-mono tracking-widest text-indigo-600 outline-none" value={formData.gstProfile?.gstin} onChange={e => handleGstinChange(e.target.value)} placeholder="GSTIN Number" />
            </div>
          </section>

          {/* GST Portal Credentials */}
          <section className="space-y-4">
             <h4 className="text-[11px] font-black uppercase tracking-widest text-indigo-600">GST Portal Access</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Username</label>
                   <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none" value={formData.gstProfile?.username} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, username: e.target.value}})} placeholder="Login User ID" />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Password</label>
                   <input type={showPassword ? "text" : "password"} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none" value={formData.gstProfile?.password} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, password: e.target.value}})} placeholder="Login Password" />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Category</label>
                   <select className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none" value={formData.gstProfile?.regType} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, regType: e.target.value as GstRegType}})}>
                      <option value="Regular">Regular</option>
                      <option value="Composition">Composition</option>
                   </select>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Filing Frequency</label>
                   <select className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none" value={formData.gstProfile?.filingFreq} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, filingFreq: e.target.value as GstFilingFreq}})}>
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                   </select>
                </div>
             </div>
          </section>

          {/* REQUESTED FIELDS: E-Way Bill & GSTAT Portal */}
          <section className="space-y-4">
             <h4 className="text-[11px] font-black uppercase tracking-widest text-indigo-600">Additional Portals</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-2 gap-3">
                   <p className="col-span-2 text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">E-Way Bill System</p>
                   <input className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold" value={formData.gstProfile?.ewayBillId} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, ewayBillId: e.target.value}})} placeholder="User ID" />
                   <input className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold" value={formData.gstProfile?.ewayBillPass} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, ewayBillPass: e.target.value}})} placeholder="Password" />
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-2 gap-3">
                   <p className="col-span-2 text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">GSTAT Portal</p>
                   <input className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold" value={formData.gstProfile?.gstatId} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, gstatId: e.target.value}})} placeholder="User ID" />
                   <input className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold" value={formData.gstProfile?.gstatPass} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, gstatPass: e.target.value}})} placeholder="Password" />
                </div>
             </div>
          </section>

          {/* Contact & Status */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mobile Number</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} placeholder="Primary Mobile" />
             </div>
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email ID</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none lowercase" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Office Email" />
             </div>
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Relationship Status</label>
                <select className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as ClientStatus})}>
                   <option value="Active">Active</option>
                   <option value="Litigation">Litigation</option>
                   <option value="Inactive">Inactive</option>
                </select>
             </div>
          </section>

          {/* Details (Address/Remarks) */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Principal Address</label>
                <textarea className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none h-20 resize-none" value={formData.gstProfile?.address} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, address: e.target.value}})} placeholder="Registered Address..." />
             </div>
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Internal Remarks</label>
                <textarea className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none h-20 resize-none" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} placeholder="Vault notes..." />
             </div>
          </section>
        </div>

        <footer className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 shrink-0">
           <button onClick={onClose} className="px-6 py-3 text-slate-500 font-black uppercase tracking-widest text-[10px]">Cancel</button>
           <button 
             onClick={handleSave} 
             disabled={isSaving}
             className="bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] px-10 py-3.5 rounded-xl shadow-xl hover:bg-slate-900 transition-all disabled:opacity-50"
           >
             {isSaving ? 'Saving...' : 'Sync to Vault'}
           </button>
        </footer>
      </div>
    </div>
  );
};

export default GSTClientFormModal;