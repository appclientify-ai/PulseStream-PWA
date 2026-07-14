const fs = require('fs');
let content = fs.readFileSync('pages/Compliance/GSTReturn/filinglogic/MonthlyFilingLogic.tsx', 'utf8');

const updated = `
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
    const syncHandler = () => load();
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, [storageKey, storageKeyDates]);
`;

// Replace `useEffect(() => { ... load(); ... setIsDataLoaded(true); ... }, [storageKey, storageKeyDates]);`
// We'll just replace the whole block by finding index.
const start = content.indexOf(`  useEffect(() => {\n    const load = async () => {`);
if (start > -1) {
  const end = content.indexOf(`}, [storageKey, storageKeyDates]);`, start) + `}, [storageKey, storageKeyDates]);`.length;
  if (end > -1) {
    content = content.substring(0, start) + updated.trim() + content.substring(end);
    fs.writeFileSync('pages/Compliance/GSTReturn/filinglogic/MonthlyFilingLogic.tsx', content);
    console.log('Patched MonthlyFilingLogic');
  }
}
