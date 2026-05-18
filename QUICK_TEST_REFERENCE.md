# Quick Test Reference

## Run Complete Product Journey Test

```bash
npm run test:journey
```

This will automatically:
1. ✅ Authenticate seller via OTP (phone: 9831864222, OTP: 000000)
2. ✅ Create test product
3. ✅ Authenticate admin via OTP (phone: 9999999999, OTP: 000000)
4. ✅ Approve product
5. ✅ Authenticate buyer via OTP (phone: 9876543210, OTP: 000000)
6. ✅ Verify product is visible
7. ✅ Create order for product

## Test Data Used

| Role | Phone | OTP | Remarks |
|------|-------|-----|---------|
| Seller | 9831864222 | 000000 | Test seller |
| Admin | 9999999999 | 000000 | Must already exist |
| Buyer | 9876543210 | 000000 | Test buyer |

## Prerequisites

1. **Backend must be running** at https://pharmabag-api.onrender.com
2. **Admin account** must exist (default test credentials above)
3. **At least one category** should exist in database
4. **OTP system** must allow `000000` as test OTP (typical for dev/test)

## Customize Test

Edit `test-product-journey.js` to change:

```javascript
// Change phone numbers
testData.seller.phone = '9876543210';
testData.admin.phone = '9999999999';
testData.buyer.phone = '9876543210';

// Change OTP (if different in your environment)
testData.seller.otp = '123456';
testData.admin.otp = '123456';
testData.buyer.otp = '123456';

// Change product details
testData.product = {
  name: 'Paracetamol 650mg',
  mrp: 150,
  manufacturer: 'Cipla Ltd',
  chemicalComposition: 'Paracetamol 650mg',
  stock: 1000,
  expiryDate: '2026-12-31',
  minimumOrderQuantity: 10,
  maximumOrderQuantity: 500,
  gstPercent: 5,
  images: ['https://example.com/image.jpg'],
};
```

## Success Output

When test succeeds, you'll see:

```
✓ Seller authenticated: 9831864222
✓ Product created with ID: [id]
ℹ Status: PENDING

✓ Admin authenticated: 9999999999
✓ Product approved
ℹ New Status: APPROVED

✓ Buyer authenticated: 9876543210
✓ Product is visible and approved
✓ Found 12 products in marketplace
✓ Order created with ID: [id]

✅ COMPLETE PRODUCT JOURNEY - SUCCESS!
```

## If Test Fails

### Error: "Cannot POST /auth/send-otp"

**Cause:** Wrong backend URL or OTP endpoint doesn't exist

**Fix:** 
```bash
# Check backend is running
curl https://pharmabag-api.onrender.com/api/auth/send-otp

# Try local backend
npm run test:journey:local
```

### Error: "OTP verification failed"

**Cause:** Wrong OTP or OTP time expired

**Fix:**
- Update OTP in test script to match your backend
- Some backends auto-generate OTPs, check backend logs for actual OTP
- May need to configure backend to accept test OTP

### Error: "No categories available"

**Cause:** Admin hasn't created categories

**Fix:**
1. Login to admin portal
2. Go to Products → Categories
3. Create at least 1 category
4. Create 1-2 subcategories
5. Run test again

### Error: "Product not found after approval"

**Cause:** Database issue or approval endpoint broken

**Fix:**
1. Check backend logs
2. Verify admin has correct permissions
3. Check database directly
4. Run test again

## Scripts Available

```bash
npm run test:journey              # Against production API
npm run test:journey:local        # Against http://localhost:3000
npm run test:journey:production   # Explicit production URL

# Custom backend
BACKEND_URL=https://your-api.com node test-product-journey.js
```

## Test Script Files

- `test-product-journey.js` - Main test script (JavaScript)
- `test-product-journey.ts` - TypeScript version
- `TEST_PRODUCT_JOURNEY.md` - Detailed documentation
- `TESTING_GUIDE.md` - Full guide with troubleshooting
- `QUICK_TEST_REFERENCE.md` - This file

## Expected Duration

Test should complete in **20-30 seconds** total:

- Seller auth: 2-3s
- Product creation: 2-3s
- Category fetch: 1-2s
- Admin auth: 2-3s
- Product approval: 1-2s
- Buyer auth: 2-3s
- Product checks: 3-5s
- Order creation: 2-3s

## Run Repeatedly for Load Testing

```bash
# Run 5 times
for i in {1..5}; do npm run test:journey; done

# Run continuously with 5s delay between runs
while true; do npm run test:journey && sleep 5; done
```

## Integration with CI/CD

Add to `.github/workflows/test.yml`:

```yaml
- name: Product Journey Test
  run: npm run test:journey:production
  env:
    BACKEND_URL: ${{ secrets.BACKEND_URL }}
```

## Output Format

| Color | Meaning |
|-------|---------|
| 🔵 BLUE | Test step/phase |
| 🟢 GREEN | Success ✓ |
| 🟡 YELLOW | Info ℹ |
| 🔴 RED | Error ✗ |
| 🔷 CYAN | Headers/Labels |

## Questions?

See detailed docs in:
- `TEST_PRODUCT_JOURNEY.md` - Complete test documentation
- `TESTING_GUIDE.md` - Troubleshooting guide
