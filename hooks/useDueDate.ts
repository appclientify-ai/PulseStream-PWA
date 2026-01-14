
import { useCallback } from 'react';

export const useDueDate = () => {
  const STORAGE_KEY = 'clientify_global_compliance_dates_v1';

  const getDueDate = useCallback((module: string, fy: string, period?: string) => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return '';
    
    try {
      const dates = JSON.parse(saved);
      const keyMap: Record<string, string> = {
        'Audit': `audit_tax_${fy}_Annual`,
        'BalanceSheet': `audit_bs_${fy}_Annual`,
        'ITR': `itr_return_${fy}_Annual`,
        'GSTR-1 Monthly': `monthly_r1_${fy}_${period}`,
        'GSTR-3B Monthly': `monthly_r3b_${fy}_${period}`,
        'GSTR-1 Quarterly': `quarterly_iff_${fy}_${period}`,
        'GSTR-3B Quarterly': `quarterly_r3b_${fy}_${period}`,
        'CMP-08': `composition_cmp08_${fy}_${period}`,
        'GSTR-4': `annual_gstr4_${fy}_Annual`,
        'GSTR-9': `annual_gstr9_${fy}_Annual`,
        'GSTR-9C': `annual_gstr9c_${fy}_Annual`
      };

      const key = keyMap[module] || `${module}_${fy}_${period}`;
      return dates[key] || '';
    } catch {
      return '';
    }
  }, []);

  return { getDueDate };
};
