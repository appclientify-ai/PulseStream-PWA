
import { useState, useCallback } from 'react';

export interface FilingStatus {
  r1: boolean;
  r3b: boolean;
  iff1?: boolean; // IFF for Month 1 of Quarter
  iff2?: boolean; // IFF for Month 2 of Quarter
}

const STORAGE_KEY = 'clientify_quarterly_filing_v3';
const STORAGE_KEY_DATES = 'clientify_global_compliance_dates_v1';

export const useQuarterlyFilingLogic = (selectedYear: string, selectedQuarter: string) => {
  const periodKey = `${selectedYear}_${selectedQuarter}`;
  
  const [allData, setAllData] = useState<Record<string, Record<string, FilingStatus>>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  const [dueDates, setDueDates] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DATES);
    return saved ? JSON.parse(saved) : {};
  });

  const toggleStatus = useCallback((clientId: string, type: 'r1' | 'r3b' | 'iff1' | 'iff2') => {
    setAllData(prev => {
      const periodData = { ...(prev[periodKey] || {}) };
      const clientData = { ...(periodData[clientId] || { r1: false, r3b: false, iff1: false, iff2: false }) };
      clientData[type] = !clientData[type];
      periodData[clientId] = clientData;
      const next = { ...prev, [periodKey]: periodData };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [periodKey]);

  const getStatus = useCallback((clientId: string): FilingStatus => {
    return (allData[periodKey] || {})[clientId] || { r1: false, r3b: false, iff1: false, iff2: false };
  }, [allData, periodKey]);

  const updateDueDate = (type: 'r1' | 'r3b', val: string) => {
    const moduleId = type === 'r1' ? 'quarterly_r1' : 'quarterly_r3b';
    const key = `${moduleId}_${selectedYear}_${selectedQuarter}`;
    const next = { ...dueDates, [key]: val };
    setDueDates(next);
    localStorage.setItem(STORAGE_KEY_DATES, JSON.stringify(next));
  };

  const getDueDate = (type: 'r1' | 'r3b') => {
    const moduleId = type === 'r1' ? 'quarterly_r1' : 'quarterly_r3b';
    return dueDates[`${moduleId}_${selectedYear}_${selectedQuarter}`] || '';
  };

  return { getStatus, toggleStatus, updateDueDate, getDueDate };
};
