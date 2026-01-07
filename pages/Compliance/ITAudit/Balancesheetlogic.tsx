import { useState, useCallback } from 'react';

export interface BalStatus {
  ready: boolean;
  date?: string;
}

const STORAGE_KEY = 'clientify_balancesheet_data_v1';
const STORAGE_KEY_DATES = 'clientify_balancesheet_due_dates_v1';

export const useBalancesheetLogic = (selectedYear: string) => {
  const [allData, setAllData] = useState<Record<string, Record<string, BalStatus>>>(() => {
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
      const clientData = { ...(yearData[clientId] || { ready: false }) };
      
      clientData.ready = !clientData.ready;
      if (clientData.ready) {
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

  const getStatus = useCallback((clientId: string): BalStatus => {
    return (allData[selectedYear] || {})[clientId] || { ready: false };
  }, [allData, selectedYear]);

  const updateDueDate = (val: string) => {
    const next = { ...dueDates, [selectedYear]: val };
    setDueDates(next);
    localStorage.setItem(STORAGE_KEY_DATES, JSON.stringify(next));
  };

  const getDueDate = () => dueDates[selectedYear] || '';

  return { getStatus, toggleStatus, updateDueDate, getDueDate };
};