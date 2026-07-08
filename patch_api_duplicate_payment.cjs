const fs = require('fs');
const file = 'services/api.ts';
let content = fs.readFileSync(file, 'utf8');

const migrateStart = `  async migrateToPayment(invoiceId: string, paymentData: { date: string; mode: string; chequeNo?: string }): Promise<void> {
    const invs = await this.getInvoices();
    const inv = invs.find(i => i.id === invoiceId);
    if (!inv) return;
    inv.status = 'Paid';
    inv.paymentDate = paymentData.date;
    inv.paymentMode = paymentData.mode;
    await this.saveInvoice(inv);
    await this.savePayment({`;

const newMigrateStart = `  async migrateToPayment(invoiceId: string, paymentData: { date: string; mode: string; chequeNo?: string }): Promise<void> {
    const invs = await this.getInvoices();
    const inv = invs.find(i => i.id === invoiceId);
    if (!inv) return;

    const existingPayments = await this.getPayments();
    if (existingPayments.some(p => p.invoiceNo === inv.invoiceNo)) {
       inv.status = 'Paid';
       inv.paymentDate = paymentData.date;
       inv.paymentMode = paymentData.mode;
       await this.saveInvoice(inv);
       return;
    }

    inv.status = 'Paid';
    inv.paymentDate = paymentData.date;
    inv.paymentMode = paymentData.mode;
    await this.saveInvoice(inv);
    await this.savePayment({`;

content = content.replace(migrateStart, newMigrateStart);

fs.writeFileSync(file, content);
console.log("Patched api.ts for duplicate payment check");
