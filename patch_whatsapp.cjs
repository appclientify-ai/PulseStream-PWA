const fs = require('fs');

function patchFile(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Add state for Share Modal
  content = content.replace("const [isEditModalOpen, setIsEditModalOpen] = useState(false);", "const [isEditModalOpen, setIsEditModalOpen] = useState(false);\n  const [shareText, setShareText] = useState('');\n  const [isShareModalOpen, setIsShareModalOpen] = useState(false);\n  const [selectedNote, setSelectedNote] = useState('');");

  // Modify shareViaWhatsApp to just trigger the modal
  content = content.replace(
    "const shareViaWhatsApp = (text: string) => {\n    window.location.href = `whatsapp://send?text=${encodeURIComponent(text)}`;\n  };",
    `const handleShareClick = (text: string) => {
    setShareText(text);
    setIsShareModalOpen(true);
  };
  
  const proceedShare = () => {
    const final = shareText + (selectedNote ? '\\n\\n*Note:*\\n' + selectedNote : '');
    window.location.href = \`whatsapp://send?text=\${encodeURIComponent(final)}\`;
    setIsShareModalOpen(false);
  };`
  );

  // Replace shareViaWhatsApp calls
  content = content.replace(/shareViaWhatsApp\(creds\);/g, "handleShareClick(creds);");
  content = content.replace(/shareViaWhatsApp\(fullText\);/g, "handleShareClick(fullText);");

  // Add the Share Modal UI
  const modalUI = `
      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-black text-slate-900 uppercase mb-4">Append Note</h3>
            <textarea
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold outline-none h-32 mb-4 focus:ring-4 focus:ring-emerald-50"
              placeholder="Select a note or type here..."
              value={selectedNote}
              onChange={(e) => setSelectedNote(e.target.value)}
            />
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
               {(() => {
                 const saved = localStorage.getItem('clientify_custom_templates');
                 const templates = saved ? JSON.parse(saved) : [];
                 return templates.map((t: any, i: number) => (
                   <button key={i} onClick={() => setSelectedNote(t.text)} className="shrink-0 px-3 py-1.5 bg-slate-100 rounded-lg text-[10px] font-black uppercase text-slate-600 hover:bg-slate-200">{t.label}</button>
                 ));
               })()}
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsShareModalOpen(false)} className="flex-1 py-3 text-slate-500 font-black uppercase tracking-widest text-[10px] border border-slate-200 rounded-xl">Cancel</button>
              <button onClick={proceedShare} className="flex-1 py-3 bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-emerald-600/20">Share Now</button>
            </div>
          </div>
        </div>
      )}
  `;
  content = content.replace('{/* Client Details Modal */}', modalUI + '\n      {/* Client Details Modal */}');

  fs.writeFileSync(file, content);
  console.log("Patched " + file);
}

patchFile('pages/ClientHub/GstMasterPortfolio.tsx');
patchFile('pages/ClientHub/ItMasterPortfolio.tsx');
