const fs = require('fs');
const file = 'pages/Administration/invoice/addinvoice.tsx';
let content = fs.readFileSync(file, 'utf8');

// Patch handleClientSelect
content = content.replace("setClientAddress(c.gstProfile?.address || '');", "setClientAddress(c.address || '');");

// Patch dropdown UI
const oldDropdown = `{filteredClients.map(c => (
                    <button key={c.id} onClick={() => handleClientSelect(c)} className="w-full text-left px-4 py-3 hover:bg-indigo-50 rounded-xl transition-all group">
                      <p className="text-xs font-black text-slate-900 group-hover:text-indigo-700">{c.legalName}</p>
                      <p className="text-[10px] text-slate-400 font-mono uppercase">{c.gstProfile?.gstin || c.itProfile?.pan || 'NO ID'}</p>
                    </button>
                  ))}`;

const newDropdown = `{filteredClients.map(c => (
                    <button key={c.id} onClick={() => handleClientSelect(c)} className="w-full text-left px-4 py-3 hover:bg-indigo-50 rounded-xl transition-all group border-b border-slate-100 last:border-none">
                      <p className="text-xs font-black text-slate-900 group-hover:text-indigo-700">{c.legalName} {c.tradeName ? \`(\${c.tradeName})\` : ''}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">ID: {c.gstProfile?.gstin || c.itProfile?.pan || 'NO ID'}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Mob: {c.mobile || 'N/A'}</p>
                      {c.address && <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{c.address}</p>}
                    </button>
                  ))}`;
                  
if (content.includes("text-[10px] text-slate-400 font-mono uppercase")) {
  content = content.replace(oldDropdown, newDropdown);
}

// Patch handleSave duplicate check
const saveStart = `const handleSave = async () => {
    if (!clientLegalName.trim() || !invoiceNo.trim()) return;`;

const newSaveStart = `const handleSave = async () => {
    if (!clientLegalName.trim() || !invoiceNo.trim()) return;

    const allInvs = await api.getInvoices();
    if (allInvs.some(i => i.invoiceNo.toLowerCase() === invoiceNo.toLowerCase() && i.id !== editingInvoice?.id)) {
      toast.error('Invoice Number already exists! Please use a unique number.');
      return;
    }`;

content = content.replace(saveStart, newSaveStart);

fs.writeFileSync(file, content);
console.log("Patched addinvoice.tsx");
