const fs = require('fs');
const file = 'pages/Administration/invoice/Invoices.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldFirmHeader = `<p className="text-xs font-bold text-slate-500 uppercase mt-1 max-w-xs whitespace-pre-wrap">{settings?.firmAddress || 'Firm Address'}</p>
                             <p className="text-xs font-bold text-slate-500 uppercase mt-1">GSTIN: {settings?.firmGstin || 'N/A'}</p>
                             <p className="text-xs font-bold text-slate-500 uppercase">Contact: {settings?.firmMobile || 'N/A'}</p>
                             <p className="text-xs font-bold text-slate-500 uppercase">Email: {settings?.firmEmail || 'N/A'}</p>`;

const newFirmHeader = `{settings?.firmAddress && <p className="text-xs font-bold text-slate-500 uppercase mt-1 max-w-xs whitespace-pre-wrap">{settings.firmAddress}</p>}
                             {settings?.firmGstin && <p className="text-xs font-bold text-slate-500 uppercase mt-1">GSTIN: {settings.firmGstin}</p>}
                             {settings?.firmMobile && <p className="text-xs font-bold text-slate-500 uppercase">Contact: {settings.firmMobile}</p>}
                             {settings?.firmEmail && <p className="text-xs font-bold text-slate-500 uppercase">Email: {settings.firmEmail}</p>}`;

content = content.replace(oldFirmHeader, newFirmHeader);

fs.writeFileSync(file, content);
console.log("Patched Invoices.tsx GSTIN and Firm Details.");
