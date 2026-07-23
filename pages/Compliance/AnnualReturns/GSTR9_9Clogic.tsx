import { socketService } from '../../../services/socket.ts';
import { useState, useCallback, useEffect } from 'react';
import { api } from '../../../services/api';

export interface GSTR9FilingStatus {
  remark?: string;
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
  const [watchlist, setWatchlist] = useState<Record<string, string[]>>({});
  const [config, setConfig] = useState<Record<string, { gstr9cApplicable: boolean }>>({});
  const [filingData, setFilingData] = useState<Record<string, Record<string, GSTR9FilingStatus>>>({});
  const [dueDates, setDueDates] = useState<Record<string, string>>({});
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [w, c, f, d] = await Promise.all([
          api.getAppData(STORAGE_KEY_WATCHLIST),
          api.getAppData(STORAGE_KEY_CONFIG),
          api.getAppData(STORAGE_KEY_DATA),
          api.getAppData(STORAGE_KEY_DATES)
        ]);
        if (w) setWatchlist(w);
        if (c) setConfig(c);
        if (f) setFilingData(f);
        if (d) setDueDates(d);
      } catch (err) {
        console.error(err);
      } finally {
        setIsDataLoaded(true);
      }
    };
    load();
    const syncHandler = () => load();
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, []);

  const updateFilingData = (newData: Record<string, Record<string, GSTR9FilingStatus>>) => {
    setFilingData(newData);
  };

  const updateConfig = (newConfig: Record<string, { gstr9cApplicable: boolean }>) => {
    setConfig(newConfig);
  };

  const toggleStatus = useCallback((clientId: string, type: 'gstr9' | 'gstr9c') => {
    const yearData = { ...(filingData[selectedYear] || {}) };
    const clientData = { ...(yearData[clientId] || { gstr9: false, gstr9c: false }) };
    
    clientData[type] = !clientData[type];
    
    const dateKey = type === 'gstr9' ? 'gstr9Date' : 'gstr9cDate';
    if (clientData[type]) {
      clientData[dateKey] = new Date().toISOString().split('T')[0];
    } else {
      delete clientData[dateKey];
    }
    
    yearData[clientId] = clientData;
    const next = { ...filingData, [selectedYear]: yearData };
    setFilingData(next);
    api.patchAppData(STORAGE_KEY_DATA, { [`data.${selectedYear}.${clientId}`]: clientData }).then(() => socketService.emit('data_updated')).catch(console.error);
  }, [filingData, selectedYear]);

  const getStatus = useCallback((clientId: string): GSTR9FilingStatus => {
    return (filingData[selectedYear] || {})[clientId] || { gstr9: false, gstr9c: false };
  }, [filingData, selectedYear]);

  const addToWatchlist = (clientId: string, is9CApplicable: boolean) => {
    setWatchlist(prev => {
      const current = prev[selectedYear] || [];
      if (current.includes(clientId)) return prev;
      const next = { ...prev, [selectedYear]: [...current, clientId] };
      api.patchAppData(STORAGE_KEY_WATCHLIST, { [`data.${selectedYear}`]: next[selectedYear] }).then(() => socketService.emit('data_updated')).catch(console.error);
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
      api.patchAppData(STORAGE_KEY_WATCHLIST, { "data": next }).then(() => socketService.emit('data_updated')).catch(console.error);
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

  const updateRemark = useCallback((clientId: string, val: string) => {
    const yearData = { ...(filingData[selectedYear] || {}) };
    const clientData = { ...(yearData[clientId] || { gstr9: false, gstr9c: false }), remark: val };
    yearData[clientId] = clientData;
    const next = { ...filingData, [selectedYear]: yearData };
    setFilingData(next);
    api.patchAppData(STORAGE_KEY_DATA, { [`data.${selectedYear}.${clientId}.remark`]: val }).then(() => socketService.emit('data_updated')).catch(console.error);
  }, [filingData, selectedYear]);

  const updateDueDate = (val: string) => {
    const next = { ...dueDates, [selectedYear]: val };
    setDueDates(next);
    api.patchAppData(STORAGE_KEY_DATES, { [`data.${selectedYear}`]: val }).then(() => socketService.emit('data_updated')).catch(console.error);
  };

  const getDueDate = () => dueDates[selectedYear] || '';

  return { 
    getStatus, toggleStatus, updateRemark, watchlist, addToWatchlist, 
    update9CApplicability, removeFromWatchlist, hasFilingInYear, 
    is9CApplicable, updateDueDate, getDueDate, filingData, isDataLoaded 
  };
};