import React, { useState, useEffect, useMemo } from 'react';
import { GSTRegistrationRecord, GSTRegistrationType, GSTRegistrationStatus, Client } from '../../types';
import { api } from '../../services/api.ts';
import LitigationGuidelinesModal from '../../components/LitigationGuidelinesModal';

interface GSTRegistrationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<GSTRegistrationRecord>) => void;
  initialData?: GSTRegistrationRecord | null;
}

const GSTRegistrationForm: React.FC<GSTRegistrationFormProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<GSTRegistrationRecord>>({
    clientName: '',
    mobile: '',
    appType: 'New Registration',
    status: 'Pending',
    appDate: '',
    arn: '',
    completionDate: '',
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
        appType: 'New Registration',
        status: 'Pending',
        appDate: new Date().toISOString().split('T')[0],
        arn: '',
        completionDate: '',
        remarks: ''
      });
    }
  }, [initialData, isOpen]);

  const suggestions = useMemo(() => {
    const query = formData.clientName?.toLowerCase() || '';
    if (!query || initialData) return [];
    return dbClients.filter(c => 
      (c.legalName || '').toLowerCase().includes(query) || (c.tradeName || '').toLowerCase().includes(query)
    ).slice(0, 5);
  }, [formData.clientName, dbClients, initialData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <form 
        onSubmit={(e) => { e.preventDefault(); onSave(formData); }}
        className="w-full max-w-2xl max-h-[90vh] bg-white rounded-[2rem] shadow-2xl flex flex-col my-auto border border-slate-100 overflow-hidden animate-in zoom-in-95"
      >
        <div className="px-8 py-6 bg-slate-900 flex items-center justify-between shrink-0">
           <div>
             <h3 className="text-xl font-black text-white uppercase tracking-tight">
               {initialData ? 'Update GST Application' : 'New GST Application'}
             </h3>
             <p className="text-xs font-semibold text-slate-400 mt-0.5">Registration, Amendment & Cancellation Tracking</p>
           </div>
           <div className="flex items-center gap-2">
             <button
               type="button"
               onClick={() => setIsGuidelinesOpen(true)}
               className="px-3 py-1.5 rounded-xl bg-indigo-600/40 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-400/30 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
               title="View Complete GST Registration Guidelines"
             >
               <span>⚖️</span>
               <span className="hidden sm:inline">GST Reg Guide</span>
             </button>
             <button type="button" onClick={onClose} className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6" /></svg>
             </button>
           </div>
        </div>

        <div className="p-6 sm:p-8 space-y-5 flex-1 overflow-y-auto">
          
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs animate-in slide-in-from-top-2 duration-300">
            <span className="text-xl">🆔</span>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <h4 className="text-xs font-black text-purple-900 uppercase tracking-wide">GST Registration Guidelines</h4>
                <span className="text-[10px] font-black text-purple-800 bg-purple-100 px-2 py-0.5 rounded border border-purple-200 uppercase">
                  Threshold: 40L Goods • 20L Services
                </span>
              </div>
              <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                Applications u/s 22/24 are submitted in <strong>Form REG-01</strong>. Normal approval window is <strong>7 working days</strong> if Aadhaar-authenticated; otherwise, physical site verification or a <strong>REG-03 SCN</strong> is triggered. Discrepancy replies in <strong>REG-04</strong> must be filed within <strong>7 working days</strong>.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Entity Name</label>
              <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none focus:ring-4 focus:ring-indigo-50 uppercase"
                value={formData.clientName} onChange={e => { setFormData({...formData, clientName: e.target.value}); setIsDropdownOpen(true); }} onFocus={() => setIsDropdownOpen(true)} placeholder="Name..." />
              {isDropdownOpen && suggestions.length > 0 && (
                <div className="absolute top-full mt-1 z-50 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                  {suggestions.map(c => (
                    <button key={c.id} type="button" onClick={() => { setFormData({ ...formData, clientName: c.tradeName || c.legalName, mobile: c.mobile }); setIsDropdownOpen(false); }}
                      className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-slate-50 last:border-0"
                    >
                      <p className="text-xs font-black text-slate-900 truncate">{c.tradeName || c.legalName}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Mobile: {c.mobile}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Contact No</label>
              <input required maxLength={10} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none focus:ring-4 focus:ring-indigo-50"
                value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '')})} placeholder="10 Digit No" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Tracking Type</label>
              <select required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none"
                value={formData.appType} onChange={e => setFormData({...formData, appType: e.target.value as GSTRegistrationType})}>
                <option value="New Registration">New GST App</option>
                <option value="Amendment">GST Amendment</option>
                <option value="Cancellation">GST Cancellation</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Current Status</label>
              <select required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none focus:ring-4 focus:ring-indigo-50"
                value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as GSTRegistrationStatus})}>
                <option value="Pending">Pending</option>
                <option value="Data Requested">Data Requested</option>
                <option value="In Progress">In Progress</option>
                <option value="ARN Generated">ARN Generated</option>
                <option value="Completed">Completed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Application Date</label>
              <input type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none uppercase focus:ring-4 focus:ring-indigo-50"
                value={formData.appDate} onChange={e => setFormData({...formData, appDate: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">ARN No</label>
              <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-black uppercase font-mono tracking-widest outline-none focus:ring-4 focus:ring-indigo-50"
                value={formData.arn} onChange={e => setFormData({...formData, arn: e.target.value})} placeholder="AA0000..." />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Staff Remarks</label>
            <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none h-24 focus:ring-4 focus:ring-indigo-50"
              value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} placeholder="Internal notes..." />
          </div>
        </div>

        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex gap-4 shrink-0">
          <button type="button" onClick={onClose} className="px-6 py-3.5 bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
          <button type="submit" className="flex-1 px-8 py-3.5 bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:bg-slate-900 transition-all active:scale-[0.98]">
            {initialData ? 'Update Record' : 'Commit Entry'}
          </button>
        </div>
      </form>
      {isGuidelinesOpen && (
        <LitigationGuidelinesModal isOpen={isGuidelinesOpen} onClose={() => setIsGuidelinesOpen(false)} initialCategory="GstReg" />
      )}
    </div>
  );
};

export default GSTRegistrationForm;