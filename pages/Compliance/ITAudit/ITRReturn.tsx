
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Client } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';
import { useITRReturnLogic, RefundStatus } from './ITRReturnlogic';
import { YEARS } from '../GSTReturn/filinglogic/MonthlyFilingLogic';

const ITRReturn: React.FC = () => {
  const getPreviousAY = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const startYear = currentMonth >= 3 ? currentYear : currentYear - 1;
    return `${startYear}-${(startYear + 1).toString().slice(-2)}`;
  };

  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAY, setSelectedAY] = useState(getPreviousAY());
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'All' | 'Filed' | 'Pending'>('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [refundStatusFilter, setRefundStatusFilter] = useState<'All' | 'Pending' | 'Received' | 'No Refund'>('All');
  const [isRefundFilterOpen, setIsRefundFilterOpen] = useState(false);

  // Modals & Tools
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoginBoxOpen, setIsLoginBoxOpen] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  const { getStatus, toggleStatus, updateFilingDate, cycleRefundStatus, updateDueDate, getDueDate } = useITRReturnLogic(selectedAY);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const data = await api.getClients();
      setClients(data.filter(c => !!c.itProfile && (c.status === 'Active')));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const getClientDisplayId = useCallback((client: Client) => {
    const itGroup = clients.slice().sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    const rank = itGroup.findIndex(c => c.id === client.id) + 1;
    return `IT/${rank.toString().padStart(2, '0')}`;
  }, [clients]);

  const filteredClients = useMemo(() => {
    let list = clients.filter(c => 
      (c.legalName || '').toLowerCase().includes(search.toLowerCase()) || 
      (c.itProfile?.pan || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.itProfile?.fatherName || '').toLowerCase().includes(search.toLowerCase())
    );
    
    if (statusFilter !== 'All') {
      list = list.filter(c => statusFilter === 'Filed' ? getStatus(c.id).filed : !getStatus(c.id).filed);
    }

    if (refundStatusFilter !== 'All') {
      list = list.filter(c => {
        const rs = getStatus(c.id).refundStatus || 'N/A';
        if (refundStatusFilter === 'Pending') return rs === 'Pending';
        if (refundStatusFilter === 'Received') return rs === 'Issued' || rs === 'Processed';
        if (refundStatusFilter === 'No Refund') return rs === 'N/A';
        return true;
      });
    }

    return list;
  }, [clients, search, statusFilter, refundStatusFilter, getStatus]);

  const handleExport = () => {
    const headers = ["ID", "Name", "Father Name", "Status", "Filing Date", "Refund Status", "PAN", "Password"].join(",");
    const rows = filteredClients.map(c => {
      const s = getStatus(c.id);
      return [
        getClientDisplayId(c),
        c.legalName,
        c.itProfile?.fatherName,
        s.filed ? 'Filed' : 'Pending',
        s.date || '---',
        s.refundStatus || 'N/A',
        c.itProfile?.pan,
        c.itProfile?.password
      ].map(v => `"${v || ''}"`).join(",");
    }).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `ITR_Return_${selectedAY}.csv`; a.click();
  };

  const getRefundColor = (st?: string) => {
    switch (st) {
      case 'Issued':
      case 'Processed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-300 border-slate-100';
    }
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-4 px-2 animate-in fade-in duration-500 max-w-full mx-auto w-full overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Vault</p>
            <p className="text-xl font-black text-slate-900 leading-none">{filteredClients.length}</p>
          </div>
        </div>

        <div className="relative flex-1 group w-full">
          <input type="text" placeholder="Search by name, pan or father..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handleExport} className="h-11 w-11 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
          <select value={selectedAY} onChange={e => setSelectedAY(e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer">{YEARS.map(y => <option key={y} value={y}>AY {y}</option>)}</select>
          <div className="flex items-center bg-slate-50 rounded-xl px-4 py-3 gap-2 border border-transparent focus-within:border-indigo-100 transition-all">
            <span className="text-[9px] font-black text-slate-400 uppercase whitespace-nowrap">Due:</span>
            <input type="date" value={getDueDate()} onChange={e => updateDueDate(e.target.value)} className="bg-transparent border-none p-0 text-[11px] font-black text-slate-600 outline-none cursor-pointer uppercase" />
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1 w-full">
          <table className="w-full text-left border-collapse table-fixed min-w-[1550px]">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100 shadow-sm text-[14px] font-bold uppercase tracking-widest text-slate-900">
                <th className="px-6 py-5 w-[90px]">ID no.</th>
                <th className="px-6 py-5 w-[220px]">Name</th>
                <th className="px-6 py-5 w-[180px]">Father Name</th>
                <th className="px-6 py-5 w-[140px] text-center relative">
                  <div className="flex items-center justify-center gap-1">Status <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="p-1 hover:bg-slate-200 rounded transition-colors"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg></button></div>
                  {isFilterOpen && <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 animate-in zoom-in-95">{['All', 'Filed', 'Pending'].map(f => <button key={f} onClick={() => { setStatusFilter(f as any); setIsFilterOpen(false); }} className={`w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg ${statusFilter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{f}</button>)}</div>}
                </th>
                <th className="px-6 py-5 w-[150px]">Filing Date</th>
                <th className="px-6 py-5 w-[160px] text-center relative">
                  <div className="flex items-center justify-center gap-1">Refund Status <button onClick={() => setIsRefundFilterOpen(!isRefundFilterOpen)} className="p-1 hover:bg-slate-200 rounded transition-colors"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg></button></div>
                  {isRefundFilterOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 animate-in zoom-in-95">
                      {['All', 'Pending', 'Received', 'No Refund'].map(f => (
                        <button key={f} onClick={() => { setRefundStatusFilter(f as any); setIsRefundFilterOpen(false); }} className={`w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg ${refundStatusFilter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{f}</button>
                      ))}
                    </div>
                  )}
                </th>
                <th className="px-6 py-5 w-[160px]">Pan No.</th>
                <th className="px-6 py-5 w-[160px]">Password</th>
                <th className="px-6 py-5 w-[110px] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client) => {
                const status = getStatus(client.id);
                const isPassVisible = visiblePasswords.has(client.id);
                return (
                  <tr key={client.id} className="group hover:bg-indigo-50/10 transition-all h-[44px] text-[12px]">
                    <td className="px-6 py-[2px] font-black text-indigo-400 font-mono">{getClientDisplayId(client)}</td>
                    <td className="px-6 py-[2px] font-black text-slate-900 uppercase truncate" title={client.legalName}>{client.legalName}</td>
                    <td className="px-6 py-[2px] font-bold text-slate-500 uppercase truncate">{client.itProfile?.fatherName || '---'}</td>
                    <td className="px-6 py-[2px] text-center">
                       <button onClick={() => toggleStatus(client.id)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${status.filed ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{status.filed ? 'Filed' : 'Pending'}</button>
                    </td>
                    <td className="px-6 py-[2px]">
                       {status.filed ? (
                         <input type="date" value={status.date || ''} onChange={e => updateFilingDate(client.id, e.target.value)} className="bg-transparent border-none p-0 text-[11px] font-black text-slate-600 outline-none uppercase" />
                       ) : <span className="text-slate-200 font-black tracking-widest text-[10px]">Awaiting Filing</span>}
                    </td>
                    <td className="px-6 py-[2px] text-center">
                       <button onClick={() => status.filed && cycleRefundStatus(client.id)} disabled={!status.filed} className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase border transition-all ${getRefundColor(status.refundStatus)} ${!status.filed ? 'opacity-30 grayscale' : 'hover:shadow-sm'}`}>
                          {status.refundStatus || 'N/A'}
                       </button>
                    </td>
                    <td className="px-6 py-[2px] font-black text-indigo-600 font-mono tracking-widest uppercase">{client.itProfile?.pan}</td>
                    <td className="px-6 py-[2px]">
                       <div className="flex items-center gap-2 group/pass">
                          <span className="font-black text-slate-400 tracking-wider truncate">{isPassVisible ? client.itProfile?.password : '••••••••'}</span>
                          <button onClick={() => setVisiblePasswords(prev => { const n = new Set(prev); n.has(client.id) ? n.delete(client.id) : n.add(client.id); return n; })} className="p-1 text-slate-300 hover:text-indigo-600 opacity-0 group-hover/pass:opacity-100 transition-all">{isPassVisible ? '🙈' : '👁️'}</button>
                       </div>
                    </td>
                    <td className="px-6 py-[2px] text-right">
                       <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setSelectedClient(client); setIsLoginBoxOpen(true); }} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 flex items-center justify-center transition-all shadow-sm"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14" /></svg></button>
                       </div>
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

export default ITRReturn;
