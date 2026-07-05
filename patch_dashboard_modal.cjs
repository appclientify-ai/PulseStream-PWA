const fs = require('fs');
const file = 'pages/Primary/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// The modal is marked with {/* Central Navigation Modal */}
// We can just remove the whole block.
const modalStart = content.indexOf('{/* Central Navigation Modal */}');
const modalEnd = content.indexOf('<CommandPalette');

if (modalStart !== -1 && modalEnd !== -1) {
    content = content.slice(0, modalStart) + content.slice(modalEnd);
    fs.writeFileSync(file, content);
    console.log('Removed modal from Dashboard');
} else {
    console.log('Could not find modal bounds');
}
