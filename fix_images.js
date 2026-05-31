const fs = require('fs');

const getInitialsString = (nameVar) => {
  return `\`https://placehold.co/400x400/10b981/ffffff?text=\\$\\{encodeURIComponent((${nameVar} || 'PR').trim().split(/\\s+/).length === 1 ? (${nameVar} || 'PR').trim().substring(0,2).toUpperCase() : ((${nameVar} || 'PR').trim().split(/\\s+/)[0][0] + (${nameVar} || 'PR').trim().split(/\\s+/)[(${nameVar} || 'PR').trim().split(/\\s+/).length - 1][0]).toUpperCase())}\\`\``;
};

let c = fs.readFileSync('D:/Projects/Yakuzi/yakuzi-web/apps/buyer/src/app/products/[productSlug]/page.tsx', 'utf8');

c = c.replace(/'https:\/\/placehold\.co\/400x400\/10b981\/ffffff\?text='/g, function(match, offset) {
  // Check the context to know if we're in the images array or the single img tag
  if (c.substring(offset - 20, offset).includes("img.url || img)")) {
    return getInitialsString("product.name");
  } else {
    return getInitialsString("prod.name");
  }
});

fs.writeFileSync('D:/Projects/Yakuzi/yakuzi-web/apps/buyer/src/app/products/[productSlug]/page.tsx', c, 'utf8');
console.log('Fixed product details page');
