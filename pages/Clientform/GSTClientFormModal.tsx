
import React, { useState, useEffect, useRef } from 'react';
import { Client, GSTProfile, Stakeholder, ConstitutionType, GstStatus, GstRegType, GstFilingFreq, ClientStatus, JurisdictionType } from '../../types.ts';
import { api } from '../../services/api.ts';

interface GSTClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
  initialData?: Client | null;
}

const GSTClientFormModal: React.FC<GSTClientFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
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
    },
    bankDetails: {
      bankName: '',
      accountNo: '',
      ifsc: ''
    }
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
          gstin: '', username: '', password: '', gstStatus: 'Active',
          regDate: '', regType: 'Regular', filingFreq: 'Monthly',
          constitution: 'Proprietorship', stakeholders: [], jurisdictionType: 'State'
        },
        bankDetails: { bankName: '', accountNo: '', ifsc: '' }
      });
    }
  }, [initialData, isOpen]);

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);
    try {
      if (!formData.legalName) throw new Error("Legal Name is required");
      if (!formData.gstProfile?.gstin) throw new Error("GSTIN is required");

      const saved = await api.saveClient(formData);
      onSave(saved);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">GST Client Vault</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <input className="w-full bg-slate-50 border p-3 rounded-xl font-bold" placeholder="Legal Name" value={formData.legalName} onChange={e => setFormData({...formData, legalName: e.target.value})} />
            <input className="w-full bg-slate-50 border p-3 rounded-xl font-bold" placeholder="GSTIN" value={formData.gstProfile?.gstin} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, gstin: e.target.value.toUpperCase()}})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input className="w-full bg-slate-50 border p-3 rounded-xl font-bold" placeholder="Mobile" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
            <input className="w-full bg-slate-50 border p-3 rounded-xl font-bold" placeholder="Username" value={formData.gstProfile?.username} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, username: e.target.value}})} />
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 flex gap-4 bg-slate-50/50">
          <button onClick={onClose} className="flex-1 py-4 rounded-xl text-slate-500 font-black uppercase text-[10px]">Discard</button>
          <button onClick={handleSave} disabled={isSaving} className="flex-[2] bg-indigo-600 text-white font-black uppercase text-[10px] py-4 rounded-xl shadow-xl hover:bg-slate-900 transition-all">
            {isSaving ? 'Syncing...' : 'Save to MongoDB'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GSTClientFormModal;
