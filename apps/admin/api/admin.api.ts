import { apiClient } from "@/lib/apiClient";
import type { Product } from "@yukizi/utils";

// ─── Dashboard ───────────────────────────────────────
export async function getAdminDashboard(params: { dateFrom?: string; dateTo?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
  if (params.dateTo) qs.set("dateTo", params.dateTo);
  const { data } = await apiClient.get<{ data: any }>(`/admin/dashboard?${qs}`);
  return data.data;
}

// ─── Users ───────────────────────────────────────────
export async function getAdminUsers(params: { page?: number; limit?: number; dateFrom?: string; dateTo?: string } = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
  const { data } = await apiClient.get<any>(`/admin/users?${qs}`);
  return data.data;
}

export async function getPendingUsers() {
  const { data } = await apiClient.get<{ data: any }>("/admin/users/pending");
  return data.data;
}

export async function getUserById(userId: string) {
  const { data } = await apiClient.get<{ data: any }>(`/admin/users/${userId}`);
  return data.data;
}

export async function approveUser(userId: string) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/users/${userId}/approve`);
  return data.data;
}

export async function rejectUser(userId: string) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/users/${userId}/reject`);
  return data.data;
}

export async function blockUser(userId: string) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/users/${userId}/block`);
  return data.data;
}

export async function unblockUser(userId: string) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/users/${userId}/unblock`);
  return data.data;
}

// ─── Products ────────────────────────────────────────
export async function getAdminProducts(page = 1, limit = 50) {
  const { data } = await apiClient.get<any>(`/admin/products?page=${page}&limit=${limit}`);
  return data.data;
}

export async function getProductById(productId: string) {
  const { data } = await apiClient.get<{ data: any }>(`/admin/products/${productId}`);
  return data.data;
}

export async function disableProduct(productId: string) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/products/${productId}/disable`);
  return data.data;
}

export async function enableProduct(productId: string) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/products/${productId}/enable`);
  return data.data;
}

export async function deleteProduct(productId: string) {
  const { data } = await apiClient.delete<{ data: any }>(`/admin/products/${productId}`);
  return data.data;
}

export async function approveProduct(productId: string) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/products/${productId}/approve`);
  return data.data;
}

export async function rejectProduct(productId: string, reason?: string) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/products/${productId}/reject`, { reason });
  return data.data;
}

// ─── Product Requests ────────────────────────────────
export async function getProductRequests(params: { page?: number; limit?: number; status?: string; search?: string; dateFrom?: string; dateTo?: string } = {}) {


  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
  const { data } = await apiClient.get<any>(`/products/requests?${qs}`);
  return data.data;
}

export async function updateProductRequestStatus(id: string, status: string) {
  const { data } = await apiClient.patch<{ data: any }>(`/products/requests/${id}/status`, { status });
  return data.data;
}

// ─── Orders ──────────────────────────────────────────
export async function getAdminOrders(page = 1, limit = 50) {
  const { data } = await apiClient.get<any>(`/admin/orders?page=${page}&limit=${limit}`);
  return data.data;
}

export async function getOrderById(orderId: string) {
  const { data } = await apiClient.get<{ data: any }>(`/admin/orders/${orderId}`);
  return data.data;
}

export async function updateAdminOrderStatus(orderId: string, status: string) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/orders/${orderId}/status`, { status });
  return data.data;
}

export async function updateAdminShippingDocs(orderId: string, payload: {
  adminShippingLabelUrl?: string;
  adminInvoiceUrl?: string;
  manifestUrl?: string;
  invoiceUrl?: string;
  isShippingLocked?: boolean;
  sellerId?: string;
}) {
  const { data } = await apiClient.patch<{ data: any }>(`/orders/${orderId}/admin-shipping-docs`, payload);
  return data.data;
}

export async function getOrderTracking(orderId: string) {
  const { data } = await apiClient.get<{ data: any }>(`/orders/${orderId}/tracking`);
  return data.data;
}

/**
 * Pin one order to the real or the test side, or hand it back to the
 * TEST_BUYER_PHONES rule with "auto". The phone rule on its own cannot say
 * "these two are real orders, everything else from that number was testing".
 */
export async function classifyOrder(orderId: string, classification: "real" | "test" | "auto") {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/orders/${orderId}/classification`, { classification });
  return data.data;
}

