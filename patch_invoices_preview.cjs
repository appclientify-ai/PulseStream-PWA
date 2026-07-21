const fs = require('fs');
let c = fs.readFileSync('pages/Administration/invoice/Invoices.tsx', 'utf8');

const regex = /(<div className="p-8 relative" ref=\{printRef\}>)\s*(\{\/\* Printable Content \*\/ \})\s*(<div className="space-y-8 relative z-10">)/m;

if (regex.test(c)) {
  c = c.replace(regex, `$1
                 {settings?.watermark && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none z-0">
                       <img src={settings.watermark} alt="Watermark" className="max-w-[80%] max-h-[80%] object-contain grayscale" />
                    </div>
                 )}
                 $2
                 $3`);
  fs.writeFileSync('pages/Administration/invoice/Invoices.tsx', c);
  console.log("Patched Invoices.tsx preview successfully");
} else {
  console.log("Could not find the target code in Invoices.tsx");
}
