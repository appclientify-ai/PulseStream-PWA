import { useState, useCallback, useEffect } from 'react';
import { api } from '../../../services/api';

export interface BalStatus {
  ready: boolean;
  date?: string;
}

const STORAGE_KEY = 'clientify_balancesheet_data_v1';
const STORAGE_KEY_DATES = 'clientify_balancesheet_due_dates_v1';

export const useBalancesheetLogic = (selectedYear: string) => {
  const [allData, setAllData] = useState<Record<string, Record<string, BalStatus>>>({});
  const [dueDates, setDueDates] = useState<Record<string, string>>({});
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
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
  }, []);

  const toggleStatus = useCallback((clientId: string) => {
    setAllData(prev => {
      const yearData = { ...(prev[selectedYear] || {}) };
      const clientData = { ...(yearData[clientId] || { ready: false }) };
      
      clientData.ready = !clientData.ready;
      if (clientData.ready) {
        clientData.date = new Date().toISOString().split('T')[0];
      } else {
        delete clientData.date;
      }
      
      yearData[clientId] = clientData;
      const next = { ...prev, [selectedYear]: yearData };
      api.saveAppData(STORAGE_KEY, next).catch(console.error);
      return next;
    });
  }, [selectedYear]);

  const getStatus = useCallback((clientId: string): BalStatus => {
    return (allData[selectedYear] || {})[clientId] || { ready: false };
  }, [allData, selectedYear]);

  const updateDueDate = (val: string) => {
    const next = { ...dueDates, [selectedYear]: val };
    setDueDates(next);
    api.saveAppData(STORAGE_KEY_DATES, next).catch(console.error);
  };

  const getDueDate = () => dueDates[selectedYear] || '';

  return { getStatus, toggleStatus, updateDueDate, getDueDate, isDataLoaded };
};