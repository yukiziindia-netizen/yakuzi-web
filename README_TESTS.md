# PharmaBag Complete Product Journey Testing Suite

Complete automated testing for the PharmaBag platform's product lifecycle: creation → approval → discovery → ordering.

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| [QUICK_TEST_REFERENCE.md](./QUICK_TEST_REFERENCE.md) | **Start here** - Quick reference with commands |
| [TEST_PRODUCT_JOURNEY.md](./TEST_PRODUCT_JOURNEY.md) | Detailed test documentation |
| [TESTING_GUIDE.md](./TESTING_GUIDE.md) | Complete guide with troubleshooting |
| [SETUP_OTP_TESTING.md](./SETUP_OTP_TESTING.md) | Configure OTP authentication for tests |

## 🎯 What Gets Tested

### Complete Product Flow

```
┌─────────────────────────────────────────────────────┐
│                SELLER PHASE                         │
├─────────────────────────────────────────────────────┤
│ 1. Register/Authenticate seller (via OTP)          │
│ 2. Fetch available product categories              │
│ 3. Create test product (Status: PENDING)           │
│ 4. Product stored but NOT visible to buyers        │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                ADMIN PHASE                          │
├─────────────────────────────────────────────────────┤
│ 1. Authenticate admin (via OTP)                    │
│ 2. Retrieve pending product                        │
│ 3. Approve product                                 │
│ 4. Product status → APPROVED, isActive → true      │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                BUYER PHASE                          │
├─────────────────────────────────────────────────────┤
│ 1. Register/Authenticate buyer (via OTP)           │
│ 2. Product is now visible publicly                 │
│ 3. Search marketplace for product                  │
│ 4. Retrieve product details                        │
│ 5. Create order for product                        │
│ 6. Order confirmed with price calculation          │
└─────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **Backend API** running (https://pharmabag-api.onrender.com or local)
- **OTP System** configured (see [SETUP_OTP_TESTING.md](./SETUP_OTP_TESTING.md))

### Run Test

```bash
# Against production API
npm run test:journey

# Against local backend  
npm run test:journey:local

# Against custom backend
BACKEND_URL=https://your-api.example.com node test-product-journey.js
```

## 📊 Test Files

### JavaScript Version (Recommended)

**File:** `test-product-journey.js`

- Standalone script, no build required
- Uses Axios for HTTP requests
- Compatible with Node.js 18+
- Color-coded terminal output

**Run:**
```bash
npm run test:journey
node test-product-journey.js
BACKEND_URL=http://localhost:3000 node test-product-journey.js
```

### TypeScript Version

**File:** `test-product-journey.ts`

- Full type safety
- Self-documenting code
- Requires compilation

**Compile & Run:**
```bash
npx tsc test-product-journey.ts
node test-product-journey.js
```

## 📋 Test Data Flow

### Authentication

Uses OTP-based authentication:

| Role | Phone | OTP | Status |
|------|-------|-----|--------|
| Seller | 9831864222 | 000000 | Test account |
| Admin | 9999999999 | 000000 | Must exist |
| Buyer | 9876543210 | 000000 | Test account |

**Note:** OTP values must match your backend configuration. See [SETUP_OTP_TESTING.md](./SETUP_OTP_TESTING.md) for configuration options.

### Product Details

```javascript
{
  name: `Test Product ${timestamp}`,
  mrp: 500,
  manufacturer: 'Test Manufacturer',
  chemicalComposition: 'Test Composition',
  stock: 100,
  expiryDate: '2025-12-31',
  minimumOrderQuantity: 1,
  maximumOrderQuantity: 50,
  gstPercent: 12,
  images: ['https://via.placeholder.com/300']
}
```

Customizable in script before running.

## 🔍 Expected Output

### Success Example

```
════════════════════════════════════════════════════════════
🚀 COMPLETE PRODUCT JOURNEY TEST
════════════════════════════════════════════════════════════

ℹ Backend: https://pharmabag-api.onrender.com/api
ℹ Timestamp: 2026-03-25T10:30:45.123Z

PHASE 1: SELLER CREATES PRODUCT
════════════════════════════════════════════════════════════

[Step 1] Authenticating seller via OTP
ℹ Sending OTP to seller phone: 9831864222
✓ Seller authenticated: 9831864222

[Step 2] Creating product as seller
✓ Product created with ID: 65a8c9d3e4f5a6b7c8d9e0f1
ℹ Status: PENDING

PHASE 2: ADMIN APPROVES PRODUCT
════════════════════════════════════════════════════════════

[Step 6] Authenticating admin via OTP
✓ Admin authenticated: 9999999999

[Step 7] Approving product 65a8c9d3e4f5a6b7c8d9e0f1
✓ Product approved
ℹ New Status: APPROVED

PHASE 3: BUYER DISCOVERS & ORDERS PRODUCT
════════════════════════════════════════════════════════════

[Step 9] Authenticating buyer via OTP
✓ Buyer authenticated: 9876543210

[Step 10] Verifying product 65a8c9d3e4f5a6b7c8d9e0f1 is visible
✓ Product is visible and approved

