const fs = require('fs');
let content = fs.readFileSync('pages/Primary/Dashboard.tsx', 'utf8');

// Patch first useEffect: loadData
const loadDataPatch = `
  useEffect(() => {
    if (isOnline) { 
      loadData(); 
      socketService.connect(); 
      const syncHandler = () => { console.log('Syncing main dashboard data...'); loadData(); };
      window.addEventListener('clientify_db_change', syncHandler);
      return () => {
        window.removeEventListener('clientify_db_change', syncHandler);
        socketService.disconnect();
      };
    }
  }, [isOnline, loadData]);
`;
content = content.replace(/useEffect\(\(\) => \{\s*if \(isOnline\) \{ loadData\(\); socketService\.connect\(\); \}\s*return \(\) => socketService\.disconnect\(\);\s*\}, \[isOnline, loadData\]\);/, loadDataPatch.trim());

// Patch second useEffect: loadFilingData
const filingDataPatch = `
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
    const syncHandler = () => { console.log('Syncing filing data...'); loadFilingData(); };
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, []);
`;

// we need to find the `const loadFilingData = async () => {` block.
const fdStart = content.indexOf(`  useEffect(() => {`);
const fdEnd = content.indexOf(`  }, []);`, fdStart) + 9;

// Replace the filing data useEffect if found, but make sure it's the right one.
// Let's use regex for filing data.
content = content.replace(/useEffect\(\(\) => \{\s*const loadFilingData = async \(\) => \{[\s\S]*?\}\s*loadFilingData\(\);\s*\}, \[\]\);/, filingDataPatch.trim());

fs.writeFileSync('pages/Primary/Dashboard.tsx', content);
