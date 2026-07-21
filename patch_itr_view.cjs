const fs = require('fs');
let c = fs.readFileSync('pages/Compliance/ITAudit/ITRReturn.tsx', 'utf8');

c = c.replace(
  /const \[statusFilter, setStatusFilter\] = useState<'All' \| 'Filed' \| 'Pending'>\('All'\);/,
  `const [statusFilter, setStatusFilter] = useState<'All' | 'Filed' | 'Prepared' | 'Pending'>('All');`
);

c = c.replace(
  /if \(statusFilter !== 'All'\) \{\s*list = list\.filter\(c => statusFilter === 'Filed' \? getStatus\(c\.id\)\.filed : !getStatus\(c\.id\)\.filed\);\s*\}/,
  `if (statusFilter !== 'All') {
      list = list.filter(c => {
         const st = getStatus(c.id);
         if (statusFilter === 'Filed') return st.filed;
         if (statusFilter === 'Prepared') return st.prepared && !st.filed;
         if (statusFilter === 'Pending') return !st.filed && !st.prepared;
         return true;
      });
    }`
);

c = c.replace(
  /s\.filed \? 'Filed' : 'Pending',/g,
  `s.filed ? 'Filed' : (s.prepared ? 'Prepared' : 'Pending'),`
);

c = c.replace(
  /\{\['All', 'Filed', 'Pending'\]\.map\(f => <button key=\{f\} onClick=\{\(\) => setStatusFilter\(f as any\)\} className=\{`w-full text-left px-3 py-2 text-\[10px\] font-black uppercase rounded-lg \$\{statusFilter === f \? 'bg-indigo-600 text-white' : 'hover:bg-slate-50'\}`\}\>\{f\}\<\/button\>\)\}/,
  `{['All', 'Filed', 'Prepared', 'Pending'].map(f => <button key={f} onClick={() => setStatusFilter(f as any)} className={\`w-full text-left px-3 py-2 text-[10px] font-black uppercase rounded-lg \${statusFilter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50'}\`}>{f}</button>)}`
);

c = c.replace(
  /<button onClick=\{\(\) => toggleStatus\(client\.id\)\} className=\{`px-3 py-1 rounded-full text-\[9px\] font-black uppercase border \$\{status\.filed \? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'\}`\}>\{status\.filed \? 'Filed' : 'Pending'\}<\/button>/g,
  `<button onClick={() => toggleStatus(client.id)} className={\`px-3 py-1 rounded-full text-[9px] font-black uppercase border \${status.filed ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : (status.prepared ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-400 border-slate-200')}\`}>{status.filed ? 'Filed' : (status.prepared ? 'Prepared' : 'Pending')}</button>`
);

fs.writeFileSync('pages/Compliance/ITAudit/ITRReturn.tsx', c);
console.log('patched view');
