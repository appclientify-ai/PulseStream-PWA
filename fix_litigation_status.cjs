const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Add state if missing and if Status is present
            if (content.includes('<th>Status</th>') || content.includes('>Status</th>')) {
                if (!content.includes('statusFilter')) {
                    content = content.replace(
                        /const \[search, setSearch\] = useState\(''\);/,
                        `const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');`
                    );
                    modified = true;
                }
                
                if (content.includes('setActiveHeaderFilter')) {
                    content = content.replace(
                        /<th(.*?)>Status<\/th>/,
                        `<th$1>
                  <div className="flex items-center justify-center gap-1">Status <button onClick={() => setActiveHeaderFilter(activeHeaderFilter === 'status' ? null : 'status')} className="p-1 rounded shadow-sm"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg></button></div>
                  {activeHeaderFilter === 'status' && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-[400] p-1 animate-in zoom-in-95">
                      {['All', 'Pending', 'Filed', 'Demand', 'Drop', 'Overdue', 'Closed'].map(opt => <button key={opt} onClick={() => { setStatusFilter(opt); setActiveHeaderFilter(null); }} className={\`w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg \${statusFilter === opt ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}\`}>{opt}</button>)}
                    </div>
                  )}
                </th>`
                    );

                    // Modify filteredRecords logic
                    if (content.includes('const filteredRecords = useMemo')) {
                        content = content.replace(
                            /return matchesSearch( && matchesSection)?( && matchesDays)?;/g,
                            `let matchStatus = true;
      if (statusFilter !== 'All') {
        const dl = getDaysLeft(rec.dueDate);
        const autoStat = dl < 0 ? 'Overdue' : 'Pending';
        if (statusFilter === 'Overdue' && autoStat !== 'Overdue') matchStatus = false;
        else if (statusFilter === 'Pending' && autoStat !== 'Pending') matchStatus = false;
        // if the status is exactly what's recorded
        else if (statusFilter !== 'Overdue' && statusFilter !== 'Pending' && rec.status !== statusFilter) matchStatus = false;
      }
      return matchesSearch$1$2 && matchStatus;`
                        );
                    }
                    modified = true;
                }
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Modified', fullPath);
            }
        }
    }
}

processDir('pages/LitigationSuite');
console.log("Litigation Status filters fixed.");
