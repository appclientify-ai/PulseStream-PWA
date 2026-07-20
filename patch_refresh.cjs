const fs = require('fs');

function patch(file) {
  let c = fs.readFileSync(file, 'utf8');
  
  if (c.includes('Syncing...')) return; // already patched?
  
  // Add a refresh button near the title/header
  c = c.replace(/className="text-4xl font-black text-slate-900 truncate">/, 
    `className="text-4xl font-black text-slate-900 truncate flex items-center gap-3">
                    <button onClick={() => window.dispatchEvent(new CustomEvent('clientify_db_change'))} className="h-8 w-8 rounded-full bg-slate-100 hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 flex items-center justify-center transition-colors" title="Force Sync">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                    <span>`
  );
  
  c = c.replace(/Filing<\/h1>/, `Filing</span></h1>`);

  fs.writeFileSync(file, c);
}

patch('pages/Compliance/GSTReturn/MonthlyFiling.tsx');
patch('pages/Compliance/GSTReturn/QuarterlyFiling.tsx');
patch('pages/Compliance/GSTReturn/CompositionFiling.tsx');
