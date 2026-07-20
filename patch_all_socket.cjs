const fs = require('fs');

const paths = [
  'pages/Compliance/GSTReturn/filinglogic/QuarterlyFilingLogic.tsx',
  'pages/Compliance/ITAudit/Balancesheetlogic.tsx',
  'pages/Compliance/ITAudit/TAXAuditlogic.tsx',
  'pages/Compliance/ITAudit/ITRReturnlogic.tsx',
  'pages/Compliance/AnnualReturns/GSTR4logic.tsx',
  'pages/Compliance/AnnualReturns/GSTR9_9Clogic.tsx'
];

for (const p of paths) {
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/\.catch\(console\.error\);/g, ".then(() => socketService.emit('data_updated')).catch(console.error);");
  
  if (!c.includes("import { socketService }")) {
    c = "import { socketService } from '../../../../services/socket.ts';\n" + c;
  }
  
  fs.writeFileSync(p, c);
  console.log(`Patched ${p}`);
}
