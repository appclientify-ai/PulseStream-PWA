import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../../../services/api';
import Loader from '../../../components/Loader';
import { formatDate } from '../../../dateUtils';
import { Client, InvoiceRecord, PaymentRecord, InvoiceSettings } from '../../../types';
import html2pdf from 'html2pdf.js';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [manualCarryForward, setManualCarryForward] = useState('');
  const [entryToDelete, setEntryToDelete] = useState<{ id: string; type: string; ref: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStartDate('');
    setEndDate('');
    setManualCarryForward('');
  }, [selectedClient]);

  const fetchData = async (isSync = false) => {
    if (!isSync) setIsLoading(true);
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

  useEffect(() => {
    fetchData();
    const syncHandler = () => { console.log('Syncing in background...'); fetchData(true); };
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, []);

  const validInvoices = useMemo(() => {
    return invoices.filter(i => i.status !== 'Cancelled' && i.status !== 'Draft');
  }, [invoices]);

  const activeInvoiceNos = useMemo(() => {
    return new Set(validInvoices.map(i => i.invoiceNo ? i.invoiceNo.trim() : ''));
  }, [validInvoices]);

  const validPayments = useMemo(() => {
    return payments.filter(p => {
      if (!p.invoiceNo) return true;
      return activeInvoiceNos.has(p.invoiceNo.trim());
    });
  }, [payments, activeInvoiceNos]);

  const handlePurgeDatabase = async () => {
    if (window.confirm('Do you want to clean deleted/cancelled invoice data and orphaned payments from the database?')) {
      setIsLoading(true);
      try {
        const res = await api.purgeOrphanAndCancelledRecords();
        toast.success(`Database cleaned successfully! ${res.purgedCount} orphaned/cancelled item(s) removed.`);
        await fetchData(true);
      } catch (err) {
        toast.error('Failed to clean database.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const clientBalances = useMemo(() => {
    // 1. Process regular clients
    const regularBalances = clients.map(client => {
      const clientInvoices = validInvoices.filter(i => 
        i.clientId === client.id || 
        (i.clientName && i.clientName.trim().toLowerCase() === client.legalName.trim().toLowerCase()) ||
        (i.clientTradeName && client.tradeName && i.clientTradeName.trim().toLowerCase() === client.tradeName.trim().toLowerCase())
      );
      const clientPayments = validPayments.filter(p => 
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
    const unmatchedInvoices = validInvoices.filter(i => 
      !clients.some(c => 
        i.clientId === c.id || 
        (i.clientName && i.clientName.trim().toLowerCase() === c.legalName.trim().toLowerCase()) ||
        (i.clientTradeName && c.tradeName && i.clientTradeName.trim().toLowerCase() === c.tradeName.trim().toLowerCase())
      )
    );

    const unmatchedPayments = validPayments.filter(p => 
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
  }, [clients, validInvoices, validPayments]);

  const filteredBalances = useMemo(() => {
    return clientBalances.filter(c => 
      c.client.tradeName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.client.legalName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clientBalances, searchTerm]);

  const allEntries = useMemo(() => {
    if (!selectedClient) return [];
    
    type LedgerEntry = { id: string; date: string; type: string; ref: string; debit: number; credit: number };
    const entries: LedgerEntry[] = [];
    
    const isManual = selectedClient.id.startsWith('manual-');
    
    const clientInvoices = validInvoices.filter(i => {
      if (isManual) return i.clientName === selectedClient.legalName;
      return i.clientId === selectedClient.id || 
        (i.clientName && i.clientName.trim().toLowerCase() === selectedClient.legalName.trim().toLowerCase()) ||
        (i.clientTradeName && selectedClient.tradeName && i.clientTradeName.trim().toLowerCase() === selectedClient.tradeName.trim().toLowerCase());
    });

    const clientPayments = validPayments.filter(p => {
      if (isManual) return p.clientName === selectedClient.legalName;
      return p.clientId === selectedClient.id || 
        (p.clientName && p.clientName.trim().toLowerCase() === selectedClient.legalName.trim().toLowerCase()) ||
        (p.clientTradeName && selectedClient.tradeName && p.clientTradeName.trim().toLowerCase() === selectedClient.tradeName.trim().toLowerCase());
    });

    clientInvoices.forEach(inv => {
       entries.push({
         id: inv.id,
         date: inv.date,
         type: 'Invoice',
         ref: inv.invoiceNo,
         debit: inv.totalAmount,
         credit: 0
       });
    });
    
    clientPayments.forEach(pay => {
       entries.push({
         id: pay.id,
         date: pay.date,
         type: 'Payment',
         ref: pay.mode + (pay.chequeNo ? ` - ${pay.chequeNo}` : ''),
         debit: 0,
         credit: pay.amount
       });
    });
    
    return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [selectedClient, invoices, payments]);

  const { filteredLedgerEntries, openingBalanceRow, finalClosingDr, finalClosingCr, finalClosingBal } = useMemo(() => {
    const manualCarryNum = parseFloat(manualCarryForward) || 0;
    let calculatedPriorBalance = 0;
    
    let priorEntries: typeof allEntries = [];
    let visibleEntries = allEntries;
    
    if (startDate) {
      priorEntries = allEntries.filter(e => e.date < startDate);
      visibleEntries = visibleEntries.filter(e => e.date >= startDate);
      calculatedPriorBalance = priorEntries.reduce((sum, e) => sum + (e.debit - e.credit), 0);
    }
    
    if (endDate) {
      visibleEntries = visibleEntries.filter(e => e.date <= endDate);
    }
    
    const totalOpeningBalance = calculatedPriorBalance + manualCarryNum;
    
    const openingRow = (startDate || manualCarryNum !== 0 || calculatedPriorBalance !== 0) ? {
      id: 'opening-balance',
      date: startDate || (visibleEntries.length > 0 ? visibleEntries[0].date : new Date().toISOString().split('T')[0]),
      type: 'Opening Balance',
      ref: 'Balance Carried Forward' + (manualCarryNum !== 0 && calculatedPriorBalance !== 0 ? ' (Prior + Manual)' : manualCarryNum !== 0 ? ' (Manual)' : ' (Prior)'),
      debit: totalOpeningBalance > 0 ? totalOpeningBalance : 0,
      credit: totalOpeningBalance < 0 ? Math.abs(totalOpeningBalance) : 0,
      balance: totalOpeningBalance,
      isOpening: true
    } : null;
    
    const totalVisibleDr = visibleEntries.reduce((sum, e) => sum + e.debit, 0);
    const totalVisibleCr = visibleEntries.reduce((sum, e) => sum + e.credit, 0);
    
    const closingDr = totalVisibleDr + (totalOpeningBalance > 0 ? totalOpeningBalance : 0);
    const closingCr = totalVisibleCr + (totalOpeningBalance < 0 ? Math.abs(totalOpeningBalance) : 0);
    const closingBal = closingDr - closingCr;
    
    return {
      filteredLedgerEntries: visibleEntries,
      openingBalanceRow: openingRow,
      finalClosingDr: closingDr,
      finalClosingCr: closingCr,
      finalClosingBal: closingBal
    };
  }, [allEntries, startDate, endDate, manualCarryForward]);

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return;
    setIsDeleting(true);
    try {
      if (entryToDelete.type === 'Invoice') {
        await api.deleteInvoice(entryToDelete.id);
        toast.success('Invoice entry deleted successfully');
      } else if (entryToDelete.type === 'Payment') {
        await api.deletePayment(entryToDelete.id);
        toast.success('Payment entry deleted successfully');
      }
      
      const [invs, pmts] = await Promise.all([
        api.getInvoices(),
        api.getPayments()
      ]);
      setInvoices(invs);
      setPayments(pmts);
      setEntryToDelete(null);
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('clientify_db_change'));
    } catch (err) {
      console.error('Error deleting entry:', err);
      toast.error('Failed to delete entry.');
    } finally {
      setIsDeleting(false);
    }
  };

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
      <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 w-full pb-4 min-h-0">
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

        {/* Ledger Settings Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Start Date</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/10"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">End Date</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/10"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Manual Previous Balance (₹)</label>
            <div className="relative">
              <span className="absolute left-3 inset-y-0 flex items-center text-xs font-bold text-slate-400">₹</span>
              <input 
                type="number" 
                placeholder="0"
                value={manualCarryForward} 
                onChange={(e) => setManualCarryForward(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2.5 font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/10"
              />
            </div>
          </div>
          {(startDate || endDate || manualCarryForward) && (
            <div className="md:col-span-3 flex justify-end">
              <button 
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setManualCarryForward('');
                }}
                className="text-rose-600 hover:text-rose-700 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Clear Settings
              </button>
            </div>
          )}
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
                            <p className="text-[11px] font-bold text-slate-500 uppercase">Date: <span className="text-slate-900">{formatDate(new Date())}</span></p>
                            {(startDate || endDate) && (
                              <p className="text-[10px] font-bold text-indigo-600 uppercase">
                                Period: {startDate ? formatDate(startDate) : 'Start'} to {endDate ? formatDate(endDate) : 'Present'}
                              </p>
                            )}
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
                          <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-900 tracking-widest text-center" data-html2pdf-ignore="true">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {openingBalanceRow && (
                          <tr className="bg-amber-50/40">
                            <td className="px-4 py-3 text-xs font-bold text-slate-500">
                              {openingBalanceRow.date ? formatDate(openingBalanceRow.date) : '-'}
                            </td>
                            <td className="px-4 py-3 text-xs font-bold text-slate-700">
                              <span className="text-[9px] bg-amber-100 text-amber-800 font-black px-1.5 py-0.5 rounded mr-2 uppercase tracking-wider">Opening</span>
                              {openingBalanceRow.type}: {openingBalanceRow.ref}
                            </td>
                            <td className="px-4 py-3 text-xs font-black text-rose-600 text-right">
                              {openingBalanceRow.debit > 0 ? openingBalanceRow.debit.toLocaleString() : '-'}
                            </td>
                            <td className="px-4 py-3 text-xs font-black text-emerald-600 text-right">
                              {openingBalanceRow.credit > 0 ? openingBalanceRow.credit.toLocaleString() : '-'}
                            </td>
                            <td className="px-4 py-3 text-xs font-black text-slate-900 text-right">
                              ₹{Math.abs(openingBalanceRow.balance).toLocaleString()} {openingBalanceRow.balance > 0 ? 'Dr' : openingBalanceRow.balance < 0 ? 'Cr' : ''}
                            </td>
                            <td className="px-4 py-3" data-html2pdf-ignore="true" />
                          </tr>
                        )}

                        {filteredLedgerEntries.length === 0 && !openingBalanceRow ? (
                          <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-bold text-xs uppercase">No transaction records found.</td></tr>
                        ) : (() => {
                          let printRunningBalance = openingBalanceRow ? openingBalanceRow.balance : 0;
                          return filteredLedgerEntries.map((entry, idx) => {
                            printRunningBalance += (entry.debit - entry.credit);
                            return (
                              <tr key={entry.id || idx} className="hover:bg-slate-50/50 group">
                                <td className="px-4 py-3 text-xs font-bold text-slate-500">{formatDate(entry.date)}</td>
                                <td className="px-4 py-3 text-xs font-black text-slate-700">{entry.type}: {entry.ref}</td>
                                <td className="px-4 py-3 text-xs font-black text-rose-600 text-right">{entry.debit > 0 ? entry.debit.toLocaleString() : '-'}</td>
                                <td className="px-4 py-3 text-xs font-black text-emerald-600 text-right">{entry.credit > 0 ? entry.credit.toLocaleString() : '-'}</td>
                                <td className="px-4 py-3 text-xs font-black text-slate-900 text-right">
                                  ₹{Math.abs(printRunningBalance).toLocaleString()} {printRunningBalance > 0 ? 'Dr' : printRunningBalance < 0 ? 'Cr' : ''}
                                </td>
                                <td className="px-4 py-3 text-center" data-html2pdf-ignore="true">
                                  <button 
                                    onClick={() => setEntryToDelete({ id: entry.id, type: entry.type, ref: entry.ref })}
                                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                                    title={`Delete ${entry.type}`}
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                      {(filteredLedgerEntries.length > 0 || openingBalanceRow) && (
                        <tfoot className="bg-slate-50 border-t-2 border-slate-900">
                          <tr>
                            <td colSpan={2} className="px-4 py-4 text-xs font-black text-slate-900 text-right uppercase">Closing Balance Summary</td>
                            <td className="px-4 py-4 text-xs font-black text-rose-600 text-right">₹{finalClosingDr.toLocaleString()}</td>
                            <td className="px-4 py-4 text-xs font-black text-emerald-600 text-right">₹{finalClosingCr.toLocaleString()}</td>
                            <td className={`px-4 py-4 text-xs font-black text-right ${finalClosingBal > 0 ? 'text-rose-600' : finalClosingBal < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                              ₹{Math.abs(finalClosingBal).toLocaleString()} {finalClosingBal > 0 ? 'Dr (Due)' : finalClosingBal < 0 ? 'Cr (Advance)' : 'Nil'}
                            </td>
                            <td className="px-4 py-4" data-html2pdf-ignore="true" />
                          </tr>
                        </tfoot>
                      )}
                    </table>

                   {/* Footer Info (Bank, QR and Signature) */}
                   <div className="flex justify-between items-start mt-8 pt-4">
                      <div className="flex flex-row gap-6 items-start">
                         {settings?.upiId && (() => {
                             if (finalClosingBal > 0) {
                               return (
                                 <div className="flex flex-col items-center gap-2 shrink-0">
                                   <QRCodeSVG value={`upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.firmName)}&am=${finalClosingBal}&cu=INR&tn=Ledger ${encodeURIComponent(selectedClient.tradeName || selectedClient.legalName)}`} size={80} />
                                   <span className="text-[11px] font-black uppercase text-slate-500">Scan to Settle (₹{finalClosingBal.toLocaleString()})</span>
                                 </div>
                               );
                             }
                             return null;
                          })()}
                         <div className="flex flex-col gap-1.5">
                            <p className="text-xs font-black uppercase text-slate-900 tracking-wider">Bank Details</p>
                            <p className="text-[11px] font-bold text-slate-700 uppercase">A/C Name: {settings?.accountName || 'N/A'}</p>
                            <p className="text-[11px] font-bold text-slate-700 uppercase">Bank: {settings?.bankName || 'N/A'}</p>
                            <p className="text-[11px] font-bold text-slate-700 uppercase">A/C No: {settings?.accountNo || 'N/A'}</p>
                            <p className="text-[11px] font-bold text-slate-700 uppercase">IFSC: {settings?.ifsc || 'N/A'}</p>
                         </div>
                      </div>
                      
                      <div className="w-64 space-y-2 text-right">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-left space-y-1">
                            <p className="text-[9px] font-black uppercase text-slate-400">Statement Summary</p>
                            <div className="flex justify-between text-xs font-bold text-slate-600">
                               <span>Total Invoiced (Debit)</span>
                               <span>₹{finalClosingDr.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold text-slate-600">
                               <span>Total Paid (Credit)</span>
                               <span>₹{finalClosingCr.toLocaleString()}</span>
                            </div>
                            <div className="h-px bg-slate-200 my-1" />
                            <div className={`flex justify-between text-sm font-black ${finalClosingBal > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                               <span>Outstanding Balance</span>
                               <span>₹{Math.abs(finalClosingBal).toLocaleString()} {finalClosingBal > 0 ? 'Dr' : finalClosingBal < 0 ? 'Cr' : ''}</span>
                            </div>
                          </div>
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
                                <span className="text-[11px] font-black uppercase text-slate-500">WhatsApp Us</span>
                              </div>
                            )}
                            <div className="text-center flex flex-col items-center shrink-0">
                               {settings?.firmSignature ? (
                                 <img src={settings.firmSignature} alt="Signature" className="h-16 object-contain mb-2" />
                               ) : (
                                 <div className="h-16 mb-2" />
                               )}
                               <p className="text-xs font-black uppercase text-slate-900">Authorized Signatory</p>
                               <p className="text-[11px] font-bold uppercase text-slate-400">{settings?.firmName}</p>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
           </div>
        </div>

        {/* Delete Confirmation Modal */}
        {entryToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" data-html2pdf-ignore="true">
            <div className="bg-white rounded-[2rem] max-w-md w-full border border-slate-100 shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-4 text-rose-600">
                <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Delete Ledger Entry?</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Permanently remove record</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase text-[10px]">Entry Details:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[10px]">Type:</span>
                    <p className="font-black text-slate-900 uppercase">{entryToDelete.type}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[10px]">Reference:</span>
                    <p className="font-black text-slate-900">{entryToDelete.ref}</p>
                  </div>
                </div>
              </div>

              <p className="text-xs font-bold text-slate-500 uppercase leading-relaxed text-slate-500">
                Are you sure? This action will permanently delete this {entryToDelete.type.toLowerCase()} from the database. This cannot be undone.
              </p>

              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setEntryToDelete(null)}
                  disabled={isDeleting}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 shadow-md"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Yes, Delete</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 w-full pb-4 min-h-0">
      <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm shrink-0">
        <button 
          onClick={onBack} 
          className="h-11 w-11 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors shrink-0"
          title="Go Back"
        >
          <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Search client ledgers by trade or legal name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600/10 outline-none" 
          />
        </div>
        <button
          onClick={handlePurgeDatabase}
          className="h-11 px-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors shrink-0"
          title="Purge deleted invoices and orphaned payments from database"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span className="hidden sm:inline">Clean Database</span>
        </button>
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
      

        {/* Delete Confirmation Modal */}
        {entryToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" data-html2pdf-ignore="true">
            <div className="bg-white rounded-[2rem] max-w-md w-full border border-slate-100 shadow-xl p-6 space-y-6 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-4 text-rose-600">
                <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Delete Ledger Entry?</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Permanently remove record</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase text-[10px]">Entry Details:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[10px]">Type:</span>
                    <p className="font-black text-slate-900 uppercase">{entryToDelete.type}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[10px]">Reference:</span>
                    <p className="font-black text-slate-900">{entryToDelete.ref}</p>
                  </div>
                </div>
              </div>

              <p className="text-xs font-bold text-slate-500 uppercase leading-relaxed text-slate-500">
                Are you sure? This action will permanently delete this {entryToDelete.type.toLowerCase()} from the database. This cannot be undone.
              </p>

              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setEntryToDelete(null)}
                  disabled={isDeleting}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 shadow-md"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Yes, Delete</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
</div>
    </div>
  );
};

export default ClientLedger;
