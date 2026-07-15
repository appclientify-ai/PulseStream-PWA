import React, { useState, useEffect, useMemo } from 'react';
import { Client } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';
import { useTaxAuditLogic, BSStatus } from './TAXAuditlogic';
import { YEARS } from '../GSTReturn/filinglogic/MonthlyFilingLogic';
import GSTViewIcon from '../../../components/GSTViewIcon';
import { TableFilter } from '../../../components/TableFilter';

const TAXAudit: React.FC = () => {
  const getPreviousFY = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const startYear = currentMonth >= 3 ? currentYear - 1 : currentYear - 2;
    return `${startYear}-${(startYear + 1).toString().slice(-2)}`;
  };

  const [allClients, setAllClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState(getPreviousFY());
  
  const [bsFilter, setBsFilter] = useState<'All' | BSStatus>('All');
  const [auditFilter, setAuditFilter] = useState<'All' | 'Filed' | 'Pending'>('All');
  const [isBsFilterOpen, setIsBsFilterOpen] = useState(false);
  const [isAuditFilterOpen, setIsAuditFilterOpen] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [pendingClientForAdd, setPendingClientForAdd] = useState<Client | null>(null);
  const [newCaName, setNewCaName] = useState('');

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [editCaName, setEditCaName] = useState('');

  const { getStatus, toggleAuditStatus, setBSStatus, updateCaName, updateDueDate, getDueDate, watchlist, addToWatchlist, removeFromWatchlist } = useTaxAuditLogic(selectedYear);

  const fetchClients = async (isSync = false) => {
    if (!isSync) setIsLoading(true);
    try {
      const data = await api.getClients();
      setAllClients(data);
    } catch (err) {
      console.error("Tax Audit Sync Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchClients();
    const syncHandler = () => fetchClients(true);
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, []);

  const trackedClients = useMemo(() => {
    const selectedStartYear = parseInt(selectedYear.split('-')[0]);
    const activeIds = new Set<string>();

    Object.keys(watchlist).forEach(fy => {
      const ids = watchlist[fy] as string[];
      const fyStart = parseInt(fy.split('-')[0]);
      if (fyStart <= selectedStartYear) {
        ids.forEach(id => activeIds.add(id));
      }
    });

    return allClients.filter(c => activeIds.has(c.id));
  }, [allClients, watchlist, selectedYear]);

  const filteredTracked = useMemo(() => {
    const s = search.toLowerCase();
    let list = trackedClients.filter(c => 
      (c.legalName || '').toLowerCase().includes(s) || 
      (c.tradeName || '').toLowerCase().includes(s) || 
      (c.itProfile?.pan || '').toLowerCase().includes(s) ||
      (c.gstProfile?.gstin || '').toLowerCase().includes(s)
    );

    if (bsFilter !== 'All') {
      list = list.filter(c => getStatus(c.id).bsStatus === bsFilter);
    }
    if (auditFilter !== 'All') {
      list = list.filter(c => auditFilter === 'Filed' ? getStatus(c.id).auditFiled : !getStatus(c.id).auditFiled);
    }

    return list;
  }, [trackedClients, search, bsFilter, auditFilter, getStatus]);

  const availableToAdd = useMemo(() => {
    const s = addSearch.toLowerCase();
    const selectedStartYear = parseInt(selectedYear.split('-')[0]);
    
    const alreadyTrackedIds = new Set<string>();
    Object.keys(watchlist).forEach(fy => {
      const ids = watchlist[fy] as string[];
      const fyStart = parseInt(fy.split('-')[0]);
      if (fyStart <= selectedStartYear) {
        ids.forEach(id => alreadyTrackedIds.add(id));
      }
    });

    return allClients.filter(c => 
      !alreadyTrackedIds.has(c.id) && 
      ((c.legalName || '').toLowerCase().includes(s) || 
       (c.tradeName || '').toLowerCase().includes(s) || 
       (c.itProfile?.pan || '').toLowerCase().includes(s) || 
       (c.gstProfile?.gstin || '').toLowerCase().includes(s))
    ).slice(0, 10);
  }, [allClients, watchlist, addSearch, selectedYear]);

  const handleFinalizeAdd = () => {
    if (!pendingClientForAdd) return;
    addToWatchlist(pendingClientForAdd.id);
    if (newCaName.trim()) {
      updateCaName(pendingClientForAdd.id, newCaName.trim());
    }
    setPendingClientForAdd(null);
    setNewCaName('');
    setIsAddModalOpen(false);
  };

  const handleUpdateView = () => {
    if (viewingClient) {
      updateCaName(viewingClient.id, editCaName.trim());
      setIsViewModalOpen(false);
    }
  };

  const cycleBSStatus = (clientId: string) => {
    const current = getStatus(clientId).bsStatus;
    const flow: BSStatus[] = ['Pending', 'Document Required', 'In progress', 'Ready'];
    const nextIdx = (flow.indexOf(current) + 1) % flow.length;
    setBSStatus(clientId, flow[nextIdx]);
  };

  const stats = useMemo(() => {
    return {
      total: trackedClients.length,
      audited: trackedClients.filter(c => getStatus(c.id).auditFiled).length,
      bsReady: trackedClients.filter(c => getStatus(c.id).bsStatus === 'Ready').length
    };
  }, [trackedClients, getStatus]);

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 max-w-full mx-auto w-full overflow-hidden">
      
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Portfolio</p>
            <p className="text-xl font-black text-slate-900 leading-none">{stats.total}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">B/S Ready</p>
            <p className="text-xl font-black text-emerald-600 leading-none">{stats.bsReady}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">Audited</p>
            <p className="text-xl font-black text-indigo-600 leading-none">{stats.audited}</p>
          </div>
        </div>

        <div className="relative flex-1 w-full group">
          <input type="text" placeholder="Search entity, PAN or GSTIN..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => { setPendingClientForAdd(null); setAddSearch(''); setIsAddModalOpen(true); }} className="h-11 px-6 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-slate-900 transition-all flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            Add To Audit
          </button>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} 
            className="bg-slate-50 border-none rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer">
            {YEARS.map(y => <option key={y} value={y}>FY {y}</option>)}
          </select>
          <div className="flex items-center bg-slate-50 rounded-xl px-4 py-3 gap-2 border border-transparent focus-within:border-indigo-100 transition-all">
            <span className="text-[9px] font-black text-slate-400 uppercase ">Due:</span>
            <input type="date" value={getDueDate()} onChange={e => updateDueDate(e.target.value)} className="bg-transparent border-none p-0 text-[11px] font-black text-slate-600 outline-none cursor-pointer uppercase" />
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1 min-h-[300px] pb-32">
          <table className="w-full text-left border-collapse table-auto overflow-hidden min-w-full">
            <thead className=" sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">S.No</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Entity Name</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">GSTIN / PAN</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Resp. CA</th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">
                  <div className="flex justify-center flex-col items-center">
                    <TableFilter label="Balance Sheet" isActive={bsFilter !== 'All'}>
                      {['All', 'Document Required', 'In progress', 'Ready', 'Pending'].map(f => (
                        <button key={f} onClick={() => setBsFilter(f as any)} className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase rounded-lg ${bsFilter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{f}</button>
                      ))}
                    </TableFilter>
                  </div>
                </th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">
                  <div className="flex justify-center flex-col items-center">
                    <TableFilter label="Audit Status" isActive={auditFilter !== 'All'}>
                      {['All', 'Filed', 'Pending'].map(f => (
                        <button key={f} onClick={() => setAuditFilter(f as any)} className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase rounded-lg ${auditFilter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{f}</button>
                      ))}
                    </TableFilter>
                  </div>
                </th>
                <th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTracked.length === 0 ? (
                <tr><td colSpan={7} className=" py-32 text-center text-slate-300 font-black uppercase tracking-widest text-sm">No audit records tracked for FY {selectedYear}</td></tr>
              ) : (
                filteredTracked.map((client, idx) => {
                  const status = getStatus(client.id);
                  const bsColors = {
                    'Ready': 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm',
                    'In progress': 'bg-amber-100 text-amber-700 border-amber-200',
                    'Document Required': 'bg-blue-100 text-blue-700 border-blue-200',
                    'Pending': 'bg-slate-100 text-slate-400 border-slate-200'
                  };
                  return (
                    <tr key={client.id} className="group hover:bg-slate-50/50 transition-all text-[12px]">
                      <td className=" px-6 py-5 font-black text-slate-300">{(idx + 1).toString().padStart(2, '0')}</td>
                      <td className=" px-6 py-5">
                        <p className="font-black text-slate-900 truncate" title={client.tradeName}>{client.tradeName || client.legalName}</p>
                        <p className="text-[9px] font-bold text-slate-400 tracking-tighter truncate">{client.legalName}</p>
                      </td>
                      <td className=" px-6 py-5 font-black text-indigo-600 font-mono tracking-wider uppercase">
                         {client.gstProfile?.gstin || client.itProfile?.pan || 'N/A'}
                      </td>
                      <td className=" px-6 py-5 font-black text-slate-600 truncate uppercase">
                        {status.caName || '---'}
                      </td>
                      <td className=" px-6 py-5 text-center">
                        <button onClick={() => cycleBSStatus(client.id)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${bsColors[status.bsStatus] || bsColors.Pending}`}>
                          {status.bsStatus}
                        </button>
                      </td>
                      <td className=" px-6 py-5 text-center">
                        <button onClick={() => toggleAuditStatus(client.id)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${status.auditFiled ? 'bg-indigo-600 text-white shadow-lg border-indigo-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 border-slate-200'}`}>
                          {status.auditFiled ? 'Filed' : 'Pending'}
                        </button>
                      </td>
                      <td className="px-6 py-5 text-right ">
                         <div className="flex items-center justify-end gap-1">
                            {client.gstProfile && <GSTViewIcon client={client} onDataChange={fetchClients} />}
                            <button onClick={() => { setViewingClient(client); setEditCaName(status.caName || ''); setIsViewModalOpen(true); }} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center shadow-sm">
                               <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg>
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

      {/* VIEW MODAL (SHOWS FULL DETAILS + CA NAME EDIT) */}
      {isViewModalOpen && viewingClient && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 flex flex-col gap-1">
              <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
                 <div className="min-w-0">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight truncate">{viewingClient.legalName}</h3>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Audit Review Profile • FY {selectedYear}</p>
                 </div>
                 <button onClick={() => setIsViewModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-all">
                    <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
                 <section>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 mb-6 flex items-center gap-3">Assignment & Authority <div className="h-px flex-1 bg-slate-100" /></h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                       <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50">
                          <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-2 block ml-1">Responsible Auditor (CA)</label>
                          <input autoFocus value={editCaName} onChange={e => setEditCaName(e.target.value)} 
                            className="w-full bg-white border border-indigo-200 rounded-xl py-4 px-5 font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-lg uppercase" 
                            placeholder="Full CA Name..."
                          />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                             <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Audit Status</p>
                             <p className={`text-xs font-black uppercase ${getStatus(viewingClient.id).auditFiled ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {getStatus(viewingClient.id).auditFiled ? 'Completed' : 'Pending'}
                             </p>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                             <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Financials</p>
                             <p className="text-xs font-black text-slate-700 uppercase">{getStatus(viewingClient.id).bsStatus}</p>
                          </div>
                       </div>
                    </div>
                 </section>

                 <section>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 mb-6 flex items-center gap-3">Entity Background <div className="h-px flex-1 bg-slate-100" /></h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase text-slate-400">Trade Name</p>
                          <p className="text-sm font-black text-slate-900 truncate">{viewingClient.tradeName || '---'}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase text-slate-400">Permanent ID (PAN)</p>
                          <p className="text-sm font-black text-indigo-600 font-mono tracking-widest uppercase">{viewingClient.itProfile?.pan || 'N/A'}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase text-slate-400">Mobile Contact</p>
                          <p className="text-sm font-black text-slate-900">{viewingClient.mobile || '---'}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase text-slate-400">Portal User ID</p>
                          <p className="text-sm font-black text-slate-900">{viewingClient.itProfile?.username || viewingClient.gstProfile?.username || 'N/A'}</p>
                       </div>
                    </div>
                 </section>

                 {viewingClient.remarks && (
                    <section>
                       <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 mb-6 flex items-center gap-3">Office Notes <div className="h-px flex-1 bg-slate-100" /></h4>
                       <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                          <p className="text-sm font-medium text-slate-600 italic leading-relaxed">{viewingClient.remarks}</p>
                       </div>
                    </section>
                 )}
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4 shrink-0">
                <button onClick={() => { if(confirm('Cease audit tracking for this entity?')) { removeFromWatchlist(viewingClient.id); setIsViewModalOpen(false); } }} 
                   className="flex-1 py-4 text-red-500 font-black uppercase tracking-widest text-[10px] border border-red-100 rounded-xl hover:bg-red-50 transition-all">Untrack Entity</button>
                <button onClick={handleUpdateView} 
                   className="flex-[2] bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-xl shadow-xl hover:bg-slate-900 transition-all">Update & Close Profile</button>
              </div>
           </div>
        </div>
      )}

      {/* ADD CLIENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-8 flex flex-col space-y-6 animate-in zoom-in-95 flex flex-col gap-1">
              <div className="flex items-center justify-between shrink-0">
                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                   {pendingClientForAdd ? 'Authorized Auditor' : `Track for FY ${selectedYear}`}
                 </h3>
                 <button onClick={() => { setIsAddModalOpen(false); setPendingClientForAdd(null); }} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-all">
                   <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
                 </button>
              </div>

              {!pendingClientForAdd ? (
                <>
                  <div className="relative shrink-0">
                     <input type="text" placeholder="Search Master Vault..." value={addSearch} onChange={e => setAddSearch(e.target.value)}
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-5 font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-50 transition-all" />
                     <svg className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <div className="flex-1 max-h-[400px] overflow-y-auto space-y-2 pr-2 no-scrollbar">
                     {availableToAdd.length === 0 ? (
                       <p className="text-center py-10 text-slate-400 font-bold uppercase text-xs tracking-widest">No available entities found</p>
                     ) : (
                       availableToAdd.map(c => (
                         <button key={c.id} onClick={() => { setPendingClientForAdd(c); setNewCaName(''); }} 
                           className="w-full text-left p-4 rounded-2xl border border-slate-100 hover:border-indigo-600 hover:bg-indigo-50/50 transition-all flex items-center justify-between group">
                            <div className="min-w-0 flex-1">
                               <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 truncate">{c.legalName}</p>
                               <p className="text-[10px] text-slate-400 font-mono tracking-tight mt-1">{c.gstProfile?.gstin || c.itProfile?.pan || 'NO IDENTIFIER'}</p>
                            </div>
                            <svg className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 shrink-0 ml-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                         </button>
                       ))
                     )}
                  </div>
                </>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Target Entity</p>
                    <p className="text-base font-black text-indigo-900 leading-tight">{pendingClientForAdd.legalName}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block ml-1">Responsible CA Name (Signatory)</label>
                    <input autoFocus type="text" placeholder="Full Professional Name" value={newCaName} onChange={e => setNewCaName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-lg uppercase" />
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setPendingClientForAdd(null)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-500 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-slate-50">Back</button>
                    <button onClick={handleFinalizeAdd} className="flex-[2] bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-xl hover:bg-slate-900 transition-all">Confirm Audit Tracking</button>
                  </div>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default TAXAudit;