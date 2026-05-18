#!/usr/bin/env node

/**
 * Complete Product Journey Test Script (TypeScript Version)
 * 
 * Compile with: npx tsc test-product-journey.ts
 * Run with: node test-product-journey.js
 */

import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.BACKEND_URL || 'https://pharmabag-api.onrender.com';
const API_URL = `${API_BASE_URL}/api`;

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Type definitions
interface TestUser {
  email: string;
  password: string;
  phone?: string;
  businessName?: string;
  gstNumber?: string;
}

interface TestProduct {
  name: string;
  mrp: number;
  manufacturer: string;
  chemicalComposition: string;
  stock: number;
  expiryDate: string;
  minimumOrderQuantity: number;
  maximumOrderQuantity: number;
  gstPercent: number;
  images: string[];
  categoryId?: string;
  subCategoryId?: string;
}

interface TestData {
  seller: TestUser;
  admin: TestUser;
  buyer: TestUser;
  product: TestProduct;
}

interface AuthResponse {
  data: {
    accessToken: string;
    user?: any;
  };
}

interface ProductResponse {
  data: {
    id: string;
    name: string;
    approvalStatus: string;
    isActive: boolean;
    [key: string]: any;
  };
}

interface CategoryResponse {
  data: Array<{
    id: string;
    name: string;
    subCategories?: Array<{ id: string; name: string }>;
  }>;
}

interface OrderResponse {
  data: {
    id: string;
    finalAmount?: number;
    total?: number;
    status: string;
    items?: Array<{
      productId: string;
      quantity: number;
    }>;
  };
}

// Test data
const testData: TestData = {
  seller: {
    email: `seller-test-${Date.now()}@test.com`,
    password: 'TestPassword123!',
    phone: '9831864222',
    businessName: 'Test Pharmacy',
    gstNumber: '22AAAAA0000A1Z5',
  },
  admin: {
    email: 'admin@pharmabag.com',
    password: 'Admin@123',
  },
  buyer: {
    email: `buyer-test-${Date.now()}@test.com`,
    password: 'TestPassword123!',
    phone: '9876543210',
    businessName: 'Test Business',
    gstNumber: '22BBBBB0000B1Z5',
  },
  product: {
    name: `Test Product ${Date.now()}`,
    mrp: 500,
    manufacturer: 'Test Manufacturer',
    chemicalComposition: 'Test Composition',
    stock: 100,
    expiryDate: '2025-12-31',
    minimumOrderQuantity: 1,
    maximumOrderQuantity: 50,
    gstPercent: 12,
    images: ['https://via.placeholder.com/300'],
  },
};

// State
let sellerToken: string | null = null;
let adminToken: string | null = null;
let buyerToken: string | null = null;

// HTTP client
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response) {
      return Promise.reject({
        status: error.response.status,
        message: error.response.data?.message || error.response.data?.error || error.message,
        data: error.response.data,
      });
    }
    return Promise.reject(error);
  }
);

// Logging utilities
const log = {
  header: (msg: string) =>
    console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}${colors.reset}\n`),
  step: (num: number | string, msg: string) =>
    console.log(`${colors.bright}${colors.blue}[Step ${num}]${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.yellow}ℹ ${msg}${colors.reset}`),
  data: (label: string, obj: any) =>
    console.log(`\n${colors.cyan}${label}:${colors.reset}`, JSON.stringify(obj, null, 2)),
};

// Authentication functions
async function registerSeller(): Promise<any> {
  log.step(1, 'Registering seller account');
  try {
    const response = await apiClient.post<AuthResponse>('/auth/register', {
      email: testData.seller.email,
      password: testData.seller.password,
      phone: testData.seller.phone,
      businessName: testData.seller.businessName,
      gstNumber: testData.seller.gstNumber,
      role: 'SELLER',
    });

    if (response.data?.data?.accessToken) {
      sellerToken = response.data.data.accessToken;
      log.success(`Seller registered: ${testData.seller.email}`);
      return response.data.data;
    } else {
      throw new Error('No token in response');
    }
  } catch (error: any) {
    if (error.status === 409) {
      log.info('Seller already exists, attempting login');
      return loginSeller();
    }
    throw error;
  }
}

async function loginSeller(): Promise<any> {
  log.step(1, 'Logging in seller account');
  try {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      email: testData.seller.email,
      password: testData.seller.password,
    });

    sellerToken = response.data?.data?.accessToken;
    if (!sellerToken) throw new Error('No token in response');
    log.success(`Seller logged in: ${testData.seller.email}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

