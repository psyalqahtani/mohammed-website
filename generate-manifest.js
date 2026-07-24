// هذا السكريبت يولّد manifest.json تلقائياً
// شغّله من Netlify Build Command أو يدوياً

const fs = require('fs');
const path = require('path');

['data/articles', 'data/library', 'data/courses'].forEach(folder => {
  if (!fs.existsSync(folder)) { fs.mkdirSync(folder, { recursive: true }); return; }
  const files = fs.readdirSync(folder).filter(f => f.endsWith('.json') && f !== 'manifest.json' && f !== 'index.json');
  fs.writeFileSync(path.join(folder, 'manifest.json'), JSON.stringify(files));
  console.log(`✓ ${folder}/manifest.json → [${files.join(', ')}]`);
});