// ─── Payments ────────────────────────────────────────
export async function getPayments(page = 1, limit = 50) {
  const { data } = await apiClient.get<any>(`/admin/payments?page=${page}&limit=${limit}`);
  return data.data;
}

export async function confirmPayment(paymentId: string) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/payments/${paymentId}/confirm`);
  return data.data;
}

export async function rejectPayment(paymentId: string) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/payments/${paymentId}/reject`);
  return data.data;
}

// ─── Settlements ─────────────────────────────────────
export async function getSettlements(params: { 
  page?: number; 
  limit?: number; 
  dateFrom?: string; 
  dateTo?: string;
  sellerId?: string;
  status?: string;
  [key: string]: any;
} = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
  const { data } = await apiClient.get<any>(`/admin/settlements?${qs}`);
  return data.data;
}

// True totals across every matching settlement (not just the current page) -
// use for stat cards, not the paginated getSettlements() list.
export async function getSettlementsSummary(params: {
  dateFrom?: string;
  dateTo?: string;
  sellerId?: string;
  status?: string;
  [key: string]: any;
} = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
  const { data } = await apiClient.get<any>(`/admin/settlements/summary?${qs}`);
  return data.data as { gross: number; pending: number; totalSettled: number };
}

export async function markSettlementPaid(settlementId: string, payoutReference: string, paymentProofUrl?: string) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/settlements/${settlementId}/mark-paid`, { payoutReference, paymentProofUrl });
  return data.data;
}

/**
 * Opens a settlement's commission invoice for the admin to READ before paying
 * out. Read-only: it sends nothing to the seller and changes no status.
 *
 * Fetched through the API client rather than a plain link because the
 * endpoint needs an Authorization header an <a href> cannot send.
 */
export async function previewCommissionInvoice(settlementId: string): Promise<void> {
  const res = await apiClient.get(`/admin/settlements/${settlementId}/commission-invoice`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(res.data as Blob);
  window.open(url, "_blank", "noopener");
  // Revoked on a timer, not immediately: the new tab has to fetch it first.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// ─── Tickets ─────────────────────────────────────────
export async function getTickets(page = 1, limit = 50) {
  const { data } = await apiClient.get<any>(`/admin/tickets?page=${page}&limit=${limit}`);
  return data.data;
}

export async function getTicketById(ticketId: string) {
  const { data } = await apiClient.get<{ data: any }>(`/admin/tickets/${ticketId}`);
  return data.data;
}

export async function replyToTicket(ticketId: string, message: string) {
  const { data } = await apiClient.post<{ data: any }>(`/admin/tickets/${ticketId}/reply`, { message });
  return data.data;
}

export async function updateTicketStatus(ticketId: string, status: string) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/tickets/${ticketId}/status`, { status });
  return data.data;
}

// ─── Categories ──────────────────────────────────────
export async function getCategories() {
  const { data } = await apiClient.get<{ data: any }>("/admin/categories");
  return data.data;
}

export async function createCategory(payload: { name: string; image?: string; mobileImage?: string }) {
  const { data } = await apiClient.post<{ data: any }>("/admin/categories", payload);
  return data.data;
}

