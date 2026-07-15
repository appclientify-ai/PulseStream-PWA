const fs = require('fs');
let content = fs.readFileSync('backend/src/routes/items.routes.js', 'utf8');

if (!content.includes('patchAppData')) {
  content = content.replace('updateItem, deleteItem }', 'updateItem, deleteItem, patchAppData }');
  content = content.replace('router.get(\'/\', getItems);', 'router.patch(\'/app_data/:key/patch\', patchAppData);\nrouter.get(\'/\', getItems);');
  fs.writeFileSync('backend/src/routes/items.routes.js', content);
}
