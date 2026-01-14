
import { useState, useCallback } from 'react';

export interface FilingStatus {
  r1: boolean;
  r3b: boolean;
}

const STORAGE_KEY = 'clientify_monthly_filing_v3';
const STORAGE_KEY_DATES = 'clientify_global_compliance_dates_v1';

export const FULL_YEAR_VAL = 'Full Year (Summary)';

// India FY sequence
export const FY_MONTHS = [
  'April', 'May', 'June', 'July', 'August', 'September', 
  'October', 'November', 'December', 'January', 'February', 'March'
];

export const FY_QUARTERS = [
  'April-June (Q1)',
  'July-September (Q2)',
  'October-December (Q3)',
  'January-March (Q4)'
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

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const QUARTERS = [
  ...FY_QUARTERS
];

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
  if (prevMonthIdx < 0) {
    prevMonthIdx = 11;
    mYear = calYear - 1;
  }

  const monthFY = getFY(prevMonthIdx, mYear);

  let qIdx = 0;
  let qYear = calYear;
  if (m >= 0 && m <= 2) { 
    qIdx = 2; 
  } else if (m >= 3 && m <= 5) { 
    qIdx = 3; 
    qYear = calYear - 1;
  } else if (m >= 6 && m <= 8) { 
    qIdx = 0; 
  } else { 
    qIdx = 1; 
  }

  const qStartMonths = [3, 6, 9, 0];
  const quarterFY = getFY(qStartMonths[qIdx], qYear);

  return { 
    month: MONTHS[prevMonthIdx], 
    quarter: QUARTERS[qIdx],
    year: monthFY,
    quarterYear: quarterFY
  };
};

export const useMonthlyFilingLogic = (selectedYear: string, selectedMonth: string) => {
  const [allData, setAllData] = useState<Record<string, Record<string, FilingStatus>>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  const [dueDates, setDueDates] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DATES);
    return saved ? JSON.parse(saved) : {};
  });

  const toggleStatus = useCallback((clientId: string, type: 'r1' | 'r3b', customPeriod?: string) => {
    const periodKey = customPeriod || `${selectedYear}_${selectedMonth}`;
    setAllData(prev => {
      const periodData = { ...(prev[periodKey] || {}) };
      const clientData = { ...(periodData[clientId] || { r1: false, r3b: false }) };
      clientData[type] = !clientData[type];
      periodData[clientId] = clientData;
      const next = { ...prev, [periodKey]: periodData };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [selectedYear, selectedMonth]);

  const getStatus = useCallback((clientId: string, customPeriod?: string): FilingStatus => {
    const periodKey = customPeriod || `${selectedYear}_${selectedMonth}`;
    return (allData[periodKey] || {})[clientId] || { r1: false, r3b: false };
  }, [allData, selectedYear, selectedMonth]);

  const updateDueDate = (type: 'r1' | 'r3b', val: string) => {
    const moduleId = type === 'r1' ? 'monthly_r1' : 'monthly_r3b';
    const key = `${moduleId}_${selectedYear}_${selectedMonth}`;
    const next = { ...dueDates, [key]: val };
    setDueDates(next);
    localStorage.setItem(STORAGE_KEY_DATES, JSON.stringify(next));
  };

  const getDueDate = (type: 'r1' | 'r3b') => {
    const moduleId = type === 'r1' ? 'monthly_r1' : 'monthly_r3b';
    return dueDates[`${moduleId}_${selectedYear}_${selectedMonth}`] || '';
  };

  return { getStatus, toggleStatus, updateDueDate, getDueDate };
};
