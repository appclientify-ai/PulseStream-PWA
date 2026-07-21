const fs = require('fs');
let c = fs.readFileSync('pages/Administration/invoice/invoicesetting.tsx', 'utf8');

c = c.replace(
  /terms: '', isGstEnabled: true, firmLogo: '', firmSignature: '', whatsappNumber: ''/,
  "terms: '', isGstEnabled: true, firmLogo: '', firmSignature: '', watermark: '', whatsappNumber: ''"
);

c = c.replace(
  /const handleDeleteImage = async \(field: 'firmLogo' \| 'firmSignature'\) => \{/g,
  "const handleDeleteImage = async (field: 'firmLogo' | 'firmSignature' | 'watermark') => {"
);

c = c.replace(
  /const handleImageUpload = \(e: React\.ChangeEvent<HTMLInputElement>, field: 'firmLogo' \| 'firmSignature'\) => \{/g,
  "const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'firmLogo' | 'firmSignature' | 'watermark') => {"
);

const signatureJSX = `             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Signature</label>
                {settings.firmSignature ? (
                  <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <button type="button" onClick={() => handleDeleteImage('firmSignature')} className="h-10 w-10 shrink-0 flex items-center justify-center bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors" title="Delete Signature">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                    <img src={settings.firmSignature} alt="Signature" className="h-12 object-contain" />
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'firmSignature')} className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-3 font-black text-xs" />
                  </div>
                )}
             </div>`;

const watermarkJSX = `
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Watermark (Center Logo)</label>
                {settings.watermark ? (
                  <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <button type="button" onClick={() => handleDeleteImage('watermark')} className="h-10 w-10 shrink-0 flex items-center justify-center bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors" title="Delete Watermark">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                    <img src={settings.watermark} alt="Watermark" className="h-12 object-contain" />
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'watermark')} className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-3 font-black text-xs" />
                  </div>
                )}
             </div>`;

c = c.replace(signatureJSX, signatureJSX + watermarkJSX);

fs.writeFileSync('pages/Administration/invoice/invoicesetting.tsx', c);
