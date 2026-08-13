
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LitigationRecord, Client, LitigationStatus, LitigationCategory } from '../../types';
import { api } from '../../services/api.ts';
import Loader from '../../components/Loader';
import NoticeForm from '../Clientform/NoticeForm';
import LitigationGuidelinesModal from '../../components/LitigationGuidelinesModal';
import LitigationDetailModal from '../../components/LitigationDetailModal';
import { toast } from 'sonner';
import { formatISOToDDMMYYYY } from '../../dateUtils';
import { ViewControl } from '../../components/ViewControl';

interface LitigationModuleProps {
  category: LitigationCategory;
  status: LitigationStatus;
}

const LitigationModule: React.FC<LitigationModuleProps> = ({ category, status }) => {
  const queryClient = useQueryClient();

  const { data: pageData, isLoading: isPageLoading } = useQuery({
    queryKey: ['litigation_filing_page_data'],
    queryFn: () => api.getLitigationFilingData(),
    staleTime: 1000 * 60 * 5,
  });

  const allRecords = useMemo(() => pageData?.litigation || [], [pageData]);
  const clients = useMemo(() => pageData?.clients || [], [pageData]);
  const records = useMemo(() => allRecords.filter(r => r.category === category && (r.status === status || (status === 'Drop' && r.status === 'Dropped') || (status === 'Dropped' && r.status === 'Drop'))), [allRecords, category, status]);
  const isLoading = isPageLoading && !pageData;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [compactMode, setCompactMode] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<Partial<LitigationRecord> | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<LitigationRecord | null>(null);

  const refreshData = useCallback(() => {
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
    await api.saveLitigationRecord({ ...data, category });
    setIsModalOpen(false);
    setIsViewModalOpen(false);
    refreshData();
  };

  const updateRecordStatus = async (id: string, newStatus: LitigationStatus) => {
    const rec = records.find(r => r.id === id);
    if (rec) {
      await api.saveLitigationRecord({ ...rec, status: newStatus });
      refreshData();
    }
  };

  const filteredRecords = useMemo(() => {
    const s = search.toLowerCase();
    return records.filter(r => 
      (r.clientName || '').toLowerCase().includes(s) || 
      (r.referenceNo || '').toLowerCase().includes(s)
    );
  }, [records, search]);

  if (isLoading) return <Loader />;

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col space-y-2 landscape:space-y-1 pb-2 overflow-hidden">
      
      {/* Mobile & Tablet Compact Stats Strip */}
      <div className="flex flex-wrap items-center justify-between w-full lg:hidden gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl shadow-xs text-xs font-bold text-slate-700 shrink-0">
        <span className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-tight">Category: <strong className="font-black text-slate-900">{category} ({status})</strong></span>
        <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-tight">Cases: <strong className="font-black text-indigo-900">{filteredRecords.length}</strong></span>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-3 landscape:gap-1 bg-white p-2.5 landscape:p-1 rounded-[1.5rem] landscape:rounded-xl border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden lg:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{category}</p>
            <p className="text-xl font-black text-slate-900 leading-none">{filteredRecords.length} <span className="text-[10px] text-indigo-600 font-bold uppercase">{status}</span></p>
          </div>
        </div>

        <div className="relative flex-1 group w-full">
          <input type="text" placeholder={`Search ${category}...`} value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-2.5 landscape:py-1 pl-10 pr-3 font-bold text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none" />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <ViewControl 
            viewMode={viewMode} 
            onViewChange={setViewMode} 
            compactMode={compactMode} 
            onCompactToggle={() => setCompactMode(!compactMode)} 
          />
          <button 
            onClick={() => setIsGuidelinesOpen(true)}
          className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-black uppercase tracking-wider px-4 h-10 landscape:h-8 rounded-xl transition-all text-xs flex items-center gap-1.5 shrink-0"
          title="View Statutory Guidelines for Notice, Appeal, Tribunal & High Court"
        >
          <span>⚖️</span>
          <span>Guidelines</span>
        </button>

        {status === 'Pending' && (
          <button onClick={() => { setSelectedRecord(null); setIsModalOpen(true); }} className="bg-indigo-600 text-white font-black uppercase tracking-widest px-6 h-10 landscape:h-8 rounded-xl shadow-md hover:bg-slate-900 transition-all text-xs flex items-center gap-1.5 shrink-0">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            Add Case
          </button>
        )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-auto no-scrollbar flex-1 w-full relative h-full">
          <table className={`w-full text-left border-collapse table-auto min-w-full compact-table ${compactMode ? 'compact-mode' : ''}`}>
            <thead className="sticky top-0 z-30 bg-slate-100">
              <tr className="bg-slate-50 border-b border-slate-200 shadow-sm">
                <th className="sticky top-0 z-30 bg-slate-100 px-[5.5px] py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200">S.No.</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-[5.5px] py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200">Entity</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-[5.5px] py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200">Ref No</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-[5.5px] py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200">Date</th>
                <th className="sticky top-0 z-30 bg-slate-100 px-[5.5px] py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((rec, idx) => (
                <tr key={rec.id} className="hover:bg-slate-50/50 transition-all text-[12px]">
                  <td className=" px-6 py-5 text-slate-300 font-black">{(idx + 1).toString().padStart(2, '0')}</td>
                  <td className=" px-6 py-5 font-black text-slate-900 uppercase truncate">{rec.clientName}</td>
                  <td className=" px-6 py-5 font-black text-slate-600 uppercase truncate">{rec.referenceNo}</td>
                  <td className=" px-6 py-5 font-black text-slate-400">{formatISOToDDMMYYYY(rec.issuedDate || '')}</td>
                  <td className="px-6 py-5 text-right ">
                     <button onClick={() => { setViewingRecord(rec); setIsViewModalOpen(true); }} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 flex items-center justify-center">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S1.732 16.057.458 12z" /></svg>
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <NoticeForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} onDelete={handleDelete} clients={clients} category={category} initialData={selectedRecord} />
      <LitigationGuidelinesModal isOpen={isGuidelinesOpen} onClose={() => setIsGuidelinesOpen(false)} initialCategory={category} />
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
    </div>
  );
};

export default LitigationModule;
