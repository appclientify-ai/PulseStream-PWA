const fs = require('fs');
let content = fs.readFileSync('services/api.ts', 'utf8');

const additionalMethods = `
  async getAppData(key: string): Promise<any> {
    const items = await this.get('/items');
    const existing = items.find((i: any) => i.name === 'app_data_' + key);
    return existing ? existing.data : null;
  }
  async saveAppData(key: string, data: any): Promise<void> {
    const items = await this.get('/items');
    const existing = items.find((i: any) => i.name === 'app_data_' + key);
    const payload = { name: 'app_data_' + key, data: data };
    if (existing) {
      await this.put(\`/items/\${existing._id}\`, payload);
    } else {
      await this.post('/items', payload);
    }
  }
`;

content = content.replace('export const api = new ApiService();', additionalMethods + '\n}\n\nexport const api = new ApiService();');
fs.writeFileSync('services/api.ts', content);
