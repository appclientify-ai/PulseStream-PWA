import React, { useState, useEffect, useMemo } from 'react';
import { MSMERegistrationRecord, MSMERegistrationStatus, Client } from '../../types';
import { api } from '../../services/api.ts';
import LitigationGuidelinesModal from '../../components/LitigationGuidelinesModal';

interface MSMEFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<MSMERegistrationRecord>) => void;
  initialData?: MSMERegistrationRecord | null;
}

const MSMEForm: React.FC<MSMEFormProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<MSMERegistrationRecord>>({
    clientName: '',
    mobile: '',
    regType: 'Udyam Registration',
    status: 'Pending',
    appDate: '',
    udyamNumber: '',
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
        regType: 'Udyam Registration',
        status: 'Pending',
        appDate: new Date().toISOString().split('T')[0],
        udyamNumber: '',
        remarks: ''
      });
    }
  }, [initialData, isOpen]);

  const suggestions = useMemo(() => {
    const query = formData.clientName?.toLowerCase() || '';
    if (!query || initialData) return [];
    return dbClients.filter(c => 
      (c.legalName || '').toLowerCase().includes(query) || 
      (c.tradeName || '').toLowerCase().includes(query) ||
      (c.gstProfile?.gstin || '').toLowerCase().includes(query) ||
      (c.pan || '').toLowerCase().includes(query) ||
      (c.mobile || '').includes(query)
    ).slice(0, 8);
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
             <h3 className="text-xl font-black text-white uppercase tracking-tight">MSME / Udyam Tracking</h3>
             <p className="text-xs font-semibold text-slate-400 mt-0.5">Udyam Registration & Application Progress</p>
           </div>
           <div className="flex items-center gap-2">
             <button
               type="button"
               onClick={() => setIsGuidelinesOpen(true)}
               className="px-3 py-1.5 rounded-xl bg-indigo-600/40 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-400/30 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
               title="View Complete MSME/Udyam statutory guidelines"
             >
               <span>⚖️</span>
               <span className="hidden sm:inline">MSME Guide</span>
             </button>
             <button type="button" onClick={onClose} className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6" /></svg>
             </button>
           </div>
        </div>

        <div className="p-6 sm:p-8 space-y-5 flex-1 overflow-y-auto">
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs animate-in slide-in-from-top-2 duration-300">
            <span className="text-xl">🏢</span>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wide">MSME / Udyam Statutory Guidelines</h4>
                <span className="text-[10px] font-black text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 uppercase">
                  Sec 15/16 Delayed Payment Protection
                </span>
              </div>
              <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                Udyam classification criteria requires Micro (&le;1Cr inv, &le;5Cr turn), Small (&le;10Cr inv, &le;50Cr turn), or Medium (&le;50Cr inv, &le;250Cr turn). <strong>Section 15 & 16 of the MSMED Act</strong> mandates buyers pay within <strong>45 days</strong> (with written contract) or <strong>15 days</strong> (without contract), failing which compound interest at <strong>3x Bank Rate</strong> applies, which is strictly non-tax-deductible.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Entity Name</label>
              <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none focus:ring-4 focus:ring-indigo-50 uppercase"
                value={formData.clientName} onChange={e => { setFormData({...formData, clientName: e.target.value}); setIsDropdownOpen(true); }} placeholder="Search..." />
              {isDropdownOpen && suggestions.length > 0 && (
                <div className="absolute top-full mt-1 z-50 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                  {suggestions.map(c => {
                    const trade = c.tradeName || c.legalName;
                    const legal = c.legalName;
                    const displayName = c.tradeName && c.legalName && c.tradeName !== c.legalName 
                      ? `${c.tradeName} (${c.legalName})` 
                      : trade;
                    return (
                      <button key={c.id} type="button" 
                        onClick={() => { 
                          setFormData({ ...formData, clientName: displayName, mobile: c.mobile }); 
                          setIsDropdownOpen(false); 
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 border-b border-slate-50 last:border-0"
                      >
                        <p className="text-xs font-black text-slate-900 truncate">{trade}</p>
                        <p className="text-[10px] font-bold text-slate-600 truncate">Legal Name: {legal || '---'}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                          GSTIN: {c.gstProfile?.gstin || 'N/A'} • PAN: {c.pan || 'N/A'} • Mob: {c.mobile || 'N/A'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Contact No</label>
              <input required maxLength={10} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none focus:ring-4 focus:ring-indigo-50"
                value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '')})} placeholder="10 Digit Contact" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Status</label>
              <select required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none"
                value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as MSMERegistrationStatus})}>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Udyam No</label>
              <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-black uppercase font-mono tracking-widest outline-none"
                value={formData.udyamNumber} onChange={e => setFormData({...formData, udyamNumber: e.target.value})} placeholder="UDYAM-XX-00-0000000" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Application Date</label>
            <input type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none uppercase"
              value={formData.appDate} onChange={e => setFormData({...formData, appDate: e.target.value})} />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Staff Remarks</label>
            <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none h-24"
              value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} placeholder="Notes..." />
          </div>
        </div>

        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex gap-4 shrink-0">
          <button type="button" onClick={onClose} className="px-6 py-3.5 bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
          <button type="submit" className="flex-1 px-8 py-3.5 bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:bg-slate-900 transition-all active:scale-[0.98]">Commit MSME Entry</button>
        </div>
      </form>
      {isGuidelinesOpen && (
        <LitigationGuidelinesModal isOpen={isGuidelinesOpen} onClose={() => setIsGuidelinesOpen(false)} initialCategory="Msme" />
      )}
    </div>
  );
};

export default MSMEForm;