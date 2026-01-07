
import React, { useState, useEffect, useMemo } from 'react';
import { FoodLicenseRecord, FoodLicenseType, FoodLicenseStatus, Client } from '../../types';
import { mockBackend } from '../../services/mockBackend';

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
      mockBackend.getClients().then(setDbClients);
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <form 
        onSubmit={(e) => { e.preventDefault(); onSave(formData); }}
        className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-8 flex flex-col space-y-6 animate-in zoom-in-95"
      >
        <div className="flex items-center justify-between shrink-0">
           <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
             {initialData ? 'Update Food License' : 'New FSSAI Application'}
           </h3>
           <button type="button" onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-all">
              <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
           </button>
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto pr-1 no-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Client Name</label>
              <input 
                required 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none focus:ring-4 focus:ring-emerald-50 uppercase"
                value={formData.clientName} 
                onChange={e => {
                  setFormData({...formData, clientName: e.target.value});
                  setIsDropdownOpen(true);
                }} 
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Type Name..." 
              />
              {isDropdownOpen && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  {suggestions.map(c => (
                    <button 
                      key={c.id} 
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, clientName: c.tradeName || c.legalName, mobile: c.mobile });
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-emerald-50 border-b border-slate-50 last:border-0"
                    >
                      <p className="text-xs font-black text-slate-900 uppercase">{c.tradeName || c.legalName}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Mobile: {c.mobile}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Mobile No.</label>
              <input required maxLength={10} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none focus:ring-4 focus:ring-emerald-50"
                value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '')})} placeholder="Contact No" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">License Type</label>
              <select required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none focus:ring-4 focus:ring-emerald-50"
                value={formData.licenseType} onChange={e => setFormData({...formData, licenseType: e.target.value as FoodLicenseType})}>
                <option value="FSSAI Basic Registration">FSSAI Basic Registration</option>
                <option value="State License">State License</option>
                <option value="Central License">Central License</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Status</label>
              <select required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none focus:ring-4 focus:ring-emerald-50"
                value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as FoodLicenseStatus})}>
                <option value="Pending">Pending</option>
                <option value="Data Requested">Data Requested</option>
                <option value="In Progress">In Progress</option>
                <option value="Applied">Applied</option>
                <option value="Completed">Completed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Application Date</label>
              <input type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none uppercase focus:ring-4 focus:ring-emerald-50"
                value={formData.appDate} onChange={e => setFormData({...formData, appDate: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">License Number</label>
              <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none uppercase focus:ring-4 focus:ring-emerald-50"
                value={formData.licenseNo} onChange={e => setFormData({...formData, licenseNo: e.target.value.toUpperCase()})} placeholder="FSSAI ID / NO" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Expiry Date</label>
            <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none uppercase focus:ring-4 focus:ring-emerald-50"
              value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Remarks</label>
            <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none h-24 focus:ring-4 focus:ring-emerald-50"
              value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} placeholder="Notes..." />
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t border-slate-100 shrink-0">
          <button type="button" onClick={onClose} className="flex-1 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px] border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
          <button type="submit" className="flex-[2] bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-xl shadow-xl hover:bg-slate-900 transition-all active:scale-[0.98]">
            {initialData ? 'Update License' : 'Save Application'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FoodLicensesForm;
