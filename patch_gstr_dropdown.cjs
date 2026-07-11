const fs = require('fs');
const file = 'pages/Compliance/AnnualReturns/GSTR9_9C.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<label className="text-\[10px\] font-black uppercase text-slate-400 mb-2 block tracking-widest">Select Client Entity<\/label>\s*<select[\s\S]*?<\/select>/;

const replacement = `
                    <div className="relative">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block ml-1">Entity Lookup</label>
                       <input 
                         type="text" 
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-100 transition-all uppercase"
                         placeholder="Trade Name or GSTIN..." 
                         value={addSearch || (selectedClient ? (selectedClient.tradeName || selectedClient.legalName) : '')} 
                         onChange={(e) => { 
                            setAddSearch(e.target.value);
                            setSelectedClient(null);
                         }} 
                         onFocus={() => setAddSearch('')}
                       />
                       {addSearch.length > 0 && !selectedClient && (
                         <div className="absolute top-full mt-1 z-50 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto no-scrollbar">
                           {allClients
                             .filter(c => !((watchlist[selectedYear] || []).includes(c.id)))
                             .filter(c => ((c.tradeName || c.legalName || '').toLowerCase().includes(addSearch.toLowerCase()) || (c.gstProfile?.gstin || '').toLowerCase().includes(addSearch.toLowerCase())))
                             .slice(0, 15)
                             .map(c => (
                             <button 
                               key={c.id} 
                               type="button" 
                               onClick={() => {
                                 setSelectedClient(c); 
                                 setAddSearch('');
                                 setIs9CApplicableState(true);
                                 setTurnoverState('');
                               }} 
                               className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-slate-50 last:border-0"
                             >
                               <p className="text-sm font-black text-slate-900 truncate">{c.tradeName || c.legalName}</p>
                               <p className="text-[10px] text-indigo-600 font-mono font-black">{c.gstProfile?.gstin || 'NO GSTIN'}</p>
                             </button>
                           ))}
                         </div>
                       )}
                    </div>`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
console.log("Patched GSTR modal with Dropdown.");
