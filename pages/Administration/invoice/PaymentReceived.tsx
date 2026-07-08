
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PaymentRecord, Client, InvoiceSettings } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';

interface PaymentReceivedProps {
  onViewChange?: (view: string, extra?: any) => void;
}

const PaymentReceived: React.FC<PaymentReceivedProps> = ({ onViewChange }) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const handleDelete = async (id: string) => { if(confirm('Delete payment record?')) { await api.deletePayment(id); fetchRecords(); } };
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [pays, sets] = await Promise.all([api.getPayments(), api.getInvoiceSettings()]);
      setPayments(pays);
      setSettings(sets);
    } finally {
      setIsLoading(false);
    }
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

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 max-w-full mx-auto w-full overflow-hidden pb-10">
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Collections</p>
            <p className="text-xl font-black text-slate-900 leading-none">₹{filteredPayments.reduce((acc,p)=>acc+p.amount, 0).toLocaleString()}</p>
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
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Client</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Payment Date</th>
                <th className=" px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Mode</th>
<th className=" px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map((pay, idx) => (
                <tr key={pay.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className=" px-6 py-6 text-slate-300 font-black text-[12px]">{idx + 1}</td>
                  <td className=" px-6 py-6 font-black text-slate-400 text-[11px] uppercase">{pay.invoiceNo || '---'}</td>
                  <td className=" px-6 py-6 font-black text-slate-900 text-[12px] uppercase truncate">{pay.clientName}</td>
                  <td className=" px-6 py-6 font-black text-emerald-600 text-[12px]">₹{pay.amount.toLocaleString()}</td>
                  <td className=" px-6 py-6 font-black text-slate-700 text-[11px] uppercase">{pay.date.split('-').reverse().join('-')}</td>
                  <td className=" px-4 py-6">
                    <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase bg-slate-100 text-slate-600">{pay.mode}</span>
                  </td>
                  <td className="px-4 py-6 text-right">
                    <button onClick={() => handleDelete(pay.id)} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-red-600 transition-all flex items-center justify-center shadow-sm" title="Delete Payment">
                       <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceived;
