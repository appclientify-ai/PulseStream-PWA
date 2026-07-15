const fs = require('fs');
let content = fs.readFileSync('services/api.ts', 'utf8');

if (!content.includes('patchAppData(')) {
  const patchCode = `
  async patchAppData(key: string, updates: Record<string, any>): Promise<any> {
    return this.patch(\`/items/app_data/\${key}/patch\`, { updates });
  }
  `;
  content = content.replace("async getAppData", patchCode + "\n  async getAppData");
  
  if (!content.includes('async patch(')) {
    const patchMethod = `
  async patch(endpoint: string, data: any) {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = \`Bearer \${this.token}\`;
    const url = this.getFullUrl(endpoint);
    try {
      const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(data) });
      return this.handleResponse(res);
    } catch (err: any) {
      throw new Error(\`Connection Failed: Could not reach \${url}.\`);
    }
  }
`;
    content = content.replace("async get(", patchMethod + "\n  async get(");
  }
  
  fs.writeFileSync('services/api.ts', content);
}
