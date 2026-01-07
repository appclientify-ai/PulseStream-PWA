
import { useState, useCallback, useEffect } from 'react';
import { api } from '../../../../services/api';

export interface FilingStatus {
  r1: boolean;
  r3b: boolean;
}

export const useQuarterlyFilingLogic = (selectedYear: string, selectedQuarter: string) => {
  const [periodData, setPeriodData] = useState<Record<string, FilingStatus>>({});
  const [dueDates, setDueDates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const fetchFilingData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/filings/quarterly?year=${selectedYear}&period=${selectedQuarter}`);
      setPeriodData(data || {});
      const settings = await api.get('/settings/compliance-dates');
      setDueDates(settings || {});
    } catch (e) {
      console.error("Quarterly sync failed", e);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedQuarter]);

  useEffect(() => {
    fetchFilingData();
  }, [fetchFilingData]);

  const toggleStatus = useCallback(async (clientId: string, type: 'r1' | 'r3b') => {
    const current = periodData[clientId] || { r1: false, r3b: false };
    const nextStatus = { ...current, [type]: !current[type] };
    
    setPeriodData(prev => ({ ...prev, [clientId]: nextStatus }));
    
    try {
      await api.post('/filings/quarterly', {
        year: selectedYear,
        period: selectedQuarter,
        clientId,
        status: nextStatus
      });
    } catch (e) {
      setPeriodData(prev => ({ ...prev, [clientId]: current }));
    }
  }, [selectedYear, selectedQuarter, periodData]);

  const getStatus = useCallback((clientId: string): FilingStatus => {
    return periodData[clientId] || { r1: false, r3b: false };
  }, [periodData]);

  const updateDueDate = async (val: string) => {
    const key = `quarterly_${selectedYear}_${selectedQuarter}`;
    try {
      await api.post('/settings/compliance-dates', { key, value: val });
      setDueDates(prev => ({ ...prev, [key]: val }));
    } catch (e) {}
  };

  const getDueDate = () => dueDates[`quarterly_${selectedYear}_${selectedQuarter}`] || '';

  return { getStatus, toggleStatus, updateDueDate, getDueDate, loading };
};
