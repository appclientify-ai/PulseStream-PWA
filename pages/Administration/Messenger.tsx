
import React, { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useModuleData } from '../../hooks/useModuleData.ts';
import { Client } from '../../types';
import Loader from '../../components/Loader';
import { TableFilter } from '../../components/TableFilter';
import ViewControl from '../../components/ViewControl';
import { ExportMenu } from '../../components/ExportMenu';
import { exportToCSV, printList } from '../../exportUtils';
import { toast } from 'sonner';

const DEFAULT_TEMPLATES = [
  { id: 'data', label: 'Data Request', text: "Dear {{LEGAL_NAME}},\n\nPlease provide purchase/sale data for {{TRADE_NAME}} ({{GSTIN}}) for current filing.\n\nRegards,\nVault Team" },
  { id: 'done', label: 'Filing Done', text: "Dear {{LEGAL_NAME}},\n\nYour GST return for {{TRADE_NAME}} ({{GSTIN}}) has been filed successfully.\n\nRegards,\nVault Team" },
  { id: 'tax_payment', label: 'Tax Payment Due', text: "Dear {{LEGAL_NAME}},\n\nKindly note your tax liability for {{TRADE_NAME}} ({{GSTIN}}) is pending for payment. Please arrange payment at the earliest.\n\nRegards,\nVault Team" },
  { id: 'notice_intimation', label: 'Department Notice', text: "Dear {{LEGAL_NAME}},\n\nA department communication has been issued for {{TRADE_NAME}} ({{GSTIN}}). Please review and coordinate with our office for timely reply.\n\nRegards,\nVault Team" },
];

