const fs = require('fs');
let c = fs.readFileSync('pages/Primary/Dashboard.tsx', 'utf8');

const target = `  useEffect(() => {
    const loadFilingData = async () => {
      const keys = ['clientify_monthly_filing_v3', 'clientify_quarterly_filing_v3', 'clientify_composition_filing_v3', 'clientify_gstr4_filing_v1', 'clientify_gstr9_filing_data_v2', 'clientify_itr_filing_data_v2', 'clientify_audit_fin_data_v3', 'clientify_gstr9_watchlist_v2'];
      const data: Record<string, any> = {};
      for (const k of keys) {
        data[k] = await api.getAppData(k) || {};
      }
      setFilingDataCache(data);
    };
    loadFilingData();
  }, []);`;

const replacement = `  const loadFilingData = async () => {
    const keys = ['clientify_monthly_filing_v3', 'clientify_quarterly_filing_v3', 'clientify_composition_filing_v3', 'clientify_gstr4_filing_v1', 'clientify_gstr9_filing_data_v2', 'clientify_itr_filing_data_v2', 'clientify_audit_fin_data_v3', 'clientify_gstr9_watchlist_v2'];
    const data: Record<string, any> = {};
    for (const k of keys) {
      data[k] = await api.getAppData(k) || {};
    }
    setFilingDataCache(data);
  };
  
  useEffect(() => {
    loadFilingData();
  }, []);`;

if (c.includes(target)) {
  c = c.replace(target, replacement);
  c = c.replace(/loadData\(true\);/g, "loadData(true); loadFilingData();");
  fs.writeFileSync('pages/Primary/Dashboard.tsx', c);
  console.log('Success');
} else {
  console.log('Target not found!');
}
