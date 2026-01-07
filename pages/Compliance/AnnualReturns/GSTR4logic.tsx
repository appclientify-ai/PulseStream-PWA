import { useState, useCallback } from 'react';

export interface GSTR4FilingStatus {
  filed: boolean;
  date?: string;
}

const STORAGE_KEY = 'clientify_gstr4_filing_v1';
const STORAGE_KEY_DATES = 'clientify_gstr4_due_dates_v1';

export const useGSTR4Logic = (selectedYear: string) => {
  const [allData, setAllData] = useState<Record<string, Record<string, GSTR4FilingStatus>>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  const [dueDates, setDueDates] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DATES);
    return saved ? JSON.parse(saved) : {};
  });

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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [selectedYear]);

  const getStatus = useCallback((clientId: string): GSTR4FilingStatus => {
    return (allData[selectedYear] || {})[clientId] || { filed: false };
  }, [allData, selectedYear]);

  const updateDueDate = (val: string) => {
    const next = { ...dueDates, [selectedYear]: val };
    setDueDates(next);
    localStorage.setItem(STORAGE_KEY_DATES, JSON.stringify(next));
  };

  const getDueDate = () => dueDates[selectedYear] || '';

  return { getStatus, toggleStatus, updateDueDate, getDueDate };
};