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

const NoticeFiled: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: pageData, isLoading: isPageLoading } = useModuleData('gst_notice_filed');

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

  const [sectionFilter, setSectionFilter] = useState('All');

  // Inline Status Dropdown State
  const [activeStatusMenuId, setActiveStatusMenuId] = useState<string | null>(null);
  const [isReissueMode, setIsReissueMode] = useState(false);

  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
  const [recordToUpdate, setRecordToUpdate] = useState<LitigationRecord | null>(null);
  const [outcomeStatus, setOutcomeStatus] = useState<LitigationStatus>('Drop');
  const [outcomeDate, setOutcomeDate] = useState(new Date().toISOString().split('T')[0]);
  const [outcomeRefNo, setOutcomeRefNo] = useState('');

  const [isLoginBoxOpen, setIsLoginBoxOpen] = useState(false);
  const [selectedClientForLogin, setSelectedClientForLogin] = useState<Client | null>(null);

  const refreshData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['gst_notice_filed'] });
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
    await api.saveLitigationRecord({ ...data, category: 'Notice' });
    setIsModalOpen(false);
    setIsViewModalOpen(false);
    setIsReissueMode(false);
    refreshData();
  };

  const updateRecordStatus = async (record: LitigationRecord, newStatus: LitigationStatus) => {
    setRecordToUpdate(record);
    setOutcomeStatus(newStatus);
    setOutcomeDate(new Date().toISOString().split('T')[0]);
    setOutcomeRefNo('');
    setIsOutcomeModalOpen(true);
    setActiveStatusMenuId(null);
  };

  const submitOutcome = async () => {
    if (!recordToUpdate) return;
    try {
      const updated = {
        ...recordToUpdate,
        status: outcomeStatus,
        orderDate: outcomeDate,
        referenceNo: outcomeRefNo || recordToUpdate.referenceNo
      };
      await api.saveLitigationRecord(updated);
      setIsOutcomeModalOpen(false);
      setRecordToUpdate(null);
      refreshData();
      toast.success("Outcome updated successfully");
    } catch (err) { toast.error("Outcome update failed."); }
  };

  const sections = useMemo(() => Array.from(new Set(records.map(r => r.section).filter(Boolean))).sort(), [records]);

  const filteredRecords = useMemo(() => {
    const s = search.toLowerCase();
    let list = records.filter(r => {
      const client = clients.find(c => c.id === r.clientId);
      return (r.clientName || '').toLowerCase().includes(s) || 
             (r.referenceNo || '').toLowerCase().includes(s) ||
             (client?.gstProfile?.gstin || '').toLowerCase().includes(s);
    });
    if (sectionFilter !== 'All') list = list.filter(r => r.section === sectionFilter);
    return list;
  }, [records, clients, search, sectionFilter]);

  const handleExportCSV = () => {
    const headers = ['S.No.', 'Trade Name', 'GSTIN', 'Notice Ref', 'Section', 'Filing Date', 'Reply Ref'];
    const rows = filteredRecords.map((r, idx) => {
      const c = clients.find(cl => cl.id === r.clientId);
      return [
        (idx + 1).toString().padStart(2, '0'),
        r.clientName,
        c?.gstProfile?.gstin || '---',
        r.referenceNo || '---',
        'U/s ' + (r.section || '---'),
        r.replyDate || r.filedDate || '---',
        r.replyReferenceNo || '---'
      ];
    });
    exportToCSV(headers, rows, 'GST_Notice_Replies_Filed.csv');
  };

  const handleExportPDF = () => {
    const headers = ['Trade Name', 'GSTIN', 'Notice Ref', 'Section', 'Filing Date', 'Reply Ref'];
    const rows = filteredRecords.map(r => {
      const c = clients.find(cl => cl.id === r.clientId);
      return [
        r.clientName,
        c?.gstProfile?.gstin || '---',
        r.referenceNo || '---',
        'U/s ' + (r.section || '---'),
        r.replyDate || r.filedDate || '---',
        r.replyReferenceNo || '---'
      ];
    });
    printList('GST Notice Replies Filed', headers, rows);
  };

  if (isLoading) return <Loader />;

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col space-y-3 overflow-hidden">
      
      {/* Top Bar with Simple Total Count Badge as requested */}
      <div className="flex flex-col lg:flex-row items-center gap-3 bg-white p-2.5 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        
        {/* Simple Total Count Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-900 text-white shadow-sm flex items-center gap-2">
            <span>Total Replies Filed</span>
            <span className="px-2 py-0.2 rounded-md text-xs font-black bg-white/20 text-white">{records.length}</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative flex-1 w-full group">
          <input 
            type="text" 
            placeholder="Search filed replies by Trade Name, GSTIN or Notice Ref..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-2 pl-10 pr-3 font-bold text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all" 
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
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
                No filed replies found matching current search
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
                          Filed: {formatDate(rec.filedDate)}
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
                        <span className="font-bold text-[10px] text-slate-400 uppercase">Section:</span>
                        <span className="font-semibold text-slate-800">{rec.section ? `U/s ${rec.section}` : '---'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-[10px] text-slate-400 uppercase">Tax Period:</span>
                        <span className="font-medium text-slate-700">{rec.taxPeriod || '---'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-[10px] text-slate-400 uppercase">Ref No:</span>
                        <span className="font-mono text-slate-700 truncate max-w-[140px]">{rec.referenceNo || '---'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-[10px] text-slate-400 uppercase">Reply Ref:</span>
                        <span className="font-mono text-emerald-700 truncate max-w-[140px]">{rec.replyReferenceNo || '---'}</span>
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

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                      <div className="relative">
                        <button 
                          onClick={() => setActiveStatusMenuId(activeStatusMenuId === rec.id ? null : rec.id)}
                          className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>Outcome</span>
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {activeStatusMenuId === rec.id && (
                          <div className="absolute bottom-full mb-1 z-50 left-0 w-36 bg-white border border-slate-200 rounded-xl shadow-xl p-1 text-left flex flex-col">
                            <button onClick={() => updateRecordStatus(rec, 'Drop')} className="w-full px-2.5 py-1.5 text-xs font-bold uppercase rounded-lg hover:bg-emerald-50 text-emerald-700 text-left cursor-pointer">Drop Order</button>
                            <button onClick={() => { 
                              setSelectedRecord(rec); 
                              setIsReissueMode(true); 
                              setIsModalOpen(true); 
                              setActiveStatusMenuId(null);
                            }} className="w-full px-2.5 py-1.5 text-xs font-bold uppercase rounded-lg hover:bg-indigo-50 text-indigo-700 border-t border-slate-50 text-left cursor-pointer">Reissued</button>
                            <button onClick={() => updateRecordStatus(rec, 'Demand')} className="w-full px-2.5 py-1.5 text-xs font-bold uppercase rounded-lg hover:bg-rose-50 text-rose-700 border-t border-slate-50 text-left cursor-pointer">Demand Order</button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
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
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2 border-b border-slate-200 w-[12%] min-w-[110px] whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span>Section</span>
                      <select 
                        value={sectionFilter} 
                        onChange={e => setSectionFilter(e.target.value)} 
                        className="bg-transparent border-none text-[10px] uppercase font-bold text-indigo-600 outline-none cursor-pointer p-0"
                      >
                        <option value="All">All</option>
                        {sections.map(s => <option key={s} value={s}>U/s {s}</option>)}
                      </select>
                    </div>
                  </th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2 border-b border-slate-200 w-[12%] min-w-[100px] whitespace-nowrap">Tax Period</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2 border-b border-slate-200 w-[13%] min-w-[110px] whitespace-nowrap">Filing Date</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2 border-b border-slate-200 w-[13%] min-w-[110px] text-center whitespace-nowrap">Status Update</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2 border-b border-slate-200 w-[14%] min-w-[150px]">Remark</th>
                  <th className="sticky top-0 z-30 bg-slate-100 px-3 py-2 border-b border-slate-200 text-right w-[110px] whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-24 text-center text-slate-400 font-bold uppercase tracking-wider">
                      No filed replies in vault
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
                        <td className="px-3 py-2 font-medium text-slate-700 whitespace-nowrap">
                          {rec.taxPeriod || '---'}
                        </td>
                        <td className="px-3 py-2 font-bold text-emerald-600 uppercase whitespace-nowrap">
                          {formatDate(rec.filedDate)}
                        </td>
                        <td className={`px-3 py-2 text-center relative whitespace-nowrap ${activeStatusMenuId === rec.id ? "z-50" : "z-0"}`}>
                          <div className="relative inline-block">
                            <button 
                              onClick={() => setActiveStatusMenuId(activeStatusMenuId === rec.id ? null : rec.id)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <span>Update</span>
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            {activeStatusMenuId === rec.id && (
                              <div className="absolute top-full mt-1 z-50 left-1/2 -translate-x-1/2 w-36 bg-white border border-slate-200 rounded-xl shadow-xl p-1 text-left flex flex-col">
                                <button onClick={() => updateRecordStatus(rec, 'Drop')} className="w-full px-2.5 py-1.5 text-xs font-bold uppercase rounded-lg hover:bg-emerald-50 text-emerald-700 text-left cursor-pointer">Drop Order</button>
                                <button onClick={() => { 
                                  setSelectedRecord(rec); 
                                  setIsReissueMode(true); 
                                  setIsModalOpen(true); 
                                  setActiveStatusMenuId(null);
                                }} className="w-full px-2.5 py-1.5 text-xs font-bold uppercase rounded-lg hover:bg-indigo-50 text-indigo-700 border-t border-slate-50 text-left cursor-pointer">Reissued</button>
                                <button onClick={() => updateRecordStatus(rec, 'Demand')} className="w-full px-2.5 py-1.5 text-xs font-bold uppercase rounded-lg hover:bg-rose-50 text-rose-700 border-t border-slate-50 text-left cursor-pointer">Demand Order</button>
                              </div>
                            )}
                          </div>
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
          setIsReissueMode(false);
          setIsModalOpen(true);
        }}
        onDataChange={refreshData}
      />

      {/* Portal Login Modal */}
      <GSTPortalLoginModal
        isOpen={isLoginBoxOpen}
        onClose={() => setIsLoginBoxOpen(false)}
        client={selectedClientForLogin}
      />

      {isOutcomeModalOpen && recordToUpdate && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-1">Final Resolution</p>
                 <h3 className="text-lg font-black truncate">Record {outcomeStatus} Order</h3>
              </div>
              <button onClick={() => setIsOutcomeModalOpen(false)} className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"><svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6" /></svg></button>
            </div>
            <div className="p-6 space-y-4">
               <div>
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1 mb-1.5 block">Order Date</label>
                 <input type="date" value={outcomeDate} onChange={e => setOutcomeDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all font-mono text-slate-900" />
               </div>
               <div>
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1 mb-1.5 block">Order Reference No.</label>
                 <input type="text" value={outcomeRefNo} onChange={e => setOutcomeRefNo(e.target.value)} placeholder="Order Ref No / DIN..." className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all text-slate-900" />
               </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button onClick={() => setIsOutcomeModalOpen(false)} className="flex-1 py-2.5 bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-300 transition-all">Cancel</button>
              <button onClick={submitOutcome} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-900 transition-all">Record Order</button>
            </div>
          </div>
        </div>
      )}

      <NoticeForm 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setIsReissueMode(false); }} 
        onSave={handleSave} 
        onDelete={handleDelete} 
        clients={clients} 
        category="Notice" 
        initialData={selectedRecord} 
        isReissue={isReissueMode}
      />
    </div>
  );
};

export default NoticeFiled;