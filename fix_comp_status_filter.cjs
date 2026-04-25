const fs = require('fs');

let content;

// CompositionFiling.tsx CMP08
content = fs.readFileSync('pages/Compliance/GSTReturn/CompositionFiling.tsx', 'utf8');
if (!content.includes('cmp08Filter')) {
    content = content.replace(/(const \[search,.*\n)/, '$1  const [cmp08Filter, setCmp08Filter] = useState<string>("All");\n  const [isCmp08FilterOpen, setIsCmp08FilterOpen] = useState(false);\n');
    content = content.replace(/return matchesSearch;/, 
    "let matchesCmp = true;\n      if (cmp08Filter === 'Filed') matchesCmp = !!st.cmp08;\n      if (cmp08Filter === 'Pending') matchesCmp = !st.cmp08;\n      return matchesSearch && matchesCmp;");
      
    content = content.replace(/<th className="[^"]*CMP-08[^"]*">CMP-08<\/th>/, 
    '<th className="whitespace-nowrap px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-slate-900 text-center relative">\n' +
    '   <div className="flex items-center justify-center gap-1">CMP-08 <button onClick={() => setIsCmp08FilterOpen(!isCmp08FilterOpen)} className="p-1 hover:bg-slate-200 rounded transition-colors"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg></button></div>\n' +
    '   {isCmp08FilterOpen && (\n' +
    '     <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-[400] p-1 animate-in zoom-in-95 flex flex-col gap-1">\n' +
    '       {[\'All\', \'Filed\', \'Pending\'].map(f => (\n' +
    '          <button key={f} onClick={() => { setCmp08Filter(f); setIsCmp08FilterOpen(false); }} className={`w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg ${cmp08Filter === f ? \'bg-indigo-600 text-white\' : \'hover:bg-slate-50 text-slate-600\'}`}>{f}</button>\n' +
    '       ))}\n' +
    '     </div>\n' +
    '   )}\n' +
    '</th>');
    fs.writeFileSync('pages/Compliance/GSTReturn/CompositionFiling.tsx', content, 'utf8');
}

// GSTR4.tsx Status
content = fs.readFileSync('pages/Compliance/AnnualReturns/GSTR4.tsx', 'utf8');
if (!content.includes('statusFilter')) {
    content = content.replace(/(const \[search,.*\n)/, '$1  const [statusFilter, setStatusFilter] = useState<string>("All");\n  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);\n');
    content = content.replace(/return matchesSearch;/, 
    "let matchesStatus = true;\n      if (statusFilter === 'Filed') matchesStatus = !!st.gstr4;\n      if (statusFilter === 'Pending') matchesStatus = !st.gstr4;\n      return matchesSearch && matchesStatus;");
      
    content = content.replace(/<th className="[^"]*Status[^"]*">Status<\/th>/, 
    '<th className="whitespace-nowrap px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-slate-900 text-center relative">\n' +
    '   <div className="flex items-center justify-center gap-1">Status <button onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)} className="p-1 hover:bg-slate-200 rounded transition-colors"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg></button></div>\n' +
    '   {isStatusFilterOpen && (\n' +
    '     <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-[400] p-1 animate-in zoom-in-95 flex flex-col gap-1">\n' +
    '       {[\'All\', \'Filed\', \'Pending\'].map(f => (\n' +
    '          <button key={f} onClick={() => { setStatusFilter(f); setIsStatusFilterOpen(false); }} className={`w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg ${statusFilter === f ? \'bg-indigo-600 text-white\' : \'hover:bg-slate-50 text-slate-600\'}`}>{f}</button>\n' +
    '       ))}\n' +
    '     </div>\n' +
    '   )}\n' +
    '</th>');
    fs.writeFileSync('pages/Compliance/AnnualReturns/GSTR4.tsx', content, 'utf8');
}

console.log("Compliance Status Filters added.");
