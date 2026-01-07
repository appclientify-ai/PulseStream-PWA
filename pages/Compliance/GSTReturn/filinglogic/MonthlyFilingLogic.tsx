
import { useState, useCallback, useEffect } from 'react';
import { api } from '../../../../services/api';

export interface FilingStatus {
  r1: boolean;
  r3b: boolean;
}

export const FY_MONTHS = [
  'April', 'May', 'June', 'July', 'August', 'September', 
  'October', 'November', 'December', 'January', 'February', 'March'
];

export const FY_QUARTERS = [
  'April-June (Q1)', 'July-September (Q2)', 'October-December (Q3)', 'January-March (Q4)'
];

const getDynamicYears = () => {
  const startYear = 2023;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const latestStartYear = currentMonth >= 3 ? currentYear : currentYear - 1;
  const list = [];
  for (let y = startYear; y <= latestStartYear; y++) {
    list.push(`${y}-${(y + 1).toString().slice(-2)}`);
  }
  return list.reverse();
};

export const YEARS = getDynamicYears();
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const QUARTERS = [...FY_QUARTERS];

export const getDefaultPeriod = () => {
  const now = new Date();
  const m = now.getMonth();
  const calYear = now.getFullYear();
  const getFY = (month: number, year: number) => {
    if (month >= 3) return `${year}-${(year + 1).toString().slice(-2)}`;
    return `${year - 1}-${year.toString().slice(-2)}`;
  };
  let prevMonthIdx = m - 1;
  let mYear = calYear;
  if (prevMonthIdx < 0) { prevMonthIdx = 11; mYear = calYear - 1; }
  const monthFY = getFY(prevMonthIdx, mYear);
  let qIdx = (m >= 0 && m <= 2) ? 2 : (m >= 3 && m <= 5) ? 3 : (m >= 6 && m <= 8) ? 0 : 1;
  let qYear = (m >= 3 && m <= 5) ? calYear - 1 : calYear;
  const qStartMonths = [3, 6, 9, 0];
  const quarterFY = getFY(qStartMonths[qIdx], qYear);
  return { month: MONTHS[prevMonthIdx], quarter: QUARTERS[qIdx], year: monthFY, quarterYear: quarterFY };
};

export const useMonthlyFilingLogic = (selectedYear: string, selectedMonth: string) => {
  const [periodData, setPeriodData] = useState<Record<string, FilingStatus>>({});
  const [dueDates, setDueDates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const fetchFilingData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/filings/monthly?year=${selectedYear}&period=${selectedMonth}`);
      setPeriodData(data || {});
      const settings = await api.get('/settings/compliance-dates');
      setDueDates(settings || {});
    } catch (e) {
      console.error("Cloud sync failed", e);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    fetchFilingData();
  }, [fetchFilingData]);

  const toggleStatus = useCallback(async (clientId: string, type: 'r1' | 'r3b') => {
    const current = periodData[clientId] || { r1: false, r3b: false };
    const nextStatus = { ...current, [type]: !current[type] };
    
    // Optimistic Update
    setPeriodData(prev => ({ ...prev, [clientId]: nextStatus }));
    
    try {
      await api.post('/filings/monthly', {
        year: selectedYear,
        period: selectedMonth,
        clientId,
        status: nextStatus
      });
    } catch (e) {
      // Rollback
      setPeriodData(prev => ({ ...prev, [clientId]: current }));
      alert("Sync failed. Check connection.");
    }
  }, [selectedYear, selectedMonth, periodData]);

  const getStatus = useCallback((clientId: string): FilingStatus => {
    return periodData[clientId] || { r1: false, r3b: false };
  }, [periodData]);

  const updateDueDate = async (val: string) => {
    const key = `monthly_${selectedYear}_${selectedMonth}`;
    try {
      await api.post('/settings/compliance-dates', { key, value: val });
      setDueDates(prev => ({ ...prev, [key]: val }));
    } catch (e) {}
  };

  const getDueDate = () => dueDates[`monthly_${selectedYear}_${selectedMonth}`] || '';

  return { getStatus, toggleStatus, updateDueDate, getDueDate, loading };
};