// mobileImage: omit to leave it untouched, send "" to clear it back to the desktop image.
export async function updateCategory(id: string, payload: { name?: string; image?: string; mobileImage?: string }) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/categories/${id}`, payload);
  return data.data;
}

export type BannerSlidePayload = { image: string; mobileImage?: string };

// Atomically replaces the whole slideshow (order = array index). Empty array
// clears it. The backend keeps the legacy image/mobileImage columns in sync
// with slide 1.
export async function replaceCategoryBanners(id: string, banners: BannerSlidePayload[]) {
  const { data } = await apiClient.put<{ data: any }>(`/admin/categories/${id}/banners`, { banners });
  return data.data;
}

export async function replaceSubCategoryBanners(id: string, banners: BannerSlidePayload[]) {
  const { data } = await apiClient.put<{ data: any }>(`/admin/subcategories/${id}/banners`, { banners });
  return data.data;
}

export async function deleteCategory(id: string) {
  const { data } = await apiClient.delete<{ data: any }>(`/admin/categories/${id}`);
  return data.data; // Note: may not return data depending on backend
}

export async function getSubCategories(categoryId?: string) {
  const url = categoryId ? `/admin/subcategories?categoryId=${categoryId}` : "/admin/subcategories";
  const { data } = await apiClient.get<{ data: any }>(url);
  return data.data;
}

export async function createSubCategory(payload: { name: string; categoryId: string }) {
  const { data } = await apiClient.post<{ data: any }>("/admin/subcategories", payload);
  return data.data;
}

export async function updateSubCategory(id: string, payload: { name?: string; categoryId?: string }) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/subcategories/${id}`, payload);
  return data.data;
}

export async function deleteSubCategory(id: string) {
  const { data } = await apiClient.delete<{ data: any }>(`/admin/subcategories/${id}`);
  return data.data;
}

// ─── Users (Extended) ────────────────────────────────
export async function getBuyers(params: { page?: number; limit?: number; status?: string; search?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.status) qs.set("status", params.status);
  if (params.search) qs.set("search", params.search);
  const { data } = await apiClient.get<any>(`/admin/users/buyers?${qs}`);
  return data.data;
}

export async function getBuyersList(page = 1, limit = 20) {
  const { data } = await apiClient.get<any>(`/buyers/all?page=${page}&limit=${limit}`);
  return data;
}

export async function getSellers(params: { page?: number; limit?: number; status?: string; search?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.status) qs.set("status", params.status);
  if (params.search) qs.set("search", params.search);
  const { data } = await apiClient.get<any>(`/admin/users/sellers?${qs}`);
  return data.data;
}

export async function setSellerSelfShip(sellerId: string, selfShipEnabled: boolean) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/sellers/${sellerId}/self-ship`, { selfShipEnabled });
  return data.data;
}

export async function adminCreateProductForSeller(payload: Record<string, any>) {
  const { data } = await apiClient.post<{ data: any }>("/admin/products", payload);
  return data.data;
}

/**
 * Edit a seller's listing on their behalf — the counterpart to creating one.
 *
 * Not the same as updateAdminProduct below: that one edits the CATALOGUE
 * entry (shared name, slug and its 301). This edits the SELLER'S LISTING —
 * stock, variants, images, pricing, packaging — and the API runs it through
 * the seller's own update path, so the rules are identical whoever saves.
 */
export async function adminUpdateProductForSeller(productId: string, payload: Record<string, any>) {
  const { data } = await apiClient.patch<{ data: any }>(
    `/admin/products/${productId}/as-seller`,
    payload,
  );
  return data.data;
}

export async function updateUser(userId: string, payload: Record<string, any>) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/users/${userId}`, payload);
  return data.data;
}

export async function deleteUser(userId: string) {
  const { data } = await apiClient.delete<{ data: any }>(`/admin/users/${userId}`);
  return data.data;
}

