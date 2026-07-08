const fs = require('fs');
const file = 'pages/Clientform/GSTClientFormModal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("email: '',", "email: '',\n    address: '',");
content = content.replace("email: '',", "email: '',\n      address: '',");

const addressField = `              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Client Address</label>
                <textarea className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none focus:border-indigo-600 transition-all resize-none" rows={2} value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Full Address" />
              </div>`;

content = content.replace('placeholder="Email Address" />\n              </div>', 'placeholder="Email Address" />\n' + addressField);

fs.writeFileSync(file, content);
console.log("Patched GSTClientFormModal.tsx");
