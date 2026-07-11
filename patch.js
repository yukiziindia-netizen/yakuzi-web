const fs = require('fs');
const path = 'd:/Projects/yukizi/yakuzi-web/apps/seller/app/orders/[id]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /const discountDetails = item\.sellerOffer\?\.discountMeta \|\| \{\};\s*const mappedDiscount = \{\s*\.\.\.discountDetails,\s*type: item\.sellerOffer\?\.discountType \|\| discountDetails\.type \|\| 'none',\s*isTaxIncluded: item\.sellerOffer\?\.isTaxIncluded \|\| false,\s*shippingCharges,\s*shippingGstPercent: 0\s*\};\s*const platformFees = \{\s*commissionPercent: item\.sellerOffer\?\.variant\?\.catalogProduct\?\.commissionPercent \? Number\(item\.sellerOffer\.variant\.catalogProduct\.commissionPercent\) : 5,\s*\/\/ fallback to 5% if missing for display\s*commissionGstPercent: item\.sellerOffer\?\.variant\?\.catalogProduct\?\.commissionGstPercent \? Number\(item\.sellerOffer\.variant\.catalogProduct\.commissionGstPercent\) : 18\s*\};/,
  `const discountDetails = item.sellerOffer?.discountMeta || {};
                  const mappedDiscount = {
                    ...discountDetails,
                    type: item.sellerOffer?.discountType || discountDetails.type || 'none',
                    discountPercent: Number(item.sellerOffer?.discount ?? discountDetails.discountPercent ?? 0),
                    isTaxIncluded: item.sellerOffer?.isTaxIncluded || false,
                    shippingCharges,
                    shippingGstPercent: 0
                  };
                  
                  const itemCatProduct = item.sellerOffer?.variant?.catalogProduct;
                  const itemCat = itemCatProduct?.category;
                  const platformFees = {
                    commissionPercent: (itemCat?.commissionPercent !== undefined && itemCat?.commissionPercent !== null) ? Number(itemCat.commissionPercent) : (itemCatProduct?.commissionPercent !== undefined && itemCatProduct?.commissionPercent !== null ? Number(itemCatProduct.commissionPercent) : 5),
                    commissionGstPercent: (itemCat?.commissionGstPercent !== undefined && itemCat?.commissionGstPercent !== null) ? Number(itemCat.commissionGstPercent) : (itemCatProduct?.commissionGstPercent !== undefined && itemCatProduct?.commissionGstPercent !== null ? Number(itemCatProduct.commissionGstPercent) : 18),
                    fixedFee: (itemCat?.fixedFee !== undefined && itemCat?.fixedFee !== null) ? Number(itemCat.fixedFee) : (itemCatProduct?.fixedFee !== undefined && itemCatProduct?.fixedFee !== null ? Number(itemCatProduct.fixedFee) : 0),
                    fixedFeeGstPercent: (itemCat?.fixedFeeGstPercent !== undefined && itemCat?.fixedFeeGstPercent !== null) ? Number(itemCat.fixedFeeGstPercent) : (itemCatProduct?.fixedFeeGstPercent !== undefined && itemCatProduct?.fixedFeeGstPercent !== null ? Number(itemCatProduct.fixedFeeGstPercent) : 18),
                    shippingGstPercent: (itemCat?.shippingGstPercent !== undefined && itemCat?.shippingGstPercent !== null) ? Number(itemCat.shippingGstPercent) : (itemCatProduct?.shippingGstPercent !== undefined && itemCatProduct?.shippingGstPercent !== null ? Number(itemCatProduct.shippingGstPercent) : 18),
                  };`
);

content = content.replace(
  /const displayCommissionPercent = firstItem\.sellerOffer\?\.variant\?\.catalogProduct\?\.commissionPercent \? Number\(firstItem\.sellerOffer\.variant\.catalogProduct\.commissionPercent\) : 5;\s*const displayCommissionGstPercent = firstItem\.sellerOffer\?\.variant\?\.catalogProduct\?\.commissionGstPercent \? Number\(firstItem\.sellerOffer\.variant\.catalogProduct\.commissionGstPercent\) : 18;/,
  `const catProduct = firstItem.sellerOffer?.variant?.catalogProduct;
              const cat = catProduct?.category;
              
              const displayCommissionPercent = (cat?.commissionPercent !== undefined && cat?.commissionPercent !== null) 
                ? Number(cat.commissionPercent) 
                : (catProduct?.commissionPercent !== undefined && catProduct?.commissionPercent !== null ? Number(catProduct.commissionPercent) : 5);
                
              const displayCommissionGstPercent = (cat?.commissionGstPercent !== undefined && cat?.commissionGstPercent !== null)
                ? Number(cat.commissionGstPercent)
                : (catProduct?.commissionGstPercent !== undefined && catProduct?.commissionGstPercent !== null ? Number(catProduct.commissionGstPercent) : 18);`
);

content = content.replace(
  /\{items\.map\(\(item: any, i: number\) => \(\s*<div key=\{i\} className="flex items-center gap-4 p-5">\s*<div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">\s*\{item\.product\?\.images\?\.\[0\]\?\.url \|\| item\.image \|\| item\.sellerOffer\?\.images\?\.\[0\] \|\| item\.sellerOffer\?\.variant\?\.catalogProduct\?\.images\?\.\[0\]\?\.url \? \(\s*<img src=\{item\.product\?\.images\?\.\[0\]\?\.url \|\| item\.image \|\| item\.sellerOffer\?\.images\?\.\[0\] \|\| item\.sellerOffer\?\.variant\?\.catalogProduct\?\.images\?\.\[0\]\?\.url\} alt=\{item\.product\?\.name \|\| item\.name \|\| item\.productName \|\| item\.sellerOffer\?\.name\} className="h-14 w-14 rounded-xl object-cover" \/>\s*\) : \(\s*<Package className="h-6 w-6 text-muted-foreground" \/>\s*\)\s*\}/,
  `{items.map((item: any, i: number) => {
                const itemImage = typeof item.sellerOffer?.images?.[0] === 'string' ? item.sellerOffer.images[0] : item.sellerOffer?.images?.[0]?.url
                  || typeof item.product?.images?.[0] === 'string' ? item.product.images[0] : item.product?.images?.[0]?.url
                  || typeof item.sellerOffer?.variant?.catalogProduct?.images?.[0] === 'string' ? item.sellerOffer.variant.catalogProduct.images[0] : item.sellerOffer?.variant?.catalogProduct?.images?.[0]?.url
                  || item.image;
                  
                return (
                <div key={i} className="flex items-center gap-4 p-5">
                  <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    {itemImage ? (
                      <img src={itemImage} alt={item.product?.name || item.name || item.productName || item.sellerOffer?.name} className="h-14 w-14 rounded-xl object-cover" />
                    ) : (
                      <Package className="h-6 w-6 text-muted-foreground" />
                    )}`
);

content = content.replace(
  /<p className="text-sm font-semibold text-foreground">\{formatCurrency\(\(item\.quantity \|\| 1\) \* \(item\.unitPrice \|\| item\.price \|\| 0\)\)\}<\/p>\s*<\/div>\s*\)\)\}/,
  `<p className="text-sm font-semibold text-foreground">{formatCurrency((item.quantity || 1) * (item.unitPrice || item.price || 0))}</p>
                </div>
              )})}`
);

fs.writeFileSync(path, content);
console.log("Done");
