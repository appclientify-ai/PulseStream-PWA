export const formatDate = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return '---';

  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return '---';
    const day = String(dateInput.getDate()).padStart(2, '0');
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    const year = dateInput.getFullYear();
    return `${day}/${month}/${year}`;
  }

  const str = String(dateInput).trim();
  if (!str) return '---';

  // Handle ISO string or date string with timestamp T
  if (str.includes('T')) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  }

  // Handle date string separated by - or /
  const parts = str.split(/[-/]/);
  if (parts.length === 3) {
    const [p1, p2, p3] = parts;
    // Case 1: YYYY-MM-DD or YYYY/MM/DD
    if (p1.length === 4) {
      const year = p1;
      const month = p2.padStart(2, '0');
      const day = p3.padStart(2, '0');
      return `${day}/${month}/${year}`;
    }
    // Case 2: DD-MM-YYYY, DD/MM/YYYY or MM/DD/YYYY
    if (p3.length === 4) {
      const year = p3;
      const num1 = parseInt(p1, 10);
      const num2 = parseInt(p2, 10);
      
      // If p1 > 12, p1 MUST be day, p2 is month -> DD/MM/YYYY
      if (num1 > 12) {
        return `${p1.padStart(2, '0')}/${p2.padStart(2, '0')}/${year}`;
      }
      // If p2 > 12, p2 MUST be day, p1 is month -> MM/DD/YYYY -> swap to DD/MM/YYYY
      if (num2 > 12) {
        return `${p2.padStart(2, '0')}/${p1.padStart(2, '0')}/${year}`;
      }
      // Default assume DD/MM/YYYY if both <= 12
      return `${p1.padStart(2, '0')}/${p2.padStart(2, '0')}/${year}`;
    }
  }

  // Fallback to Date object parsing
  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return str;
};

export const formatISOToDDMMYYYY = (isoStr: string | null | undefined): string => {
  if (!isoStr || !isoStr.trim()) return 'DD/MM/YYYY';
  const str = isoStr.trim();
  const parts = str.split(/[-/]/);
  if (parts.length === 3 && parts[0].length === 4) {
    // YYYY-MM-DD
    return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
  }
  return formatDate(str);
};

export const calculateRenewalDueDate = (expiryDateStr?: string, monthsPrior: number = 2): string => {
  if (!expiryDateStr) return '';
  const cleanStr = expiryDateStr.split('T')[0];
  const parts = cleanStr.split(/[-/]/);
  
  let year = 0, month = 0, day = 0;
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else if (parts[2].length === 4) {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    }
  }

  if (!year || !month || !day || isNaN(year) || isNaN(month) || isNaN(day)) {
    const d = new Date(expiryDateStr);
    if (isNaN(d.getTime())) return '';
    year = d.getFullYear();
    month = d.getMonth() + 1;
    day = d.getDate();
  }

  month -= monthsPrior;
  while (month <= 0) {
    month += 12;
    year -= 1;
  }

  const maxDays = new Date(year, month, 0).getDate();
  if (day > maxDays) {
    day = maxDays;
  }

  const yyyy = year.toString().padStart(4, '0');
  const mm = month.toString().padStart(2, '0');
  const dd = day.toString().padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

