# Interactive Product Journey Test Guide

Your test script has been updated to work with real OTPs! Here's how to use it:

## Quick Start

```bash
# Against local backend
npm run test:journey:local

# Against production backend
npm run test:journey

# Custom backend
BACKEND_URL=http://your-backend.com npm run test:journey
```

## How It Works

The test script will:

1. **Send OTP to seller phone** (9831864222)
   - You will see: `Enter OTP for seller: `
   - Check your phone for the OTP
   - Paste the OTP and press Enter

2. **Seller creates a product** (PENDING status)
   - Automatic - no user input needed

3. **Send OTP to admin phone** (9999999999)
   - You will see: `Enter OTP for admin: `
   - Check your phone for the OTP
   - Paste the OTP and press Enter

4. **Admin approves product** (APPROVED status)
   - Automatic - product becomes visible to buyers

5. **Send OTP to buyer phone** (9876543210)
   - You will see: `Enter OTP for buyer: `
   - Check your phone for the OTP
   - Paste the OTP and Press Enter

6. **Buyer discovers and orders the product**
   - Automatic - order is created

## Phone Numbers Used

| Role   | Phone Number  | OTP Sent To |
|--------|---------------|-------------|
| Seller | 9831864222    | Your phone  |
| Admin  | 9999999999    | Your phone  |
| Buyer  | 9876543210    | Your phone  |

**Note:** You need to have the ability to receive OTPs on these numbers, OR they need to be registered in your backend.

## Customizing Phone Numbers

Edit `test-product-journey.js` to use your own phone numbers:

```javascript
// Line ~38-55
const testData = {
  seller: {
    phone: 'YOUR_SELLER_PHONE',      // Change this
    businessName: 'Test Pharmacy',
    // ...
  },
  admin: {
    phone: 'YOUR_ADMIN_PHONE',       // Change this
    // ...
  },
  buyer: {
    phone: 'YOUR_BUYER_PHONE',       // Change this
    // ...
  },
};
```

## Example Session

```bash
$ npm run test:journey:local

============================================================
🚀 COMPLETE PRODUCT JOURNEY TEST
============================================================

ℹ Backend: http://localhost:3000/api
ℹ Timestamp: 2026-03-25T06:35:12.584Z

============================================================
PHASE 1: SELLER CREATES PRODUCT
============================================================

[Step 1] Authenticating seller via OTP
ℹ Sending OTP to seller phone: 9831864222
ℹ Check your phone for OTP sent to 9831864222
Enter OTP for seller: 123456          ← YOU PASTE THE OTP HERE
✓ Seller authenticated: 9831864222

[Step 2] Creating product as seller
✓ Product created with ID: 65f4e2a8b1c2d3e4f5g6h7i8
ℹ Status: PENDING

============================================================
PHASE 2: ADMIN APPROVES PRODUCT
============================================================

[Step 6] Authenticating admin via OTP
ℹ Sending OTP to admin phone: 9999999999
ℹ Check your phone for OTP sent to 9999999999
Enter OTP for admin: 654321          ← YOU PASTE THE OTP HERE
✓ Admin authenticated: 9999999999

[Step 7] Approving product 65f4e2a8b1c2d3e4f5g6h7i8
✓ Product approved
ℹ New Status: APPROVED

============================================================
PHASE 3: BUYER DISCOVERS & ORDERS PRODUCT
============================================================

[Step 9] Authenticating buyer via OTP
ℹ Sending OTP to buyer phone: 9876543210
ℹ Check your phone for OTP sent to 9876543210
Enter OTP for buyer: 789012         ← YOU PASTE THE OTP HERE
✓ Buyer authenticated: 9876543210

[Step 10] Fetching product as public user
✓ Product found and is visible
✓ Product found in marketplace search

[Step 11] Creating order for product
✓ Order created with ID: order_123456

============================================================
✓ ALL TESTS PASSED - PRODUCT JOURNEY COMPLETE
============================================================
```

## Troubleshooting

### OTP Never Arrives
- Check that you've registered these phone numbers in your backend
- Check your phone's SMS provider (some may block test numbers)
- Check backend logs to see if OTP was actually generated

### "Invalid OTP" Error
- Make sure you copied the OTP correctly
- Check that the OTP hasn't expired (usually 5-10 minutes)
- Try again - send OTP will retry

### Stuck Waiting for Input
- Press Ctrl+C to exit
- Fix the issue (check OTP, wait for SMS, etc.)
- Run the test again

### Backend Connection Error
- Check that your backend is running
- For local: make sure `npm run dev` is running in backend
- For production: check your internet connection
- Verify the BACKEND_URL environment variable

## Next Steps

After the test passes:

1. ✅ Product journey is working end-to-end
2. ✅ OTP authentication is working
3. ✅ All 3 user roles can authenticate
4. ✅ Product creation, approval, and ordering flows work

You can now:
- Test with different products
- Test with different user roles
- Modify test data to test edge cases
- Integrate this into your CI/CD pipeline (once you set up automated OTP)
