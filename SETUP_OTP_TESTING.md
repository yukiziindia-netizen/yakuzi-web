# Setting Up OTP-Based Testing

Since PharmaBag uses OTP (One-Time Password) authentication, the test script needs to work with your OTP system.

## Understanding the OTP Flow

```
STEP 1: Send OTP
POST /auth/send-otp
{ "phone": "9831864222" }
→ OTP is sent to phone (SMS/call/email)

STEP 2: Verify OTP
POST /auth/verify-otp
{ "phone": "9831864222", "otp": "123456", "role": "SELLER" }
→ Returns { accessToken, user }
```

## Option 1: Configure Test Mode OTP (Recommended)

### For Development Environment

Edit your backend `.env` file to allow test OTP:

```env
# Enable test mode
TEST_MODE=true
TEST_OTP=000000

# OR specify fixed OTP for testing
FIXED_TEST_OTP=000000
```

Then update test script to use this OTP:

```javascript
// test-product-journey.js
testData.seller.otp = '000000';
testData.admin.otp = '000000';
testData.buyer.otp = '000000';
```

### For Database OTP Storage

If backend stores OTPs in database, add test records:

```sql
-- Example: Create test OTP records
INSERT INTO otp_records (phone, otp, expiresAt, attempts) VALUES
('9831864222', '000000', NOW() + INTERVAL '10 minutes', 0),
('9999999999', '000000', NOW() + INTERVAL '10 minutes', 0),
('9876543210', '000000', NOW() + INTERVAL '10 minutes', 0);
```

## Option 2: Manual OTP Testing

### Step-by-Step Manual Process

```bash
# 1. Send OTP request
curl -X POST https://pharmabag-api.onrender.com/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9831864222"}'

# Backend response:
# {
#   "message": "OTP sent successfully",
#   "phone": "9831864222"
# }

# 2. Check your phone for OTP (or backend logs in dev environment)
# OTP should arrive via SMS, WhatsApp, or email

# 3. Verify OTP
curl -X POST https://pharmabag-api.onrender.com/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
#    "phone": "9831864222",
#    "otp": "123456",
#    "role": "SELLER"
#  }'

# Backend response with token:
# {
#   "data": {
#     "accessToken": "eyJhbGciOiJIUzI1NiIs...",
#     "user": { ... }
#   }
# }
```

## Option 3: Mock OTP Service

Create a mock OTP service for testing:

```javascript
// mock-otp-service.js
const mockOtps = new Map();

async function sendOtp(phone) {
  const otp = Math.random().toString().slice(2, 8); // 6-digit OTP
  mockOtps.set(phone, {
    otp,
    createdAt: Date.now(),
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  });
  
  console.log(`🔐 OTP for ${phone}: ${otp}`);
  return otp;
}

async function verifyOtp(phone, otp) {
  const record = mockOtps.get(phone);
  
  if (!record) throw new Error('OTP not found');
  if (record.otp !== otp) throw new Error('Invalid OTP');
  if (record.expiresAt < Date.now()) throw new Error('OTP expired');
  
  mockOtps.delete(phone);
  return true;
}

module.exports = { sendOtp, verifyOtp };
```

## Option 4: Use Real Phone Numbers

For production testing, use real phone numbers and actual OTP flow:

```javascript
// test-product-journey.js

// Use real phone numbers
testData.seller.phone = process.env.TEST_SELLER_PHONE || '9831864222';
testData.admin.phone = process.env.TEST_ADMIN_PHONE || '9999999999';
testData.buyer.phone = process.env.TEST_BUYER_PHONE || '9876543210';

// For real testing, retrieve OTP from SMS service
async function getOtpFromSms(phone) {
  // Example: Query SMS service API
  const response = await fetch(`https://your-sms-service.com/otp?phone=${phone}`);
  const data = await response.json();
  return data.otp;
}

