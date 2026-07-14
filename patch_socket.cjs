const fs = require('fs');
let content = fs.readFileSync('services/socket.ts', 'utf8');

const updated = `
      this.socket.on('db_item_change', (payload) => {
        console.debug('Real-time update received:', payload);
        window.dispatchEvent(new CustomEvent('clientify_db_change', { detail: payload }));
      });
`;

const insertIndex = content.indexOf(`this.socket.on('disconnect',`);
if (insertIndex > -1) {
  content = content.substring(0, insertIndex) + updated + '\n      ' + content.substring(insertIndex);
  fs.writeFileSync('services/socket.ts', content);
} else {
  console.log('Could not find insert index');
}
