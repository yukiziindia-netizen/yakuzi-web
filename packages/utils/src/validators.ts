import { z } from 'zod';
import { VALID_GST_PERCENTAGES } from './pricing';

/**
 * Validate an Indian phone number (10 digits, optionally prefixed with +91).
 */
export function isValidPhone(phone: string): boolean {
  return /^(\+91)?[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
}

/**
 * Validate an email address.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate a 6-digit OTP.
 */
export function isValidOtp(otp: string): boolean {
  return /^\d{6}$/.test(otp);
}

/**
 * Validate a pincode (6 digits for Indian pincodes).
 */
export function isValidPincode(pincode: string): boolean {
  return /^\d{6}$/.test(pincode);
}

/**
 * Validate a GST number.
 */
export function isValidGST(gst: string): boolean {
  return /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/.test(gst);
}

/**
 * Validate a PAN number.
 */
export function isValidPAN(pan: string): boolean {
  return /^[A-Z]{5}\d{4}[A-Z]{1}$/.test(pan);
}

// --- Zod Schemas ------------------------------------

export const phoneSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 digits')
  .refine(isValidPhone, 'Invalid phone number');

export const emailSchema = z.string().email('Invalid email address');

export const otpSchema = z
  .string()
  .length(6, 'OTP must be 6 digits')
  .refine(isValidOtp, 'OTP must contain only digits');

export const pincodeSchema = z
  .string()
  .length(6, 'Pincode must be 6 digits')
  .refine(isValidPincode, 'Invalid pincode');

export const gstSchema = z
  .string()
  .length(15, 'GST must be 15 characters')
  .refine(isValidGST, 'Invalid GST number');

export const panSchema = z
  .string()
  .length(10, 'PAN must be 10 characters')
  .refine(isValidPAN, 'Invalid PAN number');

// --- Product Validation ----------------------------

const validGstValues = VALID_GST_PERCENTAGES as readonly number[];

export const discountFormDetailsSchema = z.object({
  type: z.enum([
    'none',
    'ptr_discount',
    'same_product_bonus',
    'ptr_discount_and_same_product_bonus',
    'different_product_bonus',
    'ptr_discount_and_different_product_bonus',
    'special_price',
  ]),
  discountPercent: z.number().min(0).max(100).optional(),
  buy: z.number().int().min(1).optional(),
  get: z.number().int().min(1).optional(),
  bonusProductName: z.string().optional(),
  specialPrice: z.number().min(0).optional(),
});

export const productFormSchema = z.object({
  product_name: z.string().min(2, 'Product name must be at least 2 characters'),
  product_price: z.preprocess((val) => Number(val) || 0, z.number()),
  compare_at_price: z.preprocess((val) => Number(val) || 0, z.number()).optional(),
  gst_percent: z.preprocess((val) => Number(val) || 0, z.number()).optional(),
  is_tax_included: z.boolean().default(false).optional(),
  unit: z.string().optional(),
  pack_size: z.string().optional(),
  company_name: z.string().min(2, 'Company name is required'),
  sku: z.string().optional(),
  serialNo: z.string().optional(),
  specifications: z.string().optional(),
  chemical_combination: z.string().optional(),
  categories: z.array(z.string()).min(1, 'Select at least one category'),
  sub_categories: z.array(z.string()).min(1, 'Select at least one sub-category'),
  stock: z.preprocess((val) => Number(val) || 0, z.number().int()),
  min_order_qty: z.preprocess((val) => Number(val) || 0, z.number().int()),
  max_order_qty: z.preprocess((val) => Number(val) || 0, z.number().int()),
  delivery_text: z.string().optional(),
  shipping_charges: z.preprocess((val) => Number(val) || 0, z.number()).optional(),
  image_list: z.array(z.string()).optional().default([]),
  custom_extra_fields: z.array(z.object({ key: z.string().min(1), value: z.string().min(1) })),
  discount_form_details: discountFormDetailsSchema,
  options: z.array(z.any()).optional(),
  variants: z.array(z.any()).optional(),
}).superRefine((data, ctx) => {
  const hasVariants = data.variants && data.variants.length > 0;
  
  if (!hasVariants && data.product_price > 0) {
    if (data.stock < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Stock cannot be negative', path: ['stock'] });
    }
    if (data.min_order_qty < 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Minimum 1 required', path: ['min_order_qty'] });
    }
    if (data.max_order_qty < 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Minimum 1 required', path: ['max_order_qty'] });
    }
  }
}).refine((data) => {
  if (data.variants && data.variants.length > 0) return true;
  if (data.product_price <= 0) return true;
  return data.min_order_qty <= data.max_order_qty;
}, {
  message: 'Max order qty must be >= min order qty',
  path: ['max_order_qty'],
}).refine((data) => {
  if (data.variants && data.variants.length > 0) return true;
  if (data.product_price <= 0) return true;
  return data.stock >= data.min_order_qty;
}, {
  message: 'Current stock must be at least equal to minimum order quantity',
  path: ['stock'],
}).refine((data) => {
  if (data.variants && data.variants.length > 0) return true;
  if (data.product_price <= 0) return true;
  return data.min_order_qty <= data.stock;
}, {
  message: 'Minimum order quantity cannot exceed current stock',
  path: ['min_order_qty'],
}).refine((data) => {
  const d = data.discount_form_details;
  // Types that require discount percent
  if (['ptr_discount', 'ptr_discount_and_same_product_bonus', 'ptr_discount_and_different_product_bonus'].includes(d.type)) {
    if (d.discountPercent === undefined || d.discountPercent < 0) return false;
  }
  return true;
}, {
  message: 'Discount percentage is required for this discount type',
  path: ['discount_form_details', 'discountPercent'],
}).refine((data) => {
  const d = data.discount_form_details;
  // Types that require buy/get
  if (['same_product_bonus', 'ptr_discount_and_same_product_bonus', 'different_product_bonus', 'ptr_discount_and_different_product_bonus'].includes(d.type)) {
    if (!d.buy || d.buy < 1 || !d.get || d.get < 1) return false;
  }
  return true;
}, {
  message: 'Buy and Get quantities are required for bonus discount types',
  path: ['discount_form_details', 'buy'],
}).refine((data) => {
  const d = data.discount_form_details;
  // Different product bonus requires product name
  if (['different_product_bonus', 'ptr_discount_and_different_product_bonus'].includes(d.type)) {
    if (!d.bonusProductName || d.bonusProductName.trim().length === 0) return false;
  }
  return true;
}, {
  message: 'Bonus product name is required for different product bonus',
  path: ['discount_form_details', 'bonusProductName'],
}).refine((data) => {
  const d = data.discount_form_details;
  // Special price requires the price value
  if (d.type === 'special_price') {
    if (d.specialPrice === undefined || d.specialPrice <= 0) return false;
  }
  return true;
}, {
  message: 'Special price is required',
  path: ['discount_form_details', 'specialPrice'],
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
