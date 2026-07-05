const fs = require('fs');
const file = 'pages/Compliance/AnnualReturns/GSTR9_9C.tsx';
let content = fs.readFileSync(file, 'utf8');

const statsCode = `  const stats = useMemo(() => {
    let total = 0, filed = 0, pending = 0;
    const currentWatchlist = watchlist[selectedYear] || [];
    const baseClients = allClients.filter(c => {
      if (!c) return false;
      const inWatchlist = currentWatchlist.includes(c.id);
      const visibleNormally = isClientVisibleInFY(c, selectedYear);
      if (!inWatchlist && !visibleNormally) return false;
      return true;
    });
    total = baseClients.length;
    baseClients.forEach(c => {
      // For GSTR9/9C we can just count GSTR-9 filing status as primary indicator of filed/pending for now.
      if (getStatus(c.id).gstr9) filed++;
      else pending++;
    });
    return { total, filed, pending };
  }, [allClients, selectedYear, watchlist, getStatus]);

`;

if (!content.includes('const stats = useMemo')) {
  content = content.replace(
    `const filteredDisplayList = useMemo(() => {`,
    statsCode + `  const filteredDisplayList = useMemo(() => {`
  );
}

content = content.replace(
    /return \(\n    <div className="flex flex-col h-full space-y-4 px-2 animate-in fade-in duration-500">\n      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-\[1\.5rem\] border border-slate-200 shadow-sm shrink-0">\n/,
    `return (
    <div className="flex flex-col h-full space-y-4 px-2 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">GSTR-9/9C Total</p>
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
        </div>
`
);

fs.writeFileSync(file, content);
console.log('patched GSTR9');
