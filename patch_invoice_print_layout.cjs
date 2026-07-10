const fs = require('fs');
const file = 'pages/Administration/invoice/Invoices.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldTotals = `<div className="flex justify-end">
                       <div className="w-64 space-y-3">
                          <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                             <span>Sub Total</span>
                             <span>₹{previewInvoice.subTotal.toLocaleString()}</span>
                          </div>
                          {settings?.isGstEnabled && (
                             <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                                <span>Total Tax</span>
                                <span>₹{previewInvoice.totalTax.toLocaleString()}</span>
                             </div>
                          )}
                          <div className="h-px bg-slate-200" />
                          <div className="flex justify-between text-lg font-black text-slate-900 uppercase">
                             <span>Grand Total</span>
                             <span>₹{previewInvoice.totalAmount.toLocaleString()}</span>
                          </div>
                       </div>
                    </div>`;

const newTotals = `<div className="flex justify-between items-start mt-4">
                       <div className="flex flex-col gap-2 pt-2">
                          {settings?.upiId && (
                            <div className="flex flex-col items-center gap-2">
                              <QRCodeSVG value={\`upi://pay?pa=\${settings.upiId}&pn=\${encodeURIComponent(settings.firmName)}&am=\${previewInvoice.totalAmount}&cu=INR&tn=Invoice \${previewInvoice.invoiceNo}\`} size={80} />
                              <span className="text-[9px] font-black uppercase text-slate-500">Scan to Pay</span>
                            </div>
                          )}
                       </div>
                       <div className="w-64 space-y-3">
                          <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                             <span>Sub Total</span>
                             <span>₹{previewInvoice.subTotal.toLocaleString()}</span>
                          </div>
                          {settings?.isGstEnabled && (
                             <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                                <span>Total Tax</span>
                                <span>₹{previewInvoice.totalTax.toLocaleString()}</span>
                             </div>
                          )}
                          <div className="h-px bg-slate-200" />
                          <div className="flex justify-between text-lg font-black text-slate-900 uppercase">
                             <span>Grand Total</span>
                             <span>₹{previewInvoice.totalAmount.toLocaleString()}</span>
                          </div>
                       </div>
                    </div>`;

content = content.replace(oldTotals, newTotals);

const oldFooter = `<div className="pt-12 border-t border-slate-100">
                       <div className="flex justify-between items-end">
                          <div className="flex flex-col gap-6 max-w-sm">
                             <div className="text-[10px] font-bold text-slate-500 uppercase whitespace-pre-wrap">
                                <p className="text-slate-900 font-black mb-1">Terms & Conditions:</p>
                                <p className="mt-1">{settings?.terms || '1. Payment is due within 15 days.\\n2. Please quote invoice number in all correspondence.'}</p>
                             </div>
                             <div className="flex gap-8">
                               {settings?.upiId && (
                                 <div className="flex flex-col items-center gap-2">
                                   <QRCodeSVG value={\`upi://pay?pa=\${settings.upiId}&pn=\${encodeURIComponent(settings.firmName)}&am=\${previewInvoice.totalAmount}&cu=INR&tn=Invoice \${previewInvoice.invoiceNo}\`} size={80} />
                                   <span className="text-[9px] font-black uppercase text-slate-500">Scan to Pay</span>
                                 </div>
                               )}
                               {settings?.whatsappNumber && (
                                 <div className="flex flex-col items-center gap-2">
                                   <QRCodeSVG value={\`https://wa.me/\${settings.whatsappNumber}?text=\${encodeURIComponent(\`Hello, regarding invoice \${previewInvoice.invoiceNo}\`)}\`} size={80} />
                                   <span className="text-[9px] font-black uppercase text-slate-500">WhatsApp Us</span>
                                 </div>
                               )}
                             </div>
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

const newFooter = `<div className="pt-8 border-t border-slate-100 mt-8">
                       <div className="flex justify-between items-end">
                          <div className="text-[10px] font-bold text-slate-500 uppercase whitespace-pre-wrap max-w-sm">
                             <p className="text-slate-900 font-black mb-1">Terms & Conditions:</p>
                             <p className="mt-1">{settings?.terms || '1. Payment is due within 15 days.\\n2. Please quote invoice number in all correspondence.'}</p>
                          </div>
                          <div className="flex gap-12 items-end">
                             {settings?.whatsappNumber && (
                               <div className="flex flex-col items-center gap-2">
                                 <QRCodeSVG value={\`https://wa.me/\${settings.whatsappNumber}?text=\${encodeURIComponent(\`Hello, regarding invoice \${previewInvoice.invoiceNo}\`)}\`} size={80} />
                                 <span className="text-[9px] font-black uppercase text-slate-500">WhatsApp Us</span>
                               </div>
                             )}
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
console.log("Patched Invoices.tsx layout");
