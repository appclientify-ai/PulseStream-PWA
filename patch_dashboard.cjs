const fs = require('fs');

let c = fs.readFileSync('pages/Primary/Dashboard.tsx', 'utf8');

if (!c.includes('ClientLedger')) {
  c = c.replace(/const PaymentReceived = lazy\(\(\) => import\('\.\.\/Administration\/invoice\/PaymentReceived\.tsx'\)\);/,
    "const PaymentReceived = lazy(() => import('../Administration/invoice/PaymentReceived.tsx'));\nconst ClientLedger = lazy(() => import('../Administration/invoice/ClientLedger.tsx'));");
  
  c = c.replace(/case 'admin-payments': return <PaymentReceived onViewChange=\{handleViewChange\} \/>;/,
    "case 'admin-payments': return <PaymentReceived onViewChange={handleViewChange} />;\n      case 'admin-client-ledger': return <ClientLedger onBack={() => handleViewChange('admin-payments')} />;");
    
  fs.writeFileSync('pages/Primary/Dashboard.tsx', c);
}
console.log('Patched Dashboard.tsx');
