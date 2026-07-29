import React, { useState, useMemo, useEffect } from 'react';
import { LitigationRecord, LitigationCategory, LitigationStatus, Client } from '../../types';
import { api } from '../../services/api.ts';
import LitigationGuidelinesModal from '../../components/LitigationGuidelinesModal';

interface NoticeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<LitigationRecord>) => void;
  onDelete?: (id: string) => void;
  clients: Client[];
  category: LitigationCategory;
  initialData?: Partial<LitigationRecord> | null;
  isReissue?: boolean;
}

const SECTIONS_BY_CATEGORY: Record<string, string[]> = {
  Notice: ['73', '74', '61', '129', '130', '142', '148', 'DRC-01'],
  Appeal: ['107', '112', '108', 'APL-01', '107(1)', '107(11)'],
  Tribunal: ['112', '113', '108', '107', 'APL-05', '112(1)', '112(3)', '112(6)'],
  'High Court': ['117', '118', 'Art 226', 'Art 227', '117(1)'],
  HighCourt: ['117', '118', 'Art 226', 'Art 227', '117(1)']
};

const COMMON_PERIODS = ['2024-25', '2023-24', '2022-23', '2021-22'];

export const NoticeForm: React.FC<NoticeFormProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  clients: propClients,
  category,
  initialData,
  isReissue
}) => {
  const isNotice = category === 'Notice';
  const isAppeal = category === 'Appeal';
  const isTribunal = category === 'Tribunal';
  const isHighCourt = category === 'HighCourt' || category === 'High Court';

  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<LitigationRecord>>({
    status: 'Pending',
    category: category,
    taxPeriod: '',
    section: '',
    referenceNo: '',
    issuedDate: '',
    dueDate: '',
    filedDate: '',
    replyReferenceNo: '',
    orderDate: '',
    remarks: '',
    isReissued: false,
    caseHistory: ''
  });

  const [dbClients, setDbClients] = useState<Client[]>(propClients || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (propClients && propClients.length > 0) {
      setDbClients(propClients);
    }
  }, [propClients]);

  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      setConfirmDelete(false);
      if (!propClients || propClients.length === 0) {
        api.getClients().then(setDbClients);
      }
    }
  }, [isOpen, propClients]);

  useEffect(() => {
    if (initialData) {
      if (isReissue) {
        const { _id, isDemandPaid, ...rest } = initialData as any;
        if (category !== initialData.category) {
          delete rest.id;
        }
        const prevDetails = `\n\n--- PREVIOUS ${initialData.category || 'RECORD'} DETAILS ---\nRef: ${initialData.referenceNo}\nIssued: ${initialData.issuedDate}\nDue: ${initialData.dueDate}\nFiled: ${initialData.filedDate || 'N/A'}`;
        setFormData({
          ...rest,
          category: category,
          status: 'Pending',
          filedDate: '',
          replyReferenceNo: '',
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
          replyReferenceNo: initialData.replyReferenceNo || '',
          orderDate: initialData.orderDate || '',
          caseHistory: initialData.caseHistory || ''
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
        replyReferenceNo: '',
        orderDate: '',
        remarks: '',
        isReissued: false,
        caseHistory: ''
      });
      setSearchQuery('');
    }
  }, [initialData, isOpen, category, isReissue]);

  // Selected client lookup
  const selectedClient = useMemo(() => {
    if (formData.clientId) {
      return dbClients.find(c => c.id === formData.clientId);
    }
    return null;
  }, [dbClients, formData.clientId]);

  const filteredClients = useMemo(() => {
    const s = searchQuery.toLowerCase().trim();
    if (!s) return [];
    return dbClients.filter(c => 
      (c.tradeName || '').toLowerCase().includes(s) || 
      (c.gstProfile?.gstin || '').toLowerCase().includes(s) ||
      (c.legalName || '').toLowerCase().includes(s)
    );
  }, [dbClients, searchQuery]);

  const handleClientSelect = (client: Client) => {
    setFormData(prev => ({ 
      ...prev, 
      clientId: client.id, 
      clientName: client.tradeName || client.legalName 
    }));
    setSearchQuery(client.tradeName || client.legalName);
    setIsDropdownOpen(false);
  };

  const handleClearClient = () => {
    setFormData(prev => ({
      ...prev,
      clientId: '',
      clientName: ''
    }));
    setSearchQuery('');
    setIsDropdownOpen(true);
  };

  const addDaysToDate = (baseDateStr: string, days: number) => {
    if (!baseDateStr) return;
    const d = new Date(baseDateStr);
    if (isNaN(d.getTime())) return;
    d.setDate(d.getDate() + days);
    const newDueDate = d.toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, dueDate: newDueDate }));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    if (!formData.clientId && !formData.clientName) {
      alert('Please select a Taxpayer / Client.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('Failed to save record:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!initialData?.id && !isReissue;
  const sectionSuggestions = SECTIONS_BY_CATEGORY[category] || SECTIONS_BY_CATEGORY['Notice'];

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-3 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <form 
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-black text-[10px] uppercase tracking-wider">
                {category} Module
              </span>
              {isEditing && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[10px] uppercase">
                  Editing Mode
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
              {isEditing 
                ? `Modify GST ${category}` 
                : isReissue 
                ? `Escalate / Move to ${category}` 
                : `Add New GST ${category}`}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsGuidelinesOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/40 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-400/30 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
              title="View Complete Statutory Guidelines for Notice, Appeal, Tribunal & High Court"
            >
              <span>⚖️</span>
              <span className="hidden sm:inline">Litigation Guide</span>
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto no-scrollbar flex-1 text-slate-900">
          
          {isNotice && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs animate-in slide-in-from-top-2 duration-300">
              <span className="text-xl">📩</span>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide">GST Notice Statutory Guideline</h4>
                  <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200 uppercase">
                    30 Days Reply Deadline
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                  GST Notices are issued under <strong>Section 73</strong> (Non-fraud / determination of tax), <strong>Section 74</strong> (Fraud / wilful misstatement / suppression), <strong>Section 61</strong> (Scrutiny of Returns - ASMT-10), <strong>Section 129/130</strong> (E-Way Bill & Transit Detention), or <strong>DRC-01/01A</strong>. Standard statutory reply deadline is <strong>30 days</strong> from date of service in Form DRC-06 or ASMT-11.
                </p>
              </div>
            </div>
          )}

          {isAppeal && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs animate-in slide-in-from-top-2 duration-300">
              <span className="text-xl">⚖️</span>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wide">GST First Appeal Guideline (Section 107)</h4>
                  <span className="text-[10px] font-black text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 uppercase">
                    Section 107 • Form APL-01
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                  First Appeals against Adjudication Orders before the Appellate Authority (JC/ADC/Comm Appeals) are filed under <strong>Section 107 of CGST Act</strong> in <strong>Form GST APL-01</strong> within <strong>90 days (3 months)</strong> of receiving the order. Condonation of delay up to 30 extra days is permissible u/s 107(4) with valid reasons. Mandatory pre-deposit is <strong>10% of disputed tax demand</strong> (max ₹25 Cr each CGST/SGST).
                </p>
              </div>
            </div>
          )}

          {isTribunal && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs animate-in slide-in-from-top-2 duration-300">
              <span className="text-xl">🏛️</span>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <h4 className="text-xs font-black text-purple-900 uppercase tracking-wide">GST Appellate Tribunal (GSTAT) Guideline (Section 112)</h4>
                  <span className="text-[10px] font-black text-purple-800 bg-purple-100 px-2 py-0.5 rounded border border-purple-200 uppercase">
                    Section 112 • Form APL-05
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                  Appeals before the GST Appellate Tribunal (GSTAT) are filed under <strong>Section 112 of CGST Act</strong> in <strong>Form GST APL-05</strong> within <strong>90 days (3 months)</strong> of communication of the Order-in-Appeal (u/s 107) or Revisional Order (u/s 108). Statutory pre-deposit is <strong>20% of disputed tax demand</strong> (in addition to 10% paid at First Appeal stage). Delay condonation up to 180 days is permitted under Section 112(6) upon showing sufficient cause.
                </p>
              </div>
            </div>
          )}

          {isHighCourt && (
            <div className="bg-gradient-to-r from-slate-100 to-indigo-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs animate-in slide-in-from-top-2 duration-300">
              <span className="text-xl">🏛️</span>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">High Court Litigation Guideline (Section 117 / Article 226)</h4>
                  <span className="text-[10px] font-black text-slate-800 bg-slate-200 px-2 py-0.5 rounded border border-slate-300 uppercase">
                    Section 117 • Art 226/227
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                  Statutory Appeals against GSTAT orders involving substantial questions of law are filed under <strong>Section 117 of CGST Act</strong> within <strong>180 days</strong>. Constitutional Writ Petitions under <strong>Article 226 / Article 227 of the Constitution of India</strong> can be invoked against orders passed in violation of principles of natural justice, lack of jurisdiction, or unconstitutionality.
                </p>
              </div>
            </div>
          )}

          {/* SECTION 1: Taxpayer / Client Selection */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                1. Select Taxpayer / Client
              </label>
              {selectedClient && (
                <button
                  type="button"
                  onClick={handleClearClient}
                  className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center gap-1"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Change Taxpayer
                </button>
              )}
            </div>

            {selectedClient ? (
              <div className="bg-white p-3.5 rounded-xl border border-indigo-200 shadow-xs flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-900 truncate">{selectedClient.tradeName || selectedClient.legalName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {selectedClient.gstProfile?.gstin || 'NO GSTIN'}
                    </span>
                    {selectedClient.legalName && selectedClient.tradeName && (
                      <span className="text-[10px] font-bold text-slate-400 truncate">
                        ({selectedClient.legalName})
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
              </div>
            ) : formData.clientName && !formData.clientId ? (
              <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-900">{formData.clientName}</p>
                  <p className="text-[10px] text-amber-600 font-bold">Unlinked client record</p>
                </div>
                <button
                  type="button"
                  onClick={handleClearClient}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  Search & Link
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <input
                    required
                    type="text"
                    className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-10 pr-4 font-bold text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all uppercase"
                    placeholder="Type Trade Name, Legal Name, or GSTIN..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                  />
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>

                {isDropdownOpen && filteredClients.length > 0 && (
                  <div className="absolute top-full mt-1.5 z-50 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-100">
                    {filteredClients.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleClientSelect(c)}
                        className="w-full text-left px-4 py-3 hover:bg-indigo-50/80 transition-colors flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-900 truncate">{c.tradeName || c.legalName}</p>
                          {c.legalName && c.tradeName && <p className="text-[10px] text-slate-400 font-medium truncate">{c.legalName}</p>}
                        </div>
                        <span className="text-[10px] font-mono font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 shrink-0">
                          {c.gstProfile?.gstin || 'NO GSTIN'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {isDropdownOpen && searchQuery && filteredClients.length === 0 && (
                  <div className="absolute top-full mt-1.5 z-50 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl p-4 text-center text-xs font-bold text-slate-400">
                    No clients found matching "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 2: Notice / Appeal Specifications */}
          <div className="space-y-4">
            <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              2. {category} Specifications & Provisions
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Section */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                  {isTribunal ? 'Tribunal Provision / Section / Form' : isAppeal ? 'Appeal Provision / Section / Form' : 'Act / Section'} <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-xs outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 uppercase"
                  placeholder={isTribunal ? 'e.g. 112, 113, APL-05, GSTAT-01...' : isAppeal ? 'e.g. 107, APL-01, 107(1)...' : 'e.g. 73, 74, 129, 61...'}
                  value={formData.section || ''}
                  onChange={e => setFormData({ ...formData, section: e.target.value })}
                />
                {/* Quick Section Chips */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {sectionSuggestions.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, section: s }))}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                        formData.section === s 
                          ? 'bg-indigo-600 text-white font-black' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {s.startsWith('APL') || s.startsWith('GSTAT') || s.startsWith('Art') ? s : `U/s ${s}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tax Period */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                  Tax Period / FY <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-xs outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 uppercase"
                  placeholder="e.g. 2023-24, Apr-23 to Mar-24..."
                  value={formData.taxPeriod || ''}
                  onChange={e => setFormData({ ...formData, taxPeriod: e.target.value })}
                />
                {/* Quick Period Chips */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {COMMON_PERIODS.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, taxPeriod: p }))}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                        formData.taxPeriod === p 
                          ? 'bg-indigo-600 text-white font-black' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      FY {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Reference / DIN Number */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                {isHighCourt ? 'Impugned GSTAT Order No / Decision Reference' : isTribunal ? 'Order-In-Appeal (OIA) No / Impugned Order Ref No' : isAppeal ? 'Appeal ARN / Order-In-Original No / APL-01 Ref' : 'Notice Reference No / DIN / Order No'} <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-xs outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 font-mono uppercase"
                placeholder={isHighCourt ? 'e.g. GSTAT-DEL/ORDER/2024/01 or J-123/24' : isTribunal ? 'e.g. OIA-GSTAT-2023-24/105 or APL-01/Ref/789' : isAppeal ? 'e.g. APL-01 ARN / OIO-1234/2023-24' : 'e.g. ZD2703241234567 or DRC-01/2023-24/102'}
                value={formData.referenceNo || ''}
                onChange={e => setFormData({ ...formData, referenceNo: e.target.value })}
              />
            </div>
          </div>

          {/* SECTION 3: Key Timeline & Dates */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              3. Key Timelines & Statutory Deadlines
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Notice / OIO Issued Date */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                    {isHighCourt ? 'Impugned Order/Decision Date' : isTribunal ? 'Order-In-Appeal (OIA) Date' : isAppeal ? 'Order-In-Original Date' : 'Issued Date'} <span className="text-red-500">*</span>
                  </label>
                </div>
                <input
                  required
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-xs outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 uppercase font-mono"
                  value={formData.issuedDate || ''}
                  onChange={e => {
                    const newIssued = e.target.value;
                    setFormData(prev => ({ ...prev, issuedDate: newIssued, orderDate: newIssued }));
                  }}
                />
              </div>

              {/* Due Date */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-red-600 tracking-wider block flex items-center gap-1">
                    {isHighCourt ? 'High Court Petition / WP Filing Deadline' : isTribunal ? 'Tribunal Appeal Filing Deadline' : isAppeal ? 'Appeal Filing Deadline' : 'Due Date (Deadline)'} <span className="text-red-500">*</span>
                  </label>
                  {formData.issuedDate && (
                    <div className="flex gap-1">
                      {isHighCourt ? (
                        <>
                          <button
                            type="button"
                            onClick={() => addDaysToDate(formData.issuedDate!, 90)}
                            className="text-[9px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200 hover:bg-indigo-100"
                            title="Add 90 Days"
                          >
                            +90d (3 Mo)
                          </button>
                        </>
                      ) : isTribunal ? (
                        <>
                          <button
                            type="button"
                            onClick={() => addDaysToDate(formData.issuedDate!, 90)}
                            className="text-[9px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200 hover:bg-indigo-100"
                            title="Add 90 Days (3 Months Standard Limit)"
                          >
                            +90d (3 Mo)
                          </button>
                          <button
                            type="button"
                            onClick={() => addDaysToDate(formData.issuedDate!, 180)}
                            className="text-[9px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 hover:bg-amber-100"
                            title="Add 180 Days (6 Months Extended Limit)"
                          >
                            +180d (6 Mo)
                          </button>
                        </>
                      ) : isAppeal ? (
                        <>
                          <button
                            type="button"
                            onClick={() => addDaysToDate(formData.issuedDate!, 30)}
                            className="text-[9px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 hover:bg-amber-100"
                            title="Add 30 Days"
                          >
                            +30d
                          </button>
                          <button
                            type="button"
                            onClick={() => addDaysToDate(formData.issuedDate!, 90)}
                            className="text-[9px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200 hover:bg-indigo-100"
                            title="Add 90 Days (Standard Appeal Window)"
                          >
                            +90d (3 Mo)
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => addDaysToDate(formData.issuedDate!, 15)}
                            className="text-[9px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 hover:bg-amber-100"
                            title="Add 15 Days from Notice Date"
                          >
                            +15d
                          </button>
                          <button
                            type="button"
                            onClick={() => addDaysToDate(formData.issuedDate!, 30)}
                            className="text-[9px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200 hover:bg-indigo-100"
                            title="Add 30 Days from Notice Date"
                          >
                            +30d
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <input
                  required
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-xs outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 uppercase font-mono text-red-600"
                  value={formData.dueDate || ''}
                  onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>

            {/* Conditional Dates depending on status */}
            {formData.status === 'Filed' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">
                    {isHighCourt ? 'Date of Filing (High Court)' : isTribunal ? 'Date of Filing (Tribunal)' : isAppeal ? 'Appeal Filing Date (APL-01)' : 'Reply Filed Date'}
                  </label>
                  <input
                    type="date"
                    className="w-full bg-white border border-emerald-200 rounded-xl p-3 font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-600/20 font-mono"
                    value={formData.filedDate || ''}
                    onChange={e => setFormData({ ...formData, filedDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">
                    {isHighCourt ? 'Writ Petition No / High Court Appeal No' : isTribunal ? 'Tribunal Appeal No / GSTAT ARN' : isAppeal ? 'APL-01 ARN / Acknowledgment No' : 'Reply ARN / Reference'}
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white border border-emerald-200 rounded-xl p-3 font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-600/20 font-mono uppercase"
                    placeholder={isHighCourt ? 'e.g. WP-12345/2024 or HC-APPEAL/99/2024' : isTribunal ? 'e.g. GSTAT-DEL/2024/0091 or APL-05/ARN...' : 'e.g. AA2703241234567'}
                    value={formData.replyReferenceNo || ''}
                    onChange={e => setFormData({ ...formData, replyReferenceNo: e.target.value })}
                  />
                </div>
              </div>
            )}

            {(formData.status === 'Dropped' || formData.status === 'Demand') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-100/80 p-3.5 rounded-xl border border-slate-200">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-700 tracking-wider block">
                    {formData.status === 'Dropped' 
                      ? (isHighCourt ? 'High Court Judgment / Relief Date' : isTribunal ? 'Tribunal Order / Relief Date' : isAppeal ? 'Appeal Order / Relief Date' : 'Order / Drop Date') 
                      : (isHighCourt ? 'High Court Judgment Date' : isTribunal ? 'Tribunal Order Date' : isAppeal ? 'Appellate Order Date' : 'Demand Order Date')}
                  </label>
                  <input
                    type="date"
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 font-mono"
                    value={formData.orderDate || ''}
                    onChange={e => setFormData({ ...formData, orderDate: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: Case Status */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              4. Current Stage & Status
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { status: 'Pending', label: isHighCourt ? 'Pending Filing' : isTribunal ? 'Pending Filing' : isAppeal ? 'Pending Filing' : 'Pending', color: 'amber' },
                { status: 'Filed', label: isHighCourt ? 'HC Filed' : isTribunal ? 'Tribunal Filed' : isAppeal ? 'Appeal Filed' : 'Reply Filed', color: 'emerald' },
                { status: 'Demand', label: isHighCourt ? 'Sustained / Demand' : isTribunal ? 'Sustained / Order' : isAppeal ? 'Order Passed' : 'Demand Raised', color: 'red' },
                { status: 'Dropped', label: isHighCourt ? 'Relief / Closed' : isTribunal ? 'Relief / Closed' : isAppeal ? 'Appeal Allowed' : 'Case Dropped', color: 'slate' }
              ].map(opt => {
                const isSelected = formData.status === opt.status;
                return (
                  <button
                    key={opt.status}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, status: opt.status as LitigationStatus }))}
                    className={`py-3 px-2 rounded-xl border text-center font-black text-xs transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? opt.color === 'amber'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-md scale-[1.02]'
                          : opt.color === 'emerald'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-md scale-[1.02]'
                          : opt.color === 'red'
                          ? 'bg-red-600 text-white border-red-700 shadow-md scale-[1.02]'
                          : 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 5: Case History & Staff Remarks */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                {isHighCourt ? 'Writ Petition Grounds, HC Bench Notes & Proceedings' : isTribunal ? 'Tribunal Appeal Grounds, Bench Notes & Proceedings' : isAppeal ? 'Appeal Grounds & Hearing History' : 'Case History & Proceedings'}
              </label>
              <textarea
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-xs outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                placeholder={isHighCourt ? "Record Writ Petition grounds to High Court, bench notes, hearing dates, advocate remarks..." : isTribunal ? "Record grounds of appeal to GSTAT, bench notes, hearing dates, advocate remarks..." : isAppeal ? "Record appeal grounds, hearing dates, appellate officer notes..." : "Record officer hearing notes, submissions, or timeline updates..."}
                value={formData.caseHistory || ''}
                onChange={e => setFormData({ ...formData, caseHistory: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                Internal Staff Notes & Remarks
              </label>
              <textarea
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-xs outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                placeholder="Internal office remarks, team assignments, or follow-up instructions..."
                value={formData.remarks || ''}
                onChange={e => setFormData({ ...formData, remarks: e.target.value })}
              />
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div>
            {onDelete && isEditing && (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-red-600 uppercase">Confirm Delete?</span>
                  <button
                    type="button"
                    onClick={() => onDelete(initialData.id!)}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg font-black text-[10px] uppercase tracking-wider hover:bg-red-700"
                  >
                    Yes, Remove
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1.5 text-slate-500 font-bold text-[10px] hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="px-3 py-2 text-red-600 font-black uppercase tracking-wider text-[10px] bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors flex items-center gap-1.5"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete Record
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-5 py-3 text-slate-600 font-black uppercase tracking-wider text-[10px] border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-7 py-3 bg-indigo-600 text-white font-black uppercase tracking-wider text-[10px] rounded-xl shadow-lg hover:bg-slate-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Saving...
                </>
              ) : isEditing ? (
                `Update ${category} Record`
              ) : (
                `Save ${category} Record`
              )}
            </button>
          </div>
        </div>
      </form>

      <LitigationGuidelinesModal
        isOpen={isGuidelinesOpen}
        onClose={() => setIsGuidelinesOpen(false)}
        initialCategory={category}
      />
    </div>
  );
};

export default NoticeForm;
