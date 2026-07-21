const fs = require('fs');
let c = fs.readFileSync('pages/Clientform/NoticeForm.tsx', 'utf8');

c = c.replace(
  /const \{ id, _id, isDemandPaid, \.\.\.rest \} = initialData as any;/,
  `const { _id, isDemandPaid, ...rest } = initialData as any;`
);

fs.writeFileSync('pages/Clientform/NoticeForm.tsx', c);
console.log("Patched NoticeForm.tsx");
