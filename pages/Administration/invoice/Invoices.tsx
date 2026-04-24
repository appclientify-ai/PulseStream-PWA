
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { InvoiceRecord, Client, InvoiceSettings } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';
import { QRCodeSVG } from 'qrcode.react';

interface InvoicesProps {
  onViewChange?: (view: string, extra?: any) => void;
}

const Invoices: React.FC<InvoicesProps> = ({ onViewChange }) => {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Sent'>('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);

  const [settlingInvoice, setSettlingInvoice] = useState<InvoiceRecord | null>(null);
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMode, setPayMode] = useState<'Cash' | 'Online' | 'Cheque' | 'UPI'>('Online');
  const [chequeNo, setChequeNo] = useState('');

  const [previewInvoice, setPreviewInvoice] = useState<InvoiceRecord | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [invs, sets] = await Promise.all([
        api.getInvoices(),
        api.getInvoiceSettings()
      ]);
      setInvoices(invs);
      setSettings(sets);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const filteredInvoices = useMemo(() => {
    const s = search.toLowerCase();
    let list = invoices.filter(i => 
      i.invoiceNo.toLowerCase().includes(s) || 
      i.clientName.toLowerCase().includes(s)
    ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (statusFilter !== 'All') {
      list = list.filter(i => i.status === statusFilter);
    }
    return list;
  }, [invoices, search, statusFilter]);

  const handleReceiveConfirm = async () => {
    if (!settlingInvoice) return;
    await api.migrateToPayment(settlingInvoice.id, {
      date: payDate,
      mode: payMode,
      chequeNo: payMode === 'Cheque' ? chequeNo : undefined
    });
    setSettlingInvoice(null);
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      await api.deleteInvoice(id);
      fetchAll();
    }
  };

  const handleEdit = (invoice: InvoiceRecord) => {
     onViewChange?.('admin-add-invoice', invoice);
  };

  const handleWhatsApp = (inv: InvoiceRecord) => {
    const text = `*Invoice from ${settings?.firmName || 'Vault'}*\n\nInv No: ${inv.invoiceNo}\nDate: ${inv.date.split('-').reverse().join('-')}\nAmount: ₹${inv.totalAmount.toLocaleString()}\nDue Date: ${inv.dueDate.split('-').reverse().join('-')}\n\nKindly settle the same. Thank you!`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const printWindow = window.open('about:blank', '_blank', 'width=800,height=900');
    if (printWindow) {
      printWindow.document.write(`
        <html><head><title>Invoice - ${previewInvoice?.invoiceNo}</title><script src="https://cdn.tailwindcss.com"></script></head>
        <body onload="setTimeout(() => { window.print(); window.close(); }, 500)">
          <div class="p-10">${printContent.innerHTML}</div>
        </body></html>
      `);
      printWindow.document.close();
    }
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 max-w-full mx-auto w-full overflow-hidden pb-10">
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Bills</p>
            <p className="text-xl font-black text-slate-900 leading-none">{invoices.length}</p>
          </div>
        </div>
        <div className="relative flex-1 group w-full">
          <input type="text" placeholder="Search by Invoice No or Client..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onViewChange?.('admin-invoicesetting')} className="bg-slate-100 text-slate-600 font-black uppercase tracking-widest px-6 h-11 rounded-xl hover:bg-slate-200 transition-all text-[10px] flex items-center gap-2 shrink-0">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Settings
          </button>
          <button onClick={() => onViewChange?.('admin-add-invoice')} className="bg-indigo-600 text-white font-black uppercase tracking-widest px-8 h-11 rounded-xl shadow-lg hover:bg-slate-900 transition-all text-xs flex items-center gap-2 shrink-0">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            Create Invoice
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse table-auto overflow-hidden min-w-[1300px]">
            <thead className="whitespace-nowrap sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="whitespace-nowrap px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[60px]">S.No.</th>
                <th className="whitespace-nowrap px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[140px]">Inv. No.</th>
                <th className="whitespace-nowrap px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[120px]">Date</th>
                <th className="whitespace-nowrap px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[240px]">Client</th>
                <th className="whitespace-nowrap px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[140px]">Amount</th>
                <th className="whitespace-nowrap px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center w-[140px]">Status</th>
                <th className="whitespace-nowrap px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right w-[180px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv, idx) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="whitespace-nowrap px-6 py-6 text-slate-300 font-black text-[12px]">{idx + 1}</td>
                  <td className="whitespace-nowrap px-6 py-6 font-black text-slate-900 text-[12px] uppercase">{inv.invoiceNo}</td>
                  <td className="whitespace-nowrap px-6 py-6 font-bold text-slate-500 text-[11px] uppercase">{inv.date.split('-').reverse().join('-')}</td>
                  <td className="whitespace-nowrap px-6 py-6 font-black text-slate-700 text-[12px] uppercase truncate">{inv.clientName}</td>
                  <td className="whitespace-nowrap px-6 py-6 font-black text-indigo-600 text-[12px]">₹{inv.totalAmount.toLocaleString()}</td>
                  <td className="whitespace-nowrap px-6 py-6 text-center">
                     <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${inv.status === 'Sent' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-400'}`}>{inv.status}</span>
                  </td>
                  <td className="px-6 py-6 text-right whitespace-nowrap">
                     <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(inv)} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-blue-600 transition-all flex items-center justify-center shadow-sm" title="Edit Invoice">
                           <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => setPreviewInvoice(inv)} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center shadow-sm" title="Preview Invoice">
                           <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <button onClick={() => handleWhatsApp(inv)} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-emerald-600 transition-all flex items-center justify-center shadow-sm" title="Share on WhatsApp">
                           <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                        </button>
                        <button onClick={() => handleDelete(inv.id)} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-red-600 transition-all flex items-center justify-center shadow-sm" title="Delete Invoice">
                           <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Preview Modal */}
      {previewInvoice && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                 <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Invoice Preview</h3>
                 <div className="flex gap-2">
                    <button onClick={handlePrint} className="h-10 px-6 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 transition-all shadow-lg flex items-center gap-2">
                       <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                       Print
                    </button>
                    <button onClick={() => setPreviewInvoice(null)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-colors">
                       <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 bg-white" ref={printRef}>
                 {/* Printable Content */}
                 <div className="space-y-8">
                    <div className="flex justify-between items-start">
                       <div className="flex gap-4 items-start">
                          {settings?.firmLogo && (
                            <img src={settings.firmLogo} alt="Logo" className="h-16 w-auto object-contain" />
                          )}
                          <div>
                             <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">{settings?.firmName || 'Your Firm Name'}</h1>
                             <p className="text-xs font-bold text-slate-500 uppercase mt-1 max-w-xs whitespace-pre-wrap">{settings?.firmAddress || 'Firm Address'}</p>
                             <p className="text-xs font-bold text-slate-500 uppercase mt-1">GSTIN: {settings?.firmGstin || 'N/A'}</p>
                             <p className="text-xs font-bold text-slate-500 uppercase">Contact: {settings?.firmMobile || 'N/A'}</p>
                             <p className="text-xs font-bold text-slate-500 uppercase">Email: {settings?.firmEmail || 'N/A'}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <h2 className="text-4xl font-black text-slate-200 uppercase tracking-tighter">Invoice</h2>
                          <div className="mt-4 space-y-1">
                             <p className="text-xs font-bold text-slate-500 uppercase">Invoice No: <span className="text-slate-900">{previewInvoice.invoiceNo}</span></p>
                             <p className="text-xs font-bold text-slate-500 uppercase">Date: <span className="text-slate-900">{previewInvoice.date.split('-').reverse().join('-')}</span></p>
                             <p className="text-xs font-bold text-slate-500 uppercase">Due Date: <span className="text-slate-900">{previewInvoice.dueDate.split('-').reverse().join('-')}</span></p>
                          </div>
                       </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Bill To</p>
                       <h3 className="text-lg font-black uppercase text-slate-900">{previewInvoice.clientName}</h3>
                       {previewInvoice.miscAddress && <p className="text-xs font-bold text-slate-500 uppercase mt-1">{previewInvoice.miscAddress}</p>}
                       <p className="text-xs font-bold text-slate-500 uppercase mt-1">Mobile: {previewInvoice.miscMobile || 'N/A'}</p>
                    </div>

                    <table className="w-full text-left border-collapse">
                       <thead>
                          <tr className="border-b-2 border-slate-900">
                             <th className="whitespace-nowrap py-3 text-[10px] font-black uppercase text-slate-900 tracking-widest w-12 text-center">#</th>
                             <th className="whitespace-nowrap py-3 text-[10px] font-black uppercase text-slate-900 tracking-widest">Description</th>
                             <th className="whitespace-nowrap py-3 text-[10px] font-black uppercase text-slate-900 tracking-widest w-24 text-right">Rate</th>
                             <th className="whitespace-nowrap py-3 text-[10px] font-black uppercase text-slate-900 tracking-widest w-16 text-center">Qty</th>
                             <th className="whitespace-nowrap py-3 text-[10px] font-black uppercase text-slate-900 tracking-widest w-16 text-center">GST</th>
                             <th className="whitespace-nowrap py-3 text-[10px] font-black uppercase text-slate-900 tracking-widest w-32 text-right">Amount</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {previewInvoice.items.map((item, i) => (
                             <tr key={i}>
                                <td className="whitespace-nowrap py-4 text-center text-xs font-bold text-slate-500">{i + 1}</td>
                                <td className="whitespace-nowrap py-4 text-xs font-bold text-slate-700">{item.description}</td>
                                <td className="whitespace-nowrap py-4 text-right text-xs font-bold text-slate-700">₹{item.rate}</td>
                                <td className="whitespace-nowrap py-4 text-center text-xs font-bold text-slate-700">{item.quantity}</td>
                                <td className="whitespace-nowrap py-4 text-center text-xs font-bold text-slate-700">{settings?.isGstEnabled ? `${item.taxRate}%` : 'N/A'}</td>
                                <td className="whitespace-nowrap py-4 text-right text-xs font-bold text-slate-900">₹{(item.rate * item.quantity).toLocaleString()}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>

                    <div className="flex justify-end">
                       <div className="w-64 space-y-3">
                          <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                             <span>Sub Total</span>
                             <span>₹{previewInvoice.subTotal.toLocaleString()}</span>
                          </div>
                          {settings?.isGstEnabled && (
                             <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                                <span>Total Tax</span>
                                <span>₹{previewInvoice.totalTax.toLocaleString()}</span>
                             </div>
                          )}
                          <div className="h-px bg-slate-200" />
                          <div className="flex justify-between text-lg font-black text-slate-900 uppercase">
                             <span>Grand Total</span>
                             <span>₹{previewInvoice.totalAmount.toLocaleString()}</span>
                          </div>
                       </div>
                    </div>

                    <div className="pt-12 border-t border-slate-100">
                       <div className="flex justify-between items-end">
                          <div className="flex gap-8">
                             {settings?.upiId && (
                               <div className="flex flex-col items-center gap-2">
                                 <QRCodeSVG value={`upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.firmName)}&am=${previewInvoice.totalAmount}&cu=INR&tn=Invoice ${previewInvoice.invoiceNo}`} size={80} />
                                 <span className="text-[9px] font-black uppercase text-slate-500">Scan to Pay</span>
                               </div>
                             )}
                             {settings?.whatsappNumber && (
                               <div className="flex flex-col items-center gap-2">
                                 <QRCodeSVG value={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(`Hello, regarding invoice ${previewInvoice.invoiceNo}`)}`} size={80} />
                                 <span className="text-[9px] font-black uppercase text-slate-500">WhatsApp Us</span>
                               </div>
                             )}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase max-w-xs whitespace-pre-wrap">
                             <p>Terms & Conditions:</p>
                             <p className="mt-1">{settings?.terms || '1. Payment is due within 15 days.\n2. Please quote invoice number in all correspondence.'}</p>
                          </div>
                          <div className="text-center flex flex-col items-center">
                             {settings?.firmSignature ? (
                               <img src={settings.firmSignature} alt="Signature" className="h-16 object-contain mb-2" />
                             ) : (
                               <div className="h-16 mb-2" />
                             )}
                             <p className="text-[10px] font-black uppercase text-slate-900">Authorized Signatory</p>
                             <p className="text-[9px] font-bold uppercase text-slate-400">{settings?.firmName}</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
