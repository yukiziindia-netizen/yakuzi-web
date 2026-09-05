import { apiClient } from "@/lib/apiClient";
import type { Product, Order, Payout, Suggestion, CategoryItem } from "@yukizi/utils";
import type { ProductPayload } from "@yukizi/utils";

export async function getSellerDashboard(params: { dateFrom?: string; dateTo?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
  if (params.dateTo) qs.set("dateTo", params.dateTo);
  const { data } = await apiClient.get<{ data: any }>(`/sellers/dashboard?${qs}`);
  return data.data;
}

export async function getSellerWaitlist(params: { productId?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.productId) qs.set("productId", params.productId);
  const { data } = await apiClient.get<{ data: any[] }>(`/sellers/waitlist?${qs}`);
  return data.data ?? [];
}

export async function getSellerProfile() {
  const { data } = await apiClient.get<any>("/sellers/profile");
  return data.data ?? data.profile ?? data;
}

export async function updateSellerProfile(payload: Partial<any>) {
  const { data } = await apiClient.patch<any>("/sellers/profile", payload);
  return data.data ?? data.profile ?? data;
}

export async function getSellerProducts(params: { page?: number; limit?: number; search?: string } = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
  const { data } = await apiClient.get<any>(`/products/seller/own?${qs}`);
  
  const products = (data.data?.products ?? data.products ?? []).map((p: any) => {
    let categoryName: string | undefined = p.category as any;
    if (typeof p.category === 'object' && p.category) {
      categoryName = (p.category as any).name || (p.category as any).id || 'Unknown';
    }
    return {
      ...p,
      category: categoryName,
    };
  });

  // Spread the API's inner payload, not the { message, data } envelope —
  // `meta` lives inside data.data, and losing it showed "Showing 2 of 0
  // products" (total fell back to 0).
  return { ...(data.data ?? data), data: products }; // Return standardized paginated object
}

export async function createSellerProduct(input: ProductPayload | Record<string, any>) {
  const { data } = await apiClient.post<{ data: Product }>("/products", input);
  const product = data.data;
  return {
    ...product,
    category: typeof product?.category === 'object' && product?.category ? (product.category as any).name || (product.category as any).id : product?.category,
  };
}

export async function updateSellerProduct(productId: string, input: Partial<ProductPayload>) {
  const { data } = await apiClient.patch<{ data: Product }>(`/products/${productId}`, input);
  const product = data.data;
  return {
    ...product,
    category: typeof product?.category === 'object' && product?.category ? (product.category as any).name || (product.category as any).id : product?.category,
  };
}

export async function getSellerProductById(productId: string) {
  const { data } = await apiClient.get<{ data: Product }>(`/products/${productId}`);
  const product = data.data;
  const categoryObj = typeof product?.category === 'object' && product?.category ? product.category as any : null;
  const subCategoryObj = typeof (product as any)?.subCategory === 'object' && (product as any)?.subCategory ? (product as any).subCategory as any : null;
  
  return {
    ...product,
    category: categoryObj ? categoryObj.name || categoryObj.id : product?.category,
    categoryId: product.categoryId || categoryObj?.id || categoryObj?._id,
    subCategoryId: product.subCategoryId || subCategoryObj?.id || subCategoryObj?._id,
  };
}

export async function getCategories() {
  try {
    const { data } = await apiClient.get<{ data: any[] }>("/products/categories");
    const categories = data.data || [];
    // Normalize and filter to ensure { id, name } structure
    return Array.isArray(categories) 
      ? categories
          .filter(c => c && typeof c === 'object' && c.id && c.name)
          .map(c => ({ id: c.id, name: c.name }))
      : [];
  } catch (error) {
    // Was a hardcoded pharma list — Tablets, Syrups, Injections, Drops —
    // shown to sellers whenever the categories call failed. An empty list is
    // honest; inventing categories from the forked codebase was not.
    console.warn("Failed to fetch categories", error);
    return [];
  }
}

export async function deleteSellerProduct(productId: string) {
  const { data } = await apiClient.delete<{ message: string }>(`/products/${productId}`);
  return data;
}

export async function getSellerOrders(params: { dateFrom?: string; dateTo?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
  if (params.dateTo) qs.set("dateTo", params.dateTo);
  const { data } = await apiClient.get<any>(`/orders/seller?${qs}`);
  const raw = data.data ?? data;
  return Array.isArray(raw) ? raw : (raw.orders ?? raw.data ?? []);
}

export async function updateSellerOrderStatus(orderId: string, status: string) {
  const { data } = await apiClient.patch<{ order: Order }>(`/orders/${orderId}/status`, { status });
  return data.order;
}

export async function getSellerSettlements(params: { dateFrom?: string; dateTo?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
  if (params.dateTo) qs.set("dateTo", params.dateTo);
  const { data } = await apiClient.get<any>(`/settlements/seller?${qs}`);
  return data.data ?? [];
}

export async function getSellerSettlementSummary() {
  const { data } = await apiClient.get<any>("/settlements/summary");
  return data.data ?? data;
}

export async function requestSellerPayout() {
  const { data } = await apiClient.post<{ data: any }>("/settlements/request");
  return data.data ?? data;
}

export async function toggleVacationMode(isVacation: boolean) {
  const { data } = await apiClient.patch<any>("/sellers/profile", { isVacation });
  return data.data ?? data.profile ?? data;
}

// ─── Orders (extended) ────────────────────────────────
export async function getSellerOrderById(orderId: string) {
  const { data } = await apiClient.get<any>(`/orders/${orderId}`);
  const raw = data.data ?? data;
  return raw.order || raw.data || raw;
}

export interface SellerInvoiceLine {
  serial: number;
  description: string;
  quantity: number;
  unitPrice: number;
  taxableValue: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
}

export interface SellerInvoiceTaxLine {
  rate: number;
  componentRate: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
}

export interface SellerInvoiceParty {
  name: string;
  gstin: string | null;
  address: string;
  phone: string | null;
  email: string | null;
}

export interface SellerOrderInvoice {
  invoiceNumber: string;
  invoiceDate: string;
  orderReference: string;
  seller: SellerInvoiceParty;
  buyer: SellerInvoiceParty;
  placeOfSupply: string;
  isIntraState: boolean;
  lines: SellerInvoiceLine[];
  taxBreakdown: SellerInvoiceTaxLine[];
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  totalAmount: number;
  amountInWords: string;
}

export async function getSellerOrderInvoices(orderId: string): Promise<SellerOrderInvoice[]> {
  const { data } = await apiClient.get<any>(`/orders/${orderId}/invoices`);
  return data.data ?? data;
}

export async function acceptSellerOrder(orderId: string) {
  const { data } = await apiClient.patch<any>(`/orders/${orderId}/status`, { status: "ACCEPTED" });
  return data.data ?? data.order ?? data;
}

export async function rejectSellerOrder(orderId: string, reason: string) {
  const { data } = await apiClient.patch<any>(`/orders/${orderId}/status`, { status: "CANCELLED", reason });
  return data.data ?? data.order ?? data;
}

export async function uploadOrderDocument(formData: FormData) {
  const { data } = await apiClient.post<any>(`/storage/order-document`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data?.url ?? data.url ?? data;
}

export async function updateShippingDetails(orderId: string, payload: any) {
  const { data } = await apiClient.patch<any>(`/orders/${orderId}/shipping-details`, payload);
  return data.data ?? data;
}

export async function submitSelfShipTracking(orderId: string, payload: { trackingUrl: string; courierName?: string }) {
  const { data } = await apiClient.patch<any>(`/orders/${orderId}/self-ship-tracking`, payload);
  return data.data ?? data;
}

export async function getSellerCustomOrders() {
  const { data } = await apiClient.get<any>("/orders/seller?type=custom");
  const raw = data.data ?? data;
  return Array.isArray(raw) ? raw : (raw.orders ?? []);
}

export async function getSellerCancelledOrders() {
  const { data } = await apiClient.get<any>("/orders/seller?status=CANCELLED");
  const raw = data.data ?? data;
  return Array.isArray(raw) ? raw : (raw.orders ?? []);
}

// ─── Notifications ────────────────────────────────────
export async function getSellerNotifications() {
  const { data } = await apiClient.get<any>("/notifications");
  return data.data ?? data;
}

// ─── Suggestion / Autocomplete Search ─────────────────



export async function searchSuggestions(query: string, type: 'product' | 'master' = 'master'): Promise<Suggestion[]> {
  try {
    const { data } = await apiClient.get<{ data: Suggestion[] }>("/products/suggestions", {
      params: { search: query, type },
    });
    return data.data ?? [];
  } catch {
    // Fell back to a hardcoded pharmaceutical list — Amoxicillin,
    // Azithromycin, Dolo 650, ORS Powder — so a hiccup in the suggestions
    // call showed sellers of an anime store a drug catalogue. No suggestions
    // is the right answer when we have none.
    return [];
  }
}

// ─── Categories with Subcategories ────────────────────

export async function getCategoriesWithSubs(): Promise<CategoryItem[]> {
  try {
    const { data } = await apiClient.get<{ data: CategoryItem[] }>("/products/categories?includeSubs=true");
    const categories = data.data ?? [];
    console.log("Raw categories response:", categories);
    // Normalize and filter to ensure correct structure, handling both camelCase and lowercase field names
    return Array.isArray(categories)
      ? categories
          .filter(c => c && typeof c === 'object' && c.id && c.name)
          .map(c => {
            // Handle both subCategories (camelCase) and subcategories (lowercase)
            const subs = (c as any).subCategories || (c as any).subcategories || [];
            
            // Extract category name, handling object structures
            let categoryName: string = 'Unknown';
            if (typeof c.name === 'string') {
              categoryName = c.name;
            } else if (c.name && typeof c.name === 'object') {
              categoryName = String((c.name as any).name || (c.name as any).id || c.name);
            }
            
            return {
              id: c.id,
              name: categoryName,
              subcategories: Array.isArray(subs)
                ? subs.map((sc: any) => {
                    const scId = sc?.id || sc?._id;
                    // Extract subcategory name, handling object structures
                    let scName: string = 'Unknown';
                    if (typeof sc?.name === 'string') {
                      scName = sc.name;
                    } else if (sc?.name && typeof sc.name === 'object') {
                      scName = String((sc.name as any).name || (sc.name as any).id || sc.name);
                    }
                    return { id: scId, name: scName, categoryId: c.id };
                  }).filter((sc: any) => sc && sc.id && sc.name && sc.categoryId)
                : [],
            };
          })
      : [];
  } catch (error) {
    // Same pharma fallback as above, with sub-categories: Pain Relief,
    // Antibiotics, Eye Drops. Removed for the same reason.
    console.warn("Failed to fetch categories with subs", error);
    return [];
  }
}

export async function markNotificationRead(notificationId: string) {
  const { data } = await apiClient.patch<any>(`/notifications/${notificationId}/read`);
  return data.data ?? data;
}

export async function markAllNotificationsRead() {
  const { data } = await apiClient.patch<any>("/notifications/read-all");
  return data.data ?? data;
}

// ─── Profile (extended) ───────────────────────────────
export async function getSellerFullProfile() {
  const { data } = await apiClient.get<any>("/sellers/profile");
  return data.data ?? data.profile ?? data;
}

// ─── Product Requests ─────────────────────────────────
export async function getProductRequests() {
  const { data } = await apiClient.get<any>("/products/my-requests");
  return data.data ?? data;
}

export async function createProductRequest(payload: { productName: string; manufacturer?: string; description?: string }) {
  const { data } = await apiClient.post<any>("/products/requests", payload);
  return data.data ?? data;
}

// ─── Support Tickets ─────────────────────────────────
const sellerTicketEndpoints = {
  list: "/sellers/tickets",
  listFallback: "/tickets",
  detail: (id: string) => `/sellers/tickets/${id}`,
  detailFallback: (id: string) => `/tickets/${id}`,
  create: "/sellers/tickets",
  createFallback: "/tickets",
  addMessage: (id: string) => `/sellers/tickets/${id}/messages`,
  addMessageFallback: (id: string) => `/tickets/${id}/messages`,
};

function isFallbackStatus(error: any) {
  return [404, 405].includes(error?.response?.status);
}

function normalizeTicket(ticket: any) {
  if (!ticket || typeof ticket !== 'object') return null;
  if (!ticket.description && ticket.message) ticket.description = ticket.message;
  if (!ticket.id && ticket._id) ticket.id = ticket._id;
  if (!ticket.id && ticket.ticketId) ticket.id = ticket.ticketId;
  if (!ticket.id && ticket.ticket_id) ticket.id = ticket.ticket_id;
  if (!ticket.messages) ticket.messages = [];
  return ticket;
}

function extractTicket(response: any) {
  return normalizeTicket(response?.data?.ticket ?? response?.ticket ?? response?.data ?? response ?? null);
}

function extractTicketList(response: any) {
  const raw = response?.data ?? response;
  let tickets: any[] = [];

  if (Array.isArray(raw)) {
    tickets = raw;
  } else if (Array.isArray(raw?.tickets)) {
    tickets = raw.tickets;
  } else if (Array.isArray(response?.data)) {
    tickets = response.data;
  }

  return tickets.map(normalizeTicket).filter(Boolean);
}

export async function getSellerTickets() {
  try {
    const { data } = await apiClient.get<any>(sellerTicketEndpoints.list);
    return extractTicketList(data);
  } catch (error: any) {
    if (isFallbackStatus(error)) {
      const { data } = await apiClient.get<any>(sellerTicketEndpoints.listFallback);
      return extractTicketList(data);
    }
    throw error;
  }
}

export async function getSellerTicketById(ticketId: string) {
  try {
    const { data } = await apiClient.get<any>(sellerTicketEndpoints.detail(ticketId));
    const ticket = extractTicket(data);
    if (ticket) return ticket;
  } catch (error: any) {
    console.error('[Seller Ticket API] getSellerTicketById failed for ticketId:', ticketId, error?.response?.data ?? error?.message ?? error);
    if (!isFallbackStatus(error)) throw error;
  }

  try {
    const { data } = await apiClient.get<any>(sellerTicketEndpoints.detailFallback(ticketId));
    return extractTicket(data);
  } catch (error: any) {
    console.error('[Seller Ticket API] getSellerTicketById fallback failed for ticketId:', ticketId, error?.response?.data ?? error?.message ?? error);
    throw error;
  }
}

export async function createSellerTicket(payload: { subject: string; message: string }) {
  try {
    const { data } = await apiClient.post<any>(sellerTicketEndpoints.create, payload);
    const ticket = extractTicket(data);
    if (ticket) return ticket;
  } catch (error: any) {
    if (!isFallbackStatus(error)) throw error;
  }

  const { data } = await apiClient.post<any>(sellerTicketEndpoints.createFallback, payload);
  return extractTicket(data);
}

export async function addTicketMessage(ticketId: string, message: string) {
  try {
    const { data } = await apiClient.post<any>(sellerTicketEndpoints.addMessage(ticketId), { message });
    const ticket = extractTicket(data);
    if (ticket) return ticket;
  } catch (error: any) {
    if (!isFallbackStatus(error)) throw error;
  }

  const { data } = await apiClient.post<any>(sellerTicketEndpoints.addMessageFallback(ticketId), { message });
  return extractTicket(data);
}
// ─── Buyer Onboarding (Seller Portal) ─────────────────
/**
 * Verify GST or PAN number via IDFY verification service
 */
export async function verifyGstOrPan(type: 'GST' | 'PAN', value: string) {
  const { data } = await apiClient.post<any>('/verification/pangst', { type, value });
  return data.data ?? data;
}

/**
 * Upload KYC document for buyer profile (licence, bank statement, etc.)
 */
export async function uploadKycDocument(formData: FormData) {
  const { data } = await apiClient.post<any>('/storage/kyc', formData);

  return data.data ?? data;
}

/**
 * Upload product image to S3
 */
export async function uploadProductImage(formData: FormData) {
  const { data } = await apiClient.post<any>('/storage/product-image', formData);

  return data.data ?? data;
}


// onboardBuyer / getSellerBuyers / getBuyerProfile removed with the
// seller-side /buyers pages. They came from the pharma fork, where a
// distributor onboarded pharmacies on credit terms; on Yukizi buyers sign
// themselves up and no seller screen called any of these.

/** Seller-facing review filters — no customer dimension by design. */
export interface SellerReviewFilters {
  page?: number;
  limit?: number;
  productId?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  rating?: number;
}

/**
 * Reviews from buyers who purchased THIS seller's listing. Scoped
 * server-side, so another seller's reviews of the same catalog product never
 * appear, and no buyer identity is returned.
 */
export async function getSellerReviews(params: SellerReviewFilters = {}) {
  const { data } = await apiClient.get<{ data: any }>("/reviews/seller", { params });
  // This endpoint returns the paginated object itself ({ data: Review[],
  // total, summary, ... }) with no { message, data } envelope, so the usual
  // `data.data ?? data` unwrap would grab the inner reviews ARRAY and drop
  // total/summary — which rendered "No reviews yet" over a non-empty response.
  return Array.isArray(data?.data) ? data : (data.data ?? data);
}

// ─── Integrations (sales channels) ────────────────────
// The API wraps these in { message, data }. Nothing here ever receives a
// credential — the backend's seller view omits those columns entirely.

export type IntegrationProviderKey = "SHOPIFY" | "WOOCOMMERCE" | "AMAZON";

export interface SellerIntegration {
  id: string;
  provider: IntegrationProviderKey;
  status: string;
  health: "CONNECTED" | "PAUSED" | "ACTION_REQUIRED" | "DISCONNECTED";
  storeName: string | null;
  storeUrl: string | null;
  marketplaceId: string | null;
  region: string | null;
  scopes: string[];
  syncEnabled: boolean;
  syncProducts: boolean;
  syncInventory: boolean;
  syncPrices: boolean;
  syncOrders: boolean;
  inventoryDirection: "IMPORT_ONLY" | "EXPORT_ONLY" | "TWO_WAY";
  sourceOfTruth: "YUKIZI" | "EXTERNAL";
  setupCompleted: boolean;
  lastSyncAt: string | null;
  lastSuccessfulSyncAt: string | null;
  lastError: string | null;
  connectedAt: string;
}

export interface IntegrationsOverview {
  providers: Array<{
    provider: IntegrationProviderKey;
    available: boolean;
    integration: SellerIntegration | null;
  }>;
  summary: {
    productsMonitored: number;
    productsMapped: number;
    productsNeedingAttention: number;
    lastSyncAt: string | null;
  };
}

export async function getIntegrations() {
  const { data } = await apiClient.get<any>("/integrations");
  return (data.data ?? data) as IntegrationsOverview;
}

export async function getIntegration(provider: string) {
  const { data } = await apiClient.get<any>(`/integrations/${provider.toLowerCase()}`);
  return data.data ?? data;
}

export async function getAmazonMarketplaces() {
  const { data } = await apiClient.get<any>("/integrations/amazon/marketplaces");
  return data.data ?? data;
}

/** Returns the provider consent URL for the browser to navigate to. */
export async function connectShopify(shopDomain: string) {
  const { data } = await apiClient.post<any>("/integrations/shopify/connect", { shopDomain });
  return (data.data ?? data) as { authorizationUrl: string };
}

/** Pre-flight probe so the seller sees a useful error before being redirected. */
export async function checkWooCommerceStore(storeUrl: string) {
  const { data } = await apiClient.post<any>("/integrations/woocommerce/check", { storeUrl });
  return (data.data ?? data) as { reachable: boolean; isWooCommerce: boolean; message?: string };
}

export async function connectWooCommerce(storeUrl: string) {
  const { data } = await apiClient.post<any>("/integrations/woocommerce/connect", { storeUrl });
  return (data.data ?? data) as { authorizationUrl: string };
}

export async function connectAmazon(marketplaceId: string) {
  const { data } = await apiClient.post<any>("/integrations/amazon/connect", { marketplaceId });
  return (data.data ?? data) as { authorizationUrl: string };
}

export async function updateIntegrationSettings(
  id: string,
  input: Partial<
    Pick<
      SellerIntegration,
      "syncEnabled" | "syncProducts" | "syncInventory" | "inventoryDirection" | "sourceOfTruth"
    >
  >,
) {
  const { data } = await apiClient.patch<any>(`/integrations/${id}/settings`, input);
  return data.data ?? data;
}

export async function completeIntegrationSetup(
  id: string,
  input: {
    syncProducts: boolean;
    syncInventory: boolean;
    inventoryDirection: string;
    sourceOfTruth: string;
  },
) {
  const { data } = await apiClient.post<any>(`/integrations/${id}/setup`, input);
  return data.data ?? data;
}

export async function requestIntegrationSync(id: string) {
  const { data } = await apiClient.post<any>(`/integrations/${id}/sync`);
  return (data.data ?? data) as { id: string; status: string; alreadyQueued: boolean };
}

export async function getIntegrationActivity(
  id: string,
  params: { page?: number; limit?: number } = {},
) {
  const { data } = await apiClient.get<any>(`/integrations/${id}/activity`, { params });
  return data.data ?? data;
}

export async function getIntegrationMappings(
  id: string,
  params: { page?: number; limit?: number; status?: string; search?: string } = {},
) {
  const { data } = await apiClient.get<any>(`/integrations/${id}/mappings`, { params });
  return data.data ?? data;
}

export async function mapIntegrationProduct(
  id: string,
  mappingId: string,
  sellerOfferId: string,
) {
  const { data } = await apiClient.patch<any>(`/integrations/${id}/mappings/${mappingId}`, {
    sellerOfferId,
  });
  return data.data ?? data;
}

export async function disconnectIntegration(id: string) {
  const { data } = await apiClient.delete<any>(`/integrations/${id}`);
  return data.data ?? data;
}

// ─── Integrations: product mapping (phase 2) ──────────

export interface IntegrationMappingRow {
  id: string;
  yukiziProductName: string | null;
  yukiziProductId: string | null;
  yukiziSku: string | null;
  externalTitle: string | null;
  externalSku: string | null;
  externalProductId: string;
  externalVariantId: string | null;
  asin: string | null;
  fulfillmentChannel: "MERCHANT" | "AMAZON_FBA";
  status: "MAPPED" | "UNMAPPED" | "CONFLICT" | "MISSING_SKU";
  conflictReason: string | null;
  externalQuantity: number | null;
  inventoryConflict: {
    yukiziQuantity: number | null;
    externalQuantity: number | null;
    detectedAt: string;
  } | null;
  mappedManually: boolean;
  lastSyncedAt: string | null;
}

export interface IntegrationMappingsResponse {
  data: IntegrationMappingRow[];
  counts: {
    mapped: number;
    unmapped: number;
    conflict: number;
    missingSku: number;
    inventoryConflicts: number;
    total: number;
  };
  total: number;
  page: number;
  limit: number;
}

/** Yukizi listings the seller can map an external listing onto. */
export async function getMappingCandidates(search?: string) {
  const { data } = await apiClient.get<any>("/integrations/mappings/candidates", {
    params: search ? { search } : {},
  });
  return (data.data ?? data) as Array<{ id: string; name: string; sku: string | null }>;
}

/** Resolve one inventory difference in favour of Yukizi or the channel. */
export async function resolveInventoryConflict(
  integrationId: string,
  mappingId: string,
  choice: "YUKIZI" | "EXTERNAL",
) {
  const { data } = await apiClient.post<any>(
    `/integrations/${integrationId}/mappings/${mappingId}/resolve-inventory`,
    { choice },
  );
  return data.data ?? data;
}
