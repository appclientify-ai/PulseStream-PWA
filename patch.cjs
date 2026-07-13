const fs = require('fs');

const file = 'pages/Administration/invoice/invoicesetting.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetLogo = `             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Company Logo</label>
                {settings.firmLogo ? (
                  <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <button type="button" onClick={() => handleDeleteImage('firmLogo')} className="h-10 w-10 shrink-0 flex items-center justify-center bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors" title="Delete Logo">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                    <img src={settings.firmLogo} alt="Logo" className="h-12 object-contain" />
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'firmLogo')} className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-3 font-black text-xs" />
                  </div>
                )}
             </div>`;

if(content.includes(targetLogo.trim())) {
    content = content.replace(targetLogo.trim(), '');
    fs.writeFileSync(file, content);
    console.log("Logo upload removed");
} else {
    console.log("Could not find logo upload section");
}
