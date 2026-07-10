const fs = require('fs');
const file = 'pages/Administration/invoice/invoicesetting.tsx';
let content = fs.readFileSync(file, 'utf8');

const newUpload = `  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'firmLogo' | 'firmSignature') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL(file.type, 0.7);
          setSettings(prev => ({ ...prev, [field]: dataUrl }));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };`;

content = content.replace(/const handleImageUpload =[\s\S]*?reader\.readAsDataURL\(file\);\n    }\n  };/, newUpload);

fs.writeFileSync(file, content);
console.log("Patched invoicesetting.tsx");
