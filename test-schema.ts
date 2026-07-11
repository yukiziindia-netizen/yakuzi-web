import { z } from "zod";

const discountFormDetailsSchema = z.object({
  type: z.enum([
    'none',
    'ptr_discount',
    'same_product_bonus',
    'ptr_discount_and_same_product_bonus',
    'different_product_bonus',
    'ptr_discount_and_different_product_bonus',
    'special_price',
  ]),
  discountPercent: z.preprocess((val) => (val === '' || val === null || isNaN(Number(val))) ? undefined : Number(val), z.number().min(0).max(100).optional()),
  buy: z.preprocess((val) => (val === '' || val === null || isNaN(Number(val))) ? undefined : Number(val), z.number().int().min(1).optional()),
  get: z.preprocess((val) => (val === '' || val === null || isNaN(Number(val))) ? undefined : Number(val), z.number().int().min(1).optional()),
  bonusProductName: z.string().optional(),
  specialPrice: z.preprocess((val) => (val === '' || val === null || isNaN(Number(val))) ? undefined : Number(val), z.number().min(0).optional()),
});

const schema = z.object({
  discount_form_details: discountFormDetailsSchema
}).refine((data) => {
  const d = data.discount_form_details;
  if (['ptr_discount', 'ptr_discount_and_same_product_bonus', 'ptr_discount_and_different_product_bonus'].includes(d.type)) {
    if (d.discountPercent === undefined || d.discountPercent < 0) return false;
  }
  return true;
}, {
  message: 'Discount percentage is required for this discount type',
  path: ['discount_form_details', 'discountPercent'],
});

const result1 = schema.safeParse({ discount_form_details: { type: "ptr_discount", discountPercent: 0 } });
console.log("0 test:", result1.success ? "Pass" : result1.error.errors);

const result2 = schema.safeParse({ discount_form_details: { type: "ptr_discount", discountPercent: undefined } });
console.log("undefined test:", result2.success ? "Pass" : result2.error.errors);

const result3 = schema.safeParse({ discount_form_details: { type: "ptr_discount", discountPercent: "" } });
console.log("empty string test:", result3.success ? "Pass" : result3.error.errors);

const result4 = schema.safeParse({ discount_form_details: { type: "ptr_discount", discountPercent: null } });
console.log("null test:", result4.success ? "Pass" : result4.error.errors);
