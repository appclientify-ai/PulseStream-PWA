const fs = require('fs');

const file = 'pages/Primary/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<\/div>\s*<\/div>\s*<\/section>\s*{\/\* Sector 1: Client Hub \*\/}/;

const newString = `                     </div>
                  </div>
               </section>
              </div>
              <div className="col-span-1 min-h-[400px]">
                 <UpcomingDeadlinesWidget />
              </div>
            </div>
            {/* Sector 1: Client Hub */}`;

if (regex.test(content)) {
    content = content.replace(regex, newString);
    fs.writeFileSync(file, content);
    console.log("Fixed Dashboard");
} else {
    console.log("Regex did not match");
}
