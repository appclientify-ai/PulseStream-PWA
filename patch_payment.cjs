const fs = require('fs');
const file = 'pages/Administration/invoice/PaymentReceived.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("  const [payments, setPayments] = useState<PaymentRecord[]>([]);", 
  "  const [payments, setPayments] = useState<PaymentRecord[]>([]);\n  const handleDelete = async (id: string) => { if(confirm('Delete payment record?')) { await api.deletePayment(id); fetchRecords(); } };");

content = content.replace('<th className=" px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Mode</th>',
  '<th className=" px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Mode</th>\n<th className=" px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>');

content = content.replace('<span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase bg-slate-100 text-slate-600">{pay.mode}</span>\n                  </td>',
  `<span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase bg-slate-100 text-slate-600">{pay.mode}</span>
                  </td>
                  <td className="px-4 py-6 text-right">
                    <button onClick={() => handleDelete(pay.id)} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-red-600 transition-all flex items-center justify-center shadow-sm" title="Delete Payment">
                       <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </td>`);

fs.writeFileSync(file, content);
console.log("Patched PaymentReceived.tsx");
