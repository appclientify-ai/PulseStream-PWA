import { useState, useCallback, useEffect } from 'react';
import { api } from '../../../../services/api';

export interface FilingStatus {
  r1: boolean;
  r3b: boolean;
}

const STORAGE_KEY = 'clientify_quarterly_filing_v3';
const STORAGE_KEY_DATES = 'clientify_quarterly_due_dates_v1';

export const useQuarterlyFilingLogic = (selectedYear: string, selectedQuarter: string) => {
  const periodKey = `${selectedYear}_${selectedQuarter}`;
  
  const [allData, setAllData] = useState<Record<string, Record<string, FilingStatus>>>({});
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

  const toggleStatus = useCallback((clientId: string, type: 'r1' | 'r3b') => {
    setAllData(prev => {
      const periodData = { ...(prev[periodKey] || {}) };
      const clientData = { ...(periodData[clientId] || { r1: false, r3b: false }) };
      const newVal = !clientData[type];
      clientData[type] = newVal;
      periodData[clientId] = clientData;
      const next = { ...prev, [periodKey]: periodData };
      api.patchAppData(STORAGE_KEY, { [`data.${periodKey}.${clientId}.${type}`]: newVal }).catch(console.error);
      return next;
    });
  }, [periodKey]);

  const getStatus = useCallback((clientId: string): FilingStatus => {
    return (allData[periodKey] || {})[clientId] || { r1: false, r3b: false };
  }, [allData, periodKey]);

  const updateDueDate = (val: string) => {
    const next = { ...dueDates, [periodKey]: val };
    setDueDates(next);
    api.patchAppData(STORAGE_KEY_DATES, { [`data.${periodKey}`]: val }).catch(console.error);
  };

  const getDueDate = () => dueDates[periodKey] || '';

  return { getStatus, toggleStatus, updateDueDate, getDueDate, isDataLoaded };
};