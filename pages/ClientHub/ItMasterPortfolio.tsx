import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDate } from '../../exportUtils';
import { Client, ClientStatus } from '../../types';
import { api } from '../../services/api.ts';
import ITClientFormModal from '../Clientform/ITClientFormModal';
import ITViewIcon from '../../components/ITViewIcon';
import GSTViewIcon from '../../components/GSTViewIcon';
import Loader from '../../components/Loader';
import { toast } from 'sonner';
import { TableFilter } from '../../components/TableFilter';

interface ItMasterPortfolioProps {
  externalSearch?: string;
  quickFilter?: string;
  viewMode?: 'table' | 'grid';
  onDataChange?: () => void;
}

const ItMasterPortfolio: React.FC<ItMasterPortfolioProps> = ({ 
  externalSearch = '', 
  quickFilter = 'All',
  viewMode = 'table',
  onDataChange
}) => {
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [shareText, setShareText] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState('');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Multi-Select & Bulk State
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
  const [isBulkStatusMenuOpen, setIsBulkStatusMenuOpen] = useState(false);

  // Sorting State
  const [sortField, setSortField] = useState<'legalName' | 'pan' | 'itr' | 'status'>('legalName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const { data: clientsData, isLoading: isClientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.getClients(),
    staleTime: 1000 * 60 * 5,
  });

  const clients = useMemo(() => {
    return (clientsData || []).filter(c => c && c.itProfile);
  }, [clientsData]);

  const isLoading = isClientsLoading && !clientsData;

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [itrFilter, setItrFilter] = useState<'All' | 'ITR-1' | 'ITR-2' | 'ITR-3' | 'ITR-4' | 'N/A'>('All');
  const [activeFilterMenu, setActiveFilterMenu] = useState<'status' | null>(null);
  const [filterMenuPos, setFilterMenuPos] = useState({ top: 0, left: 0 });
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const statusFilterBtnRef = useRef<HTMLButtonElement>(null);

  const openFilterMenu = (e: React.MouseEvent, type: 'status') => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 120;
    let top = rect.bottom + 4;
    if (top + menuHeight > window.innerHeight - 12) {
      top = Math.max(12, rect.top - menuHeight - 4);
    }
    const left = Math.min(rect.left, window.innerWidth - 180);
    setFilterMenuPos({ top, left });
    setActiveFilterMenu(prev => prev === type ? null : type);
    setActiveActionsId(null);
  };

  // Password Visibility State
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  // Login Tool Box State
  const [isLoginBoxOpen, setIsLoginBoxOpen] = useState(false);
  const [loginToolClient, setLoginToolClient] = useState<Client | null>(null);
  const [showLoginPass, setShowLoginPass] = useState(true);
  const [isEditingLoginPass, setIsEditingLoginPass] = useState(false);
  const [tempPass, setTempPass] = useState('');

  // Actions Menu State (Fixed Positioning)
  const [activeActionsId, setActiveActionsId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncHandler = () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    };
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, [queryClient]);

  // Handle closing menu on click outside or scroll
  useEffect(() => {
    const handleClose = (event: any) => {
      const target = event.target as Node;
      if (actionsRef.current && !actionsRef.current.contains(target)) {
        setActiveActionsId(null);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(target)) {
        if (statusFilterBtnRef.current && statusFilterBtnRef.current.contains(target)) {
          return;
        }
        setActiveFilterMenu(null);
      }
    };
    const handleScroll = () => {
      setActiveActionsId(null);
      setActiveFilterMenu(null);
    };

    if (activeActionsId || activeFilterMenu) {
      document.addEventListener('mousedown', handleClose);
      window.addEventListener('scroll', handleScroll, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClose);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [activeActionsId, activeFilterMenu]);

  const handleDataChange = () => {
    queryClient.invalidateQueries({ queryKey: ['clients'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
    if (onDataChange) onDataChange();
  };

  const handleUpdatePassword = async () => {
    if (!loginToolClient || !tempPass.trim()) return;
    try {
      const updated = { 
        ...loginToolClient, 
        itProfile: { ...loginToolClient.itProfile!, password: tempPass } 
      };
      await api.saveClient(updated);
      setLoginToolClient(updated as Client);
      setIsEditingLoginPass(false);
      handleDataChange();
      toast.success("IT Password updated in vault.");
    } catch (err) { 
      toast.error("Vault update failed."); 
    }
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsEditModalOpen(true);
  };

  const handleSort = (field: 'legalName' | 'pan' | 'itr' | 'status') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredClients = useMemo(() => {
    let list = clients || [];

    // Apply Quick Filters
    if (quickFilter !== 'All') {
      if (quickFilter === 'Active' || quickFilter === 'Litigation' || quickFilter === 'Inactive' || quickFilter === 'Suspended') {
        list = list.filter(c => c?.status === quickFilter);
      } else if (quickFilter.startsWith('ITR-')) {
        list = list.filter(c => c?.itProfile?.itrFiled === quickFilter);
      }
    }

    if (statusFilter !== 'All') {
      list = list.filter(c => c?.status === statusFilter);
    }

    if (itrFilter !== 'All') {
      list = list.filter(c => {
        const itr = c?.itProfile?.itrFiled || 'N/A';
        return itr === itrFilter;
      });
    }

    const s = (externalSearch || '').toLowerCase();
    const searchFiltered = list.filter(c => {
      if (!c) return false;
      return (c.legalName || '').toLowerCase().includes(s) || 
      (c.tradeName || '').toLowerCase().includes(s) ||
      (c.itProfile?.pan || '').toLowerCase().includes(s) ||
      (c.itProfile?.fatherName || '').toLowerCase().includes(s) ||
      String(c.mobile || '').toLowerCase().includes(s);
    });

    // Apply Sorting
    return [...searchFiltered].sort((a, b) => {
      let valA = '';
      let valB = '';

      if (sortField === 'legalName') {
        valA = a.legalName || a.tradeName || '';
        valB = b.legalName || b.tradeName || '';
      } else if (sortField === 'pan') {
        valA = a.itProfile?.pan || '';
        valB = b.itProfile?.pan || '';
      } else if (sortField === 'itr') {
        valA = a.itProfile?.itrFiled || '';
        valB = b.itProfile?.itrFiled || '';
      } else if (sortField === 'status') {
        valA = a.status || '';
        valB = b.status || '';
      }

      const cmp = valA.localeCompare(valB);
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [clients, externalSearch, quickFilter, statusFilter, itrFilter, sortField, sortOrder]);

  // Multi-select handlers
  const toggleSelectAll = () => {
    if (selectedClientIds.size === filteredClients.length) {
      setSelectedClientIds(new Set());
    } else {
      setSelectedClientIds(new Set(filteredClients.map(c => c.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedClientIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Bulk Operations
  const selectedClientsList = useMemo(() => {
    return (clients || []).filter(c => selectedClientIds.has(c.id));
  }, [clients, selectedClientIds]);

  const handleBulkCopyCreds = () => {
    if (selectedClientsList.length === 0) return;
    const credsText = selectedClientsList.map(c => 
      `Entity: ${c.legalName || c.tradeName}\nPAN: ${c.itProfile?.pan || 'N/A'}\nUser ID: ${c.itProfile?.pan || 'N/A'}\nPassword: ${c.itProfile?.password || 'N/A'}`
    ).join('\n---------------------\n');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(credsText);
      toast.success(`Copied IT credentials for ${selectedClientsList.length} clients!`);
    }
  };

  const handleBulkExportCSV = () => {
    if (selectedClientsList.length === 0) return;
    const headers = [
      "Legal Name", "Trade Name", "PAN", "Father Name", "Mobile", "Email", 
      "ITR Form", "Portal Password", "Status"
    ].join(",");

    const rows = selectedClientsList.map(c => [
      c?.legalName, c?.tradeName, c?.itProfile?.pan, c?.itProfile?.fatherName, 
      c?.mobile, c?.email, c?.itProfile?.itrFiled, c?.itProfile?.password, c?.status
    ].map(v => `"${v || ''}"`).join(",")).join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `IT_Selected_Clients_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${selectedClientsList.length} clients!`);
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedClientsList.length === 0) return;
    try {
      toast.loading(`Updating status for ${selectedClientsList.length} clients...`);
      for (const client of selectedClientsList) {
        const updated = { ...client, status: newStatus as any };
        await api.saveClient(updated);
      }
      handleDataChange();
      setSelectedClientIds(new Set());
      setIsBulkStatusMenuOpen(false);
      toast.dismiss();
      toast.success(`Updated status for ${selectedClientsList.length} clients to ${newStatus}`);
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to update status for selected clients.");
    }
  };

  const togglePassword = (id: string) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleShareClick = (text: string) => {
    setShareText(text);
    setIsShareModalOpen(true);
  };
  
  const proceedShare = () => {
    const final = shareText + (selectedNote ? '\n\n*Note:*\n' + selectedNote : '');
    window.location.href = `whatsapp://send?text=${encodeURIComponent(final)}`;
    setIsShareModalOpen(false);
  };

  const openActionsMenu = (e: React.MouseEvent, client: Client) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 360;
    const menuWidth = 256;
    const padding = 12;

    let top = rect.bottom + 8;
    if (top + menuHeight > window.innerHeight - padding) {
      if (rect.top - menuHeight - 8 > padding) {
        top = rect.top - menuHeight - 8;
      } else {
        top = Math.max(padding, window.innerHeight - menuHeight - padding);
      }
    }

    let left = rect.right - menuWidth;
    if (left < padding) {
      left = padding;
    } else if (left + menuWidth > window.innerWidth - padding) {
      left = window.innerWidth - menuWidth - padding;
    }

    setMenuPosition({ top, left });
    setActiveActionsId(client.id);
    setSelectedClient(client);
  };

  if (isLoading) return <Loader />;

  return (
    <div className="w-full h-full flex flex-col min-h-0 relative">
      {viewMode === 'grid' ? (
        <div className="overflow-auto no-scrollbar flex-1 p-2.5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {filteredClients.length === 0 ? (
            <div className="col-span-full py-24 text-center text-slate-300 font-black uppercase tracking-widest text-sm">
              No matching IT clients found
            </div>
          ) : (
            filteredClients.map((client) => {
              const isSelected = selectedClientIds.has(client.id);

              return (
                <div 
                  key={client.id}
                  className={`bg-white border rounded-xl p-3 flex flex-col justify-between transition-all relative hover:shadow-md animate-in fade-in slide-in-from-bottom-1 duration-200 ${
                    isSelected ? 'border-emerald-600 bg-emerald-50/20 ring-1 ring-emerald-500/20' : 'border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase tracking-wider">
                      {client.itProfile?.itrFiled || 'ITR'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                      client.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {client.status}
                    </span>
                  </div>

                  <div className="mb-2">
                    <h4 className="font-black text-slate-900 text-xs truncate" title={client.legalName || client.tradeName}>
                      {client.legalName || client.tradeName}
                    </h4>
                    {client.itProfile?.fatherName && (
                      <p className="text-[10px] font-bold text-slate-400 truncate">
                        S/O: {client.itProfile.fatherName}
                      </p>
                    )}
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 mb-2 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">PAN</span>
                      <div className="flex items-center gap-1">
                        <span className="font-black font-mono text-emerald-700 text-[11px] tracking-wider uppercase">
                          {client.itProfile?.pan || '---'}
                        </span>
                        {client.itProfile?.pan && (
                          <button 
                            onClick={() => {
                              if (navigator.clipboard) {
                                navigator.clipboard.writeText(client.itProfile?.pan || '');
                                toast.success('PAN Copied!');
                              }
                            }}
                            className="p-0.5 hover:bg-emerald-100 text-emerald-600 rounded transition-colors"
                            title="Copy PAN"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2-2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 font-bold">Mobile</span>
                      <span className="font-mono font-bold text-slate-800">{client.mobile || '---'}</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 font-bold">Email</span>
                      <span className="font-medium text-slate-600 truncate max-w-[130px]">{client.email || '---'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 gap-1">
                    <button
                      onClick={() => {
                        setLoginToolClient(client);
                        setTempPass(client.itProfile?.password || '');
                        setShowLoginPass(true);
                        setIsEditingLoginPass(false);
                        setIsLoginBoxOpen(true);
                      }}
                      className="flex-1 py-1 px-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 font-black text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-xs"
                    >
                      <span>🔐 IT Portal</span>
                    </button>
                    <ITViewIcon 
                      client={client}
                      onEdit={handleEdit}
                      onDataChange={handleDataChange}
                      className="h-6.5 w-6.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-white transition-all flex items-center justify-center shadow-xs"
                    />
                    <button 
                      onClick={(e) => openActionsMenu(e, client)}
                      className={`h-6.5 w-6.5 rounded-lg border transition-all flex items-center justify-center shadow-xs ${activeActionsId === client.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-emerald-600 hover:bg-white'}`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="overflow-auto no-scrollbar flex-1 w-full relative h-full">
          <table className="w-full text-left border-collapse table-auto min-w-full compact-table compact-mode">
            <thead className="sticky top-0 z-30 bg-slate-100">
              <tr className="bg-slate-50 border-b border-slate-200 shadow-sm">
                <th className="sticky top-0 z-30 bg-slate-100 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200">S.No.</th>
                <th 
                  onClick={() => handleSort('legalName')}
                  className="sticky top-0 z-30 bg-slate-100 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 cursor-pointer hover:bg-slate-200/80 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Name
                    <span className="text-[9px] text-emerald-600">{sortField === 'legalName' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}</span>
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('itr')}
                  className="sticky top-0 z-30 bg-slate-100 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 cursor-pointer hover:bg-slate-200/80 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    ITR
                    <span className="text-[9px] text-emerald-600">{sortField === 'itr' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}</span>
                  </div>
                </th>
                <th className="sticky top-0 z-30 bg-slate-100 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200">Father Name</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200">Mobile No.</th>
                <th 
                  onClick={() => handleSort('pan')}
                  className="sticky top-0 z-30 bg-slate-100 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 cursor-pointer hover:bg-slate-200/80 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    PAN No.
                    <span className="text-[9px] text-emerald-600">{sortField === 'pan' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}</span>
                  </div>
                </th>
                <th className="sticky top-0 z-30 bg-slate-100 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200">Address</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200">
                  <div className="flex items-center gap-1">
                    Status
                    <button 
                      ref={statusFilterBtnRef}
                      onClick={(e) => openFilterMenu(e, 'status')} 
                      className={`p-0.5 rounded transition-colors ${statusFilter !== 'All' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-200 text-slate-500'}`}
                      title="Filter Status"
                    >
                      <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                    </button>
                  </div>
                </th>
                <th className="sticky top-0 z-30 bg-slate-100 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-900 text-right border-b border-slate-200">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.length === 0 ? (
                <tr><td colSpan={10} className=" py-32 text-center text-slate-300 font-black uppercase tracking-widest text-sm">No IT master records found</td></tr>
              ) : (
                filteredClients.map((client, idx) => {
                  const isSelected = selectedClientIds.has(client.id);

                  return (
                    <tr 
                      key={client.id} 
                      className={`transition-all group border-b border-slate-50 last:border-0 h-[30px] animate-in fade-in slide-in-from-bottom-1 duration-150 ${
                        isSelected ? 'bg-emerald-50/60' : 'hover:bg-emerald-50/10'
                      }`}
                    >
                      <td className="px-2 py-[1px] font-black text-emerald-600 font-mono text-[11px] truncate">
                        {(idx + 1).toString().padStart(2, '0')}
                      </td>
                      <td className="px-2 py-[1px]">
                         <p className="font-black text-slate-900 truncate text-[11.5px]" title={client.legalName}>{client.legalName}</p>
                         {client.tradeName && (
                            <p className="font-bold text-indigo-600 text-[9px] truncate leading-tight" title={client.tradeName}>
                              Trade: {client.tradeName}
                            </p>
                         )}
                      </td>
                      <td className="px-2 py-[1px]">
                         <span className="inline-block bg-indigo-50/80 border border-indigo-100 text-indigo-700 px-1.5 py-0 rounded-md font-black text-[9px] tracking-wide">
                            {client.itProfile?.itrFiled || 'N/A'}
                         </span>
                      </td>
                      <td className="px-2 py-[1px]">
                         <p className="font-bold text-slate-600 truncate text-[11px]" title={client.itProfile?.fatherName}>{client.itProfile?.fatherName || '---'}</p>
                      </td>
                      <td className="px-2 py-[1px]">
                         <p className="font-black text-slate-500 text-[11px]">{client.mobile || '---'}</p>
                      </td>
                      <td className="px-2 py-[1px]">
                         <div className="flex items-center gap-1.5 group/pan">
                            <span className="font-black font-mono tracking-widest text-[11px] text-emerald-600">{client.itProfile?.pan}</span>
                            <button 
                               onClick={() => { copyToClipboard(client.itProfile?.pan || ''); }}
                               className="h-5 w-5 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center opacity-0 group-hover/pan:opacity-100 shadow-xs border border-emerald-100"
                               title="Copy PAN"
                            >
                               <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2-2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>
                            </button>
                         </div>
                      </td>
                      <td className="px-2 py-[1px] max-w-[150px]">
                         <p className="font-bold text-slate-500 text-[10px] truncate" title={client.itProfile?.address}>
                            {client.itProfile?.address || '---'}
                         </p>
                      </td>
                      <td className="px-2 py-[1px]">
                         <span className={`px-1.5 py-0 rounded-full text-[9px] font-black uppercase tracking-tighter border ${
                           client.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'
                         }`}>
                           {client.status}
                         </span>
                      </td>
                      <td className="px-2 py-[1px] text-right overflow-visible">
                         <div className="flex items-center justify-end gap-1">
                            <ITViewIcon 
                              client={client}
                              onEdit={handleEdit}
                              onDataChange={handleDataChange}
                              className="h-6 w-6 rounded-md bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center shadow-xs"
                            />
                            {client.gstProfile && <GSTViewIcon client={client} onDataChange={handleDataChange} />}
                            
                            <button 
                              onClick={() => {
                                setLoginToolClient(client);
                                setTempPass(client.itProfile?.password || '');
                                setShowLoginPass(true);
                                setIsEditingLoginPass(false);
                                setIsLoginBoxOpen(true);
                              }}
                              className="h-6 w-6 rounded-md bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center shadow-xs"
                              title="IT Portal Access Utility"
                            >
                               <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            </button>

                            <button 
                              onClick={(e) => openActionsMenu(e, client)}
                              className={`h-6 w-6 rounded-md border transition-all flex items-center justify-center shadow-xs ${activeActionsId === client.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white'}`}
                            >
                               <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
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
      )}

      {/* Floating Bulk Operations Toolbar */}
      {selectedClientIds.size > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl px-4 py-2.5 flex items-center gap-3 border border-slate-700 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 border-r border-slate-700 pr-3">
            <span className="h-6 w-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
              {selectedClientIds.size}
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">Selected</span>
          </div>

          <button 
            onClick={handleBulkCopyCreds}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5"
            title="Copy IT Credentials for selected clients"
          >
            <span>📋 Copy Credentials</span>
          </button>

          <button 
            onClick={handleBulkExportCSV}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5"
            title="Export selected clients to CSV"
          >
            <span>📥 Export CSV</span>
          </button>

          <div className="relative">
            <button 
              onClick={() => setIsBulkStatusMenuOpen(!isBulkStatusMenuOpen)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5"
            >
              <span>⚡ Change Status ▾</span>
            </button>

            {isBulkStatusMenuOpen && (
              <div className="absolute bottom-full mb-2 left-0 w-44 bg-white text-slate-800 rounded-xl shadow-2xl p-1 border border-slate-200 z-50 animate-in zoom-in-95">
                {['Active', 'Litigation', 'Suspended', 'Inactive'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleBulkStatusChange(status)}
                    className="w-full text-left px-3 py-1.5 text-[10px] font-black uppercase rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                  >
                    Set {status}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={() => setSelectedClientIds(new Set())}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Deselect All"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Global Actions Menu - Fixed Positioned */}
      {activeActionsId && selectedClient && (
        <div 
          ref={actionsRef}
          style={{ top: menuPosition.top, left: menuPosition.left }}
          className="fixed w-64 bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl z-[9999] p-2 animate-in zoom-in-95 origin-top-right overflow-y-auto max-h-[calc(100vh-24px)] text-left"
        >
          <div className="px-3 py-2 border-b border-slate-50 mb-1">
             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">IT Operations</p>
             <p className="text-[10px] font-black text-slate-900 truncate mt-0.5">{selectedClient.legalName}</p>
          </div>
          <button onClick={() => { 
              setLoginToolClient(selectedClient!); 
              setTempPass(selectedClient!.itProfile?.password || ''); 
              setShowLoginPass(true);
              setIsEditingLoginPass(false);
              setIsLoginBoxOpen(true); 
              setActiveActionsId(null); 
          }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 rounded-xl transition-colors text-left group">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">IT Portal Login</span>
          </button>
          <button onClick={() => { 
              const creds = `*Income Tax Credentials*\n*Entity:* ${selectedClient!.legalName}\n*PAN:* ${selectedClient!.itProfile?.pan}\n*User ID:* ${selectedClient!.itProfile?.username}\n*Password:* ${selectedClient!.itProfile?.password}`;
              handleShareClick(creds);
              setActiveActionsId(null);
          }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-50 rounded-xl transition-colors text-left group border-t border-slate-50">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">WhatsApp Creds</span>
          </button>
          <button onClick={() => { 
              const fullText = `*Client Details*\nTrade Name: ${selectedClient!.tradeName || 'N/A'}\nLegal Name: ${selectedClient!.legalName || 'N/A'}\nMobile: ${selectedClient!.mobile || 'N/A'}\nEmail: ${selectedClient!.email || 'N/A'}\n\n*GST Details*\nGSTIN: ${selectedClient!.gstProfile?.gstin || 'N/A'}\nStatus: ${selectedClient!.gstProfile?.gstStatus || 'N/A'}\nReg Type: ${selectedClient!.gstProfile?.regType || 'N/A'}\nFiling: ${selectedClient!.gstProfile?.filingFreq || 'N/A'}\nReg Date: ${formatDate(selectedClient!.gstProfile?.regDate)}\nJurisdiction: ${selectedClient!.gstProfile?.jurisdictionType || 'N/A'}\nSector/Range: ${selectedClient!.gstProfile?.sector || selectedClient!.gstProfile?.range || 'N/A'}\n\n*Credentials*\nGST User ID: ${selectedClient!.gstProfile?.username || 'N/A'}\nGST Password: ${selectedClient!.gstProfile?.password || 'N/A'}\n\n*IT Details*\nPAN: ${selectedClient!.itProfile?.pan || 'N/A'}\nIT User ID: ${selectedClient!.itProfile?.username || 'N/A'}\nIT Password: ${selectedClient!.itProfile?.password || 'N/A'}`;
              handleShareClick(fullText);
              setActiveActionsId(null);
          }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-50 rounded-xl transition-colors text-left group">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.126.549 4.2 1.593 6.035L.302 23.687l5.772-1.517a12.001 12.001 0 005.957 1.57h.005c6.645 0 12.031-5.385 12.031-12.031C24.067 5.385 18.681 0 12.031 0zm0 21.724c-1.802 0-3.568-.485-5.114-1.403l-.367-.217-3.8.998 1.018-3.705-.238-.38A9.992 9.992 0 012.016 12.03c0-5.526 4.498-10.024 10.024-10.024 2.678 0 5.195 1.042 7.087 2.937 1.892 1.892 2.934 4.409 2.934 7.087 0 5.528-4.499 10.028-10.025 10.028v-.004c0-.001-.002-.001-.005-.001zM17.53 14.19c-.302-.15-1.785-.882-2.062-.983-.277-.101-.479-.151-.68.15s-.781.983-.956 1.185c-.176.201-.352.226-.653.076-.301-.15-1.275-.471-2.428-1.5-3.036-2.699-2.227-2.699-.582-5.467.243-.404-.76-2.222-1.04-2.912-.272-.676-.55-.584-.755-.595l-.645-.01c-.226 0-.594.084-.904.42-.311.336-1.191 1.163-1.191 2.836 0 1.674 1.221 3.292 1.391 3.519.17.227 2.457 3.864 5.952 5.253.81.321 1.442.513 1.934.656.812.235 1.551.202 2.138.122.656-.09 2.062-.843 2.353-1.657.292-.814.292-1.512.204-1.657-.087-.145-.313-.231-.615-.383z"/></svg></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">WhatsApp Full Info</span>
          </button>
          <div className="my-1 border-t border-slate-100" />
          <button onClick={() => { setIsEditModalOpen(true); setActiveActionsId(null); }} 
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-left group">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Modify Record</span>
          </button>
          <button onClick={() => { if(confirm('Delete IT profile permanently?')) api.deleteClient(selectedClient!.id).then(handleDataChange); setActiveActionsId(null); }} 
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 rounded-xl transition-colors text-left group">
              <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Delete Record</span>
          </button>
        </div>
      )}

      {/* Fixed Positioning Menu to Avoid Clipping */}
      {activeFilterMenu === 'status' && (
        <div ref={filterMenuRef} style={{ top: filterMenuPos.top, left: filterMenuPos.left }} className="fixed w-32 bg-white border border-slate-200 rounded-[1rem] shadow-xl z-[9999] p-1 animate-in zoom-in-95 origin-top text-left">
          {['All', 'Active', 'Inactive'].map(f => (
            <button key={f} onClick={() => { setStatusFilter(f); setActiveFilterMenu(null); }} className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase rounded-lg ${statusFilter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>{f}</button>
          ))}
        </div>
      )}

      
      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-black text-slate-900 uppercase mb-4">Append Note</h3>
            <textarea
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold outline-none h-32 mb-4 focus:ring-4 focus:ring-emerald-50"
              placeholder="Select a note or type here..."
              value={selectedNote}
              onChange={(e) => setSelectedNote(e.target.value)}
            />
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
               {(() => {
                 const saved = localStorage.getItem('clientify_custom_templates');
                 const templates = saved ? JSON.parse(saved) : [];
                 return templates.map((t: any, i: number) => (
                   <button key={i} onClick={() => setSelectedNote(t.text)} className="shrink-0 px-3 py-1.5 bg-slate-100 rounded-lg text-[10px] font-black uppercase text-slate-600 hover:bg-slate-200">{t.label}</button>
                 ));
               })()}
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsShareModalOpen(false)} className="flex-1 py-3 text-slate-500 font-black uppercase tracking-widest text-[10px] border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={proceedShare} className="flex-1 py-3 bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-colors">Share Now</button>
            </div>
          </div>
        </div>
      )}

      {/* Login Tool Box Modal */}
      {isLoginBoxOpen && loginToolClient && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 border border-slate-200">
              <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
                 <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-2">IT Portal Access Utility</p>
                    <h3 className="text-xl font-black truncate">{loginToolClient.legalName || loginToolClient.tradeName}</h3>
                 </div>
                 <button onClick={() => setIsLoginBoxOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors">
                    <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
                 </button>
              </div>
              
              <div className="p-8 md:p-10 space-y-8">
                 <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">PAN Identity</span>
                       <button onClick={() => {
                         if (navigator.clipboard && loginToolClient.itProfile?.pan) {
                           navigator.clipboard.writeText(loginToolClient.itProfile.pan).then(() => { toast.success('PAN Copied!'); });
                         }
                       }} className="text-[9px] font-black uppercase text-indigo-600 hover:underline">Copy PAN</button>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                       <code className="text-lg font-black text-indigo-600 font-mono tracking-widest uppercase">{loginToolClient.itProfile?.pan || '---'}</code>
                       <button onClick={() => { 
                          if (loginToolClient.itProfile?.pan) {
                            copyToClipboard(loginToolClient.itProfile.pan); 
                            toast.success('PAN Copied'); 
                          }
                       }} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors" title="Copy PAN">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2-2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>
                       </button>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Portal User ID</span>
                       <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-2">
                          <span className="text-sm font-black text-slate-900 font-mono break-all select-all leading-snug">{loginToolClient.itProfile?.username || loginToolClient.itProfile?.pan || '---'}</span>
                          <button onClick={() => { 
                            const uid = loginToolClient.itProfile?.username || loginToolClient.itProfile?.pan || '';
                            if (uid) {
                              copyToClipboard(uid); 
                              toast.success('User ID Copied'); 
                            }
                          }} className="p-1.5 text-slate-300 hover:text-indigo-600 transition-colors shrink-0" title="Copy User ID">
                             <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2-2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>
                          </button>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">e-Filing Password</span>
                       <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                          {isEditingLoginPass ? (
                             <input 
                                autoFocus
                                value={tempPass} 
                                onChange={e => setTempPass(e.target.value)} 
                                onBlur={handleUpdatePassword}
                                onKeyDown={e => e.key === 'Enter' && handleUpdatePassword()}
                                className="bg-white border border-indigo-200 rounded-lg px-2 py-1 text-xs font-black w-full outline-none focus:ring-2 focus:ring-indigo-100"
                             />
                          ) : (
                             <>
                                <span className="text-sm font-black text-indigo-600 tracking-wider font-mono break-all select-all leading-snug max-w-full">{showLoginPass ? (loginToolClient.itProfile?.password || '---') : '••••••••'}</span>
                                <div className="flex gap-1.5 shrink-0 ml-auto">
                                   <button onClick={() => setShowLoginPass(!showLoginPass)} className="p-1 text-slate-300 hover:text-indigo-600" title={showLoginPass ? 'Hide Password' : 'Show Password'}>{showLoginPass ? '🙈' : '👁️'}</button>
                                   <button onClick={() => setIsEditingLoginPass(true)} className="p-1 text-slate-300 hover:text-amber-500" title="Edit Password"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                   {loginToolClient.itProfile?.password && (
                                     <button onClick={() => { copyToClipboard(loginToolClient.itProfile!.password!); toast.success('Password Copied'); }} className="p-1 text-slate-300 hover:text-indigo-600" title="Copy Password">📋</button>
                                   )}
                                </div>
                             </>
                          )}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100">
                 <button 
                   onClick={() => { 
                     const userId = loginToolClient.itProfile?.username || loginToolClient.itProfile?.pan || '';
                     if (userId) {
                       copyToClipboard(userId);
                       toast.success('User ID / PAN Copied! Opening Income Tax Portal...');
                     }
                     window.open('https://eportal.incometax.gov.in/iec/foservices/#/login', '_blank'); 
                   }}
                   className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 transition-all shadow-2xl active:scale-[0.98] flex items-center justify-center gap-3"
                 >
                    Launch IT Portal & Copy User ID
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2-2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                 </button>
              </div>
           </div>
        </div>
      )}

      <ITClientFormModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleDataChange} initialData={selectedClient} />

      {/* Full Detail View Modal removed - replaced by ITViewIcon */}
    </div>
  );
};

export default ItMasterPortfolio;
