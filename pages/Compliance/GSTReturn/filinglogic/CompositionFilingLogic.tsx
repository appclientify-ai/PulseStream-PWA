import { useState, useCallback } from 'react';

export interface FilingStatus {
  cmp08: boolean;
}

const STORAGE_KEY = 'clientify_composition_filing_v3';
const STORAGE_KEY_DATES = 'clientify_composition_due_dates_v1';

export const useCompositionFilingLogic = (selectedYear: string, selectedQuarter: string) => {
  const periodKey = `${selectedYear}_${selectedQuarter}`;
  
  const [allData, setAllData] = useState<Record<string, Record<string, FilingStatus>>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  const [dueDates, setDueDates] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DATES);
    return saved ? JSON.parse(saved) : {};
  });

  const toggleStatus = useCallback((clientId: string) => {
    setAllData(prev => {
      const periodData = { ...(prev[periodKey] || {}) };
      const clientData = { ...(periodData[clientId] || { cmp08: false }) };
      clientData.cmp08 = !clientData.cmp08;
      periodData[clientId] = clientData;
      const next = { ...prev, [periodKey]: periodData };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [periodKey]);

  const getStatus = useCallback((clientId: string): FilingStatus => {
    return (allData[periodKey] || {})[clientId] || { cmp08: false };
  }, [allData, periodKey]);

  const updateDueDate = (val: string) => {
    const next = { ...dueDates, [periodKey]: val };
    setDueDates(next);
    localStorage.setItem(STORAGE_KEY_DATES, JSON.stringify(next));
  };

  const getDueDate = () => dueDates[periodKey] || '';

  return { getStatus, toggleStatus, updateDueDate, getDueDate };
};