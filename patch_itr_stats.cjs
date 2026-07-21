const fs = require('fs');
let c = fs.readFileSync('pages/Compliance/ITAudit/ITRReturn.tsx', 'utf8');

c = c.replace(
  /let pending = 0;\s*clients\.forEach\(c => \{\s*if \(getStatus\(c\.id\)\.filed\) filed\+\+;\s*else pending\+\+;\s*\}\);/,
  `let pending = 0;
    let prepared = 0;
    clients.forEach(c => {
      const st = getStatus(c.id);
      if (st.filed) filed++;
      else if (st.prepared) prepared++;
      else pending++;
    });`
);

c = c.replace(
  /return \{ total, filed, pending \};/,
  `return { total, filed, prepared, pending };`
);

c = c.replace(
  /<div className="text-center border-l border-slate-100 pl-6">\s*<p className="text-\[9px\] font-black text-rose-500 uppercase tracking-widest mb-1">Pending<\/p>\s*<p className="text-xl font-black text-rose-600 leading-none">\{stats\.pending\}<\/p>\s*<\/div>/,
  `<div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Prepared</p>
            <p className="text-xl font-black text-amber-600 leading-none">{stats.prepared}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Pending</p>
            <p className="text-xl font-black text-rose-600 leading-none">{stats.pending}</p>
          </div>`
);

fs.writeFileSync('pages/Compliance/ITAudit/ITRReturn.tsx', c);
console.log('patched stats');
