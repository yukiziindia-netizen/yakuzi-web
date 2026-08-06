import { type Cart, type CartItem } from '@yukizi/api-client';

const STORAGE_KEY = 'yukizi_local_cart';

/**
 * Highest quantity an item may be raised to, given whatever we know about its
 * availability. Returns Infinity when nothing is known, so callers that never
 * supplied stock keep working exactly as before.
 */
const ceilingFor = (item: any): number => {
  const stock = item?.stock ?? item?.product?.stock;
  const perOrderLimit =
    item?.maximumOrderQuantity ?? item?.product?.maximumOrderQuantity;

  const limits = [stock, perOrderLimit].filter(
    (n): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0,
  );

  return limits.length > 0 ? Math.min(...limits) : Infinity;
};

export const localCart = {
  get: (): Cart => {
    if (typeof window === 'undefined') return { items: [], subtotal: 0, total: 0 };
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { items: [], subtotal: 0, total: 0 };
    try {
      const parsed = JSON.parse(stored);
      // Ensure it has everything needed by components — mapping total if missing
      return {
        ...parsed,
        subtotal: parsed.subtotal || 0,
        total: parsed.total || parsed.subtotal || 0,
      };
    } catch {
      return { items: [], subtotal: 0, total: 0 };
    }
  },

  set: (cart: Cart) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    // Trigger storage event for other tabs/components
    window.dispatchEvent(new Event('storage'));
  },

  addItem: (itemData: any, replace: boolean = false) => {
    const cart = localCart.get();
    const existingIndex = cart.items.findIndex(item => item.productId === itemData.productId);
    
    if (existingIndex > -1) {
      const existing = cart.items[existingIndex];
      const nextQuantity = replace
        ? itemData.quantity
        : existing.quantity + itemData.quantity;

      // Fold in whatever the caller supplied alongside the quantity, so details
      // that change over time — stock in particular — are refreshed rather than
      // frozen at whatever they were when the item first went into the cart.
      // Keys the caller omitted are left untouched.
      const { quantity: _ignored, ...refreshed } = itemData;
      const merged = {
        ...existing,
        ...refreshed,
        id: existing.id,
        quantity: nextQuantity,
      };

      // Last line of defence: never let the stored quantity exceed the stock we
      // know about, whichever screen the item was added from.
      merged.quantity = Math.min(merged.quantity, ceilingFor(merged));
      cart.items[existingIndex] = merged;

      // Remove item if quantity is 0 or less
      if (cart.items[existingIndex].quantity <= 0) {
        cart.items.splice(existingIndex, 1);
      }
    } else if (itemData.quantity > 0) {
      // Adding something already out of stock clamps to zero, and a
      // zero-quantity line would go on to be synced and ordered.
      const quantity = Math.min(itemData.quantity, ceilingFor(itemData));
      if (quantity > 0) {
        cart.items.push({
          id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...itemData,
          quantity,
        });
      }
    }
    
    // Recalculate totals
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price || item.product?.price || 0) * item.quantity, 0);
    cart.total = cart.subtotal;
    
    localCart.set(cart);
    return cart;
  },

  updateItem: (itemId: string, quantity: number) => {
    const cart = localCart.get();
    const existingIndex = cart.items.findIndex(i => i.id === itemId);
    
    if (existingIndex > -1) {
      // The cart drawer's +/- comes through here, so the same ceiling applies.
      // Clamping can land on zero when an item has sold out since it was added,
      // and a zero-quantity line left in the cart goes on to be synced and
      // ordered. Drop it instead.
      const clamped = Math.min(quantity, ceilingFor(cart.items[existingIndex]));
      if (clamped <= 0) {
        cart.items.splice(existingIndex, 1);
      } else {
        cart.items[existingIndex].quantity = clamped;
      }
      
      cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price || item.product?.price || 0) * item.quantity, 0);
      cart.total = cart.subtotal;
      localCart.set(cart);
    }
    return cart;
  },

  removeItem: (itemId: string) => {
    const cart = localCart.get();
    cart.items = cart.items.filter(i => i.id !== itemId);
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price || item.product?.price || 0) * item.quantity, 0);
    cart.total = cart.subtotal;
    localCart.set(cart);
    return cart;
  },

  clear: () => {
    localCart.set({ items: [], subtotal: 0, total: 0 });
  }
};
