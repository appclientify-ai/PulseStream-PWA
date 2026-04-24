const fs = require('fs');

const fixFilters = () => {
    // -------------------------------------------------------------------------
    // 1. QuarterlyFiling.tsx
    // -------------------------------------------------------------------------
    let qFile = 'pages/Compliance/GSTReturn/QuarterlyFiling.tsx';
    if (fs.existsSync(qFile)) {
        let qContent = fs.readFileSync(qFile, 'utf8');

        // Add states if missing
        if (!qContent.includes('r1Filter')) {
            qContent = qContent.replace(
                /const \[search, setSearch\] = useState\(''\);/,
                `const [search, setSearch] = useState('');
  const [r1Filter, setR1Filter] = useState<'All' | 'Filed' | 'Pending'>('All');
  const [r3bFilter, setR3bFilter] = useState<'All' | 'Filed' | 'Pending'>('All');
  const [isR1FilterOpen, setIsR1FilterOpen] = useState(false);
  const [isR3bFilterOpen, setIsR3bFilterOpen] = useState(false);`
            );
        }

        // Apply logic to filteredClients
        if (qContent.includes('const filteredClients = useMemo')) {
            qContent = qContent.replace(
                /const filteredClients = useMemo\(\(\) => \{[\s\S]*?return clients\.filter\(c => \{[\s\S]*?\}\);[\s\S]*?\}, \[clients, search\]\);/,
                `const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const q = search.toLowerCase();
      const matchesSearch = c.tradeName?.toLowerCase().includes(q) || 
                            c.legalName?.toLowerCase().includes(q) || 
                            c.gstProfile?.gstin?.toLowerCase().includes(q) || 
                            c.mobile?.includes(q);
      if (!matchesSearch) return false;
      const st = getStatus(c.id);
      if (r1Filter === 'Filed' && !st.r1) return false;
      if (r1Filter === 'Pending' && st.r1) return false;
      if (r3bFilter === 'Filed' && !st.r3b) return false;
      if (r3bFilter === 'Pending' && st.r3b) return false;
      return true;
    });
  }, [clients, search, getStatus, r1Filter, r3bFilter]);`
            );
        }

        // Replace headers for GSTR-1 and GSTR-3B (or GSTR-1/IFF)
        qContent = qContent.replace(
            /<th.*?>IFF \/ GSTR-1<\/th>/,
            `<th className="whitespace-nowrap px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-slate-900 text-center relative">
                   <div className="flex items-center justify-center gap-1">IFF / GSTR-1 <button onClick={() => setIsR1FilterOpen(!isR1FilterOpen)} className="p-1 hover:bg-slate-200 rounded transition-colors"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg></button></div>
                   {isR1FilterOpen && <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-[400] p-1 animate-in zoom-in-95">{['All', 'Filed', 'Pending'].map(f => <button key={f} onClick={() => { setR1Filter(f as any); setIsR1FilterOpen(false); }} className={\`w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg \${r1Filter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}\`}>{f}</button>)}</div>}
            </th>`
        );
        qContent = qContent.replace(
            /<th.*?>GSTR-3B<\/th>/,
            `<th className="whitespace-nowrap px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-slate-900 text-center relative">
                   <div className="flex items-center justify-center gap-1">GSTR-3B <button onClick={() => setIsR3bFilterOpen(!isR3bFilterOpen)} className="p-1 hover:bg-slate-200 rounded transition-colors"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg></button></div>
                   {isR3bFilterOpen && <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-[400] p-1 animate-in zoom-in-95">{['All', 'Filed', 'Pending'].map(f => <button key={f} onClick={() => { setR3bFilter(f as any); setIsR3bFilterOpen(false); }} className={\`w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg \${r3bFilter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}\`}>{f}</button>)}</div>}
            </th>`
        );
        fs.writeFileSync(qFile, qContent, 'utf8');
    }

    // -------------------------------------------------------------------------
    // 2. CompositionFiling.tsx
    // -------------------------------------------------------------------------
    let cFile = 'pages/Compliance/GSTReturn/CompositionFiling.tsx';
    if (fs.existsSync(cFile)) {
        let cContent = fs.readFileSync(cFile, 'utf8');

        if (!cContent.includes('cmp08Filter')) {
            cContent = cContent.replace(
                /const \[search, setSearch\] = useState\(''\);/,
                `const [search, setSearch] = useState('');
  const [cmp08Filter, setCmp08Filter] = useState<'All' | 'Filed' | 'Pending'>('All');
  const [isCmp08FilterOpen, setIsCmp08FilterOpen] = useState(false);`
            );
        }

        if (cContent.includes('const filteredClients = useMemo')) {
            cContent = cContent.replace(
                /const filteredClients = useMemo\(\(\) => \{[\s\S]*?return clients\.filter\(c => \{[\s\S]*?\}\);[\s\S]*?\}, \[clients, search\]\);/,
                `const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const q = search.toLowerCase();
      const matchesSearch = c.tradeName?.toLowerCase().includes(q) || 
                            c.legalName?.toLowerCase().includes(q) || 
                            c.gstProfile?.gstin?.toLowerCase().includes(q) || 
                            c.mobile?.includes(q);
      if (!matchesSearch) return false;
      const st = getStatus(c.id);
      if (cmp08Filter === 'Filed' && !st.cmp08) return false;
      if (cmp08Filter === 'Pending' && st.cmp08) return false;
      return true;
    });
  }, [clients, search, getStatus, cmp08Filter]);`
            );
        }

        cContent = cContent.replace(
            /<th.*?>CMP-08<\/th>/,
            `<th className="whitespace-nowrap px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-slate-900 text-center relative">
                   <div className="flex items-center justify-center gap-1">CMP-08 <button onClick={() => setIsCmp08FilterOpen(!isCmp08FilterOpen)} className="p-1 hover:bg-slate-200 rounded transition-colors"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg></button></div>
                   {isCmp08FilterOpen && <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-[400] p-1 animate-in zoom-in-95">{['All', 'Filed', 'Pending'].map(f => <button key={f} onClick={() => { setCmp08Filter(f as any); setIsCmp08FilterOpen(false); }} className={\`w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg \${cmp08Filter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}\`}>{f}</button>)}</div>}
            </th>`
        );
        fs.writeFileSync(cFile, cContent, 'utf8');
    }

    // -------------------------------------------------------------------------
    // 3. GSTR4.tsx
    // -------------------------------------------------------------------------
    let g4File = 'pages/Compliance/AnnualReturns/GSTR4.tsx';
    if (fs.existsSync(g4File)) {
        let content = fs.readFileSync(g4File, 'utf8');

        if (!content.includes('statusFilter')) {
            content = content.replace(
                /const \[search, setSearch\] = useState\(''\);/,
                `const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Filed' | 'Pending'>('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);`
            );
        }

        if (content.includes('const filteredClients = useMemo')) {
            content = content.replace(
                /const filteredClients = useMemo\(\(\) => \{[\s\S]*?return clients\.filter\(c => \{[\s\S]*?\}\);[\s\S]*?\}, \[clients, search\]\);/,
                `const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const q = search.toLowerCase();
      const matchesSearch = c.tradeName?.toLowerCase().includes(q) || 
                            c.legalName?.toLowerCase().includes(q) || 
                            c.gstProfile?.gstin?.toLowerCase().includes(q) || 
                            c.mobile?.includes(q);
      if (!matchesSearch) return false;
      const st = getStatus(c.id);
      if (statusFilter === 'Filed' && !st.filed) return false;
      if (statusFilter === 'Pending' && st.filed) return false;
      return true;
    });
  }, [clients, search, getStatus, statusFilter]);`
            );
        }

        content = content.replace(
            /<th.*?>Status<\/th>/,
            `<th className="whitespace-nowrap px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-slate-900 text-center relative w-32">
                   <div className="flex items-center justify-center gap-1">Status <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="p-1 hover:bg-slate-200 rounded transition-colors"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg></button></div>
                   {isFilterOpen && <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-[400] p-1 animate-in zoom-in-95">{['All', 'Filed', 'Pending'].map(f => <button key={f} onClick={() => { setStatusFilter(f as any); setIsFilterOpen(false); }} className={\`w-full text-left px-3 py-2 text-[9px] font-black uppercase rounded-lg \${statusFilter === f ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}\`}>{f}</button>)}</div>}
            </th>`
        );
        fs.writeFileSync(g4File, content, 'utf8');
    }
};

fixFilters();
console.log("Filters fixed.");
