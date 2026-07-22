const fs = require('fs');

const filesToPatchSectorAndRemark = [
  'pages/Compliance/GSTReturn/MonthlyFiling.tsx',
  'pages/Compliance/GSTReturn/QuarterlyFiling.tsx',
  'pages/Compliance/GSTReturn/CompositionFiling.tsx',
  'pages/Compliance/AnnualReturns/GSTR4.tsx',
  'pages/Compliance/AnnualReturns/GSTR9_9C.tsx'
];

for (const file of filesToPatchSectorAndRemark) {
  let c = fs.readFileSync(file, 'utf8');

  // Fix sector sorting
  c = c.replace(/return a\.localeCompare\(b\);/g, "return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });");
  
  // Fix alphabetical sorting within group
  c = c.replace(/return sortedKeys\.map\(k => \(\{ sector: k, clients: groups\[k\] \}\)\);/g,
                "return sortedKeys.map(k => ({ sector: k, clients: groups[k].sort((c1, c2) => (c1.tradeName || '').localeCompare(c2.tradeName || '')) }));");

  // Re-add the remark td if missing
  if (c.includes('Remark</th>') && !c.includes('placeholder="Add remark..."')) {
    // We insert it right before Action
    c = c.replace(/<td className=" px-4 py-\[2px\] text-right(\s*overflow-visible)?">/g, 
        `<td className=" px-4 py-[2px] truncate max-w-[150px]">
                       <input type="text" value={st?.remark || status?.remark || getStatus?.(client.id)?.remark || ''} onChange={e => updateRemark(client.id, e.target.value)} placeholder="Add remark..." className="w-full bg-transparent border-none p-0 text-[11px] font-bold text-slate-600 focus:ring-0 outline-none placeholder-slate-300" />
                     </td>
                     <td className=" px-4 py-[2px] text-right$1">`);
  } else if (c.includes('placeholder="Add remark..."')) {
    c = c.replace(/value=\{st\.remark \|\| ''\}/g, "value={st?.remark || status?.remark || getStatus?.(client.id)?.remark || ''}");
    c = c.replace(/value=\{status\.remark \|\| ''\}/g, "value={st?.remark || status?.remark || getStatus?.(client.id)?.remark || ''}");
  }

  fs.writeFileSync(file, c);
}

// Portfolio doesn't have Remark, just fix sorting
let portC = fs.readFileSync('pages/ClientHub/GstMasterPortfolio.tsx', 'utf8');
portC = portC.replace(/return a\.localeCompare\(b\);/g, "return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });");
portC = portC.replace(/return sortedKeys\.map\(k => \(\{ sector: k, clients: groups\[k\] \}\)\);/g,
                "return sortedKeys.map(k => ({ sector: k, clients: groups[k].sort((c1, c2) => (c1.tradeName || '').localeCompare(c2.tradeName || '')) }));");
fs.writeFileSync('pages/ClientHub/GstMasterPortfolio.tsx', portC);

console.log('Fixed sector and remark logic');
