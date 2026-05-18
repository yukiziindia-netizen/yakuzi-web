# PharmaBag Testing Guide

Complete guide for testing the PharmaBag platform end-to-end.

## 🎯 Quick Start

### Run Complete Product Journey Test

```bash
# Against production API
npm run test:journey

# Against local backend
npm run test:journey:local

# Custom backend
BACKEND_URL=https://your-api.example.com node test-product-journey.js
```

**This will:**
1. ✅ Create a new seller account
2. ✅ Create a test product (PENDING approval)
3. ✅ Admin approves the product (APPROVED status)
4. ✅ Product becomes visible on buyer marketplace
5. ✅ Create a buyer account
6. ✅ Buyer searches and finds the product
7. ✅ Buyer places an order

---

## 📋 What the Test Checks

### Seller Portal Flow
```
Register Seller
    ↓
Create Product (Name, Price, Stock, etc.)
    ↓
Product stored with PENDING status
    ↓
Product NOT visible to buyers yet
```

### Admin Portal Flow
```
Login Admin
    ↓
View pending product
    ↓
Approve Product
    ↓
Product status → APPROVED
Product isActive → true
```

### Buyer Portal Flow
```
Register Buyer
    ↓
Search Products (GET /products)
    ↓
Find approved product
    ↓
View Product Details (GET /products/:id)
    ↓
Create Order
    ↓
Order confirmed
```

---

## 🔍 Understanding Test Output

### Success Output Example

```
════════════════════════════════════════════════════════════
🚀 COMPLETE PRODUCT JOURNEY TEST
════════════════════════════════════════════════════════════

ℹ Backend: https://pharmabag-api.onrender.com/api
ℹ Timestamp: 2024-03-25T10:30:45.123Z

PHASE 1: SELLER CREATES PRODUCT
════════════════════════════════════════════════════════════

[Step 1] Registering seller account
✓ Seller registered: seller-test-1234567890@test.com

[Step 1.5] Fetching product categories
✓ Found 4 categories

[Step 2] Creating product as seller
✓ Product created with ID: 65a8c9d3e4f5a6b7c8d9e0f1
ℹ Status: PENDING

Product Details:
{
  "id": "65a8c9d3e4f5a6b7c8d9e0f1",
  "name": "Test Product 1711353045123",
  "status": "PENDING",
  "price": 500,
  "stock": 100
}

PHASE 2: ADMIN APPROVES PRODUCT
════════════════════════════════════════════════════════════

[Step 6] Logging in admin account
✓ Admin logged in: admin@pharmabag.com

[Step 7] Approving product 65a8c9d3e4f5a6b7c8d9e0f1
✓ Product approved
ℹ New Status: APPROVED

Approved Product:
{
  "id": "65a8c9d3e4f5a6b7c8d9e0f1",
  "status": "APPROVED",
  "isActive": true
}

PHASE 3: BUYER DISCOVERS & ORDERS PRODUCT
════════════════════════════════════════════════════════════

[Step 9] Registering buyer account
✓ Buyer registered: buyer-test-9876543210@test.com

[Step 10] Verifying product 65a8c9d3e4f5a6b7c8d9e0f1 is visible to public
✓ Product is visible and approved

Product Visibility Check:
{
  "id": "65a8c9d3e4f5a6b7c8d9e0f1",
  "name": "Test Product 1711353045123",
  "visible": true,
  "approvalStatus": "APPROVED"
}

[Step 11] Searching for products as buyer
✓ Found 12 products in marketplace

[Step 12] Creating order for product 65a8c9d3e4f5a6b7c8d9e0f1 (qty: 5)
✓ Order created with ID: 65a8d9e0f1a2b3c4d5e6f7a8
ℹ Total: ₹2500

Order Details:
{
  "id": "65a8d9e0f1a2b3c4d5e6f7a8",
  "productId": "65a8c9d3e4f5a6b7c8d9e0f1",
  "quantity": 5,
  "status": "CREATED",
  "total": 2500
}

════════════════════════════════════════════════════════════
✅ COMPLETE PRODUCT JOURNEY - SUCCESS!
════════════════════════════════════════════════════════════

Summary:
{
  "seller": "seller-test-1234567890@test.com",
  "product": {
    "id": "65a8c9d3e4f5a6b7c8d9e0f1",
    "name": "Test Product 1711353045123",
    "status": "APPROVED"
  },
  "buyer": "buyer-test-9876543210@test.com",
  "order": {
    "id": "65a8d9e0f1a2b3c4d5e6f7a8",
    "status": "CREATED"
  }
}
```

### Understanding Color Codes

| Color  | Meaning | Example |
|--------|---------|---------|
| 🔵 Blue | Step/Stage | `[Step 1]` |
| 🟢 Green | Success | `✓ Seller registered` |
| 🟡 Yellow | Info | `ℹ Status: PENDING` |
| 🔴 Red | Error | `✗ Test failed` |
| 🔷 Cyan | Headers | `PHASE 1:` |

---

## ❌ Troubleshooting

### ❌ Error: "ECONNREFUSED"

**Problem:** Can't connect to backend

**Solutions:**

```bash
# Check if backend is running
curl https://pharmabag-api.onrender.com/api/health

# Try local backend instead
npm run test:journey:local

# Wait a moment and retry
sleep 5 && npm run test:journey
```

### ❌ Error: "No categories available"

**Problem:** Admin hasn't created product categories

**Solutions:**

1. Go to Admin Portal: http://localhost:3002
2. Navigate to Categories
3. Create at least 1 category with 1-2 subcategories
4. Run test again

