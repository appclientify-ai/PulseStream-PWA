import React, { useState, useEffect, useMemo } from 'react';
import { FoodLicenseRecord, FoodLicenseType, FoodLicenseStatus, Client } from '../../types';
import { api } from '../../services/api.ts';
import { calculateRenewalDueDate } from '../../dateUtils.ts';
import LitigationGuidelinesModal from '../../components/LitigationGuidelinesModal';

interface FoodLicensesFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<FoodLicenseRecord>) => void;
  initialData?: FoodLicenseRecord | null;
}

const FoodLicensesForm: React.FC<FoodLicensesFormProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<FoodLicenseRecord>>({
    clientName: '',
    tradeName: '',
    legalName: '',
    mobile: '',
    licenseType: 'FSSAI Basic Registration',
    status: 'Pending',
    appDate: '',
    licenseNo: '',
    expiryDate: '',
    dueDate: '',
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
      const calcDue = initialData.dueDate || (initialData.expiryDate ? calculateRenewalDueDate(initialData.expiryDate) : '');
      setFormData({
        ...initialData,
        tradeName: initialData.tradeName || initialData.clientName || '',
        legalName: initialData.legalName || initialData.clientName || '',
        mobile: initialData.mobile || '',
        dueDate: calcDue
      });
    } else {
      setFormData({
        clientName: '',
        tradeName: '',
        legalName: '',
        mobile: '',
        licenseType: 'FSSAI Basic Registration',
        status: 'Pending',
        appDate: new Date().toISOString().split('T')[0],
        licenseNo: '',
        expiryDate: '',
        dueDate: '',
        remarks: ''
      });
    }
  }, [initialData, isOpen]);

  const handleExpiryDateChange = (expDate: string) => {
    const calcDue = calculateRenewalDueDate(expDate);
    setFormData(prev => ({
      ...prev,
      expiryDate: expDate,
      dueDate: calcDue
    }));
  };

  const suggestions = useMemo(() => {
    const query = (formData.tradeName || formData.legalName || formData.clientName || '').toLowerCase();
    if (!query || initialData) return [];
    return dbClients.filter(c => 
      (c.tradeName || '').toLowerCase().includes(query) || 
      (c.legalName || '').toLowerCase().includes(query) || 
      (c.gstProfile?.gstin || '').toLowerCase().includes(query) ||
      (c.pan || '').toLowerCase().includes(query) ||
      (c.mobile || '').includes(query)
    ).slice(0, 8);
  }, [formData.tradeName, formData.legalName, formData.clientName, dbClients, initialData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <form 
        onSubmit={(e) => { 
          e.preventDefault(); 
          const payload = {
            ...formData,
            clientName: formData.legalName || formData.tradeName || formData.clientName || '',
            tradeName: formData.tradeName || formData.clientName || '',
            legalName: formData.legalName || formData.clientName || ''
          };
          onSave(payload); 
        }}
        className="w-full max-w-2xl max-h-[90vh] bg-white rounded-[2rem] shadow-2xl flex flex-col my-auto border border-slate-100 overflow-hidden animate-in zoom-in-95"
      >
        <div className="px-8 py-6 bg-slate-900 flex items-center justify-between shrink-0">
           <div>
             <h3 className="text-xl font-black text-white uppercase tracking-tight">FSSAI License Entry</h3>
             <p className="text-xs font-semibold text-slate-400 mt-0.5">Food Safety License Application & Renewal Tracking</p>
           </div>
           <div className="flex items-center gap-2">
             <button
               type="button"
               onClick={() => setIsGuidelinesOpen(true)}
               className="px-3 py-1.5 rounded-xl bg-indigo-600/40 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-400/30 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
               title="View Complete FSSAI Statutory Guidelines"
             >
               <span>⚖️</span>
               <span className="hidden sm:inline">FSSAI Guide</span>
             </button>
             <button type="button" onClick={onClose} className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6" /></svg>
             </button>
           </div>
        </div>

        <div className="p-6 sm:p-8 space-y-5 flex-1 overflow-y-auto">
          
          <div className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs animate-in slide-in-from-top-2 duration-300">
            <span className="text-xl">🍎</span>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <h4 className="text-xs font-black text-rose-950 uppercase tracking-wide">FSSAI / Food License Latest Guidelines</h4>
                <span className="text-[10px] font-black text-rose-800 bg-rose-100 px-2 py-0.5 rounded border border-rose-200 uppercase">
                  New: Post-Expiry Renewal (180 Days)
                </span>
              </div>
              <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                Turnovers determine category: <strong>Basic</strong> (&lt;₹12L, ₹100/yr), <strong>State</strong> (₹12L-₹20Cr, ₹2k-₹5k/yr), or <strong>Central</strong> (&gt;₹20Cr, ₹7.5k/yr). Under new FSSAI rules, renewals can be processed <strong>instantly (no inspection)</strong> if parameters are unchanged. Furthermore, expired licenses can now be renewed <strong>up to 180 days after expiry</strong> with a tiered penalty (1x fee for 1-90 days, 2x fee for 91-180 days).
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Trade Name</label>
              <input 
                required 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none focus:ring-4 focus:ring-emerald-50 uppercase text-slate-900"
                value={formData.tradeName || ''} 
                onChange={e => { 
                  const val = e.target.value;
                  setFormData(prev => ({ ...prev, tradeName: val, clientName: prev.legalName || val })); 
                  setIsDropdownOpen(true); 
                }} 
                onFocus={() => setIsDropdownOpen(true)} 
                placeholder="Trade Name (e.g. Royal Sweets)" 
              />
              {isDropdownOpen && suggestions.length > 0 && (
                <div className="absolute top-full mt-1 z-50 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                  {suggestions.map(c => {
                    const trade = c.tradeName || c.legalName;
                    const legal = c.legalName || c.tradeName;
                    return (
                      <button key={c.id} type="button" 
                        onClick={() => { 
                          setFormData(prev => ({ 
                            ...prev, 
                            tradeName: trade,
                            legalName: legal,
                            clientName: legal, 
                            mobile: c.mobile || prev.mobile || '' 
                          })); 
                          setIsDropdownOpen(false); 
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 border-b border-slate-50 last:border-0 transition-colors"
                      >
                        <p className="text-xs font-black text-slate-900 truncate">Trade: {trade}</p>
                        <p className="text-[10px] font-bold text-slate-600 truncate">Legal: {legal || '---'}</p>
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
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Legal Name</label>
              <input 
                required 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none focus:ring-4 focus:ring-emerald-50 uppercase text-slate-900"
                value={formData.legalName || ''} 
                onChange={e => {
                  const val = e.target.value;
                  setFormData(prev => ({ ...prev, legalName: val, clientName: val || prev.tradeName || '' }));
                }} 
                placeholder="Legal Entity Name" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Mobile No</label>
              <input 
                required 
                maxLength={10} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none focus:ring-4 focus:ring-emerald-50 text-slate-900"
                value={formData.mobile || ''} 
                onChange={e => setFormData(prev => ({ ...prev, mobile: e.target.value.replace(/\D/g, '') }))} 
                placeholder="10 Digit Mobile No..." 
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">FSSAI Category</label>
              <select required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none text-slate-900"
                value={formData.licenseType} onChange={e => setFormData(prev => ({ ...prev, licenseType: e.target.value as FoodLicenseType }))}>
                <option value="FSSAI Basic Registration">Basic Registration</option>
                <option value="State License">State License</option>
                <option value="Central License">Central License</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Application Status</label>
              <select required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none text-slate-900"
                value={formData.status || 'Pending'} 
                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as FoodLicenseStatus }))}
              >
                <option value="Pending">Pending</option>
                <option value="Applied">Applied</option>
                <option value="Completed">Completed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">FSSAI License No / ID</label>
              <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-black uppercase font-mono tracking-widest outline-none text-emerald-600"
                value={formData.licenseNo || ''} onChange={e => setFormData({...formData, licenseNo: e.target.value})} placeholder="FSSAI License No or Application ID" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">FSSAI Portal Password</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-mono font-bold outline-none text-slate-900"
                value={formData.password || ''} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                placeholder="Password created while applying" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Applied Date</label>
              <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none uppercase text-xs"
                value={formData.appDate} onChange={e => setFormData({...formData, appDate: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Expiry Date</label>
              <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none uppercase text-xs"
                value={formData.expiryDate} onChange={e => handleExpiryDateChange(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-1.5 flex items-center justify-between ml-1">
                <span>Renewal Due Date</span>
              </label>
              <input type="date" className="w-full bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 font-bold outline-none uppercase text-amber-900 text-xs"
                value={formData.dueDate || (formData.expiryDate ? calculateRenewalDueDate(formData.expiryDate) : '')} 
                onChange={e => setFormData({...formData, dueDate: e.target.value})} />
              <p className="text-[8px] font-bold text-amber-600/80 mt-1 ml-1 lowercase">*Auto-set to 2 months before expiry</p>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Staff Remarks</label>
            <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none h-20"
              value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} placeholder="Context..." />
          </div>
        </div>

        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex gap-4 shrink-0">
          <button type="button" onClick={onClose} className="px-6 py-3.5 bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
          <button type="submit" className="flex-1 px-8 py-3.5 bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:bg-slate-900 transition-all active:scale-[0.98]">Save FSSAI Record</button>
        </div>
      </form>
      {isGuidelinesOpen && (
        <LitigationGuidelinesModal isOpen={isGuidelinesOpen} onClose={() => setIsGuidelinesOpen(false)} initialCategory="FoodLicense" />
      )}
    </div>
  );
};

export default FoodLicensesForm;