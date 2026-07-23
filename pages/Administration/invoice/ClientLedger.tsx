import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../../../services/api';
import Loader from '../../../components/Loader';
import { Client, InvoiceRecord, PaymentRecord, InvoiceSettings } from '../../../types';
import html2pdf from 'html2pdf.js';
import { QRCodeSVG } from 'qrcode.react';

interface ClientLedgerProps {
  onBack: () => void;
}

const ClientLedger: React.FC<ClientLedgerProps> = ({ onBack }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clis, invs, pmts, sets] = await Promise.all([
          api.getClients(),
          api.getInvoices(),
          api.getPayments(),
          api.getInvoiceSettings()
        ]);
        setClients(clis);
        setInvoices(invs);
        setPayments(pmts);
        setSettings(sets);
      } catch (err) {
        console.error('Error fetching ledger data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const clientBalances = useMemo(() => {
    // 1. Process regular clients
    const regularBalances = clients.map(client => {
      const clientInvoices = invoices.filter(i => 
        i.status !== 'Cancelled' && (
          i.clientId === client.id || 
          (i.clientName && i.clientName.trim().toLowerCase() === client.legalName.trim().toLowerCase()) ||
          (i.clientTradeName && client.tradeName && i.clientTradeName.trim().toLowerCase() === client.tradeName.trim().toLowerCase())
        )
      );
      const clientPayments = payments.filter(p => 
        p.clientId === client.id || 
        (p.clientName && p.clientName.trim().toLowerCase() === client.legalName.trim().toLowerCase()) ||
        (p.clientTradeName && client.tradeName && p.clientTradeName.trim().toLowerCase() === client.tradeName.trim().toLowerCase())
      );
      
      const totalInvoiced = clientInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
      const totalPaid = clientPayments.reduce((sum, p) => sum + p.amount, 0);
      
      const balance = totalInvoiced - totalPaid; // positive = debit, negative = credit
      return { client, balance, hasActivity: clientInvoices.length > 0 || clientPayments.length > 0 };
    });

    // 2. Identify and group unmatched invoices/payments (manual or misc clients)
    const unmatchedInvoices = invoices.filter(i => 
      i.status !== 'Cancelled' &&
      !clients.some(c => 
        i.clientId === c.id || 
        (i.clientName && i.clientName.trim().toLowerCase() === c.legalName.trim().toLowerCase()) ||
        (i.clientTradeName && c.tradeName && i.clientTradeName.trim().toLowerCase() === c.tradeName.trim().toLowerCase())
      )
    );

    const unmatchedPayments = payments.filter(p => 
      !clients.some(c => 
        p.clientId === c.id || 
        (p.clientName && p.clientName.trim().toLowerCase() === c.legalName.trim().toLowerCase()) ||
        (p.clientTradeName && c.tradeName && p.clientTradeName.trim().toLowerCase() === c.tradeName.trim().toLowerCase())
      )
    );

    const unmatchedNames = new Set<string>();
    unmatchedInvoices.forEach(i => i.clientName && unmatchedNames.add(i.clientName));
    unmatchedPayments.forEach(p => p.clientName && unmatchedNames.add(p.clientName));

    const manualBalances = Array.from(unmatchedNames).map(name => {
      const clientInvoices = unmatchedInvoices.filter(i => i.clientName === name);
      const clientPayments = unmatchedPayments.filter(p => p.clientName === name);

      const totalInvoiced = clientInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
      const totalPaid = clientPayments.reduce((sum, p) => sum + p.amount, 0);
      const balance = totalInvoiced - totalPaid;

      const pseudoClient: Client = {
        id: `manual-${encodeURIComponent(name)}`,
        legalName: name,
        tradeName: clientInvoices[0]?.clientTradeName || '',
        mobile: clientInvoices[0]?.miscMobile || clientPayments[0]?.chequeNo || '',
        address: clientInvoices[0]?.miscAddress || '',
        gstProfile: { gstin: clientInvoices[0]?.clientGstin || '' }
      } as any;

      return { client: pseudoClient, balance, hasActivity: true };
    });

    return [...regularBalances, ...manualBalances]
      .filter(c => c.hasActivity)
      .sort((a, b) => b.balance - a.balance); // Sort by balance descending
  }, [clients, invoices, payments]);

  const filteredBalances = useMemo(() => {
    return clientBalances.filter(c => 
      c.client.tradeName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.client.legalName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clientBalances, searchTerm]);

  const selectedLedgerEntries = useMemo(() => {
    if (!selectedClient) return [];
    
    type LedgerEntry = { date: string; type: string; ref: string; debit: number; credit: number };
    const entries: LedgerEntry[] = [];
    
    const isManual = selectedClient.id.startsWith('manual-');
    
    const clientInvoices = invoices.filter(i => {
      if (i.status === 'Cancelled') return false;
      if (isManual) return i.clientName === selectedClient.legalName;
      return i.clientId === selectedClient.id || 
        (i.clientName && i.clientName.trim().toLowerCase() === selectedClient.legalName.trim().toLowerCase()) ||
        (i.clientTradeName && selectedClient.tradeName && i.clientTradeName.trim().toLowerCase() === selectedClient.tradeName.trim().toLowerCase());
    });

    const clientPayments = payments.filter(p => {
      if (isManual) return p.clientName === selectedClient.legalName;
      return p.clientId === selectedClient.id || 
        (p.clientName && p.clientName.trim().toLowerCase() === selectedClient.legalName.trim().toLowerCase()) ||
        (p.clientTradeName && selectedClient.tradeName && p.clientTradeName.trim().toLowerCase() === selectedClient.tradeName.trim().toLowerCase());
    });

    clientInvoices.forEach(inv => {
       entries.push({
         date: inv.date,
         type: 'Invoice',
         ref: inv.invoiceNo,
         debit: inv.totalAmount,
         credit: 0
       });
    });
    
    clientPayments.forEach(pay => {
       entries.push({
         date: pay.date,
         type: 'Payment',
         ref: pay.mode + (pay.chequeNo ? ` - ${pay.chequeNo}` : ''),
         debit: 0,
         credit: pay.amount
       });
    });
    
    return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [selectedClient, invoices, payments]);

  const exportLedger = () => {
    if (!printRef.current || !selectedClient) return;
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Ledger_${selectedClient.tradeName || selectedClient.legalName}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().from(printRef.current).set(opt).save();
  };

  if (isLoading) return <Loader />;

  if (selectedClient) {
    return (
      <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 max-w-5xl mx-auto w-full pb-10">
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedClient(null)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
              <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Ledger: {selectedClient.tradeName || selectedClient.legalName}</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Detailed transaction history</p>
            </div>
          </div>
          <button onClick={exportLedger} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl hover:bg-emerald-700 transition-colors shadow-md">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            <span className="font-black text-xs uppercase tracking-widest">Export PDF</span>
          </button>
        </div>

        <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col p-6">
           <div className="overflow-y-auto flex-1 bg-white">
             <div ref={printRef} className="bg-white p-8 relative">
                {settings?.watermark && (
                   <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none z-0 overflow-hidden">
                      <img src={settings.watermark} alt="Watermark" className="w-[80%] object-contain mix-blend-multiply grayscale" />
                   </div>
                )}
                
                <div className="space-y-8 relative z-10">
                   {/* Firm Header */}
                   <div className="flex justify-between items-start">
                      <div className="flex gap-6 items-stretch">
                         <div className="flex flex-col justify-center py-1">
                            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">{settings?.firmName || 'Your Firm Name'}</h1>
                            {settings?.firmServices && <p className="text-[10px] font-black text-indigo-500 uppercase mt-0.5 tracking-widest">{settings.firmServices}</p>}
                            {settings?.professionType && settings?.registrationNo && <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">{settings.professionType === 'CA' ? 'Membership No: ' : 'Bar Registration No: '}{settings.registrationNo}</p>}
                            {settings?.firmAddress && <p className="text-xs font-bold text-slate-500 uppercase mt-2 max-w-xs whitespace-pre-wrap">{settings.firmAddress}</p>}
                            {settings?.firmGstin && settings.firmGstin.toLowerCase() !== 'n/a' && <p className="text-xs font-bold text-slate-500 uppercase mt-1">GSTIN: {settings.firmGstin}</p>}
                            {settings?.firmMobile && <p className="text-xs font-bold text-slate-500 uppercase">Contact: {settings.firmMobile}</p>}
                            {settings?.firmEmail && <p className="text-xs font-bold text-slate-500 uppercase">Email: {settings.firmEmail}</p>}
                         </div>
                      </div>
                      <div className="text-right">
                         <h2 className="text-3xl font-black text-slate-200 uppercase tracking-tighter">Statement</h2>
                         <p className="text-xs font-black text-slate-500 uppercase tracking-widest mt-1">Client Ledger</p>
                         <div className="mt-4 space-y-1">
                            <p className="text-[11px] font-bold text-slate-500 uppercase">Date: <span className="text-slate-900">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></p>
                         </div>
                      </div>
                   </div>

                   {/* Client Info (Bill To equivalent) */}
                   <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Statement For / Client Details</p>
                      <h3 className="text-lg font-black uppercase text-slate-900">{selectedClient.tradeName || selectedClient.legalName}</h3>
                      {selectedClient.tradeName && <p className="text-xs font-bold text-slate-500 uppercase mt-1">Legal: {selectedClient.legalName}</p>}
                      {selectedClient.gstProfile?.gstin && <p className="text-xs font-bold text-slate-500 uppercase mt-1">GSTIN: {selectedClient.gstProfile.gstin}</p>}
                      {selectedClient.address && <p className="text-xs font-bold text-slate-500 uppercase mt-1">{selectedClient.address}</p>}
                      <p className="text-xs font-bold text-slate-500 uppercase mt-1">Mobile: {selectedClient.mobile || 'N/A'}</p>
                   </div>

                   {/* Ledger Table */}
                   <table className="w-full text-left border-collapse table-auto mt-6">
                     <thead className="bg-slate-50 border-b-2 border-slate-900">
                       <tr>
                         <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-900 tracking-widest">Date</th>
                         <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-900 tracking-widest">Description</th>
                         <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-900 tracking-widest text-right">Debit (₹)</th>
                         <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-900 tracking-widest text-right">Credit (₹)</th>
                         <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-900 tracking-widest text-right">Balance (₹)</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {selectedLedgerEntries.length === 0 ? (
                         <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-bold text-xs uppercase">No transaction records found.</td></tr>
                       ) : (() => {
                         let printRunningBalance = 0;
                         return selectedLedgerEntries.map((entry, idx) => {
                           printRunningBalance += (entry.debit - entry.credit);
                           return (
                             <tr key={idx} className="hover:bg-slate-50/50">
                               <td className="px-4 py-3 text-xs font-bold text-slate-500">{entry.date.split('-').reverse().join('-')}</td>
                               <td className="px-4 py-3 text-xs font-black text-slate-700">{entry.type}: {entry.ref}</td>
                               <td className="px-4 py-3 text-xs font-black text-rose-600 text-right">{entry.debit > 0 ? entry.debit.toLocaleString() : '-'}</td>
                               <td className="px-4 py-3 text-xs font-black text-emerald-600 text-right">{entry.credit > 0 ? entry.credit.toLocaleString() : '-'}</td>
                               <td className="px-4 py-3 text-xs font-black text-slate-900 text-right">
                                 ₹{Math.abs(printRunningBalance).toLocaleString()} {printRunningBalance > 0 ? 'Dr' : printRunningBalance < 0 ? 'Cr' : ''}
                               </td>
                             </tr>
                           );
                         });
                       })()}
                     </tbody>
                     {selectedLedgerEntries.length > 0 && (() => {
                        const totalDr = selectedLedgerEntries.reduce((sum, e) => sum + e.debit, 0);
                        const totalCr = selectedLedgerEntries.reduce((sum, e) => sum + e.credit, 0);
                        const closingBal = totalDr - totalCr;
                        return (
                          <tfoot className="bg-slate-50 border-t-2 border-slate-900">
                            <tr>
                              <td colSpan={2} className="px-4 py-4 text-xs font-black text-slate-900 text-right uppercase">Closing Balance Summary</td>
                              <td className="px-4 py-4 text-xs font-black text-rose-600 text-right">₹{totalDr.toLocaleString()}</td>
                              <td className="px-4 py-4 text-xs font-black text-emerald-600 text-right">₹{totalCr.toLocaleString()}</td>
                              <td className={`px-4 py-4 text-xs font-black text-right ${closingBal > 0 ? 'text-rose-600' : closingBal < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                                ₹{Math.abs(closingBal).toLocaleString()} {closingBal > 0 ? 'Dr (Due)' : closingBal < 0 ? 'Cr (Advance)' : 'Nil'}
                              </td>
                            </tr>
                          </tfoot>
                        );
                     })()}
                   </table>

                   {/* Footer Info (Bank, QR and Signature) */}
                   <div className="flex justify-between items-start mt-8 pt-4">
                      <div className="flex flex-row gap-6 items-start">
                         {settings?.upiId && (() => {
                            const totalDr = selectedLedgerEntries.reduce((sum, e) => sum + e.debit, 0);
                            const totalCr = selectedLedgerEntries.reduce((sum, e) => sum + e.credit, 0);
                            const netBal = totalDr - totalCr;
                            if (netBal > 0) {
                              return (
                                <div className="flex flex-col items-center gap-2 shrink-0">
                                  <QRCodeSVG value={`upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.firmName)}&am=${netBal}&cu=INR&tn=Ledger ${encodeURIComponent(selectedClient.tradeName || selectedClient.legalName)}`} size={80} />
                                  <span className="text-[9px] font-black uppercase text-slate-500">Scan to Settle (₹{netBal.toLocaleString()})</span>
                                </div>
                              );
                            }
                            return null;
                         })()}
                         <div className="flex flex-col gap-1">
                            <p className="text-[10px] font-black uppercase text-slate-900">Bank Details</p>
                            <p className="text-[9px] font-bold text-slate-600 uppercase">A/C Name: {settings?.accountName || 'N/A'}</p>
                            <p className="text-[9px] font-bold text-slate-600 uppercase">Bank: {settings?.bankName || 'N/A'}</p>
                            <p className="text-[9px] font-bold text-slate-600 uppercase">A/C No: {settings?.accountNo || 'N/A'}</p>
                            <p className="text-[9px] font-bold text-slate-600 uppercase">IFSC: {settings?.ifsc || 'N/A'}</p>
                         </div>
                      </div>
                      
                      <div className="w-64 space-y-2 text-right">
                         {(() => {
                            const totalDr = selectedLedgerEntries.reduce((sum, e) => sum + e.debit, 0);
                            const totalCr = selectedLedgerEntries.reduce((sum, e) => sum + e.credit, 0);
                            const closingBal = totalDr - totalCr;
                            return (
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-left space-y-1">
                                <p className="text-[9px] font-black uppercase text-slate-400">Statement Summary</p>
                                <div className="flex justify-between text-xs font-bold text-slate-600">
                                   <span>Total Invoiced (Debit)</span>
                                   <span>₹{totalDr.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-slate-600">
                                   <span>Total Paid (Credit)</span>
                                   <span>₹{totalCr.toLocaleString()}</span>
                                </div>
                                <div className="h-px bg-slate-200 my-1" />
                                <div className={`flex justify-between text-sm font-black ${closingBal > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                                   <span>Outstanding Balance</span>
                                   <span>₹{Math.abs(closingBal).toLocaleString()} {closingBal > 0 ? 'Dr' : closingBal < 0 ? 'Cr' : ''}</span>
                                </div>
                              </div>
                            );
                         })()}
                      </div>
                   </div>

                   {/* Terms & Conditions, Whatsapp QR & Signatory */}
                   <div className="pt-8 border-t border-slate-100 mt-8">
                      <div className="flex justify-between items-end">
                         <div className="text-[8px] leading-tight font-bold text-slate-500 uppercase whitespace-pre-wrap max-w-sm">
                            <p className="text-slate-900 font-black mb-1">Terms & Conditions:</p>
                            <p className="mt-1">{settings?.terms || '1. This is a computer-generated account statement.\n2. Please report any discrepancies immediately.'}</p>
                         </div>
                         <div className="flex gap-12 items-end">
                            {settings?.whatsappNumber && (
                              <div className="flex flex-col items-center gap-2 shrink-0">
                                <QRCodeSVG value={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(`Hello, regarding ledger statement for ${selectedClient.tradeName || selectedClient.legalName}`)}`} size={80} />
                                <span className="text-[9px] font-black uppercase text-slate-500">WhatsApp Us</span>
                              </div>
                            )}
                            <div className="text-center flex flex-col items-center shrink-0">
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
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 max-w-5xl mx-auto w-full pb-10">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
            <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Client Ledgers</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Overview of balances</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm shrink-0">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input 
            type="text" 
            placeholder="Search clients..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600/10 outline-none" />
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse table-auto overflow-hidden min-w-full">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Client Name</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Total Invoiced</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Total Paid</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Net Balance</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBalances.length === 0 ? (
                 <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                       No clients found with ledger activity.
                    </td>
                 </tr>
              ) : filteredBalances.map(({ client, balance }) => {
                 const isManual = client.id.startsWith('manual-');
                 const clientInvoices = invoices.filter(i => {
                   if (i.status === 'Cancelled') return false;
                   if (isManual) return i.clientName === client.legalName;
                   return i.clientId === client.id || 
                     (i.clientName && i.clientName.trim().toLowerCase() === client.legalName.trim().toLowerCase()) ||
                     (i.clientTradeName && client.tradeName && i.clientTradeName.trim().toLowerCase() === client.tradeName.trim().toLowerCase());
                 });
                 const clientPayments = payments.filter(p => {
                   if (isManual) return p.clientName === client.legalName;
                   return p.clientId === client.id || 
                     (p.clientName && p.clientName.trim().toLowerCase() === client.legalName.trim().toLowerCase()) ||
                     (p.clientTradeName && client.tradeName && p.clientTradeName.trim().toLowerCase() === client.tradeName.trim().toLowerCase());
                 });
                 
                 const totalInvoiced = clientInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
                 const totalPaid = clientPayments.reduce((sum, p) => sum + p.amount, 0);
                 
                 return (
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-900 truncate leading-tight text-sm">
                        {client.tradeName || client.legalName}
                        {isManual && <span className="ml-2 text-[9px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Manual Entry</span>}
                      </div>
                      {client.tradeName && <div className="font-bold text-[10px] text-slate-500 truncate leading-tight mt-1">{client.legalName}</div>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-black text-xs text-slate-600">₹{totalInvoiced.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-black text-xs text-slate-600">₹{totalPaid.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-black text-sm ${balance > 0 ? 'text-rose-600' : balance < 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                        ₹{Math.abs(balance).toLocaleString()} {balance > 0 ? 'Dr' : balance < 0 ? 'Cr' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setSelectedClient(client)}
                        className="bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm mx-auto flex items-center justify-center gap-2"
                      >
                        <span>View Ledger</span>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </td>
                  </tr>
                 );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientLedger;