async function loginAdmin(): Promise<any> {
  log.step(6, 'Logging in admin account');
  try {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      email: testData.admin.email,
      password: testData.admin.password,
    });

    adminToken = response.data?.data?.accessToken;
    if (!adminToken) throw new Error('No token in response');
    log.success(`Admin logged in: ${testData.admin.email}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

async function registerBuyer(): Promise<any> {
  log.step(9, 'Registering buyer account');
  try {
    const response = await apiClient.post<AuthResponse>('/auth/register', {
      email: testData.buyer.email,
      password: testData.buyer.password,
      phone: testData.buyer.phone,
      businessName: testData.buyer.businessName,
      gstNumber: testData.buyer.gstNumber,
      role: 'BUYER',
    });

    if (response.data?.data?.accessToken) {
      buyerToken = response.data.data.accessToken;
      log.success(`Buyer registered: ${testData.buyer.email}`);
      return response.data.data;
    } else {
      throw new Error('No token in response');
    }
  } catch (error: any) {
    if (error.status === 409) {
      log.info('Buyer already exists, attempting login');
      return loginBuyer();
    }
    throw error;
  }
}

async function loginBuyer(): Promise<any> {
  log.step(9, 'Logging in buyer account');
  try {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      email: testData.buyer.email,
      password: testData.buyer.password,
    });

    buyerToken = response.data?.data?.accessToken;
    if (!buyerToken) throw new Error('No token in response');
    log.success(`Buyer logged in: ${testData.buyer.email}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

// Product management functions
async function createProduct(): Promise<any> {
  log.step(2, 'Creating product as seller');
  try {
    const response = await apiClient.post<ProductResponse>('/products', testData.product, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });

    const product = response.data?.data;
    if (!product?.id) throw new Error('No product ID in response');

    log.success(`Product created with ID: ${product.id}`);
    log.info(`Status: ${product.approvalStatus || 'PENDING'}`);
    return product;
  } catch (error) {
    throw error;
  }
}

async function getProductCategories(): Promise<any[]> {
  log.step('1.5', 'Fetching product categories');
  try {
    const response = await apiClient.get<CategoryResponse>('/products/categories');
    const categories = response.data?.data || [];

    if (categories.length === 0) {
      throw new Error('No categories available. Admin should create categories first.');
    }

    log.success(`Found ${categories.length} categories`);
    return categories;
  } catch (error) {
    throw error;
  }
}

