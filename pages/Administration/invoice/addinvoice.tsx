import React, { useState, useEffect, useMemo } from 'react';
import { Client, InvoiceRecord, InvoiceLineItem, InvoiceSettings } from '../../../types';
import { api } from '../../../services/api.ts';
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
  
  const [selectedClientId, setSelectedClientId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMiscClient, setIsMiscClient] = useState(false);
  const [invDate, setInvDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [clientLegalName, setClientLegalName] = useState('');
  const [clientGstin, setClientGstin] = useState('');
  const [clientMobile, setClientMobile] = useState('');
  const [clientAddress, setClientAddress] = useState('');

  const [items, setItems] = useState<InvoiceLineItem[]>([
    { id: '1', description: '', quantity: 1, rate: 0, taxRate: 18, amount: 0 }
  ]);
  const [status, setStatus] = useState<InvoiceRecord['status']>('Draft');

  useEffect(() => {
    const init = async () => {
      const [clis, nextNo, sets] = await Promise.all([
        api.getClients(),
        api.generateNextInvoiceNo(),
        api.getInvoiceSettings()
      ]);
      setClients(clis);
      setSettings(sets);
      
      if (editingInvoice) {
        setInvoiceNo(editingInvoice.invoiceNo);
        setSelectedClientId(editingInvoice.clientId);
        setSearchQuery(editingInvoice.clientName);
        setIsMiscClient(!!editingInvoice.isMiscClient);
        setClientLegalName(editingInvoice.clientName);
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
      (c.gstProfile?.gstin || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [clients, searchQuery]);

  const handleClientSelect = (c: Client) => {
    setSelectedClientId(c.id);
    setSearchQuery(c.legalName);
    setIsMiscClient(false);
    setClientLegalName(c.legalName);
    setClientGstin(c.gstProfile?.gstin || c.itProfile?.pan || '');
    setClientMobile(c.mobile);
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
    if (!clientLegalName) return alert('Specify a billing entity.');
    const dDate = new Date(invDate);
    dDate.setDate(dDate.getDate() + 15);

    const record: Partial<InvoiceRecord> = {
      id: editingInvoice?.id,
      clientId: isMiscClient ? 'misc' : selectedClientId,
      clientName: clientLegalName,
      isMiscClient,
      miscMobile: clientMobile,
      miscAddress: clientAddress,
      invoiceNo,
      date: invDate,
      dueDate: dDate.toISOString().split('T')[0],
      items,
      subTotal: totals.subTotal,
      totalTax: totals.totalTax,
      totalAmount: totals.grandTotal,
      status
    };

    await api.saveInvoice(record);
    onBack();
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto w-full overflow-hidden pb-10">
      <div className="flex items-center justify-between bg-white p-4 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-all">
            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{editingInvoice ? 'Modify' : 'Draft'} Invoice</h2>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{invoiceNo}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} className="bg-indigo-600 text-white font-black uppercase tracking-widest px-10 h-11 rounded-xl shadow-lg hover:bg-slate-900 transition-all text-xs">
            Commit Invoice
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-y-auto no-scrollbar p-10 space-y-12">
        <section>
          <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-8 flex items-center gap-3">Billing Target <div className="h-px flex-1 bg-slate-100" /></h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="relative">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block ml-1">Lookup Master Vault</label>
              <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                placeholder="Client Name or GSTIN..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }} />
              {isDropdownOpen && filteredClients.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-2 overflow-hidden">
                  {filteredClients.map(c => (
                    <button key={c.id} onClick={() => handleClientSelect(c)} className="w-full text-left px-4 py-3 hover:bg-indigo-50 rounded-xl transition-all">
                      <p className="text-xs font-black text-slate-900 uppercase">{c.legalName}</p>
                      <p className="text-[10px] text-slate-400 font-mono uppercase">{c.gstProfile?.gstin || c.itProfile?.pan || 'NO ID'}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block ml-1">Invoice Date</label>
               <input type="date" value={invDate} onChange={e => setInvDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black outline-none" />
            </div>
          </div>
        </section>

        <section>
          <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-8 flex items-center gap-3">Services Description <div className="h-px flex-1 bg-slate-100" /></h4>
          <div className="space-y-4">
             {items.map((item, idx) => (
               <div key={item.id} className="grid grid-cols-12 gap-4 items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <div className="col-span-1 text-center font-black text-slate-300 text-xs">{idx + 1}</div>
                  <div className="col-span-5"><input className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none"
                      value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="Service Details..." /></div>
                  <div className="col-span-2"><input type="number" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-black outline-none text-right"
                      value={item.rate} onChange={e => updateItem(item.id, 'rate', Number(e.target.value))} placeholder="Rate" /></div>
                  <div className="col-span-3 text-right font-black text-slate-900">₹{(item.rate * item.quantity).toLocaleString()}</div>
                  <div className="col-span-1 text-right"><button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></div>
               </div>
             ))}
             <button onClick={addItem} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:border-indigo-600 hover:text-indigo-600 transition-all">+ Add Service Item</button>
          </div>
        </section>

        <section className="flex justify-end pt-8">
           <div className="w-full max-w-sm bg-slate-900 p-8 rounded-[2rem] text-white shadow-2xl space-y-4">
              <div className="flex justify-between items-center opacity-60"><span className="text-[10px] font-black uppercase tracking-widest">Sub-Total</span><span className="text-sm font-black">₹{totals.subTotal.toLocaleString()}</span></div>
              <div className="flex justify-between items-center border-t border-white/10 pt-4"><span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">Grand Total</span><span className="text-2xl font-black">₹{totals.grandTotal.toLocaleString()}</span></div>
           </div>
        </section>
      </div>
    </div>
  );
};

export default AddInvoice;
