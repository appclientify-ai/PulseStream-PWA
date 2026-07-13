const fs = require('fs');

const fixWatermark = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /<div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none z-0">\s*<img src=\{settings\.firmLogo\} alt="Watermark" className="max-w-\[80%\] max-h-\[80%\] object-contain" \/>\s*<\/div>/g,
    `<div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none z-50 overflow-hidden">
                       <img src={settings.firmLogo} alt="Watermark" className="w-[90%] h-[90%] object-contain mix-blend-multiply" />
                    </div>`
  );
  fs.writeFileSync(file, content);
};

fixWatermark('pages/Administration/invoice/Invoices.tsx');
fixWatermark('pages/Administration/invoice/PaymentReceived.tsx');
