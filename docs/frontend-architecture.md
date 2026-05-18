# PharmaBag Frontend Architecture

## Overview

PharmaBag is a pharmaceutical B2B marketplace built as a **pnpm monorepo** with **Next.js 14 App Router** applications and shared packages.

The backend (NestJS) exposes a REST API at `http://localhost:3000/api`.

---

## Monorepo Structure

```
pharmabag-web/
├── apps/
│   ├── buyer/          # Buyer marketplace (port 3001)
│   ├── seller/         # Seller dashboard (port 3002)
│   └── admin/          # Admin panel (port 3003)
├── packages/
│   ├── ui/             # Shared UI component library
│   ├── api-client/     # Shared API client (Axios + Zod)
│   └── utils/          # Shared utility functions
├── docs/               # Documentation
├── pnpm-workspace.yaml # Workspace configuration
├── package.json        # Root scripts & dev dependencies
├── tsconfig.json       # Root TypeScript configuration
├── .eslintrc.json      # Root ESLint configuration
├── .prettierrc         # Prettier configuration
└── .gitignore
```

### Applications

| App      | Port | Description                           |
| -------- | ---- | ------------------------------------- |
| `buyer`  | 3001 | Customer-facing marketplace           |
| `seller` | 3002 | Seller dashboard for managing products |
| `admin`  | 3003 | Platform administration panel         |

Each app is a standalone Next.js 14 application using the **App Router** with:
- TypeScript
- TailwindCSS
- TanStack React Query
- Shared packages (`@pharmabag/ui`, `@pharmabag/api-client`, `@pharmabag/utils`)

---

## Shared Packages

### `@pharmabag/ui`

Reusable UI component library built with TailwindCSS, class-variance-authority, and Shadcn UI patterns.

