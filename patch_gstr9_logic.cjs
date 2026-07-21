const fs = require('fs');
let c = fs.readFileSync('pages/Compliance/AnnualReturns/GSTR9_9Clogic.tsx', 'utf8');

c = c.replace(
  /export interface GSTR9FilingStatus \{/,
  `export interface GSTR9FilingStatus {\n  remark?: string;`
);

c = c.replace(
  /const getFilingStatus = useCallback\(\(clientId: string\): GSTR9FilingStatus => \{/,
  `const updateRemark = useCallback((clientId: string, remark: string) => {
    setAllData(prev => {
      const pData = { ...(prev[periodKey] || {}) };
      const cData = { ...(pData[clientId] || { gstr9: false, gstr9c: false }) };
      cData.remark = remark;
      pData[clientId] = cData;
      const next = { ...prev, [periodKey]: pData };
      api.patchAppData(STORAGE_KEY, { [\`data.\${periodKey}.\${clientId}\`]: cData }).then(() => socketService.emit('data_updated')).catch(console.error);
      return next;
    });
  }, [periodKey]);

  const getFilingStatus = useCallback((clientId: string): GSTR9FilingStatus => {`
);

c = c.replace(
  /return \{ getFilingStatus, toggleStatus, updateFilingDate, updateDueDate, getDueDate, isDataLoaded \};/,
  `return { getFilingStatus, toggleStatus, updateFilingDate, updateRemark, updateDueDate, getDueDate, isDataLoaded };`
);

fs.writeFileSync('pages/Compliance/AnnualReturns/GSTR9_9Clogic.tsx', c);
console.log('Patched GSTR9_9Clogic');
