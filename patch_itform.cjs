const fs = require('fs');
const file = 'pages/Clientform/ITClientFormModal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("email: '',", "email: '',\n    address: '',");
content = content.replace("email: '',", "email: '', address: '',");

const addressField1 = `                </div>
                <div className="space-y-2 md:col-span-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Client Address</label>
                   <textarea className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none focus:border-indigo-600 focus:bg-white transition-all resize-none" rows={2} value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Full Address" />
                </div>`;
                
const addressField2 = `                   </div>
                   <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Client Address</label>
                      <textarea className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold outline-none resize-none" rows={2} value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Full Address" />
                   </div>`;

content = content.replace('placeholder="Email Address" />\n                </div>', 'placeholder="Email Address" />\n' + addressField1);
content = content.replace('placeholder="client@firm.com" />\n                   </div>', 'placeholder="client@firm.com" />\n' + addressField2);

fs.writeFileSync(file, content);
console.log("Patched ITClientFormModal.tsx");
