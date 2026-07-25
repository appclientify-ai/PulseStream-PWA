const fs = require('fs');
let code = fs.readFileSync('pages/Administration/invoice/PaymentReceived.tsx', 'utf-8');

// Remove the old handleDelete
code = code.replace(/const handleDelete = async \(id: string\) => \{ if\(confirm\('Delete payment record\?'\)\) \{ await api.deletePayment\(id\); fetchAll\(\); \} \};\n\n/, '');
code = code.replace(/const handleDelete = async \(id: string\) => \{ if\(confirm\('Delete payment record\?'\)\) \{ await api.deletePayment\(id\); fetchAll\(\); \} \};\s+/, '');

fs.writeFileSync('pages/Administration/invoice/PaymentReceived.tsx', code);
