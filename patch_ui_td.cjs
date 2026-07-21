const fs = require('fs');

function patchFile(file) {
  let c = fs.readFileSync(file, 'utf8');

  // Regex to match trade name and legal name tds
  const regex = /<td[^>]*>\{client\.tradeName(?: \|\| '---')?\}<\/td>\s*<td[^>]*>\{client\.legalName(?: \|\| '---')?\}<\/td>/g;
  
  // Actually they have titles and some other stuff. Let's do a more robust replacement.
  // We can just find the row rendering area.
  
  c = c.replace(/<td className=" px-4 py-\[2px\] font-black text-slate-900 truncate text-\[12px\]" title=\{client\.tradeName\}>\{client\.tradeName \|\| '---'\}<\/td>\s*<td className=" px-4 py-\[2px\] font-bold text-slate-500 truncate text-\[12px\]" title=\{client\.legalName\}>\{client\.legalName(?: \|\| '---')?\}<\/td>/g, 
  `<td className=" px-4 py-[2px] truncate max-w-[200px]" title={client.tradeName}>
     <div className="font-black text-slate-900 truncate leading-tight text-[12px]">{client.tradeName || '---'}</div>
     <div className="font-bold text-[9px] text-slate-500 truncate leading-tight" title={client.legalName}>{client.legalName || '---'}</div>
   </td>
   <td className=" px-4 py-[2px] truncate max-w-[150px]">
     <input type="text" value={status.remark || ''} onChange={e => updateRemark(client.id, e.target.value)} placeholder="Add remark..." className="w-full bg-transparent border-none p-0 text-[11px] font-bold text-slate-600 focus:ring-0 outline-none placeholder-slate-300" />
   </td>`);
  
  // also check for the ones without title
  c = c.replace(/<td className=" px-4 py-\[2px\] font-black text-slate-900 truncate max-w-\[200px\]">\{client\.tradeName \|\| '---'\}<\/td>\s*<td className=" px-4 py-\[2px\] font-bold text-slate-500 truncate max-w-\[200px\]">\{client\.legalName \|\| '---'\}<\/td>/g, 
  `<td className=" px-4 py-[2px] truncate max-w-[200px]" title={client.tradeName}>
     <div className="font-black text-slate-900 truncate leading-tight text-[12px]">{client.tradeName || '---'}</div>
     <div className="font-bold text-[9px] text-slate-500 truncate leading-tight" title={client.legalName}>{client.legalName || '---'}</div>
   </td>
   <td className=" px-4 py-[2px] truncate max-w-[150px]">
     <input type="text" value={status.remark || ''} onChange={e => updateRemark(client.id, e.target.value)} placeholder="Add remark..." className="w-full bg-transparent border-none p-0 text-[11px] font-bold text-slate-600 focus:ring-0 outline-none placeholder-slate-300" />
   </td>`);

  // Annual returns ones might be different
  c = c.replace(/<td className=" px-4 py-\[2px\] font-black text-slate-900 truncate">\{client\.tradeName \|\| '---'\}<\/td>\s*<td className=" px-4 py-\[2px\] font-bold text-slate-500 truncate">\{client\.legalName \|\| '---'\}<\/td>/g, 
  `<td className=" px-4 py-[2px] truncate max-w-[200px]" title={client.tradeName}>
     <div className="font-black text-slate-900 truncate leading-tight text-[12px]">{client.tradeName || '---'}</div>
     <div className="font-bold text-[9px] text-slate-500 truncate leading-tight" title={client.legalName}>{client.legalName || '---'}</div>
   </td>
   <td className=" px-4 py-[2px] truncate max-w-[150px]">
     <input type="text" value={status.remark || ''} onChange={e => updateRemark(client.id, e.target.value)} placeholder="Add remark..." className="w-full bg-transparent border-none p-0 text-[11px] font-bold text-slate-600 focus:ring-0 outline-none placeholder-slate-300" />
   </td>`);

  fs.writeFileSync(file, c);
}

patchFile('pages/Compliance/GSTReturn/MonthlyFiling.tsx');
patchFile('pages/Compliance/GSTReturn/QuarterlyFiling.tsx');
patchFile('pages/Compliance/GSTReturn/CompositionFiling.tsx');
patchFile('pages/Compliance/AnnualReturns/GSTR4.tsx');
patchFile('pages/Compliance/AnnualReturns/GSTR9_9C.tsx');

console.log("Patched UI TDs");
