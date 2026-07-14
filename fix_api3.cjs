const fs = require('fs');
let content = fs.readFileSync('services/api.ts', 'utf8');

const parts = content.split('  async deleteMiscWork(id: string) { await this.delete(`/items/${id}`); }\n}');
if (parts.length === 2) {
  content = parts[0] + '  async deleteMiscWork(id: string) { await this.delete(`/items/${id}`); }\n' + parts[1];
  fs.writeFileSync('services/api.ts', content);
}
