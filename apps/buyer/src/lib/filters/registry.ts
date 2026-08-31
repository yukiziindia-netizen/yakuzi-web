import type { FilterConfig } from './types';

/**
 * What the filter button offers, per page.
 *
 * A page absent from here has no filter button at all — that is the point.
 * Profile, onboarding, checkout, support threads and payment pages have
 * nothing to filter, and showing a button that writes dead params to their
 * URL was worse than showing nothing.
 */

const SORT_CATALOGUE = {
  kind: 'sort' as const,
  label: 'Sort by',
  options: [
    { label: 'Relevance', params: { sortBy: null, sortOrder: null } },
    { label: 'Price: Low to High', params: { sortBy: 'price', sortOrder: 'asc' } },
    { label: 'Price: High to Low', params: { sortBy: 'price', sortOrder: 'desc' } },
    { label: 'Newest First', params: { sortBy: 'newest', sortOrder: 'desc' } },
  ],
};

/**
 * Catalogue filters — the params the homepage and category pages already read
 * in buildProductQueryParams / the category page's getProducts call. Nothing
 * here is new server-side; the panel simply stops writing params no page reads.
 */
function catalogueConfig(opts: { title: string; subtitle: string; priceCeiling: number }): FilterConfig {
  return {
    title: opts.title,
    subtitle: opts.subtitle,
    sections: [
      { id: 'sort', title: 'Sort', fields: [SORT_CATALOGUE] },
      {
        id: 'price',
        title: 'Price',
        fields: [
          {
            kind: 'range',
            minKey: 'minPrice',
            maxKey: 'maxPrice',
            label: 'Price range',
            ceiling: opts.priceCeiling,
            step: 100,
            prefix: '₹',
          },
        ],
      },
      {
        id: 'highlights',
        title: 'Highlights',
        fields: [
          { kind: 'toggle', key: 'isNew', label: 'New arrivals' },
          { kind: 'toggle', key: 'isBestSelling', label: 'Best selling' },
          { kind: 'toggle', key: 'isYukiziChoice', label: 'Yukizi Choice' },
        ],
      },
      {
        // The API treats any non-"All" discountRange as "has some discount" —
        // it never reads the value (products.service.ts:1050). The original
        // four options ("<50+", "30-35", "50-90", ">50++") were therefore all
        // identical, and offering thresholds here would promise a filter the
        // backend cannot honour. One honest toggle instead.
        id: 'discount',
        title: 'Discount',
        fields: [{ kind: 'toggle', key: 'discountRange', label: 'On discount', trueValue: 'any' }],
      },
      {
        id: 'brand',
        title: 'Brand',
        fields: [{ kind: 'select', key: 'manufacturer', label: 'Brand', source: 'manufacturers' }],
      },
      {
        id: 'location',
        title: 'Seller location',
        fields: [{ kind: 'select', key: 'location', label: 'Ships from', source: 'cities' }],
      },
    ],
  };
}

