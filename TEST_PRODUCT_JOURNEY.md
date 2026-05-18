# Complete Product Journey Test Script

This test script validates the complete lifecycle of a product on PharmaBag, from creation to ordering.

## 🎯 Test Scope

The script tests the following flow:

```
SELLER PHASE
├─ Register/Login seller
├─ Fetch available categories
└─ Create a product (Status: PENDING, isActive: false)

ADMIN PHASE
├─ Login admin
├─ Approve the created product (Status: APPROVED, isActive: true)
└─ Verify product is marked as active

BUYER PHASE
├─ Register/Login buyer
├─ Verify product is visible to public (GET /products/:id)
├─ Search for product in marketplace (GET /products)
├─ Create an order for the product
└─ Verify order was created successfully
```

## 📋 Prerequisites

- Node.js >= 18.0.0
- Backend API running and accessible
- At least one admin account must exist (default: admin@pharmabag.com / Admin@123)
- At least one product category should exist (or test will create fallback data)

## 🚀 Quick Start

### Default (Production API)

```bash
# Run against production backend (https://pharmabag-api.onrender.com)
npm run test:journey
# or
node test-product-journey.js
```

### Local Development

```bash
# Run against local backend (http://localhost:3000)
npm run test:journey:local
```

### Production Backend

```bash
# Explicitly run against production
npm run test:journey:production
```

### Custom Backend

```bash
# Use any custom backend URL
BACKEND_URL=https://custom-api.example.com node test-product-journey.js
```

## 📊 What Gets Tested

### ✅ Seller Operations

- **User Registration**: Creates unique seller account with timestamp
- **Product Creation**: Creates product with:
  - Basic info (name, price, manufacturer)
  - Chemical composition
  - Stock management
  - Expiry date
  - GST information
  - Images
  - Auto-assigns default category (if exists)

**Expected Result**: Product created with `approvalStatus: PENDING` and `isActive: false`

### ✅ Admin Operations

- **User Authentication**: Logs in with admin credentials
- **Product Approval**: Approves the seller's product
- **Status Update**: Product moves to `approvalStatus: APPROVED` and `isActive: true`

**Expected Result**: Product is marked for public visibility

### ✅ Buyer Operations

- **User Registration**: Creates unique buyer account
- **Product Discovery**: 
  - Verifies product is visible publicly
  - Searches product in marketplace
  - Checks product filtering works
- **Order Creation**: 
  - Creates order with specific quantity
  - Verifies order ID is returned
  - Confirms order total is calculated

**Expected Result**: Order created and linked to product

## 📝 Test Data

The script generates test data with timestamps to ensure uniqueness:

```javascript
{
  seller: {
    email: "seller-test-{timestamp}@test.com",
    password: "TestPassword123!",
    businessName: "Test Pharmacy",
    gstNumber: "22AAAAA0000A1Z5",
  },
  product: {
    name: "Test Product {timestamp}",
    mrp: 500,
    manufacturer: "Test Manufacturer",
    stock: 100,
    expiryDate: "2025-12-31",
    minimumOrderQuantity: 1,
    maximumOrderQuantity: 50,
    gstPercent: 12,
  },
  buyer: {
    email: "buyer-test-{timestamp}@test.com",
    password: "TestPassword123!",
    businessName: "Test Business",
    gstNumber: "22BBBBB0000B1Z5",
  },
}
```

## 🔍 Test Output

The script provides detailed color-coded output:

