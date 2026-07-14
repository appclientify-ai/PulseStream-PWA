const fs = require('fs');
let content = fs.readFileSync('pages/Administration/invoice/Invoices.tsx', 'utf8');
content = content.replace(
  /<p className="text-\[9px\] font-bold text-slate-600 uppercase">Bank: \{settings\?\.bankName \|\| 'N\/A'\}<\/p>/g,
  `<p className="text-[9px] font-bold text-slate-600 uppercase">A/C Name: {settings?.accountName || 'N/A'}</p>\n                             <p className="text-[9px] font-bold text-slate-600 uppercase">Bank: {settings?.bankName || 'N/A'}</p>`
);
fs.writeFileSync('pages/Administration/invoice/Invoices.tsx', content);
