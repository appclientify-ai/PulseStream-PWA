const fs = require('fs');
const messengerFile = 'pages/Administration/Messenger.tsx';
let content = fs.readFileSync(messengerFile, 'utf8');
content = content.replace(
    /window\.open\(url, '_blank'\);/g,
    "window.location.href = url;"
);
fs.writeFileSync(messengerFile, content);
console.log('Patched window.open in', messengerFile);
