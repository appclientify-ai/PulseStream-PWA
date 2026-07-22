const fs = require('fs');

let c = fs.readFileSync('pages/Compliance/GSTReturn/MonthlyFiling.tsx', 'utf8');

// 1. Headers: Move Remark after Password
c = c.replace(/<th className=" px-4 py-3 text-\[12px\] font-bold uppercase tracking-widest text-slate-900">Remark<\/th>/, '');
c = c.replace(/(<th className=" px-4 py-3 text-\[12px\] font-bold uppercase tracking-widest text-slate-900">Password<\/th>)/, '$1\n                <th className=" px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-slate-900">Remark</th>');

// 2. Export headers CSV and PDF
c = c.replace(/const headers = \['S\.No\.', 'Trade Name', 'Remark', /g, "const headers = ['S.No.', 'Trade Name', ");
c = c.replace(/'User ID', 'Password'\];/g, "'User ID', 'Password', 'Remark'];");

// 3. Export rows CSV
c = c.replace(/client\.tradeName,\s*getStatus\(client\.id\)\.remark \|\| '---',/g, 'client.tradeName,');
c = c.replace(/client\.gstProfile\?\.password\s*\];/g, "client.gstProfile?.password,\n      getStatus(client.id).remark || '---'\n    ];");

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

c = c.replace(/<\/tr>\s*\);\s*\}\)\}/, `</tr>\n                );\n              })}\n              </React.Fragment>\n            ))}`);

// 6. Move Remark TD to after Password TD (which is near the end, before Action)
// The existing remark cell:
const remarkTd = `<td className=" px-4 py-[2px] truncate max-w-[150px]">
     <input type="text" value={status.remark || ''} onChange={e => updateRemark(client.id, e.target.value)} placeholder="Add remark..." className="w-full bg-transparent border-none p-0 text-[11px] font-bold text-slate-600 focus:ring-0 outline-none placeholder-slate-300" />
   </td>`;
c = c.replace(remarkTd, '');

const passwordTd = `<td className=" px-4 py-[2px] font-black text-slate-500 font-mono text-[12px] min-w-[100px]">
                       {client.gstProfile?.password ? (
                          <div className="flex items-center gap-2 group/pass">
                             {isEditingPass ? (
                               <input autoFocus type="text" defaultValue={client.gstProfile.password} onBlur={e => handleUpdatePassword(client.id, e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUpdatePassword(client.id, e.currentTarget.value)} className="w-full bg-slate-100 border-none p-1 rounded text-[11px] font-bold text-slate-900 outline-none" />
                             ) : (
                               <>
                                 <span className="truncate">{isPassVisible ? client.gstProfile.password : '••••••••'}</span>
                                 <div className="flex opacity-0 group-hover/pass:opacity-100 transition-opacity gap-1">
                                    <button onClick={() => isPassVisible ? visiblePasswords.delete(client.id) : visiblePasswords.add(client.id)} className="p-1 hover:text-indigo-600">
                                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={isPassVisible ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} /></svg>                                    </button>
                                    <button onClick={() => setEditingPasswordId(client.id)} className="p-1 hover:text-indigo-600">
                                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                 </div>
                               </>
                             )}
                          </div>
                       ) : '---'}
                    </td>`;
                    
c = c.replace(passwordTd, passwordTd + '\n' + `<td className=" px-4 py-[2px] truncate max-w-[150px]">
     <input type="text" value={st.remark || ''} onChange={e => updateRemark(client.id, e.target.value)} placeholder="Add remark..." className="w-full bg-transparent border-none p-0 text-[11px] font-bold text-slate-600 focus:ring-0 outline-none placeholder-slate-300" />
   </td>`);

fs.writeFileSync('pages/Compliance/GSTReturn/MonthlyFiling.tsx', c);
