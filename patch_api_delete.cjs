const fs = require('fs');
const file = 'services/api.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("async savePayment(payment: Partial<PaymentRecord>): Promise<PaymentRecord> {", 
  "async deletePayment(id: string) { await this.delete(`/items/${id}`); }\n  async savePayment(payment: Partial<PaymentRecord>): Promise<PaymentRecord> {");

fs.writeFileSync(file, content);
console.log("Patched api.ts");
