const fs = require('fs');

function patchFilingPage(file) {
  let c = fs.readFileSync(file, 'utf8');

  // 1. Headers: Move Remark after Password (if Password exists in headers, otherwise at end before Action)
  c = c.replace(/<th className=" px-4 py-3 text-\[12px\] font-bold uppercase tracking-widest text-slate-900">Remark<\/th>/, '');
  if (c.includes('Password</th>')) {
    c = c.replace(/(<th className=" px-4 py-3 text-\[12px\] font-bold uppercase tracking-widest text-slate-900">Password<\/th>)/, '$1\n                <th className=" px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-slate-900">Remark</th>');
  } else {
    // Annual returns might just have User ID, Password in some, or maybe not.
    // If it has Action, put it before Action.
    if (c.includes('Action</th>')) {
      c = c.replace(/(<th className=" px-4 py-3 text-\[12px\] font-bold uppercase tracking-widest text-slate-900 text-right">Action<\/th>)/, '<th className=" px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-slate-900">Remark</th>\n                $1');
    } else {
       // Just append it before the end of the tr
       c = c.replace(/(<\/tr>\s*<\/thead>)/, '                <th className=" px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-slate-900">Remark</th>\n              $1');
    }
  }

  // 2. Export headers CSV and PDF
  c = c.replace(/const headers = \['S\.No\.', 'Trade Name', 'Remark', /g, "const headers = ['S.No.', 'Trade Name', ");
  c = c.replace(/const headers = \["ID", "Trader", "Remark", /g, 'const headers = ["ID", "Trader", ');

  if (file.includes('GSTR4') || file.includes('GSTR9')) {
    // E.g. ["ID", "Trader", "GSTIN", "Status", "User ID", "Password"]
    c = c.replace(/\]\.join\(\","\);/g, ', "Remark"].join(",");');
    c = c.replace(/(const headers = \["ID", "Trader", "GSTIN", "Status"\];)/g, '$1\n    headers.push("Remark");');
    c = c.replace(/(const headers = \["ID", "Trader", "GSTIN", "GSTR-9", "GSTR-9C"\];)/g, '$1\n    headers.push("Remark");');
  } else {
    c = c.replace(/'User ID', 'Password'\];/g, "'User ID', 'Password', 'Remark'];");
  }

  // 3. Export rows CSV
  // Remove remark from the second position
  if (file.includes('GSTR4') || file.includes('GSTR9')) {
    // client.tradeName, getStatus(client.id).remark || '---',
    c = c.replace(/client\.tradeName,\s*getStatus\(client\.id\)\.remark \|\| '---',/g, 'client.tradeName,');
    
    if (file.includes('GSTR4')) {
        // Need to add remark at the end of the array
        c = c.replace(/(c\.gstProfile\?\.password \|\| '---'\s*\];)/g, "c.gstProfile?.password || '---',\n        getStatus(c.id).remark || '---'\n      ];");
        c = c.replace(/(s\.filed \? 'Filed' : 'Pending'\s*\];)/g, "s.filed ? 'Filed' : 'Pending',\n        getStatus(c.id).remark || '---'\n      ];");
    } else if (file.includes('GSTR9')) {
        c = c.replace(/(c\.gstProfile\?\.password \|\| '---'\s*\];)/g, "c.gstProfile?.password || '---',\n        getStatus(c.id).remark || '---'\n      ];");
        c = c.replace(/(s\.gstr9c \? 'Filed' : 'Pending'\s*\];)/g, "s.gstr9c ? 'Filed' : 'Pending',\n        getStatus(c.id).remark || '---'\n      ];");
    }
  } else {
    c = c.replace(/client\.tradeName,\s*getStatus\(client\.id\)\.remark \|\| '---',/g, 'client.tradeName,');
    c = c.replace(/client\.gstProfile\?\.password\s*\];/g, "client.gstProfile?.password,\n      getStatus(client.id).remark || '---'\n    ];");
  }

  // 4. Grouping logic
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

  const handleExportCSV`;
  c = c.replace(/const handleExportCSV/, groupingLogic);

  // 5. Replace the map logic
  c = c.replace(/\{filteredClients\.map\(\(client, idx\) => \{/, 
  `{groupedClients.map(({ sector, clients: sectorClients }) => (
                <React.Fragment key={sector}>
                  <tr>
                    <td colSpan={12} className="bg-slate-100 font-bold text-slate-700 py-2 px-4 uppercase text-[10px] tracking-widest">{sector}</td>
                  </tr>
                  {sectorClients.map((client, idx) => {`);

  c = c.replace(/<\/tr>\s*\);\s*\}\)\}/, `</tr>\n                  );\n                })}\n                </React.Fragment>\n              ))}`);

  // 6. Move Remark TD to the correct position (after password)
  const remarkTd = `<td className=" px-4 py-[2px] truncate max-w-[150px]">
     <input type="text" value={status.remark || ''} onChange={e => updateRemark(client.id, e.target.value)} placeholder="Add remark..." className="w-full bg-transparent border-none p-0 text-[11px] font-bold text-slate-600 focus:ring-0 outline-none placeholder-slate-300" />
   </td>`;
  c = c.replace(remarkTd, '');

  if (file.includes('Quarterly') || file.includes('Composition')) {
     const passwordTd = `                       ) : '---'}
                    </td>`;
     c = c.replace(passwordTd, passwordTd + '\n' + `                    <td className=" px-4 py-[2px] truncate max-w-[150px]">
                       <input type="text" value={st.remark || ''} onChange={e => updateRemark(client.id, e.target.value)} placeholder="Add remark..." className="w-full bg-transparent border-none p-0 text-[11px] font-bold text-slate-600 focus:ring-0 outline-none placeholder-slate-300" />
                     </td>`);
  } else {
     // GSTR4, GSTR9_9C might not have 'st.remark' they use 'status.remark' inside the map loop, wait.
     const targetString = file.includes('GSTR9') 
        ? `                       ) : '---'}
                    </td>`
        : `                       ) : '---'}
                    </td>`;

     c = c.replace(targetString, targetString + '\n' + `                    <td className=" px-4 py-[2px] truncate max-w-[150px]">
                       <input type="text" value={status.remark || ''} onChange={e => updateRemark(client.id, e.target.value)} placeholder="Add remark..." className="w-full bg-transparent border-none p-0 text-[11px] font-bold text-slate-600 focus:ring-0 outline-none placeholder-slate-300" />
                     </td>`);
  }

  fs.writeFileSync(file, c);
}

patchFilingPage('pages/Compliance/GSTReturn/QuarterlyFiling.tsx');
patchFilingPage('pages/Compliance/GSTReturn/CompositionFiling.tsx');
patchFilingPage('pages/Compliance/AnnualReturns/GSTR4.tsx');
patchFilingPage('pages/Compliance/AnnualReturns/GSTR9_9C.tsx');
console.log('patched others');
