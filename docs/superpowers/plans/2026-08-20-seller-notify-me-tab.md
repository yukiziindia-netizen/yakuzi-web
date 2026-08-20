# Seller "Notify Me" Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give sellers a read-only dashboard tab showing which buyers clicked "Notify Me" on products the seller currently carries, with a per-product filter.

**Architecture:** Backend: one new `sellers.service.ts` method scopes `ProductWaitlist` rows through the seller's own active `SellerOffer`s (no schema change), exposed as `GET /sellers/waitlist`. Frontend: one API client function + one React Query hook + one new page in `apps/seller`, added to the existing sidebar. The product filter is done entirely client-side against the one fetched list (see Task 5 for why — avoids an id-namespace mismatch between `SellerOffer.id` and `CatalogProduct.id`).

**Tech Stack:** NestJS + Prisma (yakuzi-api), Next.js + React Query + Tailwind (yakuzi-web `apps/seller`), Jest for backend tests.

**Repos:** This plan spans two repos worked in separate local clones:
- API: `yakuzi-api`, worked in `/c/tmp/api-inv-explore` for this plan (branch: create `feat/seller-waitlist-endpoint` off `origin/main`)
- Web: `yakuzi-web`, already on branch `feat/seller-notify-me-tab` in `/c/tmp/web-inv-uifixes` (spec doc already committed there)

Two separate PRs will result (API must merge first — the frontend calls the new endpoint). Do not push either branch until its own tasks are fully done and verified; this client auto-merges PRs within minutes, so push once, right before opening the PR, not mid-task.

---

### Task 1: Backend — `SellersService.getWaitlist()` with tests

**Files:**
- Modify: `src/modules/sellers/sellers.service.ts`
- Modify: `src/modules/sellers/sellers.service.spec.ts`

- [ ] **Step 1: Create the branch**

```bash
cd /c/tmp/api-inv-explore
git fetch origin main --quiet
git checkout -B feat/seller-waitlist-endpoint origin/main
```

- [ ] **Step 2: Write the failing tests**

