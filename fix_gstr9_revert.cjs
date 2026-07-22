const fs = require('fs');
let c = fs.readFileSync('pages/Compliance/AnnualReturns/GSTR9_9C.tsx', 'utf8');

c = c.replace(/\{groupedClients\.map\(\(\{ sector, clients: sectorClients \}\) => \(\s*<React\.Fragment key=\{sector\}>\s*<tr>\s*<td colSpan=\{12\} className="bg-slate-100 font-bold text-slate-700 py-2 px-4 uppercase text-\[10px\] tracking-widest">\{sector\}<\/td>\s*<\/tr>\s*\{sectorClients\.map\(\(client, idx\) => \{/, 
  "{filteredDisplayList.map((client, idx) => {");

c = c.replace(/<\/tr>\s*\);\s*\}\)\}\s*<\/React\.Fragment>\s*\)\)\}/, 
  "</tr>\n                  );\n                })}");

// Grouping logic for GSTR9_9C specifically using filteredDisplayList:
const groupingLogic = `  const groupedClients = useMemo(() => {
    const groups: Record<string, typeof filteredDisplayList> = {};
    filteredDisplayList.forEach(c => {
      const sector = c.gstProfile?.sector || 'Uncategorized';
      if (!groups[sector]) groups[sector] = [];
      groups[sector].push(c);
    });
    const sortedKeys = Object.keys(groups).sort((a, b) => {
       if (a === 'Uncategorized') return 1;
       if (b === 'Uncategorized') return -1;
       return a.localeCompare(b);
    });
    return sortedKeys.map(k => ({ sector: k, clients: groups[k] }));
  }, [filteredDisplayList]);

  const handleExportCSV`;

// Actually the handleExportCSV is already replaced in GSTR9_9C? Let's check.