### ❌ Error: "Invalid GST Number"

**Problem:** GST format validation failed

**Solutions:**

Edit `test-product-journey.js` and update:

```javascript
testData.seller.gstNumber = '22AAAAA0000A1Z5'; // Your valid format
testData.buyer.gstNumber = '22BBBBB0000B1Z5';
```

### ❌ Error: "Admin login failed"

**Problem:** Wrong admin credentials

**Solutions:**

1. Check admin account exists in database
2. Verify password is correct (default: Admin@123)
3. Update test script with correct credentials:

```javascript
testData.admin = {
  email: 'your-admin@example.com',
  password: 'YourPassword123!',
};
```

### ❌ Error: "Product not found after creation"

**Problem:** Product creation succeeded but can't be retrieved

**Solutions:**

1. Check backend logs for errors
2. Verify product ID in response
3. Check database for product record
4. Ensure seller token is valid

---

## 📊 Manual Testing Checklist

If you prefer manual testing, here's a checklist:

### Seller Actions
- [ ] Go to http://localhost:3003 (Seller Portal)
- [ ] Register new seller account
- [ ] Login
- [ ] Navigate to Products → Add New
- [ ] Fill product form:
  - [ ] Name
  - [ ] Price (MRP)
  - [ ] Manufacturer
  - [ ] Chemical Composition
  - [ ] Category & Subcategory
  - [ ] Stock quantity
  - [ ] Expiry date
  - [ ] GST percentage
  - [ ] Images
- [ ] Submit form
- [ ] Verify product shows "PENDING" status
- [ ] ✅ Product created

### Admin Actions
- [ ] Go to http://localhost:3002 (Admin Portal)
- [ ] Login with admin credentials
- [ ] Navigate to Products
- [ ] Find pending product
- [ ] Click "Approve"
- [ ] Verify status changed to "APPROVED"
- [ ] ✅ Product approved

### Buyer Actions
- [ ] Go to http://localhost:3001 (Buyer Portal)
- [ ] Register new buyer account
- [ ] Login
- [ ] Navigate to Products/Marketplace
- [ ] Search for product by name
- [ ] ✅ Product appears in list
- [ ] Click product
- [ ] Verify details display correctly
- [ ] Add to cart (if available)
- [ ] Place order
- [ ] ✅ Order confirmed

---

## 🔄 Continuous Testing

### Run Multiple Times

```bash
# Run 5 times (tests will use different emails each time)
for i in {1..5}; do echo "=== Test Run $i ===" && npm run test:journey || break; done
```

### Run on Schedule (Cron)

```bash
# Add to crontab to run daily
0 2 * * * cd /path/to/pharmabag-web && npm run test:journey:production >> /var/log/pharmabag-tests.log 2>&1
```

### Run in CI/CD (GitHub Actions)

Create `.github/workflows/test.yml`:

```yaml
name: Product Journey Tests

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
```

---

## 📈 Performance Monitoring

### Time Each Phase

```bash
# Add timing to see how long each phase takes
time npm run test:journey
```

### Expected Times

| Phase | Duration |
|-------|----------|
| Seller Registration | 2-3s |
| Product Creation | 2-3s |
| Category Fetch | 1-2s |
| Admin Login | 2-3s |
| Product Approval | 1-2s |
| Buyer Registration | 2-3s |
| Product Visibility Check | 1-2s |
| Product Search | 2-3s |
| Order Creation | 2-3s |
| **Total** | **18-26s** |

---

## 🛠️ Advanced: Custom Test Scenarios

### Test with Specific Product Data

Edit test script before running:

```javascript
testData.product = {
  name: 'Paracetamol 650mg',
  mrp: 150,
  manufacturer: 'Cipla',
  chemicalComposition: 'Paracetamol 650mg',
  stock: 1000,
  expiryDate: '2026-12-31',
  minimumOrderQuantity: 10,
  maximumOrderQuantity: 500,
  gstPercent: 5,
  images: ['https://your-image-url.com/image.jpg'],
};
```

### Test Large Orders

```javascript
// Change quantity in order creation
await createOrder(productId, 100); // Order 100 units instead of 5
```

### Test Multiple Products

Extend the test script to create multiple products and test different scenarios.

---

## 📞 Getting Help

If tests still fail:

1. **Check Backend Logs**
   ```bash
   # View backend logs (if running locally)
   npm run dev:backend
   ```

2. **Check Network Tab**
   - Open DevTools (F12)
   - Go to Network tab
   - Check API responses for errors

3. **Check Database**
   - Verify user accounts were created
   - Check product records
   - Verify approval status changes

4. **Enable Debug Mode**
   - Set `DEBUG=*` environment variable
   - Run with verbose logging

---

## ✅ Success Criteria

Test passes when:

- ✅ Seller account created/authenticated
- ✅ Product created with PENDING status
- ✅ Admin login successful
- ✅ Product approval endpoint returns APPROVED status
- ✅ Product is marked `isActive: true`
- ✅ Public API returns product without authentication
- ✅ Buyer account created/authenticated
- ✅ Product appears in marketplace search
- ✅ Order created with correct product ID and quantity
- ✅ Order total is calculated correctly (MRP × Quantity + tax)

---

## 📚 Related Documentation

- [TEST_PRODUCT_JOURNEY.md](./TEST_PRODUCT_JOURNEY.md) - Detailed test documentation
- [docs/full-platform-integration-audit.md](./docs/full-platform-integration-audit.md) - Complete API reference
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
