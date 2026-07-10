const fs = require('fs');
const file = 'pages/Administration/invoice/Invoices.tsx';
let content = fs.readFileSync(file, 'utf8');

// fix printRef wrapping
content = content.replace(
  '<div className="flex-1 overflow-y-auto p-8 bg-white" ref={printRef}>\n                 {/* Printable Content */}\n                 <div className="space-y-8">',
  '<div className="flex-1 overflow-y-auto bg-white">\n              <div className="p-8" ref={printRef}>\n                 {/* Printable Content */}\n                 <div className="space-y-8">'
);

// fix client GSTIN
content = content.replace(
  '{previewInvoice.clientTradeName && <p className="text-xs font-bold text-slate-500 uppercase mt-1">{previewInvoice.clientTradeName}</p>}',
  '{previewInvoice.clientTradeName && <p className="text-xs font-bold text-slate-500 uppercase mt-1">{previewInvoice.clientTradeName}</p>}\n                       {previewInvoice.clientGstin && <p className="text-xs font-bold text-slate-500 uppercase mt-1">GSTIN: {previewInvoice.clientGstin}</p>}'
);

// fix Terms & conditions layout
const originalBottom = `<div className="flex gap-8">
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
                          <div className="text-[10px] font-bold text-slate-400 uppercase max-w-xs whitespace-pre-wrap">
                             <p>Terms & Conditions:</p>
                             <p className="mt-1">{settings?.terms || '1. Payment is due within 15 days.\\n2. Please quote invoice number in all correspondence.'}</p>
                          </div>
                          <div className="text-center flex flex-col items-center">`;

const newBottom = `<div className="flex flex-col gap-6 max-w-sm">
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
                          <div className="text-center flex flex-col items-center">`;

content = content.replace(originalBottom, newBottom);

// match closing div for printRef
content = content.replace(
  '</div>\n                 </div>\n              </div>\n           </div>\n        </div>\n      )}',
  '</div>\n                 </div>\n              </div>\n              </div>\n           </div>\n        </div>\n      )}'
);

fs.writeFileSync(file, content);
console.log("Patched Invoices.tsx printable content");
