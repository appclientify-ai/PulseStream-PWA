const fs = require('fs');
let c = fs.readFileSync('pages/ClientHub/GstMasterPortfolio.tsx', 'utf8');

const target = `  useEffect(() => { fetchClients();
    const syncHandler = () => { console.log('Syncing in background...'); fetchClients(true); };
    window.addEventListener('clientify_db_change', syncHandler);
      const groupedClients = useMemo(() => {
    const groups: Record<string, typeof filteredClients> = {};
    filteredClients.forEach(c => {
      const sector = c.gstProfile?.sector || 'Uncategorized';
      if (!groups[sector]) groups[sector] = [];
      groups[sector].push(c);
    });
    const sortedKeys = Object.keys(groups).sort((a, b) => {
       if (a === 'Uncategorized') return 1;
       if (b === 'Uncategorized') return -1;
       return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
    return sortedKeys.map(k => ({ sector: k, clients: groups[k].sort((c1, c2) => (c1.tradeName || '').localeCompare(c2.tradeName || '')) }));
  }, [filteredClients]);

  return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, []);`;

const replacement = `  useEffect(() => {
    fetchClients();
    const syncHandler = () => { console.log('Syncing in background...'); fetchClients(true); };
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, []);

  const groupedClients = useMemo(() => {
    const groups: Record<string, typeof filteredClients> = {};
    filteredClients.forEach(c => {
      const sector = c.gstProfile?.sector || 'Uncategorized';
      if (!groups[sector]) groups[sector] = [];
      groups[sector].push(c);
    });
    const sortedKeys = Object.keys(groups).sort((a, b) => {
       if (a === 'Uncategorized') return 1;
       if (b === 'Uncategorized') return -1;
       return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
    return sortedKeys.map(k => ({ sector: k, clients: groups[k].sort((c1, c2) => (c1.tradeName || '').localeCompare(c2.tradeName || '')) }));
  }, [filteredClients]);`;

if (c.includes(target)) {
  fs.writeFileSync('pages/ClientHub/GstMasterPortfolio.tsx', c.replace(target, replacement));
  console.log('Fixed');
} else {
  console.log('Not found, falling back to regex');
  
  // Regex fallback
  c = c.replace(/useEffect\(\(\) => \{ fetchClients\(\);\s*const syncHandler = \(\) => \{ console\.log\('Syncing in background\.\.\.'\); fetchClients\(true\); \};\s*window\.addEventListener\('clientify_db_change', syncHandler\);\s*const groupedClients = useMemo\(\(\) => \{[\s\S]*?return \(\) => window\.removeEventListener\('clientify_db_change', syncHandler\);\s*\}, \[\]\);/, replacement);
  fs.writeFileSync('pages/ClientHub/GstMasterPortfolio.tsx', c);
  console.log('Used regex');
}

