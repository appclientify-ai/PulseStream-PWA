
import React, { useState, useEffect } from 'react';
import { 
  Client, 
  ConstitutionType, 
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

  const defaultStakeholder = (): Stakeholder => ({
    id: Math.random().toString(36).substr(2, 9),
    name: '', mobile: '', pan: '', itPassword: '', address: ''
  });

  const [formData, setFormData] = useState<Partial<Client>>({
    legalName: '', tradeName: '', email: '', mobile: '', status: 'Active',
    gstProfile: {
      gstin: '', username: '', password: '', gstStatus: 'Active',
      regDate: '', regType: 'Regular', filingFreq: 'Monthly',
      constitution: 'Proprietorship', stakeholders: [defaultStakeholder()],
      jurisdictionType: 'State'
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) setFormData(initialData);
      else resetForm();
    }
  }, [isOpen, initialData]);

  const resetForm = () => {
    setFormData({
      legalName: '', tradeName: '', email: '', mobile: '', status: 'Active',
      gstProfile: {
        gstin: '', username: '', password: '', gstStatus: 'Active',
        regDate: '', regType: 'Regular', filingFreq: 'Monthly',
        constitution: 'Proprietorship', stakeholders: [defaultStakeholder()],
        jurisdictionType: 'State'
      }
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
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
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{initialData ? 'Update Profile' : 'New GST Enrollment'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors"><svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg></button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Entity Status</label>
              <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold outline-none focus:ring-4 focus:ring-indigo-50"
                value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as ClientStatus})}>
                <option value="Active">Active</option>
                <option value="Litigation">Litigation</option>
                <option value="Inactive">Inactive (Close)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Trade Name</label>
              <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-black uppercase outline-none focus:bg-white" value={formData.tradeName} onChange={e => setFormData({...formData, tradeName: e.target.value.toUpperCase()})} placeholder="Business Name" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Legal Name</label>
              <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-black uppercase outline-none focus:bg-white" value={formData.legalName} onChange={e => setFormData({...formData, legalName: e.target.value.toUpperCase()})} placeholder="Proprietor/Legal Name" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">GSTIN</label>
              <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-black uppercase font-mono tracking-widest outline-none focus:bg-white" value={formData.gstProfile?.gstin} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, gstin: e.target.value.toUpperCase()}})} placeholder="22AAAAA0000A1Z5" />
            </div>
          </div>
        </div>

        <footer className="px-8 py-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">Discard</button>
          <button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] px-10 py-4 rounded-xl shadow-lg hover:bg-slate-900 transition-all">
            {isSaving ? 'Saving...' : (initialData ? 'Update Record' : 'Save Record')}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default GSTClientFormModal;
