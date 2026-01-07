
import { useState, useCallback, useEffect } from 'react';
import { api } from '../../../services/api';

export interface GSTR9FilingStatus {
  gstr9: boolean;
  gstr9c: boolean;
  gstr9Date?: string;
  gstr9cDate?: string;
}

export const useGSTR9Logic = (selectedYear: string) => {
  const [filingData, setFilingData] = useState<Record<string, GSTR9FilingStatus>>({});
  const [watchlist, setWatchlist] = useState<Record<string, string[]>>({});
  const [config, setConfig] = useState<Record<string, { gstr9cApplicable: boolean }>>({});
  const [dueDates, setDueDates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/filings/annual?year=${selectedYear}&type=gstr9`);
      setFilingData(data || {});
      const watch = await api.get('/settings/gstr9-watchlist');
      setWatchlist(watch || {});
      const cfg = await api.get('/settings/gstr9-config');
      setConfig(cfg || {});
      const dates = await api.get('/settings/compliance-dates');
      setDueDates(dates || {});
    } catch (e) {
      console.error("Annual vault sync failed", e);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // added update9CApplicability to handle updates from the UI
  const update9CApplicability = async (clientId: string, isApplicable: boolean) => {
    try {
      await api.post('/settings/gstr9-config', { clientId, gstr9cApplicable: isApplicable });
      fetchData();
    } catch (e) {
      console.error("Failed to update 9C applicability", e);
    }
  };

  const toggleStatus = useCallback(async (clientId: string, type: 'gstr9' | 'gstr9c') => {
    const current = filingData[clientId] || { gstr9: false, gstr9c: false };
    const next = { ...current, [type]: !current[type] };
    const dateKey = type === 'gstr9' ? 'gstr9Date' : 'gstr9cDate';
    if (next[type]) next[dateKey] = new Date().toISOString().split('T')[0];
    else delete next[dateKey];

    setFilingData(prev => ({ ...prev, [clientId]: next }));
    try {
      await api.post('/filings/annual', { year: selectedYear, type: 'gstr9', clientId, status: next });
    } catch (e) {
      setFilingData(prev => ({ ...prev, [clientId]: current }));
    }
  }, [selectedYear, filingData]);

  const addToWatchlist = async (clientId: string, is9CApplicable: boolean) => {
    try {
      await api.post('/settings/gstr9-watchlist', { year: selectedYear, clientId });
      await api.post('/settings/gstr9-config', { clientId, gstr9cApplicable: is9CApplicable });
      fetchData();
    } catch (e) {}
  };

  const removeFromWatchlist = async (clientId: string) => {
    try {
      await api.delete(`/settings/gstr9-watchlist/${clientId}`);
      fetchData();
    } catch (e) {}
  };

  const getStatus = useCallback((clientId: string) => filingData[clientId] || { gstr9: false, gstr9c: false }, [filingData]);
  const is9CApplicable = useCallback((clientId: string) => config[clientId]?.gstr9cApplicable ?? true, [config]);
  const hasFilingInYear = useCallback((clientId: string, year: string) => !!filingData[clientId], [filingData]);
  const updateDueDate = (val: string) => api.post('/settings/compliance-dates', { key: `gstr9_${selectedYear}`, value: val });
  const getDueDate = () => dueDates[`gstr9_${selectedYear}`] || '';

  return { getStatus, toggleStatus, watchlist, addToWatchlist, update9CApplicability, removeFromWatchlist, hasFilingInYear, is9CApplicable, updateDueDate, getDueDate, loading };
};
