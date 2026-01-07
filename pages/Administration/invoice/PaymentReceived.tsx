
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PaymentRecord, Client, InvoiceSettings } from '../../../types';
import { mockBackend } from '../../../services/mockBackend';
import Loader from '../../../components/Loader';

interface PaymentReceivedProps {
  onViewChange?: (view: string, extra?: any) => void;
}

const PaymentReceived: React.FC<PaymentReceivedProps> = ({ onViewChange }) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);

  const [previewPayment, setPreviewPayment] = useState<PaymentRecord | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchAll = async () => {
    setIsLoading(true);
    const [pays, sets] = await Promise.all([mockBackend.getPayments(), mockBackend.getInvoiceSettings()]);
    setPayments(pays);
    setSettings(sets);
    setIsLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const filteredPayments = useMemo(() => {
    const s = search.toLowerCase();
    return payments.filter(p => 
      p.clientName.toLowerCase().includes(s) || 
      (p.referenceNo && p.referenceNo.toLowerCase().includes(s)) ||
      (p.invoiceNo && p.invoiceNo.toLowerCase().includes(s))
    ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payments, search]);

  const stats = useMemo(() => {
    return {
      total: filteredPayments.reduce((acc, p) => acc + (p.amount || 0), 0),
      online: filteredPayments.filter(p => p.mode === 'Online' || p.mode === 'UPI' || p.mode === 'Bank Transfer').reduce((acc, p) => acc + (p.amount || 0), 0),
      cheque: filteredPayments.filter(p => p.mode === 'Cheque').reduce((acc, p) => acc + (p.amount || 0), 0),
      cash: filteredPayments.filter(p => p.mode === 'Cash').reduce((acc, p) => acc + (p.amount || 0), 0),
    };
  }, [filteredPayments]);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const windowUrl = 'about:blank';
    const printWindow = window.open(windowUrl, '_blank', 'width=800,height=900');
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${previewPayment?.invoiceNo}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                body { padding: 0; margin: 0; }
                .no-print { display: none; }
                .print-wrapper { width: 100%; border: none; box-shadow: none; padding: 40px !important; position: relative; }
              }
              body { font-family: 'Segoe UI', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .mohar { 
                 position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%) rotate(-15deg); 
                 border: 6px solid #10b981; border-radius: 50%; opacity: 0.15; width: 300px; height: 300px;
                 display: flex; flex-direction: column; align-items: center; justify-content: center;
                 pointer-events: none; z-index: 0;
              }
            </style>
          </head>
          <body onload="setTimeout(() => { window.print(); window.close(); }, 500)">
            <div class="print-wrapper">${printContent.innerHTML}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  const handleWhatsAppShare = async (pay: PaymentRecord) => {
    const text = `*Payment Receipt Confirmation*\n\nFirm: ${settings?.firmName}\nGSTIN: ${settings?.firmGstin}\nClient: ${pay.clientName}\nInv No: ${pay.invoiceNo || 'Direct Payment'}\nAmount: ₹${pay.amount.toLocaleString()}\nDate: ${pay.date.split('-').reverse().join('-')}\nMode: ${pay.mode}\n\n*Thank you for the payment!*`;
    
    if (navigator.share) {
      try { await navigator.share({ title: 'Payment Receipt', text }); } 
      catch (err) { window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank'); }
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 max-w-full mx-auto w-full overflow-hidden pb-10">
      
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Collections</p>
            <p className="text-xl font-black text-slate-900 leading-none">₹{stats.total.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-4 border-l border-slate-100 pl-6">
             <div className="text-center">
                <p className="text-[8px] font-black text-emerald-500 uppercase">Online/UPI</p>
                <p className="text-xs font-black">₹{stats.online.toLocaleString()}</p>
             </div>
             <div className="text-center border-l border-slate-100 pl-4">
                <p className="text-[8px] font-black text-blue-500 uppercase">Cheque</p>
                <p className="text-xs font-black">₹{stats.cheque.toLocaleString()}</p>
             </div>
          </div>
        </div>

        <div className="relative flex-1 group w-full">
          <input type="text" placeholder="Search Client, Inv No or Ref..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600/10 outline-none transition-all" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse table-fixed min-w-[1300px]">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[60px]">S.No.</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[140px]">Inv. No.</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[120px]">Inv. Date</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[240px]">Client</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[140px]">Amount</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[140px]">Payment Date</th>
                <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[140px]">Payment Mode</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right w-[180px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr><td colSpan={8} className="py-32 text-center text-slate-300 font-black uppercase tracking-widest text-sm">No settled payments</td></tr>
              ) : (
                filteredPayments.map((pay, idx) => (
                  <tr key={pay.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-6 py-6 text-slate-300 font-black text-[12px]">{idx + 1}</td>
                    <td className="px-6 py-6 font-black text-slate-400 text-[11px] uppercase">{pay.invoiceNo || '---'}</td>
                    <td className="px-6 py-6 font-bold text-slate-400 text-[10px] uppercase">{(pay.invoiceDate || '').split('-').reverse().join('-')}</td>
                    <td className="px-6 py-6 font-black text-slate-900 text-[12px] uppercase truncate">{pay.clientName}</td>
                    <td className="px-6 py-6 font-black text-emerald-600 text-[12px]">₹{pay.amount.toLocaleString()}</td>
                    <td className="px-6 py-6 font-black text-slate-700 text-[11px] uppercase">{pay.date.split('-').reverse().join('-')}</td>
                    <td className="px-4 py-6">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                        pay.mode === 'Cheque' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'
                      }`}>{pay.mode}</span>
                    </td>
                    <td className="px-6 py-6 text-right whitespace-nowrap">
                       <div className="flex items-center justify-end gap-2">
                          <button onClick={() => {
                            const tempInv: any = { ...pay, status: 'Paid', items: pay.originalItems || [] };
                            onViewChange?.('admin-add-invoice', tempInv);
                          }} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center">
                             <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button onClick={() => setPreviewPayment(pay)} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-blue-600 transition-all flex items-center justify-center shadow-sm">
                             <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                          </button>
                          <button onClick={() => handleWhatsAppShare(pay)} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-emerald-600 transition-all flex items-center justify-center">
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

      {/* RECEIPT PREVIEW MODAL */}
      {previewPayment && settings && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto">
           <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-4xl relative">
              <div className="sticky top-0 p-4 flex justify-end gap-3 z-50 bg-white/80 backdrop-blur border-b border-slate-100 rounded-t-[1.5rem] no-print">
                 <button onClick={handlePrint} className="bg-indigo-600 text-white font-black uppercase text-[10px] px-6 py-2.5 rounded-lg shadow-lg">Print Receipt</button>
                 <button onClick={() => setPreviewPayment(null)} className="bg-slate-100 text-slate-600 font-black uppercase text-[10px] px-6 py-2.5 rounded-lg">Close</button>
              </div>
              
              <div ref={printRef} className="p-16 bg-white text-slate-900 relative print-wrapper min-h-[1000px]">
                 {/* Mohar */}
                 <div className="mohar border-emerald-600/30 opacity-10 absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 pointer-events-none border-8 rounded-full h-80 w-80 flex flex-col items-center justify-center text-center">
                    <p className="text-emerald-600 text-4xl font-black uppercase tracking-tighter">PAYMENT</p>
                    <p className="text-emerald-600 text-5xl font-black uppercase tracking-widest my-2">RECEIVED</p>
                    <div className="h-1 w-64 bg-emerald-600 my-2" />
                    <p className="text-emerald-600 text-2xl font-black uppercase">{previewPayment.date.split('-').reverse().join('-')}</p>
                 </div>

                 {/* Header */}
                 <div className="flex justify-between items-start border-b-2 border-slate-900 pb-10 mb-10">
                    <div className="space-y-4">
                       {settings.firmLogo && <img src={settings.firmLogo} className="h-20 object-contain" alt="Firm Logo" />}
                       <h1 className="text-3xl font-black uppercase tracking-tight text-emerald-600">Payment Receipt</h1>
                    </div>
                    <div className="text-right space-y-1">
                       <p className="text-xl font-black uppercase">{settings.firmName}</p>
                       <p className="text-[10px] font-black text-indigo-600 font-mono">GSTIN: {settings.firmGstin}</p>
                       <p className="text-[10px] font-bold text-slate-500 uppercase whitespace-pre-wrap">{settings.firmAddress}</p>
                       <p className="text-xs font-black text-slate-800">M: +91 {settings.firmMobile} • {settings.firmEmail}</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-20 mb-12 relative z-10">
                    <div>
                       <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2">Received From:</h4>
                       <p className="text-xl font-black uppercase mb-1">{previewPayment.clientName}</p>
                    </div>
                    <div className="text-right">
                       <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2">Receipt Details:</h4>
                       <p className="text-xs font-bold"><span className="text-slate-400">Date:</span> {previewPayment.date.split('-').reverse().join('-')}</p>
                       <p className="text-xs font-bold"><span className="text-slate-400">Mode:</span> {previewPayment.mode}</p>
                    </div>
                 </div>

                 <table className="w-full mb-12 relative z-10">
                    <thead>
                       <tr className="bg-slate-900 text-white">
                          <th className="px-4 py-3 text-[10px] font-black uppercase text-left">Description of Services Settled</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase text-right w-[150px]">Amount</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 border-b border-slate-200">
                       {previewPayment.originalItems ? previewPayment.originalItems.map((item, i) => (
                          <tr key={i}>
                             <td className="px-4 py-5 text-sm font-black uppercase">{item.description}</td>
                             <td className="px-4 py-5 text-sm font-black text-right">₹{item.amount.toLocaleString()}</td>
                          </tr>
                       )) : (
                        <tr>
                           <td className="px-4 py-5 text-sm font-black uppercase">Consolidated Professional Services</td>
                           <td className="px-4 py-5 text-sm font-black text-right">₹{previewPayment.amount.toLocaleString()}</td>
                        </tr>
                       )}
                    </tbody>
                 </table>

                 <div className="flex justify-end mb-20 relative z-10">
                    <div className="text-right w-64 bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                       <p className="text-emerald-800 font-black text-lg uppercase">Net Received: ₹{previewPayment.amount.toLocaleString()}</p>
                    </div>
                 </div>

                 <div className="flex justify-between items-end relative z-10">
                    <div className="max-w-md">
                       <p className="text-[10px] font-medium text-slate-400 leading-relaxed">This is a digital acknowledgment of payment.</p>
                    </div>
                    <div className="text-right">
                       {settings.firmSignature && <img src={settings.firmSignature} className="h-16 ml-auto mb-2 opacity-90 mix-blend-multiply" alt="Signature" />}
                       <p className="text-[10px] font-black uppercase border-t border-slate-900 pt-2 px-4">Finance Department</p>
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
