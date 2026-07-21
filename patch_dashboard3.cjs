const fs = require('fs');

let c = fs.readFileSync('pages/Primary/Dashboard.tsx', 'utf8');

c = c.replace(
  /import \{ YEARS, FY_MONTHS, FY_QUARTERS, getDefaultPeriod \} from '\.\.\/Compliance\/GSTReturn\/filinglogic\/MonthlyFilingLogic';/,
  `import { YEARS, FY_MONTHS, FY_QUARTERS, getDefaultPeriod, isClientVisibleInPeriod, periodToDate } from '../Compliance/GSTReturn/filinglogic/MonthlyFilingLogic';`
);
fs.writeFileSync('pages/Primary/Dashboard.tsx', c);
