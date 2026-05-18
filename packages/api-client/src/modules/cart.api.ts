import { z } from 'zod';
import { api } from '../api';

// ─── Schemas ────────────────────────────────────────
// Matches the actual NestJS backend response structure

export const CartItemSchema = z.object({
  id: z.string(),
  productId: z.string().optional(),
  productName: z.string().optional(),
  name: z.string().optional(),
  price: z.number(),
  quantity: z.number(),
  total: z.number().optional(),
  image: z.string().optional(),
  product: z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    mrp: z.number().optional(),
    images: z.array(z.string()).optional(),
    manufacturer: z.string().optional(),
    minimumOrderQuantity: z.number().optional(),
    maximumOrderQuantity: z.number().optional(),
    stock: z.number().optional(),
    medicineType: z.string().optional(),
    seller: z.object({
      id: z.string().optional(),
      companyName: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      rating: z.number().optional(),
    }).optional(),
  }).optional(),
});

export const CartSchema = z.object({
  id: z.string().optional(),
  items: z.array(CartItemSchema),
  subtotal: z.number().optional(),
  total: z.number().optional(),
  itemCount: z.number().optional(),
});

// ─── Types ──────────────────────────────────────────

export type CartItem = z.infer<typeof CartItemSchema>;
export type Cart = z.infer<typeof CartSchema>;

// ─── Response Mapping ───────────────────────────────
// Backend wraps responses in { message, data } and uses different field names.
// This normalizes backend cart data into our frontend Cart type.

function mapBackendCartItem(raw: any): CartItem {
  const product = raw.product || {};
  return {
    id: raw.id,
    productId: raw.productId || product.id,
    productName: product.name,
    name: product.name,
    price: raw.unitPrice ?? product.price ?? product.mrp ?? 0,
    quantity: raw.quantity,
    total: raw.totalPrice ?? (raw.unitPrice ?? 0) * (raw.quantity ?? 0),
    image: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : undefined,
    product: product.id ? {
      id: product.id,
      name: product.name,
      price: raw.unitPrice ?? product.price ?? product.mrp ?? 0,
      mrp: product.mrp,
      images: Array.isArray(product.images) ? product.images : [],
      manufacturer: product.manufacturer,
      minimumOrderQuantity: product.minimumOrderQuantity,
      maximumOrderQuantity: product.maximumOrderQuantity,
      stock: product.stock,
      medicineType: product.medicineType,
      seller: product.seller,
    } : undefined,
  };
}

function mapBackendCart(responseData: any): Cart {
  // Backend returns: { message, data: { cartId, items, totalAmount } }
  const payload = responseData?.data ?? responseData;
  const rawItems = Array.isArray(payload?.items) ? payload.items : [];
  const items = rawItems.map(mapBackendCartItem);
  const subtotal = payload?.totalAmount ?? items.reduce((sum: number, i: CartItem) => sum + (i.price * i.quantity), 0);

  return {
    id: payload?.cartId || payload?.id,
    items,
    subtotal,
    total: subtotal,
    itemCount: items.length,
  };
}

const emptyCart: Cart = { items: [], subtotal: 0, total: 0, itemCount: 0 };

// ─── API Functions ──────────────────────────────────

export async function getCart(): Promise<Cart> {
  try {
    const response = await api.get('/cart');
    const cart = mapBackendCart(response.data);
    console.log('[Cart] Fetched cart with', cart.items.length, 'items');
    return cart;
  } catch (err) {
    console.error('[Cart] Error fetching cart:', err);
    return { ...emptyCart };
  }
}

export async function addToCart(productId: string, quantity: number = 1): Promise<Cart> {
  try {
    const response = await api.post('/cart/add', { productId, quantity });
    // On success, backend may return the new cart or just the item — refetch to be sure
    return mapBackendCart(response.data);
  } catch (err: any) {
    // Re-throw API errors (like "already in cart") so hooks can handle them
    if (err?.response) {
      console.log('[Cart] API error:', err.response.status, err.response.data?.message);
      throw err;
    }
    // Network errors
    throw err;
  }
}

export async function updateCartItem(itemId: string, quantity: number): Promise<Cart> {
  try {
    await api.patch(`/cart/item/${itemId}`, { quantity });
    // PATCH returns the single updated item, not the full cart.
    // Fetch fresh cart to get the complete state.
    return await getCart();
  } catch (err) {
    console.error('[Cart] Error updating cart item:', err);
    throw err;
  }
}

export async function removeCartItem(itemId: string): Promise<Cart> {
  try {
    await api.delete(`/cart/item/${itemId}`);
    // DELETE returns { message } only — fetch fresh cart.
    return await getCart();
  } catch (err) {
    console.error('[Cart] Error removing cart item:', err);
    throw err;
  }
}

export async function clearCart(): Promise<void> {
  try {
    await api.delete('/cart');
  } catch (err) {
    console.error('[Cart] Error clearing cart:', err);
    throw err;
  }
}
