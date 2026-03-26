import { useState, useCallback } from 'react';
import { Client } from '../../../../types';

export interface FilingStatus {
  r1: boolean;
  r3b: boolean;
}

const STORAGE_KEY_DEFAULT = 'clientify_monthly_filing_v3';
const STORAGE_KEY_DATES_DEFAULT = 'clientify_monthly_due_dates_v1';

export const FULL_YEAR_VAL = 'Full Year (Summary)';

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

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
export const QUARTERS = [...FY_QUARTERS];

/**
 * HELPER: Convert FY + Month Name to a comparable Date object (1st of month)
 */
export const periodToDate = (fy: string, monthName: string) => {
  const [startYearStr] = fy.split('-');
  let year = parseInt(startYearStr);
  const monthIdx = MONTHS.indexOf(monthName);
  // If month is Jan/Feb/Mar, it belongs to the second half of the FY (next calendar year)
  if (monthIdx >= 0 && monthIdx <= 2) {
    year += 1;
  }
  return new Date(year, monthIdx, 1);
};

/**
 * CORE LOGIC: Determines if a client should be shown in a specific filing period
 */
export const isClientVisibleInPeriod = (client: Client, selectedYear: string, selectedMonth: string) => {
  if (!client.gstProfile) return false;
  
  const periodDate = periodToDate(selectedYear, selectedMonth);
  
  // 1. Check Registration Date - If no date is set, client is always visible
  if (client.gstProfile.regDate && client.gstProfile.regDate.trim() !== "") {
    const regDate = new Date(client.gstProfile.regDate);
    if (!isNaN(regDate.getTime())) {
      regDate.setDate(1); // Floor to 1st
      regDate.setHours(0,0,0,0);
      if (periodDate < regDate) return false;
    }
  }

  // 2. Check Cancellation Date
  if (client.gstProfile.cancelDate && client.gstProfile.gstStatus === 'Closed') {
    const cancelDate = new Date(client.gstProfile.cancelDate);
    if (!isNaN(cancelDate.getTime())) {
      const lastVisibleDate = new Date(cancelDate.getFullYear(), cancelDate.getMonth(), 1);
      if (periodDate > lastVisibleDate) return false;
    }
  }

  // 3. Status Check (Inactive)
  if (client.status === 'Inactive') {
    const now = new Date();
    const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
    if (periodDate >= currentMonthDate) return false;
  }

  return true;
};

/**
 * CORE LOGIC: For Annual Returns
 */
export const isClientVisibleInFY = (client: Client, fy: string) => {
  if (!client.gstProfile) return false;
  const [startYearStr] = fy.split('-');
  const fyStart = new Date(parseInt(startYearStr), 3, 1); // April 1st
  const fyEnd = new Date(parseInt(startYearStr) + 1, 2, 31); // March 31st

  if (client.gstProfile.regDate && client.gstProfile.regDate.trim() !== "") {
    const regDate = new Date(client.gstProfile.regDate);
    if (regDate > fyEnd) return false;
  }

  if (client.gstProfile.cancelDate && client.gstProfile.gstStatus === 'Closed') {
    const cancelDate = new Date(client.gstProfile.cancelDate);
    if (cancelDate < fyStart) return false;
  }

  return true;
};

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
  const qIdx = (m >= 0 && m <= 2) ? 3 : (m >= 3 && m <= 5) ? 0 : (m >= 6 && m <= 8) ? 1 : 2;
  const qYear = (m >= 0 && m <= 2) ? calYear - 1 : calYear;
  const qStartMonths = [3, 6, 9, 0];
  const quarterFY = getFY(qStartMonths[qIdx], qYear);
  return { 
    month: MONTHS[prevMonthIdx], 
    quarter: QUARTERS[qIdx],
    year: monthFY,
    quarterYear: quarterFY
  };
};

export const useMonthlyFilingLogic = (selectedYear: string, selectedMonth: string, customKey?: string) => {
  const storageKey = customKey || STORAGE_KEY_DEFAULT;
  const storageKeyDates = customKey ? `${customKey}_dates` : STORAGE_KEY_DATES_DEFAULT;
  const [allData, setAllData] = useState<Record<string, Record<string, FilingStatus>>>(() => {
    const saved = localStorage.getItem(storageKey);
    try {
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [dueDates, setDueDates] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(storageKeyDates);
    try {
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const toggleStatus = useCallback((clientId: string, type: 'r1' | 'r3b' | 'cmp08', customPeriod?: string) => {
    const periodKey = customPeriod || `${selectedYear}_${selectedMonth}`;
    setAllData(prev => {
      const periodData = { ...(prev[periodKey] || {}) };
      const clientData = { ...(periodData[clientId] || { r1: false, r3b: false, cmp08: false }) };
      (clientData as any)[type] = !(clientData as any)[type];
      periodData[clientId] = clientData;
      const next = { ...prev, [periodKey]: periodData };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [selectedYear, selectedMonth, storageKey]);
  const getStatus = useCallback((clientId: string, customPeriod?: string): any => {
    const periodKey = customPeriod || `${selectedYear}_${selectedMonth}`;
    return (allData[periodKey] || {})[clientId] || { r1: false, r3b: false, cmp08: false };
  }, [allData, selectedYear, selectedMonth]);
  const updateDueDate = (val: string) => {
    const key = `${selectedYear}_${selectedMonth}`;
    const next = { ...dueDates, [key]: val };
    setDueDates(next);
    localStorage.setItem(storageKeyDates, JSON.stringify(next));
  };
  const getDueDate = () => dueDates[`${selectedYear}_${selectedMonth}`] || '';
  return { getStatus, toggleStatus, updateDueDate, getDueDate };
};