const fs = require('fs');

let c = fs.readFileSync('pages/Compliance/AnnualReturns/GSTR9_9C.tsx', 'utf8');

c = c.replace(/filteredClients/g, 'filteredDisplayList');

c = c.replace(/\{filteredDisplayList\.map\(\(client, idx\) => \{/, 
`{groupedClients.map(({ sector, clients: sectorClients }) => (
                <React.Fragment key={sector}>
                  <tr>
                    <td colSpan={12} className="bg-slate-100 font-bold text-slate-700 py-2 px-4 uppercase text-[10px] tracking-widest">{sector}</td>
                  </tr>
                  {sectorClients.map((client, idx) => {`);

c = c.replace(/<\/tr>\s*\);\s*\}\)\}/, `</tr>\n                  );\n                })}\n                </React.Fragment>\n              ))}`);

fs.writeFileSync('pages/Compliance/AnnualReturns/GSTR9_9C.tsx', c);