```
═══════════════════════════════════════════════════════════
🚀 COMPLETE PRODUCT JOURNEY TEST
═══════════════════════════════════════════════════════════

[Step 1] Registering seller account
✓ Seller registered: seller-test-1234567890@test.com

[Step 2] Creating product as seller
✓ Product created with ID: cm123abc456def
ℹ Status: PENDING

[Step 1.5] Fetching product categories
✓ Found 4 categories

[Step 6] Logging in admin account
✓ Admin logged in: admin@pharmabag.com

[Step 7] Approving product cm123abc456def
✓ Product approved
ℹ New Status: APPROVED

[Step 10] Verifying product cm123abc456def is visible to public
✓ Product is visible and approved

[Step 11] Searching for products as buyer
✓ Found 12 products in marketplace

[Step 12] Creating order for product cm123abc456def (qty: 5)
✓ Order created with ID: ord123xyz789

═══════════════════════════════════════════════════════════
✅ COMPLETE PRODUCT JOURNEY - SUCCESS!
═══════════════════════════════════════════════════════════
```

## 🛠️ Advanced Usage

### Custom Product Data

To modify product data, edit `testData.product` object in the script:

```javascript
testData.product = {
  name: 'Aspirin 500mg',
  mrp: 1200,
  manufacturer: 'Generic Pharma',
  chemicalComposition: 'Acetylsalicylic Acid 500mg',
  stock: 500,
  expiryDate: '2026-06-30',
  minimumOrderQuantity: 10,
  maximumOrderQuantity: 100,
  gstPercent: 5,
  images: ['https://example.com/image.jpg'],
};
```

### Custom Admin Credentials

To test with different admin account:

```javascript
testData.admin = {
  email: 'your-admin@example.com',
  password: 'AdminPassword123!',
};
```

## ❌ Troubleshooting

### `ECONNREFUSED` error

**Cause**: Backend is not running or wrong URL

**Solution**: 
```bash
# Check backend is running
curl https://pharmabag-api.onrender.com/api/health

# Or use local backend
npm run test:journey:local
```

### `No categories available` error

**Cause**: Admin hasn't created any product categories

**Solution**: Go to admin portal and create at least one category with subcategories

### `Invalid GST Number` error

**Cause**: Test GST numbers format is invalid for your backend validation

**Solution**: Update `testData.seller.gstNumber` and `testData.buyer.gstNumber` with valid formats

### Product not approved error

**Cause**: Admin login credentials are wrong or admin doesn't have permission

**Solution**: Verify admin credentials in the script match your backend

### Product not visible to buyer

**Cause**: Product approval flow is broken or product not marked `isActive: true`

**Solution**: Check admin.service.ts approveProduct() method sets `isActive: true`

## 📈 Success Metrics

Test passes when:

- ✅ Seller account created/logged in
- ✅ Product created with PENDING status
- ✅ Admin login successful
- ✅ Product approved and marked APPROVED
- ✅ Product is accessible publicly
- ✅ Buyer account created/logged in
- ✅ Product searchable in marketplace
- ✅ Order created successfully

## 🔄 Running Repeatedly

The script uses timestamp-based unique identifiers, so it can be run multiple times without conflicts:

```bash
# Run 10 times to ensure stability
for i in {1..10}; do npm run test:journey; done
```

## 📊 Integration with CI/CD

Add to your GitHub Actions workflow:

```yaml
- name: Run Product Journey Test
  run: npm run test:journey:production
  env:
    CI: true
```

## 🐛 Debug Mode

To see more detailed logging, modify the script to add:

```javascript
apiClient.interceptors.request.use(config => {
  console.log(`${config.method.toUpperCase()} ${config.url}`);
  return config;
});
```

## 📚 Related Files

- `apps/seller/api/seller.api.ts` - Product creation API
- `apps/admin/api/admin.api.ts` - Product approval API
- `packages/utils/src/types.ts` - Type definitions
- `docs/full-platform-integration-audit.md` - Complete API documentation

## 🤝 Contributing

To extend this test script:

1. Add new test functions following the existing pattern
2. Use the `log` utility for consistent output
3. Test locally before committing
4. Update this README with new test phases

## 📞 Support

If tests fail:

1. Check the backend is running
2. Verify network connectivity
3. Check admin account exists
4. Review backend logs for detailed error messages
5. Run with `BACKEND_URL=http://localhost:3000` for local debugging
