const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
      let txt = fs.readFileSync(p, 'utf8');
      let changed = false;
      
      // Match something.toLocaleString
      const regex1 = /([a-zA-Z0-9_\.\?\[\]]+)\.toLocaleString\('en-IN', \{ minimumFractionDigits: 2, maximumFractionDigits: 2 \}\)/g;
      txt = txt.replace(regex1, (m, g1) => {
        // If it's already Number(something), don't wrap it again
        if (g1.startsWith('Number(')) return m;
        // If it's Math.round(something), don't wrap it
        if (g1.startsWith('Math.round(')) return m;
        changed = true;
        return `Number(${g1}).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`;
      });
      
      // Match (something).toLocaleString
      const regex2 = /\(([^)]+)\)\.toLocaleString\('en-IN', \{ minimumFractionDigits: 2, maximumFractionDigits: 2 \}\)/g;
      txt = txt.replace(regex2, (m, g1) => {
        if (g1.startsWith('Number(')) return m;
        if (g1.startsWith('Math.round(')) return m;
        changed = true;
        return `Number(${g1}).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`;
      });
      
      if (changed) {
        fs.writeFileSync(p, txt);
      }
    }
  }
}

walk('d:/Projects/yukizi/yakuzi-web/apps/buyer/src');
console.log('Done');
