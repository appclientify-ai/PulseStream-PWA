const fs = require('fs');
let c = fs.readFileSync('pages/Administration/invoice/PaymentReceived.tsx', 'utf8');

// Replace showLedger state and modal with onViewChange
c = c.replace(/onClick=\{.*?setShowLedger\(true\).*?\}/, 
  "onClick={() => onViewChange('admin-client-ledger')}");

// Remove the modal code to keep it clean, or just leave the button change.
// To remove the modal safely without complex regex:
const modalStart = c.indexOf('{/* Ledger Modal */}');
if (modalStart !== -1) {
  // Find the end of the file or the end of the div
  const divEnd = c.lastIndexOf('</div>\n  );\n};');
  if (divEnd > modalStart) {
    c = c.substring(0, modalStart) + c.substring(divEnd);
  }
}

fs.writeFileSync('pages/Administration/invoice/PaymentReceived.tsx', c);
console.log('Patched PaymentReceived.tsx');
