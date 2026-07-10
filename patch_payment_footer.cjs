const fs = require('fs');
const file = 'pages/Administration/invoice/PaymentReceived.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldFooter = `<div className="pt-12 border-t border-slate-100 relative z-10">
                       <div className="flex justify-between items-end">
                          <div className="text-[10px] font-bold text-slate-400 uppercase max-w-xs whitespace-pre-wrap">
                             <p>Terms & Conditions:</p>
                             <p className="mt-1">{settings?.terms || 'This is a computer generated receipt.'}</p>
                          </div>
                          <div className="text-center flex flex-col items-center">
                             {settings?.firmSignature ? (
                               <img src={settings.firmSignature} alt="Signature" className="h-16 object-contain mb-2" />
                             ) : (
                               <div className="h-16 mb-2" />
                             )}
                             <p className="text-[10px] font-black uppercase text-slate-900">Authorized Signatory</p>
                             <p className="text-[9px] font-bold uppercase text-slate-400">{settings?.firmName}</p>
                          </div>
                       </div>
                    </div>`;

const newFooter = `<div className="pt-8 border-t border-slate-100 mt-8 relative z-10">
                       <div className="flex justify-between items-end">
                          <div className="text-[10px] font-bold text-slate-500 uppercase whitespace-pre-wrap max-w-sm">
                             <p className="text-slate-900 font-black mb-1">Terms & Conditions:</p>
                             <p className="mt-1">{settings?.terms || 'This is a computer generated receipt.'}</p>
                          </div>
                          <div className="flex gap-12 items-end">
                             <div className="text-center flex flex-col items-center">
                                {settings?.firmSignature ? (
                                  <img src={settings.firmSignature} alt="Signature" className="h-16 object-contain mb-2" />
                                ) : (
                                  <div className="h-16 mb-2" />
                                )}
                                <p className="text-[10px] font-black uppercase text-slate-900">Authorized Signatory</p>
                                <p className="text-[9px] font-bold uppercase text-slate-400">{settings?.firmName}</p>
                             </div>
                          </div>
                       </div>
                    </div>`;

content = content.replace(oldFooter, newFooter);

fs.writeFileSync(file, content);
console.log("Patched PaymentReceived.tsx layout");
