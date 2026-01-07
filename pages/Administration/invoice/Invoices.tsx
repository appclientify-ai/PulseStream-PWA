
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { InvoiceRecord, Client, InvoiceSettings } from '../../../types';
import { mockBackend } from '../../../services/mockBackend';
import Loader from '../../../components/Loader';

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

  // Settlement Modal States
  const [settlingInvoice, setSettlingInvoice] = useState<InvoiceRecord | null>(null);
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMode, setPayMode] = useState<'Cash' | 'Online' | 'Cheque' | 'UPI'>('Online');
  const [chequeNo, setChequeNo] = useState('');

  // PDF Preview State
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceRecord | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchAll = async () => {
    setIsLoading(true);
    const [invs, sets] = await Promise.all([
      mockBackend.getInvoices(),
      mockBackend.getInvoiceSettings()
    ]);
    setInvoices(invs);
    setSettings(sets);
    setIsLoading(false);
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
    await mockBackend.migrateToPayment(settlingInvoice.id, {
      date: payDate,
      mode: payMode,
      chequeNo: payMode === 'Cheque' ? chequeNo : undefined
    });
    setSettlingInvoice(null);
    fetchAll();
  };

  const handleWhatsApp = (inv: InvoiceRecord) => {
    const text = `*Invoice from ${settings?.firmName || 'Vault'}*\n\nInv No: ${inv.invoiceNo}\nDate: ${inv.date.split('-').reverse().join('-')}\nAmount: ₹${inv.totalAmount.toLocaleString()}\nDue Date: ${inv.dueDate.split('-').reverse().join('-')}\n\nKindly settle the same. Thank you!`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const windowUrl = 'about:blank';
    const printWindow = window.open(windowUrl, '_blank', 'width=800,height=900');

    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice - ${previewInvoice?.invoiceNo}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                body { padding: 0; margin: 0; }
                .no-print { display: none; }
                .print-container { width: 100%; border: none; box-shadow: none; padding: 40px !important; }
              }
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            </style>
          </head>
          <body onload="setTimeout(() => { window.print(); window.close(); }, 500)">
            <div class="print-container">${printContent.innerHTML}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 max-w-full mx-auto w-full overflow-hidden pb-10">
      
      {/* Header Toolbar */}
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
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="h-11 px-4 flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:bg-slate-100">
               Filter: {statusFilter} <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-1 animate-in zoom-in-95">
                {['All', 'Pending', 'Sent'].map(f => (
                  <button key={f} onClick={() => { setStatusFilter(f as any); setIsFilterOpen(false); }} className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase rounded-lg ${statusFilter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{f}</button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => onViewChange?.('admin-invoice-setting')} className="h-11 w-11 flex items-center justify-center bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all shadow-sm">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
          <button onClick={() => onViewChange?.('admin-add-invoice')} className="bg-indigo-600 text-white font-black uppercase tracking-widest px-8 h-11 rounded-xl shadow-lg hover:bg-slate-900 transition-all text-xs flex items-center gap-2 shrink-0">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            Create Invoice
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse table-fixed min-w-[1300px]">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[60px]">S.No.</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[140px]">Inv. No.</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[120px]">Date</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[240px]">Client</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[180px]">Service</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[140px]">Amount</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[140px]">Due Date</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center w-[140px]">Status</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right w-[180px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr><td colSpan={9} className="py-32 text-center text-slate-300 font-black uppercase tracking-widest text-sm">No billing records found</td></tr>
              ) : (
                filteredInvoices.map((inv, idx) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-6 py-6 text-slate-300 font-black text-[12px]">{idx + 1}</td>
                    <td className="px-6 py-6 font-black text-slate-900 text-[12px] uppercase">{inv.invoiceNo}</td>
                    <td className="px-6 py-6 font-bold text-slate-500 text-[11px] uppercase">{inv.date.split('-').reverse().join('-')}</td>
                    <td className="px-6 py-6 font-black text-slate-700 text-[12px] uppercase truncate">{inv.clientName}</td>
                    <td className="px-6 py-6 text-[11px] font-bold text-slate-400 truncate uppercase">
                      {inv.items?.[0]?.description} {inv.items?.length > 1 ? `(+${inv.items.length - 1})` : ''}
                    </td>
                    <td className="px-6 py-6 font-black text-indigo-600 text-[12px]">₹{inv.totalAmount.toLocaleString()}</td>
                    <td className="px-6 py-6">
                       <p className="text-[11px] font-black text-slate-700 uppercase">{inv.dueDate.split('-').reverse().join('-')}</p>
                    </td>
                    <td className="px-6 py-6 text-center">
                       <select 
                         value={inv.status} 
                         onChange={(e) => {
                           if (e.target.value === 'Paid') {
                             setSettlingInvoice(inv);
                           } else {
                             mockBackend.saveInvoice({...inv, status: e.target.value as any}).then(fetchAll);
                           }
                         }}
                         className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all cursor-pointer ${
                           inv.status === 'Sent' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                         }`}
                       >
                         <option value="Draft">Draft</option>
                         <option value="Sent">Sent</option>
                         <option value="Paid">Receive</option>
                       </select>
                    </td>
                    <td className="px-6 py-6 text-right whitespace-nowrap">
                       <div className="flex items-center justify-end gap-2">
                          <button onClick={() => onViewChange?.('admin-add-invoice', inv)} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center shadow-sm" title="Edit Invoice">
                             <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button onClick={() => setPreviewInvoice(inv)} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center shadow-sm" title="View & Print PDF">
                             <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                          </button>
                          <button onClick={() => handleWhatsApp(inv)} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-emerald-600 transition-all flex items-center justify-center shadow-sm" title="Send via WhatsApp">
                             <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                          </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settlement Modal */}
      {settlingInvoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
           <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 space-y-6">
              <h3 className="text-xl font-black text-slate-900 uppercase">Receive Payment</h3>
              <div className="space-y-4">
                 <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold" />
                 <select value={payMode} onChange={e => setPayMode(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold">
                    <option value="Online">Online Transfer</option>
                    <option value="UPI">UPI / QR</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                 </select>
                 {/* Fixed typo in state setter name: setCheckNo changed to setChequeNo. */}
                 {payMode === 'Cheque' && <input value={chequeNo} onChange={e => setChequeNo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black" placeholder="Cheque No." />}
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setSettlingInvoice(null)} className="flex-1 py-4 text-slate-500 font-black uppercase text-[10px]">Cancel</button>
                 <button onClick={handleReceiveConfirm} className="flex-[2] py-4 bg-emerald-600 text-white font-black uppercase text-[10px] rounded-xl shadow-lg">Confirm</button>
              </div>
           </div>
        </div>
      )}

      {/* PDF PREVIEW MODAL */}
      {previewInvoice && settings && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto">
           <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-4xl relative">
              <div className="sticky top-0 p-4 flex justify-end gap-3 z-50 bg-white/80 backdrop-blur border-b border-slate-100 rounded-t-[1.5rem] no-print">
                 <button onClick={handlePrint} className="bg-indigo-600 text-white font-black uppercase text-[10px] px-6 py-2.5 rounded-lg">Print PDF</button>
                 <button onClick={() => setPreviewInvoice(null)} className="bg-slate-100 text-slate-600 font-black uppercase text-[10px] px-6 py-2.5 rounded-lg">Close</button>
              </div>
              
              <div ref={printRef} className="p-16 bg-white text-slate-900 relative print-container">
                 {/* Header Row */}
                 <div className="flex justify-between items-start border-b-2 border-slate-900 pb-10 mb-10">
                    <div className="space-y-4">
                       {settings.firmLogo && <img src={settings.firmLogo} className="h-20 object-contain" alt="Firm Logo" />}
                       <div>
                          <h1 className="text-3xl font-black uppercase tracking-tight">Invoice</h1>
                          <p className="text-slate-500 font-bold uppercase text-sm">{previewInvoice.invoiceNo}</p>
                       </div>
                    </div>
                    <div className="text-right space-y-1 max-w-[400px]">
                       <p className="text-xl font-black uppercase">{settings.firmName}</p>
                       <p className="text-[10px] font-black text-indigo-600 font-mono">GSTIN: {settings.firmGstin}</p>
                       <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase whitespace-pre-wrap">{settings.firmAddress}</p>
                       <p className="text-xs font-black text-slate-800">M: +91 {settings.firmMobile} • {settings.firmEmail}</p>
                    </div>
                 </div>

                 {/* Client Info */}
                 <div className="grid grid-cols-2 gap-20 mb-12">
                    <div>
                       <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2">Bill To:</h4>
                       <p className="text-xl font-black uppercase mb-1">{previewInvoice.clientName}</p>
                       <p className="text-xs font-medium text-slate-500 leading-relaxed whitespace-pre-wrap">{previewInvoice.miscAddress || 'Registered Office'}</p>
                    </div>
                    <div className="text-right">
                       <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2">Invoice Details:</h4>
                       <p className="text-xs font-bold"><span className="text-slate-400">Date:</span> {previewInvoice.date.split('-').reverse().join('-')}</p>
                       <p className="text-xs font-bold"><span className="text-slate-400">Due:</span> {previewInvoice.dueDate.split('-').reverse().join('-')}</p>
                    </div>
                 </div>

                 {/* Table */}
                 <table className="w-full mb-12">
                    <thead>
                       <tr className="bg-slate-900 text-white">
                          <th className="px-4 py-3 text-[10px] font-black uppercase text-left">Description</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase text-right w-[80px]">Qty</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase text-right w-[120px]">Rate</th>
                          {settings.isGstEnabled && <th className="px-4 py-3 text-[10px] font-black uppercase text-right w-[80px]">GST %</th>}
                          <th className="px-4 py-3 text-[10px] font-black uppercase text-right w-[120px]">Amount</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 border-b border-slate-200">
                       {previewInvoice.items.map((item, i) => (
                          <tr key={i}>
                             <td className="px-4 py-5 text-sm font-black uppercase">{item.description}</td>
                             <td className="px-4 py-5 text-sm font-bold text-right">{item.quantity}</td>
                             <td className="px-4 py-5 text-sm font-bold text-right">₹{item.rate.toLocaleString()}</td>
                             {settings.isGstEnabled && <td className="px-4 py-5 text-sm font-bold text-right">{item.taxRate}%</td>}
                             <td className="px-4 py-5 text-sm font-black text-right">₹{item.amount.toLocaleString()}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>

                 {/* Summary */}
                 <div className="flex justify-between items-start mb-20">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 max-w-sm">
                       <h4 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Payment Info:</h4>
                       <div className="space-y-1 mb-4 text-[11px] font-bold">
                          <p>{settings.bankName}</p>
                          <p>A/c: {settings.accountNo}</p>
                          <p className="uppercase">IFSC: {settings.ifsc}</p>
                       </div>
                    </div>
                    <div className="text-right space-y-3 w-64">
                       <div className="flex justify-between text-slate-500 font-bold text-xs uppercase"><p>Subtotal</p><p>₹{previewInvoice.subTotal.toLocaleString()}</p></div>
                       {settings.isGstEnabled && <div className="flex justify-between text-slate-500 font-bold text-xs uppercase border-b border-slate-100 pb-3"><p>Tax (GST)</p><p>₹{previewInvoice.totalTax.toLocaleString()}</p></div>}
                       <div className="flex justify-between text-2xl font-black uppercase pt-1 text-slate-900"><p>Total Due</p><p>₹{previewInvoice.totalAmount.toLocaleString()}</p></div>
                    </div>
                 </div>

                 {/* Footer */}
                 <div className="flex justify-between items-end">
                    <div className="max-w-md">
                       <p className="text-[10px] font-medium text-slate-400 leading-relaxed whitespace-pre-wrap">{settings.terms}</p>
                    </div>
                    <div className="text-right">
                       {settings.firmSignature && <img src={settings.firmSignature} className="h-16 ml-auto mb-2 opacity-90 mix-blend-multiply" alt="Signature" />}
                       <p className="text-[10px] font-black uppercase border-t border-slate-900 pt-2 px-4">Authorized Signatory</p>
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
