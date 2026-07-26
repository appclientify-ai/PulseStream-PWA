import { useState, useCallback, useEffect } from 'react';
import { api } from '../../../../services/api';
import { socketService } from '../../../../services/socket.ts';

export interface FilingStatus {
  remark?: string;
  cmp08: boolean;
}

const STORAGE_KEY = 'clientify_composition_filing_v3';
const STORAGE_KEY_DATES = 'clientify_composition_due_dates_v1';

export const useCompositionFilingLogic = (
  selectedYear: string, 
  selectedQuarter: string,
  initialData?: Record<string, Record<string, FilingStatus>>,
  initialDates?: Record<string, string>
) => {
  const periodKey = `${selectedYear}_${selectedQuarter}`;
  
  const [allData, setAllData] = useState<Record<string, Record<string, FilingStatus>>>(initialData || {});
  const [dueDates, setDueDates] = useState<Record<string, string>>(initialDates || {});
  const [isDataLoaded, setIsDataLoaded] = useState(!!initialData);

  useEffect(() => {
    if (initialData) setAllData(initialData);
    if (initialDates) setDueDates(initialDates);
    if (initialData || initialDates) setIsDataLoaded(true);
  }, [initialData, initialDates]);

  useEffect(() => {
    if (initialData) return;
    const load = async () => {
      try {
        const [data, dates] = await Promise.all([
          api.getAppData(STORAGE_KEY),
          api.getAppData(STORAGE_KEY_DATES)
        ]);
        if (data) setAllData(data);
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
  }, [initialData]);

  const toggleStatus = useCallback((clientId: string) => {
    // Calculate new value outside of state setter to prevent multi-triggering in React StrictMode
    const periodData = allData[periodKey] || {};
    const clientData = periodData[clientId] || { cmp08: false };
    const newVal = !clientData.cmp08;

    // Optimistically update local state
    setAllData(prev => {
      const pData = { ...(prev[periodKey] || {}) };
      const cData = { ...(pData[clientId] || { cmp08: false }) };
      cData.cmp08 = newVal;
      pData[clientId] = cData;
      return { ...prev, [periodKey]: pData };
    });

    // Make API request without duplicate socket emit
    api.patchAppData(STORAGE_KEY, { [`data.${periodKey}.${clientId}.cmp08`]: newVal })
      .catch(err => {
        console.error('Failed to save composition data', err);
        // Rollback on error
        setAllData(prev => {
          const pData = { ...(prev[periodKey] || {}) };
          const cData = { ...(pData[clientId] || { cmp08: false }) };
          cData.cmp08 = !newVal;
          pData[clientId] = cData;
          return { ...prev, [periodKey]: pData };
        });
      });
  }, [periodKey, allData]);

  const getStatus = useCallback((clientId: string): FilingStatus => {
    return (allData[periodKey] || {})[clientId] || { cmp08: false };
  }, [allData, periodKey]);

  const updateRemark = useCallback((clientId: string, val: string) => {
    setAllData(prev => {
      const pData = { ...(prev[periodKey] || {}) };
      const cData = { ...(pData[clientId] || { cmp08: false }), remark: val };
      pData[clientId] = cData;
      return { ...prev, [periodKey]: pData };
    });

    api.patchAppData(STORAGE_KEY, { [`data.${periodKey}.${clientId}.remark`]: val })
      .catch(err => console.error('Failed to save composition remark', err));
  }, [periodKey]);

  const updateDueDate = (val: string) => {
    const next = { ...dueDates, [periodKey]: val };
    setDueDates(next);
    api.patchAppData(STORAGE_KEY_DATES, { [`data.${periodKey}`]: val })
      .catch(err => console.error('Failed to save composition due dates', err));
  };

  const getDueDate = () => dueDates[periodKey] || '';

  return { getStatus, toggleStatus, updateRemark, updateDueDate, getDueDate, isDataLoaded };
};