export async function updateUserStatus(userId: string, statusLevel: number) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/users/${userId}/status-level`, { statusLevel });
  return data.data;
}

export async function updateGstPanStatus(
  userId: string,
  role: 'BUYER' | 'SELLER',
  data: { verified: boolean; creditTier?: 'PREPAID' | 'EMI' | 'FULLCREDIT' }
) {
  const rolePath = role === 'BUYER' ? 'buyers' : 'sellers';
  const { data: response } = await apiClient.patch<{ data: any }>(`/admin/${rolePath}/${userId}/gst-pan-status`, data);
  return response.data;
}

export async function updateSellerProfile(userId: string, data: Record<string, unknown>) {
  const { data: response } = await apiClient.patch<{ data: any }>(`/admin/users/${userId}/seller-profile`, data);
  return response.data;
}

// ─── Products (Extended) ─────────────────────────────
export async function getAdminProductsFiltered(params: { page?: number; limit?: number; status?: string; search?: string; categoryId?: string; sellerId?: string } = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
  const { data } = await apiClient.get<any>(`/admin/products?${qs}`);
  return data.data;
}

export async function createProduct(payload: Record<string, any>) {
  const { data } = await apiClient.post<{ data: any }>("/admin/products", payload);
  return data.data;
}

export async function updateProduct(productId: string, payload: Record<string, any>) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/products/${productId}`, payload);
  return data.data;
}

// ─── Orders (Extended) ───────────────────────────────
export async function getAdminOrdersFiltered(params: { page?: number; limit?: number; status?: string; search?: string; dateFrom?: string; dateTo?: string; includeTestOrders?: string } = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
  const { data } = await apiClient.get<any>(`/admin/orders?${qs}`);
  // Backend responds { message, data: { data: Order[], total, page, limit, totalPages } } —
  // unwrap only the outer envelope so callers still get `total` for pagination.
  return data?.data ?? { data: [], total: 0 };
}

export interface AbandonedCheckout {
  id: string;
  state: "abandoned" | "in_progress";
  startedAt: string;
  cancelledAt: string | null;
  cancellationReason: string | null;
  totalAmount: number;
  orderIds: string[];
  buyer: { id: string; phone: string | null; email: string | null; buyerProfile: { legalName: string | null } | null } | null;
  address: { name: string; phone: string; city: string; state: string } | null;
  items: { name: string; quantity: number; totalPrice: number }[];
  boughtLater: boolean;
}

export interface AbandonedCheckoutsResponse {
  data: AbandonedCheckout[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: { abandonedCount: number; abandonedValue: number; inProgressCount: number; inProgressValue: number };
  truncated: boolean;
}

/**
 * Checkouts that reached payment and never completed it, one row per checkout.
 *
 * Throws on failure rather than returning an empty list: this screen exists to
 * tell the owner how much revenue is being lost, and "could not load" must
 * never read as "nothing was lost".
 */
export async function getAbandonedCheckouts(
  params: { state?: string; page?: number; limit?: number; search?: string; dateFrom?: string; dateTo?: string; includeTestOrders?: string } = {},
): Promise<AbandonedCheckoutsResponse> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
  const { data } = await apiClient.get<any>(`/admin/abandoned-checkouts?${qs}`);
  // Backend responds { message, data: { data, total, page, limit, totalPages, summary, truncated } }.
  return data.data;
}

/**
 * Cancels an order, restores its stock, and tells the buyer why.
 *
 * Now hits the admin mirror `/admin/orders/:id/cancel`. The shared
 * `/orders/:id/cancel` route allows ADMIN but refuses any order with a
 * confirmed payment — deliberately, since it also serves the buyer-facing
 * auto-cancel — so every attempt to cancel a PAID order from this panel
 * failed with "This order has a confirmed payment…". That is the bug this
 * replaces: an admin had no correct way to cancel a paid order.
 *
 * `refundHandled` is only consulted for a paid order with no refund already
 * recorded; the API refuses that combination without it, rather than
 * restocking an order whose money is still held.
 */
export async function cancelOrder(
  orderId: string,
  reason: string,
  refundHandled?: boolean,
) {
  const { data } = await apiClient.patch<{ data: any }>(
    `/admin/orders/${orderId}/cancel`,
    { reason, ...(refundHandled ? { refundHandled: true } : {}) },
  );
  return data.data;
}

