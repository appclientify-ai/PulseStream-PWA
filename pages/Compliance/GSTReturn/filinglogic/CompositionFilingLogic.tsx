import { useState, useCallback, useEffect } from 'react';
import { api } from '../../../../services/api';

export interface FilingStatus {
  cmp08: boolean;
}

const STORAGE_KEY = 'clientify_composition_filing_v3';
const STORAGE_KEY_DATES = 'clientify_composition_due_dates_v1';

export const useCompositionFilingLogic = (selectedYear: string, selectedQuarter: string) => {
  const periodKey = `${selectedYear}_${selectedQuarter}`;
  
  const [allData, setAllData] = useState<Record<string, Record<string, FilingStatus>>>({});
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
        console.error('Failed to load composition data', err);
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
      const periodData = { ...(prev[periodKey] || {}) };
      const clientData = { ...(periodData[clientId] || { cmp08: false }) };
      const newVal = !clientData.cmp08;
      clientData.cmp08 = newVal;
      periodData[clientId] = clientData;
      const next = { ...prev, [periodKey]: periodData };
      api.patchAppData(STORAGE_KEY, { [`data.${periodKey}.${clientId}.cmp08`]: newVal }).catch(err => console.error('Failed to save composition data', err));
      return next;
    });
  }, [periodKey]);

  const getStatus = useCallback((clientId: string): FilingStatus => {
    return (allData[periodKey] || {})[clientId] || { cmp08: false };
  }, [allData, periodKey]);

  const updateDueDate = (val: string) => {
    const next = { ...dueDates, [periodKey]: val };
    setDueDates(next);
    api.patchAppData(STORAGE_KEY_DATES, { [`data.${periodKey}`]: val }).catch(err => console.error('Failed to save composition due dates', err));
  };

  const getDueDate = () => dueDates[periodKey] || '';

  return { getStatus, toggleStatus, updateDueDate, getDueDate, isDataLoaded };
};