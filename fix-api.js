const fs = require('fs');

let f = fs.readFileSync('packages/api-client/src/modules/products.api.ts', 'utf8');

// Update ProductSchema to be more permissive due to backend changes
f = f.replace(/export const ProductSchema = z\.object\(\{[\s\S]*?\}\);/g, `export const ProductSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  chemicalComposition: z.string().optional(),
  price: z.number().optional(),
  mrp: z.number().optional(),
  category: z.any().optional(),
  subCategory: z.any().optional(),
  manufacturer: z.string().optional(),
  image: z.string().nullable().optional(),
  images: z.any().optional(),
  stock: z.number().optional(),
  isActive: z.boolean().optional(),
  status: z.any().optional(),
  approvalStatus: z.any().optional(),
  sellerId: z.string().optional(),
  sellerName: z.string().optional(),
  minimumOrderQuantity: z.number().optional(),
  moq: z.number().optional(),
  maximumOrderQuantity: z.number().optional(),
  bestListingId: z.string().nullable().optional(),
  hasSellers: z.boolean().optional(),
  sellerCount: z.number().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough();`);

fs.writeFileSync('packages/api-client/src/modules/products.api.ts', f);
console.log("Updated products.api.ts schema");
