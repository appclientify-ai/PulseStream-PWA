const fs = require('fs');
const file = 'pages/Primary/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const importStr = "import UpcomingDeadlinesWidget from '../../components/UpcomingDeadlinesWidget.tsx';";
if (content.includes(importStr)) {
  content = content.replace(importStr, importStr + "\nimport PerformanceChartWidget from '../../components/PerformanceChartWidget.tsx';");
}

fs.writeFileSync(file, content);
console.log("Patched chart import");
