const fs = require('fs');

function patchFile(file, isAnnual, hasBothAnnual) {
  let c = fs.readFileSync(file, 'utf8');
  
  // Add updateRemark to destructuring
  if (file.includes('Monthly')) {
    c = c.replace(/const \{ getFilingStatus, toggleStatus, updateDueDate, getDueDate \} = useMonthlyFilingLogic\(selectedMonth, selectedYear\);/,
                  "const { getFilingStatus, toggleStatus, updateRemark, updateDueDate, getDueDate } = useMonthlyFilingLogic(selectedMonth, selectedYear);");
  } else if (file.includes('Quarterly')) {
    c = c.replace(/const \{ getFilingStatus, toggleStatus, updateDueDate, getDueDate \} = useQuarterlyFilingLogic\(selectedQuarter, selectedYear\);/,
                  "const { getFilingStatus, toggleStatus, updateRemark, updateDueDate, getDueDate } = useQuarterlyFilingLogic(selectedQuarter, selectedYear);");
  } else if (file.includes('Composition')) {
    c = c.replace(/const \{ getFilingStatus, toggleStatus, updateDueDate, getDueDate \} = useCompositionFilingLogic\(selectedQuarter, selectedYear\);/,
                  "const { getFilingStatus, toggleStatus, updateRemark, updateDueDate, getDueDate } = useCompositionFilingLogic(selectedQuarter, selectedYear);");
  } else if (file.includes('GSTR4')) {
    c = c.replace(/const \{ getFilingStatus, toggleStatus, updateFilingDate, updateDueDate, getDueDate \} = useGSTR4Logic\(selectedAY\);/,
                  "const { getFilingStatus, toggleStatus, updateFilingDate, updateRemark, updateDueDate, getDueDate } = useGSTR4Logic(selectedAY);");
  } else if (file.includes('GSTR9')) {
    c = c.replace(/const \{ getFilingStatus, toggleStatus, updateFilingDate, updateDueDate, getDueDate \} = useGSTR9Logic\(selectedAY\);/,
                  "const { getFilingStatus, toggleStatus, updateFilingDate, updateRemark, updateDueDate, getDueDate } = useGSTR9Logic(selectedAY);");
  }

  // Handle Export headers CSV
  c = c.replace(/const headers = \['S\.No\.', 'Trade Name', 'Legal Name',/, "const headers = ['S.No.', 'Trade Name', 'Remark',");
  // Handle Export rows CSV
  if (file.includes('GSTR9')) {
     c = c.replace(/client\.legalName,/, "getStatus(client.id).remark || '---',");
  } else {
     c = c.replace(/client\.legalName,/, "getStatus(client.id).remark || '---',");
  }

  // Handle Export headers PDF - it's the second occurrence
  c = c.replace(/const headers = \['S\.No\.', 'Trade Name', 'Legal Name',/, "const headers = ['S.No.', 'Trade Name', 'Remark',");
  c = c.replace(/client\.legalName,/, "getStatus(client.id).remark || '---',");
  
  // Also we might need a global replace for client.legalName, in exports if it happens twice:
  // It's easier to use a targeted regex
  const exportsRe = /(const rows = filteredClients\.map\(\(client, index\) => \[\s*\(index \+ 1\)\.toString\(\)\.padStart\(2, '0'\),\s*client\.tradeName,\s*)client\.legalName,/g;
  c = c.replace(exportsRe, "$1getStatus(client.id).remark || '---',");

  const exportsRe2 = /(const rows = filteredClients\.map\(client => \[\s*getClientDisplayId\(client\),\s*client\.tradeName,\s*)client\.legalName,/g;
  c = c.replace(exportsRe2, "$1getStatus(client.id).remark || '---',");

  
  // Handle Table Header
  c = c.replace(/<th className=" px-4 py-3 text-\[12px\] font-bold uppercase tracking-widest text-slate-900">Trade Name<\/th>\s*<th className=" px-4 py-3 text-\[12px\] font-bold uppercase tracking-widest text-slate-900">Legal Name<\/th>/g, 
  `<th className=" px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-slate-900">Trade Name</th>
                <th className=" px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-slate-900">Remark</th>`);

  // Handle Table Row
  c = c.replace(/<td className=" px-4 py-\[2px\] font-black text-slate-900 truncate max-w-\[200px\]">\{client\.tradeName \|\| '---'\}<\/td>\s*<td className=" px-4 py-\[2px\] font-bold text-slate-500 truncate max-w-\[200px\]">\{client\.legalName \|\| '---'\}<\/td>/g, 
  `<td className=" px-4 py-[2px] truncate max-w-[200px]">
                     <div className="font-black text-slate-900 truncate leading-tight">{client.tradeName || '---'}</div>
                     <div className="font-bold text-[9px] text-slate-500 truncate leading-tight">{client.legalName || '---'}</div>
                   </td>
                   <td className=" px-4 py-[2px] truncate max-w-[200px]">
                     <input type="text" value={status.remark || ''} onChange={e => updateRemark(client.id, e.target.value)} placeholder="Add remark..." className="w-full bg-transparent border-none p-0 text-[11px] font-bold text-slate-600 focus:ring-0 outline-none" />
                   </td>`);

  fs.writeFileSync(file, c);
}

patchFile('pages/Compliance/GSTReturn/MonthlyFiling.tsx');
patchFile('pages/Compliance/GSTReturn/QuarterlyFiling.tsx');
patchFile('pages/Compliance/GSTReturn/CompositionFiling.tsx');
patchFile('pages/Compliance/AnnualReturns/GSTR4.tsx');
patchFile('pages/Compliance/AnnualReturns/GSTR9_9C.tsx');

console.log("Patched UIs");
