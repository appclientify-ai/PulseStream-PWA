
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PaymentRecord, Client, InvoiceSettings, InvoiceRecord } from '../../../types';
import html2pdf from 'html2pdf.js';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';

interface PaymentReceivedProps {
  onViewChange?: (view: string, extra?: any) => void;
}

const PaymentReceived: React.FC<PaymentReceivedProps> = ({ onViewChange }) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const handleDelete = async (id: string) => { if(confirm('Delete payment record?')) { await api.deletePayment(id); fetchAll(); } };
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [previewPayment, setPreviewPayment] = useState<{pay: PaymentRecord, inv: InvoiceRecord} | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [pays, sets, invs] = await Promise.all([api.getPayments(), api.getInvoiceSettings(), api.getInvoices()]);
      setPayments(pays);
      setSettings(sets);
      setInvoices(invs);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const filteredPayments = useMemo(() => {
    const s = search.toLowerCase();
    return payments.filter(p => 
      p.clientName.toLowerCase().includes(s) || (p.clientTradeName && p.clientTradeName.toLowerCase().includes(s)) || 
      (p.referenceNo && p.referenceNo.toLowerCase().includes(s)) ||
      (p.invoiceNo && p.invoiceNo.toLowerCase().includes(s))
    ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payments, search]);

  
  const handlePrintPayment = (pay: PaymentRecord) => {
    const inv = invoices.find(i => i.invoiceNo === pay.invoiceNo);
    if (!inv) {
      toast.error("Original invoice details not found.");
      return;
    }
    setPreviewPayment({ pay, inv });
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!previewPayment || !printContent) return;
    const printWindow = window.open('about:blank', '_blank', 'width=800,height=900');
    if (printWindow) {
      printWindow.document.write(`
        <html>
        <head>
          <title>Receipt - ${previewPayment.inv.invoiceNo}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
              thead { display: table-header-group; }
              tfoot { display: table-footer-group; }
              @page { margin: 10mm; }
            }
          </style>
        </head>
        <body onload="setTimeout(() => { window.print(); window.close(); }, 800)">
          <div class="p-4 sm:p-10 max-w-5xl mx-auto">${printContent.innerHTML}</div>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleWhatsAppShare = () => {
    if (!previewPayment || !printRef.current) return;
    const { pay, inv } = previewPayment;
    const opt = {
      margin: 10,
      filename: `PaymentReceipt_${inv.invoiceNo}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    const modeStr = pay.mode === 'Cheque' && pay.chequeNo ? `Cheque (${pay.chequeNo})` : pay.mode;
    const text = `*Payment Receipt from ${settings?.firmName || 'Vault'}*\n\nInv No: ${inv.invoiceNo}\nAmount Paid: ₹${pay.amount.toLocaleString()}\nPayment Mode: ${modeStr}\nDate: ${pay.date.split('-').reverse().join('-')}\n\nThank you for your payment!`;
    
    html2pdf().from(printRef.current).set(opt).output('blob').then(async (pdfBlob: Blob) => {
      const file = new File([pdfBlob], opt.filename, { type: 'application/pdf' });
      const nav = navigator;
      if (nav.canShare && nav.canShare({ files: [file] })) {
        try {
          await nav.share({ title: 'Payment Receipt', text: text, files: [file] });
          return;
        } catch (e) {
          console.error('Share failed', e);
        }
      }
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = opt.filename;
      a.click();
      window.URL.revokeObjectURL(url);
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    });
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 max-w-full mx-auto w-full overflow-hidden pb-10">
      <div className="flex items-center gap-6 border-b border-slate-200 shrink-0 mb-2">
        <button className="pb-3 border-b-2 border-indigo-600 text-indigo-600 font-black uppercase tracking-widest text-[11px]">
          Payment History
        </button>
      </div>
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Online/NEFT</p>
            <p className="text-xl font-black text-slate-900 leading-none">{filteredPayments.filter(p => p.mode === 'Online').length}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">UPI</p>
            <p className="text-xl font-black text-slate-900 leading-none">{filteredPayments.filter(p => p.mode === 'UPI').length}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cash</p>
            <p className="text-xl font-black text-slate-900 leading-none">{filteredPayments.filter(p => p.mode === 'Cash').length}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cheque</p>
            <p className="text-xl font-black text-slate-900 leading-none">{filteredPayments.filter(p => p.mode === 'Cheque').length}</p>
          </div>
        </div>

        <div className="relative flex-1 group w-full">
          <input type="text" placeholder="Search Client, Inv No or Ref..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600/10 outline-none" />
        </div>
      </div>
      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse table-auto overflow-hidden min-w-full">
            <thead className=" sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">S.No.</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Inv. No.</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Client (Trade/Legal)</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Payment Date</th>
                <th className=" px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Mode</th><th className=" px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Ref No.</th>
<th className=" px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map((pay, idx) => (
                <tr key={pay.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className=" px-6 py-6 text-slate-300 font-black text-[12px]">{idx + 1}</td>
                  <td className=" px-6 py-6 font-black text-slate-400 text-[11px] uppercase">{pay.invoiceNo || '---'}</td>
                  <td className=" px-6 py-6 font-black text-slate-900 text-[12px] uppercase truncate">{pay.clientTradeName ? `${pay.clientTradeName} (${pay.clientName})` : pay.clientName}</td>
                  <td className=" px-6 py-6 font-black text-emerald-600 text-[12px]">₹{pay.amount.toLocaleString()}</td>
                  <td className=" px-6 py-6 font-black text-slate-700 text-[11px] uppercase">{pay.date.split('-').reverse().join('-')}</td>
                  <td className=" px-4 py-6">
                    <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase bg-slate-100 text-slate-600">{pay.mode}</span>
                  </td>
                  <td className=" px-4 py-6 font-bold text-slate-500 text-[11px] uppercase">
                    {pay.chequeNo || pay.referenceNo || '---'}
                  </td>
                  <td className="px-4 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
      <button onClick={() => handlePrintPayment(pay)} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center shadow-sm" title="View/Print Receipt">
         <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 12z" /></svg>
      </button>
      <button onClick={() => handleDelete(pay.id)} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-red-600 transition-all flex items-center justify-center shadow-sm" title="Delete Payment">
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
      {/* Receipt Modal */}
      {previewPayment && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                 <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Payment Receipt</h3>
                 <div className="flex gap-2">
                    <button onClick={handleWhatsAppShare} className="h-10 px-6 bg-emerald-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 transition-all shadow-lg flex items-center gap-2">
                       <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                       WhatsApp
                    </button>
                    <button onClick={handlePrint} className="h-10 px-6 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 transition-all shadow-lg flex items-center gap-2">
                       <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                       Print
                    </button>
                    <button onClick={() => setPreviewPayment(null)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-colors">
                       <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 bg-white" ref={printRef}>
                 <div className="space-y-8 relative">
                    
                    <div className="flex justify-between items-start">
                       <div className="flex flex-col gap-4">
                          {settings?.firmLogo && (
                            <div><img src={settings.firmLogo} alt="Logo" className="h-20 w-auto object-contain" /></div>
                          )}
                          <div>
                             <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">{settings?.firmName || 'Your Firm Name'}</h1>
                             {settings?.firmServices && <p className="text-[10px] font-black text-indigo-600 uppercase mt-1 tracking-widest">{settings.firmServices}</p>}
                             {settings?.professionType && settings?.registrationNo && <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">{settings.professionType === 'CA' ? 'Membership No: ' : 'Bar Registration No: '}{settings.registrationNo}</p>}
                             {settings?.firmAddress && <p className="text-xs font-bold text-slate-500 uppercase mt-2 max-w-xs whitespace-pre-wrap">{settings.firmAddress}</p>}
                             {settings?.firmGstin && settings.firmGstin.toLowerCase() !== 'n/a' && <p className="text-xs font-bold text-slate-500 uppercase mt-1">GSTIN: {settings.firmGstin}</p>}
                             {settings?.firmMobile && <p className="text-xs font-bold text-slate-500 uppercase">Contact: {settings.firmMobile}</p>}
                             {settings?.firmEmail && <p className="text-xs font-bold text-slate-500 uppercase">Email: {settings.firmEmail}</p>}
                          </div>
                       </div>
                       <div className="text-right z-10 relative">
                          <h2 className="text-4xl font-black text-slate-200 uppercase tracking-tighter">Receipt</h2>
                          <div className="mt-2 inline-block border-2 border-emerald-500 text-emerald-600 px-3 py-1 rounded-lg bg-emerald-50">
                             <p className="text-xl font-black uppercase tracking-widest leading-none">PAID</p>
                          </div>
                          <div className="mt-4 space-y-1">
                             <p className="text-xs font-bold text-emerald-600 uppercase">Payment Mode: <span className="text-emerald-700">{previewPayment.pay.mode === 'Cheque' && previewPayment.pay.chequeNo ? `Cheque (${previewPayment.pay.chequeNo})` : previewPayment.pay.mode}</span></p>
                             <p className="text-xs font-bold text-slate-500 uppercase">Amount Received: <span className="text-slate-900 font-black">₹{previewPayment.pay.amount.toLocaleString()}</span></p>
                             <p className="text-xs font-bold text-slate-500 uppercase">Date: <span className="text-slate-900">{previewPayment.pay.date.split('-').reverse().join('-')}</span></p>
                          </div>
                       </div>
                    </div>
                    
                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 relative z-10">
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Received From</p>
                       <h3 className="text-lg font-black uppercase text-slate-900">{previewPayment.inv.clientName}</h3>{previewPayment.inv.clientTradeName && <p className="text-xs font-bold text-slate-500 uppercase mt-1">{previewPayment.inv.clientTradeName}</p>}
                       {previewPayment.inv.clientGstin && <p className="text-xs font-bold text-slate-500 uppercase mt-1">GSTIN: {previewPayment.inv.clientGstin}</p>}
                       {previewPayment.inv.miscAddress && <p className="text-xs font-bold text-slate-500 uppercase mt-1">{previewPayment.inv.miscAddress}</p>}
                       <p className="text-xs font-bold text-slate-500 uppercase mt-1">Mobile: {previewPayment.inv.miscMobile || 'N/A'}</p>
                       <p className="text-xs font-bold text-slate-500 uppercase mt-1">Against Invoice No: <span className="text-slate-900">{previewPayment.inv.invoiceNo}</span></p>
                    </div>

                    <table className="w-full text-left border-collapse relative z-10">
                       <thead>
                          <tr className="border-b-2 border-slate-900">
                             <th className=" py-3 text-[10px] font-black uppercase text-slate-900 tracking-widest w-12 text-center">#</th>
                             <th className=" py-3 text-[10px] font-black uppercase text-slate-900 tracking-widest">Description</th>
                             <th className=" py-3 text-[10px] font-black uppercase text-slate-900 tracking-widest w-24 text-right">Rate</th>
                             <th className=" py-3 text-[10px] font-black uppercase text-slate-900 tracking-widest w-16 text-center">Qty</th>
                             <th className=" py-3 text-[10px] font-black uppercase text-slate-900 tracking-widest w-16 text-center">GST</th>
                             <th className=" py-3 text-[10px] font-black uppercase text-slate-900 tracking-widest w-32 text-right">Amount</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {previewPayment.inv.items.map((item, i) => (
                             <tr key={i}>
                                <td className=" py-4 text-center text-xs font-bold text-slate-500">{i + 1}</td>
                                <td className=" py-4 text-xs font-bold text-slate-700">{item.description}</td>
                                <td className=" py-4 text-right text-xs font-bold text-slate-700">₹{item.rate}</td>
                                <td className=" py-4 text-center text-xs font-bold text-slate-700">{item.quantity}</td>
                                <td className=" py-4 text-center text-xs font-bold text-slate-700">{settings?.isGstEnabled ? `${item.taxRate}%` : 'N/A'}</td>
                                <td className=" py-4 text-right text-xs font-bold text-slate-900">₹{(item.rate * item.quantity).toLocaleString()}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                    
                    <div className="flex justify-end relative z-10">
                       <div className="w-64 space-y-3">
                          <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                             <span>Sub Total</span>
                             <span>₹{previewPayment.inv.subTotal.toLocaleString()}</span>
                          </div>
                          {settings?.isGstEnabled && (
                             <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                                <span>Total Tax</span>
                                <span>₹{previewPayment.inv.totalTax.toLocaleString()}</span>
                             </div>
                          )}
                          <div className="h-px bg-slate-200" />
                          <div className="flex justify-between text-lg font-black text-slate-900 uppercase">
                             <span>Grand Total</span>
                             <span>₹{previewPayment.inv.totalAmount.toLocaleString()}</span>
                          </div>
                       </div>
                    </div>
                    
                    <div className="pt-8 border-t border-slate-100 mt-8 relative z-10">
                       <div className="flex justify-between items-end">
                          <div className="text-[8px] leading-tight font-bold text-slate-500 uppercase whitespace-pre-wrap max-w-sm">
                             <p className="text-slate-900 font-black mb-1">Terms & Conditions:</p>
                             <p className="mt-1">{settings?.terms || 'This is a computer generated receipt.'}</p>
                          </div>
                          <div className="flex gap-12 items-end">
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
        </div>
      )}
    </div>
  );
};

export default PaymentReceived;