[Step 11] Searching for products as buyer
✓ Found 12 products in marketplace

[Step 12] Creating order
✓ Order created with ID: 65a8d9e0f1a2b3c4d5e6f7a8
ℹ Total: ₹2500

════════════════════════════════════════════════════════════
✅ COMPLETE PRODUCT JOURNEY - SUCCESS!
════════════════════════════════════════════════════════════
```

## ❌ Common Issues

| Error | Solution |
|-------|----------|
| "Invalid OTP" | Configure test OTP in backend or use real OTP |
| "Cannot POST /auth/send-otp" | Backend not running or wrong URL |
| "No categories available" | Admin must create categories first |
| "Product not visible" | Check approval logic in admin.service.ts |
| "Order creation failed" | Ensure product is APPROVED and isActive |

See [SETUP_OTP_TESTING.md](./SETUP_OTP_TESTING.md) for detailed troubleshooting.

## 🔄 Running Tests Repeatedly

```bash
# Run 5 times
for i in {1..5}; do npm run test:journey; done

# Run continuously
while true; do npm run test:journey && sleep 5; done

# Run with timing
time npm run test:journey
```

**Expected Duration:** 20-30 seconds per run

## 🔧 Configuration

### Customize Test Data

Edit test script before running:

```javascript
// test-product-journey.js

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
};
```

### Change Backend URL

```bash
# Local development
npm run test:journey:local

# Custom backend
BACKEND_URL=https://staging-api.example.com node test-product-journey.js
```

### Configure OTP

See [SETUP_OTP_TESTING.md](./SETUP_OTP_TESTING.md) for:
- Test mode OTP configuration
- Real OTP integration
- Mock OTP service setup

## 📈 Continuous Integration

### GitHub Actions Workflow

Create `.github/workflows/product-journey-test.yml`:

```yaml
name: Product Journey Test

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      - run: pnpm install
      - run: npm run test:journey:production
        env:
          BACKEND_URL: ${{ secrets.BACKEND_URL }}
          TEST_OTP: ${{ secrets.TEST_OTP }}
```

## 📞 Support & Documentation

- **Quick Reference:** [QUICK_TEST_REFERENCE.md](./QUICK_TEST_REFERENCE.md)
- **Detailed Guide:** [TEST_PRODUCT_JOURNEY.md](./TEST_PRODUCT_JOURNEY.md)
- **Full Troubleshooting:** [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **OTP Setup:** [SETUP_OTP_TESTING.md](./SETUP_OTP_TESTING.md)

## 🎓 Understanding the Test

### What Each Phase Tests

**PHASE 1 - SELLER:**
- ✅ OTP authentication
- ✅ Product creation endpoint
- ✅ PENDING status assignment
- ✅ isActive = false by default

**PHASE 2 - ADMIN:**
- ✅ Admin authentication
- ✅ Product approval endpoint
- ✅ Status transition to APPROVED
- ✅ isActive = true after approval

**PHASE 3 - BUYER:**
- ✅ Public product visibility
- ✅ Product filtering (only APPROVED)
- ✅ Search functionality
- ✅ Order creation
- ✅ Price calculation with GST

### Success Criteria

All of these must pass:
- ✅ Seller authentication succeeds
- ✅ Product created with PENDING status
- ✅ Admin authentication succeeds
- ✅ Product approval works
- ✅ Status changes to APPROVED
- ✅ isActive becomes true
- ✅ Product visible publicly
- ✅ Buyer authentication succeeds
- ✅ Product appears in search
- ✅ Order created successfully
- ✅ Order total calculated correctly

## 🛠️ Troubleshooting

### Test Fails at Authentication

**Issue:** OTP verification fails

**Solutions:**
1. Check backend OTP configuration
2. Ensure phones are registered in test database
3. Verify OTP hasn't expired
4. See [SETUP_OTP_TESTING.md](./SETUP_OTP_TESTING.md)

### Test Fails at Product Creation

**Issue:** Cannot POST /products

**Solutions:**
1. Verify seller token is valid
2. Check categories exist
3. Review request payload structure
4. Check backend logs for detailed error

### Test Fails at Admin Approval

**Issue:** Cannot PATCH /admin/products/:id/approve

**Solutions:**
1. Verify admin has correct role
2. Ensure product exists
3. Check admin token is valid
4. Review backend permission checks

### Test Fails at Product Visibility

**Issue:** Product not found in search

**Solutions:**
1. Verify product approval succeeded
2. Check product isActive = true
3. Review buyer product filtering logic
4. Check database directly

## ✨ Best Practices

1. **Run regularly** - Daily or on each deployment
2. **Monitor duration** - Alert if test takes > 60 seconds
3. **Use CI/CD** - Automate test runs
4. **Keep test data fresh** - Uses timestamps for uniqueness
5. **Log results** - Archive test outputs for trending
6. **Document customizations** - Keep OTP config updated

## 📄 License

These test scripts are part of the PharmaBag platform and follow the same license.

---

**Ready to test?** → See [QUICK_TEST_REFERENCE.md](./QUICK_TEST_REFERENCE.md)
