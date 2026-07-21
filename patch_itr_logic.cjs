const fs = require('fs');
let logic = fs.readFileSync('pages/Compliance/ITAudit/ITRReturnlogic.tsx', 'utf8');

logic = logic.replace(
  /export interface ITRFilingStatus \{/,
  `export interface ITRFilingStatus {\n  prepared?: boolean;`
);

const oldToggle = `  const toggleStatus = useCallback((clientId: string) => {
    setAllData(prev => {
      const yearData = { ...(prev[selectedAY] || {}) };
      const clientData = { ...(yearData[clientId] || { filed: false, refundStatus: 'N/A' }) };
      
      clientData.filed = !clientData.filed;
      if (clientData.filed) {
        clientData.date = new Date().toISOString().split('T')[0];
        if (!clientData.refundStatus || clientData.refundStatus === 'N/A') {
          clientData.refundStatus = 'Pending';
        }
      } else {
        delete clientData.date;
        clientData.refundStatus = 'N/A';
      }
      
      yearData[clientId] = clientData;
      const next = { ...prev, [selectedAY]: yearData };
      api.patchAppData(STORAGE_KEY, { [\`data.\${selectedAY}.\${clientId}\`]: clientData }).then(() => socketService.emit('data_updated')).catch(console.error);
      return next;
    });
  }, [selectedAY]);`;

const newToggle = `  const toggleStatus = useCallback((clientId: string) => {
    setAllData(prev => {
      const yearData = { ...(prev[selectedAY] || {}) };
      const clientData = { ...(yearData[clientId] || { filed: false, prepared: false, refundStatus: 'N/A' }) };
      
      if (clientData.filed) {
        clientData.filed = false;
        clientData.prepared = false;
        delete clientData.date;
        clientData.refundStatus = 'N/A';
      } else if (clientData.prepared) {
        clientData.filed = true;
        clientData.prepared = false;
        clientData.date = new Date().toISOString().split('T')[0];
        if (!clientData.refundStatus || clientData.refundStatus === 'N/A') {
          clientData.refundStatus = 'Pending';
        }
      } else {
        clientData.prepared = true;
        clientData.filed = false;
      }
      
      yearData[clientId] = clientData;
      const next = { ...prev, [selectedAY]: yearData };
      api.patchAppData(STORAGE_KEY, { [\`data.\${selectedAY}.\${clientId}\`]: clientData }).then(() => socketService.emit('data_updated')).catch(console.error);
      return next;
    });
  }, [selectedAY]);`;

logic = logic.replace(oldToggle, newToggle);

fs.writeFileSync('pages/Compliance/ITAudit/ITRReturnlogic.tsx', logic);
console.log('patched logic');
