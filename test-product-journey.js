#!/usr/bin/env node

/**
 * Complete Product Journey Test Script
 * 
 * This script tests the entire product lifecycle:
 * 1. Seller creates a product (PENDING status)
 * 2. Admin approves the product (APPROVED status)
 * 3. Buyer sees the product in marketplace
 * 4. Buyer creates an order for the product
 * 
 * Usage: node test-product-journey.js
 * Requires: BACKEND_URL environment variable (default: https://pharmabag-api.onrender.com)
 */

const axios = require('axios');
const readline = require('readline');

const API_BASE_URL = process.env.BACKEND_URL || 'https://pharmabag-api.onrender.com';
const API_URL = `${API_BASE_URL}/api`;

// Readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Helper function to get user input from terminal
 */
function getUserInput(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

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

// Test data
const testData = {
  seller: {
    phone: '9831864222',
    otp: '000000', // Default test OTP
    businessName: 'Test Pharmacy',
    gstNumber: '22AAAAA0000A1Z5',
    role: 'SELLER',
  },
  admin: {
    phone: '9999999999',
    otp: '000000', // Default test OTP
    role: 'ADMIN',
  },
  buyer: {
    phone: '9876543210',
    otp: '000000', // Default test OTP
    businessName: 'Test Business',
    gstNumber: '22BBBBB0000B1Z5',
    role: 'BUYER',
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

// HTTP client with token management
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Store tokens
let sellerToken = null;
let adminToken = null;
let buyerToken = null;

// Response interceptor
apiClient.interceptors.response.use(
  res => res,
  error => {
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

/**
 * Logging utilities
 */
const log = {
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}${colors.reset}\n`),
  step: (num, msg) => console.log(`${colors.bright}${colors.blue}[Step ${num}]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.yellow}ℹ ${msg}${colors.reset}`),
  data: (label, obj) => console.log(`\n${colors.cyan}${label}:${colors.reset}`, JSON.stringify(obj, null, 2)),
};

/**
 * Authentication Functions
 */

async function authenticateSeller() {
  log.step(1, 'Authenticating seller via OTP');
  try {
    // Send OTP
    log.info(`Sending OTP to seller phone: ${testData.seller.phone}`);
    await apiClient.post('/auth/send-otp', {
      phone: testData.seller.phone,
    });
    
    // Get OTP from user
    log.info(`Check your phone for OTP sent to ${testData.seller.phone}`);
    const otp = await getUserInput(`${colors.bright}${colors.yellow}Enter OTP for seller:${colors.reset} `);
    
    if (!otp || otp.length < 4) {
      throw new Error('Invalid OTP provided');
    }
    
    // Verify OTP
    log.info(`Verifying OTP for seller`);
    const response = await apiClient.post('/auth/verify-otp', {
      phone: testData.seller.phone,
      otp: otp,
      role: testData.seller.role,
    });
    
    if (response.data?.data?.accessToken) {
      sellerToken = response.data.data.accessToken;
      log.success(`Seller authenticated: ${testData.seller.phone}`);
      return response.data.data;
    } else {
      throw new Error('No token in response');
    }
  } catch (error) {
    throw error;
  }
}

async function authenticateAdmin() {
  log.step(6, 'Authenticating admin via OTP');
  try {
    // Send OTP
    log.info(`Sending OTP to admin phone: ${testData.admin.phone}`);
    await apiClient.post('/auth/send-otp', {
      phone: testData.admin.phone,
    });
    
    // Get OTP from user
    log.info(`Check your phone for OTP sent to ${testData.admin.phone}`);
    const otp = await getUserInput(`${colors.bright}${colors.yellow}Enter OTP for admin:${colors.reset} `);
    
    if (!otp || otp.length < 4) {
      throw new Error('Invalid OTP provided');
    }
    
    // Verify OTP
    log.info(`Verifying OTP for admin`);
    const response = await apiClient.post('/auth/verify-otp', {
      phone: testData.admin.phone,
      otp: otp,
      role: testData.admin.role,
    });
    
    if (response.data?.data?.accessToken) {
      adminToken = response.data.data.accessToken;
      log.success(`Admin authenticated: ${testData.admin.phone}`);
      return response.data.data;
    } else {
      throw new Error('No token in response');
    }
  } catch (error) {
    throw error;
  }
}

async function authenticateBuyer() {
  log.step(9, 'Authenticating buyer via OTP');
  try {
    // Send OTP
    log.info(`Sending OTP to buyer phone: ${testData.buyer.phone}`);
    await apiClient.post('/auth/send-otp', {
      phone: testData.buyer.phone,
    });
    
    // Get OTP from user
    log.info(`Check your phone for OTP sent to ${testData.buyer.phone}`);
    const otp = await getUserInput(`${colors.bright}${colors.yellow}Enter OTP for buyer:${colors.reset} `);
    
    if (!otp || otp.length < 4) {
      throw new Error('Invalid OTP provided');
    }
    
    // Verify OTP
    log.info(`Verifying OTP for buyer`);
    const response = await apiClient.post('/auth/verify-otp', {
      phone: testData.buyer.phone,
      otp: otp,
      role: testData.buyer.role,
    });
    
    if (response.data?.data?.accessToken) {
      buyerToken = response.data.data.accessToken;
      log.success(`Buyer authenticated: ${testData.buyer.phone}`);
      return response.data.data;
    } else {
      throw new Error('No token in response');
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Product Management Functions
 */

async function createProduct() {
  log.step(2, 'Creating product as seller');
  try {
    const response = await apiClient.post('/products', testData.product, {
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

async function getProductCategories() {
  log.step(1.5, 'Fetching product categories');
  try {
    const response = await apiClient.get('/products/categories');
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

async function approveProduct(productId) {
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

async function getProductAsPublic(productId) {
  log.step(10, `Verifying product ${productId} is visible to public`);
  try {
    const response = await apiClient.get(`/products/${productId}`);
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

async function searchProductsAsBuyer() {
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

async function createOrder(productId, quantity = 5) {
  log.step(12, `Creating order for product ${productId} (qty: ${quantity})`);
  try {
    const response = await apiClient.post(
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

/**
 * Main Test Flow
 */

async function runFullProductJourney() {
  log.header('🚀 COMPLETE PRODUCT JOURNEY TEST');
  log.info(`Backend: ${API_URL}`);
  log.info(`Timestamp: ${new Date().toISOString()}`);
  
  let productId = null;
  let orderId = null;

  try {
    // ===== PHASE 1: SELLER CREATES PRODUCT =====
    log.header('PHASE 1: SELLER CREATES PRODUCT');
    
    // Authenticate seller via OTP
    await authenticateSeller();
    
    // Get categories
    const categories = await getProductCategories();
    if (categories.length > 0) {
      testData.product.categoryId = categories[0].id;
      if (categories[0].subCategories?.length > 0) {
        testData.product.subCategoryId = categories[0].subCategories[0].id;
      }
    }
    
    // Create product
    const product = await createProduct();
    productId = product.id;
    log.data('Product Details', {
      id: product.id,
      name: product.name,
      status: product.approvalStatus,
      price: product.mrp,
      stock: product.stock,
    });

    // ===== PHASE 2: ADMIN APPROVES PRODUCT =====
    log.header('PHASE 2: ADMIN APPROVES PRODUCT');
    
    // Authenticate admin via OTP
    await authenticateAdmin();
    
    // Approve product
    const approvedProduct = await approveProduct(productId);
    log.data('Approved Product', {
      id: approvedProduct.id,
      status: approvedProduct.approvalStatus,
      isActive: approvedProduct.isActive,
    });

    // ===== PHASE 3: BUYER DISCOVERS & ORDERS PRODUCT =====
    log.header('PHASE 3: BUYER DISCOVERS & ORDERS PRODUCT');
    
    // Authenticate buyer via OTP
    await authenticateBuyer();
    
    // Verify product is visible
    const visibleProduct = await getProductAsPublic(productId);
    log.data('Product Visibility Check', {
      id: visibleProduct.id,
      name: visibleProduct.name,
      visible: true,
      approvalStatus: visibleProduct.approvalStatus,
    });
    
    // Search products
    const allProducts = await searchProductsAsBuyer();
    const foundProduct = allProducts.find(p => p.id === productId);
    if (foundProduct) {
      log.success(`Product found in marketplace search`);
    } else {
      log.error(`Product NOT found in marketplace search (but exists individually)`);
    }
    
    // Create order
    const order = await createOrder(productId, 5);
    orderId = order.id;
    log.data('Order Details', {
      id: order.id,
      productId: order.items?.[0]?.productId || productId,
      quantity: order.items?.[0]?.quantity || 5,
      status: order.status,
      total: order.finalAmount || order.total,
    });

    // ===== SUCCESS =====
    log.header('✅ COMPLETE PRODUCT JOURNEY - SUCCESS!');
    log.success('All test phases completed successfully');
    log.data('Summary', {
      seller: testData.seller.phone,
      product: {
        id: productId,
        name: testData.product.name,
        status: 'APPROVED',
      },
      buyer: testData.buyer.phone,
      order: {
        id: orderId,
        status: 'CREATED',
      },
    });

  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    if (error.data) {
      log.data('Error Response', error.data);
    }
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  runFullProductJourney()
    .then(() => {
      rl.close();
      process.exit(0);
    })
    .catch(error => {
      log.error(`Unexpected error: ${error.message}`);
      console.error(error);
      rl.close();
      process.exit(1);
    });
}

module.exports = {
  testData,
  runFullProductJourney,
  log,
};
