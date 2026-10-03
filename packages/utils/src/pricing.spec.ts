import { describe, expect, it } from 'vitest';
import { calculatePricing } from './pricing';

/**
 * The product from the 2026-10-03 report: ₹1,600 tax-inclusive, 15% commission,
 * 18% GST on fees, and a ₹150 delivery charge.
 */
const FEES = { commissionPercent: 15, commissionGstPercent: 18 };

function price(sellerKeepsShipping: boolean) {
  return calculatePricing(
    1600,
    0,
    {
      type: 'none',
      isTaxIncluded: true,
      shippingCharges: 150,
      shippingGstPercent: 0,
      sellerKeepsShipping,
    },
    FEES,
  );
}

describe('calculatePricing shipping régimes', () => {
  it('charges the buyer for shipping either way', () => {
    expect(price(false).finalCustomerPayable).toBe(1750);
    expect(price(true).finalCustomerPayable).toBe(1750);
  });

  it('withholds the shipping when Yukizi books the courier', () => {
    // 1750 − 150 shipping − (240 commission + 43.20 GST) = 1316.80
    expect(price(false).sellerPayout).toBe(1316.8);
  });

  it('leaves the shipping with a seller who booked their own courier', () => {
    // 1750 − (240 commission + 43.20 GST) = 1466.80
    expect(price(true).sellerPayout).toBe(1466.8);
  });

  it('charges the same platform fees in both régimes', () => {
    // Commission is on the product, never on the delivery charge, so switching
    // who ships must not move Yukizi's cut.
    expect(price(true).totalPlatformFees).toBe(price(false).totalPlatformFees);
    expect(price(true).commissionAmount).toBe(240);
  });

  it('withholds shipping by default, as it always has', () => {
    const noFlag = calculatePricing(
      1600,
      0,
      { type: 'none', isTaxIncluded: true, shippingCharges: 150, shippingGstPercent: 0 },
      FEES,
    );
    expect(noFlag.sellerPayout).toBe(price(false).sellerPayout);
  });
});
