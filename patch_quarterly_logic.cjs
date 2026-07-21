const fs = require('fs');
let c = fs.readFileSync('pages/Compliance/GSTReturn/filinglogic/QuarterlyFilingLogic.tsx', 'utf8');

c = c.replace(
  /export interface FilingStatus \{/,
  `export interface FilingStatus {\n  remark?: string;`
);

c = c.replace(
  /const getFilingStatus = useCallback\(\(clientId: string\): FilingStatus => \{/,
  `const updateRemark = useCallback((clientId: string, remark: string) => {
    setAllData(prev => {
      const pData = { ...(prev[periodKey] || {}) };
      const cData = { ...(pData[clientId] || { r1: false, r3b: false }) };
      cData.remark = remark;
      pData[clientId] = cData;
      const next = { ...prev, [periodKey]: pData };
      api.patchAppData(STORAGE_KEY, { [\`data.\${periodKey}.\${clientId}\`]: cData }).then(() => socketService.emit('data_updated')).catch(console.error);
      return next;
    });
  }, [periodKey]);

  const getFilingStatus = useCallback((clientId: string): FilingStatus => {`
);

c = c.replace(
  /return \{ getFilingStatus, toggleStatus, updateDueDate, getDueDate, isDataLoaded \};/,
  `return { getFilingStatus, toggleStatus, updateRemark, updateDueDate, getDueDate, isDataLoaded };`
);

fs.writeFileSync('pages/Compliance/GSTReturn/filinglogic/QuarterlyFilingLogic.tsx', c);
console.log('Patched QuarterlyFilingLogic');
