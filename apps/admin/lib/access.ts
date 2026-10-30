/**
 * Tab-level admin access, client side.
 *
 * The API is the authority - every admin endpoint is enforced there by
 * AdminAccessGuard. This file exists so the panel shows people only what they
 * can actually use: tabs they cannot open are not in the sidebar, and actions
 * above their level are not rendered as buttons that fail on click.
 *
 * Levels are a ladder: full includes partial includes view.
 */

export const ACCESS_LEVELS = ["none", "view", "partial", "full"] as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[number];

const LEVEL_RANK: Record<AccessLevel, number> = { none: 0, view: 1, partial: 2, full: 3 };

export type TabKey =
  | "dashboard"
  | "products"
  | "brands"
  | "categories"
  | "suggestions"
  | "orders"
  | "selfShip"
  | "users"
  | "reviews"
  | "tickets"
  | "settlements"
  | "banners"
  | "homepageSections"
  | "marketing"
  | "blogs"
  | "seo"
  | "chatbot"
  | "notifications"
  | "admins"
  | "settings"
  | "activity";

export interface AdminAccess {
  isSuper: boolean;
  tabs: Partial<Record<TabKey, AccessLevel>>;
}

export const SUPER_ACCESS: AdminAccess = { isSuper: true, tabs: {} };

/**
 * Mirrors the API's group copy so the grant screen can render before the
 * catalog request resolves, and still works if that request fails. The API
 * response wins when it arrives.
 */
export interface AccessGroup {
  key: string;
  label: string;
  tabs: { key: TabKey; label: string }[];
  supportsPartial: boolean;
  /** Exactly which levels to offer, when the group is not the usual four. */
  levels?: AccessLevel[];
  partialMeans?: string;
  fullMeans: string;
}

/** The levels a group's picker should show. */
export function levelsForGroup(group: AccessGroup): AccessLevel[] {
  if (group.levels?.length) return group.levels;
  return group.supportsPartial
    ? [...ACCESS_LEVELS]
    : ACCESS_LEVELS.filter((level) => level !== "partial");
}

export const ACCESS_GROUPS: AccessGroup[] = [
  {
    key: "overview",
    label: "Overview",
    // Revenue, order counts and customer totals live here, so it is granted
    // like any other section. Nothing on it can be edited.
    supportsPartial: false,
    levels: ["none", "view"],
    fullMeans: "See the dashboard: revenue, orders, customers and traffic",
    tabs: [{ key: "dashboard", label: "Dashboard" }],
  },
  {
    key: "catalog",
    label: "Catalog",
    supportsPartial: true,
    partialMeans: "Edit product details, activate or deactivate listings, edit brands and categories",
    fullMeans: "Also approve or reject listings, delete, and bulk import",
    tabs: [
      { key: "products", label: "Products" },
      { key: "brands", label: "Brands" },
      { key: "categories", label: "Categories" },
      { key: "suggestions", label: "Suggestions" },
    ],
  },
  {
    key: "orders",
    label: "Orders & Shipping",
    supportsPartial: true,
    partialMeans: "Update order status, print invoices, create shipments",
    fullMeans: "Also cancel orders and confirm or reject payments",
    tabs: [
      { key: "orders", label: "Orders" },
      { key: "selfShip", label: "Self Ship" },
    ],
  },
  {
    key: "customers",
    label: "Customers",
    supportsPartial: true,
    partialMeans: "Reply to tickets, edit customer details, change ticket status",
    fullMeans: "Also block or delete users, approve or reject sellers, delete reviews",
    tabs: [
      { key: "users", label: "Users" },
      { key: "reviews", label: "Reviews" },
      { key: "tickets", label: "Tickets" },
    ],
  },
  {
    key: "money",
    label: "Money",
    supportsPartial: true,
    partialMeans: "Sync and recalculate settlements",
    fullMeans: "Also mark settlements paid",
    tabs: [{ key: "settlements", label: "Settlements" }],
  },
  {
    key: "content",
    label: "Content & Marketing",
    supportsPartial: true,
    partialMeans: "Create and edit content, edit copy and metadata",
    fullMeans: "Also publish or unpublish, delete, manage SEO redirects, and broadcast notifications",
    tabs: [
      { key: "banners", label: "HeroSection Image" },
      { key: "homepageSections", label: "Homepage Sections" },
      { key: "marketing", label: "Marketing" },
      { key: "blogs", label: "Blogs" },
      { key: "seo", label: "SEO" },
      { key: "chatbot", label: "AI Chatbot" },
      { key: "notifications", label: "Notifications" },
    ],
  },
  {
    key: "system",
    label: "System",
    supportsPartial: false,
    levels: ["none", "view", "full"],
    fullMeans: "Change platform settings. Granting admin access itself always requires Super Admin.",
    tabs: [
      { key: "admins", label: "Admins" },
      { key: "settings", label: "Settings" },
    ],
  },
  {
    // Its own group rather than a row inside System, because its levels are
    // genuinely different: the activity log has no write actions, so "full"
    // would be a control that does nothing. Offering none/view only keeps the
    // grant screen honest about what can actually be given.
    key: "audit",
    label: "Audit",
    supportsPartial: false,
    levels: ["none", "view"],
    fullMeans:
      "See the activity log: every action other admins take in the panel. Entries can never be edited or deleted by anyone, including Super Admins.",
    tabs: [{ key: "activity", label: "Activity Log" }],
  },
];

