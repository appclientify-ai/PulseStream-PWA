
import { useState, useCallback } from 'react';

export type RefundStatus = 'Pending' | 'Processed' | 'Issued' | 'Adjusted' | 'Rejected' | 'N/A';

export interface ITRFilingStatus {
  filed: boolean;
  date?: string;
  refundStatus?: RefundStatus;
  itrFile?: string; // Base64 or Blob URL
  compFile?: string; // Base64 or Blob URL
}

const STORAGE_KEY = 'clientify_itr_filing_data_v2';
const STORAGE_KEY_DATES = 'clientify_itr_due_dates_v1';

export const useITRReturnLogic = (selectedAY: string) => {
  const [allData, setAllData] = useState<Record<string, Record<string, ITRFilingStatus>>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  const [dueDates, setDueDates] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DATES);
    return saved ? JSON.parse(saved) : {};
  });

  const toggleStatus = useCallback((clientId: string) => {
    setAllData(prev => {
      const yearData = { ...(prev[selectedAY] || {}) };
      const clientData = { ...(yearData[clientId] || { filed: false, refundStatus: 'N/A' }) };
      
      clientData.filed = !clientData.filed;
      if (clientData.filed) {
        clientData.date = new Date().toISOString().split('T')[0];
        if (!clientData.refundStatus || clientData.refundStatus === 'N/A') {
          clientData.refundStatus = 'Pending';
        }
      } else {
        delete clientData.date;
        clientData.refundStatus = 'N/A';
      }
      
      yearData[clientId] = clientData;
      const next = { ...prev, [selectedAY]: yearData };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [selectedAY]);

  const getStatus = useCallback((clientId: string): ITRFilingStatus => {
    return (allData[selectedAY] || {})[clientId] || { filed: false, refundStatus: 'N/A' };
  }, [allData, selectedAY]);

  const updateDueDate = (val: string) => {
    const next = { ...dueDates, [selectedAY]: val };
    setDueDates(next);
    localStorage.setItem(STORAGE_KEY_DATES, JSON.stringify(next));
  };

  const getDueDate = () => dueDates[selectedAY] || '';

  return { getStatus, toggleStatus, updateFilingDate, cycleRefundStatus, updateFileData, updateDueDate, getDueDate };
};
