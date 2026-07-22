import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../../../services/api';
import Loader from '../../../components/Loader';
import { Client, InvoiceRecord, PaymentRecord } from '../../../types';
import html2pdf from 'html2pdf.js';

interface ClientLedgerProps {
  onBack: () => void;
}

const ClientLedger: React.FC<ClientLedgerProps> = ({ onBack }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, iRes, pRes] = await Promise.all([
          api.get('/clients'),
          api.get('/invoices'),
          api.get('/payments')
        ]);
        setClients(cRes.data);
        setInvoices(iRes.data);
        setPayments(pRes.data);
      } catch (err) {
        console.error('Error fetching ledger data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const clientBalances = useMemo(() => {
    return clients.map(client => {
      const clientInvoices = invoices.filter(i => i.clientId === client.id);
      const clientPayments = payments.filter(p => p.clientId === client.id);
      
      const totalInvoiced = clientInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
      const totalPaid = clientPayments.reduce((sum, p) => sum + p.amount, 0);
      
      const balance = totalInvoiced - totalPaid; // positive = debit (they owe us), negative = credit (advance)
      return { client, balance, hasActivity: clientInvoices.length > 0 || clientPayments.length > 0 };
    }).filter(c => c.hasActivity).sort((a, b) => b.balance - a.balance); // Sort by balance descending
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
    
    invoices.filter(i => i.clientId === selectedClient.id).forEach(inv => {
       entries.push({
         date: inv.date,
         type: 'Invoice',
         ref: inv.invoiceNo,
         debit: inv.totalAmount,
         credit: 0
       });
    });
    
    payments.filter(p => p.clientId === selectedClient.id).forEach(pay => {
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
    let runningBalance = 0;
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
           <div ref={printRef} className="bg-white p-4">
             <div className="mb-6 border-b border-slate-100 pb-4">
               <h3 className="text-xl font-black text-slate-900 uppercase">{selectedClient.tradeName || selectedClient.legalName}</h3>
               <p className="text-xs font-bold text-slate-500 uppercase mt-1">Client Ledger Statement</p>
             </div>
             
             <table className="w-full text-left border-collapse table-auto">
               <thead className="bg-slate-50 border-b border-slate-200">
                 <tr>
                   <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-widest">Date</th>
                   <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-widest">Description</th>
                   <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Debit (₹)</th>
                   <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Credit (₹)</th>
                   <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Balance (₹)</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {selectedLedgerEntries.length === 0 ? (
                   <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-bold text-xs uppercase">No records found.</td></tr>
                 ) : selectedLedgerEntries.map((entry, idx) => {
                   runningBalance += (entry.debit - entry.credit);
                   return (
                     <tr key={idx} className="hover:bg-slate-50">
                       <td className="px-4 py-3 text-xs font-bold text-slate-500">{entry.date.split('-').reverse().join('-')}</td>
                       <td className="px-4 py-3 text-xs font-black text-slate-700">{entry.type}: {entry.ref}</td>
                       <td className="px-4 py-3 text-xs font-black text-rose-600 text-right">{entry.debit > 0 ? entry.debit.toLocaleString() : '-'}</td>
                       <td className="px-4 py-3 text-xs font-black text-emerald-600 text-right">{entry.credit > 0 ? entry.credit.toLocaleString() : '-'}</td>
                       <td className="px-4 py-3 text-xs font-black text-slate-900 text-right">{Math.abs(runningBalance).toLocaleString()} {runningBalance > 0 ? 'Dr' : runningBalance < 0 ? 'Cr' : ''}</td>
                     </tr>
                   );
                 })}
               </tbody>
               {selectedLedgerEntries.length > 0 && (
                 <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                   <tr>
                     <td colSpan={2} className="px-4 py-4 text-xs font-black text-slate-900 text-right uppercase">Closing Balance</td>
                     <td className="px-4 py-4 text-xs font-black text-rose-600 text-right">{selectedLedgerEntries.reduce((sum, e) => sum + e.debit, 0).toLocaleString()}</td>
                     <td className="px-4 py-4 text-xs font-black text-emerald-600 text-right">{selectedLedgerEntries.reduce((sum, e) => sum + e.credit, 0).toLocaleString()}</td>
                     <td className={`px-4 py-4 text-xs font-black text-right ${runningBalance > 0 ? 'text-rose-600' : runningBalance < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                       {Math.abs(runningBalance).toLocaleString()} {runningBalance > 0 ? 'Dr (Due)' : runningBalance < 0 ? 'Cr (Advance)' : 'Nil'}
                     </td>
                   </tr>
                 </tfoot>
               )}
             </table>
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
                 const clientInvoices = invoices.filter(i => i.clientId === client.id);
                 const clientPayments = payments.filter(p => p.clientId === client.id);
                 const totalInvoiced = clientInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
                 const totalPaid = clientPayments.reduce((sum, p) => sum + p.amount, 0);
                 
                 return (
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-900 truncate leading-tight text-sm">{client.tradeName || client.legalName}</div>
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
