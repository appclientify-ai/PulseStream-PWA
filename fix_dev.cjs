const fs = require('fs');

let pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts.dev = "node backend/src/server.js";
pkg.scripts.build = "vite build && echo 'Backend doesn\\'t need compile'";
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));

let viteConf = fs.readFileSync('vite.config.ts', 'utf8');
viteConf = viteConf.replace(/proxy:\s*\{[^}]+\},?/s, ''); // just drop the proxy config roughly, or just let it be. Actually let's just leave vite.config.ts alone.
