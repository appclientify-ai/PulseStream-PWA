const fs = require('fs');
let c = fs.readFileSync('pages/Compliance/AnnualReturns/GSTR4logic.tsx', 'utf8');

c = c.replace(
  /export interface GSTR4FilingStatus \{/,
  `export interface GSTR4FilingStatus {\n  remark?: string;`
);

c = c.replace(
  /const getFilingStatus = useCallback\(\(clientId: string\): GSTR4FilingStatus => \{/,
  `const updateRemark = useCallback((clientId: string, remark: string) => {
    setAllData(prev => {
      const pData = { ...(prev[periodKey] || {}) };
      const cData = { ...(pData[clientId] || { filed: false }) };
      cData.remark = remark;
      pData[clientId] = cData;
      const next = { ...prev, [periodKey]: pData };
      api.patchAppData(STORAGE_KEY, { [\`data.\${periodKey}.\${clientId}\`]: cData }).then(() => socketService.emit('data_updated')).catch(console.error);
      return next;
    });
  }, [periodKey]);

  const getFilingStatus = useCallback((clientId: string): GSTR4FilingStatus => {`
);

c = c.replace(
  /return \{ getFilingStatus, toggleStatus, updateFilingDate, updateDueDate, getDueDate, isDataLoaded \};/,
  `return { getFilingStatus, toggleStatus, updateFilingDate, updateRemark, updateDueDate, getDueDate, isDataLoaded };`
);

fs.writeFileSync('pages/Compliance/AnnualReturns/GSTR4logic.tsx', c);
console.log('Patched GSTR4logic');
