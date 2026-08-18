import { socketService } from '../../../services/socket.ts';
import { useState, useCallback, useEffect } from 'react';
import { api } from '../../../services/api';

export interface GSTR4FilingStatus {
  remark?: string;
  filed: boolean;
  date?: string;
}

const STORAGE_KEY = 'clientify_gstr4_filing_v1';
const STORAGE_KEY_DATES = 'clientify_gstr4_due_dates_v1';

export const useGSTR4Logic = (
  selectedYear: string,
  initialData?: Record<string, Record<string, GSTR4FilingStatus>>,
  initialDates?: Record<string, string>
) => {
  const [allData, setAllData] = useState<Record<string, Record<string, GSTR4FilingStatus>>>(initialData || {});
  const [dueDates, setDueDates] = useState<Record<string, string>>(initialDates || {});
  const [isDataLoaded, setIsDataLoaded] = useState(!!initialData);

  const initialDataStr = JSON.stringify(initialData);
  const initialDatesStr = JSON.stringify(initialDates);

  useEffect(() => {
    if (initialData) setAllData(initialData);
    if (initialDates) setDueDates(initialDates);
    if (initialData || initialDates) setIsDataLoaded(true);
  }, [initialDataStr, initialDatesStr]);

  useEffect(() => {
    if (initialData) return;
    const load = async () => {
      try {
        const data = await api.getAppData(STORAGE_KEY);
        if (data) setAllData(data);
        const dates = await api.getAppData(STORAGE_KEY_DATES);
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
    // Calculate new value outside of state setter to prevent multi-triggering in React StrictMode
    const yearData = allData[selectedYear] || {};
    const clientData = { ...(yearData[clientId] || { filed: false }) };
    
    clientData.filed = !clientData.filed;
    if (clientData.filed) {
      clientData.date = new Date().toISOString().split('T')[0];
    } else {
      delete clientData.date;
    }

    // Optimistically update local state
    setAllData(prev => {
      const yData = { ...(prev[selectedYear] || {}) };
      yData[clientId] = clientData;
      return { ...prev, [selectedYear]: yData };
    });

    // Make API request without duplicate socket emit
    api.patchAppData(STORAGE_KEY, { [`data.${selectedYear}.${clientId}`]: clientData })
      .catch(console.error);
  }, [selectedYear, allData]);

  const getStatus = useCallback((clientId: string): GSTR4FilingStatus => {
    return (allData[selectedYear] || {})[clientId] || { filed: false };
  }, [allData, selectedYear]);

  const updateRemark = useCallback((clientId: string, val: string) => {
    setAllData(prev => {
      const yData = { ...(prev[selectedYear] || {}) };
      const cData = { ...(yData[clientId] || { filed: false }), remark: val };
      yData[clientId] = cData;
      return { ...prev, [selectedYear]: yData };
    });

    api.patchAppData(STORAGE_KEY, { [`data.${selectedYear}.${clientId}.remark`]: val })
      .catch(console.error);
  }, [selectedYear]);

  const updateDueDate = (val: string) => {
    const next = { ...dueDates, [selectedYear]: val };
    setDueDates(next);
    api.patchAppData(STORAGE_KEY_DATES, { [`data.${selectedYear}`]: val })
      .catch(console.error);
  };

  const getDueDate = () => dueDates[selectedYear] || '';

  return { getStatus, toggleStatus, updateRemark, updateDueDate, getDueDate, isDataLoaded };
};