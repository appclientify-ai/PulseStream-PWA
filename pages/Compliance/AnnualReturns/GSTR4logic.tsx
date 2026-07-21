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

export const useGSTR4Logic = (selectedYear: string) => {
  const [allData, setAllData] = useState<Record<string, Record<string, GSTR4FilingStatus>>>({});
  const [dueDates, setDueDates] = useState<Record<string, string>>({});
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
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
  }, []);

  const toggleStatus = useCallback((clientId: string) => {
    setAllData(prev => {
      const yearData = { ...(prev[selectedYear] || {}) };
      const clientData = { ...(yearData[clientId] || { filed: false }) };
      
      clientData.filed = !clientData.filed;
      if (clientData.filed) {
        clientData.date = new Date().toISOString().split('T')[0];
      } else {
        delete clientData.date;
      }
      
      yearData[clientId] = clientData;
      const next = { ...prev, [selectedYear]: yearData };
      api.patchAppData(STORAGE_KEY, { [`data.${selectedYear}.${clientId}`]: clientData }).then(() => socketService.emit('data_updated')).catch(console.error);
      return next;
    });
  }, [selectedYear]);

  const getStatus = useCallback((clientId: string): GSTR4FilingStatus => {
    return (allData[selectedYear] || {})[clientId] || { filed: false };
  }, [allData, selectedYear]);

  const updateDueDate = (val: string) => {
    const next = { ...dueDates, [selectedYear]: val };
    setDueDates(next);
    api.patchAppData(STORAGE_KEY_DATES, { [`data.${selectedYear}`]: val }).then(() => socketService.emit('data_updated')).catch(console.error);
  };

  const getDueDate = () => dueDates[selectedYear] || '';

  return { getStatus, toggleStatus, updateDueDate, getDueDate, isDataLoaded };
};