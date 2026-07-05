import React, { useState, useMemo, useEffect } from 'react';
import { LitigationRecord, LitigationCategory, LitigationStatus, Client } from '../../types';
import { api } from '../../services/api.ts';

interface NoticeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<LitigationRecord>) => void;
  clients: Client[];
  category: LitigationCategory;
  initialData?: Partial<LitigationRecord> | null;
  isReissue?: boolean;
}

const NoticeForm: React.FC<NoticeFormProps> = ({ isOpen, onClose, onSave, clients: propClients, category, initialData, isReissue }) => {
  const [formData, setFormData] = useState<Partial<LitigationRecord>>({
    status: 'Pending',
    category: category,
    taxPeriod: '',
    section: '',
    referenceNo: '',
    issuedDate: '',
    dueDate: '',
    filedDate: '',
    orderDate: '',
    remarks: '',
    isReissued: false
  });

  const [dbClients, setDbClients] = useState<Client[]>(propClients || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (isOpen && (!propClients || propClients.length === 0)) {
      api.getClients().then(setDbClients);
    }
  }, [isOpen, propClients]);

  useEffect(() => {
    if (initialData) {
      if (isReissue) {
        // Strip id to create a NEW record, keep previous as history
        const { id, _id, isDemandPaid, ...rest } = initialData as any;
        const prevDetails = `\n\n--- PREVIOUS ${initialData.category || 'RECORD'} DETAILS ---\nRef: ${initialData.referenceNo}\nIssued: ${initialData.issuedDate}\nDue: ${initialData.dueDate}\nFiled: ${initialData.filedDate || 'N/A'}`;
        setFormData({
          ...rest,
          category: category,
          status: 'Pending',
          filedDate: '',
          orderDate: '',
          remarks: (rest.remarks || '') + prevDetails,
          isReissued: true
        });
      } else {
        setFormData({
          ...initialData,
          category: category,
          status: initialData.status || 'Pending',
          filedDate: initialData.filedDate || '',
          orderDate: initialData.orderDate || ''
        });
      }
      setSearchQuery(initialData.clientName || '');
    } else {
      setFormData({
        status: 'Pending',
        category: category,
        taxPeriod: '',
        section: '',
        referenceNo: '',
        issuedDate: '',
        dueDate: '',
        filedDate: '',
        orderDate: '',
        remarks: '',
        isReissued: false
      });
      setSearchQuery('');
    }
  }, [initialData, isOpen, category, isReissue]);

  const filteredClients = useMemo(() => {
    const s = searchQuery.toLowerCase();
    if (!s) return [];
    return dbClients.filter(c => 
      (c.tradeName || '').toLowerCase().includes(s) || 
      (c.gstProfile?.gstin || '').toLowerCase().includes(s) ||
      (c.legalName || '').toLowerCase().includes(s)
    );
  }, [dbClients, searchQuery]);

  const handleClientSelect = (client: Client) => {
    setFormData({ 
      ...formData, 
      clientId: client.id, 
      clientName: client.tradeName || client.legalName 
    });
    setSearchQuery(client.tradeName || client.legalName);
    setIsDropdownOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-hidden">
      <form 
        onSubmit={(e) => { e.preventDefault(); onSave(formData); }}
        className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl p-8 space-y-6 animate-in zoom-in-95 flex flex-col gap-1"
      >
        <div className="flex items-center justify-between shrink-0">
           <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
             {category} Documentation
           </h3>
           <button type="button" onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-100">
              <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
           </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar pr-1">
          <div className="relative">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Entity Lookup</label>
            <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none focus:ring-4 focus:ring-indigo-100 transition-all uppercase"
              placeholder="Trade Name or GSTIN..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }} />
            {isDropdownOpen && filteredClients.length > 0 && (
              <div className="absolute top-full mt-1 z-50 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto no-scrollbar">
                {filteredClients.map(c => (
                  <button key={c.id} type="button" onClick={() => handleClientSelect(c)} className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-slate-50 last:border-0">
                    <p className="text-xs font-black text-slate-900 truncate">{c.tradeName || c.legalName}</p>
                    <p className="text-[10px] text-indigo-600 font-mono font-black">{c.gstProfile?.gstin || 'NO GSTIN'}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Section</label>
              <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none uppercase focus:ring-4 focus:ring-indigo-100" value={formData.section || ''} onChange={e => setFormData({...formData, section: e.target.value})} placeholder="E.G. 73" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Tax Period</label>
              <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none uppercase focus:ring-4 focus:ring-indigo-100" value={formData.taxPeriod || ''} onChange={e => setFormData({...formData, taxPeriod: e.target.value})} placeholder="E.G. 2023-24" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Reference No</label>
            <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none uppercase focus:ring-4 focus:ring-indigo-100" value={formData.referenceNo || ''} onChange={e => setFormData({...formData, referenceNo: e.target.value})} placeholder="Notice/Order No" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">{category !== 'Notice' ? 'Order Date' : 'Issued Date'}</label>
              <input required type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none focus:ring-4 focus:ring-indigo-100 uppercase" value={formData.issuedDate || ''} onChange={e => {
                const newDate = e.target.value;
                if (category !== 'Notice' && newDate) {
                  const date = new Date(newDate);
                  date.setDate(date.getDate() + 90);
                  const dueDate = date.toISOString().split('T')[0];
                  setFormData({...formData, issuedDate: newDate, orderDate: newDate, dueDate: dueDate});
                } else {
                  setFormData({...formData, issuedDate: newDate, orderDate: newDate});
                }
              }} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Due Date</label>
              <input required type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none focus:ring-4 focus:ring-indigo-100 uppercase" value={formData.dueDate || ''} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Status</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none focus:ring-4 focus:ring-indigo-100 uppercase"
              value={formData.status || 'Pending'}
              onChange={e => setFormData({...formData, status: e.target.value as LitigationStatus})}
            >
              <option value="Pending">Pending</option>
              <option value="Filed">Filed</option>
              <option value="Dropped">Dropped</option>
            </select>
          </div>

          {(formData.status === 'Filed' || formData.status === 'Dropped') && (
            <div className="grid grid-cols-2 gap-4">
              {formData.status === 'Filed' && (
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Reply Filed Date</label>
                  <input required type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none focus:ring-4 focus:ring-indigo-100 uppercase" value={formData.filedDate || ''} onChange={e => setFormData({...formData, filedDate: e.target.value})} />
                </div>
              )}
              {formData.status === 'Dropped' && (
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Order Date</label>
                  <input required type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none focus:ring-4 focus:ring-indigo-100 uppercase" value={formData.orderDate || ''} onChange={e => setFormData({...formData, orderDate: e.target.value})} />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Internal Notes</label>
            <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none h-20" value={formData.remarks || ''} onChange={e => setFormData({...formData, remarks: e.target.value})} placeholder="Staff instructions..." />
          </div>
        </div>

        <div className="flex gap-4 pt-4 shrink-0">
          <button type="button" onClick={onClose} className="flex-1 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px] border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
          <button type="submit" className="flex-[2] bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-xl shadow-xl hover:bg-slate-900 transition-all active:scale-[0.98]">Save Litigation</button>
        </div>
      </form>
    </div>
  );
};

export default NoticeForm;