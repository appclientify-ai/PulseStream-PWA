
import { useState, useCallback, useEffect } from 'react';
import { api } from '../../../../services/api';

export interface FilingStatus {
  cmp08: boolean;
}

export const useCompositionFilingLogic = (selectedYear: string, selectedQuarter: string) => {
  const [periodData, setPeriodData] = useState<Record<string, FilingStatus>>({});
  const [dueDates, setDueDates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const fetchFilingData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/filings/composition?year=${selectedYear}&period=${selectedQuarter}`);
      setPeriodData(data || {});
      const settings = await api.get('/settings/compliance-dates');
      setDueDates(settings || {});
    } catch (e) {
      console.error("Composition sync failed", e);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedQuarter]);

  useEffect(() => {
    fetchFilingData();
  }, [fetchFilingData]);

  const toggleStatus = useCallback(async (clientId: string) => {
    const current = periodData[clientId] || { cmp08: false };
    const nextStatus = { cmp08: !current.cmp08 };
    
    setPeriodData(prev => ({ ...prev, [clientId]: nextStatus }));
    
    try {
      await api.post('/filings/composition', {
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
    return periodData[clientId] || { cmp08: false };
  }, [periodData]);

  const updateDueDate = async (val: string) => {
    const key = `composition_${selectedYear}_${selectedQuarter}`;
    try {
      await api.post('/settings/compliance-dates', { key, value: val });
      setDueDates(prev => ({ ...prev, [key]: val }));
    } catch (e) {}
  };

  const getDueDate = () => dueDates[`composition_${selectedYear}_${selectedQuarter}`] || '';

  return { getStatus, toggleStatus, updateDueDate, getDueDate, loading };
};
