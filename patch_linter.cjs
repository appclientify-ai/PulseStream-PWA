const fs = require('fs');
const file = 'components/UpcomingDeadlinesWidget.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("} catch (e) {}", "} catch (e) { console.error(e); }");
fs.writeFileSync(file, content);
console.log("Patched linter issue");
