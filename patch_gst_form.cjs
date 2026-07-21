const fs = require('fs');
let c = fs.readFileSync('pages/Clientform/GSTClientFormModal.tsx', 'utf8');

c = c.replace(
  /\{formData\.gstProfile\?\.jurisdictionType === 'State' \? \([\s\S]*?\) : \([\s\S]*?\)\}/,
  `{formData.gstProfile?.jurisdictionType === 'State' ? (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Sector</label>
                    <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none" value={formData.gstProfile?.sector} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, sector: e.target.value}})} placeholder="Sector" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Sector</label>
                      <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none" value={formData.gstProfile?.sector} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, sector: e.target.value}})} placeholder="Sector" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Range</label>
                      <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none" value={formData.gstProfile?.range} onChange={e => setFormData({...formData, gstProfile: {...formData.gstProfile!, range: e.target.value}})} placeholder="Range" />
                    </div>
                  </>
                )}`
);

// We need to change the grid-cols-2 if it's Center and closed it might be 3 items, grid-cols-2 or 3 is fine (it'll wrap). 
// The div has grid-cols-2. Let's make it grid-cols-2 md:grid-cols-3
c = c.replace(/<div className="grid grid-cols-2 gap-4">\s*\{formData\.gstProfile\?\.jurisdictionType === 'State' \? \(/, `<div className="grid grid-cols-2 md:grid-cols-3 gap-4">\n                {formData.gstProfile?.jurisdictionType === 'State' ? (`);

fs.writeFileSync('pages/Clientform/GSTClientFormModal.tsx', c);
console.log('patched form');