/**
 * Records that a refund has gone back to the buyer, and emails them to say so.
 *
 * Does not move money — refunds are issued in Razorpay or at the bank. This is
 * the record of it, and the thing that finally answers the buyer's "you said I
 * would be refunded, where is it".
 */
export async function recordOrderRefund(
  orderId: string,
  payload: { amount?: number; reference?: string; notes?: string },
) {
  const { data } = await apiClient.patch<{ data: any }>(
    `/admin/orders/${orderId}/refund`,
    payload,
  );
  return data.data;
}

export async function getTestOrdersCount() {
  const { data } = await apiClient.get<{ data: number }>(`/admin/orders/test-orders-count`);
  return data.data;
}

export async function cancelTestOrders() {
  const { data } = await apiClient.post<{ data: { cancelled: number; failed: number; total: number } }>(
    `/admin/orders/cancel-test-orders`,
  );
  return data.data;
}

// ─── Tax invoices ────────────────────────────────────
// Always a list, one entry per seller. Checkout splits a cart into an order
// per seller so a new order carries exactly one, but orders migrated from
// before that can hold several.
//
// NOTE: these hit /orders, not /admin/orders. The invoice endpoints authorize
// per role themselves — an admin gets every invoice on the order — and there
// is no /admin mirror of them. The previous getOrderInvoice() called
// /admin/orders/:id/invoice, which has never existed on the API.

export interface OrderInvoice {
  invoiceNumber: string;
  invoiceDate: string;
  /** Which seller supplied it — how one invoice is addressed for download. */
  sellerId: string;
  seller: { name: string; gstin: string | null };
  buyer: { name: string };
  totalAmount: number;
}

export async function getOrderInvoices(orderId: string) {
  const { data } = await apiClient.get<{ data: OrderInvoice[] }>(`/orders/${orderId}/invoices`);
  return data.data;
}

/**
 * Fetches one seller's invoice PDF with the admin's token and hands the
 * browser a download. Not a plain link: the endpoint needs an Authorization
 * header, which an <a href> cannot send.
 */
export async function downloadOrderInvoicePdf(orderId: string, invoice: OrderInvoice): Promise<void> {
  const res = await apiClient.get(`/orders/${orderId}/invoices/${invoice.sellerId}/pdf`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement("a");
  a.href = url;
  // Invoice numbers carry slashes (YKZ/INV/2026-27/00323711); a filename cannot.
  a.download = `${invoice.invoiceNumber.replace(/[\\/]/g, "-")}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ─── Settlements (Extended) ──────────────────────────
export async function getSellerSettlements(sellerId: string, params: { page?: number; limit?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const { data } = await apiClient.get<any>(`/admin/settlements/seller/${sellerId}?${qs}`);
  return data.data;
}

export async function createSettlement(payload: { sellerId: string; orderIds: string[]; amount: number }) {
  const { data } = await apiClient.post<{ data: any }>("/admin/settlements", payload);
  return data.data;
}

export async function syncSettlements() {
  const { data } = await apiClient.post<{ data: any }>("/admin/settlements/sync");
  return data?.data ?? data ?? [];
}

// ─── Admin Management ────────────────────────────────
export async function getAdmins() {
  const { data } = await apiClient.get<any>("/admin/admins");
  return data.data;
}

/** Tab groups, labels and levels the grant screen renders from. */
export async function getAccessCatalog() {
  const { data } = await apiClient.get<{ data: any }>("/admin/admins/access-catalog");
  return data.data;
}

export async function createAdmin(payload: {
  phone: string;
  name: string;
  department?: string;
  /** Tab-level grants, e.g. { isSuper: false, tabs: { orders: "partial" } }. */
  access?: { isSuper: boolean; tabs: Record<string, string> };
}) {
  const { data } = await apiClient.post<{ data: any }>("/admin/admins", payload);
  return data.data;
}

export async function updateAdmin(adminId: string, payload: Record<string, any>) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/admins/${adminId}`, payload);
  return data.data;
}

