import { useQueryClient } from '@tanstack/react-query';
import { useModuleData } from '../../../hooks/useModuleData.ts';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { InvoiceRecord, Client, InvoiceSettings } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';
import { QRCodeSVG } from 'qrcode.react';

import html2pdf from 'html2pdf.js';
import { TableFilter } from '../../../components/TableFilter';
import { formatDate } from '../../../dateUtils.ts';
import { ViewControl } from '../../../components/ViewControl';
import {
  usePaginatedCategory,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
  useSettleInvoiceMutation
} from '../../../hooks/usePaginatedData';

interface InvoicesProps {
  onViewChange?: (view: string, extra?: any) => void;
}

const Invoices: React.FC<InvoicesProps> = ({ onViewChange }) => {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Draft' | 'Sent' | 'Partial' | 'Paid' | 'Cancelled'>('Active');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [compactMode, setCompactMode] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const { data: paginatedData, isLoading: isQueryLoading, isFetching } = usePaginatedCategory<InvoiceRecord>('invoice', page, limit, search);

  const updateInvoiceMutation = useUpdateInvoiceMutation();
  const deleteInvoiceMutation = useDeleteInvoiceMutation();
  const settleInvoiceMutation = useSettleInvoiceMutation();

  

  
  const { data: settings } = useModuleData<InvoiceSettings>('invoice_settings');

  const [settlingInvoice, setSettlingInvoice] = useState<InvoiceRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMode, setPayMode] = useState<'Cash' | 'Online' | 'Cheque' | 'UPI'>('Online');
  const [chequeNo, setChequeNo] = useState('');
  const [payAmount, setPayAmount] = useState<number | ''>('');

  const [previewInvoice, setPreviewInvoice] = useState<InvoiceRecord | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const previousDues = useMemo(() => {
    if (!previewInvoice) return [];
    return invoices.filter(i => {
      if (!i) return false;
      const isClientMatch = (i.clientId && previewInvoice.clientId && i.clientId === previewInvoice.clientId && i.clientId !== 'misc') ||
                            (i.clientName && previewInvoice.clientName && (i.clientName || '').trim().toLowerCase() === (previewInvoice.clientName || '').trim().toLowerCase());
      
      const isPrior = new Date(i.date || 0).getTime() < new Date(previewInvoice.date || 0).getTime() || 
                      (new Date(i.date || 0).getTime() === new Date(previewInvoice.date || 0).getTime() && (i.invoiceNo || '') < (previewInvoice.invoiceNo || ''));

      return isClientMatch && i.id !== previewInvoice.id && i.status !== 'Paid' && isPrior;
    });
  }, [previewInvoice, invoices]);

  const getOutstandingBalance = (inv: InvoiceRecord) => {
    if (!inv) return 0;
    if (inv.status === 'Paid') return 0;
    if (inv.status === 'Partial' && inv.balanceDue !== undefined) {
      return inv.balanceDue || 0;
    }
    const paid = inv.amountPaid || 0;
    const total = inv.totalAmount || 0;
    return Math.max(0, total - paid);
  };

  const totalPreviousDues = useMemo(() => {
    return previousDues.reduce((sum, inv) => sum + getOutstandingBalance(inv), 0);
  }, [previousDues]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (paginatedData) {
      if (paginatedData.items) {
        setInvoices(paginatedData.items.filter(Boolean));
      }
      setIsLoading(false);
    } else if (!isQueryLoading) {
      setIsLoading(false);
    }
  }, [paginatedData, isQueryLoading]);

  

  const filteredInvoices = useMemo(() => {
    const s = search.toLowerCase();
    let list = invoices.filter(i => {
      if (!i) return false;
      const invNo = (i.invoiceNo || '').toLowerCase();
      const cliName = (i.clientName || '').toLowerCase();
      const tradeName = (i.clientTradeName || '').toLowerCase();
      return invNo.includes(s) || cliName.includes(s) || tradeName.includes(s);
    }).sort((a, b) => {
      if (!a || !b) return 0;
      // Latest date first
      const timeA = new Date(a.date || 0).getTime();
      const timeB = new Date(b.date || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      
      // Extract numeric part from invoice number if present (e.g. INV-002 -> 2)
      const numA = parseInt((a.invoiceNo || '').replace(/\D/g, '')) || 0;
      const numB = parseInt((b.invoiceNo || '').replace(/\D/g, '')) || 0;
      if (numB !== numA) return numB - numA;

      return (b.invoiceNo || '').localeCompare(a.invoiceNo || '', undefined, { numeric: true });
    });

    if (statusFilter === 'Active') {
      list = list.filter(i => i && i.status !== 'Paid' && i.status !== 'Cancelled');
    } else if (statusFilter !== 'All') {
      list = list.filter(i => i && i.status === statusFilter);
    }
    return list;
  }, [invoices, search, statusFilter]);

  const handleReceiveConfirm = async () => {
    if (!settlingInvoice || isSaving) return;
    setIsSaving(true);
    settleInvoiceMutation.mutate(
      {
        id: settlingInvoice.id,
        paymentData: {
          date: payDate,
          mode: payMode,
          chequeNo: payMode === 'Cheque' ? chequeNo : undefined,
          amount: Number(payAmount)
        }
      },
      {
        onSettled: () => {
          setSettlingInvoice(null);
          setIsSaving(false);
        }
      }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      deleteInvoiceMutation.mutate(id);
    }
  };

  const handleEdit = (invoice: InvoiceRecord) => {
     onViewChange?.('admin-add-invoice', invoice);
  };

  const handleWhatsApp = (inv: InvoiceRecord) => {
    const text = `*Invoice from ${settings?.firmName || 'Vault'}*\n\nInv No: ${inv.invoiceNo}\nDate: ${formatDate(inv.date)}\nAmount: ₹${(inv.totalAmount || 0).toLocaleString()}\nDue Date: ${formatDate(inv.dueDate)}\n\nKindly settle the same. Thank you!`;
    const phone = inv.miscMobile || '';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleWhatsAppShare = () => {
    if (!previewInvoice || !printRef.current) return;
    
    // Auto-download PDF and open Whatsapp
    const opt = {
      margin: 10,
      filename: `Invoice_${previewInvoice.invoiceNo}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    const text = `*Invoice from ${settings?.firmName || 'Vault'}*\n\nInv No: ${previewInvoice.invoiceNo}\nDate: ${formatDate(previewInvoice.date)}\nAmount: ₹${(previewInvoice.totalAmount || 0).toLocaleString()}\nDue Date: ${formatDate(previewInvoice.dueDate)}\n\nKindly settle the same. Thank you!`;
    
    html2pdf().from(printRef.current).set(opt).output('blob').then(async (pdfBlob: Blob) => {
      const file = new File([pdfBlob], opt.filename, { type: 'application/pdf' });
      const nav = navigator as any;
      if (nav.canShare && nav.canShare({ files: [file] })) {
        try {
          await nav.share({
            title: 'Invoice',
            text: text,
            files: [file]
          });
          return;
        } catch (e) {
          console.error('Share failed', e);
        }
      }
      
      // Fallback: trigger download and open WhatsApp web
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = opt.filename;
      a.click();
      window.location.href = `whatsapp://send?phone=${previewInvoice.miscMobile || ''}&text=${encodeURIComponent(text)}`;
    });
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const printWindow = window.open('about:blank', '_blank', 'width=800,height=900');
    if (printWindow) {
      printWindow.document.write(`
        <html>
        <head>
          <title>Invoice - ${previewInvoice?.invoiceNo}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
              thead { display: table-header-group; }
              tfoot { display: table-footer-group; }
              .page-break { page-break-before: always; }
              @page { margin: 10mm; }
            }
          </style>
        </head>
        <body onload="setTimeout(() => { window.print(); window.close(); }, 800)">
          <div class="p-4 sm:p-10 max-w-5xl mx-auto relative">${printContent.innerHTML}</div>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const invoiceStats = useMemo(() => {
    return {
      total: invoices.length,
      active: invoices.filter(i => i.status !== 'Paid' && i.status !== 'Cancelled').length,
      sent: invoices.filter(i => i.status === 'Sent').length,
      paid: invoices.filter(i => i.status === 'Paid').length,
    };
  }, [invoices]);

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-3 pb-2 overflow-hidden animate-in fade-in duration-500 max-w-full mx-auto w-full">
      
      {/* Combined Search & Count Bar */}
      <div className="flex flex-col lg:flex-row items-center gap-2.5 bg-white p-2.5 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0 w-full">
        {/* Search input */}
        <div className="relative flex-1 w-full min-w-[200px] group">
          <input 
            type="text" 
            placeholder="Search by Invoice No or Client..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-2 pl-9 pr-8 font-bold text-[var(--app-font-size)] text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all" 
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full hover:bg-slate-200"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {/* Count Filter Buttons */}
        <div className="flex items-center gap-1.5 shrink-0 flex-nowrap overflow-x-auto no-scrollbar w-full lg:w-auto max-w-full py-0.5">
          <button
            type="button"
            onClick={() => setStatusFilter('All')}
            className={`px-2.5 py-1 rounded-xl text-[var(--app-font-size)] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 flex-shrink-0 whitespace-nowrap border cursor-pointer ${
              statusFilter === 'All'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Total</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[calc(var(--app-font-size)-1px)] font-bold shrink-0 ${
              statusFilter === 'All' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-800'
            }`}>
              {invoiceStats.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Active')}
            className={`px-2.5 py-1 rounded-xl text-[var(--app-font-size)] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 flex-shrink-0 whitespace-nowrap border cursor-pointer ${
              statusFilter === 'Active'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50/70 text-amber-800 border-amber-200 hover:bg-amber-100/80'
            }`}
          >
            <span>Active</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[calc(var(--app-font-size)-1px)] font-bold shrink-0 ${
              statusFilter === 'Active' ? 'bg-amber-500 text-white' : 'bg-amber-200/80 text-amber-900'
            }`}>
              {invoiceStats.active}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Sent')}
            className={`px-2.5 py-1 rounded-xl text-[var(--app-font-size)] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 flex-shrink-0 whitespace-nowrap border cursor-pointer ${
              statusFilter === 'Sent'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-blue-50/70 text-blue-800 border-blue-200 hover:bg-blue-100/80'
            }`}
          >
            <span>Sent</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[calc(var(--app-font-size)-1px)] font-bold shrink-0 ${
              statusFilter === 'Sent' ? 'bg-blue-500 text-white' : 'bg-blue-200/80 text-blue-900'
            }`}>
              {invoiceStats.sent}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Paid')}
            className={`px-2.5 py-1 rounded-xl text-[var(--app-font-size)] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 flex-shrink-0 whitespace-nowrap border cursor-pointer ${
              statusFilter === 'Paid'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-emerald-50/70 text-emerald-800 border-emerald-200 hover:bg-emerald-100/80'
            }`}
          >
            <span>Paid</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[calc(var(--app-font-size)-1px)] font-bold shrink-0 ${
              statusFilter === 'Paid' ? 'bg-emerald-500 text-white' : 'bg-emerald-200/80 text-emerald-900'
            }`}>
              {invoiceStats.paid}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-nowrap overflow-x-auto no-scrollbar max-w-full w-full lg:w-auto justify-start sm:justify-end py-0.5">
          <ViewControl 
            viewMode={viewMode} 
            onViewChange={setViewMode} 
            compactMode={compactMode} 
            onCompactToggle={() => setCompactMode(!compactMode)} 
          />
          <button 
            type="button"
            onClick={() => onViewChange?.('admin-client-ledger', 'admin-invoices')} 
            className="bg-purple-600 text-white font-bold uppercase tracking-wider px-2.5 sm:px-3 h-9 rounded-xl hover:bg-purple-700 transition-all text-[var(--app-font-size)] flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer whitespace-nowrap"
          >
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Ledger</span>
          </button>
          <button 
            type="button"
            onClick={() => onViewChange?.('admin-invoicesetting')} 
            className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider px-2.5 sm:px-3 h-9 rounded-xl hover:bg-slate-200 transition-all text-[var(--app-font-size)] flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap border border-slate-200"
          >
            <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Settings</span>
          </button>
          <button 
            type="button"
            onClick={() => onViewChange?.('admin-add-invoice')} 
            className="bg-indigo-600 text-white font-bold uppercase tracking-wider px-3 sm:px-4 h-9 rounded-xl shadow-xs hover:bg-indigo-700 transition-all text-[var(--app-font-size)] flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
          >
            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create</span>
          </button>
        </div>
      </div>

      {/* Main Container: Table or Grid */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        {viewMode === 'grid' ? (
          <div className="overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 flex-1">
            {filteredInvoices.length === 0 ? (
              <div className="col-span-full text-center py-8 text-slate-400 font-bold text-[var(--app-font-size)] uppercase tracking-wider">
                No invoices found matching criteria.
              </div>
            ) : (
              filteredInvoices.map((inv, idx) => (
                <div key={inv.id} className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-all shadow-xs flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[calc(var(--app-font-size)-2px)] font-bold text-slate-400 uppercase tracking-wider">Invoice #{idx + 1}</div>
                      <h4 className="text-[var(--app-font-size)] font-bold text-slate-800 tracking-tight uppercase mt-0.5">{inv.invoiceNo}</h4>
                      <p className="text-[calc(var(--app-font-size)-1.5px)] font-normal text-slate-500 mt-0.5">{formatDate(inv.date)}</p>
                    </div>
                    <span className="text-[calc(var(--app-font-size)+2px)] font-bold text-indigo-600">
                      ₹{(inv.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="text-[var(--app-font-size)] font-bold text-slate-800 truncate">
                      {inv.clientTradeName || inv.clientName}
                    </div>
                    {inv.clientTradeName && inv.clientName && inv.clientTradeName !== inv.clientName && (
                      <div className="text-[calc(var(--app-font-size)-1.5px)] font-normal text-slate-500 truncate mt-0.5">
                        Legal: {inv.clientName}
                      </div>
                    )}
                    {inv.status === 'Partial' && inv.balanceDue && (
                      <div className="text-[calc(var(--app-font-size)-1.5px)] font-bold text-amber-600 mt-0.5">Due: ₹{inv.balanceDue.toLocaleString()}</div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                    <select
                      value={inv.status}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'Paid' || val === 'Partial') {
                          setSettlingInvoice(inv);
                          setPayAmount((inv.totalAmount || 0) - (inv.amountPaid || 0));
                        } else {
                          const updated = { ...inv, status: val as any };
                          updateInvoiceMutation.mutate(updated);
                        }
                      }}
                      className={`px-2 py-1 rounded-lg text-[calc(var(--app-font-size)-1.5px)] font-bold uppercase tracking-wider border outline-none cursor-pointer ${
                        inv.status === 'Sent' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                        inv.status === 'Partial' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                        inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Sent">Sent</option>
                      <option value="Partial">Partial</option>
                      <option value="Paid">Paid</option>
                    </select>

                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(inv)} className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-blue-600 flex items-center justify-center cursor-pointer" title="Edit">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => setPreviewInvoice(inv)} className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-indigo-600 flex items-center justify-center cursor-pointer" title="Preview">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      <button onClick={() => handleWhatsApp(inv)} className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-emerald-600 flex items-center justify-center cursor-pointer" title="WhatsApp">
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                      </button>
                      <button onClick={() => handleDelete(inv.id)} className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-red-600 flex items-center justify-center cursor-pointer" title="Delete">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="w-full overflow-x-auto overflow-y-auto no-scrollbar flex-1 relative h-full">
            <table className={`w-full text-left border-collapse table-auto min-w-[900px] invoices-table gst-portfolio-table compact-table ${compactMode ? 'compact-mode' : ''}`}>
              <thead className="sticky top-0 z-30 bg-slate-100">
                <tr className="bg-slate-50 border-b border-slate-200 shadow-2xs">
                  <th className="sticky top-0 z-30 bg-slate-100 px-2 py-2.5 text-[var(--table-header-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 whitespace-nowrap w-12">S.No.</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-2 py-2.5 text-[var(--table-header-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 whitespace-nowrap min-w-[100px]">Inv. No.</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-2 py-2.5 text-[var(--table-header-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 whitespace-nowrap min-w-[95px]">Date</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-2 py-2.5 text-[var(--table-header-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 min-w-[180px]">Client (Trade/Legal)</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-2 py-2.5 text-[var(--table-header-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 whitespace-nowrap min-w-[110px]">Amount</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-2 py-2.5 text-[var(--table-header-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 text-center min-w-[110px] whitespace-nowrap">
                    <div className="flex justify-center flex-col items-center">
                      <TableFilter label="Status" isActive={statusFilter !== 'All'}>
                        {['All', 'Active', 'Draft', 'Sent', 'Partial', 'Paid', 'Cancelled'].map(st => (
                          <button key={st} onClick={() => setStatusFilter(st as any)} className={`w-full text-left px-3 py-1.5 text-[var(--table-font-size)] font-bold uppercase rounded-lg ${statusFilter === st ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{st}</button>
                        ))}
                      </TableFilter>
                    </div>
                  </th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-2 py-2.5 text-[var(--table-header-font-size)] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 text-right min-w-[130px] whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[var(--table-font-size)]">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-2 py-8 text-center text-slate-400 font-bold uppercase tracking-wider text-[var(--table-font-size)]">
                      No invoices found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv, idx) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-all group text-[var(--table-font-size)] border-b border-slate-100">
                      <td className="px-2 py-2.5 text-slate-400 font-bold whitespace-nowrap">{idx + 1}</td>
                      <td className="px-2 py-2.5 font-bold text-slate-900 uppercase font-mono whitespace-nowrap">{inv.invoiceNo}</td>
                      <td className="px-2 py-2.5 font-medium text-slate-600 whitespace-nowrap">{formatDate(inv.date)}</td>
                      <td className="px-2 py-2.5 max-w-[280px]">
                        <p className="font-bold text-slate-800 uppercase leading-snug text-[var(--table-font-size)]" title={inv.clientTradeName || inv.clientName}>
                          {inv.clientTradeName || inv.clientName || '---'}
                        </p>
                        {inv.clientTradeName && inv.clientName && inv.clientTradeName !== inv.clientName && (
                          <p className="sub-text text-slate-500 uppercase mt-0.5 text-[calc(var(--table-font-size)-1.5px)] font-medium" title={inv.clientName}>
                            Legal: {inv.clientName}
                          </p>
                        )}
                        {inv.clientGstin && (
                          <p className="sub-text text-slate-500 uppercase mt-0.5 text-[calc(var(--table-font-size)-1.5px)] font-medium">
                            GSTIN: {inv.clientGstin}
                          </p>
                        )}
                      </td>
                      <td className="px-2 py-2.5 font-bold text-indigo-700 whitespace-nowrap">
                        ₹{(inv.totalAmount || 0).toLocaleString()}
                        {inv.status === 'Partial' && inv.balanceDue && (
                          <div className="text-[calc(var(--table-font-size)-1.5px)] text-amber-600 font-bold">Due: ₹{(inv.balanceDue || 0).toLocaleString()}</div>
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-center whitespace-nowrap">
                        <select
                          value={inv.status}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'Paid' || val === 'Partial') {
                              setSettlingInvoice(inv);
                              setPayAmount((inv.totalAmount || 0) - (inv.amountPaid || 0));
                            } else {
                              const updated = { ...inv, status: val as any };
                              updateInvoiceMutation.mutate(updated);
                            }
                          }}
                          className={`px-2 py-1 rounded-lg text-[calc(var(--table-font-size)-1px)] font-bold uppercase tracking-wider border outline-none cursor-pointer ${
                            inv.status === 'Sent' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                            inv.status === 'Partial' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                            inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                            'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          <option value="Draft">Draft</option>
                          <option value="Sent">Sent</option>
                          <option value="Partial">Partial</option>
                          <option value="Paid">Paid</option>
                        </select>
                      </td>
                      <td className="px-2 py-2.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => handleEdit(inv)} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-blue-600 transition-all flex items-center justify-center shadow-2xs cursor-pointer" title="Edit Invoice">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => setPreviewInvoice(inv)} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-indigo-600 transition-all flex items-center justify-center shadow-2xs cursor-pointer" title="Preview Invoice">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                          <button onClick={() => handleWhatsApp(inv)} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-emerald-600 transition-all flex items-center justify-center shadow-2xs cursor-pointer" title="Share on WhatsApp">
                            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                          </button>
                          <button onClick={() => handleDelete(inv.id)} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-red-600 transition-all flex items-center justify-center shadow-2xs cursor-pointer" title="Delete Invoice">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      
      {/* Settling Modal */}
      {settlingInvoice && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden flex flex-col p-8 space-y-6">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Record Payment</h3>
              
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Amount Received</label>
                <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none focus:ring-4 focus:ring-emerald-50"
                  value={payAmount} onChange={e => setPayAmount(Number(e.target.value))} />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Payment Date</label>
                <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none focus:ring-4 focus:ring-emerald-50"
                  value={payDate} onChange={e => setPayDate(e.target.value)} />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Payment Mode</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none focus:ring-4 focus:ring-emerald-50"
                  value={payMode} onChange={e => setPayMode(e.target.value as any)}>
                  <option value="Online">Online / NEFT</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              {payMode === 'Cheque' && (
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Cheque / Reference No</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none uppercase focus:ring-4 focus:ring-emerald-50"
                    value={chequeNo} onChange={e => setChequeNo(e.target.value)} placeholder="000000" />
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setSettlingInvoice(null)} className="flex-1 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px] border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
                <button type="button" disabled={isSaving} onClick={handleReceiveConfirm} className="flex-[2] bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-xl shadow-xl hover:bg-slate-900 transition-all active:scale-[0.98]">Confirm Payment</button>
              </div>
           </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {previewInvoice && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                 <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Invoice Preview</h3>
                 <div className="flex gap-2">
                    <button onClick={handleWhatsAppShare} className="h-10 px-6 bg-emerald-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 transition-all shadow-lg flex items-center gap-2">
                       <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                       WhatsApp
                    </button>
                    <button onClick={handlePrint} className="h-10 px-6 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 transition-all shadow-lg flex items-center gap-2">
                       <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                       Print
                    </button>
                    <button onClick={() => setPreviewInvoice(null)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-colors">
                       <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto bg-white">
              <div className="p-8 relative" ref={printRef}>
                 {settings?.watermark && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none z-0 overflow-hidden">
                       <img src={settings.watermark} alt="Watermark" className="w-[80%] object-contain mix-blend-multiply grayscale" />
                    </div>
                 )}

                 {/* Printable Content */}
                 <div className="space-y-8 relative z-10">
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
                          <h2 className="text-4xl font-black text-slate-200 uppercase tracking-tighter">Invoice</h2>
                          {previewInvoice.status === 'Paid' && (
                             <div className="mt-2 inline-block border-2 border-emerald-500 text-emerald-600 px-3 py-1 rounded-lg bg-emerald-50">
                                <p className="text-xl font-black uppercase tracking-widest leading-none">PAID</p>
                             </div>
                          )}
                          <div className="mt-4 space-y-1">
                             <p className="text-xs font-bold text-slate-500 uppercase">Invoice No: <span className="text-slate-900">{previewInvoice.invoiceNo}</span></p>
                             <p className="text-xs font-bold text-slate-500 uppercase">Date: <span className="text-slate-900">{formatDate(previewInvoice.date)}</span></p>
                             <p className="text-xs font-bold text-slate-500 uppercase">Due Date: <span className="text-slate-900">{formatDate(previewInvoice.dueDate)}</span></p>
                          </div>
                       </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Bill To</p>
                       <h3 className="text-lg font-black uppercase text-slate-900">{previewInvoice.clientName}</h3>{previewInvoice.clientTradeName && <p className="text-xs font-bold text-slate-500 uppercase mt-1">{previewInvoice.clientTradeName}</p>}
                       {previewInvoice.clientGstin && previewInvoice.clientGstin !== 'N/A' && <p className="text-xs font-bold text-slate-500 uppercase mt-1">GSTIN: {previewInvoice.clientGstin}</p>}
                       {previewInvoice.miscAddress && <p className="text-xs font-bold text-slate-500 uppercase mt-1">{previewInvoice.miscAddress}</p>}
                       <p className="text-xs font-bold text-slate-500 uppercase mt-1">Mobile: {previewInvoice.miscMobile || 'N/A'}</p>
                    </div>

                    <table className="w-full text-left border-collapse">
                       <thead>
                          <tr className="border-b-2 border-slate-900">
                             <th className=" py-3 text-xs font-black uppercase text-slate-900 tracking-widest w-8 text-center">#</th>
                             <th className=" py-3 text-xs font-black uppercase text-slate-900 tracking-widest w-24">Period / AY</th>
                             <th className=" py-3 text-xs font-black uppercase text-slate-900 tracking-widest">Description of Compliance Service</th>
                             <th className=" py-3 text-xs font-black uppercase text-slate-900 tracking-widest w-16 text-center">Qty/M</th>
                             <th className=" py-3 text-xs font-black uppercase text-slate-900 tracking-widest w-24 text-right">Rate(/₹)</th>
                             {settings?.isGstEnabled && <th className=" py-3 text-xs font-black uppercase text-slate-900 tracking-widest w-16 text-center">GST</th>}
                             <th className=" py-3 text-xs font-black uppercase text-slate-900 tracking-widest w-24 text-right">Total(/₹)</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {(previewInvoice.items || []).map((item, i) => (
                             <tr key={i}>
                                <td className=" py-4 text-center text-xs font-bold text-slate-500">{i + 1}</td>
                                <td className=" py-4 text-xs font-semibold text-slate-700">{item.period || '-'}</td>
                                <td className=" py-4 text-xs font-semibold text-slate-800">{item.description}</td>
                                <td className=" py-4 text-center text-xs font-semibold text-slate-700">{item.quantity}</td>
                                <td className=" py-4 text-right text-xs font-semibold text-slate-700">{item.rate}</td>
                                {settings?.isGstEnabled && <td className=" py-4 text-center text-xs font-semibold text-slate-700">{item.taxRate}%</td>}
                                <td className=" py-4 text-right text-xs font-bold text-slate-900">{((item.rate || 0) * (item.quantity || 1)).toLocaleString()}</td>
                             </tr>
                          ))}
                          {previousDues.map((prevInv) => {
                             const outstanding = getOutstandingBalance(prevInv);
                             if (outstanding <= 0) return null;
                             return (
                                <tr key={`prev-${prevInv.id}`} className="bg-rose-50/20 border-t border-slate-200">
                                   <td className=" py-4 text-center text-xs font-black text-rose-600">P</td>
                                   <td className=" py-4 text-[10px] font-bold text-rose-700 uppercase">{formatDate(prevInv.date)}</td>
                                   <td className=" py-4 text-[10px] font-black text-rose-700">Previous Outstanding Due (Inv: {prevInv.invoiceNo})</td>
                                   <td className=" py-4 text-center text-[10px] font-bold text-rose-700">1</td>
                                   <td className=" py-4 text-right text-[10px] font-bold text-rose-700">{outstanding.toLocaleString()}</td>
                                   {settings?.isGstEnabled && <td className=" py-4 text-center text-[10px] font-bold text-rose-700">0%</td>}
                                   <td className=" py-4 text-right text-[10px] font-black text-rose-700">{outstanding.toLocaleString()}</td>
                                </tr>
                             );
                          })}
                       </tbody>
                    </table>

                    <div className="flex justify-between items-start mt-4">
                       <div className="flex flex-row gap-6 pt-2 items-start">
                          {settings?.upiId && (
                            <div className="flex flex-col items-center gap-2">
                              <QRCodeSVG value={`upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.firmName)}&am=${(previewInvoice.totalAmount || 0) + totalPreviousDues}&cu=INR&tn=Invoice ${previewInvoice.invoiceNo}`} size={80} />
                              <span className="text-[11px] font-black uppercase text-slate-500">Scan to Pay</span>
                            </div>
                          )}
                          <div className="flex flex-col gap-1.5">
                             <p className="text-xs font-black uppercase text-slate-900 tracking-wider">Bank Details</p>
                             <p className="text-[11px] font-bold text-slate-700 uppercase">A/C Name: {settings?.accountName || 'N/A'}</p>
                             <p className="text-[11px] font-bold text-slate-700 uppercase">Bank: {settings?.bankName || 'N/A'}</p>
                             <p className="text-[11px] font-bold text-slate-700 uppercase">A/C No: {settings?.accountNo || 'N/A'}</p>
                             <p className="text-[11px] font-bold text-slate-700 uppercase">IFSC: {settings?.ifsc || 'N/A'}</p>
                          </div>
                       </div>
                       <div className="w-64 space-y-3">
                           <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                              <span>Sub Total</span>
                              <span>₹{(previewInvoice.subTotal || 0).toLocaleString()}</span>
                           </div>
                           {settings?.isGstEnabled && (
                              <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                                 <span>Total Tax</span>
                                 <span>₹{(previewInvoice.totalTax || 0).toLocaleString()}</span>
                              </div>
                           )}
                           {totalPreviousDues > 0 && (
                              <div className="flex justify-between text-xs font-black text-rose-600 uppercase">
                                 <span>Previous Dues</span>
                                 <span>₹{totalPreviousDues.toLocaleString()}</span>
                              </div>
                           )}
                           <div className="h-px bg-slate-200" />
                           <div className="flex justify-between text-lg font-black text-slate-900 uppercase">
                              <span>Grand Total</span>
                              <span>₹{((previewInvoice.totalAmount || 0) + totalPreviousDues).toLocaleString()}</span>
                           </div>
                        </div>
                     </div>

                    <div className="pt-8 border-t border-slate-100 mt-8">
                       <div className="flex justify-between items-end">
                          <div className="text-[8px] leading-tight font-bold text-slate-500 uppercase whitespace-pre-wrap max-w-sm">
                             <p className="text-slate-900 font-black mb-1">Terms & Conditions:</p>
                             <p className="mt-1">{settings?.terms || '1. Payment is due within 15 days.\n2. Please quote invoice number in all correspondence.'}</p>
                          </div>
                          <div className="flex gap-12 items-end">
                             {settings?.whatsappNumber && (
                               <div className="flex flex-col items-center gap-2">
                                 <QRCodeSVG value={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(`Hello, regarding invoice ${previewInvoice.invoiceNo}`)}`} size={80} />
                                 <span className="text-[11px] font-black uppercase text-slate-500">WhatsApp Us</span>
                               </div>
                             )}
                             <div className="text-center flex flex-col items-center">
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
        </div>
      )}
    </div>
  );
};

export default Invoices;
