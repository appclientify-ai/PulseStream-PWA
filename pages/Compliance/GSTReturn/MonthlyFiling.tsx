
import React, { useState, useEffect, useMemo } from 'react';
import { Client } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';
import { useMonthlyFilingLogic, MONTHS, YEARS, getDefaultPeriod } from './filinglogic/MonthlyFilingLogic';

interface MonthlyFilingProps {
  onViewChange?: (view: string, extra?: any) => void;
}

const MonthlyFiling: React.FC<MonthlyFilingProps> = ({ onViewChange }) => {
  const defaultPeriod = getDefaultPeriod();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState(defaultPeriod.year);
  const [selectedMonth, setSelectedMonth] = useState(defaultPeriod.month);

  const [r1Filter, setR1Filter] = useState<'All' | 'Filed' | 'Pending'>('All');
  const [r3Filter, setR3Filter] = useState<'All' | 'Filed' | 'Pending'>('All');
  const [isR1FilterOpen, setIsR1FilterOpen] = useState(false);
  const [isR3FilterOpen, setIsR3FilterOpen] = useState(false);
  
  const [activeActionsId, setActiveActionsId] = useState<string | null>(null);
  const [editingPassId, setEditingPassId] = useState<string | null>(null);
  const [tempPass, setTempPass] = useState('');

  const { getStatus, toggleStatus, updateDueDate, getDueDate } = useMonthlyFilingLogic(selectedYear, selectedMonth);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const data = await api.getClients();
      setClients(data.filter(c => 
        (c.status === 'Active Filing' || c.status === 'Litigation') && 
        c.gstProfile?.regType === 'Regular' &&
        c.gstProfile?.filingFreq === 'Monthly'
      ));
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchClients(); }, []);

  const filteredClients = useMemo(() => {
    const s = search.toLowerCase();
    let list = clients.filter(c => 
      (c.legalName || '').toLowerCase().includes(s) || 
      (c.tradeName || '').toLowerCase().includes(s) ||
      (c.gstProfile?.gstin || '').toLowerCase().includes(s)
    );

    if (r1Filter !== 'All') list = list.filter(c => r1Filter === 'Filed' ? getStatus(c.id).r1 : !getStatus(c.id).r1);
    if (r3Filter !== 'All') list = list.filter(c => r3Filter === 'Filed' ? getStatus(c.id).r3b : !getStatus(c.id).r3b);

    return list;
  }, [clients, search, r1Filter, r3Filter, getStatus]);

  const stats = useMemo(() => {
    const total = filteredClients.length;
    const r1Filed = filteredClients.filter(c => getStatus(c.id).r1).length;
    const r3bFiled = filteredClients.filter(c => getStatus(c.id).r3b).length;
    return { total, r1Filed, r3bFiled };
  }, [filteredClients, getStatus]);

  const copyAndOpen = (id: string, username: string) => {
    navigator.clipboard.writeText(username);
    window.open(`https://services.gst.gov.in/services/login`, '_blank');
  };

  const handleUpdatePass = async (client: Client) => {
    if (!tempPass.trim()) return;
    const updated = { ...client, gstProfile: { ...client.gstProfile!, password: tempPass } };
    await api.saveClient(updated);
    setClients(prev => prev.map(c => c.id === client.id ? (updated as Client) : c));
    setEditingPassId(null);
  };

  const shareViaWhatsApp = (text: string) => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        
        <div className="flex items-center gap-4 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
            <p className="text-xl font-black text-slate-900 leading-none">{stats.total}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-4">
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">R1 Filed</p>
            <p className="text-xl font-black text-indigo-600 leading-none">{stats.r1Filed}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-4">
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">3B Filed</p>
            <p className="text-xl font-black text-emerald-600 leading-none">{stats.r3bFiled}</p>
          </div>
        </div>

        <div className="relative flex-1 w-full group">
          <input type="text" placeholder="Search entity in monthly matrix..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-4 focus:ring-indigo-50 outline-none" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex gap-2 shrink-0">
           <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-slate-50 rounded-xl px-3 py-3 text-[10px] font-black uppercase text-slate-600 cursor-pointer outline-none">{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
           <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-slate-50 rounded-xl px-3 py-3 text-[10px] font-black uppercase text-slate-600 cursor-pointer outline-none">{MONTHS.map(m => <option key={m} value={m}>{m}</option>)}</select>
           
           <div className="flex items-center bg-indigo-50 rounded-xl px-3 py-3 gap-2 border border-indigo-100">
             <span className="text-[8px] font-black text-indigo-400 uppercase whitespace-nowrap leading-none">R1 Due</span>
             <input type="date" value={getDueDate('r1')} onChange={e => updateDueDate('r1', e.target.value)} className="bg-transparent border-none p-0 text-[10px] font-black text-indigo-600 outline-none cursor-pointer uppercase w-[95px]" />
           </div>

           <div className="flex items-center bg-emerald-50 rounded-xl px-3 py-3 gap-2 border border-emerald-100">
             <span className="text-[8px] font-black text-emerald-400 uppercase whitespace-nowrap leading-none">3B Due</span>
             <input type="date" value={getDueDate('r3b')} onChange={e => updateDueDate('r3b', e.target.value)} className="bg-transparent border-none p-0 text-[10px] font-black text-emerald-600 outline-none cursor-pointer uppercase w-[95px]" />
           </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse table-fixed min-w-[1500px]">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[60px]">S.No</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[200px]">Trade Name</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[200px]">Legal Name</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[180px]">GSTIN</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center w-[120px] relative">
                  <div className="flex items-center justify-center gap-1">GSTR-1 <button onClick={() => setIsR1FilterOpen(!isR1FilterOpen)} className="p-1 hover:bg-slate-200 rounded"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg></button></div>
                  {isR1FilterOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-[400] p-1 animate-in zoom-in-95">
                      {['All', 'Filed', 'Pending'].map(f => <button key={f} onClick={() => { setR1Filter(f as any); setIsR1FilterOpen(false); }} className={`w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg ${r1Filter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50'}`}>{f}</button>)}
                    </div>
                  )}
                </th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center w-[120px] relative">
                  <div className="flex items-center justify-center gap-1">GSTR-3B <button onClick={() => setIsR3FilterOpen(!isR3FilterOpen)} className="p-1 hover:bg-slate-200 rounded"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg></button></div>
                  {isR3FilterOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-[400] p-1 animate-in zoom-in-95">
                      {['All', 'Filed', 'Pending'].map(f => <button key={f} onClick={() => { setR3Filter(f as any); setIsR3FilterOpen(false); }} className={`w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg ${r3Filter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50'}`}>{f}</button>)}
                    </div>
                  )}
                </th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[140px]">User ID</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[180px]">Password</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right w-[110px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((c, idx) => {
                const st = getStatus(c.id);
                return (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-all group border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2 font-black text-slate-300 text-[11px]">{idx + 1}</td>
                    <td className="px-4 py-2"><p className="font-black text-slate-900 uppercase truncate text-[12px]" title={c.tradeName}>{c.tradeName}</p></td>
                    <td className="px-4 py-2"><p className="font-bold text-slate-500 uppercase truncate text-[11px]" title={c.legalName}>{c.legalName}</p></td>
                    <td className="px-4 py-2">
                       <div className="flex items-center gap-1.5 group/gst">
                          <span className="font-black text-indigo-600 font-mono text-[11px]">{c.gstProfile?.gstin}</span>
                          <button onClick={() => { navigator.clipboard.writeText(c.gstProfile?.gstin || ''); window.open(`https://services.gst.gov.in/services/searchtp?gstin=${c.gstProfile?.gstin}`, '_blank'); }} 
                            className="p-1 text-slate-300 hover:text-indigo-600 transition-opacity opacity-0 group-hover/gst:opacity-100"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></button>
                       </div>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => toggleStatus(c.id, 'r1')} className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${st.r1 ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                        {st.r1 ? 'Filed' : 'Pending'}
                      </button>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => toggleStatus(c.id, 'r3b')} className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${st.r3b ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                        {st.r3b ? 'Filed' : 'Pending'}
                      </button>
                    </td>
                    <td className="px-4 py-2"><p className="font-black text-slate-700 text-[11px] truncate">{c.gstProfile?.username}</p></td>
                    <td className="px-4 py-2">
                       <div className="flex items-center justify-between group/pass max-w-[140px]">
                          {editingPassId === c.id ? (
                            <input autoFocus value={tempPass} onChange={e => setTempPass(e.target.value)} onBlur={() => handleUpdatePass(c)} onKeyDown={e => e.key === 'Enter' && handleUpdatePass(c)} className="bg-white border border-indigo-200 rounded px-2 py-0.5 text-xs font-black w-full" />
                          ) : (
                            <>
                              <span className="font-black text-indigo-600 tracking-wider truncate text-[11px]">{c.gstProfile?.password}</span>
                              <button onClick={() => { setEditingPassId(c.id); setTempPass(c.gstProfile?.password || ''); }} className="p-1 text-slate-300 hover:text-amber-500 opacity-0 group-hover/pass:opacity-100 transition-opacity"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                            </>
                          )}
                       </div>
                    </td>
                    <td className="px-4 py-2 text-right relative overflow-visible">
                       <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => copyAndOpen(c.id, c.gstProfile?.username || '')} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 flex items-center justify-center shadow-sm" title="Launch Portal"><svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></button>
                          <div className="relative">
                            <button onClick={() => setActiveActionsId(activeActionsId === c.id ? null : c.id)} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 flex items-center justify-center shadow-sm"><svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg></button>
                            {activeActionsId === c.id && (
                              <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[500] p-2 animate-in zoom-in-95 origin-top-right">
                                <button onClick={() => { shareViaWhatsApp(`*GST Credentials*\n*Entity:* ${c.tradeName}\n*GSTIN:* ${c.gstProfile?.gstin}\n*User:* ${c.gstProfile?.username}\n*Pass:* ${c.gstProfile?.password}`); setActiveActionsId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-50 rounded-xl transition-colors text-left group">
                                   <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></div>
                                   <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Share Credential</span>
                                </button>
                                <button onClick={() => { onViewChange?.('gst-view-detail', c); setActiveActionsId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-left group">
                                   <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg></div>
                                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">View Full Detail</span>
                                </button>
                              </div>
                            )}
                          </div>
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

export default MonthlyFiling;
