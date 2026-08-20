# Seller "Notify Me" Tab — Design

## Problem

Buyers can click "Notify Me" on an out-of-stock product (`ProductWaitlist` records this against `catalogProductId`). Today only admins/the system can see this data — sellers have no visibility into demand for their own listings. Rishi wants a seller-dashboard tab showing who's waiting on their products, scoped to their own listings only, with a filter.

## Scoping decision

A buyer's "Notify Me" click is against the catalog product, not any single seller's offer — a product page can list multiple sellers, and the existing restock flow (`ProductsService`, `isNotified` flag) already notifies every waitlisted buyer for a `catalogProductId` regardless of which seller's restock triggered it. So "their listing" is defined as: **any catalog product the seller currently has an active (`isActive: true`, `approvalStatus: APPROVED`) `SellerOffer` for.** No schema change needed — this is a join at query time, not a new relation. Confirmed with Rishi.

If two sellers both carry the same catalog product, both see the same waitlist entries for it — consistent with how restock notification already works (whoever restocks first notifies everyone waiting).

## API

New endpoint in `yakuzi-api`, `src/modules/sellers/sellers.controller.ts` + `sellers.service.ts`:

```
GET /sellers/waitlist?productId=<optional catalogProductId>
```

- Guarded by the same `JwtAuthGuard, RolesGuard` (seller role) the existing `/sellers/dashboard` endpoint uses; scoped via `req.user.id` as `sellerId`.
- Query logic: find distinct `catalogProductId`s from `SellerOffer` where `sellerId = <seller>`, `isActive = true`, `approvalStatus = 'APPROVED'`; if `productId` query param is present, further restrict to that one id (must belong to the seller's own active set — otherwise 403/empty, not another seller's data). Then fetch `ProductWaitlist` rows for those `catalogProductId`s, joined to `CatalogProduct` (name, image) and `User` (display name only).
- Response shape: flat array, most recent first —
  ```ts
  { id, product: { id, name, image }, buyer: { name }, createdAt, isNotified }[]
  ```
  `product.image` resolves as `catalogProduct.images?.[0]?.url ?? catalogProduct.image ?? null` — matching the existing fallback pattern already used in `NotificationDrawer.tsx` on the frontend (images is the real array field, `.image` is a legacy singular fallback).
- Buyer identity: expose `User.username` only (falls back to a generic "Yukizi buyer" label if null). No phone/email — same exposure level as a product review already shows to a seller today. This was flagged to Rishi explicitly and approved.

## Frontend (`yakuzi-web`, `apps/seller`)

- New sidebar nav item in `components/layout/sidebar.tsx`, positioned after "Notifications": `{ icon: BellRing, label: "Notify Me", href: "/notify-me" }`. (Distinct from the existing `/notifications` page, which is the seller's own system-alert feed — unrelated data.)
- New page `app/notify-me/page.tsx`: a table (Product thumbnail+name / Buyer / Date / Status badge — "Waiting" or "Notified"), following the existing list-page conventions in this app (loading skeleton, empty state matching `EmptyState` component usage elsewhere).
- Product filter: a `<select>` populated from the seller's own product list (reuse whatever hook the Products page already uses to fetch `SellerOffer`s for this seller — avoids a second products fetch), driving the `?productId=` query param via the new `useSellerWaitlist(productId?)` React Query hook.
- No new seller actions (read-only visibility) — no "notify now" button or similar, matches the read-only scope Rishi asked for.

## Testing

Backend: unit tests on the new service method covering — scoping excludes another seller's exclusive products; `productId` filter rejects/ignores a product the seller doesn't carry; inactive/unapproved `SellerOffer`s are excluded from scoping; buyer `username` null falls back correctly.

Frontend: component test for the empty state, and that the product filter round-trips through the query param.

## Out of scope

- Any change to how restock notifications fire (still product-wide, unchanged).
- Any new seller-facing action (marking manually notified, exporting, etc.) — not asked for.
- Date-range filtering and waiting/notified status filtering — Rishi asked for product filtering only; can be added later if needed.
