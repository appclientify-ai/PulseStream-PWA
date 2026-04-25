const fs = require('fs');
const path = require('path');

const litigationFiles = [
    'pages/LitigationSuite/GSTAppeals/AppealPending.tsx',
    'pages/LitigationSuite/HighCourt/CourtPending.tsx',
    'pages/LitigationSuite/Tribunal/TribunalPending.tsx'
];

for (const file of litigationFiles) {
    let content = fs.readFileSync(file, 'utf8');
    
    if (!content.includes('activeHeaderFilter')) {
        content = content.replace(/(const \[search,.*\n)/, '$1  const [activeHeaderFilter, setActiveHeaderFilter] = useState<string | null>(null);\n  const [statusFilter, setStatusFilter] = useState<string>("All");\n');
    }
    
    if (content.includes('const filteredRecords = records.filter(r =>')) {
        content = content.replace(/const filteredRecords = records.filter\(r => \{([\s\S]*?)return matchesSearch;/, 
        "const filteredRecords = records.filter(r => {\n      $1\n      let matchesStatus = true;\n      if (statusFilter === 'Overdue') matchesStatus = new Date(r.dueDate || '').getTime() < new Date().getTime();\n      return matchesSearch && matchesStatus;");
    }

    const filterBlock = 
                 '<th className="whitespace-nowrap px-6 py-5 text-[11px] font-black uppercase tracking-widest text-center w-[130px] relative">\n' +
                 '  <div className="flex items-center justify-center gap-1">Status <button onClick={() => setActiveHeaderFilter(activeHeaderFilter === \'status\' ? null : \'status\')} className="p-1 rounded shadow-sm"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg></button></div>\n' +
                 '  {activeHeaderFilter === \'status\' && (\n' +
                 '    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-[400] p-1 animate-in zoom-in-95 flex flex-col gap-1">\n' +
                 '      {[\'All\', \'Overdue\', \'Pending\'].map(f => (\n' +
                 '         <button key={f} onClick={() => { setStatusFilter(f); setActiveHeaderFilter(null); }} className={`w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg ${statusFilter === f ? \'bg-indigo-600 text-white\' : \'hover:bg-slate-50 text-slate-600\'}`}>{f}</button>\n' +
                 '      ))}\n' +
                 '    </div>\n' +
                 '  )}\n' +
                 '</th>';
                 
    content = content.replace(/<th className="[^"]*Status[^"]*">Status<\/th>/, filterBlock);
    fs.writeFileSync(file, content, 'utf8');
}

console.log("Litigation Status Filters added.");
