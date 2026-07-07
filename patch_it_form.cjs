const fs = require('fs');
const file = 'pages/Clientform/ITClientFormModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldText = `                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Legal Name (As per PAN)</label>
                   <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black outline-none focus:border-indigo-600 focus:bg-white transition-all" value={formData.legalName} onChange={e => setFormData({...formData, legalName: e.target.value})} placeholder="E.G. JOHN DOE" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 tracking-widest ml-1">Trade Name (Optional)</label>
                   <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black outline-none focus:border-indigo-600 focus:bg-white transition-all" value={formData.tradeName} onChange={e => setFormData({...formData, tradeName: e.target.value})} placeholder="BUSINESS NAME" />
                </div>`;

const newText = `                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Legal Name (As per PAN)</label>
                   <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black outline-none focus:border-indigo-600 focus:bg-white transition-all" value={formData.legalName} onChange={e => setFormData({...formData, legalName: e.target.value})} placeholder="E.G. JOHN DOE" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 tracking-widest ml-1">Trade Name (Optional)</label>
                   <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black outline-none focus:border-indigo-600 focus:bg-white transition-all" value={formData.tradeName} onChange={e => setFormData({...formData, tradeName: e.target.value})} placeholder="BUSINESS NAME" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mobile No</label>
                   <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black outline-none focus:border-indigo-600 focus:bg-white transition-all" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value.replace(/\\D/g, '').slice(0, 10)})} placeholder="Mobile Number" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email ID</label>
                   <input type="email" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black outline-none focus:border-indigo-600 focus:bg-white transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email Address" />
                </div>`;

if (content.includes(oldText)) {
    content = content.replace(oldText, newText);
    fs.writeFileSync(file, content);
    console.log('Patched IT Client Form');
} else {
    console.log('Old text not found in ITClientFormModal');
}
