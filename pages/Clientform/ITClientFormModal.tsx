
import React, { useState, useEffect } from 'react';
import { Client, ITProfile } from '../../types';
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
      setError(err.message || "Failed to save IT client.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-hidden">
      <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">IT Client Vault</h2>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-xl transition-colors">
            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl font-bold border border-red-100">{error}</div>}
          
          <section className="space-y-6">
            <h3 className="text-[11px] font-black uppercase text-emerald-600 tracking-[0.25em] flex items-center gap-3">General Information <div className="h-px flex-1 bg-slate-100" /></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                 <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Full Legal Name (As per PAN)</label>
                 <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold uppercase outline-none focus:ring-4 focus:ring-emerald-50" value={formData.legalName} onChange={e => setFormData({...formData, legalName: e.target.value})} />
               </div>
               <div>
                 <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Father's Name</label>
                 <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold uppercase outline-none focus:ring-4 focus:ring-emerald-50" value={formData.itProfile?.fatherName} onChange={e => setFormData({...formData, itProfile: {...formData.itProfile!, fatherName: e.target.value}})} />
               </div>
               <div>
                 <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">PAN Number</label>
                 <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black uppercase font-mono tracking-widest outline-none" value={formData.itProfile?.pan} onChange={e => setFormData({...formData, itProfile: {...formData.itProfile!, pan: e.target.value.toUpperCase().slice(0,10), username: e.target.value.toUpperCase().slice(0,10)}})} />
               </div>
               <div>
                 <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Category</label>
                 <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none" value={formData.itProfile?.category} onChange={e => setFormData({...formData, itProfile: {...formData.itProfile!, category: e.target.value}})}>
                   <option value="Individual">Individual</option>
                   <option value="HUF">HUF</option>
                   <option value="Partnership">Partnership Firm</option>
                   <option value="Company">Company</option>
                 </select>
               </div>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-[11px] font-black uppercase text-emerald-600 tracking-[0.25em] flex items-center gap-3">Portal Credentials <div className="h-px flex-1 bg-slate-100" /></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                 <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Username</label>
                 <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black outline-none" value={formData.itProfile?.username} readOnly />
              </div>
              <div>
                 <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Password</label>
                 <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none" value={formData.itProfile?.password} onChange={e => setFormData({...formData, itProfile: {...formData.itProfile!, password: e.target.value}})} />
              </div>
            </div>
          </section>
        </div>

        <div className="p-10 border-t border-slate-100 flex gap-4 bg-slate-50 shrink-0">
          <button onClick={onClose} className="flex-1 py-5 rounded-xl text-slate-500 font-black uppercase text-[10px]">Discard</button>
          <button onClick={handleSave} disabled={isSaving} className="flex-[2] bg-emerald-600 text-white font-black uppercase text-[10px] py-5 rounded-xl shadow-xl hover:bg-slate-900 transition-all">
            {isSaving ? 'Saving...' : 'Commit to IT Vault'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ITClientFormModal;
