
import { useState, useCallback, useEffect } from 'react';
import { api } from '../../../services/api';

export interface GSTR4FilingStatus {
  filed: boolean;
  date?: string;
}

export const useGSTR4Logic = (selectedYear: string) => {
  const [filingData, setFilingData] = useState<Record<string, GSTR4FilingStatus>>({});
  const [dueDates, setDueDates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const fetchFilingData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/filings/annual?year=${selectedYear}&type=gstr4`);
      setFilingData(data || {});
      const settings = await api.get('/settings/compliance-dates');
      setDueDates(settings || {});
    } catch (e) {
      console.error("GSTR-4 sync failed", e);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchFilingData();
  }, [fetchFilingData]);

  const toggleStatus = useCallback(async (clientId: string) => {
    const current = filingData[clientId] || { filed: false };
    const nextStatus = { 
      filed: !current.filed,
      date: !current.filed ? new Date().toISOString().split('T')[0] : undefined
    };
    
    setFilingData(prev => ({ ...prev, [clientId]: nextStatus }));
    
    try {
      await api.post('/filings/annual', {
        year: selectedYear,
        type: 'gstr4',
        clientId,
        status: nextStatus
      });
    } catch (e) {
      setFilingData(prev => ({ ...prev, [clientId]: current }));
    }
  }, [selectedYear, filingData]);

  const getStatus = useCallback((clientId: string): GSTR4FilingStatus => {
    return filingData[clientId] || { filed: false };
  }, [filingData]);

  const updateDueDate = async (val: string) => {
    const key = `gstr4_${selectedYear}`;
    try {
      await api.post('/settings/compliance-dates', { key, value: val });
      setDueDates(prev => ({ ...prev, [key]: val }));
    } catch (e) {}
  };

  const getDueDate = () => dueDates[`gstr4_${selectedYear}`] || '';

  return { getStatus, toggleStatus, updateDueDate, getDueDate, loading };
};
