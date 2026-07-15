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

  // 3. Status Check (Inactive / Litigation)
  if (client.status === 'Litigation' || client.status === 'Inactive') return false;

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

  if (client.status === 'Litigation' || client.status === 'Inactive') return false;

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
  
  let qIdx;
  let prevQMonth;
  let prevQYear = calYear;
  if (m >= 0 && m <= 2) {
    qIdx = 2; // Oct-Dec (Q3)
    prevQMonth = 9;
    prevQYear = calYear - 1;
  } else if (m >= 3 && m <= 5) {
    qIdx = 3; // Jan-Mar (Q4)
    prevQMonth = 0;
  } else if (m >= 6 && m <= 8) {
    qIdx = 0; // Apr-Jun (Q1)
    prevQMonth = 3;
  } else {
    qIdx = 1; // Jul-Sep (Q2)
    prevQMonth = 6;
  }

  const monthFY = getFY(prevMonthIdx, mYear);
  const quarterFY = getFY(prevQMonth, prevQYear);
  return { 
    month: MONTHS[prevMonthIdx], 
    quarter: FY_QUARTERS[qIdx],
    year: monthFY,
    quarterYear: quarterFY
  };
};

import { api } from '../../../../services/api';

export const useMonthlyFilingLogic = (selectedYear: string, selectedMonth: string, customKey?: string) => {
  const storageKey = customKey || STORAGE_KEY_DEFAULT;
  const storageKeyDates = customKey ? `${customKey}_dates` : STORAGE_KEY_DATES_DEFAULT;

  const [allData, setAllData] = useState<Record<string, Record<string, FilingStatus>>>({});
  const [dueDates, setDueDates] = useState<Record<string, string>>({});
  const [isDataLoaded, setIsDataLoaded] = useState(false);

useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getAppData(storageKey);
        if (data) setAllData(data);
        const dates = await api.getAppData(storageKeyDates);
        if (dates) setDueDates(dates);
      } catch (err) {
        console.error('Failed to load filing data', err);
      } finally {
        setIsDataLoaded(true);
      }
    };
    load();
    const syncHandler = () => load();
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, [storageKey, storageKeyDates]);

  const toggleStatus = useCallback((clientId: string, type: 'r1' | 'r3b' | 'cmp08', customPeriod?: string) => {
    const periodKey = customPeriod || `${selectedYear}_${selectedMonth}`;
    setAllData(prev => {
      const periodData = { ...(prev[periodKey] || {}) };
      const clientData = { ...(periodData[clientId] || { r1: false, r3b: false, cmp08: false }) };
      const newVal = !(clientData as any)[type];
      (clientData as any)[type] = newVal;
      periodData[clientId] = clientData;
      const next = { ...prev, [periodKey]: periodData };
      api.patchAppData(storageKey, { [`data.${periodKey}.${clientId}.${type}`]: newVal }).catch(err => console.error('Failed to save filing data', err));
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
    api.patchAppData(storageKeyDates, { [`data.${key}`]: val }).catch(err => console.error('Failed to save due dates', err));
  };

  const getDueDate = () => dueDates[`${selectedYear}_${selectedMonth}`] || '';

  return { getStatus, toggleStatus, updateDueDate, getDueDate, isDataLoaded };
};