export async function deleteAdmin(adminId: string) {
  const { data } = await apiClient.delete<{ data: any }>(`/admin/admins/${adminId}`);
  return data.data;
}

// ─── Suggestions / Catalog ───────────────────────────
export async function getSuggestions(params: { page?: number; limit?: number; search?: string; badgeType?: string } = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
  const { data } = await apiClient.get<any>(`/admin/suggestions?${qs}`);
  return data;
}

export async function createSuggestion(payload: Record<string, any>) {
  const { data } = await apiClient.post<{ data: any }>("/admin/suggestions", payload);
  return data.data;
}

export async function updateSuggestion(id: string, payload: Record<string, any>) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/suggestions/${id}`, payload);
  return data.data;
}

export async function deleteSuggestion(id: string) {
  const { data } = await apiClient.delete<{ data: any }>(`/admin/suggestions/${id}`);
  return data.data;
}

export async function importSuggestionsCsv(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<any>("/admin/suggestions/import", formData, {
    timeout: 300_000, // 5 minutes for large files
  });

  return data;
}

// ─── Banners ─────────────────────────────────────────
export async function getBanners() {
  const { data } = await apiClient.get<{ data: any }>("/admin/banners");
  return data.data;
}

export async function createBanner(payload: FormData) {
  const { data } = await apiClient.post<{ data: any }>("/admin/banners", payload);

  return data.data;
}

export async function updateBanner(id: string, payload: FormData) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/banners/${id}`, payload);

  return data.data;
}

export async function deleteBanner(id: string) {
  const { data } = await apiClient.delete<{ data: any }>(`/admin/banners/${id}`);
  return data.data;
}

// ─── Homepage Sections ────────────────────────────────
export async function getHomepageSections() {
  const { data } = await apiClient.get<{ data: any }>("/admin/homepage-sections");
  return data.data;
}

export async function createHomepageSection(payload: { categoryId?: string; subCategoryId?: string; title?: string | null; productLimit?: number; order?: number }) {
  const { data } = await apiClient.post<{ data: any }>("/admin/homepage-sections", payload);
  return data.data;
}

