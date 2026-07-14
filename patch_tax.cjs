const fs = require('fs');

const newHook = `
import { useState, useCallback, useEffect } from 'react';
import { api } from '../../../services/api';

export type BSStatus = 'Document Required' | 'In progress' | 'Ready' | 'Pending';

export interface AuditFinancialStatus {
  bsStatus: BSStatus;
  auditFiled: boolean;
  caName?: string;
  bsDate?: string;
  auditDate?: string;
}

const STORAGE_KEY_DATA = 'clientify_audit_fin_data_v3';
const STORAGE_KEY_WATCHLIST = 'clientify_audit_watchlist_v3';
const STORAGE_KEY_DATES = 'clientify_audit_due_dates_v1';

export const useTaxAuditLogic = (selectedYear: string) => {
  const [watchlist, setWatchlist] = useState<Record<string, string[]>>({});
  const [allData, setAllData] = useState<Record<string, Record<string, AuditFinancialStatus>>>({});
  const [dueDates, setDueDates] = useState<Record<string, string>>({});
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
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
  }, []);

  const yearWatchlist = watchlist[selectedYear] || [];

  const addToWatchlist = useCallback((clientId: string) => {
    setWatchlist(prev => {
      const current = prev[selectedYear] || [];
      if (current.includes(clientId)) return prev;
      const next = { ...prev, [selectedYear]: [...current, clientId] };
      api.saveAppData(STORAGE_KEY_WATCHLIST, next).catch(console.error);
      return next;
    });
  }, [selectedYear]);

  const removeFromWatchlist = useCallback((clientId: string) => {
    setWatchlist(prev => {
      const next: Record<string, string[]> = {};
      Object.keys(prev).forEach(year => {
        next[year] = prev[year].filter(id => id !== clientId);
      });
      api.saveAppData(STORAGE_KEY_WATCHLIST, next).catch(console.error);
      return next;
    });
  }, []);

  const toggleAuditStatus = useCallback((clientId: string) => {
    setAllData(prev => {
      const yearData = { ...(prev[selectedYear] || {}) };
      const clientData = { ...(yearData[clientId] || { bsStatus: 'Pending', auditFiled: false }) };
      
      clientData.auditFiled = !clientData.auditFiled;
      if (clientData.auditFiled) {
        clientData.auditDate = new Date().toISOString().split('T')[0];
      } else {
        delete clientData.auditDate;
      }
      
      yearData[clientId] = clientData;
      const next = { ...prev, [selectedYear]: yearData };
      api.saveAppData(STORAGE_KEY_DATA, next).catch(console.error);
      return next;
    });
  }, [selectedYear]);

  const setBSStatus = useCallback((clientId: string, status: BSStatus) => {
    setAllData(prev => {
      const yearData = { ...(prev[selectedYear] || {}) };
      const clientData = { ...(yearData[clientId] || { bsStatus: 'Pending', auditFiled: false }) };
      
      clientData.bsStatus = status;
      if (status === 'Ready') {
        clientData.bsDate = new Date().toISOString().split('T')[0];
      }
      
      yearData[clientId] = clientData;
      const next = { ...prev, [selectedYear]: yearData };
      api.saveAppData(STORAGE_KEY_DATA, next).catch(console.error);
      return next;
    });
  }, [selectedYear]);

  const updateCaName = useCallback((clientId: string, name: string) => {
    setAllData(prev => {
      const yearData = { ...(prev[selectedYear] || {}) };
      const clientData = { ...(yearData[clientId] || { bsStatus: 'Pending', auditFiled: false }) };
      clientData.caName = name;
      yearData[clientId] = clientData;
      const next = { ...prev, [selectedYear]: yearData };
      api.saveAppData(STORAGE_KEY_DATA, next).catch(console.error);
      return next;
    });
  }, [selectedYear]);

  const getStatus = useCallback((clientId: string): AuditFinancialStatus => {
    return (allData[selectedYear] || {})[clientId] || { bsStatus: 'Pending', auditFiled: false };
  }, [allData, selectedYear]);

  const updateDueDate = (val: string) => {
    const next = { ...dueDates, [selectedYear]: val };
    setDueDates(next);
    api.saveAppData(STORAGE_KEY_DATES, next).catch(console.error);
  };

  const getDueDate = () => dueDates[selectedYear] || '';

  return { getStatus, toggleAuditStatus, setBSStatus, updateCaName, updateDueDate, getDueDate, watchlist, yearWatchlist, addToWatchlist, removeFromWatchlist, isDataLoaded };
};
`;

fs.writeFileSync('pages/Compliance/ITAudit/TAXAuditlogic.tsx', newHook.trim());
