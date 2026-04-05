import React, { useState, useEffect, useMemo } from 'react';
import { Client, InvoiceRecord, InvoiceLineItem, InvoiceSettings } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';
import { toast } from 'sonner';


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
    if (!clientLegalName) return toast.success('Specify a billing entity.');
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
          <div className="flex items-center justify-between mb-6">
             <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">Billing Target</h4>
             <div className="h-px flex-1 bg-slate-100 ml-4" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-8 relative">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block ml-1">Lookup Master Vault</label>
              <div className="relative">
                 <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black outline-none focus:ring-4 focus:ring-indigo-50 transition-all pl-12"
                    placeholder="Search Client Name or GSTIN..." 
                    value={searchQuery} 
                    onChange={e => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }} 
                 />
                 <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              
              {isDropdownOpen && filteredClients.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-2 overflow-hidden max-h-60 overflow-y-auto no-scrollbar">
                  {filteredClients.map(c => (
                    <button key={c.id} onClick={() => handleClientSelect(c)} className="w-full text-left px-4 py-3 hover:bg-indigo-50 rounded-xl transition-all group">
                      <p className="text-xs font-black text-slate-900 uppercase group-hover:text-indigo-700">{c.legalName}</p>
                      <p className="text-[10px] text-slate-400 font-mono uppercase">{c.gstProfile?.gstin || c.itProfile?.pan || 'NO ID'}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Client Details Card */}
              {clientLegalName && (
                 <div className="mt-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-top-4">
                    <div className="flex-1">
                       <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">Billed To</p>
                       <p className="text-sm font-black text-slate-900 uppercase">{clientLegalName}</p>
                       {clientAddress && <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase leading-relaxed">{clientAddress}</p>}
                    </div>
                    <div className="flex flex-col gap-3 min-w-[150px]">
                       <div>
                          <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">GSTIN / PAN</p>
                          <p className="text-xs font-mono font-bold text-slate-700 uppercase">{clientGstin || 'N/A'}</p>
                       </div>
                       <div>
                          <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">Contact</p>
                          <p className="text-xs font-bold text-slate-700 uppercase">{clientMobile || 'N/A'}</p>
                       </div>
                    </div>
                 </div>
              )}
            </div>
            
            <div className="md:col-span-4">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block ml-1">Invoice Date</label>
               <div className="relative">
                  <input type="date" value={invDate} onChange={e => setInvDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black outline-none focus:ring-4 focus:ring-indigo-50 transition-all" />
               </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
             <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">Services Description</h4>
             <div className="h-px flex-1 bg-slate-100 ml-4" />
          </div>
          
          <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="border-b border-slate-200 bg-slate-100/50">
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest w-12 text-center">#</th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Service Details</th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest w-32 text-right">Rate</th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest w-24 text-center">Qty</th>
                      {settings?.isGstEnabled && (
                        <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest w-24 text-center">GST %</th>
                      )}
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest w-40 text-right">Amount</th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest w-16 text-center">Action</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {items.map((item, idx) => (
                     <tr key={item.id} className="group hover:bg-white transition-colors">
                        <td className="p-4 text-center font-black text-slate-300 text-xs">{idx + 1}</td>
                        <td className="p-4">
                           <input 
                              className="w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 p-2 text-xs font-bold outline-none placeholder:text-slate-300 transition-all text-slate-700"
                              value={item.description} 
                              onChange={e => updateItem(item.id, 'description', e.target.value)} 
                              placeholder="Enter service description..." 
                           />
                        </td>
                        <td className="p-4">
                           <input 
                              type="number" 
                              className="w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 p-2 text-xs font-black outline-none text-right placeholder:text-slate-300 transition-all text-slate-700"
                              value={item.rate} 
                              onChange={e => updateItem(item.id, 'rate', Number(e.target.value))} 
                              placeholder="0.00" 
                           />
                        </td>
                        <td className="p-4">
                           <input 
                              type="number" 
                              className="w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 p-2 text-xs font-black outline-none text-center placeholder:text-slate-300 transition-all text-slate-700"
                              value={item.quantity} 
                              onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))} 
                              placeholder="1" 
                           />
                        </td>
                        {settings?.isGstEnabled && (
                           <td className="p-4">
                              <select
                                 className="w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 p-2 text-xs font-black outline-none text-center text-slate-700 cursor-pointer appearance-none"
                                 value={item.taxRate}
                                 onChange={e => updateItem(item.id, 'taxRate', Number(e.target.value))}
                              >
                                 {TAX_RATES.map(rate => (
                                    <option key={rate} value={rate}>{rate}%</option>
                                 ))}
                              </select>
                           </td>
                        )}
                        <td className="p-4 text-right font-black text-slate-900 text-xs">
                           ₹{(item.rate * item.quantity).toLocaleString()}
                        </td>
                        <td className="p-4 text-center">
                           <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                           </button>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
             <button onClick={addItem} className="w-full py-4 bg-slate-50 hover:bg-indigo-50 border-t border-slate-200 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                Add Service Item
             </button>
          </div>
        </section>

        <section className="flex justify-end pt-8">
           <div className="w-full max-w-sm bg-slate-900 p-8 rounded-[2rem] text-white shadow-2xl space-y-6">
              <div className="space-y-3">
                 <div className="flex justify-between items-center opacity-70">
                    <span className="text-[10px] font-black uppercase tracking-widest">Sub-Total</span>
                    <span className="text-sm font-black font-mono">₹{totals.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                 </div>
                 {settings?.isGstEnabled && (
                    <div className="flex justify-between items-center opacity-70">
                       <span className="text-[10px] font-black uppercase tracking-widest">Total Tax (GST)</span>
                       <span className="text-sm font-black font-mono">₹{totals.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                 )}
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex justify-between items-center pt-2">
                 <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">Grand Total</span>
                 <span className="text-3xl font-black font-mono tracking-tight">₹{totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="pt-4">
                 <p className="text-[9px] text-center opacity-40 uppercase tracking-widest">Amount in Words</p>
                 {/* Placeholder for amount in words if needed, or just a nice footer */}
                 <p className="text-[10px] text-center font-bold opacity-60 mt-1">Authorized Signature Required</p>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};

export default AddInvoice;
