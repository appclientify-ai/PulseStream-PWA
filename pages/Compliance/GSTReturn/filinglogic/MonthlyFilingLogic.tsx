import { useState, useCallback, useEffect } from 'react';
import { Client } from '../../../../types';
import { socketService } from '../../../../services/socket.ts';

export interface FilingStatus {
  remark?: string;
  r1: boolean;
  r3b: boolean | 'Pending' | 'Challan' | 'Filed';
  cmp08?: boolean | 'Pending' | 'Challan' | 'Filed';
}

export const getStatusLabel = (val: boolean | string | undefined): 'Filed' | 'Challan' | 'Pending' => {
  if (val === true || val === 'Filed') return 'Filed';
  if (val === 'Challan') return 'Challan';
  return 'Pending';
};

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

export const parseDateString = (dateStr?: string): Date | null => {
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.trim()) return null;
  const str = dateStr.trim();
  
  // Format DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const ddmmyyyyMatch = str.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (ddmmyyyyMatch) {
    const day = parseInt(ddmmyyyyMatch[1], 10);
    const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
    const year = parseInt(ddmmyyyyMatch[3], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  // Format YYYY-MM-DD
  const yyyymmddMatch = str.match(/^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})$/);
  if (yyyymmddMatch) {
    const year = parseInt(yyyymmddMatch[1], 10);
    const month = parseInt(yyyymmddMatch[2], 10) - 1;
    const day = parseInt(yyyymmddMatch[3], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * HELPER: Convert FY + Month Name to a comparable Date object (1st of month)
 */
export const periodToDate = (fy: string, monthName: string) => {
  if (!fy) return new Date();
  const [startYearStr] = fy.split('-');
  let year = parseInt(startYearStr, 10);
  const monthIdx = MONTHS.indexOf(monthName);
  if (monthIdx >= 0 && monthIdx <= 2) {
    year += 1;
  }
  return new Date(year, monthIdx >= 0 ? monthIdx : 0, 1);
};

/**
 * CORE LOGIC: Determines if a client should be shown in a specific filing period
 */
export const isClientVisibleInPeriod = (client: Client, selectedYear: string, selectedMonth: string) => {
  if (!client) return false;
  const gstProfile = client.gstProfile || {};
  
  // 1. Client Status Check: Only show active clients in return pages (hide Inactive / Litigation)
  if (client.status === 'Inactive' || client.status === 'Litigation') {
    return false;
  }

  const periodDate = periodToDate(selectedYear, selectedMonth);
  
  // 2. Check Registration Date - Only show from registration month onwards
  if (gstProfile.regDate && gstProfile.regDate.trim() !== "") {
    const parsedReg = parseDateString(gstProfile.regDate);
    if (parsedReg) {
      const regMonthStart = new Date(parsedReg.getFullYear(), parsedReg.getMonth(), 1);
      if (periodDate < regMonthStart) return false;
    }
  }

  // 3. Check Cancellation / Suspension Date
  const status = gstProfile.gstStatus;
  if (gstProfile.cancelDate && (status === 'Closed' || status === 'Cancelled' || status === 'Suspended')) {
    const parsedCancel = parseDateString(gstProfile.cancelDate);
    if (parsedCancel) {
      const cancelMonthStart = new Date(parsedCancel.getFullYear(), parsedCancel.getMonth(), 1);
      if (periodDate > cancelMonthStart) return false;
    }
  }

  return true;
};

/**
 * CORE LOGIC: For Annual Returns
 */
export const isClientVisibleInFY = (client: Client, fy: string) => {
  if (!client) return false;
  const gstProfile = client.gstProfile || {};

  // 1. Client Status Check: Only show active clients in annual return pages (hide Inactive / Litigation)
  if (client.status === 'Inactive' || client.status === 'Litigation') {
    return false;
  }

  if (!fy) return true;

  const [startYearStr] = fy.split('-');
  const startYear = parseInt(startYearStr, 10);
  if (isNaN(startYear)) return true;

  const fyStart = new Date(startYear, 3, 1); // April 1st
  const fyEnd = new Date(startYear + 1, 2, 31, 23, 59, 59); // March 31st

  // 2. Check Registration Date
  if (gstProfile.regDate && gstProfile.regDate.trim() !== "") {
    const parsedReg = parseDateString(gstProfile.regDate);
    if (parsedReg) {
      if (parsedReg > fyEnd) return false;
    }
  }

  // 3. Check Cancellation / Suspension Date
  const status = gstProfile.gstStatus;
  if (gstProfile.cancelDate && (status === 'Closed' || status === 'Cancelled' || status === 'Suspended')) {
    const parsedCancel = parseDateString(gstProfile.cancelDate);
    if (parsedCancel) {
      if (parsedCancel < fyStart) return false;
    }
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

export const useMonthlyFilingLogic = (
  selectedYear: string, 
  selectedMonth: string, 
  customKey?: string,
  initialData?: Record<string, Record<string, FilingStatus>>,
  initialDates?: Record<string, string>
) => {
  const storageKey = customKey || STORAGE_KEY_DEFAULT;
  const storageKeyDates = customKey ? `${customKey}_dates` : STORAGE_KEY_DATES_DEFAULT;

  const [allData, setAllData] = useState<Record<string, Record<string, FilingStatus>>>(initialData || {});
  const [dueDates, setDueDates] = useState<Record<string, string>>(initialDates || {});
  const [isDataLoaded, setIsDataLoaded] = useState(!!initialData);

  useEffect(() => {
    if (initialData) setAllData(initialData);
    if (initialDates) setDueDates(initialDates);
    if (initialData || initialDates) setIsDataLoaded(true);
  }, [initialData, initialDates]);

  useEffect(() => {
    if (initialData) return;
    const load = async () => {
      try {
        const [data, dates] = await Promise.all([
          api.getAppData(storageKey),
          api.getAppData(storageKeyDates)
        ]);
        if (data) setAllData(data);
        if (dates) setDueDates(dates);
      } catch (err) {
        console.error('Failed to load filing data', err);
      } finally {
        setIsDataLoaded(true);
      }
    };
    load();

    const syncHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.storageKey === storageKey && detail.clientId && detail.periodKey && detail.field) {
        setAllData(prev => {
          const pData = { ...(prev[detail.periodKey] || {}) };
          const cData = { ...(pData[detail.clientId] || { r1: false, r3b: 'Pending', cmp08: 'Pending' }) };
          (cData as any)[detail.field] = detail.value;
          pData[detail.clientId] = cData;
          return { ...prev, [detail.periodKey]: pData };
        });
        return;
      }
      if (detail?.type === 'connect') {
        load();
      }
    };

    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, [storageKey, storageKeyDates, initialData]);

  const toggleStatus = useCallback((clientId: string, type: 'r1' | 'r3b' | 'cmp08', customPeriod?: string) => {
    const periodKey = customPeriod || `${selectedYear}_${selectedMonth}`;
    
    // Calculate new value outside of state setter to prevent multi-triggering in React StrictMode
    const periodData = allData[periodKey] || {};
    const clientData = periodData[clientId] || { r1: false, r3b: 'Pending', cmp08: 'Pending' };
    
    let newVal: boolean | string;
    if (type === 'r3b' || type === 'cmp08') {
      const currentLabel = getStatusLabel((clientData as any)[type]);
      if (currentLabel === 'Pending') newVal = 'Challan';
      else if (currentLabel === 'Challan') newVal = 'Filed';
      else newVal = 'Pending';
    } else {
      newVal = !(clientData as any)[type];
    }

    // Optimistically update local state immediately
    setAllData(prev => {
      const pData = { ...(prev[periodKey] || {}) };
      const cData = { ...(pData[clientId] || { r1: false, r3b: 'Pending', cmp08: 'Pending' }) };
      (cData as any)[type] = newVal;
      pData[clientId] = cData;
      return { ...prev, [periodKey]: pData };
    });

    // Make dedicated single-filing update API request
    api.updateSingleFilingStatus({
      storageKey,
      clientId,
      periodKey,
      field: type,
      value: newVal
    }).catch(err => {
      console.error('Failed to save filing data', err);
    });
  }, [selectedYear, selectedMonth, storageKey, allData]);

  const getStatus = useCallback((clientId: string, customPeriod?: string): any => {
    const periodKey = customPeriod || `${selectedYear}_${selectedMonth}`;
    return (allData[periodKey] || {})[clientId] || { r1: false, r3b: false, cmp08: false };
  }, [allData, selectedYear, selectedMonth]);

  const updateDueDate = (val: string) => {
    const key = `${selectedYear}_${selectedMonth}`;
    const next = { ...dueDates, [key]: val };
    setDueDates(next);
    api.patchAppData(storageKeyDates, { [`data.${key}`]: val })
      .catch(err => console.error('Failed to save due dates', err));
  };

  const updateRemark = useCallback((clientId: string, val: string, customPeriod?: string) => {
    const periodKey = customPeriod || `${selectedYear}_${selectedMonth}`;
    
    setAllData(prev => {
      const pData = { ...(prev[periodKey] || {}) };
      const cData = { ...(pData[clientId] || { r1: false, r3b: false, cmp08: false }), remark: val };
      pData[clientId] = cData;
      return { ...prev, [periodKey]: pData };
    });

    api.patchAppData(storageKey, { [`data.${periodKey}.${clientId}.remark`]: val })
      .catch(err => console.error('Failed to save remark', err));
  }, [selectedYear, selectedMonth, storageKey]);

  const getDueDate = () => dueDates[`${selectedYear}_${selectedMonth}`] || '';

  return { getStatus, toggleStatus, updateRemark, updateDueDate, getDueDate, isDataLoaded };
};