const ORDER_STATUS_OPTIONS = [
  { label: 'All orders', value: 'All' },
  { label: 'Awaiting payment', value: 'AWAITING_PAYMENT' },
  { label: 'Placed', value: 'PLACED' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'Ready to ship', value: 'READY_TO_SHIP' },
  { label: 'Dispatched', value: 'DISPATCHED' },
  { label: 'Shipped', value: 'SHIPPED' },
  { label: 'Out for delivery', value: 'OUT_FOR_DELIVERY' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const PAYMENT_STATUS_OPTIONS = [
  { label: 'Any', value: 'All' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Refunded', value: 'REFUNDED' },
];

const ordersConfig: FilterConfig = {
  title: 'Filter orders',
  subtitle: 'Narrow your order history.',
  sections: [
    {
      id: 'status',
      title: 'Order status',
      fields: [{ kind: 'select', key: 'orderStatus', label: 'Status', options: ORDER_STATUS_OPTIONS }],
    },
    {
      id: 'payment',
      title: 'Payment',
      fields: [{ kind: 'select', key: 'paymentStatus', label: 'Payment status', options: PAYMENT_STATUS_OPTIONS }],
    },
    {
      // Replaces the old year + month dropdowns, which could not express
      // "the last six weeks" or straddle a year boundary.
      id: 'date',
      title: 'Order date',
      fields: [{ kind: 'dateRange', fromKey: 'dateFrom', toKey: 'dateTo', label: 'Placed between' }],
    },
    {
      id: 'amount',
      title: 'Order value',
      fields: [
        {
          kind: 'range',
          minKey: 'minTotal',
          maxKey: 'maxTotal',
          label: 'Order total',
          ceiling: 50000,
          step: 500,
          prefix: '₹',
        },
      ],
    },
  ],
};

const blogsConfig: FilterConfig = {
  title: 'Filter posts',
  subtitle: 'Find a guide or story.',
  sections: [
    {
      id: 'sort',
      title: 'Sort',
      fields: [
        {
          kind: 'sort',
          label: 'Sort by',
          options: [
            { label: 'Newest first', params: { sortBy: null } },
            { label: 'Oldest first', params: { sortBy: 'oldest' } },
          ],
        },
      ],
    },
    {
      id: 'category',
      title: 'Category',
      fields: [{ kind: 'select', key: 'category', label: 'Category', source: 'categories' }],
    },
  ],
};

const wishlistConfig: FilterConfig = {
  title: 'Filter saved items',
  subtitle: 'Your wishlist.',
  sections: [
    {
      id: 'availability',
      title: 'Availability',
      fields: [
        { kind: 'toggle', key: 'inStock', label: 'In stock only', hint: 'Hide items no seller is currently listing' },
        { kind: 'toggle', key: 'onSale', label: 'On discount only' },
      ],
    },
    {
      id: 'sort',
      title: 'Sort',
      fields: [
        {
          kind: 'sort',
          label: 'Sort by',
          options: [
            { label: 'Recently added', params: { sortBy: null } },
            { label: 'Price: Low to High', params: { sortBy: 'price-asc' } },
            { label: 'Price: High to Low', params: { sortBy: 'price-desc' } },
          ],
        },
      ],
    },
  ],
};

const notificationsConfig: FilterConfig = {
  title: 'Filter notifications',
  sections: [
    {
      id: 'read',
      title: 'Status',
      fields: [{ kind: 'toggle', key: 'unread', label: 'Unread only' }],
    },
    {
      id: 'type',
      title: 'Type',
      fields: [
        {
          kind: 'chips',
          key: 'type',
          label: 'Kind',
          options: [
            { label: 'All', value: 'All' },
            { label: 'Orders', value: 'ORDER' },
            { label: 'Payments', value: 'PAYMENT' },
            { label: 'Stock alerts', value: 'STOCK' },
          ],
        },
      ],
    },
  ],
};

/**
 * Product page — filters the seller list, not the catalogue. Sellers come and
 * go and a popular product can carry a long list, so "who can actually get
 * this to me, and for how much" is the question worth answering here.
 *
 * Seller rating is included because the listing payload already carries
 * `seller.rating` — the page sorts by it today. Ratings are sparse, so the
 * filter offers thresholds rather than pretending every seller has a score.
 */
const productConfig: FilterConfig = {
  title: 'Filter sellers',
  subtitle: 'Choose who you buy this from.',
  sections: [
    {
      id: 'availability',
      title: 'Availability',
      fields: [{ kind: 'toggle', key: 'sellerInStock', label: 'In stock only' }],
    },
    {
      id: 'price',
      title: 'Price',
      fields: [
        {
          kind: 'range',
          minKey: 'sellerMinPrice',
          maxKey: 'sellerMaxPrice',
          label: 'Price range',
          ceiling: 100000,
          step: 100,
          prefix: '₹',
        },
      ],
    },
    {
      id: 'rating',
      title: 'Seller rating',
      fields: [
        {
          kind: 'chips',
          key: 'sellerRating',
          label: 'Minimum rating',
          options: [
            { label: 'Any', value: 'All' },
            { label: '3★ and up', value: '3' },
            { label: '4★ and up', value: '4' },
          ],
        },
      ],
    },
    {
      id: 'sort',
      title: 'Sort sellers',
      fields: [
        {
          kind: 'sort',
          label: 'Order by',
          options: [
            { label: 'Best rated', params: { sellerSort: null } },
            { label: 'Lowest price', params: { sellerSort: 'price' } },
            { label: 'Free shipping first', params: { sellerSort: 'shipping' } },
          ],
        },
      ],
    },
  ],
};

/**
 * Route to config. Order matters: the first match wins, so specific paths sit
 * above their prefixes.
 */
const ROUTES: { match: (path: string) => boolean; config: (ceiling: number) => FilterConfig }[] = [
  {
    match: (p) => p === '/',
    config: (ceiling) =>
      catalogueConfig({ title: 'Filter products', subtitle: 'Across the whole catalogue.', priceCeiling: ceiling }),
  },
  {
    match: (p) => p.startsWith('/category/'),
    config: (ceiling) =>
      catalogueConfig({ title: 'Filter this category', subtitle: 'Applies within this category.', priceCeiling: ceiling }),
  },
  { match: (p) => p.startsWith('/products/'), config: () => productConfig },
  // The order detail page shows one order — nothing to filter.
  { match: (p) => p === '/orders', config: () => ordersConfig },
  { match: (p) => p === '/blogs', config: () => blogsConfig },
  { match: (p) => p === '/wishlist', config: () => wishlistConfig },
  { match: (p) => p === '/notifications', config: () => notificationsConfig },
];

export const DEFAULT_PRICE_CEILING = 10000;

/** null means "this page has nothing to filter" — the button hides. */
export function filterConfigFor(pathname: string, priceCeiling = DEFAULT_PRICE_CEILING): FilterConfig | null {
  const route = ROUTES.find((r) => r.match(pathname));
  return route ? route.config(priceCeiling) : null;
}