export async function updateHomepageSection(id: string, payload: { categoryId?: string; subCategoryId?: string; title?: string | null; productLimit?: number; order?: number; isActive?: boolean }) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/homepage-sections/${id}`, payload);
  return data.data;
}

export async function deleteHomepageSection(id: string) {
  const { data } = await apiClient.delete<{ data: any }>(`/admin/homepage-sections/${id}`);
  return data.data;
}

export async function reorderHomepageSections(orderedIds: string[]) {
  const { data } = await apiClient.patch<{ data: any }>("/admin/homepage-sections/reorder", { orderedIds });
  return data.data;
}

// ─── Referral Codes ──────────────────────────────────
export async function getReferralCodes(params: { page?: number; limit?: number; dateFrom?: string; dateTo?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
  if (params.dateTo) qs.set("dateTo", params.dateTo);
  const { data } = await apiClient.get<any>(`/admin/referrals?${qs}`);
  return data.data;
}


export async function createReferralCode(payload: { code: string; description?: string }) {
  const { data } = await apiClient.post<{ data: any }>("/admin/referrals", payload);
  return data.data;
}

export async function deleteReferralCode(id: string) {
  const { data } = await apiClient.delete<{ data: any }>(`/admin/referrals/${id}`);
  return data.data;
}

// ─── Notifications (Extended) ────────────────────────
export async function broadcastNotification(payload: { target: string; message: string }) {
  const { data } = await apiClient.post<{ data: any }>("/admin/notifications/broadcast", payload);
  return data.data;
}

export async function sendUserNotification(userId: string, payload: { title: string; message: string; type?: string }) {
  try {
    const { data } = await apiClient.post<{ data: any }>(`/admin/notifications/user/${userId}`, payload);
    return data.data;
  } catch {
    // Notification send is best-effort
    console.warn('[Admin] Failed to send user notification — endpoint may not exist');
    return null;
  }
}

export async function getNotificationHistory(params: { page?: number; limit?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  
  const { data } = await apiClient.get<any>(`/admin/notifications/broadcasts?${qs}`);
  return data.data ?? data;
}

export async function getMyBroadcastHistory() {
  const { data } = await apiClient.get<any>(`/admin/notifications/broadcasts/me`);
  return data.data ?? data;
}

// ─── Platform Settings ───────────────────────────────
export async function getPlatformSettings() {
  const { data } = await apiClient.get<{ data: any }>("/admin/settings");
  return data.data;
}

export async function updatePlatformSettings(payload: Record<string, any>) {
  const { data } = await apiClient.patch<{ data: any }>("/admin/settings", payload);
  return data.data;
}

// ─── Google Merchant Center ──────────────────────────
export interface MerchantSyncSummary {
  ran: boolean;
  reason?: string;
  total: number;
  pushed: number;
  skipped: number;
  failed: number;
  problems: string[];
  dryRun: boolean;
  finishedAt: string;
}

/** Which Google account the sync authenticates as. */
export interface MerchantIdentity {
  /** 'key' = explicit service-account key, 'adc' = the GCP VM's own account. */
  mode: "key" | "adc" | "none";
  email: string | null;
  reason?: string;
}

export interface MerchantStatus {
  ready: boolean;
  problems: string[];
  lastSync: MerchantSyncSummary | null;
  /** Optional: absent when talking to an API that predates identity reporting. */
  identity?: MerchantIdentity;
}

export async function getMerchantStatus(): Promise<MerchantStatus> {
  const { data } = await apiClient.get<{ data: MerchantStatus }>("/admin/merchant/status");
  return data.data;
}

export async function runMerchantSync(dryRun: boolean): Promise<MerchantSyncSummary> {
  const { data } = await apiClient.post<{ data: MerchantSyncSummary }>("/admin/merchant/sync", { dryRun }, {
    // One product per request to Google, ~1.2s each, so a full catalogue push
    // runs well past the client's 30s default: 87 products took 103s on
    // 2026-09-28. The server completed it and logged "87 pushed, 0 failed",
    // but axios had already aborted, so the panel reported a failure that
    // never happened. Give the request longer than the sync can take.
    timeout: 600_000, // 10 minutes for a full catalogue push
  });
  return data.data;
}

// ─── Analytics ───────────────────────────────────────
export async function getRevenueChart(params: { period?: string } = {}) {
  const qs = params.period ? `?period=${params.period}` : "";
  const { data } = await apiClient.get<{ data: any }>(`/admin/analytics/revenue${qs}`);
  return data.data;
}

export async function getOrdersChart(params: { period?: string } = {}) {
  const qs = params.period ? `?period=${params.period}` : "";
  const { data } = await apiClient.get<{ data: any }>(`/admin/analytics/orders${qs}`);
  return data.data;
}

export async function getTopProducts(params: { limit?: number } = {}) {
  const qs = params.limit ? `?limit=${params.limit}` : "";
  const { data } = await apiClient.get<{ data: any }>(`/admin/analytics/top-products${qs}`);
  return data.data;
}

export async function getTopSellers(params: { limit?: number } = {}) {
  const qs = params.limit ? `?limit=${params.limit}` : "";
  const { data } = await apiClient.get<{ data: any }>(`/admin/analytics/top-sellers${qs}`);
  return data.data;
}
// ─── Marketing ─────────────────────────────────────────
export async function getMarketingProducts(slot?: string) {
  const url = slot ? `/admin/marketing?slot=${slot}` : "/admin/marketing";
  const { data } = await apiClient.get<{ data: any }>(url);
  return data.data;
}

export async function addMarketingProduct(payload: { productId: string; slot: string; order?: number }) {
  const { data } = await apiClient.post<{ data: any }>("/admin/marketing", payload);
  return data.data;
}

export async function removeMarketingProduct(id: string) {
  const { data } = await apiClient.delete<{ data: any }>(`/admin/marketing/${id}`);
  return data.data;
}

// ─── Brands ──────────────────────────────────────────
export async function getAdminBrands() {
  const { data } = await apiClient.get<{ data: any }>("/admin/brands");
  return data.data;
}

export async function createBrand(payload: { name: string; imageUrl: string; order?: number }) {
  const { data } = await apiClient.post<{ data: any }>("/admin/brands", payload);
  return data.data;
}

export async function updateBrand(id: string, payload: { name?: string; imageUrl?: string; isActive?: boolean; order?: number }) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/brands/${id}`, payload);
  return data.data;
}

