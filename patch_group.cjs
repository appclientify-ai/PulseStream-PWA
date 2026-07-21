const fs = require('fs');

function extractMatchingBrackets(str, startIdx) {
  let count = 0;
  for (let i = startIdx; i < str.length; i++) {
    if (str[i] === '{') count++;
    if (str[i] === '}') {
      count--;
      if (count === 0) return i;
    }
  }
  return -1;
}

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

  const insertionPoint = c.lastIndexOf('return (');
  c = c.slice(0, insertionPoint) + groupedClientsCode + c.slice(insertionPoint);

  // Replace {filteredClients.map((client, idx) => { ... })}
  // or {filteredClients.map((client, idx) => ( ... ))}
  
  const mapRegex = /\{filteredClients\.map\(\(client, idx\) => ([\s\S]*?)<\/tr>\s*\)\s*\}|\{filteredClients\.map\(\(client, idx\) => \{([\s\S]*?)return \([\s\S]*?<\/tr>\s*\)\s*\}\)\}/g;
  
  // Wait, let's just do a manual string replacement.
  const mapStartIdx = c.indexOf('{filteredClients.map((client, idx) =>');
  if (mapStartIdx !== -1) {
    // We need to replace the entire map block.
    // Let's find the closing brace. It's a `{ ... }` block inside the tbody.
    // A simpler way:
    // We know it's something like:
    // {filteredClients.map((client, idx) => { ... })}
    // or {filteredClients.map((client, idx) => ( ... ))}
    // We can replace the start with:
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
    */
    // and replace the end of the block. The end of the block is `  )}` or `  }))}`
    // Let's just do simple regex replacements.

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
                        
    // Now we need to close it properly.
    // The original closing was `})}` or `))`
    // If it was `})}`, we replace it with `})}</React.Fragment>))})()}`
    // Since we don't know exactly where, we can replace the last `)}` inside `tbody`.
    // Let's replace the `</tbody` with `</tbody` but we have to close our newly opened braces.
    
    // Instead of regex on the end, let's use the fact that it ends right before `</tbody`.
    // Wait, the structure is:
    // <tbody ...>
    //   {filteredClients.length === 0 ? (...) : (
    //      {filteredClients.map(...)}
    //   )}
    // </tbody>
    
    // Wait, `filteredClients.length === 0` is sometimes wrapping the map.
    // `GstMasterPortfolio` has `filteredClients.length === 0 ? ... : filteredClients.map(...)`
    c = c.replace(/filteredClients\.map\(\(client, idx\) => \(/g, 
      `(() => {
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
    
    // Close it. We replaced `(` or `{` with `return (`. We need to add `})} </React.Fragment>)) })()`
    
    // For `QuarterlyFiling`: it's `{filteredClients.map((client, idx) => {`
    // For `CompositionFiling`: it's `{filteredClients.map((client, idx) => {`
    // For `GSTR4`: it's `{filteredClients.map((client, idx) => {`
    // For `GSTR9_9C`: it's `{filteredClients.map((client, idx) => {`
    
    // Actually, all filings use `filteredClients.map((client, idx) => {`
    // Wait, some use `filteredClients.map((client, idx) => (`
    // Let's see: GstMasterPortfolio uses `filteredClients.map((client, idx) => (`
    
    // So the close for `{filteredClients.map((client, idx) => {` is `})}`
    // The close for `filteredClients.map((client, idx) => (` is `))` (it doesn't have `{` at the start of map)
    
    c = c.replace(/}\)\}/g, `})} </React.Fragment>))})()}`);
    c = c.replace(/\)\)\}/g, `})} </React.Fragment>))})()}`);
    
    // Wait, replacing ALL `})}` or `))}` is dangerous!
    // Let's do it specifically around `</tbody>`
    
    c = c.replace(/<\/tbody>/, `})}
            </React.Fragment>
          ));
        })()
      )}
    </tbody>`);
    // BUT we need to remove the original `})}` or `))` that came right before `</tbody>`.
    // Actually, writing a custom replacer based on bracket matching is much safer.
  }
});
