import { NextRequest } from 'next/server';

export type DemoProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  mrp: number;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  manufacturer: string;
  images: string[];
  stock: number;
  gstPercent: number;
  minimumOrderQuantity: number;
  maximumOrderQuantity: number;
  discountType?: string;
  discountMeta?: Record<string, any>;
  isNew?: boolean;
  isBestSelling?: boolean;
  isDiscounted?: boolean;
  listings?: Array<{ id: string; stock: number }>;
};

export const demoProducts: DemoProduct[] = [
  {
    id: 'prod-1001',
    name: 'PharmaCare Vitamin C Tablets',
    description: 'Daily immunity support with fast-absorbing vitamin C tablets for healthy energy and recovery.',
    price: 180,
    mrp: 225,
    category: { id: 'cat-01', name: 'Vitamins', slug: 'vitamins' },
    manufacturer: 'Sun Pharma',
    images: ['/products/pharma_bottle.png'],
    stock: 180,
    gstPercent: 5,
    minimumOrderQuantity: 10,
    maximumOrderQuantity: 500,
    discountType: 'PTR_DISCOUNT',
    discountMeta: { discountPercent: 20, tag: '20% Off' },
    isNew: false,
    isBestSelling: true,
    isDiscounted: true,
    listings: [{ id: 'prod-1001', stock: 180 }],
  },
  {
    id: 'prod-1002',
    name: 'Dermaclear Neem Soap',
    description: 'Gentle skincare soap with neem extract to keep skin fresh, clean, and irritation-free.',
    price: 75,
    mrp: 100,
    category: { id: 'cat-02', name: 'Personal Care', slug: 'personal-care' },
    manufacturer: 'Himalaya',
    images: ['/products/pharma_bottle.png'],
    stock: 280,
    gstPercent: 12,
    minimumOrderQuantity: 5,
    maximumOrderQuantity: 200,
    discountType: 'SPECIAL_PRICE',
    discountMeta: { specialPrice: 75, tag: 'Special Price' },
    isNew: true,
    isBestSelling: false,
    isDiscounted: true,
    listings: [{ id: 'prod-1002', stock: 280 }],
  },
  {
    id: 'prod-1003',
    name: 'CoughGuard Syrup',
    description: 'Fast-acting cough syrup with herbal extracts to soothe throat irritation and clear congestion.',
    price: 110,
    mrp: 140,
    category: { id: 'cat-03', name: 'Cold & Flu', slug: 'cold-flu' },
    manufacturer: 'Cipla',
    images: ['/products/pharma_bottle.png'],
    stock: 120,
    gstPercent: 18,
    minimumOrderQuantity: 10,
    maximumOrderQuantity: 120,
    discountType: 'PTR_PLUS_SAME_PRODUCT_BONUS',
    discountMeta: { discountPercent: 10, buy: 1, get: 1, tag: 'Buy 1 Get 1' },
    isNew: false,
    isBestSelling: true,
    isDiscounted: true,
    listings: [{ id: 'prod-1003', stock: 120 }],
  },
  {
    id: 'prod-1004',
    name: 'JointFlex Capsules',
    description: 'Capsules designed to support joint comfort, flexibility and mobility for fast-moving professionals.',
    price: 320,
    mrp: 380,
    category: { id: 'cat-04', name: 'Nutrition', slug: 'nutrition' },
    manufacturer: "Dr. Reddy's",
    images: ['/products/pharma_bottle.png'],
    stock: 90,
    gstPercent: 18,
    minimumOrderQuantity: 10,
    maximumOrderQuantity: 100,
    discountType: 'DIFFERENT_PRODUCT_BONUS',
    discountMeta: { buy: 2, get: 1, bonusProductName: 'Pain Relief Roll-on', tag: 'Buy 2 Get 1' },
    isNew: false,
    isBestSelling: true,
    isDiscounted: true,
    listings: [{ id: 'prod-1004', stock: 90 }],
  },
  {
    id: 'prod-1005',
    name: 'MegaHerb Immunity Booster',
    description: 'Complete herbal immunity formula with vitamins, minerals and antioxidants for everyday protection.',
    price: 490,
    mrp: 599,
    category: { id: 'cat-01', name: 'Vitamins', slug: 'vitamins' },
    manufacturer: 'Abbott',
    images: ['/products/pharma_bottle.png'],
    stock: 60,
    gstPercent: 12,
    minimumOrderQuantity: 8,
    maximumOrderQuantity: 80,
    discountType: 'PTR_DISCOUNT',
    discountMeta: { discountPercent: 18, tag: '18% Off' },
    isNew: true,
    isBestSelling: false,
    isDiscounted: true,
    listings: [{ id: 'prod-1005', stock: 60 }],
  },
  {
    id: 'prod-1006',
    name: 'BabyComfort Diaper Rash Cream',
    description: 'Soothing cream for baby rash relief, gentle enough for everyday use on delicate skin.',
    price: 180,
    mrp: 220,
    category: { id: 'cat-02', name: 'Personal Care', slug: 'personal-care' },
    manufacturer: 'Johnson & Johnson',
    images: ['/products/pharma_bottle.png'],
    stock: 145,
    gstPercent: 12,
    minimumOrderQuantity: 5,
    maximumOrderQuantity: 120,
    discountType: 'SAME_PRODUCT_BONUS',
    discountMeta: { buy: 2, get: 1, tag: 'Buy 2 Get 1' },
    isNew: false,
    isBestSelling: true,
    isDiscounted: true,
    listings: [{ id: 'prod-1006', stock: 145 }],
  },
];

