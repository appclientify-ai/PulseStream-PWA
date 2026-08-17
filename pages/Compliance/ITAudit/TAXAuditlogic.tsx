import { socketService } from '../../../services/socket.ts';
import { useState, useCallback, useEffect } from 'react';
import { api } from '../../../services/api';

export type BSStatus = 'Document Required' | 'In progress' | 'Ready' | 'Pending';

export interface AuditFinancialStatus {
  remark?: string;
  bsStatus: BSStatus;
  auditFiled: boolean;
  caName?: string;
  bsDate?: string;
  auditDate?: string;
}

const STORAGE_KEY_DATA = 'clientify_audit_fin_data_v3';
const STORAGE_KEY_WATCHLIST = 'clientify_audit_watchlist_v3';
const STORAGE_KEY_DATES = 'clientify_audit_due_dates_v1';

export const useTaxAuditLogic = (
  selectedYear: string,
  initialWatchlist?: Record<string, string[]>,
  initialData?: Record<string, Record<string, AuditFinancialStatus>>,
  initialDates?: Record<string, string>
) => {
  const [watchlist, setWatchlist] = useState<Record<string, string[]>>(initialWatchlist || {});
  const [allData, setAllData] = useState<Record<string, Record<string, AuditFinancialStatus>>>(initialData || {});
  const [dueDates, setDueDates] = useState<Record<string, string>>(initialDates || {});
  const [isDataLoaded, setIsDataLoaded] = useState(!!initialWatchlist || !!initialData);

  useEffect(() => {
    if (initialWatchlist) setWatchlist(initialWatchlist);
    if (initialData) setAllData(initialData);
    if (initialDates) setDueDates(initialDates);
    if (initialWatchlist || initialData) setIsDataLoaded(true);
  }, [initialWatchlist, initialData, initialDates]);

  useEffect(() => {
    if (initialWatchlist || initialData) return;
    const load = async () => {
      try {
        const [w, d, dates] = await Promise.all([
          api.getAppData(STORAGE_KEY_WATCHLIST),
          api.getAppData(STORAGE_KEY_DATA),
          api.getAppData(STORAGE_KEY_DATES)
        ]);
        if (w) setWatchlist(w);
        if (d) setAllData(d);
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
      if (detail && detail.storageKey === STORAGE_KEY_DATA && detail.clientId && detail.periodKey) {
        setAllData(prev => {
          const yData = { ...(prev[detail.periodKey] || {}) };
          const cData = { ...(yData[detail.clientId] || { bsStatus: 'Pending', auditFiled: false }) };
          if (detail.field) {
            (cData as any)[detail.field] = detail.value;
          } else if (typeof detail.value === 'object') {
            Object.assign(cData, detail.value);
          }
          yData[detail.clientId] = cData;
          return { ...prev, [detail.periodKey]: yData };
        });
        return;
      }
      if (detail?.type === 'connect') {
        load();
      }
    };
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, [initialWatchlist, initialData]);

  const yearWatchlist = watchlist[selectedYear] || [];

  const addToWatchlist = useCallback((clientId: string) => {
    setWatchlist(prev => {
      const current = prev[selectedYear] || [];
      if (current.includes(clientId)) return prev;
      const next = { ...prev, [selectedYear]: [...current, clientId] };
      api.patchAppData(STORAGE_KEY_WATCHLIST, { [`data.${selectedYear}`]: next[selectedYear] })
        .catch(console.error);
      return next;
    });
  }, [selectedYear]);

  const removeFromWatchlist = useCallback((clientId: string) => {
    setWatchlist(prev => {
      const next: Record<string, string[]> = {};
      Object.keys(prev).forEach(year => {
        next[year] = prev[year].filter(id => id !== clientId);
      });
      api.patchAppData(STORAGE_KEY_WATCHLIST, { "data": next })
        .catch(console.error);
      return next;
    });
  }, []);

  const toggleAuditStatus = useCallback((clientId: string) => {
    // Calculate values outside of state setter
    const yearData = allData[selectedYear] || {};
    const clientData = { ...(yearData[clientId] || { bsStatus: 'Pending', auditFiled: false }) };
    
    clientData.auditFiled = !clientData.auditFiled;
    if (clientData.auditFiled) {
      clientData.auditDate = new Date().toISOString().split('T')[0];
    } else {
      delete clientData.auditDate;
    }

    setAllData(prev => {
      const yData = { ...(prev[selectedYear] || {}) };
      yData[clientId] = clientData;
      return { ...prev, [selectedYear]: yData };
    });

    api.updateSingleFilingStatus({
      storageKey: STORAGE_KEY_DATA,
      clientId,
      periodKey: selectedYear,
      field: 'auditFiled',
      value: clientData.auditFiled
    }).catch(() => {
      api.patchAppData(STORAGE_KEY_DATA, { [`data.${selectedYear}.${clientId}`]: clientData }).catch(console.error);
    });
  }, [selectedYear, allData]);

  const setBSStatus = useCallback((clientId: string, status: BSStatus) => {
    const yearData = allData[selectedYear] || {};
    const clientData = { ...(yearData[clientId] || { bsStatus: 'Pending', auditFiled: false }) };
    
    clientData.bsStatus = status;
    if (status === 'Ready') {
      clientData.bsDate = new Date().toISOString().split('T')[0];
    }

    setAllData(prev => {
      const yData = { ...(prev[selectedYear] || {}) };
      yData[clientId] = clientData;
      return { ...prev, [selectedYear]: yData };
    });

    api.patchAppData(STORAGE_KEY_DATA, { [`data.${selectedYear}.${clientId}`]: clientData })
      .catch(console.error);
  }, [selectedYear, allData]);

  const updateCaName = useCallback((clientId: string, name: string) => {
    const yearData = allData[selectedYear] || {};
    const clientData = { ...(yearData[clientId] || { bsStatus: 'Pending', auditFiled: false }) };
    clientData.caName = name;

    setAllData(prev => {
      const yData = { ...(prev[selectedYear] || {}) };
      yData[clientId] = clientData;
      return { ...prev, [selectedYear]: yData };
    });

    api.patchAppData(STORAGE_KEY_DATA, { [`data.${selectedYear}.${clientId}`]: clientData })
      .catch(console.error);
  }, [selectedYear, allData]);

  const getStatus = useCallback((clientId: string): AuditFinancialStatus => {
    return (allData[selectedYear] || {})[clientId] || { bsStatus: 'Pending', auditFiled: false };
  }, [allData, selectedYear]);

  const updateRemark = useCallback((clientId: string, val: string) => {
    setAllData(prev => {
      const yData = { ...(prev[selectedYear] || {}) };
      const cData = { ...(yData[clientId] || { bsStatus: 'Pending', auditFiled: false }), remark: val };
      yData[clientId] = cData;
      return { ...prev, [selectedYear]: yData };
    });

    api.patchAppData(STORAGE_KEY_DATA, { [`data.${selectedYear}.${clientId}.remark`]: val })
      .catch(console.error);
  }, [selectedYear]);

  const updateDueDate = (val: string) => {
    const next = { ...dueDates, [selectedYear]: val };
    setDueDates(next);
    api.patchAppData(STORAGE_KEY_DATES, { [`data.${selectedYear}`]: val })
      .catch(console.error);
  };

  const getDueDate = () => dueDates[selectedYear] || '';

  return { getStatus, toggleAuditStatus, setBSStatus, updateCaName, updateRemark, updateDueDate, getDueDate, watchlist, yearWatchlist, addToWatchlist, removeFromWatchlist, isDataLoaded };
};