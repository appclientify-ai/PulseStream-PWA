
import React, { useState, useEffect, useMemo } from 'react';
import { Client, InvoiceRecord, InvoiceLineItem, InvoiceSettings } from '../../../types';
import { mockBackend } from '../../../services/mockBackend';
import Loader from '../../../components/Loader';

const TAX_RATES = [0, 5, 12, 18, 28];

interface AddInvoiceProps {
  onBack: () => void;
  editingInvoice?: InvoiceRecord | null;
}

const AddInvoice: React.FC<AddInvoiceProps> = ({ onBack, editingInvoice }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  
  // Form State
  const [selectedClientId, setSelectedClientId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMiscClient, setIsMiscClient] = useState(false);
  const [invDate, setInvDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Client Details (Auto-populated or Manual)
  const [clientLegalName, setClientLegalName] = useState('');
  const [clientTradeName, setClientTradeName] = useState('');
  const [clientGstin, setClientGstin] = useState('');
  const [clientMobile, setClientMobile] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');

  const [items, setItems] = useState<InvoiceLineItem[]>([
    { id: '1', description: '', quantity: 1, rate: 0, taxRate: 18, amount: 0 }
  ]);
  const [status, setStatus] = useState<InvoiceRecord['status']>('Draft');

  useEffect(() => {
    const init = async () => {
      const [clis, nextNo, sets] = await Promise.all([
        mockBackend.getClients(),
        mockBackend.generateNextInvoiceNo(),
        mockBackend.getInvoiceSettings()
      ]);
      setClients(clis);
      setSettings(sets);
      
      if (editingInvoice) {
        setInvoiceNo(editingInvoice.invoiceNo);
        setSelectedClientId(editingInvoice.clientId);
        setSearchQuery(editingInvoice.clientName);
        setIsMiscClient(!!editingInvoice.isMiscClient);
        
        setClientLegalName(editingInvoice.clientName);
        setClientTradeName(editingInvoice.clientName); // Simplified for edit
        setClientGstin(''); // Should ideally be in types, using name for now
        setClientMobile(editingInvoice.miscMobile || '');
        setClientAddress(editingInvoice.miscAddress || '');
        setInvDate(editingInvoice.date);
        setItems(editingInvoice.items);
        setStatus(editingInvoice.status);
      } else {
        setInvoiceNo(nextNo);
      }
      
      setIsLoading(false);
    };
    init();
  }, [editingInvoice]);

  const filteredClients = useMemo(() => {
    if (!searchQuery) return [];
    return clients.filter(c => 
      c.legalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tradeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.gstProfile?.gstin || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [clients, searchQuery]);

  // AUTO POPULATION LOGIC
  const handleClientSelect = (c: Client) => {
    setSelectedClientId(c.id);
    setSearchQuery(c.legalName);
    setIsMiscClient(false);
    
    // Auto-fill all fields
    setClientLegalName(c.legalName);
    setClientTradeName(c.tradeName || c.legalName);
    setClientGstin(c.gstProfile?.gstin || c.itProfile?.pan || '');
    setClientMobile(c.mobile);
    setClientEmail(c.email || '');
    setClientAddress(c.gstProfile?.address || '');
    
    setIsDropdownOpen(false);
  };

  const totals = useMemo(() => {
    const subTotal = items.reduce((acc, item) => acc + (item.rate * item.quantity), 0);
    const totalTax = settings?.isGstEnabled 
      ? items.reduce((acc, item) => acc + ((item.rate * item.quantity) * (item.taxRate / 100)), 0)
      : 0;
    return { subTotal, totalTax, grandTotal: subTotal + totalTax };
  }, [items, settings]);

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), description: '', quantity: 1, rate: 0, taxRate: settings?.isGstEnabled ? 18 : 0, amount: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceLineItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        updated.amount = updated.rate * updated.quantity;
        return updated;
      }
      return item;
    }));
  };

  const handleSave = async () => {
    if (!clientLegalName) return alert('Please specify a client');

    // Auto-calculate Due Date (Date + 15 days)
    const dDate = new Date(invDate);
    dDate.setDate(dDate.getDate() + 15);
    const dueDateStr = dDate.toISOString().split('T')[0];

    const record: Partial<InvoiceRecord> = {
      id: editingInvoice?.id,
      clientId: isMiscClient ? 'misc' : selectedClientId,
      clientName: clientLegalName,
      isMiscClient,
      miscMobile: clientMobile,
      miscAddress: clientAddress,
      invoiceNo,
      date: invDate,
      dueDate: dueDateStr,
      items,
      subTotal: totals.subTotal,
      totalTax: totals.totalTax,
      totalAmount: totals.grandTotal,
      status
    };

    await mockBackend.saveInvoice(record);
    onBack();
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto w-full overflow-hidden pb-10">
      
      <div className="flex items-center justify-between bg-white p-4 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-all text-slate-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{editingInvoice ? 'Edit' : 'Create'} Invoice</h2>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{invoiceNo}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <select value={status} onChange={e => setStatus(e.target.value as any)} 
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none">
            <option value="Draft">Save as Draft</option>
            <option value="Sent">Mark as Sent</option>
          </select>
          <button onClick={handleSave} className="bg-indigo-600 text-white font-black uppercase tracking-widest px-8 h-11 rounded-xl shadow-lg hover:bg-slate-900 transition-all text-xs">
            {editingInvoice ? 'Update Bill' : 'Generate Bill'}
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-y-auto no-scrollbar p-10 space-y-10 pb-20">
        
        {/* Client Selector Section */}
        <section>
          <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-6 flex items-center gap-3">Bill To <div className="h-px flex-1 bg-slate-100" /></h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="relative">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block ml-1">Search Client List</label>
              <input 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                placeholder="Search master records or type new name..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }}
                onFocus={() => setIsDropdownOpen(true)}
              />
              {isDropdownOpen && filteredClients.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-2 overflow-hidden animate-in zoom-in-95">
                  {filteredClients.map(c => (
                    <button key={c.id} onClick={() => handleClientSelect(c)}
                      className="w-full text-left px-4 py-3 hover:bg-indigo-50 rounded-xl transition-all">
                      <p className="text-xs font-black text-slate-900 uppercase">{c.legalName}</p>
                      <p className="text-[10px] text-slate-400 font-mono tracking-tight uppercase">{c.gstProfile?.gstin || c.itProfile?.pan || 'NO ID'}</p>
                    </button>
                  ))}
                </div>
              )}
              {!selectedClientId && searchQuery && (
                 <button onClick={() => { setIsMiscClient(true); setClientLegalName(searchQuery); setClientTradeName(searchQuery); setIsDropdownOpen(false); }}
                   className="mt-2 text-[9px] font-black uppercase text-indigo-600 hover:underline">+ Create New Misc Client: {searchQuery}</button>
              )}
            </div>

            <div>
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block ml-1">Invoice Date</label>
               <input type="date" value={invDate} onChange={e => setInvDate(e.target.value)} 
                 className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-50 transition-all uppercase" />
            </div>

            {/* Extended Client Details - Auto Populated */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-2 bg-slate-50/50 p-8 rounded-3xl border border-slate-100 animate-in fade-in">
                <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">Full Legal Name</label>
                    <input className="w-full bg-white border border-slate-200 rounded-xl p-3 font-bold text-sm uppercase" value={clientLegalName} onChange={e => setClientLegalName(e.target.value)} />
                </div>
                <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">Business/Trade Name</label>
                    <input className="w-full bg-white border border-slate-200 rounded-xl p-3 font-bold text-sm uppercase" value={clientTradeName} onChange={e => setClientTradeName(e.target.value)} />
                </div>
                <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">GSTIN / PAN</label>
                    <input className="w-full bg-white border border-slate-200 rounded-xl p-3 font-black text-sm uppercase font-mono tracking-widest" value={clientGstin} onChange={e => setClientGstin(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">Mobile</label>
                        <input className="w-full bg-white border border-slate-200 rounded-xl p-3 font-bold text-sm" value={clientMobile} onChange={e => setClientMobile(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">Email</label>
                        <input className="w-full bg-white border border-slate-200 rounded-xl p-3 font-bold text-sm lowercase" value={clientEmail} onChange={e => setClientEmail(e.target.value)} />
                    </div>
                </div>
                <div className="md:col-span-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">Billing Address</label>
                    <textarea className="w-full bg-white border border-slate-200 rounded-xl p-3 font-bold text-sm uppercase h-20" value={clientAddress} onChange={e => setClientAddress(e.target.value)} />
                </div>
            </div>
          </div>
        </section>

        {/* Line Items Section */}
        <section>
          <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-6 flex items-center gap-3">Services Matrix <div className="h-px flex-1 bg-slate-100" /></h4>
          <div className="space-y-4">
             {items.map((item, idx) => (
               <div key={item.id} className="grid grid-cols-12 gap-4 items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100 group animate-in slide-in-from-left-4" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="col-span-1">
                    <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block text-center">S.No</label>
                    <p className="text-center font-black text-slate-300 text-xs">{idx + 1}</p>
                  </div>
                  <div className={`${settings?.isGstEnabled ? 'col-span-4' : 'col-span-5'}`}>
                    <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block">Description</label>
                    <input className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-100"
                      value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="Consulting Service..." />
                  </div>
                  <div className="col-span-1">
                    <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block">Qty</label>
                    <input type="number" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none text-center"
                      value={item.quantity} onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block">Rate (₹)</label>
                    <input type="number" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-black outline-none text-right"
                      value={item.rate} onChange={e => updateItem(item.id, 'rate', Number(e.target.value))} />
                  </div>
                  {settings?.isGstEnabled && (
                    <div className="col-span-1">
                        <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block">GST %</label>
                        <select className="w-full bg-white border border-slate-200 rounded-xl p-3 text-[10px] font-black outline-none"
                        value={item.taxRate} onChange={e => updateItem(item.id, 'taxRate', Number(e.target.value))}>
                        {TAX_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                        </select>
                    </div>
                  )}
                  <div className="col-span-2 text-right">
                    <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block">Total</label>
                    <p className="text-sm font-black text-slate-900">₹{(item.rate * item.quantity).toLocaleString()}</p>
                  </div>
                  <div className="col-span-1 text-right">
                    <button onClick={() => removeItem(item.id)} className="h-10 w-10 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
               </div>
             ))}
             <button onClick={addItem} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-indigo-600 hover:text-indigo-600 transition-all">+ Add Line Item</button>
          </div>
        </section>

        {/* Calculation Summary Section */}
        <section className="flex justify-end">
           <div className="w-full max-w-sm bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-4">
              <div className="flex justify-between items-center text-slate-500">
                 <span className="text-[10px] font-black uppercase tracking-widest">Sub-Total</span>
                 <span className="text-sm font-black">₹{totals.subTotal.toLocaleString()}</span>
              </div>
              {settings?.isGstEnabled && (
                <div className="flex justify-between items-center text-slate-500 border-b border-slate-200 pb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest">Aggregate GST</span>
                    <span className="text-sm font-black">₹{totals.totalTax.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2">
                 <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">Grand Total</span>
                 <span className="text-2xl font-black text-slate-900">₹{totals.grandTotal.toLocaleString()}</span>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};

export default AddInvoice;
