const fs = require('fs');
const file = 'pages/Primary/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const importStr = "import UpcomingDeadlinesWidget from '../../components/UpcomingDeadlinesWidget';";
if (content.includes(importStr)) {
  content = content.replace(importStr, importStr + "\nimport PerformanceChartWidget from '../../components/PerformanceChartWidget';");
}

const gridStr = `<div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
              <div className="col-span-1 xl:col-span-2 min-h-[400px]">
                 <UpcomingDeadlinesWidget />
              </div>`;

const newGridStr = `<div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
              <div className="col-span-1 min-h-[400px]">
                 <UpcomingDeadlinesWidget />
              </div>
              <div className="col-span-1 min-h-[400px]">
                 <PerformanceChartWidget clients={clients} />
              </div>`;

if (content.includes(gridStr)) {
  content = content.replace(gridStr, newGridStr);
}

fs.writeFileSync(file, content);
console.log("Patched chart into Dashboard");
