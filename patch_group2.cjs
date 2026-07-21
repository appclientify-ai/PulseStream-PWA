const fs = require('fs');

const files = [
  'pages/Compliance/GSTReturn/QuarterlyFiling.tsx',
  'pages/Compliance/GSTReturn/CompositionFiling.tsx',
  'pages/Compliance/AnnualReturns/GSTR4.tsx',
  'pages/Compliance/AnnualReturns/GSTR9_9C.tsx',
  'pages/ClientHub/GstMasterPortfolio.tsx'
];

files.forEach(file => {
  let c = fs.readFileSync(file, 'utf8');

  if (c.includes('const groupedClients =')) {
    console.log(`Already patched ${file}`);
    return;
  }

  const groupedClientsCode = `
  const groupedClients = useMemo(() => {
    const groups = {};
    filteredClients.forEach(c => {
      const sector = c.gstProfile?.sector || 'Unassigned';
      if (!groups[sector]) groups[sector] = [];
      groups[sector].push(c);
    });
    return Object.keys(groups).sort((a, b) => {
      if (a === 'Unassigned') return 1;
      if (b === 'Unassigned') return -1;
      return a.localeCompare(b);
    }).map(s => ({ sector: s, clients: groups[s] }));
  }, [filteredClients]);

`;

  // Find the last return (
  const insertionPoint = c.lastIndexOf('return (');
  c = c.slice(0, insertionPoint) + groupedClientsCode + c.slice(insertionPoint);

  // We know the pattern is:
  // {filteredClients.map((client, idx) => { ...
  // or {filteredClients.map((client, idx) => ( ...
  // We want to replace it with:
  /*
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
              ...
  */

  c = c.replace(/\{filteredClients\.map\(\(client,\s*idx\)\s*=>\s*\{/g, 
      `{(() => {
                  let globalIdx = 0;
                  return groupedClients.map(group => (
                    <React.Fragment key={group.sector}>
                      <tr>
                        <td colSpan={15} className="px-4 py-2 bg-indigo-50/50 text-[10px] font-black uppercase text-indigo-700 tracking-widest border-y border-indigo-100">
                          Sector: {group.sector}
                        </td>
                      </tr>
                      {group.clients.map((client) => {
                        const idx = globalIdx++;`);
                        
  c = c.replace(/\{filteredClients\.map\(\(client,\s*idx\)\s*=>\s*\(/g, 
      `{(() => {
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
                        return (`);
                        
  // Now we need to handle the closing tags correctly.
  // The structure ends right before </tbody>
  // Usually it's:
  //                 )}
  //               )}
  //             </tbody>
  // OR
  //                 )
  //               )}
  //             </tbody>
  // OR
  //                 )}
  //               )
  //             </tbody>
  
  // We can just find </tbody> and backtrack to replace the last }) } or whatever with what we need.
  const tBodyMatch = c.match(/([\s\S]*?)<\/tbody>/);
  if (tBodyMatch) {
    let tBodyContent = tBodyMatch[1];
    
    // We want to remove the last few closing braces of the map.
    // The exact string we want to replace is the very last block of closing parentheses/braces.
    // E.g., \)\s*\}\)\s*\}\s*$ or similar. Let's just use a string replacement by finding the last occurrence of } or ) before </tbody>.
    // Since we know the newly opened tags are:
    // 1. {(() => {
    // 2. groupedClients.map(group => (
    // 3. <React.Fragment key={group.sector}>
    // 4. group.clients.map((client) => {
    // And if we injected `return (` earlier, we have one more `(`.
    // Actually, we don't need to overthink it. Just close what we opened, where the old map closed!
    // The old map closed with `})}` or `))`
    // If it was `{filteredClients.map( ... {`, it closed with `})}`
    // If it was `{filteredClients.map( ... (`, it closed with `))}`
    
    // We can replace the last `})}` before `</tbody>` with `})} </React.Fragment>))})()}`
    
    const lastBraceIdx = tBodyContent.lastIndexOf('})}');
    if (lastBraceIdx !== -1) {
       tBodyContent = tBodyContent.slice(0, lastBraceIdx) + `})} </React.Fragment>))})()}` + tBodyContent.slice(lastBraceIdx + 3);
    } else {
       const lastParenIdx = tBodyContent.lastIndexOf('))}');
       if (lastParenIdx !== -1) {
          tBodyContent = tBodyContent.slice(0, lastParenIdx) + `})} </React.Fragment>))})()}` + tBodyContent.slice(lastParenIdx + 3);
       } else {
          // Maybe it's `) }` or something
          const lastClose = tBodyContent.lastIndexOf(')}');
          tBodyContent = tBodyContent.slice(0, lastClose) + `})} </React.Fragment>))})()}` + tBodyContent.slice(lastClose + 2);
       }
    }
    
    c = tBodyContent + '</tbody>' + c.slice(tBodyMatch[1].length + 8);
  }

  fs.writeFileSync(file, c);
  console.log(`Patched ${file}`);
});
