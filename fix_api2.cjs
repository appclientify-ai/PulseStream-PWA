const fs = require('fs');
let content = fs.readFileSync('services/api.ts', 'utf8');

const target = "  async deleteMiscWork(id: string) { await this.delete(`/items/${id}`); }\n}\n  async getAppData(key: string)";
const repl = "  async deleteMiscWork(id: string) { await this.delete(`/items/${id}`); }\n  async getAppData(key: string)";

content = content.replace(target, repl);

fs.writeFileSync('services/api.ts', content);