export const ALL_TAB_KEYS: TabKey[] = ACCESS_GROUPS.flatMap((group) =>
  group.tabs.map((tab) => tab.key),
);

export const TAB_LABELS: Record<string, string> = Object.fromEntries(
  ACCESS_GROUPS.flatMap((group) => group.tabs.map((tab) => [tab.key, tab.label])),
);

/**
 * Reads whatever the API returned for the signed-in admin.
 *
 * `access` is what /auth/me now sends. Older responses (or a cached user from
 * before this shipped) only carry the legacy `permissions` string, and every
 * legacy value means Super Admin - the same rule the API applies - so a stale
 * cache can never lock someone out of their own panel.
 */
export function readAccess(user: any): AdminAccess {
  const profile = user?.adminProfile ?? user;
  const access = profile?.access;

  if (access && typeof access === "object" && typeof access.isSuper === "boolean") {
    return { isSuper: access.isSuper, tabs: access.tabs ?? {} };
  }

  const permissions: string | undefined = profile?.permissions;
  if (typeof permissions === "string" && permissions.startsWith("v2:")) {
    if (permissions === "v2:super") return SUPER_ACCESS;
    try {
      const parsed = JSON.parse(permissions.slice(3));
      return { isSuper: false, tabs: parsed ?? {} };
    } catch {
      return { isSuper: false, tabs: {} };
    }
  }

  return SUPER_ACCESS;
}

export function levelFor(access: AdminAccess, tab: TabKey): AccessLevel {
  if (access.isSuper) return "full";
  return access.tabs[tab] ?? "none";
}

export function can(access: AdminAccess, tab: TabKey, required: AccessLevel = "view"): boolean {
  return LEVEL_RANK[levelFor(access, tab)] >= LEVEL_RANK[required];
}

/**
 * Page route -> tab, in sidebar order (firstAccessibleRoute walks this list).
 * Only routes listed here are gated; anything else follows its prefix or is
 * open.
 */
const ROUTE_TABS: [string, TabKey][] = [
  ["/dashboard", "dashboard"],
  ["/analytics", "dashboard"],
  ["/products", "products"],
  ["/product-requests", "products"],
  ["/brands", "brands"],
  ["/collections", "categories"],
  ["/categories", "categories"],
  ["/suggestions", "suggestions"],
  ["/orders", "orders"],
  ["/abandoned-checkouts", "orders"],
  ["/payments", "orders"],
  ["/custom-orders", "orders"],
  ["/self-ship", "selfShip"],
  ["/users", "users"],
  ["/buyers", "users"],
  ["/reviews", "reviews"],
  ["/tickets", "tickets"],
  ["/settlements", "settlements"],
  ["/banners", "banners"],
  ["/homepage-sections", "homepageSections"],
  ["/marketing", "marketing"],
  ["/referrals", "marketing"],
  ["/blogs", "blogs"],
  ["/seo", "seo"],
  ["/chatbot", "chatbot"],
  ["/notifications", "notifications"],
  ["/admins", "admins"],
  ["/activity", "activity"],
  ["/settings", "settings"],
];

/**
 * Where to send an admin who has no business on the dashboard. Follows the
 * sidebar's order so the landing page is the first thing they can actually
 * open; returns null when they have nothing at all.
 */
export function firstAccessibleRoute(adminAccess: AdminAccess): string | null {
  if (adminAccess.isSuper) return "/dashboard";
  const match = ROUTE_TABS.find(([, tab]) =>
    tab === "admins" ? adminAccess.isSuper : can(adminAccess, tab, "view"),
  );
  return match ? match[0] : null;
}

export function tabForRoute(pathname: string): TabKey | null {
  const match = ROUTE_TABS.find(
    ([prefix]) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
  return match ? match[1] : null;
}

/** Admin management is Super-Admin-only, matching the API. */
export function canOpenRoute(access: AdminAccess, pathname: string): boolean {
  const tab = tabForRoute(pathname);
  if (!tab) return true; // dashboard, analytics, anything unlisted
  if (tab === "admins") return access.isSuper;
  return can(access, tab, "view");
}