export async function deleteBrand(id: string) {
  const { data } = await apiClient.delete<{ data: any }>(`/admin/brands/${id}`);
  return data.data;
}

// ─── Storage ──────────────────────────────────────────
export async function getPresignedUrl(key: string) {
  const { data } = await apiClient.post<{ data: { url: string } }>("/storage/view", { key });
  return data.data;
}

export async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  // Reusing blog-image endpoint for generic admin image uploads to get a direct URL
  const { data } = await apiClient.post<{ data: { url: string } }>("/storage/blog-image", formData);
  return data.data.url;
}

export async function uploadAdminOrderDocument(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<any>("/storage/order-document", formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data?.url ?? data.url ?? data;
}

export async function uploadSettlementProof(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<{ data: { url: string } }>("/storage/settlement-proof", formData);

  return data.data.url;
}

export async function uploadProductMedia(file: File) {
  // 1. Get presigned URL from backend
  const { data } = await apiClient.post<{ data: { presigned_url: string; key: string; cdn_url: string } }>("/storage/upload-url", {
    filename: file.name,
    content_type: file.type
  });
  
  const { presigned_url, cdn_url } = data.data;

  // 2. Upload directly to S3 using the presigned URL
  const uploadResponse = await fetch(presigned_url, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type
    }
  });

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload file to S3");
  }

  // 3. Return the CDN URL
  return cdn_url;
}

// ─── Custom Orders ───────────────────────────────────
export async function getAdminCustomOrders(params: { page?: number; limit?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const { data } = await apiClient.get<any>(`/custom-orders/admin?${qs}`);
  return data.data;
}

export async function updateCustomOrderStatus(id: string, status: string) {
  const { data } = await apiClient.patch<{ data: any }>(`/custom-orders/${id}/status`, { status });
  return data.data;
}

export async function deleteCustomOrder(id: string) {
  const { data } = await apiClient.delete<{ data: any }>(`/custom-orders/${id}`);
  return data.data;
}

// ─── Activity log ───────────────────────────────────────────────────────────
// Read-only on purpose. There is no delete/clear/export-and-purge counterpart
// here because the API exposes none — the log is append-only by design.

export interface ActivityLogEntry {
  id: string;
  adminUserId: string | null;
  adminName: string;
  adminEmail: string | null;
  section: string;
  method: string;
  path: string;
  description: string;
  targetType: string | null;
  targetId: string | null;
  targetLabel: string | null;
  statusCode: number;
  success: boolean;
  changes: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export async function getActivityLog(params: Record<string, unknown> = {}) {
  const { data } = await apiClient.get<{ data: ActivityLogEntry[]; meta: any }>(
    "/admin/activity",
    { params },
  );
  return data;
}

export async function getActivityFilters() {
  const { data } = await apiClient.get<{ data: any }>("/admin/activity/filters");
  return data.data;
}
