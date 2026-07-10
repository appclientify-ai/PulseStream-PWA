const fs = require('fs');
const file = 'pages/Administration/invoice/PaymentReceived.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '{previewPayment.inv.clientTradeName && <p className="text-xs font-bold text-slate-500 uppercase mt-1">{previewPayment.inv.clientTradeName}</p>}',
  '{previewPayment.inv.clientTradeName && <p className="text-xs font-bold text-slate-500 uppercase mt-1">{previewPayment.inv.clientTradeName}</p>}\n                       {previewPayment.inv.clientGstin && <p className="text-xs font-bold text-slate-500 uppercase mt-1">GSTIN: {previewPayment.inv.clientGstin}</p>}'
);

fs.writeFileSync(file, content);
console.log("Patched PaymentReceived.tsx client GSTIN");
