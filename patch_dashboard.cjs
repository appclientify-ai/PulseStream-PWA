const fs = require('fs');

const file = 'pages/Primary/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('UpcomingDeadlinesWidget')) {
    // Add import
    content = content.replace(
        /import CommandPalette from '\.\.\/\.\.\/components\/CommandPalette\.tsx';/,
        "import CommandPalette from '../../components/CommandPalette.tsx';\nimport UpcomingDeadlinesWidget from '../../components/UpcomingDeadlinesWidget.tsx';"
    );
    
    // Replace Attention Summary Card with Grid
    const oldSection = `{/* Attention Summary Card */}
            <section className="mb-8">
               <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">`;
               
    const newSection = `<div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
              <div className="col-span-1 xl:col-span-2">
                {/* Attention Summary Card */}
                <section className="h-full">
                  <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 h-full">`;
    
    content = content.replace(oldSection, newSection);
    
    const oldEnd = `                     </div>
                  </div>
               </div>
            </section>
            {/* Sector 1: Client Hub */}`;
            
    const newEnd = `                     </div>
                  </div>
               </div>
            </section>
            </div>
            <div className="col-span-1">
               <UpcomingDeadlinesWidget />
            </div>
            </div>
            {/* Sector 1: Client Hub */}`;

    content = content.replace(oldEnd, newEnd);
    
    fs.writeFileSync(file, content);
    console.log("Patched Dashboard");
}
