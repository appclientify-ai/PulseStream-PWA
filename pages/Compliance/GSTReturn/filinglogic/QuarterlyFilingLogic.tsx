import { socketService } from '../../../../services/socket.ts';
import { useState, useCallback, useEffect } from 'react';
import { api } from '../../../../services/api';
import { getStatusLabel } from './MonthlyFilingLogic';

export interface FilingStatus {
  remark?: string;
  r1: boolean;
  r3b: boolean | 'Pending' | 'Challan' | 'Filed';
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
    const syncHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.storageKey === STORAGE_KEY && detail.clientId && detail.periodKey && detail.field) {
        setAllData(prev => {
          const pData = { ...(prev[detail.periodKey] || {}) };
          const cData = { ...(pData[detail.clientId] || { r1: false, r3b: 'Pending' }) };
          (cData as any)[detail.field] = detail.value;
          pData[detail.clientId] = cData;
          return { ...prev, [detail.periodKey]: pData };
        });
        return;
      }
      if (detail?.type === 'connect') {
        load();
      }
    };
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, []);

  const toggleStatus = useCallback((clientId: string, type: 'r1' | 'r3b') => {
    // Calculate new value outside of state setter to prevent multi-triggering in React StrictMode
    const periodData = allData[periodKey] || {};
    const clientData = periodData[clientId] || { r1: false, r3b: 'Pending' };
    
    let newVal: boolean | string;
    if (type === 'r3b') {
      const currentLabel = getStatusLabel(clientData.r3b);
      if (currentLabel === 'Pending') newVal = 'Challan';
      else if (currentLabel === 'Challan') newVal = 'Filed';
      else newVal = 'Pending';
    } else {
      newVal = !clientData.r1;
    }

    // Optimistically update local state
    setAllData(prev => {
      const pData = { ...(prev[periodKey] || {}) };
      const cData = { ...(pData[clientId] || { r1: false, r3b: 'Pending' }) };
      (cData as any)[type] = newVal;
      pData[clientId] = cData;
      return { ...prev, [periodKey]: pData };
    });

    api.updateSingleFilingStatus({
      storageKey: STORAGE_KEY,
      clientId,
      periodKey,
      field: type,
      value: newVal
    }).catch(err => {
      console.error('Failed to save quarterly filing data', err);
    });
  }, [periodKey, allData]);

  const getStatus = useCallback((clientId: string): FilingStatus => {
    return (allData[periodKey] || {})[clientId] || { r1: false, r3b: false };
  }, [allData, periodKey]);

  const updateRemark = useCallback((clientId: string, val: string) => {
    setAllData(prev => {
      const pData = { ...(prev[periodKey] || {}) };
      const cData = { ...(pData[clientId] || { r1: false, r3b: false }), remark: val };
      pData[clientId] = cData;
      return { ...prev, [periodKey]: pData };
    });

    api.patchAppData(STORAGE_KEY, { [`data.${periodKey}.${clientId}.remark`]: val })
      .catch(console.error);
  }, [periodKey]);

  const updateDueDate = (val: string) => {
    const next = { ...dueDates, [periodKey]: val };
    setDueDates(next);
    api.patchAppData(STORAGE_KEY_DATES, { [`data.${periodKey}`]: val })
      .catch(console.error);
  };

  const getDueDate = () => dueDates[periodKey] || '';

  return { getStatus, toggleStatus, updateRemark, updateDueDate, getDueDate, isDataLoaded };
};