**Components:**
- `Button` — Polymorphic button with variants (default, destructive, outline, secondary, ghost, link) and sizes
- `Input` — Form input with label, error, and helper text support
- `Card` — Card layout (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
- `Modal` — Accessible modal dialog with backdrop and size variants
- `Toast` — Toast notification system with provider and `useToast()` hook
- `Loader` — Spinner component with size variants and full-screen mode
- `Table` — Fully composable table primitives (Table, TableHeader, TableBody, TableRow, etc.)

**Usage:**
```tsx
import { Button, Card, CardContent, useToast } from '@pharmabag/ui';
```

**Utilities:**
- `cn()` — Tailwind class merger (clsx + tailwind-merge)
- `theme` — Design token constants

---

### `@pharmabag/api-client`

Centralized API client built with **Axios** and **Zod** for type-safe API communication.

**Core (`api.ts`):**
- Axios instance with dynamic `baseURL` from `NEXT_PUBLIC_API_URL`
- Automatic `Authorization: Bearer <token>` header injection
- Token refresh flow with request queuing on 401 responses
- Global error handling for 403, 404, 5xx errors
- `withCredentials: true` for httpOnly cookie support

**API Modules:**
| Module                | Functions                                           |
| --------------------- | --------------------------------------------------- |
| `auth.api.ts`         | `sendOtp`, `verifyOtp`, `refreshToken`, `logout`, `getProfile` |
| `products.api.ts`     | `getProducts`, `getProductById`, `createProduct`, `updateProduct`, `deleteProduct` |
| `cart.api.ts`         | `getCart`, `addToCart`, `updateCartItem`, `removeCartItem`, `clearCart` |
| `orders.api.ts`       | `getOrders`, `getOrderById`, `createOrder`, `cancelOrder`, `updateOrderStatus` |
| `payments.api.ts`     | `initiatePayment`, `verifyPayment`, `getPaymentByOrderId`, `getPaymentHistory` |
| `notifications.api.ts`| `getNotifications`, `markAsRead`, `markAllAsRead`, `deleteNotification` |
| `reviews.api.ts`      | `getProductReviews`, `createReview`, `updateReview`, `deleteReview` |
| `tickets.api.ts`      | `getTickets`, `getTicketById`, `createTicket`, `addTicketMessage`, `closeTicket` |

**Authentication:**
- `AuthProvider` — React context for auth state management
- `useAuth()` — Hook exposing `user`, `isAuthenticated`, `isLoading`, `sendOtp`, `verifyOtp`, `logout`

**Usage:**
```tsx
import { useAuth, getProducts, type Product } from '@pharmabag/api-client';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  // ...
}
```

---

### `@pharmabag/utils`

Shared utility functions and validators.

| File                | Exports                                                 |
| ------------------- | ------------------------------------------------------- |
| `formatCurrency.ts` | `formatCurrency`, `parseCurrency`, `formatNumber`       |
| `formatDate.ts`     | `formatDate`, `formatRelativeTime`, `toISODateString`, `formatDateTime` |
| `pagination.ts`     | `calculatePagination`, `getOffset`, `getPageNumbers`, `DEFAULT_PAGINATION` |
| `validators.ts`     | `isValidPhone`, `isValidEmail`, `isValidOtp`, `isValidPincode`, `isValidGST`, `isValidPAN` + Zod schemas |

**Usage:**
```tsx
import { formatCurrency, isValidPhone, DEFAULT_PAGINATION } from '@pharmabag/utils';

formatCurrency(1500);    // "₹1,500.00"
isValidPhone('9876543210'); // true
```

---

## Environment Configuration

Each app reads environment variables from `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

The API client reads `NEXT_PUBLIC_API_URL` dynamically at runtime. For production, set the appropriate API URL in your deployment environment.

---

## Data Fetching

All apps use **TanStack React Query** via a shared `ReactQueryProvider` wrapper with:
- `staleTime: 60s` — Data considered fresh for 1 minute
- `gcTime: 5min` — Garbage collection after 5 minutes
- `retry: 1` — Single retry on failure
- `refetchOnWindowFocus: false` — No auto-refetch on window focus

---

## Authentication Flow

1. User enters phone number → `sendOtp(phone)` is called
2. User enters 6-digit OTP → `verifyOtp(phone, otp)` is called
3. Access token is stored **in-memory** (not localStorage for security)
4. Refresh token is stored as **httpOnly cookie** by the backend
5. On 401, the interceptor automatically attempts token refresh
6. On refresh failure, the user is redirected to `/login`

---

## Development

### Prerequisites
- Node.js >= 18
- pnpm >= 8

### Commands

| Command            | Description                     |
| ------------------ | ------------------------------- |
| `pnpm dev`         | Start buyer app (port 3001)     |
| `pnpm dev:seller`  | Start seller app (port 3002)    |
| `pnpm dev:admin`   | Start admin app (port 3003)     |
| `pnpm build`       | Build all apps                  |
| `pnpm lint`        | Run ESLint across all packages  |
| `pnpm format`      | Format all files with Prettier  |
| `pnpm format:check`| Check formatting                |

### Install Dependencies

```bash
pnpm install
```

### Adding a Dependency

```bash
# To a specific app
pnpm --filter buyer add <package>

# To a shared package
pnpm --filter @pharmabag/ui add <package>

# To the root (dev dependency)
pnpm add -D -w <package>
```

---

## Styling

- **TailwindCSS** for utility-first styling
- **Shadcn UI** patterns for component design
- CSS custom properties (HSL) for theming (light/dark mode)
- Shared theme tokens in `packages/ui/src/theme.ts`

---

## Architecture Decisions

1. **pnpm Workspaces** — Fast, disk-efficient monorepo management
2. **Next.js 14 App Router** — Server components, layouts, streaming
3. **In-memory token storage** — More secure than localStorage (XSS-resistant)
4. **Zod validation** — Runtime type safety for all API responses
5. **Axios interceptors** — Automatic auth and error handling
6. **TanStack React Query** — Server state management with caching
7. **Separate apps** — Independent deployment and scaling per user role
