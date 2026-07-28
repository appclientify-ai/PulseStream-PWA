import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

const FORM_TABS = [
  { id: 1, name: '1. Credentials & Names', short: 'Credentials', icon: '🔑' },
  { id: 2, name: '2. Business & Registration', short: 'Business Specs', icon: '🏛️' },
  { id: 3, name: '3. Stakeholders & Contact', short: 'Stakeholders', icon: '👤' },
  { id: 4, name: '4. Portals, Bank & Notes', short: 'Bank & Portals', icon: '🏦' },
];

const GSTClientFormModal: React.FC<GSTClientFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
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
      toast.success(initialData ? 'GST profile updated!' : 'Client added to GST Vault!');
      onSave(saved);
      onClose();
    },
    onError: (err: any) => {
      setError(err.message || "Failed to sync vault.");
    }
  });

  const isSaving = saveMutation.isPending;

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
    address: '',
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
      setActiveTabStep(1);
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
    setIsDataLinked(false);
  };

  const handleGstinChange = (val: string) => {
    const gstin = val.trim().toUpperCase().slice(0, 15);
    let pan = formData.gstProfile?.pan || '';
    if (gstin.length >= 12) {
      pan = gstin.substring(2, 12);
    }
    
    setFormData(prev => ({
      ...prev,
      gstProfile: { ...prev.gstProfile!, gstin, pan }
    }));

    if (!initialData && pan.length === 10) {
      const match = existingClients.find(c => 
         (c.itProfile?.pan === pan || c.gstProfile?.pan === pan || c.gstProfile?.gstin?.substring(2, 12) === pan)
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
          gstProfile: {
            ...match.gstProfile,
            ...prev.gstProfile,
            gstin,
            pan
          }
        }));
        setIsDataLinked(true);
        toast.info("Existing client details auto-linked from Vault!");
      } else {
        setIsDataLinked(false);
      }
    }
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

  const handleSave = () => {
    setError(null);
    if (!formData.tradeName && !formData.legalName) return setError("Trade Name or Legal Name is required.");
    if (!formData.gstProfile?.gstin) return setError("GSTIN is required.");
    if (formData.gstProfile?.gstin.length !== 15) return setError("GSTIN must be 15 characters.");
    
    saveMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/70 backdrop-blur-xl p-3 sm:p-5 overflow-hidden animate-in fade-in duration-300">
      <div className="w-full max-w-4xl bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <header className="px-6 py-5 md:px-8 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
             <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-indigo-600/30">
                GST
             </div>
             <div>
                <h2 className="text-base md:text-xl font-black tracking-tight">{initialData ? 'Edit GST Client Profile' : 'Add New GST Client'}</h2>
                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
                  {isDataLinked ? '✨ Auto-Linked from Existing Vault Profile' : 'Master Compliance Vault Entry'}
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

        {/* Tab Header Steps */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 md:px-8 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          {FORM_TABS.map(tab => (
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

          {/* STEP 1: CREDENTIALS & NAMES */}
          {activeTabStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600">Primary Business & Status</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Trade Name *</label>
                    <input 
                      className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold text-xs outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all" 
                      value={formData.tradeName || ''} 
                      onChange={e => setFormData({...formData, tradeName: e.target.value})} 
                      placeholder="Entity Trading Name" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Legal Registered Name</label>
                    <input 
                      className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold text-xs outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all" 
                      value={formData.legalName || ''} 
                      onChange={e => setFormData({...formData, legalName: e.target.value})} 
                      placeholder="Legal Entity Name" 
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
                      <option value="Inactive">Inactive / Suspended</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600 flex items-center justify-between">
                  <span>GSTIN Credentials & Access</span>
                  <span className="text-[10px] font-bold text-slate-400">PAN Auto-Derived</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1 sm:col-span-2 md:col-span-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">GSTIN Number *</label>
                    <input 
                      className="w-full bg-indigo-50/50 border border-indigo-200 p-3 rounded-xl font-mono font-black uppercase tracking-widest text-indigo-700 text-xs outline-none focus:ring-2 focus:ring-indigo-600/20" 
                      value={formData.gstProfile?.gstin || ''} 
                      onChange={e => handleGstinChange(e.target.value)} 
                      placeholder="27AAAAA0000A1Z5" 
                      maxLength={15}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Derived PAN</label>
                    <input 
                      readOnly 
                      className="w-full bg-slate-100 border border-slate-200 p-3 rounded-xl font-mono font-bold uppercase tracking-widest text-slate-600 text-xs cursor-not-allowed" 
                      value={formData.gstProfile?.pan || ''} 
                      placeholder="Auto PAN" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">GST Portal User ID</label>
                    <input 
                      className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold text-xs outline-none focus:border-indigo-600" 
                      value={formData.gstProfile?.username || ''} 
                      onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, username: e.target.value}})} 
                      placeholder="Portal Login ID" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">GST Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold text-xs outline-none focus:border-indigo-600 pr-10" 
                        value={formData.gstProfile?.password || ''} 
                        onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, password: e.target.value}})} 
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
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: BUSINESS & REGISTRATION */}
          {activeTabStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600">Contact & Communication</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
                      placeholder="client@company.com" 
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2 md:col-span-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Registered Address</label>
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
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600">Taxpayer Classification & Cycle</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Business Constitution</label>
                    <select 
                      className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold text-xs outline-none" 
                      value={formData.gstProfile?.constitution} 
                      onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, constitution: e.target.value as ConstitutionType}})}
                    >
                      <option value="Proprietorship">Proprietorship</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Company">Company (Pvt / Ltd)</option>
                      <option value="HUF">HUF</option>
                      <option value="Trust">Trust</option>
                      <option value="Society">Society</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Taxpayer Scheme</label>
                    <select 
                      className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold text-xs outline-none" 
                      value={formData.gstProfile?.regType} 
                      onChange={e => handleRegTypeChange(e.target.value as GstRegType)}
                    >
                      <option value="Regular">Regular Taxpayer</option>
                      <option value="Composition">Composition Scheme</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Filing Cycle</label>
                    <select 
                      disabled={formData.gstProfile?.regType === 'Composition'} 
                      className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold text-xs outline-none disabled:opacity-50" 
                      value={formData.gstProfile?.filingFreq} 
                      onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, filingFreq: e.target.value as GstFilingFreq}})}
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly (QRMP)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">GST Registration Status</label>
                    <select 
                      className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold text-xs outline-none" 
                      value={formData.gstProfile?.gstStatus} 
                      onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, gstStatus: e.target.value as GstStatus}})}
                    >
                      <option value="Active">Active</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Closed">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Registration Date</label>
                    <input 
                      type="date" 
                      className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold text-xs outline-none uppercase" 
                      value={formData.gstProfile?.regDate || ''} 
                      onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, regDate: e.target.value}})} 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Jurisdiction Authority</label>
                    <select 
                      className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold text-xs outline-none" 
                      value={formData.gstProfile?.jurisdictionType} 
                      onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, jurisdictionType: e.target.value as JurisdictionType}})}
                    >
                      <option value="State">State Jurisdiction</option>
                      <option value="Center">Central Jurisdiction</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Sector / Ward</label>
                    <input 
                      className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold text-xs outline-none" 
                      value={formData.gstProfile?.sector || ''} 
                      onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, sector: e.target.value}})} 
                      placeholder="e.g. Ward 4" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Range / Circle</label>
                    <input 
                      className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold text-xs outline-none" 
                      value={formData.gstProfile?.range || ''} 
                      onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, range: e.target.value}})} 
                      placeholder="e.g. Range I" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: STAKEHOLDERS & CONTACT */}
          {activeTabStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Accountant Info */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600">Assigned Accountant / Office Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Accountant Name</label>
                    <input 
                      className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold uppercase outline-none" 
                      value={formData.gstProfile?.accountantName || ''} 
                      onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, accountantName: e.target.value}})} 
                      placeholder="Full Name" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Accountant Mobile</label>
                    <input 
                      className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xs font-mono font-bold outline-none" 
                      value={formData.gstProfile?.accountantMobile || ''} 
                      onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, accountantMobile: e.target.value.replace(/\D/g, '').slice(0, 10)}})} 
                      placeholder="10-digit Mobile" 
                    />
                  </div>
                </div>
              </div>

              {/* Stakeholders List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600">
                    {getStakeholderLabel(formData.gstProfile?.constitution)}s Information
                  </h3>
                  {formData.gstProfile?.constitution !== 'Proprietorship' && (
                    <button 
                      type="button" 
                      onClick={addStakeholder} 
                      className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-all border border-indigo-200"
                    >
                      + Add {getStakeholderLabel(formData.gstProfile?.constitution)}
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {formData.gstProfile?.stakeholders.map((s, idx) => (
                    <div key={s.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 relative space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          {getStakeholderLabel(formData.gstProfile?.constitution)} #{idx + 1}
                        </span>
                        {formData.gstProfile!.stakeholders.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removeStakeholder(s.id)} 
                            className="text-rose-500 text-xs font-bold hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-500">Name</label>
                          <input 
                            className="bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold uppercase w-full outline-none" 
                            value={s.name} 
                            onChange={e => {
                              const next = [...formData.gstProfile!.stakeholders];
                              next[idx].name = e.target.value;
                              setFormData({...formData, gstProfile: {...formData.gstProfile!, stakeholders: next}});
                            }} 
                            placeholder="Full Name" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-500">Mobile</label>
                          <input 
                            className="bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-mono font-bold w-full outline-none" 
                            value={s.mobile} 
                            onChange={e => {
                              const next = [...formData.gstProfile!.stakeholders];
                              next[idx].mobile = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setFormData({...formData, gstProfile: {...formData.gstProfile!, stakeholders: next}});
                            }} 
                            placeholder="Mobile No" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-500">PAN</label>
                          <input 
                            className="bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-mono font-bold uppercase w-full outline-none" 
                            value={s.pan} 
                            onChange={e => {
                              const next = [...formData.gstProfile!.stakeholders];
                              next[idx].pan = e.target.value.toUpperCase().slice(0, 10);
                              setFormData({...formData, gstProfile: {...formData.gstProfile!, stakeholders: next}});
                            }} 
                            placeholder="PAN No" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-500">Email</label>
                          <input 
                            className="bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold lowercase w-full outline-none" 
                            value={s.itPassword} 
                            onChange={e => {
                              const next = [...formData.gstProfile!.stakeholders];
                              next[idx].itPassword = e.target.value;
                              setFormData({...formData, gstProfile: {...formData.gstProfile!, stakeholders: next}});
                            }} 
                            placeholder="Email" 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PORTALS, BANK & NOTES */}
          {activeTabStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* E-Way Bill & GSTAT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <span>🚚</span> E-Way Bill Credentials
                  </h3>
                  <div className="space-y-2">
                    <input 
                      className="bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold w-full outline-none" 
                      value={formData.gstProfile?.ewayBillId || ''} 
                      onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, ewayBillId: e.target.value}})} 
                      placeholder="E-Way Bill User ID" 
                    />
                    <input 
                      type="password" 
                      className="bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold w-full outline-none" 
                      value={formData.gstProfile?.ewayBillPass || ''} 
                      onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, ewayBillPass: e.target.value}})} 
                      placeholder="E-Way Bill Password" 
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <span>⚖️</span> GSTAT Portal Credentials
                  </h3>
                  <div className="space-y-2">
                    <input 
                      className="bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold w-full outline-none" 
                      value={formData.gstProfile?.gstatId || ''} 
                      onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, gstatId: e.target.value}})} 
                      placeholder="GSTAT User ID" 
                    />
                    <input 
                      type="password" 
                      className="bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold w-full outline-none" 
                      value={formData.gstProfile?.gstatPass || ''} 
                      onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, gstatPass: e.target.value}})} 
                      placeholder="GSTAT Password" 
                    />
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600 flex items-center gap-2">
                  <span>🏦</span> Bank Account Details
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

              {/* Office Remarks */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Office Notes / Internal History</label>
                <textarea 
                  className="w-full h-24 bg-slate-50 border border-slate-200 rounded-2xl p-4 font-medium text-xs outline-none focus:border-indigo-600 transition-all resize-none" 
                  value={formData.remarks || ''} 
                  onChange={e => setFormData({...formData, remarks: e.target.value})} 
                  placeholder="Record internal client history or special instructions..." 
                />
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation Controls */}
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
            {activeTabStep < 4 ? (
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
                <span>{isSaving ? 'Saving Profile...' : 'Save GST Profile'}</span>
              </button>
            )}
          </div>
        </footer>

      </div>
    </div>
  );
};

export default GSTClientFormModal;
