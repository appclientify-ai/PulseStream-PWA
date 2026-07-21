const fs = require('fs');
let c = fs.readFileSync('pages/ClientHub/GstMasterPortfolio.tsx', 'utf8');

// Find tr start
let trStart = c.indexOf('<tr key={client.id}');
let trEnd = c.lastIndexOf('</tr>', c.indexOf('</tbody>'));
const trContent = c.slice(trStart, trEnd + 5);

const tbodyStart = c.indexOf('<tbody className="divide-y divide-slate-100">');
const tbodyEnd = c.indexOf('</tbody>');

const emptyState = '<tr><td colSpan={15} className=" py-32 text-center text-slate-300 font-black uppercase tracking-widest text-sm">No records found in vault</td></tr>';

const newTbody = `
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
                      return (
                        ${trContent}
                      );
                    })}
                  </React.Fragment>
                ));
              })()
            )}
          `;

c = c.slice(0, tbodyStart + '<tbody className="divide-y divide-slate-100">'.length) + newTbody + c.slice(tbodyEnd);

fs.writeFileSync('pages/ClientHub/GstMasterPortfolio.tsx', c);
console.log('Fixed GstMasterPortfolio');
