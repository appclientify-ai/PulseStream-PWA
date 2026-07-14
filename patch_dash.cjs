const fs = require('fs');
let content = fs.readFileSync('pages/Primary/Dashboard.tsx', 'utf8');

const dashPatch = `
  const [filingDataCache, setFilingDataCache] = useState<Record<string, any>>({});
  
  useEffect(() => {
    const loadFilingData = async () => {
      const keys = ['clientify_monthly_filing_v3', 'clientify_quarterly_filing_v3', 'clientify_composition_filing_v3', 'clientify_gstr4_filing_v1', 'clientify_gstr9_filing_data_v2', 'clientify_itr_filing_data_v2', 'clientify_audit_fin_data_v3', 'clientify_gstr9_watchlist_v2'];
      const data: Record<string, any> = {};
      for (const k of keys) {
        data[k] = await api.getAppData(k) || {};
      }
      setFilingDataCache(data);
    };
    loadFilingData();
  }, []);

  const getFilingCounts = (type: 'monthly' | 'quarterly' | 'composition' | 'gstr4' | 'gstr9' | 'itr' | 'audit', periodKey: string) => {
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
    const periodData = data[periodKey] || {};
    
    let total = 0;
    let filed = 0;
    let r1 = 0;
    let r3b = 0;
    let cmp08 = 0;
    
    if (type === 'monthly') {
      const applicable = (clients || []).filter(c => c && c.gstProfile?.regType === 'Regular' && c.gstProfile?.filingFreq === 'Monthly');
      total = applicable.length;
      r1 = applicable.filter(c => periodData[c.id]?.r1).length;
      r3b = applicable.filter(c => periodData[c.id]?.r3b).length;
      filed = r3b;
    } else if (type === 'quarterly') {
      const applicable = (clients || []).filter(c => c && c.gstProfile?.regType === 'Regular' && c.gstProfile?.filingFreq === 'Quarterly');
      total = applicable.length;
      r1 = applicable.filter(c => periodData[c.id]?.r1).length;
      r3b = applicable.filter(c => periodData[c.id]?.r3b).length;
      filed = r3b;
    } else if (type === 'composition') {
      const applicable = (clients || []).filter(c => c && c.gstProfile?.regType === 'Composition');
      total = applicable.length;
      cmp08 = applicable.filter(c => periodData[c.id]?.cmp08).length;
      filed = cmp08;
    } else if (type === 'itr') {
      total = clients?.length || 0;
      filed = (clients || []).filter(c => periodData[c.id]?.filed).length;
    } else if (type === 'gstr4') {
       const applicable = (clients || []).filter(c => c && c.gstProfile?.regType === 'Composition');
       total = applicable.length;
       filed = applicable.filter(c => periodData[c.id]?.filed).length;
    } else if (type === 'gstr9') {
       const watchlistObj = filingDataCache['clientify_gstr9_watchlist_v2'] || {};
       const currentWatchlist: string[] = watchlistObj[periodKey] || [];
       const applicable = (clients || []).filter(c => c && c.gstProfile?.regType === 'Regular' && currentWatchlist.includes(c.id));
       total = applicable.length;
       filed = applicable.filter(c => periodData[c.id]?.gstr9).length;
    } else if (type === 'audit') {
       const applicable = (clients || []).filter(c => c && c.itProfile?.advisoryWork?.taxAudit);
       total = applicable.length;
       filed = applicable.filter(c => periodData[c.id]?.auditFiled).length;
    }

    return { total, filed, pending: Math.max(0, total - filed), r1, r3b, cmp08 };
  };
`;

const startIndex = content.indexOf(`  const getFilingCounts = `);
const endIndex = content.indexOf(`  const getLitCounts = `, startIndex);

if (startIndex > -1 && endIndex > -1) {
  content = content.substring(0, startIndex) + dashPatch.trim() + '\n\n' + content.substring(endIndex);
  fs.writeFileSync('pages/Primary/Dashboard.tsx', content);
} else {
  console.log('Could not find getFilingCounts block to replace');
}
