import { useState, useCallback } from 'react';

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
  const [watchlist, setWatchlist] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_WATCHLIST);
    return saved ? JSON.parse(saved) : {};
  });

  const [allData, setAllData] = useState<Record<string, Record<string, AuditFinancialStatus>>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DATA);
    return saved ? JSON.parse(saved) : {};
  });

  const [dueDates, setDueDates] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DATES);
    return saved ? JSON.parse(saved) : {};
  });

  const yearWatchlist = watchlist[selectedYear] || [];

  const addToWatchlist = useCallback((clientId: string) => {
    setWatchlist(prev => {
      const current = prev[selectedYear] || [];
      if (current.includes(clientId)) return prev;
      const next = { ...prev, [selectedYear]: [...current, clientId] };
      localStorage.setItem(STORAGE_KEY_WATCHLIST, JSON.stringify(next));
      return next;
    });
  }, [selectedYear]);

  /**
   * REVISED: When removing, we remove from ALL years to avoid ambiguity 
   * since adding to one year propagates to future years.
   */
  const removeFromWatchlist = useCallback((clientId: string) => {
    setWatchlist(prev => {
      const next: Record<string, string[]> = {};
      Object.keys(prev).forEach(year => {
        next[year] = prev[year].filter(id => id !== clientId);
      });
      localStorage.setItem(STORAGE_KEY_WATCHLIST, JSON.stringify(next));
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
      localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(next));
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
      localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(next));
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
      localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(next));
      return next;
    });
  }, [selectedYear]);

  const getStatus = useCallback((clientId: string): AuditFinancialStatus => {
    return (allData[selectedYear] || {})[clientId] || { bsStatus: 'Pending', auditFiled: false };
  }, [allData, selectedYear]);

  const updateDueDate = (val: string) => {
    const next = { ...dueDates, [selectedYear]: val };
    setDueDates(next);
    localStorage.setItem(STORAGE_KEY_DATES, JSON.stringify(next));
  };

  const getDueDate = () => dueDates[selectedYear] || '';

  return { getStatus, toggleAuditStatus, setBSStatus, updateCaName, updateDueDate, getDueDate, watchlist, yearWatchlist, addToWatchlist, removeFromWatchlist };
};