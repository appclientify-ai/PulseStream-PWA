const fs = require('fs');
let c = fs.readFileSync('pages/Clientform/NoticeForm.tsx', 'utf8');

c = c.replace(
  /const \{ _id, isDemandPaid, \.\.\.rest \} = initialData as any;\n\s*const prevDetails =/,
  `const { _id, isDemandPaid, ...rest } = initialData as any;
        if (category !== initialData.category) {
          delete rest.id;
        }
        const prevDetails =`
);

fs.writeFileSync('pages/Clientform/NoticeForm.tsx', c);
console.log("Patched NoticeForm.tsx escalation id stripping");
