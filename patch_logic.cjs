const fs = require('fs');

let content = fs.readFileSync('pages/Compliance/GSTReturn/filinglogic/MonthlyFilingLogic.tsx', 'utf8');

// replace the hook implementation
const newHook = `
import { api } from '../../../../services/api';

export const useMonthlyFilingLogic = (selectedYear: string, selectedMonth: string, customKey?: string) => {
  const storageKey = customKey || STORAGE_KEY_DEFAULT;
  const storageKeyDates = customKey ? \`\${customKey}_dates\` : STORAGE_KEY_DATES_DEFAULT;

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
  }, [storageKey, storageKeyDates]);

  const toggleStatus = useCallback((clientId: string, type: 'r1' | 'r3b' | 'cmp08', customPeriod?: string) => {
    const periodKey = customPeriod || \`\${selectedYear}_\${selectedMonth}\`;
    setAllData(prev => {
      const periodData = { ...(prev[periodKey] || {}) };
      const clientData = { ...(periodData[clientId] || { r1: false, r3b: false, cmp08: false }) };
      (clientData as any)[type] = !(clientData as any)[type];
      periodData[clientId] = clientData;
      const next = { ...prev, [periodKey]: periodData };
      api.saveAppData(storageKey, next).catch(err => console.error('Failed to save filing data', err));
      return next;
    });
  }, [selectedYear, selectedMonth, storageKey]);

  const getStatus = useCallback((clientId: string, customPeriod?: string): any => {
    const periodKey = customPeriod || \`\${selectedYear}_\${selectedMonth}\`;
    return (allData[periodKey] || {})[clientId] || { r1: false, r3b: false, cmp08: false };
  }, [allData, selectedYear, selectedMonth]);

  const updateDueDate = (val: string) => {
    const key = \`\${selectedYear}_\${selectedMonth}\`;
    const next = { ...dueDates, [key]: val };
    setDueDates(next);
    api.saveAppData(storageKeyDates, next).catch(err => console.error('Failed to save due dates', err));
  };

  const getDueDate = () => dueDates[\`\${selectedYear}_\${selectedMonth}\`] || '';

  return { getStatus, toggleStatus, updateDueDate, getDueDate, isDataLoaded };
};
`;

content = content.replace(/export const useMonthlyFilingLogic = \([\s\S]*/, newHook.trim());

// We also need to make sure we import useEffect if not already imported
if (!content.includes('useEffect')) {
    content = content.replace(/import { useState, useCallback } from 'react';/, "import { useState, useCallback, useEffect } from 'react';");
}

fs.writeFileSync('pages/Compliance/GSTReturn/filinglogic/MonthlyFilingLogic.tsx', content);
