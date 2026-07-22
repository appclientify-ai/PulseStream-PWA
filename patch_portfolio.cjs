const fs = require('fs');

let c = fs.readFileSync('pages/ClientHub/GstMasterPortfolio.tsx', 'utf8');

const groupingLogic = `  const groupedClients = useMemo(() => {
    const groups: Record<string, typeof filteredClients> = {};
    filteredClients.forEach(c => {
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
  }, [filteredClients]);

  return (`;

c = c.replace(/return \(/, groupingLogic);

c = c.replace(/filteredClients\.map\(\(client, idx\) => \(/, 
`groupedClients.map(({ sector, clients: sectorClients }) => (
                <React.Fragment key={sector}>
                  <tr>
                    <td colSpan={8} className="bg-slate-100 font-bold text-slate-700 py-2 px-[5.5px] uppercase text-[10px] tracking-widest">{sector}</td>
                  </tr>
                  {sectorClients.map((client, idx) => (`);

c = c.replace(/<\/tr>\s*\)\s*\)\s*\)\}/, 
`</tr>\n                  ))}\n                </React.Fragment>\n              )))}`);

fs.writeFileSync('pages/ClientHub/GstMasterPortfolio.tsx', c);
