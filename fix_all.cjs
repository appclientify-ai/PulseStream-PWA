const fs = require('fs');

const files = [
  'pages/Compliance/GSTReturn/MonthlyFiling.tsx',
  'pages/Compliance/GSTReturn/QuarterlyFiling.tsx',
  'pages/Compliance/GSTReturn/CompositionFiling.tsx',
  'pages/Compliance/AnnualReturns/GSTR4.tsx',
  'pages/Compliance/AnnualReturns/GSTR9_9C.tsx',
  'pages/ClientHub/GstMasterPortfolio.tsx'
];

files.forEach(file => {
  let c = fs.readFileSync(file, 'utf8');

  // We know the tbody starts with <tbody className="divide-y divide-slate-100">
  // and ends with </tbody>
  const tbodyStart = c.indexOf('<tbody className="divide-y divide-slate-100">');
  const tbodyEnd = c.indexOf('</tbody>', tbodyStart);

  if (tbodyStart === -1 || tbodyEnd === -1) {
    console.log(`Could not find tbody in ${file}`);
    return;
  }

  // Find the exact TR row template inside tbody
  // The row template starts with `<tr key={client.id}` or similar and ends with `</tr>`
  let trStart = c.indexOf('<tr key={client.id}', tbodyStart);
  if (trStart === -1) trStart = c.indexOf('<tr key={', tbodyStart); // fallback
  if (trStart === -1) {
    console.log(`Could not find TR in ${file}`);
    return;
  }

  // Find where this TR ends
  // We need to count tags or just find the matching </tr>. 
  // However, there could be nested <tr>? No, usually not.
  // Wait, there might be other </tr> for the empty state.
  // The empty state TR is usually `<tr><td colSpan=... >...</td></tr>`
  // The main TR starts with `<tr key={client.id}`
  
  // Actually, we can just find the block of code inside `filteredClients.map`
  const mapStartStr = '{filteredClients.map';
  let mapStart = c.indexOf(mapStartStr, tbodyStart);
  if (mapStart === -1) mapStart = c.indexOf('filteredClients.map', tbodyStart);
  if (mapStart === -1) return;

  // Let's just find the start of the `return (` inside the map
  const returnStart = c.indexOf('return (', mapStart);
  let trTemplateStart = c.indexOf('<tr ', returnStart);
  
  // Find the matching </tr> for the main tr
  // We will assume the main TR ends at the LAST </tr> before </tbody>
  const lastTrEnd = c.lastIndexOf('</tr>', tbodyEnd);
  
  const trContent = c.slice(trTemplateStart, lastTrEnd + 5);

  // Now, what about the empty state?
  let emptyState = '<tr><td colSpan={15} className="py-32 text-center text-slate-300 font-black uppercase tracking-widest text-sm">No records found</td></tr>';
  if (c.substring(tbodyStart, mapStart).includes('filteredClients.length === 0')) {
     const emptyStart = c.indexOf('<tr', tbodyStart);
     const emptyEnd = c.indexOf('</tr>', emptyStart);
     if (emptyStart !== -1 && emptyEnd !== -1 && emptyStart < mapStart) {
        emptyState = c.slice(emptyStart, emptyEnd + 5);
     }
  }

  // We need to get the variable declarations inside the map (like `const st = getStatus(client.id);`)
  let varDeclarations = '';
  const arrowBodyStart = c.indexOf('{', mapStart);
  if (arrowBodyStart !== -1 && arrowBodyStart < returnStart && c.substring(mapStart, arrowBodyStart).includes('=>')) {
     varDeclarations = c.slice(arrowBodyStart + 1, returnStart).trim();
  }

  const newTbodyContent = `
              {filteredClients.length === 0 ? (
                ${emptyState}
              ) : (
                (() => {
                  let globalIdx = 0;
                  return groupedClients.map(group => (
                    <React.Fragment key={group.sector}>
                      <tr>
                        <td colSpan={15} className="px-4 py-2 bg-indigo-50/50 text-[10px] font-black uppercase text-indigo-700 tracking-widest border-y border-indigo-100">
                          Sector: {group.sector}
                        </td>
                      </tr>
                      {group.clients.map((client) => {
                        const idx = globalIdx++;
                        ${varDeclarations}
                        return (
                          ${trContent}
                        );
                      })}
                    </React.Fragment>
                  ));
                })()
              )}
            `;

  c = c.slice(0, tbodyStart + '<tbody className="divide-y divide-slate-100">'.length) + newTbodyContent + c.slice(tbodyEnd);

  fs.writeFileSync(file, c);
  console.log(`Fully fixed ${file}`);
});
