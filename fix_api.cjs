const fs = require('fs');
let content = fs.readFileSync('services/api.ts', 'utf8');

// The incorrect block starts with "}\n  async getAppData"
content = content.replace(/}\n  async getAppData/g, '  async getAppData');

fs.writeFileSync('services/api.ts', content);
