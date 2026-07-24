import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { socketService } from '../services/socket';

export const calculateDefaultDueDate = (moduleId: string, yearStr: string, period: string): string => {
  const startYear = parseInt(yearStr.split('-')[0], 10) || 2024;
  const endYear = startYear + 1;

  if (moduleId === 'monthly_r1' || moduleId === 'monthly_r3b') {
    const dueDay = moduleId === 'monthly_r1' ? '11' : '20';
    const monthMap: Record<string, { year: number; dueMonth: string }> = {
      April: { year: startYear, dueMonth: '05' },
      May: { year: startYear, dueMonth: '06' },
      June: { year: startYear, dueMonth: '07' },
      July: { year: startYear, dueMonth: '08' },
      August: { year: startYear, dueMonth: '09' },
      September: { year: startYear, dueMonth: '10' },
      October: { year: startYear, dueMonth: '11' },
      November: { year: startYear, dueMonth: '12' },
      December: { year: endYear, dueMonth: '01' },
      January: { year: endYear, dueMonth: '02' },
      February: { year: endYear, dueMonth: '03' },
      March: { year: endYear, dueMonth: '04' },
    };
    const info = monthMap[period];
    if (info) {
      return `${info.year}-${info.dueMonth}-${dueDay}`;
    }
  }

  if (moduleId === 'quarterly_iff' || moduleId === 'quarterly_r3b') {
    const isIff = moduleId === 'quarterly_iff';
    const day = isIff ? '13' : '22';
    if (period.includes('Q1')) return `${startYear}-07-${day}`;
    if (period.includes('Q2')) return `${startYear}-10-${day}`;
    if (period.includes('Q3')) return `${endYear}-01-${day}`;
    if (period.includes('Q4')) return `${endYear}-04-${day}`;
  }

  if (moduleId === 'composition_cmp08') {
    if (period.includes('Q1')) return `${startYear}-07-18`;
    if (period.includes('Q2')) return `${startYear}-10-18`;
    if (period.includes('Q3')) return `${endYear}-01-18`;
    if (period.includes('Q4')) return `${endYear}-04-18`;
  }

  if (moduleId === 'audit_bs') return `${endYear}-09-15`;
  if (moduleId === 'audit_tax') return `${endYear}-09-30`;
  if (moduleId === 'itr_return') return `${endYear}-07-31`;
  if (moduleId === 'annual_gstr4') return `${endYear}-04-30`;
  if (moduleId === 'annual_gstr9') return `${endYear}-12-31`;
  if (moduleId === 'annual_gstr9c') return `${endYear}-12-31`;

  return '';
};

export const useGlobalDueDates = (selectedYear: string) => {
  const [dates, setDates] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const STORAGE_KEY = 'clientify_global_compliance_dates_v1';

  const load = async () => {
    try {
      const saved = await api.getAppData(STORAGE_KEY);
      if (saved) {
        setDates(saved);
      }
    } catch (e) {
      console.error('Failed to load global due dates', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    const syncHandler = () => load();
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, []);

  const getGlobalDueDate = (moduleId: string, period: string) => {
    const key = `${moduleId}_${selectedYear}_${period}`;
    return dates[key] || calculateDefaultDueDate(moduleId, selectedYear, period);
  };

  const updateGlobalDueDate = async (moduleId: string, period: string, value: string) => {
    const key = `${moduleId}_${selectedYear}_${period}`;
    const nextDates = { ...dates, [key]: value };
    setDates(nextDates);
    try {
      await api.patchAppData(STORAGE_KEY, { [`data.${key}`]: value });
      socketService.emit('data_updated');
      window.dispatchEvent(new Event('clientify_db_change'));
    } catch (e) {
      console.error('Failed to save global due date', e);
    }
  };

  return { getGlobalDueDate, updateGlobalDueDate, isLoadingDates: isLoading };
};
