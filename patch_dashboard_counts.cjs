const fs = require('fs');
let c = fs.readFileSync('pages/Primary/Dashboard.tsx', 'utf8');

const replacement = `  const getFilingCounts = (type: 'monthly' | 'quarterly' | 'composition' | 'gstr4' | 'gstr9' | 'itr' | 'audit', periodKey: string) => {
    const keys: Record<string, string> = {
      monthly: 'clientify_monthly_filing_v3',
      quarterly: 'clientify_quarterly_filing_v3',
      composition: 'clientify_composition_filing_v3',
      gstr4: 'clientify_gstr4_filing_v1',
      gstr9: 'clientify_gstr9_filing_data_v2',
      itr: 'clientify_itr_filing_data_v2',
      audit: 'clientify_audit_fin_data_v3'
    };
    const storageKey = keys[type];
    const data = filingDataCache[storageKey] || {};
    
    let year = '';
    let month = '';
    let qrmpIsQuarterEnd = false;
    
    if (type === 'quarterly' || type === 'composition') {
      const [y, q] = periodKey.split('_');
      year = y;
      if (q && q.includes('Q1')) month = 'June';
      else if (q && q.includes('Q2')) month = 'September';
      else if (q && q.includes('Q3')) month = 'December';
      else if (q && q.includes('Q4')) month = 'March';
      else month = q || '';
      qrmpIsQuarterEnd = true;
    } else if (type === 'monthly') {
      const parts = periodKey.split('_');
      year = parts[0] || '';
      month = parts[1] || '';
    } else {
      year = periodKey; // annual
      month = 'March'; // default to end of FY
    }

    const actualPeriodKey = type === 'quarterly' ? \`\${year}_\${month}\` : periodKey;
    const periodData = data[actualPeriodKey] || {};
        
    let total = 0;
    let filed = 0;
    let r1 = 0;
    let r3b = 0;
    let cmp08 = 0;
    
    if (type === 'monthly') {
      const applicable = (clients || []).filter(c => c && c.gstProfile?.regType === 'Regular' && c.gstProfile?.filingFreq === 'Monthly' && isClientVisibleInPeriod(c, year, month));
      total = applicable.length;
      r1 = applicable.filter(c => periodData[c.id]?.r1).length;
      r3b = applicable.filter(c => periodData[c.id]?.r3b).length;
      filed = r3b;
    } else if (type === 'quarterly') {
      const checkQrmpVisibility = (c: Client) => {
        if (!c || !c.gstProfile) return false;
        const visibleInMonth = isClientVisibleInPeriod(c, year, month);
        if (qrmpIsQuarterEnd) {
          if (c.gstProfile.cancelDate && c.gstProfile.gstStatus === 'Closed') {
            const cancelDate = new Date(c.gstProfile.cancelDate);
            if (!isNaN(cancelDate.getTime())) {
              const periodDate = periodToDate(year, month);
              const lastVisibleMonthDate = new Date(cancelDate.getFullYear(), cancelDate.getMonth(), 1);
              if (periodDate > lastVisibleMonthDate) return true;
            }
          }
        }
        return visibleInMonth;
      };
      const applicable = (clients || []).filter(c => c && c.gstProfile?.regType === 'Regular' && c.gstProfile?.filingFreq === 'Quarterly' && checkQrmpVisibility(c));
      total = applicable.length;
      r1 = applicable.filter(c => periodData[c.id]?.r1).length;
      r3b = applicable.filter(c => periodData[c.id]?.r3b).length;
      filed = r3b;
    } else if (type === 'composition') {
      const applicable = (clients || []).filter(c => c && c.gstProfile?.regType === 'Composition' && isClientVisibleInPeriod(c, year, month));
      total = applicable.length;
      cmp08 = applicable.filter(c => periodData[c.id]?.cmp08).length;
      filed = cmp08;
    } else if (type === 'itr') {
      const applicable = (clients || []).filter(c => c && c.itProfile && (c.status === 'Active' || c.status === 'Active Filing'));
      total = applicable.length;
      filed = applicable.filter(c => periodData[c.id]?.filed).length;
    } else if (type === 'gstr4') {
       const applicable = (clients || []).filter(c => c && c.gstProfile?.regType === 'Composition' && (c.status === 'Active' || c.status === 'Active Filing'));
       total = applicable.length;
       filed = applicable.filter(c => periodData[c.id]?.filed).length;
    } else if (type === 'gstr9') {
       const watchlistObj = filingDataCache['clientify_gstr9_watchlist_v2'] || {};
       const currentWatchlist: string[] = watchlistObj[periodKey] || [];
       const applicable = (clients || []).filter(c => c && c.gstProfile?.regType === 'Regular' && currentWatchlist.includes(c.id) && (c.status === 'Active' || c.status === 'Active Filing'));
       total = applicable.length;
       filed = applicable.filter(c => periodData[c.id]?.gstr9).length;
    } else if (type === 'audit') {
       const applicable = (clients || []).filter(c => c && c.itProfile?.advisoryWork?.taxAudit);
       total = applicable.length;
       filed = applicable.filter(c => periodData[c.id]?.auditFiled).length;
    }

    return { total, filed, pending: Math.max(0, total - filed), r1, r3b, cmp08 };
  };`;

const regex = /  const getFilingCounts = \([\s\S]*?    return \{ total, filed, pending: Math\.max\(0, total - filed\), r1, r3b, cmp08 \};\n  \};/m;

if (regex.test(c)) {
  c = c.replace(regex, replacement);
  fs.writeFileSync('pages/Primary/Dashboard.tsx', c);
  console.log("Patched getFilingCounts successfully");
} else {
  console.log("Could not find getFilingCounts");
}
