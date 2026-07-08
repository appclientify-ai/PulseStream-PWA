const fs = require('fs');
const file = 'services/api.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /this\.getMiscWork\(\)\n    \]\);/g,
  `this.getMiscWork(),
      this.getGSTRegistrations(),
      this.getFoodLicenses(),
      this.getMSMERegistrations()
    ]);`
);

content = content.replace(
  /work: results\[3\]\.status === 'fulfilled' \? results\[3\]\.value : \[\]\n    \};/,
  `work: results[3].status === 'fulfilled' ? results[3].value : [],
      gstReg: results[4].status === 'fulfilled' ? results[4].value : [],
      foodLic: results[5].status === 'fulfilled' ? results[5].value : [],
      msme: results[6].status === 'fulfilled' ? results[6].value : []
    };`
);

fs.writeFileSync(file, content);
console.log("Patched api.ts for dashboard summary");
