import React, { useState, useEffect } from 'react';
import { Client } from '../../types';
import { api } from '../../services/api.ts';

interface ITClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
  initialData?: Client | null;
}

const ITClientFormModal: React.FC<ITClientFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Client>>({
    legalName: '',
    mobile: '',
    email: '',
    status: 'Active',
    itProfile: {
      pan: '',
      category: 'Individual',
      username: '',
      password: '',
      fatherName: '',
      incomeType: 'Both'
    },
    bankDetails: { bankName: '', accountNo: '', ifsc: '' }
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        legalName: '', mobile: '', email: '', status: 'Active',
        itProfile: {
          pan: '', category: 'Individual', username: '', password: '',
          fatherName: '', incomeType: 'Both'
        },
        bankDetails: { bankName: '', accountNo: '', ifsc: '' }
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);
    try {
      if (!formData.legalName) throw new Error("Legal Name is required");
      if (!formData.itProfile?.pan) throw new Error("PAN is required");

      const saved = await api.saveClient(formData);
      onSave(saved);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save IT record.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-hidden">
      <div className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-[2rem]">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">IT Profile Master</h2>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Direct Tax Management</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl font-bold border border-red-100 text-xs">{error}</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Full Legal Name (As per PAN)</label>
                <input autoFocus className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold uppercase outline-none focus:ring-4 focus:ring-emerald-50" value={formData.legalName} onChange={e => setFormData({...formData, legalName: e.target.value})} placeholder="Full Name" />
             </div>
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">PAN Number</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-black uppercase font-mono tracking-widest outline-none focus:ring-4 focus:ring-emerald-50" value={formData.itProfile?.pan} onChange={e => setFormData({...formData, itProfile: {...formData.itProfile!, pan: e.target.value.toUpperCase().slice(0, 10), username: e.target.value.toUpperCase().slice(0, 10)}})} placeholder="ABCDE1234F" />
             </div>
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Category</label>
                <select className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold outline-none" value={formData.itProfile?.category} onChange={e => setFormData({...formData, itProfile: {...formData.itProfile!, category: e.target.value}})}>
                   <option value="Individual">Individual</option>
                   <option value="HUF">HUF</option>
                   <option value="Partnership">Partnership Firm</option>
                   <option value="Company">Private Ltd Company</option>
                </select>
             </div>
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Portal User ID</label>
                <input readOnly className="w-full bg-slate-100 border border-slate-200 p-3.5 rounded-xl font-black text-slate-400" value={formData.itProfile?.username} />
             </div>
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Portal Password</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold outline-none" value={formData.itProfile?.password} onChange={e => setFormData({...formData, itProfile: {...formData.itProfile!, password: e.target.value}})} placeholder="Secure Password" />
             </div>
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Father's Name</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold outline-none uppercase" value={formData.itProfile?.fatherName} onChange={e => setFormData({...formData, itProfile: {...formData.itProfile!, fatherName: e.target.value}})} placeholder="Full Name" />
             </div>
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Mobile No</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold outline-none" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} placeholder="Primary Contact" />
             </div>
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0 rounded-b-[2rem]">
          <button onClick={onClose} className="flex-1 py-4 rounded-xl text-slate-500 font-black uppercase tracking-widest text-[10px] border border-slate-200 hover:bg-white transition-all">Discard</button>
          <button onClick={handleSave} disabled={isSaving} className="flex-[2] bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-xl shadow-xl hover:bg-slate-900 transition-all active:scale-[0.98]">
            {isSaving ? 'Saving...' : 'Sync IT Record'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ITClientFormModal;