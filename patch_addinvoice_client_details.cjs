const fs = require('fs');
const file = 'pages/Administration/invoice/addinvoice.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldClientCard = `              {clientLegalName && (
                 <div className="mt-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-top-4">
                    <div className="flex-1">
                       <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">Billed To</p>
                       <p className="text-sm font-black text-slate-900 uppercase">{clientLegalName}</p>{clientTradeName && <p className="text-xs font-bold text-slate-500 uppercase mt-0.5">{clientTradeName}</p>}
                       {clientAddress && <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase leading-relaxed">{clientAddress}</p>}
                    </div>
                    <div className="flex flex-col gap-3 min-w-full">
                       <div>
                          <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">GSTIN / PAN</p>
                          <p className="text-xs font-mono font-bold text-slate-700 uppercase">{clientGstin || 'N/A'}</p>
                       </div>
                       <div>
                          <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">Contact</p>
                          <p className="text-xs font-bold text-slate-700 uppercase">{clientMobile || 'N/A'}</p>
                       </div>
                    </div>
                 </div>
              )}`;

const newClientCard = `              {clientLegalName && (
                 <div className="mt-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                          <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">Billed To (Legal Name)</p>
                          <input type="text" value={clientLegalName} onChange={e => setClientLegalName(e.target.value)} className="w-full bg-white border border-indigo-100 rounded-xl p-2.5 text-xs font-black text-slate-900 uppercase outline-none focus:ring-2 focus:ring-indigo-200" />
                       </div>
                       <div>
                          <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">Trade Name</p>
                          <input type="text" value={clientTradeName} onChange={e => setClientTradeName(e.target.value)} className="w-full bg-white border border-indigo-100 rounded-xl p-2.5 text-xs font-black text-slate-900 uppercase outline-none focus:ring-2 focus:ring-indigo-200" placeholder="Optional" />
                       </div>
                       <div>
                          <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">GSTIN / PAN</p>
                          <input type="text" value={clientGstin} onChange={e => setClientGstin(e.target.value)} className="w-full bg-white border border-indigo-100 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 uppercase outline-none focus:ring-2 focus:ring-indigo-200" placeholder="Optional" />
                       </div>
                       <div>
                          <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">Contact (Mobile)</p>
                          <input type="text" value={clientMobile} onChange={e => setClientMobile(e.target.value)} className="w-full bg-white border border-indigo-100 rounded-xl p-2.5 text-xs font-bold text-slate-900 uppercase outline-none focus:ring-2 focus:ring-indigo-200" placeholder="Optional" />
                       </div>
                       <div className="md:col-span-2">
                          <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">Address of Entity</p>
                          <textarea value={clientAddress} onChange={e => setClientAddress(e.target.value)} className="w-full bg-white border border-indigo-100 rounded-xl p-2.5 text-xs font-medium text-slate-900 uppercase outline-none focus:ring-2 focus:ring-indigo-200 min-h-[60px]" placeholder="Address..."></textarea>
                       </div>
                    </div>
                 </div>
              )}`;

content = content.replace(oldClientCard, newClientCard);

// Let's also add a "Create Misc Client" button if searchQuery doesn't match
const oldSearchDropdown = `              {isDropdownOpen && filteredClients.length > 0 && (
                <div className="absolute top-full mt-1 z-50 left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 overflow-hidden max-h-60 overflow-y-auto no-scrollbar">
                  {filteredClients.map(c => (
                    <button key={c.id} onClick={() => handleClientSelect(c)} className="w-full text-left px-4 py-3 hover:bg-indigo-50 rounded-xl transition-all group border-b border-slate-100 last:border-none">
                      <p className="text-xs font-black text-slate-900 group-hover:text-indigo-700">{c.legalName} {c.tradeName ? \`(\${c.tradeName})\` : ''}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">ID: {c.gstProfile?.gstin || c.itProfile?.pan || 'NO ID'}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Mob: {c.mobile || 'N/A'}</p>
                      {c.address && <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{c.address}</p>}
                    </button>
                  ))}
                </div>
              )}`;

const newSearchDropdown = `              {isDropdownOpen && (
                <div className="absolute top-full mt-1 z-50 left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 overflow-hidden max-h-60 overflow-y-auto no-scrollbar">
                  {filteredClients.map(c => (
                    <button key={c.id} onClick={() => handleClientSelect(c)} className="w-full text-left px-4 py-3 hover:bg-indigo-50 rounded-xl transition-all group border-b border-slate-100 last:border-none">
                      <p className="text-xs font-black text-slate-900 group-hover:text-indigo-700">{c.legalName} {c.tradeName ? \`(\${c.tradeName})\` : ''}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">ID: {c.gstProfile?.gstin || c.itProfile?.pan || 'NO ID'}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Mob: {c.mobile || 'N/A'}</p>
                      {c.address && <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{c.address}</p>}
                    </button>
                  ))}
                  {searchQuery && (
                    <button onClick={() => {
                        setIsMiscClient(true);
                        setClientLegalName(searchQuery);
                        setClientTradeName('');
                        setClientGstin('');
                        setClientMobile('');
                        setClientAddress('');
                        setIsDropdownOpen(false);
                    }} className="w-full text-left px-4 py-3 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all group mt-2">
                       <p className="text-xs font-black text-indigo-700 group-hover:text-indigo-900">+ Add Manual Client: {searchQuery}</p>
                    </button>
                  )}
                </div>
              )}`;

content = content.replace(oldSearchDropdown, newSearchDropdown);

fs.writeFileSync(file, content);
console.log("Patched addinvoice.tsx editable client card and misc client button.");
