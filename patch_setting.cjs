const fs = require('fs');

let content = fs.readFileSync('pages/Administration/invoice/invoicesetting.tsx', 'utf8');
content = content.replace(
  /firmName: '', firmAddress: '', firmMobile: '', firmEmail: '', firmGstin: '',\n    bankName: '',/g,
  "firmName: '', firmAddress: '', firmMobile: '', firmEmail: '', firmGstin: '',\n    accountName: '', bankName: '',"
);

content = content.replace(
  /             <div>\n                <label className="text-\[10px\] font-black uppercase text-slate-400 mb-2 block">Bank Name<\/label>/g,
  `             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Account Holder Name</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black uppercase"
                  value={settings.accountName || ''} onChange={e => setSettings({...settings, accountName: e.target.value})} />
             </div>
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Bank Name</label>`
);

fs.writeFileSync('pages/Administration/invoice/invoicesetting.tsx', content);
