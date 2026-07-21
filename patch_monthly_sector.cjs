const fs = require('fs');

let c = fs.readFileSync('pages/Compliance/GSTReturn/MonthlyFiling.tsx', 'utf8');

c = c.replace(
  /if \(isLoading\) return <Loader \/>;/,
  `const groupedClients = useMemo(() => {
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

  if (isLoading) return <Loader />;`
);

c = c.replace(
  /\{filteredClients\.map\(\(client, idx\) => \{([\s\S]*?)return \([\s\S]*?<tr key=\{client\.id\}[\s\S]*?<\/tr>\s*\)\s*\}\)\}/,
  `{filteredClients.length === 0 ? (
                <tr><td colSpan={15} className="py-32 text-center text-slate-300 font-black uppercase tracking-widest text-sm">No records found</td></tr>
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
$1return (
                  <tr key={client.id} className="hover:bg-indigo-50/10 transition-all border-b border-slate-50 h-[44px]">
                    <td className=" px-4 py-[2px] font-black text-indigo-400 font-mono text-[12px] truncate">{(idx + 1).toString().padStart(2, '0')}</td>
                    <td className=" px-4 py-[2px] truncate max-w-[200px]" title={client.tradeName}>
     <div className="font-black text-slate-900 truncate leading-tight text-[12px]">{client.tradeName || '---'}</div>
     <div className="font-bold text-[9px] text-slate-500 truncate leading-tight" title={client.legalName}>{client.legalName || '---'}</div>
   </td>
   <td className=" px-4 py-[2px] truncate max-w-[150px]">
     <input type="text" value={st.remark || ''} onChange={e => updateRemark(client.id, e.target.value)} placeholder="Add remark..." className="w-full bg-transparent border-none p-0 text-[11px] font-bold text-slate-600 focus:ring-0 outline-none placeholder-slate-300" />
   </td>
                    <td className=" px-4 py-[2px] font-black text-slate-500 text-[12px] truncate">{client.mobile || '---'}</td>
                    <td className=" px-4 py-[2px] font-black font-mono uppercase text-[12px] text-indigo-600">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{client.gstProfile?.gstin}</span>
                        {client.gstProfile?.gstin && (
                          <button onClick={() => (navigator.clipboard.writeText(client.gstProfile?.gstin || '').then(() => { toast.success('GSTIN Copied!'); window.open('https://services.gst.gov.in/services/searchtp', '_blank'); }))} className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0" title="Search Taxpayer">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className=" px-4 py-[2px] text-center">
                       <button onClick={() => toggleStatus(client.id, 'r1')} className={\`h-7 w-12 rounded-lg font-black text-[10px] transition-all border shadow-sm \${st.r1 ? 'bg-emerald-500 border-emerald-600 text-white shadow-emerald-500/20' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}\`}>{st.r1 ? 'FILED' : 'NO'}</button>
                    </td>
                    <td className=" px-4 py-[2px] text-center">
                       <button onClick={() => toggleStatus(client.id, 'r3b')} className={\`h-7 w-12 rounded-lg font-black text-[10px] transition-all border shadow-sm \${st.r3b ? 'bg-emerald-500 border-emerald-600 text-white shadow-emerald-500/20' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}\`}>{st.r3b ? 'FILED' : 'NO'}</button>
                    </td>
                    <td className=" px-4 py-[2px]">
                       <div className="flex items-center gap-2 group/id">
                          <span className="font-black text-slate-600 font-mono tracking-widest text-[12px] truncate max-w-[100px]">{client.gstProfile?.username || '---'}</span>
                          <button onClick={() => { navigator.clipboard.writeText(client.gstProfile?.username || ''); toast.success('ID Copied!'); }} className="h-6 w-6 rounded bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all flex items-center justify-center opacity-0 group-hover/id:opacity-100 shrink-0"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>
                       </div>
                    </td>
                    <td className=" px-4 py-[2px]">
                       {isEditingPass ? (
                          <div className="flex items-center gap-1">
                             <input autoFocus type="text" className="w-20 bg-slate-100 border-none rounded p-1 text-[11px] font-black text-slate-900 outline-none" defaultValue={client.gstProfile?.password} onBlur={e => { handlePassUpdate(client.id, e.target.value); setEditingPasswordId(null); }} onKeyDown={e => { if (e.key === 'Enter') { handlePassUpdate(client.id, e.currentTarget.value); setEditingPasswordId(null); } }} />
                          </div>
                       ) : (
                          <div className="flex items-center gap-2 group/pass cursor-pointer" onDoubleClick={() => setEditingPasswordId(client.id)}>
                             <span className="font-black text-slate-400 font-mono tracking-widest text-[12px] truncate max-w-[100px]">{client.gstProfile?.password || '---'}</span>
                             <button onClick={() => { navigator.clipboard.writeText(client.gstProfile?.password || ''); toast.success('Password Copied!'); }} className="h-6 w-6 rounded bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all flex items-center justify-center opacity-0 group-hover/pass:opacity-100 shrink-0"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>
                          </div>
                       )}
                    </td>
                    <td className=" px-4 py-[2px]">
                       <div className="flex justify-end relative">
                          <button onClick={(e) => {
                             const rect = e.currentTarget.getBoundingClientRect();
                             setMenuPosition({ top: rect.bottom + window.scrollY, left: rect.right - 256 + window.scrollX });
                             setActiveActionsId(activeActionsId === client.id ? null : client.id);
                             setSelectedClient(client);
                          }} className="h-8 w-8 rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center justify-center">
                             <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                          </button>
                       </div>
                    </td>
                  </tr>
                )}
              )}
            </React.Fragment>
          ));
        })()
      )}`
);

fs.writeFileSync('pages/Compliance/GSTReturn/MonthlyFiling.tsx', c);
console.log('Patched MonthlyFiling sector');