export const Messenger: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedClients, setSelectedClients] = useState<Record<string, Client>>({});
  const [templateText, setTemplateText] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  const [userTemplates, setUserTemplates] = useState<{label: string, text: string}[]>(() => {
    const saved = localStorage.getItem('clientify_custom_templates');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isQueueActive, setIsQueueActive] = useState(false);
  const [queueIndex, setQueueIndex] = useState(0);

  const [activeSection, setActiveSection] = useState<'All' | 'GST' | 'ITR' | 'Audit' | 'GSTR-4' | 'GSTR-9/9C'>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [relFilter, setRelFilter] = useState<string>('All');

  // Specific query for each segment to achieve fast access and database-level pre-filtering
  const { data: clientsData = [], isLoading } = useModuleData<Client[]>('messenger_clients', activeSection);

  // Query all clients to derive counts for segment tabs
  const { data: allClients = [] } = useModuleData<Client[]>('messenger_clients', 'All');

  useEffect(() => {
    const syncHandler = () => {
      queryClient.invalidateQueries({ queryKey: ['messenger_clients'] });
    };
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, [queryClient]);

  // GSTR 9 Watchlist reader for exact matching
  const gstr9WatchlistIds = useMemo(() => {
    try {
      const raw = localStorage.getItem('clientify_gstr9_watchlist_v2');
      if (!raw) return new Set<string>();
      const parsed = JSON.parse(raw);
      const set = new Set<string>();
      Object.values(parsed).forEach((arr: any) => {
        if (Array.isArray(arr)) arr.forEach((id: string) => set.add(id));
      });
      return set;
    } catch {
      return new Set<string>();
    }
  }, []);

  const isClientInCategory = (c: Client, section: 'All' | 'GST' | 'ITR' | 'Audit' | 'GSTR-4' | 'GSTR-9/9C') => {
    if (section === 'All') return true;
    if (section === 'GST') {
      return Boolean(c.gstProfile?.gstin || c.services?.includes('GST') || c.gstProfile?.regType);
    }
    if (section === 'ITR') {
      return Boolean(c.itProfile?.pan || c.services?.includes('IT') || c.services?.includes('ITR') || c.itProfile?.fileType);
    }
    if (section === 'Audit') {
      return Boolean(c.itProfile?.auditApplicable || c.itProfile?.advisoryWork?.taxAudit || c.services?.includes('Audit') || (c.itProfile?.fileType && c.itProfile.fileType.toLowerCase().includes('audit')));
    }
    if (section === 'GSTR-4') {
      return c.gstProfile?.regType === 'Composition';
    }
    if (section === 'GSTR-9/9C') {
      return gstr9WatchlistIds.has(c.id) || Boolean(c.gstProfile?.gstin);
    }
    return true;
  };

  const filteredClients = useMemo(() => {
    const s = search.toLowerCase();
    let list = clientsData.filter(c => {
      return (
        (c.legalName || '').toLowerCase().includes(s) || 
        (c.tradeName || '').toLowerCase().includes(s) ||
        (c.gstProfile?.gstin && c.gstProfile.gstin.toLowerCase().includes(s)) ||
        (c.mobile && String(c.mobile).includes(s))
      );
    });

    if (statusFilter !== 'All') {
      list = list.filter(c => {
        const gstSt = c.gstProfile?.gstStatus || 'Active';
        if (statusFilter === 'Active') return gstSt === 'Active' || c.status?.includes('Active');
        if (statusFilter === 'Suspended') return gstSt === 'Suspended';
        if (statusFilter === 'Closed') return gstSt === 'Closed';
        if (statusFilter === 'Inactive') return c.status === 'Inactive' || gstSt === 'Closed';
        return gstSt === statusFilter || c.status === statusFilter;
      });
    }

    if (relFilter !== 'All') {
      list = list.filter(c => {
        if (relFilter === 'Active') return c.status === 'Active' || c.status === 'Active Filing';
        return c.status === relFilter;
      });
    }

    if (showOnlySelected) {
      list = list.filter(c => selectedIds.has(c.id));
    }

    return list;
  }, [clientsData, search, statusFilter, relFilter, showOnlySelected, selectedIds]);

  const selectedClientsList = useMemo(() => {
    return Object.values(selectedClients);
  }, [selectedClients]);

  const toggleAll = () => {
    if (selectedIds.size === filteredClients.length && filteredClients.length > 0) {
      const nextIds = new Set(selectedIds);
      const nextClients = { ...selectedClients };
      filteredClients.forEach(c => {
        nextIds.delete(c.id);
        delete nextClients[c.id];
      });
      setSelectedIds(nextIds);
      setSelectedClients(nextClients);
    } else {
      const nextIds = new Set(selectedIds);
      const nextClients = { ...selectedClients };
      filteredClients.forEach(c => {
        nextIds.add(c.id);
        nextClients[c.id] = c;
      });
      setSelectedIds(nextIds);
      setSelectedClients(nextClients);
    }
  };

  const toggleClient = (client: Client) => {
    const nextIds = new Set(selectedIds);
    const nextClients = { ...selectedClients };
    if (nextIds.has(client.id)) {
      nextIds.delete(client.id);
      delete nextClients[client.id];
    } else {
      nextIds.add(client.id);
      nextClients[client.id] = client;
    }
    setSelectedIds(nextIds);
    setSelectedClients(nextClients);
  };

  const formatMessage = (rawText: string, client: Client) => {
    let text = rawText;
    text = text.replace(/{{LEGAL_NAME}}/g, client.legalName || "---");
    text = text.replace(/{{TRADE_NAME}}/g, client.tradeName || "---");
    text = text.replace(/{{GSTIN}}/g, client.gstProfile?.gstin || "N/A");
    text = text.replace(/{{MOBILE}}/g, client.mobile ? String(client.mobile) : "---");
    return text;
  };

  const saveCurrentTemplate = () => {
    if (!templateText.trim()) return;
    const label = prompt("Enter template name:");
    if (label) {
      const next = [...userTemplates, { label, text: templateText }];
      setUserTemplates(next);
      localStorage.setItem('clientify_custom_templates', JSON.stringify(next));
      toast.success("Template saved!");
    }
  };

  const deleteTemplate = (idx: number) => {
    const next = userTemplates.filter((_, i) => i !== idx);
    setUserTemplates(next);
    localStorage.setItem('clientify_custom_templates', JSON.stringify(next));
    toast.success("Template removed");
  };

  const startBroadcast = () => {
    if (selectedIds.size === 0) return;
    setQueueIndex(0);
    setIsQueueActive(true);
    setIsComposerOpen(false);
  };

  const processNext = () => {
    const client = selectedClientsList[queueIndex];
    if (!client) return;
    const personalizedMsg = formatMessage(templateText, client);
    const url = `whatsapp://send?phone=91${client.mobile}&text=${encodeURIComponent(personalizedMsg)}`;
    window.location.href = url;
    if (queueIndex < selectedClientsList.length - 1) {
      setQueueIndex(queueIndex + 1);
    } else {
      toast.success("Broadcast Sequence Completed!");
      setIsQueueActive(false);
      setSelectedIds(new Set());
      setSelectedClients({});
      setShowOnlySelected(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['S.No.', 'Trade Name', 'Legal Name', 'GSTIN', 'Mobile No.', 'GST Status', 'Relationship'];
    const rows = filteredClients.map((c, idx) => [
      (idx + 1).toString().padStart(2, '0'),
      c.tradeName || '---',
      c.legalName || '---',
      c.gstProfile?.gstin || '---',
      c.mobile ? `+91 ${c.mobile}` : '---',
      c.gstProfile?.gstStatus || 'Active',
      c.status || 'Active'
    ]);
    exportToCSV(headers, rows, 'Messenger_Clients_Directory.csv');
  };

  const handleExportPDF = () => {
    const headers = ['Trade Name', 'Legal Name', 'GSTIN', 'Mobile No.', 'Status'];
    const rows = filteredClients.map(c => [
      c.tradeName || '---',
      c.legalName || '---',
      c.gstProfile?.gstin || '---',
      c.mobile ? `+91 ${c.mobile}` : '---',
      c.gstProfile?.gstStatus || 'Active'
    ]);
    printList('Vault Messenger Clients Directory', headers, rows);
  };

  if (isLoading && clientsData.length === 0) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-3 animate-in fade-in duration-500 max-w-full mx-auto w-full overflow-hidden">
      
      {/* Top Filter & Count Bar */}
      <div className="flex flex-col gap-3 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex flex-col lg:flex-row items-center gap-3 w-full">
          
          {/* Interactive Metric Badges */}
          <div className="flex items-center gap-2 shrink-0 flex-nowrap overflow-x-auto no-scrollbar w-full lg:w-auto max-w-full py-0.5">
            <button 
              type="button"
              onClick={() => {
                setActiveSection('All');
                setShowOnlySelected(false);
                setStatusFilter('All');
                setRelFilter('All');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap flex-shrink-0 ${
                activeSection === 'All' && !showOnlySelected
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title="Show all clients"
            >
              <span>Total</span>
              <span className={`px-1.5 py-0.2 rounded-md text-xs font-black ${
                activeSection === 'All' && !showOnlySelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
              }`}>{allClients.length}</span>
            </button>

            <button 
              type="button"
              onClick={() => setShowOnlySelected(false)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap flex-shrink-0 ${
                !showOnlySelected
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
              title="View current section clients"
            >
              <span>Section</span>
              <span className={`px-1.5 py-0.2 rounded-md text-xs font-black ${
                !showOnlySelected ? 'bg-indigo-500 text-white' : 'bg-indigo-200 text-indigo-900'
              }`}>{clientsData.length}</span>
            </button>

            <button 
              type="button"
              onClick={() => setShowOnlySelected(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap flex-shrink-0 ${
                showOnlySelected
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/40' 
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
              title="Click to toggle viewing only selected recipients"
            >
              <span>Selected</span>
              <span className={`px-1.5 py-0.2 rounded-md text-xs font-black ${
                showOnlySelected ? 'bg-emerald-500 text-white' : 'bg-emerald-200 text-emerald-900'
              }`}>{selectedIds.size}</span>
            </button>
          </div>

          {/* Search Input with quick matching count */}
          <div className="relative flex-1 w-full group">
            <input 
              type="text" 
              placeholder="Search client name, trade name, GSTIN, or phone..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-24 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all" 
            />
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-bold text-slate-400">
              <span>{filteredClients.length} found</span>
              {search && (
                <button onClick={() => setSearch('')} className="p-1 hover:text-slate-600">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>

          {/* Selection & Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-nowrap overflow-x-auto no-scrollbar max-w-full w-full lg:w-auto justify-start sm:justify-end py-0.5">
            <button 
              onClick={toggleAll} 
              className="px-3.5 h-11 border border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-xs rounded-xl hover:bg-slate-50 transition-all shadow-xs shrink-0 whitespace-nowrap"
            >
              {selectedIds.size === filteredClients.length && filteredClients.length > 0 ? 'Deselect All' : `Select All (${filteredClients.length})`}
            </button>

            <button 
              disabled={selectedIds.size === 0} 
              onClick={() => setIsComposerOpen(true)}
              className="bg-indigo-600 text-white font-bold uppercase tracking-wider px-5 h-11 rounded-xl shadow-md hover:bg-slate-900 transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 whitespace-nowrap"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              <span>Composer ({selectedIds.size})</span>
            </button>

            {/* View & Export Controls */}
            <ViewControl 
              viewMode={viewMode} 
              onViewChange={setViewMode} 
            />

            <ExportMenu 
              onExportCSV={handleExportCSV} 
              onExportPDF={handleExportPDF} 
            />
          </div>
        </div>

        {/* Section Tabs Below Search Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100">
          {[
            { id: 'All', label: 'All Clients' },
            { id: 'GST', label: 'GST Portfolio' },
            { id: 'ITR', label: 'ITR Portfolio' },
            { id: 'Audit', label: 'Tax Audit' },
            { id: 'GSTR-4', label: 'Annual Return GSTR-4' },
            { id: 'GSTR-9/9C', label: 'Annual Return GSTR-9/9C' },
          ].map(sec => {
            const secCount = allClients.filter(c => isClientInCategory(c, sec.id as any)).length;
            const isSelected = activeSection === sec.id && !showOnlySelected;
            return (
              <button
                key={sec.id}
                onClick={() => {
                  setActiveSection(sec.id as any);
                  setShowOnlySelected(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <span>{sec.label}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {secCount}
                </span>
              </button>
            );
          })}

          {showOnlySelected && (
            <div className="ml-auto flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shrink-0">
              <span>Filtered to {selectedIds.size} Selected</span>
              <button onClick={() => setShowOnlySelected(false)} className="text-emerald-600 hover:text-emerald-900 underline text-[11px]">
                Show All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Table / Grid Area */}
      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-0">
        {viewMode === 'grid' ? (
          <div className="overflow-y-auto no-scrollbar flex-1 p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredClients.length === 0 ? (
              <div className="col-span-full py-24 text-center text-slate-400 font-bold uppercase tracking-wider">
                {showOnlySelected ? 'No recipients selected yet. Check rows to add to broadcast batch.' : 'No Clients Match The Selected Filters'}
              </div>
            ) : (
              filteredClients.map((c, idx) => {
                const isSelected = selectedIds.has(c.id);

                return (
                  <div
                    key={c.id}
                    onClick={() => toggleClient(c)}
                    className={`rounded-2xl p-3.5 border transition-all flex flex-col justify-between gap-3 cursor-pointer select-none ${
                      isSelected 
                        ? 'bg-indigo-50/40 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs' 
                        : 'bg-slate-50/40 border-slate-200/80 hover:border-indigo-200'
                    }`}
                  >
                    {/* Top Row: Checkbox, S.No., and Status Tags */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`h-5 w-5 rounded-md border-2 transition-all flex items-center justify-center ${
                          isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && (
                            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="font-mono text-xs font-bold text-indigo-400">
                          #{(idx + 1).toString().padStart(2, '0')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          (c.gstProfile?.gstStatus || 'Active') === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                          (c.gstProfile?.gstStatus || 'Active') === 'Suspended' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {c.gstProfile?.gstStatus || 'Active'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-200/70">
                          {c.status || 'Active'}
                        </span>
                      </div>
                    </div>

                    {/* Entity Names */}
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-semibold text-slate-900 truncate" title={c.tradeName || c.legalName}>
                        {c.tradeName || c.legalName || '---'}
                      </h4>
                      <p className="text-xs font-medium text-slate-500 truncate" title={c.legalName}>
                        {c.legalName || '---'}
                      </p>
                    </div>

                    {/* Identifiers (GSTIN & Mobile) */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-400 uppercase text-[10px]">GSTIN:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-bold text-slate-800">{c.gstProfile?.gstin || 'N/A'}</span>
                          {c.gstProfile?.gstin && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(c.gstProfile?.gstin || '');
                                toast.success('GSTIN Copied!');
                              }}
                              className="p-0.5 text-slate-400 hover:text-indigo-600"
                              title="Copy GSTIN"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m-6 4h6m-6 4h6" /></svg>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-400 uppercase text-[10px]">Mobile:</span>
                        {c.mobile ? (
                          <a
                            href={`whatsapp://send?phone=91${c.mobile}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
                            title="Direct WhatsApp Chat"
                          >
                            <svg className="h-3.5 w-3.5 fill-emerald-600" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                            <span>+91 {c.mobile}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 font-mono">No Mobile</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="overflow-auto no-scrollbar flex-1 w-full relative h-full">
            <table className="w-full text-left border-collapse table-fixed min-w-[1050px]">
              <thead className="sticky top-0 z-30 bg-slate-100">
                <tr className="bg-slate-50 border-b border-slate-200 shadow-sm font-bold uppercase tracking-wider text-slate-900 text-xs">
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2.5 border-b border-slate-200 w-[50px] text-center whitespace-nowrap">Sel.</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2.5 border-b border-slate-200 w-[55px] text-center whitespace-nowrap">S.No.</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2.5 border-b border-slate-200 w-[24%] min-w-[180px]">Trade Name</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2.5 border-b border-slate-200 w-[22%] min-w-[160px]">Legal Name</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2.5 border-b border-slate-200 w-[16%] min-w-[130px] whitespace-nowrap">GSTIN</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2.5 border-b border-slate-200 w-[14%] min-w-[125px] whitespace-nowrap">Mobile No.</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2.5 border-b border-slate-200 w-[12%] min-w-[110px] whitespace-nowrap">
                    <TableFilter label="Status" isActive={statusFilter !== 'All'}>
                      {['All', 'Active', 'Suspended', 'Closed', 'Inactive'].map(f => (
                        <button
                          key={f}
                          onClick={() => setStatusFilter(f)}
                          className={`w-full text-left px-3 py-2 text-xs font-bold uppercase rounded-lg ${
                            statusFilter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </TableFilter>
                  </th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2.5 border-b border-slate-200 text-right w-[12%] min-w-[110px] whitespace-nowrap">
                    <TableFilter label="Relationship" isActive={relFilter !== 'All'}>
                      {['All', 'Active', 'Active Filing', 'Litigation', 'Consulting', 'Suspended', 'Inactive'].map(f => (
                        <button
                          key={f}
                          onClick={() => setRelFilter(f)}
                          className={`w-full text-left px-3 py-2 text-xs font-bold uppercase rounded-lg ${
                            relFilter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </TableFilter>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-24 text-center text-slate-400 font-bold uppercase tracking-wider">
                      {showOnlySelected ? 'No recipients selected yet. Check rows to add to broadcast batch.' : 'No Clients Match The Selected Filters'}
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((c, idx) => {
                    const isSelected = selectedIds.has(c.id);

                    return (
                      <tr 
                        key={c.id} 
                        onClick={() => toggleClient(c)} 
                        className={`cursor-pointer transition-all border-b border-slate-100 last:border-0 ${
                          isSelected ? 'bg-indigo-50/40' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          <div className={`h-4.5 w-4.5 mx-auto rounded-md border-2 transition-all flex items-center justify-center ${
                            isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && (
                              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 font-bold text-indigo-400 font-mono text-center whitespace-nowrap">
                          {(idx + 1).toString().padStart(2, '0')}
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-slate-900 truncate min-w-[180px]" title={c.tradeName || c.legalName}>
                          <div className="text-sm font-semibold text-slate-900 truncate">
                            {c.tradeName || '---'}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 font-medium text-slate-600 truncate min-w-[160px]" title={c.legalName}>
                          <div className="text-sm font-medium text-slate-600 truncate">
                            {c.legalName || '---'}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1 font-mono font-bold text-xs text-slate-700">
                            <span>{c.gstProfile?.gstin || 'N/A'}</span>
                            {c.gstProfile?.gstin && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(c.gstProfile?.gstin || '');
                                  toast.success('GSTIN Copied!');
                                }}
                                className="p-0.5 text-slate-400 hover:text-indigo-600 transition-colors"
                                title="Copy GSTIN"
                              >
                                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m-6 4h6m-6 4h6" /></svg>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {c.mobile ? (
                            <a
                              href={`whatsapp://send?phone=91${c.mobile}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
                              title="Direct WhatsApp Chat"
                            >
                              <svg className="h-3.5 w-3.5 fill-emerald-600" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                              <span>+91 {c.mobile}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 font-mono text-xs">No Mobile</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            (c.gstProfile?.gstStatus || 'Active') === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                            (c.gstProfile?.gstStatus || 'Active') === 'Suspended' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {c.gstProfile?.gstStatus || (c.status?.includes('Active') ? 'Active' : 'Inact.')}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            c.status === 'Active' || c.status === 'Active Filing' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' :
                            c.status === 'Litigation' ? 'text-amber-700 bg-amber-50 border border-amber-200' : 'text-slate-600 bg-slate-100 border border-slate-200'
                          }`}>
                            {c.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Composer Modal */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Compose Vault Broadcast</h3>
                <p className="text-slate-500 text-xs font-semibold mt-0.5">Routing message sequence to {selectedIds.size} client recipients.</p>
              </div>
              <button onClick={() => setIsComposerOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Select Template</h4>
                  <span className="text-[11px] font-semibold text-indigo-600">Click to apply to composer</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_TEMPLATES.map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => setTemplateText(t.text)} 
                      className="px-3.5 py-1.5 bg-slate-50 hover:bg-indigo-600 text-slate-700 hover:text-white rounded-xl text-xs font-bold uppercase transition-all border border-slate-200/80 shadow-2xs"
                    >
                      {t.label}
                    </button>
                  ))}
                  {userTemplates.map((t, i) => (
                    <div key={i} className="flex items-center bg-indigo-50 rounded-xl border border-indigo-200">
                      <button onClick={() => setTemplateText(t.text)} className="px-3.5 py-1.5 text-indigo-700 text-xs font-bold uppercase">
                        {t.label}
                      </button>
                      <button onClick={() => deleteTemplate(i)} className="pr-2.5 text-indigo-400 hover:text-rose-500 transition-colors" title="Delete custom template">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Message Body</label>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                    <span>Tags:</span>
                    <button type="button" onClick={() => setTemplateText(prev => prev + ' {{LEGAL_NAME}}')} className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-bold">
                      {"{{LEGAL_NAME}}"}
                    </button>
                    <button type="button" onClick={() => setTemplateText(prev => prev + ' {{TRADE_NAME}}')} className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-bold">
                      {"{{TRADE_NAME}}"}
                    </button>
                    <button type="button" onClick={() => setTemplateText(prev => prev + ' {{GSTIN}}')} className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-bold">
                      {"{{GSTIN}}"}
                    </button>
                  </div>
                </div>
                <textarea 
                  value={templateText} 
                  onChange={e => setTemplateText(e.target.value)} 
                  placeholder="Type your message here... Use tags like {{LEGAL_NAME}}, {{TRADE_NAME}}, {{GSTIN}} for personalization."
                  className="w-full flex-1 min-h-[220px] bg-slate-50 border border-slate-200 rounded-2xl p-5 font-medium text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all resize-none leading-relaxed" 
                />
              </section>
            </div>

            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
              <button onClick={saveCurrentTemplate} className="text-indigo-600 font-bold uppercase text-xs hover:underline flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                <span>Save as Custom Template</span>
              </button>
              
              <div className="flex items-center gap-3">
                <button onClick={() => setIsComposerOpen(false)} className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase text-slate-600 hover:bg-slate-200/60 transition-all">
                  Cancel
                </button>
                <button 
                  onClick={startBroadcast} 
                  disabled={!templateText.trim() || selectedIds.size === 0} 
                  className="bg-indigo-600 text-white font-bold uppercase tracking-wider px-8 py-3 rounded-xl shadow-lg hover:bg-slate-900 transition-all disabled:opacity-40 flex items-center gap-2 text-xs"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  <span>Start WhatsApp Sequence</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Queue Broadcast Progress Modal */}
      {isQueueActive && selectedClientsList[queueIndex] && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col">
            <div className="bg-slate-900 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">WhatsApp Broadcast Queue</span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full">
                  {queueIndex + 1} of {selectedClientsList.length}
                </span>
              </div>
              <h3 className="text-lg font-bold truncate">
                {selectedClientsList[queueIndex].tradeName || selectedClientsList[queueIndex].legalName}
              </h3>
              <p className="text-xs font-mono text-indigo-300 mt-0.5">
                {selectedClientsList[queueIndex].gstProfile?.gstin || `Phone: +91 ${selectedClientsList[queueIndex].mobile}`}
              </p>
              <div className="mt-5 h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500" 
                  style={{ width: `${((queueIndex + 1) / selectedClientsList.length) * 100}%` }} 
                />
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <p className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">Formatted Preview</p>
                <div className="text-slate-800 font-medium whitespace-pre-wrap leading-relaxed text-xs max-h-48 overflow-y-auto">
                  {formatMessage(templateText, selectedClientsList[queueIndex])}
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setIsQueueActive(false)} 
                  className="flex-1 py-3 text-slate-500 font-bold uppercase text-xs hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                >
                  Abort Queue
                </button>
                <button 
                  onClick={processNext} 
                  className="flex-[2] bg-emerald-600 text-white font-bold uppercase tracking-wider py-3 rounded-xl shadow-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  <span>{queueIndex === selectedClientsList.length - 1 ? 'Final Send' : 'Send & Next Client'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messenger;