Add this new `describe` block to the end of `src/modules/sellers/sellers.service.spec.ts` (the file already has one `describe` block for `createProfile` — add this as a sibling, don't touch the existing one):

```typescript
describe('SellersService.getWaitlist', () => {
  const build = () => {
    const prisma = {
      sellerProfile: { findUnique: jest.fn() },
      sellerOffer: { findMany: jest.fn() },
      productWaitlist: { findMany: jest.fn() },
    };
    const idfyService = { isConfigured: jest.fn().mockReturnValue(false), verifyGst: jest.fn() };
    const mailService = { sendMail: jest.fn().mockResolvedValue({ sent: true, retryable: false }) };
    const service = new SellersService(prisma as never, idfyService as never, mailService as never);
    return { service, prisma };
  };

  it('returns an empty array when the user has no seller profile', async () => {
    const { service, prisma } = build();
    prisma.sellerProfile.findUnique.mockResolvedValue(null);

    const result = await service.getWaitlist('user-1');

    expect(result).toEqual([]);
    expect(prisma.sellerOffer.findMany).not.toHaveBeenCalled();
  });

  it('scopes to catalog products the seller currently has an active offer for', async () => {
    const { service, prisma } = build();
    prisma.sellerProfile.findUnique.mockResolvedValue({ id: 'profile-1' });
    prisma.sellerOffer.findMany.mockResolvedValue([
      { catalogProductId: 'prod-1' },
      { catalogProductId: 'prod-2' },
    ]);
    prisma.productWaitlist.findMany.mockResolvedValue([]);

    await service.getWaitlist('user-1');

    expect(prisma.sellerOffer.findMany).toHaveBeenCalledWith({
      where: { sellerId: 'profile-1', isActive: true, deletedAt: null, catalogProductId: { not: null } },
      select: { catalogProductId: true },
      distinct: ['catalogProductId'],
    });
    expect(prisma.productWaitlist.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { catalogProductId: { in: ['prod-1', 'prod-2'] } },
      }),
    );
  });

  it('filters to a single productId when provided, excluding products the seller does not carry', async () => {
    const { service, prisma } = build();
    prisma.sellerProfile.findUnique.mockResolvedValue({ id: 'profile-1' });
    prisma.sellerOffer.findMany.mockResolvedValue([{ catalogProductId: 'prod-1' }]);
    prisma.productWaitlist.findMany.mockResolvedValue([]);

    await service.getWaitlist('user-1', 'prod-not-mine');

    expect(prisma.productWaitlist.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { catalogProductId: { in: [] } } }),
    );
  });

  it('maps waitlist rows to the response shape, falling back through image and buyer name sources', async () => {
    const { service, prisma } = build();
    prisma.sellerProfile.findUnique.mockResolvedValue({ id: 'profile-1' });
    prisma.sellerOffer.findMany.mockResolvedValue([{ catalogProductId: 'prod-1' }]);
    prisma.productWaitlist.findMany.mockResolvedValue([
      {
        id: 'wl-1',
        createdAt: new Date('2026-08-20T10:00:00.000Z'),
        isNotified: false,
        catalogProduct: { id: 'prod-1', name: 'Funko Pop', images: [{ url: 'https://img/1.png' }] },
        user: { username: 'anime_fan_92' },
      },
      {
        id: 'wl-2',
        createdAt: new Date('2026-08-20T09:00:00.000Z'),
        isNotified: true,
        catalogProduct: { id: 'prod-1', name: 'Funko Pop', images: [] },
        user: { username: null },
      },
    ]);

    const result = await service.getWaitlist('user-1');

    expect(result).toEqual([
      {
        id: 'wl-1',
        product: { id: 'prod-1', name: 'Funko Pop', image: 'https://img/1.png' },
        buyer: { name: 'anime_fan_92' },
        createdAt: new Date('2026-08-20T10:00:00.000Z'),
        isNotified: false,
      },
      {
        id: 'wl-2',
        product: { id: 'prod-1', name: 'Funko Pop', image: null },
        buyer: { name: 'Yukizi buyer' },
        createdAt: new Date('2026-08-20T09:00:00.000Z'),
        isNotified: true,
      },
    ]);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- sellers.service.spec.ts`
Expected: FAIL — `TypeError: service.getWaitlist is not a function` (4 new failures, existing `createProfile` tests still pass)

- [ ] **Step 4: Implement `getWaitlist` in `sellers.service.ts`**

Add this method to the `SellersService` class. `getDashboard` is currently the last method in the class — its closing brace is at line 454, followed by a blank line then the class's own closing brace at line 456. Insert the new method right after `getDashboard`'s closing brace (line 454), before the class closes:

```typescript
  /**
   * Buyers waiting on products this seller currently carries. Scoped through
   * the seller's own active SellerOffers, not a direct FK on ProductWaitlist —
   * a buyer's "Notify Me" click targets the catalog product, not any one
   * seller's specific offer (a product page can list several sellers), and
   * the existing restock flow already notifies every waitlisted buyer for a
   * catalogProductId regardless of which seller restocked. So "this seller's
   * waitlist" means: any catalog product they currently have an active,
   * approved listing for.
   */
  async getWaitlist(userId: string, productId?: string) {
    const seller = await this.prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!seller) {
      return [];
    }

    const activeOffers = await this.prisma.sellerOffer.findMany({
      where: {
        sellerId: seller.id,
        isActive: true,
        deletedAt: null,
        catalogProductId: { not: null },
      },
      select: { catalogProductId: true },
      distinct: ['catalogProductId'],
    });

    let catalogProductIds = activeOffers
      .map((o) => o.catalogProductId)
      .filter((id): id is string => id !== null);

    if (productId) {
      catalogProductIds = catalogProductIds.filter((id) => id === productId);
    }

    const entries = await this.prisma.productWaitlist.findMany({
      where: { catalogProductId: { in: catalogProductIds } },
      orderBy: { createdAt: 'desc' },
      include: {
        catalogProduct: {
          select: {
            id: true,
            name: true,
            images: {
              orderBy: [{ order: 'asc' }, { id: 'asc' }],
              take: 1,
              select: { url: true },
            },
          },
        },
        user: { select: { username: true } },
      },
    });

    return entries.map((entry) => ({
      id: entry.id,
      product: {
        id: entry.catalogProduct.id,
        name: entry.catalogProduct.name,
        image: entry.catalogProduct.images[0]?.url ?? null,
      },
      buyer: { name: entry.user.username ?? 'Yukizi buyer' },
      createdAt: entry.createdAt,
      isNotified: entry.isNotified,
    }));
  }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- sellers.service.spec.ts`
Expected: PASS — all tests in the file green, including the pre-existing `createProfile` ones.

- [ ] **Step 6: Commit**

```bash
git add src/modules/sellers/sellers.service.ts src/modules/sellers/sellers.service.spec.ts
git commit -m "feat(sellers): add getWaitlist scoped to seller's active listings"
```

---

### Task 2: Backend — expose `GET /sellers/waitlist`

**Files:**
- Modify: `src/modules/sellers/sellers.controller.ts`

- [ ] **Step 1: Add the endpoint**

In `sellers.controller.ts`, add `Query` to the existing `@nestjs/common` import (currently `Controller, Post, Get, Patch, Body, UseGuards, HttpCode, HttpStatus`):

```typescript
import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
```

Then add this method at the end of the `SellersController` class, right after `getDashboard`:

```typescript
  @Get('waitlist')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get buyers waiting on this seller's out-of-stock products" })
  @ApiResponse({ status: 200, description: 'Waitlist entries returned' })
  async getWaitlist(
    @CurrentUser('id') userId: string,
    @Query('productId') productId?: string,
  ) {
    const data = await this.sellersService.getWaitlist(userId, productId);
    return { message: 'Waitlist retrieved successfully', data };
  }
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Run the full sellers test suite once more**

Run: `npm test -- sellers`
Expected: PASS (controller has no dedicated spec file in this codebase — consistent with the existing `SellersController`, which also has none — coverage comes from the service tests in Task 1)

- [ ] **Step 4: Commit**

```bash
git add src/modules/sellers/sellers.controller.ts
git commit -m "feat(sellers): expose GET /sellers/waitlist"
```

---

### Task 3: Backend — push and open the API PR

- [ ] **Step 1: Final verification**

```bash
npm test 2>&1 | tail -30
npx tsc --noEmit
```

Expected: full suite passes, no type errors.

- [ ] **Step 2: Push and open the PR (do this immediately after Step 1 passes — don't leave the branch pushed-but-idle, and don't push again after opening the PR: this client auto-merges within minutes; any later fix needs a fresh branch off a re-fetched `origin/main`, same as the rest of this session)**

```bash
git push fork feat/seller-waitlist-endpoint
gh pr create --repo yukiziindia-netizen/yakuzi-api --base main --head Coder-EraOfMarketing:feat/seller-waitlist-endpoint \
  --title "feat(sellers): GET /sellers/waitlist — buyers waiting on the seller's own products" \
  --body "Spec: docs/superpowers/specs/2026-08-20-seller-notify-me-tab-design.md (yakuzi-web repo). New read-only endpoint scoped through the seller's active SellerOffers (no schema change) — see the getWaitlist doc comment for why it's not a direct FK. Frontend PR (yakuzi-web) depends on this merging first. Jest: all tests pass. NOT click-through verified — no browser tool available this session."
```

---

### Task 4: Frontend — API client function + hook

**Files:**
- Modify: `apps/seller/api/seller.api.ts`
- Modify: `apps/seller/hooks/useSeller.ts`

- [ ] **Step 1: Add `getSellerWaitlist` to `seller.api.ts`**

Add this function (place it near `getSellerDashboard`, which follows the same shape):

```typescript
export async function getSellerWaitlist(params: { productId?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.productId) qs.set("productId", params.productId);
  const { data } = await apiClient.get<{ data: any[] }>(`/sellers/waitlist?${qs}`);
  return data.data ?? [];
}
```

- [ ] **Step 2: Add `useSellerWaitlist` to `useSeller.ts`**

Add `getSellerWaitlist` to the existing destructured import from `@/api/seller.api` at the top of the file (append it to the list that currently ends with `getSellerOrderInvoices,`):

```typescript
  getSellerOrderInvoices,
  getSellerWaitlist,
} from "@/api/seller.api";
```

Then add this hook (place it near `useSellerDashboard`):

```typescript
export function useSellerWaitlist() { return useQuery({ queryKey: ["seller", "waitlist"], queryFn: () => getSellerWaitlist(), staleTime: 60_000, retry: 1 }); }
```

Note: no `productId` param on the hook — the product filter is done client-side in Task 5 against this one fetched list, not as a second server round-trip. See Task 5's note for why.

- [ ] **Step 3: Type-check**

Run: `cd /c/tmp/web-inv-uifixes/apps/seller && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
cd /c/tmp/web-inv-uifixes
git add apps/seller/api/seller.api.ts apps/seller/hooks/useSeller.ts
git commit -m "feat(seller): add getSellerWaitlist API client fn + useSellerWaitlist hook"
```

---

### Task 5: Frontend — `NotifyMeContent` component

**Files:**
- Modify: `apps/seller/components/seller-pages.tsx`

**Why the filter is client-side, not `?productId=`:** `useSellerProducts()` (used elsewhere in this file, e.g. `InventoryContent`) returns the seller's own `SellerOffer` rows — each with its own `id`. The waitlist backend scopes and returns `CatalogProduct.id` under `product.id`. Those are two different id namespaces; a `SellerOffer.id` passed as `?productId=` would never match. Since a seller's own waitlist is expected to be small (their own products only, not site-wide), fetching the full list once and filtering/deriving dropdown options from it client-side sidesteps the mismatch entirely and avoids a second network round-trip on every filter change. The backend still supports `?productId=` (Task 1/2) for API completeness and any future caller that already has a real `catalogProductId`.

- [ ] **Step 1: Add the component**

Add this to `apps/seller/components/seller-pages.tsx`, right after the `OrderTable` function (which ends around line 103, just before `export function OrdersContent()`):

```typescript
export function NotifyMeContent() {
  const { data: entries, isLoading } = useSellerWaitlist();
  const allEntries: any[] = Array.isArray(entries) ? entries : [];
  const [productFilter, setProductFilter] = useState<string>("all");

  const products = useMemo(() => {
    const seen = new Map<string, string>();
    allEntries.forEach((e) => { if (!seen.has(e.product.id)) seen.set(e.product.id, e.product.name); });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [allEntries]);

  const filtered = productFilter === "all" ? allEntries : allEntries.filter((e) => e.product.id === productFilter);

  if (isLoading) return <div className="p-6 text-center text-muted-foreground">Loading waitlist...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl text-foreground">Notify Me</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Buyers waiting for your out-of-stock products</p>
        </div>
        {products.length > 0 && (
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="h-9 rounded-lg border border-white/20 bg-background/50 px-3 text-sm text-foreground focus:bg-background"
          >
            <option value="all">All products</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground text-sm">
          {allEntries.length === 0 ? "No one's on the waitlist for your products yet" : "No waitlist entries for this product"}
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Notify Me waitlist">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  {["Product", "Buyer", "Date", "Status"].map((h) => (
                    <th key={h} scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.map((entry: any) => (
                  <tr key={entry.id}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {entry.product.image && (
                          <img src={entry.product.image} alt={entry.product.name} className="h-9 w-9 rounded-lg object-contain bg-muted/40 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium text-foreground">{entry.product.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{entry.buyer.name}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{formatDate(entry.createdAt)}</td>
                    <td className="px-5 py-4">
                      <Badge variant={entry.isNotified ? "success" : "warning"}>{entry.isNotified ? "Notified" : "Waiting"}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire up the new imports**

In the same file's import block near the top, add `useSellerWaitlist` to the `@/hooks/useSeller` import list (the one that currently ends with `useSellerAnalytics,`):

```typescript
  useSellerAnalytics,
  useSellerWaitlist,
} from "@/hooks/useSeller";
```

`useState`, `useMemo`, `Badge`, and `formatDate` are already imported at the top of this file (confirmed in Task 5 grounding) — no other new imports needed.

- [ ] **Step 3: Type-check**

Run: `cd /c/tmp/web-inv-uifixes/apps/seller && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
cd /c/tmp/web-inv-uifixes
git add apps/seller/components/seller-pages.tsx
git commit -m "feat(seller): add NotifyMeContent waitlist table with client-side product filter"
```

---

### Task 6: Frontend — page route + sidebar entry

**Files:**
- Create: `apps/seller/app/notify-me/page.tsx`
- Modify: `apps/seller/components/layout/sidebar.tsx`

- [ ] **Step 1: Create the page**

```typescript
// apps/seller/app/notify-me/page.tsx
"use client";
import { NotifyMeContent } from "@/components/seller-pages";
export default function NotifyMePage() {
  return <div className="max-w-7xl mx-auto"><NotifyMeContent/></div>;
}
```

- [ ] **Step 2: Add the sidebar nav entry**

In `apps/seller/components/layout/sidebar.tsx`, add `BellRing` to the existing `lucide-react` import line:

```typescript
import { LayoutDashboard, Package, ClipboardList, LogOut, ChevronLeft, Store, Palmtree, LifeBuoy, Bell, BellRing, User } from "lucide-react";
```

Then add a new entry to the `NAV` array, right after the `Notifications` entry:

```typescript
const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Package, label: "Products", href: "/products" },
  { icon: ClipboardList, label: "Orders", href: "/orders", badge: "pending" },
  { icon: Bell, label: "Notifications", href: "/notifications" },
  { icon: BellRing, label: "Notify Me", href: "/notify-me" },
  { icon: LifeBuoy, label: "Support", href: "/support" },
  { icon: User, label: "Profile", href: "/profile" },
];
```

- [ ] **Step 3: Type-check and build**

```bash
cd /c/tmp/web-inv-uifixes/apps/seller
npx tsc --noEmit
```

Expected: no errors.

```bash
cd /c/tmp/web-inv-uifixes/apps/seller
npm run build
```

Expected: clean build (the seller app's own `package.json` script is `next build`; the monorepo root's `package.json` uses `pnpm -r build` to build every workspace, but building just this one changed app is faster and sufficient here).

- [ ] **Step 4: Commit**

```bash
git add apps/seller/app/notify-me/page.tsx apps/seller/components/layout/sidebar.tsx
git commit -m "feat(seller): add Notify Me page route and sidebar entry"
```

---

### Task 7: Frontend — push and open the web PR

**Do this task only after Task 3's API PR has actually merged** — confirm with `gh pr view <api-pr-number> --repo yukiziindia-netizen/yakuzi-api --json state,mergedAt` before pushing, since the frontend calls the new endpoint directly.

- [ ] **Step 1: Rebase onto current main and do a final full build**

```bash
cd /c/tmp/web-inv-uifixes
git fetch origin main --quiet
git rebase origin/main
npx tsc --noEmit --project apps/seller/tsconfig.json 2>&1 | tail -30
```

Resolve conflicts if any (unlikely — this branch only touches seller-app files and one new spec/plan doc).

- [ ] **Step 2: Push and open the PR immediately (no further commits to this branch after opening it)**

```bash
git push fork feat/seller-notify-me-tab
gh pr create --repo yukiziindia-netizen/yakuzi-web --base main --head Coder-EraOfMarketing:feat/seller-notify-me-tab \
  --title "feat(seller): Notify Me tab — see who's waiting on your products" \
  --body "Spec: docs/superpowers/specs/2026-08-20-seller-notify-me-tab-design.md. Depends on the yakuzi-api PR (getWaitlist endpoint) already being merged. New read-only sidebar tab, product filter is client-side (see NotifyMeContent's comment for why — SellerOffer.id and CatalogProduct.id are different id spaces). tsc + build clean. NOT click-through verified — no browser tool available this session; please confirm on a real seller account after deploy: the tab appears, shows real waitlist entries scoped to that seller's own products only, and the product filter narrows correctly."
```

---

## Self-review notes (already applied above, kept here for the record)

- **Spec coverage**: scoping rule (Task 1), API shape incl. buyer-name/image fallbacks (Task 1), frontend tab + filter (Tasks 5-6) — all covered. Read-only / no new seller actions — satisfied, no mutation endpoints added anywhere in this plan.
- **Type consistency**: `getWaitlist(userId, productId?)` signature matches from controller call site (Task 2) through to the service (Task 1) and its tests. `product.image` is nullable (`string | null`) consistently in the service mapping and the frontend's `entry.product.image &&` guard.
- **Corrected during planning, not just carried over from the spec**: the spec's suggestion to reuse `useSellerProducts()` for the filter dropdown would have been a real bug (wrong id namespace) — caught here and replaced with client-side derivation from the waitlist response itself.
