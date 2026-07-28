import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Client, NatureOfWork, ClientStatus } from '../../types.ts';
import { api } from '../../services/api.ts';
import { toast } from 'sonner';

interface ITClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
  initialData?: Client | null;
  context?: 'it';
}

const IT_FORM_TABS = [
  { id: 1, name: '1. PAN & Credentials', short: 'Credentials', icon: '🔑' },
  { id: 2, name: '2. Personal & Employment', short: 'Particulars', icon: '👤' },
  { id: 3, name: '3. Bank & Remarks', short: 'Bank & Notes', icon: '🏦' },
];

const ITClientFormModal: React.FC<ITClientFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const queryClient = useQueryClient();
  const [activeTabStep, setActiveTabStep] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isDataLinked, setIsDataLinked] = useState(false);

  const { data: existingClientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.getClients(),
    staleTime: 1000 * 60 * 5,
    enabled: isOpen,
  });

  const existingClients = useMemo(() => existingClientsData || [], [existingClientsData]);

  const saveMutation = useMutation({
    mutationFn: (clientData: Partial<Client>) => api.saveClient(clientData),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
      toast.success(initialData ? 'IT Record Updated' : 'New IT Profile Created');
      onSave(saved);
      onClose();
    },
    onError: (err: any) => {
      setError(err.message || "Cloud vault synchronization failed.");
    }
  });

  const isSaving = saveMutation.isPending;

  const [formData, setFormData] = useState<Partial<Client>>({
    legalName: '',
    tradeName: '',
    mobile: '',
    email: '',
    address: '',
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
      setActiveTabStep(1);
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
      legalName: '', 
      tradeName: '', 
      mobile: '', 
      email: '', 
      address: '',
      status: 'Active',
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
    const pan = val.trim().toUpperCase().slice(0, 10);
    setFormData(prev => ({
      ...prev,
      itProfile: { ...prev.itProfile!, pan, username: pan }
    }));

    if (!initialData && pan.length === 10) {
      const match = existingClients.find(c => 
        (c.gstProfile?.pan === pan || c.gstProfile?.gstin?.substring(2, 12) === pan || c.itProfile?.pan === pan)
      );

      if (match) {
        setFormData(prev => ({
          ...match,
          ...prev,
          id: match.id,
          legalName: match.legalName || prev.legalName,
          tradeName: match.tradeName || prev.tradeName,
          mobile: match.mobile || prev.mobile,
          email: match.email || prev.email,
          bankDetails: match.bankDetails || prev.bankDetails,
          remarks: match.remarks || prev.remarks,
          itProfile: {
            ...match.itProfile,
            ...prev.itProfile,
            pan,
            username: pan
          }
        }));
        setIsDataLinked(true);
        toast.info("Auto-linked matching client records from Vault!");
      } else {
        setIsDataLinked(false);
      }
    }
  };

  const handleSave = () => {
    setError(null);
    const profile = formData.itProfile!;

    const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;
    if (!formData.legalName) return setError("Principal Legal Name is required.");
    if (!panRegex.test(profile.pan)) return setError("Invalid PAN format (e.g. ABCDE1234F).");
    if (formData.mobile && !/^\d{10}$/.test(formData.mobile)) return setError("Mobile must be 10 digits.");

    if (!initialData && existingClients.some(c => c.itProfile?.pan === profile.pan)) {
      return setError(`PAN ${profile.pan} is already archived in IT records.`);
    }
    if (initialData && existingClients.some(c => c.itProfile?.pan === profile.pan && c.id !== formData.id)) {
      return setError(`PAN ${profile.pan} is already archived in IT records.`);
    }

    saveMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/70 backdrop-blur-xl p-3 sm:p-5 overflow-hidden animate-in fade-in duration-300">
      <div className="w-full max-w-4xl bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200">
        
        {/* Header */}
        <header className="px-6 py-5 md:px-8 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
             <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-indigo-600/30">
                IT
             </div>
             <div>
                <h2 className="text-base md:text-xl font-black tracking-tight">{initialData ? 'Edit IT Client Profile' : 'Add New Income Tax Client'}</h2>
                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
                  {isDataLinked ? '✨ Auto-Linked from Vault Record' : 'Income Tax Vault Registration'}
                </p>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="h-8 w-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all text-xs"
          >
            ✕
          </button>
        </header>

        {/* Step Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 md:px-8 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          {IT_FORM_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTabStep(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTabStep === tab.id
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200 ring-2 ring-indigo-600/10'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-8 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-black text-rose-600 text-center animate-in fade-in">
              ⚠️ {error}
            </div>
          )}

          {/* STEP 1: PAN & CREDENTIALS */}
          {activeTabStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600">Taxpayer Identity & Status</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">PAN Identity *</label>
                    <input 
                      className="w-full bg-indigo-50/50 border border-indigo-200 p-3 rounded-xl font-mono font-black uppercase tracking-widest text-indigo-700 text-xs outline-none focus:ring-2 focus:ring-indigo-600/20" 
                      value={formData.itProfile?.pan || ''} 
                      onChange={e => handlePanChange(e.target.value)} 
                      placeholder="ABCDE1234F" 
                      maxLength={10}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">e-Filing Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold text-xs outline-none focus:border-indigo-600 pr-10" 
                        value={formData.itProfile?.password || ''} 
                        onChange={e => setFormData({...formData, itProfile: {...formData.itProfile!, password: e.target.value}})} 
                        placeholder="••••••••" 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 text-xs"
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Assessee Category</label>
                    <select 
                      className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold text-xs outline-none focus:border-indigo-600" 
                      value={formData.itProfile?.category || 'Individual'} 
                      onChange={e => setFormData({...formData, itProfile: {...formData.itProfile!, category: e.target.value}})}
                    >
                      <option value="Individual">Individual</option>
                      <option value="HUF">HUF (Hindu Undivided Family)</option>
                      <option value="Firm">Partnership Firm / LLP</option>
                      <option value="Company">Company</option>
                      <option value="Trust">Trust / Association</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600">Legal Entity Names</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Legal Name (As per PAN) *</label>
                    <input 
                      className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold text-xs outline-none focus:border-indigo-600" 
                      value={formData.legalName || ''} 
                      onChange={e => setFormData({...formData, legalName: e.target.value})} 
                      placeholder="Name as printed on PAN" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Trade Name / Alias</label>
                    <input 
                      className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold text-xs outline-none focus:border-indigo-600" 
                      value={formData.tradeName || ''} 
                      onChange={e => setFormData({...formData, tradeName: e.target.value})} 
                      placeholder="Business / Trading Name" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Client Status</label>
                    <select 
                      className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold text-xs outline-none focus:border-indigo-600" 
                      value={formData.status} 
                      onChange={e => setFormData({...formData, status: e.target.value as ClientStatus})}
                    >
                      <option value="Active">Active Client</option>
                      <option value="Litigation">Under Litigation</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PERSONAL & EMPLOYMENT */}
          {activeTabStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600">Individual Particulars</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Father's Name</label>
                    <input 
                      className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold text-xs outline-none focus:border-indigo-600" 
                      value={formData.itProfile?.fatherName || ''} 
                      onChange={e => setFormData({...formData, itProfile: {...formData.itProfile!, fatherName: e.target.value}})} 
                      placeholder="Father's Full Name" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">DOB / Incorporation Date</label>
                    <input 
                      type="date" 
                      className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold text-xs outline-none uppercase" 
                      value={formData.itProfile?.dob || ''} 
                      onChange={e => setFormData({...formData, itProfile: {...formData.itProfile!, dob: e.target.value}})} 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Mobile Number</label>
                    <input 
                      className="w-full bg-white border border-slate-200 p-3 rounded-xl font-mono font-bold text-xs outline-none focus:border-indigo-600" 
                      value={formData.mobile || ''} 
                      onChange={e => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
                      placeholder="10-digit Mobile" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Email Address</label>
                    <input 
                      type="email" 
                      className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold text-xs outline-none focus:border-indigo-600" 
                      value={formData.email || ''} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      placeholder="email@example.com" 
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Communication Address</label>
                    <input 
                      className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold text-xs outline-none focus:border-indigo-600" 
                      value={formData.address || ''} 
                      onChange={e => setFormData({...formData, address: e.target.value})} 
                      placeholder="Full Address" 
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600">Nature of Income & Employment</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Primary Income Source</label>
                    <select 
                      className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold text-xs outline-none focus:border-indigo-600" 
                      value={formData.itProfile?.natureOfWork || 'Salaried'} 
                      onChange={e => setFormData({...formData, itProfile: {...formData.itProfile!, natureOfWork: e.target.value as NatureOfWork}})}
                    >
                      <option value="Salaried">Salaried Employee</option>
                      <option value="Business/Profession">Business / Profession</option>
                      <option value="Capital Gains">Capital Gains</option>
                      <option value="House Property">House Property</option>
                      <option value="Other Sources">Other Sources</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Employment Sector</label>
                    <select 
                      className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold text-xs outline-none focus:border-indigo-600" 
                      value={formData.itProfile?.employmentType || 'Private'} 
                      onChange={e => setFormData({...formData, itProfile: {...formData.itProfile!, employmentType: e.target.value}})}
                    >
                      <option value="Private">Private Enterprise</option>
                      <option value="Govt">Government Sector</option>
                      <option value="PSU">Public Sector Unit (PSU)</option>
                      <option value="Pensioner">Pensioner</option>
                      <option value="N/A">Not Applicable</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Business Name (If applicable)</label>
                    <input 
                      className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold text-xs outline-none focus:border-indigo-600" 
                      value={formData.itProfile?.businessName || ''} 
                      onChange={e => setFormData({...formData, itProfile: {...formData.itProfile!, businessName: e.target.value}})} 
                      placeholder="Business Name" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: BANK & REMARKS */}
          {activeTabStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600 flex items-center gap-2">
                  <span>🏦</span> Bank Account for Income Tax Refunds
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input 
                    className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-black uppercase w-full outline-none" 
                    value={formData.bankDetails?.bankName || ''} 
                    onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails!, bankName: e.target.value}})} 
                    placeholder="Bank Name" 
                  />
                  <input 
                    className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-mono font-black tracking-widest w-full outline-none" 
                    value={formData.bankDetails?.accountNo || ''} 
                    onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails!, accountNo: e.target.value}})} 
                    placeholder="Account Number" 
                  />
                  <input 
                    className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-mono font-black tracking-widest uppercase w-full outline-none" 
                    value={formData.bankDetails?.ifsc || ''} 
                    onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails!, ifsc: e.target.value.toUpperCase()}})} 
                    placeholder="IFSC Code" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Income Tax Vault Remarks & History</label>
                <textarea 
                  className="w-full h-28 bg-slate-50 border border-slate-200 rounded-2xl p-4 font-medium text-xs outline-none focus:border-indigo-600 transition-all resize-none" 
                  value={formData.remarks || ''} 
                  onChange={e => setFormData({...formData, remarks: e.target.value})} 
                  placeholder="Record internal client history, previous assessment notes, or filing instructions..." 
                />
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <footer className="px-6 py-4 md:px-8 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 gap-3">
          <div className="flex items-center gap-2">
            {activeTabStep > 1 && (
              <button 
                type="button" 
                onClick={() => setActiveTabStep(prev => prev - 1)} 
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-slate-100 transition-all"
              >
                ← Back
              </button>
            )}
            <button 
              type="button" 
              onClick={onClose} 
              className="px-3 py-2.5 text-slate-500 font-black text-xs uppercase tracking-wider hover:text-slate-800"
            >
              Cancel
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTabStep < 3 ? (
              <button 
                type="button" 
                onClick={() => setActiveTabStep(prev => prev + 1)} 
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5"
              >
                <span>Next Step</span>
                <span>→</span>
              </button>
            ) : (
              <button 
                type="button" 
                onClick={handleSave} 
                disabled={isSaving} 
                className="bg-emerald-600 text-white font-black uppercase tracking-wider text-xs px-8 py-2.5 rounded-xl shadow-lg hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <span>{isSaving ? 'Saving Record...' : 'Save IT Profile'}</span>
              </button>
            )}
          </div>
        </footer>

      </div>
    </div>
  );
};

export default ITClientFormModal;
