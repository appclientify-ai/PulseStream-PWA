import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useModuleData } from '../../../hooks/useModuleData.ts';
import { LitigationRecord, Client, LitigationStatus } from '../../../types';
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

const CourtDemand: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: allRecords = [], isLoading: isRecordsLoading } = useModuleData<LitigationRecord[]>('highcourt_records');
  const { data: clients = [], isLoading: isClientsLoading } = useModuleData<Client[]>('clients');

  const records = useMemo(() => allRecords.filter(r => r.status === 'Demand'), [allRecords]);
  const isLoading = (isRecordsLoading || isClientsLoading) && allRecords.length === 0;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedRecord, setSelectedRecord] = useState<Partial<LitigationRecord> | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<LitigationRecord | null>(null);
  const [activeStatusMenuId, setActiveStatusMenuId] = useState<string | null>(null);

  const [isLoginBoxOpen, setIsLoginBoxOpen] = useState(false);
  const [selectedClientForLogin, setSelectedClientForLogin] = useState<Client | null>(null);

  const refreshData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['highcourt_records'] });
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  }, [queryClient]);

  useEffect(() => {
    const syncHandler = () => { refreshData(); };
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, [refreshData]);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteHighCourtRecord(id);
      toast.success('Record deleted successfully');
      setIsModalOpen(false);
      refreshData();
    } catch {
      toast.error('Failed to delete record');
    }
  };

  const handleSave = async (data: Partial<LitigationRecord>) => {
    await api.saveHighCourtRecord({ ...data, category: 'HighCourt' });
    setIsModalOpen(false);
    setIsViewModalOpen(false);
    refreshData();
  };

  const updateRecordStatus = async (record: LitigationRecord, newStatus: LitigationStatus, isPaid: boolean = false) => {
    try {
      const updated = { ...record, status: newStatus };
      if (newStatus === 'Drop') {
        updated.isDemandPaid = isPaid;
      } else {
        updated.isDemandPaid = false;
      }
      await api.saveHighCourtRecord(updated);
      refreshData();
      toast.success(isPaid ? 'Demand marked as Paid & Closed' : 'Status reverted successfully');
    } catch {
      toast.error("Outcome update failed.");
    }
    setActiveStatusMenuId(null);
  };

  const filteredRecords = useMemo(() => {
    const s = search.toLowerCase();
    return records.filter(r => {
      const client = clients.find(c => c.id === r.clientId);
      return (r.clientName || '').toLowerCase().includes(s) || 
             ((r.tioRefNo || r.referenceNo || r.filingNo || '').toLowerCase().includes(s)) ||
             (client?.gstProfile?.gstin || '').toLowerCase().includes(s);
    });
  }, [records, clients, search]);

  const handleExportCSV = () => {
    const headers = ['S.No.', 'Trade Name', 'GSTIN', 'Filing/WP No.', 'Matter U/s', 'Judgment Date', 'Outcome'];
    const rows = filteredRecords.map((r, idx) => {
      const c = clients.find(cl => cl.id === r.clientId);
      return [
        (idx + 1).toString().padStart(2, '0'),
        r.clientName,
        c?.gstProfile?.gstin || '---',
        r.filingNo || r.referenceNo || '---',
        'U/s ' + (r.section || '---'),
        r.orderDate || r.tioDate || r.issuedDate || '---',
        'Sustained'
      ];
    });
    exportToCSV(headers, rows, 'HighCourt_Demands.csv');
  };

  const handleExportPDF = () => {
    const headers = ['Trade Name', 'GSTIN', 'Filing/WP No.', 'Matter U/s', 'Judgment Date', 'Outcome'];
    const rows = filteredRecords.map(r => {
      const c = clients.find(cl => cl.id === r.clientId);
      return [
        r.clientName,
        c?.gstProfile?.gstin || '---',
        r.filingNo || r.referenceNo || '---',
        'U/s ' + (r.section || '---'),
        r.orderDate || r.tioDate || r.issuedDate || '---',
        'Sustained'
      ];
    });
    printList('High Court Sustained Demands', headers, rows);
  };

  if (isLoading) return <Loader />;

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col space-y-3 overflow-hidden">
      
      {/* Top Controls Bar */}
      <div className="flex flex-col lg:flex-row items-center gap-3 bg-white p-2.5 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        
        {/* Count Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-600 text-white shadow-sm flex items-center gap-2">
            <span>HC Sustained</span>
            <span className="px-2 py-0.2 rounded-md text-xs font-black bg-white/20 text-white">{records.length}</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative flex-1 group w-full">
          <input 
            type="text" 
            placeholder="Search sustained High Court matters by Trade Name, GSTIN or Case Ref..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-2 pl-10 pr-3 font-bold text-xs text-slate-900 focus:ring-2 focus:ring-rose-600/10 outline-none transition-all" 
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-rose-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
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
        {viewMode === 'table' ? (
          /* Table View */
          <div className="overflow-x-auto no-scrollbar flex-1 min-h-[300px] pb-32">
            <table className="w-full text-left border-collapse table-auto min-w-full">
              <thead className="sticky top-0 z-20">
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-400">S.No.</th>
                  <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-400">Trade Name</th>
                  <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-400">Filing / WP No.</th>
                  <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-400">Matter U/s</th>
                  <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-400">Judgment Date</th>
                  <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-widest text-center">Outcome</th>
                  <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-400">Remark</th>
                  <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-24 text-center text-slate-300 font-black uppercase tracking-widest text-sm">
                      No Sustained High Court Orders Recorded
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec, idx) => {
                  const client = clients.find(c => c.id === rec.clientId);
                  return (
                    <tr key={rec.id} className="hover:bg-rose-50/20 transition-all group text-[12px]">
                      <td className="px-5 py-3.5 text-slate-300 font-black">
                        {(idx + 1).toString().padStart(2, '0')}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-black text-slate-900 truncate max-w-[200px]" title={rec.clientName}>
                          {rec.clientName}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 font-mono tracking-wider">
                          <span>{client?.gstProfile?.gstin || '---'}</span>
                          {client?.gstProfile?.gstin && (
                            <button 
                              onClick={() => setSearch(client.gstProfile?.gstin || '')}
                              className="p-0.5 hover:bg-indigo-50 rounded text-indigo-400 hover:text-indigo-600 transition-colors"
                              title="Search by GSTIN"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-800 uppercase">
                        {rec.filingNo || rec.referenceNo ? (
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-mono">
                            {rec.filingNo || rec.referenceNo}
                          </span>
                        ) : (
                          <span className="text-slate-300">---</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-black text-slate-600">
                        U/s {rec.section || '---'}
                      </td>
                      <td className="px-5 py-3.5 font-black text-rose-600 uppercase">
                        {formatDate(rec.orderDate || rec.tioDate || rec.issuedDate)}
                      </td>
                      <td className={`px-5 py-3.5 text-center relative overflow-visible ${activeStatusMenuId === rec.id ? "z-50" : "z-0"}`}>
                        <div className="relative inline-block w-full">
                          <button 
                            onClick={() => setActiveStatusMenuId(activeStatusMenuId === rec.id ? null : rec.id)}
                            className="w-full px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-rose-50 text-rose-700 border border-rose-200/60 hover:bg-rose-100 transition-all flex items-center justify-between shadow-xs cursor-pointer"
                          >
                            <span>Sustained</span> 
                            <svg className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                          </button>
                          {activeStatusMenuId === rec.id && (
                            <div className="absolute top-full mt-1 z-50 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl p-1 animate-in zoom-in-95 text-left flex flex-col min-w-[140px]">
                              <button 
                                onClick={() => updateRecordStatus(rec, 'Drop', true)} 
                                className="w-full px-3 py-2 text-[10px] font-black uppercase rounded-lg hover:bg-emerald-50 text-emerald-700 text-left transition-colors cursor-pointer"
                              >
                                Demand Paid & Closed
                              </button>
                              <button 
                                onClick={() => updateRecordStatus(rec, 'Filed')} 
                                className="w-full px-3 py-2 text-[10px] font-black uppercase rounded-lg hover:bg-slate-50 text-slate-600 text-left border-t border-slate-50 transition-colors cursor-pointer"
                              >
                                Revert to Filed
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 max-w-[160px]">
                        <EditableRemark 
                          value={rec.remarks || ''} 
                          onSave={async (val) => {
                            await api.saveHighCourtRecord({ ...rec, remarks: val });
                            refreshData();
                          }} 
                        />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {client && (
                            <>
                              <GSTViewIcon client={client} onDataChange={refreshData} />
                              <button
                                onClick={() => { setSelectedClientForLogin(client); setIsLoginBoxOpen(true); }}
                                className="h-7 w-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200/60 flex items-center justify-center transition-all shadow-xs cursor-pointer"
                                title="Login to GST Portal"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => { setViewingRecord(rec); setIsViewModalOpen(true); }} 
                            className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center shadow-xs cursor-pointer" 
                            title="View Details"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg>
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
        ) : filteredRecords.length === 0 ? (
          <div className="py-32 text-center text-slate-300 font-black uppercase tracking-widest text-sm">
            No Sustained High Court Orders Recorded
          </div>
        ) : (
          /* Grid View */
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 overflow-y-auto no-scrollbar flex-1">
            {filteredRecords.map((rec, idx) => {
              const client = clients.find(c => c.id === rec.clientId);
              return (
                <div key={rec.id} className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md hover:border-rose-200 transition-all group">
                  <div className="space-y-3">
                    {/* Header line */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded">
                          #{(idx + 1).toString().padStart(2, '0')}
                        </span>
                        <h4 className="font-black text-slate-900 text-sm truncate max-w-[200px]" title={rec.clientName}>
                          {rec.clientName}
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-rose-100 text-rose-700">
                        Sustained
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-slate-400 text-[10px] uppercase">GSTIN</span>
                        <span className="font-mono font-bold text-indigo-600">{client?.gstProfile?.gstin || '---'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-slate-400 text-[10px] uppercase">Filing / WP No.</span>
                        <span className="font-mono font-bold text-slate-800">{rec.filingNo || rec.referenceNo || '---'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-slate-400 text-[10px] uppercase">Matter U/s</span>
                        <span className="font-black text-slate-800">U/s {rec.section || '---'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-slate-400 text-[10px] uppercase">Judgment Date</span>
                        <span className="font-bold text-rose-600">{formatDate(rec.orderDate || rec.tioDate || rec.issuedDate)}</span>
                      </div>
                    </div>

                    {/* Remark */}
                    <div className="pt-1 border-t border-slate-200/60">
                      <p className="text-[9px] font-bold uppercase text-slate-400 mb-0.5">Remark</p>
                      <EditableRemark 
                        value={rec.remarks || ''} 
                        onSave={async (val) => {
                          await api.saveHighCourtRecord({ ...rec, remarks: val });
                          refreshData();
                        }} 
                      />
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
                    <button 
                      onClick={() => updateRecordStatus(rec, 'Drop', true)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                    >
                      Demand Paid
                    </button>

                    <div className="flex items-center gap-1.5">
                      {client && (
                        <>
                          <GSTViewIcon client={client} onDataChange={refreshData} />
                          <button
                            onClick={() => { setSelectedClientForLogin(client); setIsLoginBoxOpen(true); }}
                            className="h-7 w-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200/60 flex items-center justify-center transition-all shadow-xs cursor-pointer"
                            title="Login to GST Portal"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => { setViewingRecord(rec); setIsViewModalOpen(true); }}
                        className="h-7 w-7 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center shadow-xs cursor-pointer"
                        title="View Details"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 10z" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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

      {/* GST Portal Login Modal */}
      {selectedClientForLogin && (
        <GSTPortalLoginModal
          isOpen={isLoginBoxOpen}
          onClose={() => { setIsLoginBoxOpen(false); setSelectedClientForLogin(null); }}
          client={selectedClientForLogin}
        />
      )}

      <NoticeForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave} 
        onDelete={handleDelete} 
        clients={clients} 
        category="HighCourt" 
        initialData={selectedRecord} 
      />
    </div>
  );
};

export default CourtDemand;
