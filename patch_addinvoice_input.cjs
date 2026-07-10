const fs = require('fs');
const file = 'pages/Administration/invoice/addinvoice.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Duplicate check update
const oldCheck = `    if (!editingInvoice) {
       const allInvs = await api.getInvoices();
       if (allInvs.some(i => i.invoiceNo === invoiceNo)) {
          return toast.error('Invoice number already exists. Please refresh or use another number.');
       }
    }`;

const newCheck = `    const allInvs = await api.getInvoices();
    if (allInvs.some(i => i.invoiceNo === invoiceNo && i.id !== editingInvoice?.id)) {
       return toast.error('Invoice number already exists. Please use another number.');
    }`;
content = content.replace(oldCheck, newCheck);

// 2. Add input field for invoiceNo
const oldTitle = `            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{editingInvoice ? 'Modify' : 'Draft'} Invoice</h2>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{invoiceNo}</p>`;

const newTitle = `            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{editingInvoice ? 'Modify' : 'Draft'} Invoice</h2>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">NO:</span>
               <input type="text" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 rounded px-2 py-0.5 outline-none w-40" />
            </div>`;
content = content.replace(oldTitle, newTitle);

fs.writeFileSync(file, content);
console.log("Patched addinvoice.tsx input and validation.");
