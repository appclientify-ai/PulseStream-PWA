import { socketService } from '../../../services/socket.ts';
import { useState, useCallback, useEffect } from 'react';
import { api } from '../../../services/api';

export type RefundStatus = 'Pending' | 'Processed' | 'Issued' | 'Adjusted' | 'Rejected' | 'N/A';

export interface ITRFilingStatus {
  remark?: string;
  prepared?: boolean;
  filed: boolean;
  date?: string;
  refundStatus?: RefundStatus;
  itrFile?: string; // Base64 or Blob URL
  compFile?: string; // Base64 or Blob URL
}

const STORAGE_KEY = 'clientify_itr_filing_data_v2';
const STORAGE_KEY_DATES = 'clientify_itr_due_dates_v1';

export const useITRReturnLogic = (
  selectedAY: string,
  initialData?: Record<string, Record<string, ITRFilingStatus>>,
  initialDates?: Record<string, string>
) => {
  const [allData, setAllData] = useState<Record<string, Record<string, ITRFilingStatus>>>(initialData || {});
  const [dueDates, setDueDates] = useState<Record<string, string>>(initialDates || {});
  const [isDataLoaded, setIsDataLoaded] = useState(!!initialData);

  useEffect(() => {
    if (initialData) setAllData(initialData);
    if (initialDates) setDueDates(initialDates);
    if (initialData || initialDates) setIsDataLoaded(true);
  }, [initialData, initialDates]);

  useEffect(() => {
    if (initialData) return;
    const load = async () => {
      try {
        const [data, dates] = await Promise.all([
          api.getAppData(STORAGE_KEY),
          api.getAppData(STORAGE_KEY_DATES)
        ]);
        if (data) setAllData(data);
        if (dates) setDueDates(dates);
      } catch (err) {
        console.error(err);
      } finally {
        setIsDataLoaded(true);
      }
    };
    load();
    const syncHandler = () => load();
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, [initialData]);

  const toggleStatus = useCallback((clientId: string) => {
    setAllData(prev => {
      const yearData = { ...(prev[selectedAY] || {}) };
      const clientData = { ...(yearData[clientId] || { filed: false, prepared: false, refundStatus: 'N/A' }) };
      
      if (clientData.filed) {
        clientData.filed = false;
        clientData.prepared = false;
        delete clientData.date;
        clientData.refundStatus = 'N/A';
      } else if (clientData.prepared) {
        clientData.filed = true;
        clientData.prepared = false;
        clientData.date = new Date().toISOString().split('T')[0];
        if (!clientData.refundStatus || clientData.refundStatus === 'N/A') {
          clientData.refundStatus = 'Pending';
        }
      } else {
        clientData.prepared = true;
        clientData.filed = false;
      }
      
      yearData[clientId] = clientData;
      const next = { ...prev, [selectedAY]: yearData };
      api.patchAppData(STORAGE_KEY, { [`data.${selectedAY}.${clientId}`]: clientData }).then(() => socketService.emit('data_updated')).catch(console.error);
      return next;
    });
  }, [selectedAY]);

  const updateFilingDate = useCallback((clientId: string, date: string) => {
    setAllData(prev => {
      const yearData = { ...(prev[selectedAY] || {}) };
      const clientData = { ...(yearData[clientId] || { filed: true, refundStatus: 'Pending' }) };
      clientData.date = date;
      yearData[clientId] = clientData;
      const next = { ...prev, [selectedAY]: yearData };
      api.patchAppData(STORAGE_KEY, { [`data.${selectedAY}.${clientId}`]: clientData }).then(() => socketService.emit('data_updated')).catch(console.error);
      return next;
    });
  }, [selectedAY]);

  const cycleRefundStatus = useCallback((clientId: string) => {
    const statusFlow: RefundStatus[] = ['Pending', 'Processed', 'Issued', 'Adjusted', 'Rejected', 'N/A'];
    setAllData(prev => {
      const yearData = { ...(prev[selectedAY] || {}) };
      const clientData = { ...(yearData[clientId] || { filed: false, refundStatus: 'N/A' }) };
      const currentIdx = statusFlow.indexOf(clientData.refundStatus || 'N/A');
      const nextIdx = (currentIdx + 1) % statusFlow.length;
      clientData.refundStatus = statusFlow[nextIdx];
      
      yearData[clientId] = clientData;
      const next = { ...prev, [selectedAY]: yearData };
      api.patchAppData(STORAGE_KEY, { [`data.${selectedAY}.${clientId}`]: clientData }).then(() => socketService.emit('data_updated')).catch(console.error);
      return next;
    });
  }, [selectedAY]);

  const updateFileData = useCallback((clientId: string, type: 'itrFile' | 'compFile', base64: string | null) => {
    setAllData(prev => {
      const yearData = { ...(prev[selectedAY] || {}) };
      const clientData = { ...(yearData[clientId] || { filed: false }) };
      
      if (base64) {
        clientData[type] = base64;
      } else {
        delete clientData[type];
      }
      
      yearData[clientId] = clientData;
      const next = { ...prev, [selectedAY]: yearData };
      api.patchAppData(STORAGE_KEY, { [`data.${selectedAY}.${clientId}`]: clientData }).then(() => socketService.emit('data_updated')).catch(console.error);
      return next;
    });
  }, [selectedAY]);

  const getStatus = useCallback((clientId: string): ITRFilingStatus => {
    return (allData[selectedAY] || {})[clientId] || { filed: false, refundStatus: 'N/A' };
  }, [allData, selectedAY]);

  const updateRemark = useCallback((clientId: string, val: string) => {
    setAllData(prev => {
      const yearData = { ...(prev[selectedAY] || {}) };
      const clientData = { ...(yearData[clientId] || { filed: false }), remark: val };
      yearData[clientId] = clientData;
      const next = { ...prev, [selectedAY]: yearData };
      api.patchAppData(STORAGE_KEY, { [`data.${selectedAY}.${clientId}.remark`]: val }).then(() => socketService.emit('data_updated')).catch(console.error);
      return next;
    });
  }, [selectedAY]);

  const updateDueDate = (val: string) => {
    const next = { ...dueDates, [selectedAY]: val };
    setDueDates(next);
    api.patchAppData(STORAGE_KEY_DATES, { [`data.${selectedAY}`]: val }).then(() => socketService.emit('data_updated')).catch(console.error);
  };

  const getDueDate = () => dueDates[selectedAY] || '';

  return { getStatus, toggleStatus, updateRemark, updateFilingDate, cycleRefundStatus, updateFileData, updateDueDate, getDueDate, isDataLoaded };
};