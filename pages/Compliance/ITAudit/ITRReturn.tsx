
import React, { useState, useEffect, useMemo } from 'react';
import { Client } from '../../../types';
import { api } from '../../../services/api.ts';
import ITClientFormModal from '../../Clientform/ITClientFormModal';
import Loader from '../../../components/Loader';
import { ModuleStatCard } from '../../../components/DashboardUI';
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
      const data = await api.getClients();
      setClients(data.filter(c => !!c.itProfile && (c.status === 'Active' || c.status === 'Active Filing')));
    } catch (err) {
      console.error("ITR Sync Error:", err);
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
      await api.saveClient(updated);
      setClients(prev => prev.map(c => c.id === client.id ? (updated as Client) : c));
      setEditingPasswordId(null);
    } catch (err) { 
      alert("Update failed. Check network connection."); 
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-8 animate-in fade-in duration-500 max-w-full mx-auto w-full overflow-hidden">
      
      {/* Summary Section - Dashboard UI Style */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ModuleStatCard 
              title="ITR Reach" 
              icon="💸" 
              stats={[
                  { label: 'Assigned Entities', value: stats.total },
                  { label: 'AY Cycle', value: selectedAY }
              ]}
              dueDate={`FY: ${financialYearDisplay}`}
          />
          <ModuleStatCard 
              title="Filing Done" 
              icon="✅" 
              stats={[
                  { label: 'Completed', value: stats.filed, color: 'text-emerald-600' },
                  { label: 'Pending', value: stats.total - stats.filed, color: 'text-rose-500' }
              ]}
              chartData={{ value: stats.filed, total: stats.total }}
          />
          <ModuleStatCard 
              title="Deadline Pressure" 
              icon="🔥" 
              stats={[
                  { label: 'Target Date', value: getDueDate() || 'Set Target' },
                  { label: 'Severity', value: 'Medium' }
              ]}
          />
      </section>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="relative flex-1 w-full group">
          <input type="text" placeholder="Search active IT vault..." value={search} onChange={e => setSearch(e.target.value)}
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
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[70px]">S.No</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[220px]">Client Identity</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[180px]">Father's Name</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center w-[120px] relative">
                  <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="flex items-center justify-center gap-1 w-full uppercase">
                    Status <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {isFilterOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 animate-in zoom-in-95">
                      {['All', 'Filed', 'Pending'].map(f => (
                        <button key={f} onClick={() => { setStatusFilter(f as any); setIsFilterOpen(false); }} className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase rounded-lg ${statusFilter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50'}`}>{f}</button>
                      ))}
                    </div>
                  )}
                </th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[140px]">PAN Identity</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[180px]">Vault Creds</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.length === 0 ? (
                 <tr><td colSpan={7} className="py-32 text-center text-slate-300 font-black uppercase tracking-widest text-sm">No IT return records found</td></tr>
              ) : (
                filteredClients.map((client, idx) => {
                  const status = getStatus(client.id);
                  const isPassVisible = visiblePasswords.has(client.id);
                  const isEditingPass = editingPasswordId === client.id;
                  return (
                    <tr key={client.id} className="group hover:bg-slate-50/50 transition-all text-[12px]">
                      <td className="px-6 py-5 font-black text-slate-300">{(idx + 1).toString().padStart(2, '0')}</td>
                      <td className="px-6 py-5">
                        <p className="font-black text-slate-900 uppercase truncate" title={client.legalName}>{client.legalName}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{client.itProfile?.category}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-black text-slate-700 uppercase truncate">{client.itProfile?.fatherName || '---'}</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button onClick={() => toggleStatus(client.id)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${status.filed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'}`}>
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
                            <button onClick={() => { copyToClipboard(client.itProfile?.username || ''); window.open('https://eportal.incometax.gov.in/iec/foservices/#/login', '_blank'); }} className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center border border-slate-100 shadow-sm" title="Portal Login">
                               <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            </button>
                            <button onClick={() => { setSelectedClient(client); setIsDetailModalOpen(true); }} className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center border border-slate-100 shadow-sm">
                               <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg>
                            </button>
                         </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ITClientFormModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={() => fetchClients()} initialData={selectedClient} />

      {/* DETAIL MODAL */}
      {isDetailModalOpen && selectedClient && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight truncate">{selectedClient.legalName}</h3>
                    <p className="text-[10px] font-bold text-slate-50 uppercase tracking-widest mt-1">IT Profile Detail • AY {selectedAY}</p>
                 </div>
                 <button onClick={() => setIsDetailModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-all"><svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg></button>
              </div>
              <div className="p-10 space-y-8">
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400">PAN Identity</p><p className="text-base font-black text-indigo-600 font-mono tracking-widest uppercase">{selectedClient.itProfile?.pan}</p></div>
                    <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400">Filing Status</p><p className="text-base font-black text-slate-900 uppercase">{getStatus(selectedClient.id).filed ? 'Filed' : 'Pending'}</p></div>
                    <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400">Father's Name</p><p className="text-sm font-black text-slate-700 uppercase">{selectedClient.itProfile?.fatherName || 'N/A'}</p></div>
                    <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400">Category</p><p className="text-sm font-black text-slate-700 uppercase">{selectedClient.itProfile?.category}</p></div>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Vault Password</p>
                    <div className="flex items-center justify-between">
                       <code className="text-base font-black text-indigo-600">{selectedClient.itProfile?.password}</code>
                       <button onClick={() => copyToClipboard(selectedClient.itProfile?.password || '')} className="text-[10px] font-black uppercase text-indigo-400 hover:underline">Copy Pass</button>
                    </div>
                 </div>
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                 <button onClick={() => setIsDetailModalOpen(false)} className="px-10 py-4 bg-white border border-slate-200 text-slate-600 font-black uppercase text-[10px] rounded-xl shadow-sm hover:bg-slate-100 transition-all">Dismiss</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ITRReturn;
