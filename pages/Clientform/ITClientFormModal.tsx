
import React, { useState, useEffect } from 'react';
import { Client, ClientStatus } from '../../types.ts';
import { api } from '../../services/api.ts';

interface ITClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
  initialData?: Client | null;
}

const ITClientFormModal: React.FC<ITClientFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Client>>({
    legalName: '', email: '', mobile: '', status: 'Active',
    itProfile: { pan: '', username: '', password: '', category: 'Individual' }
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) setFormData(initialData);
      else resetForm();
    }
  }, [isOpen, initialData]);

  const resetForm = () => {
    setFormData({
      legalName: '', email: '', mobile: '', status: 'Active',
      itProfile: { pan: '', username: '', password: '', category: 'Individual' }
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
      <div className="w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{initialData ? 'Update IT Record' : 'New Income Tax Profile'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors"><svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg></button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Lifecycle Status</label>
              <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold outline-none focus:ring-4 focus:ring-indigo-50"
                value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as ClientStatus})}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Legal Name</label>
              <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-black uppercase outline-none focus:bg-white" value={formData.legalName} onChange={e => setFormData({...formData, legalName: e.target.value.toUpperCase()})} placeholder="Full Name" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">PAN No.</label>
              <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-black uppercase font-mono tracking-widest outline-none focus:bg-white" value={formData.itProfile?.pan} onChange={e => setFormData({...formData, itProfile: {...formData.itProfile!, pan: e.target.value.toUpperCase()}})} placeholder="ABCDE1234F" />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Father's Name</label>
               <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-black uppercase outline-none focus:bg-white" value={formData.itProfile?.fatherName} onChange={e => setFormData({...formData, itProfile: {...formData.itProfile!, fatherName: e.target.value.toUpperCase()}})} placeholder="Father Name" />
            </div>
          </div>
        </div>

        <footer className="px-8 py-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">Discard</button>
          <button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] px-10 py-4 rounded-xl shadow-lg hover:bg-slate-900 transition-all">
            {isSaving ? 'Saving...' : (initialData ? 'Update Record' : 'Save Record')}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ITClientFormModal;
