import { useState, useCallback } from 'react';

export interface GSTR9FilingStatus {
  gstr9: boolean;
  gstr9c: boolean;
  gstr9Date?: string;
  gstr9cDate?: string;
}

const STORAGE_KEY_DATA = 'clientify_gstr9_filing_data_v2';
const STORAGE_KEY_WATCHLIST = 'clientify_gstr9_watchlist_v2';
const STORAGE_KEY_CONFIG = 'clientify_gstr9_config_v2';
const STORAGE_KEY_DATES = 'clientify_gstr9_due_dates_v2';

export const useGSTR9Logic = (selectedYear: string) => {
  // Watchlist: Record<FinancialYear, ClientID[]>
  const [watchlist, setWatchlist] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_WATCHLIST);
    return saved ? JSON.parse(saved) : {};
  });

  // Applicability Config: ClientID -> { gstr9cApplicable: boolean }
  const [config, setConfig] = useState<Record<string, { gstr9cApplicable: boolean }>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    return saved ? JSON.parse(saved) : {};
  });

  // Filing Data: Year -> ClientID -> Status
  const [filingData, setFilingData] = useState<Record<string, Record<string, GSTR9FilingStatus>>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DATA);
    return saved ? JSON.parse(saved) : {};
  });

  const [dueDates, setDueDates] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DATES);
    return saved ? JSON.parse(saved) : {};
  });

  const updateFilingData = (newData: Record<string, Record<string, GSTR9FilingStatus>>) => {
    setFilingData(newData);
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(newData));
  };

  const updateConfig = (newConfig: Record<string, { gstr9cApplicable: boolean }>) => {
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(newConfig));
  };

  const toggleStatus = useCallback((clientId: string, type: 'gstr9' | 'gstr9c') => {
    const yearData = { ...(filingData[selectedYear] || {}) };
    const clientData = { ...(yearData[clientId] || { gstr9: false, gstr9c: false }) };
    
    clientData[type] = !clientData[type];
    
    // Auto-set date
    const dateKey = type === 'gstr9' ? 'gstr9Date' : 'gstr9cDate';
    if (clientData[type]) {
      clientData[dateKey] = new Date().toISOString().split('T')[0];
    } else {
      delete clientData[dateKey];
    }
    
    yearData[clientId] = clientData;
    const next = { ...filingData, [selectedYear]: yearData };
    updateFilingData(next);
  }, [filingData, selectedYear]);

  const getStatus = useCallback((clientId: string): GSTR9FilingStatus => {
    return (filingData[selectedYear] || {})[clientId] || { gstr9: false, gstr9c: false };
  }, [filingData, selectedYear]);

  const addToWatchlist = (clientId: string, is9CApplicable: boolean) => {
    setWatchlist(prev => {
      const current = prev[selectedYear] || [];
      if (current.includes(clientId)) return prev;
      const next = { ...prev, [selectedYear]: [...current, clientId] };
      localStorage.setItem(STORAGE_KEY_WATCHLIST, JSON.stringify(next));
      return next;
    });
    updateConfig({ ...config, [clientId]: { gstr9cApplicable: is9CApplicable } });
  };

  const update9CApplicability = (clientId: string, isApplicable: boolean) => {
    updateConfig({ ...config, [clientId]: { gstr9cApplicable: isApplicable } });
  };

  const removeFromWatchlist = (clientId: string) => {
    setWatchlist(prev => {
      const next: Record<string, string[]> = {};
      Object.keys(prev).forEach(year => {
        next[year] = prev[year].filter(id => id !== clientId);
      });
      localStorage.setItem(STORAGE_KEY_WATCHLIST, JSON.stringify(next));
      return next;
    });
  };

  const is9CApplicable = useCallback((clientId: string) => {
    return config[clientId]?.gstr9cApplicable ?? true;
  }, [config]);

  const hasFilingInYear = useCallback((clientId: string, year: string) => {
    const data = filingData[year]?.[clientId];
    return data && (data.gstr9 || data.gstr9c);
  }, [filingData]);

  const updateDueDate = (val: string) => {
    const next = { ...dueDates, [selectedYear]: val };
    setDueDates(next);
    localStorage.setItem(STORAGE_KEY_DATES, JSON.stringify(next));
  };

  const getDueDate = () => dueDates[selectedYear] || '';

  return { 
    getStatus, 
    toggleStatus, 
    watchlist, 
    addToWatchlist, 
    update9CApplicability,
    removeFromWatchlist,
    hasFilingInYear,
    is9CApplicable,
    updateDueDate,
    getDueDate,
    filingData 
  };
};