const fs = require('fs');

const files = [
  'pages/Administration/invoice/Invoices.tsx',
  'pages/Administration/invoice/PaymentReceived.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  const regex = /<h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">\{settings\?\.firmName \|\| 'Your Firm Name'\}<\/h1>(\s*)\{settings\?\.firmAddress && <p className="text-xs font-bold text-slate-500 uppercase mt-1 max-w-xs whitespace-pre-wrap">\{settings\.firmAddress\}<\/p>\}(\s*)\{settings\?\.firmGstin && settings\.firmGstin\.toLowerCase\(\) !== 'n\/a' && <p className="text-xs font-bold text-slate-500 uppercase mt-1">GSTIN: \{settings\.firmGstin\}<\/p>\}(\s*)\{settings\?\.firmMobile && <p className="text-xs font-bold text-slate-500 uppercase">Contact: \{settings\.firmMobile\}<\/p>\}(\s*)\{settings\?\.firmEmail && <p className="text-xs font-bold text-slate-500 uppercase">Email: \{settings\.firmEmail\}<\/p>\}/g;
  
  const newBlock = `<h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">{settings?.firmName || 'Your Firm Name'}</h1>
                             {settings?.firmServices && <p className="text-[10px] font-black text-indigo-500 uppercase mt-0.5 tracking-widest">{settings.firmServices}</p>}
                             {settings?.firmAddress && <p className="text-xs font-bold text-slate-500 uppercase mt-2 max-w-xs whitespace-pre-wrap">{settings.firmAddress}</p>}
                             {settings?.firmGstin && settings.firmGstin.toLowerCase() !== 'n/a' && <p className="text-xs font-bold text-slate-500 uppercase mt-1">GSTIN: {settings.firmGstin}</p>}
                             {settings?.professionType && settings?.registrationNo && <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">{settings.professionType === 'CA' ? 'Membership No: ' : 'Bar Registration No: '}{settings.registrationNo}</p>}
                             {settings?.firmMobile && <p className="text-xs font-bold text-slate-500 uppercase">Contact: {settings.firmMobile}</p>}
                             {settings?.firmEmail && <p className="text-xs font-bold text-slate-500 uppercase">Email: {settings.firmEmail}</p>}`;

  content = content.replace(regex, newBlock);
  fs.writeFileSync(file, content);
});
console.log("Fixed firm layout.");
