const fs = require('fs');
const files = [
  'd:/Projects/yukizi/yakuzi-web/apps/buyer/src/components/products/QuickViewModal.tsx',
  'd:/Projects/yukizi/yakuzi-web/apps/buyer/src/components/landing/QuickReviewModal.tsx',
  'd:/Projects/yukizi/yakuzi-web/apps/buyer/src/app/orders/[orderId]/page.tsx'
];
files.forEach(p => {
  let txt = fs.readFileSync(p, 'utf8');
  txt = txt.replace(/toLocaleString\('en-IN',\s*\{\s*minimumFractionDigits:\s*2\s*\}\)/g, "toLocaleString('en-IN')");
  fs.writeFileSync(p, txt);
});
