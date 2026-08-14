import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useModuleData } from '../../../hooks/useModuleData.ts';
import { LitigationRecord, Client } from '../../../types';
import { api } from '../../../services/api.ts';
import Loader from '../../../components/Loader';
import NoticeForm from '../../Clientform/NoticeForm';
import LitigationDetailModal from '../../../components/LitigationDetailModal';
import GSTViewIcon from '../../../components/GSTViewIcon';
import GSTPortalLoginModal from '../../../components/GSTPortalLoginModal';
import { toast } from 'sonner';
import { EditableRemark } from '../../../components/EditableRemark';
import { formatDate } from '../../../dateUtils';
import ViewControl from '../../../components/ViewControl';
import { ExportMenu } from '../../../components/ExportMenu';
import { exportToCSV, printList } from '../../../exportUtils';

const AppealDrop: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: pageData, isLoading: isPageLoading } = useModuleData('gst_appeal_drop');

  const allRecords = useMemo(() => pageData?.litigation || [], [pageData]);
  const clients = useMemo(() => pageData?.clients || [], [pageData]);
  const records = useMemo(() => allRecords, [allRecords]);
  const isLoading = isPageLoading && !pageData;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedRecord, setSelectedRecord] = useState<Partial<LitigationRecord> | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<LitigationRecord | null>(null);

  const [isLoginBoxOpen, setIsLoginBoxOpen] = useState(false);
  const [selectedClientForLogin, setSelectedClientForLogin] = useState<Client | null>(null);

  const refreshData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['gst_appeal_drop'] });
    queryClient.invalidateQueries({ queryKey: ['litigation_filing_page_data'] });
    queryClient.invalidateQueries({ queryKey: ['litigationRecords'] });
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  }, [queryClient]);

  useEffect(() => {
    const syncHandler = () => { refreshData(); };
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, [refreshData]);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteLitigationRecord(id);
      toast.success('Record deleted successfully');
      setIsModalOpen(false);
      refreshData();
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };

  const handleSave = async (data: Partial<LitigationRecord>) => {
    await api.saveLitigationRecord({ ...data, category: 'Appeal' });
    setIsModalOpen(false);
    setIsViewModalOpen(false);
    refreshData();
  };

  const filteredRecords = useMemo(() => {
    const s = search.toLowerCase();
    return records.filter(r => {
      const client = clients.find(c => c.id === r.clientId);
      return (r.clientName || '').toLowerCase().includes(s) || 
             (r.referenceNo || '').toLowerCase().includes(s) ||
             (client?.gstProfile?.gstin || '').toLowerCase().includes(s);
    });
  }, [records, clients, search]);

  const handleExportCSV = () => {
    const headers = ['S.No.', 'Trade Name', 'GSTIN', 'Order Ref', 'Section', 'Order Date', 'Outcome'];
    const rows = filteredRecords.map((r, idx) => {
      const c = clients.find(cl => cl.id === r.clientId);
      return [
        (idx + 1).toString().padStart(2, '0'),
        r.clientName,
        c?.gstProfile?.gstin || '---',
        r.referenceNo || '---',
        'U/s ' + (r.section || '---'),
        r.orderDate || r.issuedDate || '---',
        r.isDemandPaid ? 'Paid & Closed' : 'Relief Granted'
      ];
    });
    exportToCSV(headers, rows, 'GST_Appeal_Reliefs.csv');
  };

  const handleExportPDF = () => {
    const headers = ['Trade Name', 'GSTIN', 'Order Ref', 'Section', 'Order Date', 'Outcome'];
    const rows = filteredRecords.map(r => {
      const c = clients.find(cl => cl.id === r.clientId);
      return [
        r.clientName,
        c?.gstProfile?.gstin || '---',
        r.referenceNo || '---',
        'U/s ' + (r.section || '---'),
        r.orderDate || r.issuedDate || '---',
        r.isDemandPaid ? 'Paid & Closed' : 'Relief Granted'
      ];
    });
    printList('GST Appeal Relief Orders', headers, rows);
  };

  if (isLoading) return <Loader />;

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col space-y-3 overflow-hidden">
      
      {/* Top Controls Bar */}
      <div className="flex flex-col lg:flex-row items-center gap-3 bg-white p-2.5 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        
        {/* Count Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-600 text-white shadow-sm flex items-center gap-2">
            <span>Closed (Relief)</span>
            <span className="px-2 py-0.2 rounded-md text-xs font-black bg-white/20 text-white">{records.length}</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative flex-1 group w-full">
          <input 
            type="text" 
            placeholder="Search relief orders in appeal vault..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-2 pl-10 pr-3 font-bold text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600/10 outline-none transition-all" 
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        {/* View & Export Controls */}
        <div className="flex items-center gap-2 shrink-0">
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

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {viewMode === 'grid' ? (
          <div className="p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecords.length === 0 ? (
              <div className="col-span-full py-24 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
                No favorable outcomes archived
              </div>
            ) : (
              filteredRecords.map((rec, idx) => {
                const client = clients.find(c => c.id === rec.clientId);

                return (
                  <div key={rec.id} className="p-4 bg-slate-50/70 hover:bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                          #{((idx + 1).toString().padStart(2, '0'))}
                        </span>
                        <span className="text-xs font-bold text-emerald-600">
                          Order: {formatDate(rec.orderDate || rec.issuedDate)}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 truncate" title={rec.clientName}>
                        {rec.clientName || '---'}
                      </h4>
                      <p className="text-xs font-mono font-medium text-indigo-600 truncate mt-0.5">
                        {client?.gstProfile?.gstin || '---'}
                      </p>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-[10px] text-slate-400 uppercase">Order U/s:</span>
                        <span className="font-semibold text-slate-800">{rec.section ? `U/s ${rec.section}` : '---'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-[10px] text-slate-400 uppercase">Outcome:</span>
                        <span className="font-bold text-emerald-700">{rec.isDemandPaid ? 'Paid' : 'Relief Granted'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-[10px] text-slate-400 uppercase">Ref No:</span>
                        <span className="font-mono text-slate-700 truncate max-w-[140px]">{rec.referenceNo || '---'}</span>
                      </div>
                    </div>

                    <div className="pt-1">
                      <EditableRemark 
                        value={rec.remarks || ''} 
                        onSave={async (val) => {
                          await api.saveLitigationRecord({ ...rec, remarks: val });
                          refreshData();
                        }} 
                      />
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-200/60">
                      {client && <GSTViewIcon client={client} onDataChange={refreshData} />}
                      <button 
                        onClick={() => { setViewingRecord(rec); setIsViewModalOpen(true); }} 
                        className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-xs cursor-pointer"
                        title="View Details"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="overflow-auto no-scrollbar flex-1 w-full relative h-full">
            <table className="w-full text-left border-collapse table-fixed min-w-[1100px]">
              <thead className="sticky top-0 z-30 bg-slate-100">
                <tr className="bg-slate-50 border-b border-slate-200 shadow-sm font-bold uppercase tracking-wider text-slate-900 text-xs">
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2 border-b border-slate-200 w-[55px] text-center whitespace-nowrap">S.No.</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2 border-b border-slate-200 w-[24%] min-w-[180px]">Trade Name</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2 border-b border-slate-200 w-[14%] min-w-[110px] whitespace-nowrap">Order U/s</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2 border-b border-slate-200 w-[14%] min-w-[110px] whitespace-nowrap">Order Date</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2 border-b border-slate-200 w-[15%] min-w-[130px] text-center whitespace-nowrap">Outcome</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2 border-b border-slate-200 w-[14%] min-w-[150px]">Remark</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2 border-b border-slate-200 text-right w-[110px] whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-24 text-center text-slate-400 font-bold uppercase tracking-wider">
                      No favorable outcomes archived
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec, idx) => {
                    const client = clients.find(c => c.id === rec.clientId);

                    return (
                      <tr key={rec.id} className="group hover:bg-indigo-50/10 transition-all border-b border-slate-100 last:border-0">
                        <td className="px-3 py-2 font-bold text-indigo-400 font-mono text-center whitespace-nowrap">
                          {(idx + 1).toString().padStart(2, '0')}
                        </td>
                        <td className="px-3 py-2 truncate min-w-[180px]">
                          <div className="font-semibold text-slate-900 truncate leading-normal" title={rec.clientName}>
                            {rec.clientName || '---'}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                            <span>{client?.gstProfile?.gstin || '---'}</span>
                            {client?.gstProfile?.gstin && (
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(client.gstProfile?.gstin || '');
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
                        <td className="px-3 py-2 font-medium text-slate-700 whitespace-nowrap">
                          {rec.section ? `U/s ${rec.section}` : '---'}
                        </td>
                        <td className="px-3 py-2 font-bold text-emerald-600 uppercase whitespace-nowrap">
                          {formatDate(rec.orderDate || rec.issuedDate)}
                        </td>
                        <td className="px-3 py-2 text-center whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${
                            rec.isDemandPaid ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {rec.isDemandPaid ? 'Paid' : 'Relief Granted'}
                          </span>
                        </td>
                        <td className="px-3 py-2 truncate min-w-[150px]">
                          <EditableRemark 
                            value={rec.remarks || ''} 
                            onSave={async (val) => {
                              await api.saveLitigationRecord({ ...rec, remarks: val });
                              refreshData();
                            }} 
                          />
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap w-[110px]">
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={() => { 
                                if (client) {
                                  setSelectedClientForLogin(client);
                                  setIsLoginBoxOpen(true);
                                }
                              }} 
                              className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center shadow-xs"
                              title="Portal Login"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            </button>
                            {client && <GSTViewIcon client={client} onDataChange={refreshData} />}
                            <button 
                              onClick={() => { setViewingRecord(rec); setIsViewModalOpen(true); }} 
                              className="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-xs"
                              title="View Details"
                            >
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
        )}
      </div>

      <LitigationDetailModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        record={viewingRecord}
        clients={clients}
        onEdit={(rec) => {
          setSelectedRecord(rec);
          setIsModalOpen(true);
        }}
        onDataChange={refreshData}
      />

      <GSTPortalLoginModal
        isOpen={isLoginBoxOpen}
        onClose={() => setIsLoginBoxOpen(false)}
        client={selectedClientForLogin}
      />

      <NoticeForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave} 
        onDelete={handleDelete} 
        clients={clients} 
        category="Appeal" 
        initialData={selectedRecord} 
      />
    </div>
  );
};

export default AppealDrop;