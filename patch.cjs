const fs = require('fs');

const fixWatermark = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /<div className="absolute inset-0 flex items-center justify-center opacity-\[0\.03\] pointer-events-none z-0 overflow-hidden">\s*<img src=\{settings\.firmLogo\} alt="Watermark" className="w-\[120%\] h-\[120%\] object-contain mix-blend-multiply" \/>\s*<\/div>/g,
    `<div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none z-0">
                       <img src={settings.firmLogo} alt="Watermark" className="max-w-[80%] max-h-[80%] object-contain" />
                    </div>`
  );
  fs.writeFileSync(file, content);
};

fixWatermark('pages/Administration/invoice/Invoices.tsx');
fixWatermark('pages/Administration/invoice/PaymentReceived.tsx');
