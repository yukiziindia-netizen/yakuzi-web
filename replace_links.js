const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('D:/Projects/Yakuzi/yakuzi-web/apps/buyer/src');

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  let init = c;
  
  c = c.replace(/router\.push\('\/products'\)/g, `router.push('/')`);
  c = c.replace(/router\.replace\('\/products'\)/g, `router.replace('/')`);
  c = c.replace(/href="\/products"/g, `href="/"`);
  c = c.replace(/actionHref="\/products"/g, `actionHref="/"`);
  c = c.replace(/promotion: '\/products'/g, `promotion: '/'`);
  c = c.replace(/`\/products\?/g, `\`/?`);
  c = c.replace(/href: '\/products'/g, `href: '/'`);

  if (c !== init) fs.writeFileSync(f, c, 'utf8');
});

console.log('Replaced links!');
