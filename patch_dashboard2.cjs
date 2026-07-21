const fs = require('fs');

let c = fs.readFileSync('pages/Primary/Dashboard.tsx', 'utf8');

c = c.replace(
  /import \{ YEARS, FY_MONTHS, FY_QUARTERS, getDefaultPeriod \} from '\.\.\/Compliance\/GSTReturn\/filinglogic\/MonthlyFilingLogic';/g,
  `import { YEARS, FY_MONTHS, FY_QUARTERS, getDefaultPeriod, isClientVisibleInPeriod, periodToDate } from '../Compliance/GSTReturn/filinglogic/MonthlyFilingLogic';`
);

// We need to modify getFilingCounts to accept year and month/quarter for filtering
// Wait, I can just use string parsing on periodKey, because periodKey is `${year}_${month}` or `${year}_${quarter}`.
// Better: update getFilingCounts to pass year and period (month or quarter) or simply change the arguments.

