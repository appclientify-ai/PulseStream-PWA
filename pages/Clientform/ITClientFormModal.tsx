
import React, { useState, useEffect } from 'react';
import { Client, ClientStatus, ITProfile } from '../../types';
import { api } from '../../services/api.ts';

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
    handleItChange('username', pan);

    if (pan.length === 10 && !initialData) {
      setIsFetching(true);
      try {
        const clients = await api.getClients();
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

  const handleSave = async () => {
    setError(null);
    try {
      if (!formData.legalName) throw new Error("Legal Name is required");
      if (!formData.itProfile?.pan) throw new Error("PAN is required");

      const saved = await api.saveClient(formData);
      onSave(saved);
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-hidden">
      <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">IT Client Vault</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl font-bold">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
             <input className="w-full bg-slate-50 border p-3 rounded-xl font-bold uppercase" placeholder="PAN Number" value={formData.itProfile?.pan} onChange={e => handlePanChange(e.target.value)} />
             <input className="w-full bg-slate-50 border p-3 rounded-xl font-bold uppercase" placeholder="Legal Name" value={formData.legalName} onChange={e => setFormData({...formData, legalName: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <input className="w-full bg-slate-50 border p-3 rounded-xl font-bold" placeholder="Mobile" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
             <input className="w-full bg-slate-50 border p-3 rounded-xl font-bold" placeholder="Portal Password" value={formData.itProfile?.password} onChange={e => handleItChange('password', e.target.value)} />
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 flex gap-4 bg-slate-50/50">
          <button onClick={onClose} className="flex-1 py-4 rounded-xl text-slate-500 font-black uppercase text-[10px]">Discard</button>
          <button onClick={handleSave} className="flex-[2] bg-emerald-600 text-white font-black uppercase text-[10px] py-4 rounded-xl shadow-xl hover:bg-slate-900 transition-all">
            {initialData ? 'Update IT Vault' : 'Save IT Client'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ITClientFormModal;