// Or use backend test endpoint
async function getTestOtp(phone) {
  const response = await apiClient.get(`/auth/test-otp/${phone}`);
  return response.data.otp;
}
```

## Option 5: E2E Testing with Browser

For full end-to-end testing with actual OTP input:

```javascript
// test-with-playwright.js
const { chromium } = require('playwright');

const browser = await chromium.launch();
const page = await browser.newPage();

// Go to seller registration
await page.goto('http://localhost:3003/auth');
await page.fill('input[name="phone"]', '9831864222');
await page.click('button:has-text("Send OTP")');

// Wait for user to input OTP (or auto-fill if SMS available)
await page.fill('input[name="otp"]', '123456');
await page.click('button:has-text("Verify")');

// Continue with product creation...
```

## Recommended Approach for Development

1. **Use Option 1** (Test Mode) for CI/CD and automated testing
2. **Use Option 2** (Manual) for quick local testing
3. **Use Option 4** (Real Phones) for staging/production testing

## Configure Your Backend

### NestJS Backend Example

```typescript
// auth.service.ts
import { OtpService } from './otp.service';

@Injectable()
export class AuthService {
  constructor(private otpService: OtpService) {}

  async sendOtp(phone: string) {
    // In test mode, use fixed OTP
    if (process.env.TEST_MODE === 'true') {
      const testOtp = process.env.TEST_OTP || '000000';
      await this.cache.set(`otp:${phone}`, testOtp, 600); // 10 min expiry
      console.log(`[TEST MODE] OTP for ${phone}: ${testOtp}`);
      return { message: 'OTP sent', phone };
    }

    // In production, send real OTP
    const otp = this.generateOtp();
    await this.otpService.send(phone, otp);
    await this.cache.set(`otp:${phone}`, otp, 600);
    return { message: 'OTP sent', phone };
  }

  async verifyOtp(phone: string, otp: string, role: string) {
    const storedOtp = await this.cache.get(`otp:${phone}`);
    
    if (!storedOtp || storedOtp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    // Generate JWT token
    const token = this.jwtService.sign({ phone, role });
    return { accessToken: token, user: { phone, role } };
  }
}
```

### Environment Variables for Testing

```env
# .env (Development)
TEST_MODE=true
TEST_OTP=000000
JWT_SECRET=your-secret
JWT_EXPIRY=7d

# .env.production
TEST_MODE=false
# OTP system configured for real SMS
```

## Running Tests with Different Configurations

```bash
# Development (with test OTP)
TEST_MODE=true TEST_OTP=000000 npm run test:journey:local

# Staging (with real OTP, manual input needed)
npm run test:journey:staging

# Production (full integration test)
npm run test:journey:production
```

## Script Output Examples

### With Valid OTP

```
✓ Seller authenticated: 9831864222
✓ Product created with ID: [id]
✓ Admin authenticated: 9999999999
✓ Product approved
✓ Buyer authenticated: 9876543210
✓ Order created with ID: [id]
✅ TEST PASSED
```

### With Invalid OTP

```
✗ Seller authentication failed: Invalid OTP
ℹ Backend: https://pharmabag-api.onrender.com/api
ℹ Ensure OTP is correct and not expired
ℹ Check backend TEST_MODE configuration
```

## Troubleshooting OTP Issues

| Issue | Solution |
|-------|----------|
| OTP not received | Check SMS service, logs, or use test mode |
| OTP expired | Re-run sendOtp before verifyOtp (within 5-10 min) |
| Too many attempts | Clear OTP records from cache/DB |
| Wrong OTP format | Check backend expects 6 digits or custom format |
| Test mode not working | Verify TEST_MODE=true and restart backend |

## Next Steps

1. Choose an OTP option above
2. Configure your backend accordingly
3. Update test script with correct OTP values
4. Run: `npm run test:journey`

For questions or issues, check:
- Backend logs for OTP details
- Network tab in DevTools for API responses
- Database for OTP records