export const demoCategories = [
  { id: 'cat-01', name: 'Vitamins', label: 'Vitamins', slug: 'vitamins', productCount: 2 },
  { id: 'cat-02', name: 'Personal Care', label: 'Personal Care', slug: 'personal-care', productCount: 2 },
  { id: 'cat-03', name: 'Cold & Flu', label: 'Cold & Flu', slug: 'cold-flu', productCount: 1 },
  { id: 'cat-04', name: 'Nutrition', label: 'Nutrition', slug: 'nutrition', productCount: 1 },
];

export const demoManufacturers = [
  { id: 'mfr-01', name: 'Sun Pharma', productCount: 1 },
  { id: 'mfr-02', name: 'Himalaya', productCount: 1 },
  { id: 'mfr-03', name: 'Cipla', productCount: 1 },
  { id: 'mfr-04', name: "Dr. Reddy's", productCount: 1 },
  { id: 'mfr-05', name: 'Abbott', productCount: 1 },
  { id: 'mfr-06', name: 'Johnson & Johnson', productCount: 1 },
];

export const demoCities = [
  { id: 'city-01', name: 'Mumbai', state: 'Maharashtra' },
  { id: 'city-02', name: 'Bengaluru', state: 'Karnataka' },
  { id: 'city-03', name: 'Delhi', state: 'Delhi' },
];

export const featuredDemoProducts = demoProducts.slice(0, 4);

function parseBool(value: string | null) {
  return value === 'true' || value === '1';
}

export function filterDemoProducts(request: NextRequest) {
  const url = request.nextUrl;
  const search = url.searchParams.get('search')?.trim().toLowerCase();
  const categoryId = url.searchParams.get('categoryId') || url.searchParams.get('category');
  const manufacturer = url.searchParams.get('manufacturer')?.trim().toLowerCase();
  const minPrice = url.searchParams.get('minPrice') ? Number(url.searchParams.get('minPrice')) : undefined;
  const maxPrice = url.searchParams.get('maxPrice') ? Number(url.searchParams.get('maxPrice')) : undefined;
  const isNew = parseBool(url.searchParams.get('isNew'));
  const isDiscounted = parseBool(url.searchParams.get('isDiscounted'));
  const isBestSelling = parseBool(url.searchParams.get('isBestSelling'));
  const sortBy = url.searchParams.get('sortBy');
  const sortOrder = url.searchParams.get('sortOrder');

  let results = demoProducts.filter((product) => {
    if (search && !product.name.toLowerCase().includes(search) && !product.description.toLowerCase().includes(search)) {
      return false;
    }

    if (categoryId) {
      const matchesCategory = product.category.id === categoryId || product.category.slug === categoryId || product.category.name.toLowerCase() === categoryId.toLowerCase();
      if (!matchesCategory) {
        return false;
      }
    }

    if (manufacturer && product.manufacturer.toLowerCase() !== manufacturer) {
      return false;
    }

    if (typeof minPrice === 'number' && !Number.isNaN(minPrice) && product.price < minPrice) {
      return false;
    }

    if (typeof maxPrice === 'number' && !Number.isNaN(maxPrice) && product.price > maxPrice) {
      return false;
    }

    if (isNew && !product.isNew) {
      return false;
    }

    if (isDiscounted && !product.isDiscounted) {
      return false;
    }

    if (isBestSelling && !product.isBestSelling) {
      return false;
    }

    return true;
  });

  if (sortBy === 'price') {
    results = results.sort((a, b) => (sortOrder === 'asc' ? a.price - b.price : b.price - a.price));
  } else if (sortBy === 'newest') {
    results = results.sort((a, b) => {
      const aIndex = demoProducts.findIndex((item) => item.id === a.id);
      const bIndex = demoProducts.findIndex((item) => item.id === b.id);
      return sortOrder === 'asc' ? aIndex - bIndex : bIndex - aIndex;
    });
  }

  return results;
}
