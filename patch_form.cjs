const fs = require('fs');

let c = fs.readFileSync('pages/Clientform/GSTClientFormModal.tsx', 'utf8');

c = c.replace(
  /\{formData\.gstProfile\?\.jurisdictionType === 'State' \? \([\s\S]*?\) : \([\s\S]*?\)\}/,
  `<>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Sector</label>
                    <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none" value={formData.gstProfile?.sector || ''} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, sector: e.target.value}})} placeholder="Sector" />
                  </div>
                  {formData.gstProfile?.jurisdictionType === 'Center' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Range</label>
                      <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none" value={formData.gstProfile?.range || ''} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, range: e.target.value}})} placeholder="Range" />
                    </div>
                  )}
                </>`
);

fs.writeFileSync('pages/Clientform/GSTClientFormModal.tsx', c);
