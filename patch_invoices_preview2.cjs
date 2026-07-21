const fs = require('fs');
let c = fs.readFileSync('pages/Administration/invoice/Invoices.tsx', 'utf8');

c = c.replace('<div className="p-8 relative" ref={printRef}>', `<div className="p-8 relative" ref={printRef}>
                 {settings?.watermark && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none z-0 overflow-hidden">
                       <img src={settings.watermark} alt="Watermark" className="w-[80%] object-contain mix-blend-multiply grayscale" />
                    </div>
                 )}`);

fs.writeFileSync('pages/Administration/invoice/Invoices.tsx', c);
console.log("Patched successfully");