async function approveProduct(productId: string): Promise<any> {
  log.step(7, `Approving product ${productId}`);
  try {
    const response = await apiClient.patch(
      `/admin/products/${productId}/approve`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    log.success(`Product approved`);
    log.info(`New Status: ${response.data?.data?.approvalStatus || 'APPROVED'}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

async function getProductAsPublic(productId: string): Promise<any> {
  log.step(10, `Verifying product ${productId} is visible to public`);
  try {
    const response = await apiClient.get<ProductResponse>(`/products/${productId}`);
    const product = response.data?.data;

    if (!product) throw new Error('Product not found');
    if (product.approvalStatus !== 'APPROVED') {
      throw new Error(`Product status is ${product.approvalStatus}, expected APPROVED`);
    }

    log.success(`Product is visible and approved`);
    return product;
  } catch (error) {
    throw error;
  }
}

async function searchProductsAsBuyer(): Promise<any[]> {
  log.step(11, 'Searching for products as buyer');
  try {
    const response = await apiClient.get('/products?limit=10', {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });

    const products = response.data?.data?.products || response.data?.data || [];
    log.success(`Found ${products.length} products in marketplace`);
    return products;
  } catch (error) {
    throw error;
  }
}

async function createOrder(productId: string, quantity: number = 5): Promise<any> {
  log.step(12, `Creating order for product ${productId} (qty: ${quantity})`);
  try {
    const response = await apiClient.post<OrderResponse>(
      '/orders',
      {
        items: [
          {
            productId,
            quantity,
          },
        ],
      },
      { headers: { Authorization: `Bearer ${buyerToken}` } }
    );

    const order = response.data?.data;
    if (!order?.id) throw new Error('No order ID in response');

    log.success(`Order created with ID: ${order.id}`);
    log.info(`Total: ₹${order.finalAmount || order.total || 0}`);
    return order;
  } catch (error) {
    throw error;
  }
}

// Main test function
async function runFullProductJourney(): Promise<void> {
  log.header('🚀 COMPLETE PRODUCT JOURNEY TEST');
  log.info(`Backend: ${API_URL}`);
  log.info(`Timestamp: ${new Date().toISOString()}`);

  let productId: string | null = null;
  let orderId: string | null = null;

  try {
    // PHASE 1: SELLER CREATES PRODUCT
    log.header('PHASE 1: SELLER CREATES PRODUCT');

    await registerSeller().catch(() => loginSeller());

    const categories = await getProductCategories();
    if (categories.length > 0) {
      testData.product.categoryId = categories[0].id;
      if (categories[0].subCategories?.length > 0) {
        testData.product.subCategoryId = categories[0].subCategories[0].id;
      }
    }

    const product = await createProduct();
    productId = product.id;
    log.data('Product Details', {
      id: product.id,
      name: product.name,
      status: product.approvalStatus,
      price: product.mrp,
      stock: product.stock,
    });

    // PHASE 2: ADMIN APPROVES PRODUCT
    log.header('PHASE 2: ADMIN APPROVES PRODUCT');

    await loginAdmin();

    const approvedProduct = await approveProduct(productId);
    log.data('Approved Product', {
      id: approvedProduct.id,
      status: approvedProduct.approvalStatus,
      isActive: approvedProduct.isActive,
    });

    // PHASE 3: BUYER DISCOVERS & ORDERS PRODUCT
    log.header('PHASE 3: BUYER DISCOVERS & ORDERS PRODUCT');

    await registerBuyer().catch(() => loginBuyer());

    const visibleProduct = await getProductAsPublic(productId);
    log.data('Product Visibility Check', {
      id: visibleProduct.id,
      name: visibleProduct.name,
      visible: true,
      approvalStatus: visibleProduct.approvalStatus,
    });

    const allProducts = await searchProductsAsBuyer();
    const foundProduct = allProducts.find((p) => p.id === productId);
    if (foundProduct) {
      log.success(`Product found in marketplace search`);
    } else {
      log.error(`Product NOT found in marketplace search (but exists individually)`);
    }

    const order = await createOrder(productId, 5);
    orderId = order.id;
    log.data('Order Details', {
      id: order.id,
      productId: order.items?.[0]?.productId || productId,
      quantity: order.items?.[0]?.quantity || 5,
      status: order.status,
      total: order.finalAmount || order.total,
    });

    // SUCCESS
    log.header('✅ COMPLETE PRODUCT JOURNEY - SUCCESS!');
    log.success('All test phases completed successfully');
    log.data('Summary', {
      seller: testData.seller.email,
      product: {
        id: productId,
        name: testData.product.name,
        status: 'APPROVED',
      },
      buyer: testData.buyer.email,
      order: {
        id: orderId,
        status: 'CREATED',
      },
    });
  } catch (error: any) {
    log.error(`Test failed: ${error.message}`);
    if (error.data) {
      log.data('Error Response', error.data);
    }
    process.exit(1);
  }
}

// Run if main module
if (require.main === module) {
  runFullProductJourney().catch((error) => {
    log.error(`Unexpected error: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
}

export { runFullProductJourney, testData, log };
