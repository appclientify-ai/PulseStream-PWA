import { calculateDefaultDueDate } from '../pages/Administration/DueDateSetting';

export const COMPLIANCE_STORAGE_KEY = 'clientify_global_compliance_dates_v1';

export const STATUTORY_MODULE_NAMES: Record<string, string> = {
  'monthly_r1': 'GSTR-1 (Monthly Return)',
  'monthly_r3b': 'GSTR-3B (Monthly Return)',
  'quarterly_iff': 'GSTR-1 / IFF (Quarterly QRMP)',
  'quarterly_r3b': 'GSTR-3B (Quarterly QRMP)',
  'composition_cmp08': 'CMP-08 (Composition Scheme)',
  'audit_bs': 'Balance Sheet & Financials Prep',
  'audit_tax': 'Tax Audit (Form 3CA / 3CD)',
  'itr_return': 'Income Tax Return (ITR Non-Audit)',
  'annual_gstr4': 'GSTR-4 (Composition Annual Return)',
  'annual_gstr9': 'GSTR-9 (GST Annual Return)',
  'annual_gstr9c': 'GSTR-9C (Reconciliation Statement)',
};

export interface StatutoryDeadlineItem {
  id: string;
  key: string;
  moduleId: string;
  moduleName: string;
  year: string;
  period: string;
  date: Date;
  dateString: string;
  title: string;
  client: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  status: string;
  origin: 'statutory';
}

const DEFAULT_YEARS = ['2024-2025', '2025-2026'];
const MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];
const QUARTERS = ['Q1 (Apr-Jun)', 'Q2 (Jul-Sep)', 'Q3 (Oct-Dec)', 'Q4 (Jan-Mar)'];

export function getAllStatutoryDeadlines(includePast = false): StatutoryDeadlineItem[] {
  let savedData: Record<string, string> = {};
  try {
    const raw = localStorage.getItem(COMPLIANCE_STORAGE_KEY);
    if (raw) {
      savedData = JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error parsing compliance dates from localStorage:', e);
  }

  const itemsMap: Map<string, StatutoryDeadlineItem> = new Map();

  // Generate all standard statutory deadlines across current & next FY
  DEFAULT_YEARS.forEach(yr => {
    // Monthly GST
    MONTHS.forEach(m => {
      ['monthly_r1', 'monthly_r3b'].forEach(mod => {
        const key = `${mod}_${yr}_${m}`;
        const dateStr = savedData[key] || calculateDefaultDueDate(mod, yr, m);
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj.getTime())) {
          itemsMap.set(key, {
            id: `statutory_${key}`,
            key,
            moduleId: mod,
            moduleName: STATUTORY_MODULE_NAMES[mod] || mod,
            year: yr,
            period: m,
            date: dateObj,
            dateString: dateStr,
            title: `${STATUTORY_MODULE_NAMES[mod] || mod} (${m} ${yr})`,
            client: `All GST Portfolio Clients (${m})`,
            category: 'GST STATUTORY',
            priority: 'High',
            status: 'Statutory Due',
            origin: 'statutory'
          });
        }
      });
    });

    // Quarterly GST & Composition
    QUARTERS.forEach(q => {
      ['quarterly_iff', 'quarterly_r3b', 'composition_cmp08'].forEach(mod => {
        const key = `${mod}_${yr}_${q}`;
        const dateStr = savedData[key] || calculateDefaultDueDate(mod, yr, q);
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj.getTime())) {
          const category = mod.includes('composition') ? 'COMPOSITION STATUTORY' : 'GST QUARTERLY';
          itemsMap.set(key, {
            id: `statutory_${key}`,
            key,
            moduleId: mod,
            moduleName: STATUTORY_MODULE_NAMES[mod] || mod,
            year: yr,
            period: q,
            date: dateObj,
            dateString: dateStr,
            title: `${STATUTORY_MODULE_NAMES[mod] || mod} (${q} ${yr})`,
            client: `All Eligible Clients (${q})`,
            category,
            priority: 'High',
            status: 'Statutory Due',
            origin: 'statutory'
          });
        }
      });
    });

    // Annual Returns & Audits
    ['audit_bs', 'audit_tax', 'itr_return', 'annual_gstr4', 'annual_gstr9', 'annual_gstr9c'].forEach(mod => {
      const key = `${mod}_${yr}_Annual`;
      const dateStr = savedData[key] || calculateDefaultDueDate(mod, yr, 'Annual');
      const dateObj = new Date(dateStr);
      if (!isNaN(dateObj.getTime())) {
        let cat = 'ANNUAL COMPLIANCE';
        if (mod.startsWith('audit_')) cat = 'AUDIT & B/S';
        if (mod === 'itr_return') cat = 'INCOME TAX';
        if (mod.startsWith('annual_gstr')) cat = 'GST ANNUAL';

        itemsMap.set(key, {
          id: `statutory_${key}`,
          key,
          moduleId: mod,
          moduleName: STATUTORY_MODULE_NAMES[mod] || mod,
          year: yr,
          period: 'Annual',
          date: dateObj,
          dateString: dateStr,
          title: `${STATUTORY_MODULE_NAMES[mod] || mod} (FY ${yr})`,
          client: `All Applicable Assessees (FY ${yr})`,
          category: cat,
          priority: 'High',
          status: 'Statutory Due',
          origin: 'statutory'
        });
      }
    });
  });

  const allItems = Array.from(itemsMap.values());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = includePast 
    ? allItems 
    : allItems.filter(item => {
        // Include deadlines from the past 30 days up to 12 months in the future
        const diffDays = Math.round((item.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= -30 && diffDays <= 365;
      });

  return filtered.sort((a, b) => a.date.getTime() - b.date.getTime());
}
