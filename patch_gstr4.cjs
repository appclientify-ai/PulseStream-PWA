const fs = require('fs');
const file = 'pages/Compliance/AnnualReturns/GSTR4.tsx';
let content = fs.readFileSync(file, 'utf8');

const statsCode = `  const stats = useMemo(() => {
    let total = 0, filed = 0, pending = 0;
    const baseClients = clients.filter(c => isClientVisibleInFY(c, selectedYear));
    total = baseClients.length;
    baseClients.forEach(c => {
      if (getStatus(c.id).filed) filed++;
      else pending++;
    });
    return { total, filed, pending };
  }, [clients, selectedYear, getStatus]);

`;

if (!content.includes('const stats = useMemo')) {
  content = content.replace(
    `const filteredClients = useMemo(() => {`,
    statsCode + `  const filteredClients = useMemo(() => {`
  );
}

content = content.replace(
    /<div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">[\s\S]*?<\/div>/,
    `<div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">GSTR-4 Total</p>
            <p className="text-xl font-black text-slate-900 leading-none">{stats.total}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">Filed</p>
            <p className="text-xl font-black text-indigo-600 leading-none">{stats.filed}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Pending</p>
            <p className="text-xl font-black text-rose-600 leading-none">{stats.pending}</p>
          </div>
        </div>`
);

fs.writeFileSync(file, content);
console.log('patched GSTR4');
