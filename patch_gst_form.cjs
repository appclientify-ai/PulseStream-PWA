const fs = require('fs');
const file = 'pages/Clientform/GSTClientFormModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldText = `              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Trade Name</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none focus:border-indigo-600 transition-all" value={formData.tradeName} onChange={e => setFormData({...formData, tradeName: e.target.value})} placeholder="Entity Trading Name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 tracking-widest ml-1">Legal Name</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none focus:border-indigo-600 transition-all" value={formData.legalName} onChange={e => setFormData({...formData, legalName: e.target.value})} placeholder="Legal Registered Name" />
              </div>`;

const newText = `              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Trade Name</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none focus:border-indigo-600 transition-all" value={formData.tradeName} onChange={e => setFormData({...formData, tradeName: e.target.value})} placeholder="Entity Trading Name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Legal Name</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none focus:border-indigo-600 transition-all" value={formData.legalName} onChange={e => setFormData({...formData, legalName: e.target.value})} placeholder="Legal Registered Name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mobile No</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none focus:border-indigo-600 transition-all" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value.replace(/\\D/g, '').slice(0, 10)})} placeholder="Mobile Number" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email ID</label>
                <input type="email" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none focus:border-indigo-600 transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email Address" />
              </div>`;

if (content.includes(oldText)) {
    content = content.replace(oldText, newText);
    fs.writeFileSync(file, content);
    console.log('Patched GST Client Form');
} else {
    console.log('Old text not found in GSTClientFormModal');
}
