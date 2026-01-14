
import React, { useState, useEffect, useMemo } from 'react';
import { Client } from '../../../types.ts';
import { api } from '../../../services/api.ts';
import GSTClientFormModal from '../../Clientform/GSTClientFormModal.tsx';
import Loader from '../../../components/Loader.tsx';
import { useGSTR4Logic } from './GSTR4logic.tsx';
import { YEARS, FY_QUARTERS } from '../GSTReturn/filinglogic/MonthlyFilingLogic.tsx';

const GSTR4: React.FC = () => {
  const getPreviousFY = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const startYear = currentMonth >= 3 ? currentYear - 1 : currentYear - 2;
    return `${startYear}-${(startYear + 1).toString().slice(-2)}`;
  };

  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState(getPreviousFY());
  
  const [statusFilter, setStatusFilter] = useState<'All' | 'Filed' | 'Pending'>('All');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  const [showPassInModal, setShowPassInModal] = useState(false);
  const [isEditingPassInModal, setIsEditingPassInModal] = useState(false);
  const [modalPassValue, setModalPassValue] = useState('');

  const { getStatus, toggleStatus, updateDueDate, getDueDate } = useGSTR4Logic(selectedYear);

  const cmp08Data = useMemo(() => {
    const saved = localStorage.getItem('clientify_composition_filing_v3');
    return saved ? JSON.parse(saved) : {};
  }, [selectedYear]);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const data = await api.getClients();
      const filtered = data.filter(c => 
        c.gstProfile?.regType === 'Composition' &&
        (c.status === 'Active Filing' || c.status === 'Active')
      );
      setClients(filtered);
    } catch (err) {
      console.error("GSTR-4 Sync Failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const saveQuickPassword = async (client: Client) => {
    try {
      const updated = { ...client, gstProfile: { ...client.gstProfile!, password: newPasswordValue } };
      await api.saveClient(updated);
      setClients(prev => prev.map(c => c.id === client.id ? (updated as Client) : c));
      setEditingPasswordId(null);
    } catch (err) { 
      alert("Portal Password update failed."); 
    }
  };

  const saveQuickPasswordFromModal = async () => {
    if (!selectedClient) return;
    try {
      const updatedClient = {
        ...selectedClient,
        gstProfile: { ...selectedClient.gstProfile!, password: modalPassValue }
      };
      await api.saveClient(updatedClient);
      setSelectedClient(updatedClient as Client);
      setIsEditingPassInModal(false);
      fetchClients();
    } catch (err) { 
      alert("Update failed."); 
    }
  };

  const filteredClients = useMemo(() => {
    let list = clients.filter(c => 
      (c.legalName || '').toLowerCase().includes(search.toLowerCase()) || 
      (c.tradeName || '').toLowerCase().includes(search.toLowerCase()) || 
      (c.gstProfile?.gstin || '').toLowerCase().includes(search.toLowerCase())
    );

    if (statusFilter !== 'All') {
      list = list.filter(c => statusFilter === 'Filed' ? getStatus(c.id).filed : !getStatus(c.id).filed);
    }
    return list;
  }, [clients, search, statusFilter, getStatus]);

  const stats = useMemo(() => {
    const total = filteredClients.length;
    const filedCount = filteredClients.filter(c => getStatus(c.id).filed).length;
    return { total, filedCount };
  }, [filteredClients, getStatus]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleExport = () => {
    const csvHeaders = [
      "S.No",
      "Trade Name",
      "Legal Name",
      "GSTIN",
      "User ID",
      "Password",
      "CMP-08 Q1",
      "CMP-08 Q2",
      "CMP-08 Q3",
      "CMP-08 Q4",
      "GSTR-4 Status",
      "Filing Date"
    ].join(",");

    const csvRows = filteredClients.map((client, index) => {
      const gstr4Status = getStatus(client.id);
      const qStatuses = FY_QUARTERS.map(q => {
        const periodKey = `${selectedYear}_${q}`;
        const periodData = cmp08Data[periodKey];
        return (periodData && periodData[client.id]?.cmp08) ? "FILED" : "PENDING";
      });

      const rowValues = [
        index + 1,
        client.tradeName || "N/A",
        client.legalName || "N/A",
        client.gstProfile?.gstin || "N/A",
        client.gstProfile?.username || "N/A",
        client.gstProfile?.password || "N/A",
        ...qStatuses,
        gstr4Status.filed ? "FILED" : "PENDING",
        gstr4Status.date || "N/A"
      ];

      return rowValues.map(val => {
        const strValue = String(val).replace(/"/g, '""');
        return strValue.includes(',') ? `"${strValue}"` : strValue;
      }).join(",");
    }).join("\n");

    const fullCsvContent = csvHeaders + "\n" + csvRows;
    const blob = new Blob([fullCsvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `GSTR4_Audit_Sheet_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 max-w-full mx-auto w-full overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">FY {selectedYear}</p>
            <p className="text-xl font-black text-slate-900 leading-none">{stats.total}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">GSTR-4 Filed</p>
            <p className="text-xl font-black text-indigo-600 leading-none">{stats.filedCount}</p>
          </div>
        </div>

        <div className="relative flex-1 w-full group">
          <input type="text" placeholder="Search composition entity or GSTIN..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex bg-slate-50 rounded-xl p-1">
             <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} 
               className="bg-transparent border-none rounded-lg px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer">
               {YEARS.map(y => <option key={y} value={y}>FY {y}</option>)}
             </select>
          </div>
          <button onClick={handleExport} className="h-11 px-5 flex items-center justify-center bg-slate-900 text-white rounded-xl shadow-lg hover:bg-emerald-600 transition-all gap-2" title="Export to CSV">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4 4m4-4V4" /></svg>
            <span className="text-[10px] font-black uppercase tracking-widest">Export CSV</span>
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse table-fixed min-w-[1300px]">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[60px]">S.No</th>
                <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[160px]">Trade Name</th>
                <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[180px]">Legal Name</th>
                <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[190px]">GSTIN</th>
                <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center w-[120px]">CMP-08</th>
                <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center w-[140px] relative">GSTR-4 Status</th>
                <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[130px]">User ID</th>
                <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 w-[160px]">Password</th>
                <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client, idx) => {
                const status = getStatus(client.id);
                return (
                  <tr key={client.id} className="group hover:bg-slate-50/50 transition-all">
                    <td className="px-4 py-5 text-[11px] font-black text-slate-300">{(idx + 1).toString().padStart(2, '0')}</td>
                    <td className="px-4 py-5"><p className="text-[11px] font-black text-slate-900 uppercase truncate">{client.tradeName || '---'}</p></td>
                    <td className="px-4 py-5"><p className="text-[11px] font-bold text-slate-500 uppercase truncate">{client.legalName}</p></td>
                    <td className="px-4 py-5"><span className="text-[11px] font-black text-indigo-600 font-mono tracking-widest">{client.gstProfile?.gstin}</span></td>
                    <td className="px-4 py-5">
                       <div className="flex items-center justify-center gap-2">
                          {FY_QUARTERS.map(q => {
                             const periodKey = `${selectedYear}_${q}`;
                             const isFiled = cmp08Data[periodKey]?.[client.id]?.cmp08;
                             return (
                               <div key={q} className={`h-2.5 w-2.5 rounded-sm ${isFiled ? 'bg-green-500' : 'bg-red-500'}`} />
                             );
                          })}
                       </div>
                    </td>
                    <td className="px-4 py-5 text-center">
                       <button onClick={() => toggleStatus(client.id)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${status.filed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                         {status.filed ? 'Filed' : 'Pending'}
                       </button>
                    </td>
                    <td className="px-4 py-5"><p className="text-[11px] font-black text-slate-700 truncate">{client.gstProfile?.username}</p></td>
                    <td className="px-4 py-5"><p className="text-[11px] font-black text-indigo-600 truncate">{client.gstProfile?.password}</p></td>
                    <td className="px-4 py-5 text-right whitespace-nowrap">
                       <button onClick={() => { setSelectedClient(client); setIsDetailModalOpen(true); }} className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600 flex items-center justify-center border border-slate-100"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg></button>
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

export default GSTR4;
