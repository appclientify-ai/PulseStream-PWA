import React, { useState, useEffect, useMemo } from 'react';
import { Client } from '../../../types';
import { mockBackend } from '../../../services/mockBackend';
import ITClientFormModal from '../../Clientform/ITClientFormModal';
import Loader from '../../../components/Loader';
import { useITRReturnLogic } from './ITRReturnlogic';
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
  const [statusFilter, setStatusFilter] = useState<'All' | 'Filed' | 'Pending'>('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  const { getStatus, toggleStatus, updateDueDate, getDueDate } = useITRReturnLogic(selectedAY);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const data = await mockBackend.getClients();
      setClients(data.filter(c => !!c.itProfile && c.status === 'Active'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const financialYearDisplay = useMemo(() => {
    if (!selectedAY.includes('-')) return '';
    const [start] = selectedAY.split('-');
    return `${parseInt(start) - 1}-${start.slice(-2)}`;
  }, [selectedAY]);

  const filteredClients = useMemo(() => {
    let list = clients.filter(c => 
      (c.legalName || '').toLowerCase().includes(search.toLowerCase()) || 
      (c.itProfile?.pan || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.itProfile?.fatherName || '').toLowerCase().includes(search.toLowerCase())
    );
    if (statusFilter !== 'All') {
      list = list.filter(c => statusFilter === 'Filed' ? getStatus(c.id).filed : !getStatus(c.id).filed);
    }
    return list;
  }, [clients, search, statusFilter, getStatus]);

  const stats = useMemo(() => {
    const total = filteredClients.length;
    const filed = filteredClients.filter(c => getStatus(c.id).filed).length;
    return { total, filed };
  }, [filteredClients, getStatus]);

  const saveQuickPassword = async (client: Client) => {
    try {
      const updated = { ...client, itProfile: { ...client.itProfile!, password: newPasswordValue } };
      await mockBackend.saveClient(updated);
      setClients(prev => prev.map(c => c.id === client.id ? (updated as Client) : c));
      setEditingPasswordId(null);
    } catch (err) { alert("Update failed"); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 max-w-full mx-auto w-full overflow-hidden">
      
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <div className="flex items-center gap-1 mb-1">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">AY {selectedAY}</p>
               <span className="text-[8px] font-bold text-indigo-400 bg-indigo-50 px-1 rounded">FY {financialYearDisplay}</span>
            </div>
            <p className="text-xl font-black text-slate-900 leading-none">{stats.total}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">ITR Filed</p>
            <p className="text-xl font-black text-emerald-600 leading-none">{stats.filed}</p>
          </div>
        </div>

        <div className="relative flex-1 w-full group">
          <input type="text" placeholder="Search active IT client, PAN, or Father Name..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select value={selectedAY} onChange={e => setSelectedAY(e.target.value)} 
            className="bg-slate-50 border-none rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer">
            {YEARS.map(y => <option key={y} value={y}>AY {y}</option>)}
          </select>
          <div className="flex items-center bg-slate-50 rounded-xl px-4 py-3 gap-2 border border-transparent focus-within:border-indigo-100 transition-all">
            <span className="text-[9px] font-black text-slate-400 uppercase whitespace-nowrap">Due:</span>
            <input type="date" value={getDueDate()} onChange={e => updateDueDate(e.target.value)} className="bg-transparent border-none p-0 text-[11px] font-black text-slate-600 outline-none cursor-pointer uppercase" />
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse table-fixed min-w-[1100px]">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400 w-[70px]">S.No</th>
                <th className="px-6 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400 w-[220px]">Client Name</th>
                <th className="px-6 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400 w-[180px]">Father Name</th>
                <th className="px-6 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400 text-center w-[120px] relative">
                  <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="flex items-center justify-center gap-1 w-full uppercase">
                    Status <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {isFilterOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1">
                      {['All', 'Filed', 'Pending'].map(f => (
                        <button key={f} onClick={() => { setStatusFilter(f as any); setIsFilterOpen(false); }} className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase rounded-lg ${statusFilter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50'}`}>{f}</button>
                      ))}
                    </div>
                  )}
                </th>
                <th className="px-6 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400 w-[140px]">Pan No.</th>
                <th className="px-6 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400 w-[180px]">Password</th>
                <th className="px-6 py-5 text-[14px] font-black uppercase tracking-widest text-slate-400 text-right w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client, idx) => {
                const status = getStatus(client.id);
                const isPassVisible = visiblePasswords.has(client.id);
                const isEditingPass = editingPasswordId === client.id;
                return (
                  <tr key={client.id} className="group hover:bg-slate-50/50 transition-all text-[12px]">
                    <td className="px-6 py-5 font-black text-slate-300">{(idx + 1).toString().padStart(2, '0')}</td>
                    <td className="px-6 py-5">
                      <p className="font-black text-slate-900 uppercase truncate">{client.legalName}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{client.itProfile?.category}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-black text-slate-700 uppercase truncate">{client.itProfile?.fatherName || '---'}</p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button onClick={() => toggleStatus(client.id)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${status.filed ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                        {status.filed ? 'Filed' : 'Pending'}
                      </button>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-black text-emerald-600 font-mono tracking-widest uppercase">{client.itProfile?.pan}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 group/pass">
                        {isEditingPass ? (
                          <div className="flex items-center gap-1 z-10">
                            <input autoFocus value={newPasswordValue} onChange={e => setNewPasswordValue(e.target.value)} className="bg-white border border-indigo-200 rounded-lg px-2 h-8 text-[11px] font-black w-24 outline-none" />
                            <button onClick={() => saveQuickPassword(client)} className="h-8 w-8 bg-green-600 text-white rounded-lg flex items-center justify-center shadow-sm"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></button>
                          </div>
                        ) : (
                          <>
                            <span className="font-black text-indigo-600 tracking-wider truncate max-w-[80px]">{isPassVisible ? client.itProfile?.password : '••••••••'}</span>
                            <div className="flex gap-1">
                              <button onClick={() => setVisiblePasswords(prev => { const n = new Set(prev); n.has(client.id) ? n.delete(client.id) : n.add(client.id); return n; })} className="p-1 text-slate-300 hover:text-indigo-600 transition-colors">
                                {isPassVisible ? <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg> : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg>}
                              </button>
                              <button onClick={() => { setEditingPasswordId(client.id); setNewPasswordValue(client.itProfile?.password || ''); }} className="p-1 text-slate-300 hover:text-amber-600 transition-colors opacity-0 group-hover/pass:opacity-100">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">
                       <div className="flex items-center justify-end gap-2">
                          <button onClick={() => { copyToClipboard(client.itProfile?.username || ''); window.open('https://eportal.incometax.gov.in/iec/foservices/#/login', '_blank'); }} className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center border border-slate-100" title="Portal Login">
                             <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                          </button>
                          <button onClick={() => { setSelectedClient(client); setIsDetailModalOpen(true); }} className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center border border-slate-100">
                             <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg>
                          </button>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ITClientFormModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={() => fetchClients()} initialData={selectedClient} />
    </div>
  );
};

export default ITRReturn;