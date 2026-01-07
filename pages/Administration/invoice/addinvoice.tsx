
import React, { useState, useEffect, useMemo } from 'react';
import { Client, InvoiceRecord, InvoiceLineItem, InvoiceSettings } from '../../../types';
import { api } from '../../../services/api';
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
      try {
        const [clis, nextNoData, sets] = await Promise.all([
          api.get('/clients'),
          api.get('/invoices/next-number'),
          api.get('/settings/invoice')
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
          setInvDate(editingInvoice.date);
          setItems(editingInvoice.items);
          setStatus(editingInvoice.status);
        } else {
          setInvoiceNo(nextNoData.nextNo);
        }
      } catch (err) {}
      setIsLoading(false);
    };
    init();
  }, [editingInvoice]);

  const totals = useMemo(() => {
    const subTotal = items.reduce((acc, item) => acc + (item.rate * item.quantity), 0);
    const totalTax = settings?.isGstEnabled 
      ? items.reduce((acc, item) => acc + ((item.rate * item.quantity) * (item.taxRate / 100)), 0)
      : 0;
    return { subTotal, totalTax, grandTotal: subTotal + totalTax };
  }, [items, settings]);

  const handleSave = async () => {
    if (!clientLegalName) return alert('Specify client');
    try {
      await api.post('/invoices', {
        id: editingInvoice?.id || (editingInvoice as any)?._id,
        clientId: isMiscClient ? 'misc' : selectedClientId,
        clientName: clientLegalName,
        invoiceNo,
        date: invDate,
        items,
        subTotal: totals.subTotal,
        totalTax: totals.totalTax,
        totalAmount: totals.grandTotal,
        status
      });
      onBack();
    } catch (e) {}
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-6 max-w-5xl mx-auto w-full overflow-hidden pb-10">
      <div className="flex items-center justify-between bg-white p-4 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
         <div className="flex items-center gap-4">
            <button onClick={onBack} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400">
               <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <h2 className="text-xl font-black uppercase">{editingInvoice ? 'Edit' : 'New'} Invoice</h2>
         </div>
         <button onClick={handleSave} className="bg-indigo-600 text-white font-black uppercase tracking-widest px-8 h-11 rounded-xl">Save Bill</button>
      </div>
      <div className="bg-white rounded-[2.5rem] p-10 flex-1 overflow-y-auto border border-slate-200">
          {/* Form Content */}
          <div className="grid grid-cols-2 gap-8">
              <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Invoice Number</label>
                  <input readOnly value={invoiceNo} className="w-full bg-slate-50 p-4 rounded-xl font-black" />
              </div>
              <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Client Name</label>
                  <input value={clientLegalName} onChange={e => setClientLegalName(e.target.value)} className="w-full bg-slate-50 p-4 rounded-xl font-black uppercase" />
              </div>
          </div>
      </div>
    </div>
  );
};

export default AddInvoice;
