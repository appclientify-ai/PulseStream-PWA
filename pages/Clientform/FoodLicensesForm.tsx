import React, { useState, useEffect, useMemo } from 'react';
import { FoodLicenseRecord, FoodLicenseType, FoodLicenseStatus, Client } from '../../types';
import { api } from '../../services/api.ts';

interface FoodLicensesFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<FoodLicenseRecord>) => void;
  initialData?: FoodLicenseRecord | null;
}

const FoodLicensesForm: React.FC<FoodLicensesFormProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<Partial<FoodLicenseRecord>>({
    clientName: '',
    mobile: '',
    licenseType: 'FSSAI Basic Registration',
    status: 'Pending',
    appDate: '',
    licenseNo: '',
    expiryDate: '',
    remarks: ''
  });

  const [dbClients, setDbClients] = useState<Client[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getClients().then(setDbClients);
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        clientName: '',
        mobile: '',
        licenseType: 'FSSAI Basic Registration',
        status: 'Pending',
        appDate: new Date().toISOString().split('T')[0],
        licenseNo: '',
        expiryDate: '',
        remarks: ''
      });
    }
  }, [initialData, isOpen]);

  const suggestions = useMemo(() => {
    const query = formData.clientName?.toLowerCase() || '';
    if (!query || initialData) return [];
    return dbClients.filter(c => 
      c.legalName.toLowerCase().includes(query) || 
      c.tradeName.toLowerCase().includes(query)
    ).slice(0, 5);
  }, [formData.clientName, dbClients, initialData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-hidden">
      <form 
        onSubmit={(e) => { e.preventDefault(); onSave(formData); }}
        className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl p-8 flex flex-col space-y-6 animate-in zoom-in-95 flex flex-col gap-1"
      >
        <div className="flex items-center justify-between shrink-0">
           <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">FSSAI Entry</h3>
           <button type="button" onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-all">
              <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
           </button>
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto pr-1 no-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Entity Name</label>
              <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none focus:ring-4 focus:ring-emerald-50 uppercase"
                value={formData.clientName} onChange={e => { setFormData({...formData, clientName: e.target.value}); setIsDropdownOpen(true); }} onFocus={() => setIsDropdownOpen(true)} placeholder="Search..." />
              {isDropdownOpen && suggestions.length > 0 && (
                <div className="absolute bottom-full mb-1 z-[9999] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                  {suggestions.map(c => (
                    <button key={c.id} type="button" onClick={() => { setFormData({ ...formData, clientName: c.tradeName || c.legalName, mobile: c.mobile }); setIsDropdownOpen(false); }}
                      className="w-full text-left px-4 py-3 hover:bg-emerald-50 border-b border-slate-50 last:border-0"
                    >
                      <p className="text-xs font-black text-slate-900 uppercase truncate">{c.tradeName || c.legalName}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Mobile: {c.mobile}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Mobile No</label>
              <input required maxLength={10} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none focus:ring-4 focus:ring-emerald-50"
                value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '')})} placeholder="No..." />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">FSSAI Category</label>
            <select required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none"
              value={formData.licenseType} onChange={e => setFormData({...formData, licenseType: e.target.value as FoodLicenseType})}>
              <option value="FSSAI Basic Registration">Basic Registration</option>
              <option value="State License">State License</option>
              <option value="Central License">Central License</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Application Status</label>
              <select required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none"
                value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as FoodLicenseStatus})}>
                <option value="Pending">Pending</option>
                <option value="Applied">Applied</option>
                <option value="Completed">Completed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">License No</label>
              <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-black uppercase font-mono tracking-widest outline-none"
                value={formData.licenseNo} onChange={e => setFormData({...formData, licenseNo: e.target.value.toUpperCase()})} placeholder="FSSAI NO" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Staff Remarks</label>
            <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none h-20"
              value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} placeholder="Context..." />
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t border-slate-100 shrink-0">
          <button type="button" onClick={onClose} className="flex-1 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px] border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
          <button type="submit" className="flex-[2] bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-xl shadow-xl hover:bg-slate-900 transition-all active:scale-[0.98]">Save FSSAI</button>
        </div>
      </form>
    </div>
  );
};

export default FoodLicensesForm;