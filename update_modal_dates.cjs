const fs = require('fs');

function patchFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    
    if (!content.includes('import { formatDate }')) {
        content = content.replace(
            /import \{ Client \} from '\.\.\/types';/,
            "import { Client } from '../types';\nimport { formatDate } from '../exportUtils';"
        );
    }

    if (file.includes('GSTDetailModal')) {
        content = content.replace(
            /value=\{client\.gstProfile\?\.regDate\}/g,
            "value={formatDate(client.gstProfile?.regDate)}"
        );
        content = content.replace(
            /value=\{client\.gstProfile\?\.cancelDate\}/g,
            "value={formatDate(client.gstProfile?.cancelDate)}"
        );
    }

    if (file.includes('ITDetailModal')) {
        content = content.replace(
            /value=\{client\.itProfile\?\.dob\}/g,
            "value={formatDate(client.itProfile?.dob)}"
        );
    }
    
    fs.writeFileSync(file, content);
    console.log('Patched dates in', file);
}

patchFile('components/GSTDetailModal.tsx');
patchFile('components/ITDetailModal.tsx');
