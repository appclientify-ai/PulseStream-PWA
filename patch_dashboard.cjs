const fs = require('fs');
const file = 'pages/Primary/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    `<div className="text-center px-4">
                        <p className="text-3xl font-black text-slate-900">{pendingTribunals}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Tribunal</p>
                     </div>`,
    `<div className="text-center px-4 border-r border-slate-100">
                        <p className="text-3xl font-black text-slate-900">{pendingTribunals}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Tribunal</p>
                     </div>
                     <div className="text-center px-4">
                        <p className="text-3xl font-black text-slate-900">{pendingCourt}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">High Court</p>
                     </div>`
);

fs.writeFileSync(file, content);
console.log('patched');
