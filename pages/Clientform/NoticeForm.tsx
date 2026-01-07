import React, { useState, useMemo, useEffect } from 'react';
import { LitigationRecord, LitigationCategory, LitigationStatus, Client } from '../../types';

interface NoticeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<LitigationRecord>) => void;
  clients: Client[];
  category: LitigationCategory;
  initialData?: Partial<LitigationRecord> | null;
  isReissue?: boolean;
}

const NoticeForm: React.FC<NoticeFormProps> = ({ isOpen, onClose, onSave, clients, category, initialData, isReissue }) => {
  const [formData, setFormData] = useState<Partial<LitigationRecord>>({
    status: 'Pending',
    category: category,
    taxPeriod: '',
    section: '',
    referenceNo: '',
    issuedDate: '',
    dueDate: '',
    filedDate: '',
    hearingDate: '',
    orderDate: '',
    remarks: '',
    previousNoticeRef: '',
    previousNoticeSection: '',
    isReissued: false
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const isNotice = category === 'Notice';

  // Exactly 90 days helper
  const calculateDueDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    date.setHours(0,0,0,0);
    date.setDate(date.getDate() + 90);
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (initialData) {
      if (isReissue) {
        const sourceDate = initialData.orderDate || initialData.issuedDate || '';
        setFormData({
          ...initialData,
          previousNoticeRef: initialData.referenceNo,
          previousNoticeSection: initialData.section,
          referenceNo: initialData.referenceNo || '', 
          section: initialData.section || '',         
          status: 'Pending',
          isReissued: true,
          filedDate: '', // Do NOT pre-fill filing date for a new re-issue
          hearingDate: '',
          orderDate: sourceDate,
          issuedDate: sourceDate,
          dueDate: sourceDate ? calculateDueDate(sourceDate) : '',
          category: category 
        });
      } else {
        setFormData({
          ...initialData,
          filedDate: initialData.filedDate || '', // ONLY pre-fill if it exists
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
        hearingDate: '',
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
    return clients.filter(c => 
      (c.tradeName || '').toLowerCase().includes(s) || 
      (c.gstProfile?.gstin || '').toLowerCase().includes(s) ||
      (c.legalName || '').toLowerCase().includes(s)
    );
  }, [clients, searchQuery]);

  const handleClientSelect = (client: Client) => {
    setFormData({ 
      ...formData, 
      clientId: client.id, 
      clientName: client.tradeName || client.legalName 
    });
    setSearchQuery(client.tradeName || client.legalName);
    setIsDropdownOpen(false);
  };

  const handleStatusChange = (newStatus: LitigationStatus) => {
    setFormData(prev => ({
      ...prev,
      status: newStatus,
      // Only set dates automatically if the user moves TO that status and it's blank
      filedDate: (newStatus === 'Filed' && !prev.filedDate) ? new Date().toISOString().split('T')[0] : prev.filedDate,
      orderDate: ((newStatus === 'Drop' || newStatus === 'Demand') && !prev.orderDate) ? new Date().toISOString().split('T')[0] : prev.orderDate
    }));
  };

  const handleDateChange = (date: string) => {
    setFormData(prev => ({
      ...prev,
      issuedDate: date,
      orderDate: date,
      dueDate: (isReissue || !isNotice) ? calculateDueDate(date) : prev.dueDate
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <form 
        onSubmit={(e) => { e.preventDefault(); onSave(formData); }}
        className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-8 space-y-6 animate-in zoom-in-95"
      >
        <div className="flex items-center justify-between shrink-0">
           <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
             {isReissue ? `Initiate ${category}` : (formData.id ? 'Update' : 'Add')} {category} Record
           </h3>
           <button type="button" onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors">
              <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
           </button>
        </div>

        <div className="space-y-4">
          {!initialData && (
            <div className="relative">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Client Lookup</label>
              <input 
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                placeholder="Search by Trade Name or GSTIN..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }}
                onFocus={() => setIsDropdownOpen(true)}
              />
              {isDropdownOpen && filteredClients.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-[140] max-h-48 overflow-y-auto no-scrollbar">
                  {filteredClients.map(c => (
                    <button key={c.id} type="button" onClick={() => handleClientSelect(c)} className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-slate-50 last:border-0">
                      <p className="text-xs font-black text-slate-900 uppercase">{c.tradeName || c.legalName}</p>
                      <p className="text-[10px] text-indigo-600 font-mono tracking-tighter">{c.gstProfile?.gstin}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">{isNotice ? 'Notice Ref No' : 'Order Ref No'}</label>
              <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none uppercase focus:ring-4 focus:ring-indigo-100 transition-all"
                required
                value={formData.referenceNo || ''} onChange={e => setFormData({...formData, referenceNo: e.target.value.toUpperCase()})} placeholder="Reference No..." />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">{isNotice ? 'Notice U/s' : 'Order Section'}</label>
              <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none uppercase focus:ring-4 focus:ring-indigo-100 transition-all"
                required
                value={formData.section || ''} onChange={e => setFormData({...formData, section: e.target.value.toUpperCase()})} placeholder="Section No..." />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Tax Period</label>
            <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none uppercase focus:ring-4 focus:ring-indigo-100 transition-all"
              value={formData.taxPeriod || ''} onChange={e => setFormData({...formData, taxPeriod: e.target.value.toUpperCase()})} placeholder="e.g. APR-23 TO MAR-24" />
          </div>

          <div className={`grid gap-4 ${isReissue ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">{isNotice ? 'Notice Date' : 'Order Date (Trigger)'}</label>
              <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                required
                value={formData.issuedDate || ''} onChange={e => handleDateChange(e.target.value)} />
            </div>
            {!isReissue && (
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Response Due Date</label>
                <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                  required={formData.status === 'Pending'}
                  value={formData.dueDate || ''} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
              </div>
            )}
          </div>

          {(isReissue || !isNotice) && formData.dueDate && (
             <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 animate-in fade-in slide-in-from-top-2">
                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Timeline Due (Exactly 90 Days)</p>
                <p className="text-sm font-black text-amber-900">{new Date(formData.dueDate).toLocaleDateString('en-GB')}</p>
             </div>
          )}

          {!isReissue && (
            <div className={`grid gap-4 ${formData.status === 'Filed' || formData.status === 'Drop' || formData.status === 'Demand' ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Status</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none focus:ring-4 focus:ring-indigo-100"
                  value={formData.status} onChange={e => handleStatusChange(e.target.value as LitigationStatus)}>
                  <option value="Pending">Pending</option>
                  <option value="Filed">Filed</option>
                  <option value="Drop">{isNotice ? 'Drop Order' : 'Relief Granted'}</option>
                  <option value="Demand">{isNotice ? 'Demand Order' : 'Sustained (Demand)'}</option>
                </select>
              </div>
              {formData.status === 'Filed' && (
                <div className="animate-in slide-in-from-left-2 duration-300">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Reply Filed Date</label>
                  <input type="date" className="w-full bg-white border border-indigo-200 rounded-xl p-3.5 font-bold outline-none shadow-sm"
                    required
                    value={formData.filedDate || ''} onChange={e => setFormData({...formData, filedDate: e.target.value})} />
                </div>
              )}
              {(formData.status === 'Drop' || formData.status === 'Demand') && (
                <div className="animate-in slide-in-from-left-2 duration-300">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Order Date</label>
                  <input type="date" className="w-full bg-white border border-indigo-200 rounded-xl p-3.5 font-bold outline-none shadow-sm"
                    required
                    value={formData.orderDate || ''} onChange={e => setFormData({...formData, orderDate: e.target.value})} />
                </div>
              )}
            </div>
          )}

          {formData.status === 'Filed' && !isNotice && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Next Hearing Date</label>
              <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                value={formData.hearingDate || ''} onChange={e => setFormData({...formData, hearingDate: e.target.value})} />
            </div>
          )}

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Staff Remark</label>
            <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none h-20"
              value={formData.remarks || ''} onChange={e => setFormData({...formData, remarks: e.target.value})} placeholder="Notes..." />
          </div>
        </div>

        <div className="flex gap-4 pt-4 shrink-0">
          <button type="button" onClick={onClose} className="flex-1 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px] border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
          <button type="submit" className="flex-[2] bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-xl shadow-xl hover:bg-slate-900 transition-all active:scale-[0.98]">
            {isReissue ? `Issue ${category}` : (formData.id ? 'Update Record' : 'Save Record')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NoticeForm;