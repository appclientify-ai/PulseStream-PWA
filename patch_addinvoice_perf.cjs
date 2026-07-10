const fs = require('fs');
const file = 'pages/Administration/invoice/addinvoice.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldInit = `  useEffect(() => {
    const init = async () => {
      const [clis, nextNo, sets] = await Promise.all([
        api.getClients(),
        api.generateNextInvoiceNo(),
        api.getInvoiceSettings()
      ]);
      setClients(clis);
      setSettings(sets);
      
      if (editingInvoice) {
        setInvoiceNo(editingInvoice.invoiceNo);
        setSelectedClientId(editingInvoice.clientId);
        setSearchQuery(editingInvoice.clientName);
        setIsMiscClient(!!editingInvoice.isMiscClient);
        setClientLegalName(editingInvoice.clientName);
        setClientTradeName(editingInvoice.clientTradeName || '');
        setClientGstin(editingInvoice.clientGstin || '');
        setClientMobile(editingInvoice.miscMobile || '');
        setClientAddress(editingInvoice.miscAddress || '');
        setInvDate(editingInvoice.date);
        setItems(editingInvoice.items);
        setStatus(editingInvoice.status);
      } else {
        setInvoiceNo(nextNo);
      }
      setIsLoading(false);
    };
    init();
  }, [editingInvoice]);`;

const newInit = `  useEffect(() => {
    const init = async () => {
      const clisPromise = api.getClients();
      const setsPromise = api.getInvoiceSettings();
      
      const [clis, sets] = await Promise.all([clisPromise, setsPromise]);
      setClients(clis);
      setSettings(sets);
      
      if (editingInvoice) {
        setInvoiceNo(editingInvoice.invoiceNo);
        setSelectedClientId(editingInvoice.clientId);
        setSearchQuery(editingInvoice.clientName);
        setIsMiscClient(!!editingInvoice.isMiscClient);
        setClientLegalName(editingInvoice.clientName);
        setClientTradeName(editingInvoice.clientTradeName || '');
        setClientGstin(editingInvoice.clientGstin || '');
        setClientMobile(editingInvoice.miscMobile || '');
        setClientAddress(editingInvoice.miscAddress || '');
        setInvDate(editingInvoice.date);
        setItems(editingInvoice.items);
        setStatus(editingInvoice.status);
      } else {
        const invs = await api.getInvoices();
        const fy = () => {
          const d = new Date();
          const year = d.getFullYear();
          const month = d.getMonth();
          if (month >= 3) return \`\${year.toString().slice(2)}-\${(year + 1).toString().slice(2)}\`;
          return \`\${(year - 1).toString().slice(2)}-\${year.toString().slice(2)}\`;
        };
        const fYear = fy();
        const prefix = sets.invoicePrefix || 'INV';
        const sameFyInvs = invs.filter(inv => inv.invoiceNo.includes(\`\${prefix}/\${fYear}/\`));
        const existingNums = new Set<number>();
        for (const inv of sameFyInvs) {
           const parts = inv.invoiceNo.split('/');
           if (parts.length >= 3) {
              const numStr = parts[parts.length - 1];
              const num = parseInt(numStr, 10);
              if (!isNaN(num)) existingNums.add(num);
           }
        }
        let count = 1;
        while (existingNums.has(count)) count++;
        setInvoiceNo(\`\${prefix}/\${fYear}/\${count.toString().padStart(2, '0')}\`);
      }
      setIsLoading(false);
    };
    init();
  }, [editingInvoice]);`;

if (content.includes(oldInit)) {
  content = content.replace(oldInit, newInit);
  fs.writeFileSync(file, content);
  console.log("Patched addinvoice.tsx performance.");
} else {
  // Maybe dependency array is empty
  const oldInitEmpty = oldInit.replace('[editingInvoice]', '[]');
  const newInitEmpty = newInit.replace('[editingInvoice]', '[]');
  if (content.includes(oldInitEmpty)) {
    content = content.replace(oldInitEmpty, newInitEmpty);
    fs.writeFileSync(file, content);
    console.log("Patched addinvoice.tsx performance (empty dep).");
  } else {
    console.log("Could not find useEffect in addinvoice.tsx");
  }
}
