const fs = require('fs');

const removeWatermark = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /                 \{settings\?\.firmLogo && \(\n                    <div className="absolute inset-0 flex items-center justify-center opacity-\[0\.06\] pointer-events-none z-50 overflow-hidden">\n                       <img src=\{settings\.firmLogo\} alt="Watermark" className="w-\[90%\] h-\[90%\] object-contain mix-blend-multiply" \/>\n                    <\/div>\n                 \)}/g,
    ''
  );
  fs.writeFileSync(file, content);
};

removeWatermark('pages/Administration/invoice/Invoices.tsx');
removeWatermark('pages/Administration/invoice/PaymentReceived.tsx');
