const fs = require('fs');
const file = 'pages/Administration/invoice/Invoices.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add import
content = content.replace("import html2pdf from 'html2pdf.js';", "import html2pdf from 'html2pdf.js';\nimport { TableFilter } from '../../../components/TableFilter';");

// Update header
content = content.replace(
  '<th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>',
  `<th className=" px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">
    <div className="flex justify-center flex-col items-center">
      <TableFilter label="Status" isActive={statusFilter !== 'All'}>
         {['All', 'Draft', 'Sent', 'Paid'].map(st => (
           <button key={st} onClick={() => setStatusFilter(st as any)} className={\`w-full text-left px-3 py-2 text-[10px] font-black uppercase rounded-lg \${statusFilter === st ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}\`}>{st}</button>
         ))}
      </TableFilter>
    </div>
  </th>`
);

// Update status cell
const statusCell = `<td className=" px-6 py-6 text-center">
                     <span className={\`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border \${inv.status === 'Sent' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-400'}\`}>{inv.status}</span>
                  </td>`;
                  
const newStatusCell = `<td className=" px-6 py-6 text-center">
                     <select
                       value={inv.status}
                       onChange={async (e) => {
                         const val = e.target.value;
                         if (val === 'Paid') {
                           setSettlingInvoice(inv);
                         } else {
                           const updated = { ...inv, status: val as any };
                           await api.saveInvoice(updated);
                           fetchAll();
                         }
                       }}
                       className={\`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border outline-none cursor-pointer \${inv.status === 'Sent' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-500 border-slate-200'}\`}
                     >
                       <option value="Draft">Draft</option>
                       <option value="Sent">Invoice Sent</option>
                       <option value="Paid">Payment Received</option>
                     </select>
                  </td>`;

if (content.includes(statusCell)) {
  content = content.replace(statusCell, newStatusCell);
  fs.writeFileSync(file, content);
  console.log("Patched Invoices.tsx");
} else {
  console.log("Could not find statusCell");
}
