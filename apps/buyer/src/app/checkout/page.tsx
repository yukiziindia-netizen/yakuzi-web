'use client';

import { useState, useEffect } from 'react';
import { Search, HelpCircle, AlertCircle, ShieldCheck, Truck } from 'lucide-react';
import { useCart, useSyncCart, useClearCart } from '@/hooks/useCart';
import { useCreateOrder } from '@/hooks/useOrders';
import { useCreatePayment } from '@/hooks/usePayments';
import { useBuyerProfile } from '@/hooks/useBuyerProfile';
import { useToast } from '@/components/shared/Toast';
import { usePlatformConfig } from '@/hooks/usePlatformConfig';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/shared/AuthGuard';
import { useAuth } from '@yukizi/api-client';

type PaymentMethod = 'BANK_TRANSFER' | 'UPI' | 'COD' | 'CREDIT';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu and Kashmir','Ladakh',
];

export default function CheckoutPage() {
  const { user } = useAuth();
  const router = useRouter();
  const bp = user?.buyerProfile as any;
  const isApproved = user?.status === 'APPROVED';
  const isBuyerProfileVerified = bp?.verificationStatus === 'VERIFIED';
  const isLegacyVerified = user?.verificationStatus === 'VERIFIED';
  const isVerified = isApproved || isBuyerProfileVerified || isLegacyVerified;
  const isPending = !isVerified && (user?.status === 'PENDING' || bp?.verificationStatus === 'PENDING' || user?.verificationStatus === 'PENDING');
  const isRejected = user?.status === 'REJECTED' || bp?.verificationStatus === 'REJECTED' || user?.verificationStatus === 'REJECTED';

  const { data: cartData, isLoading: isCartLoading } = useCart();
  const { data: profileData } = useBuyerProfile();
  const { toast } = useToast();
  const createOrder = useCreateOrder();
  const createPaymentMut = useCreatePayment();
  const clearCart = useClearCart();
  const { data: platformConfig } = usePlatformConfig();
  const syncCart = useSyncCart();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [billingOption, setBillingOption] = useState<'same' | 'different'>('same');
  const [saveInfo, setSaveInfo] = useState(false);
  const [emailMe, setEmailMe] = useState(false);

  const [address, setAddress] = useState({
    name: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: 'West Bengal',
    pincode: '',
    email: '',
  });

  useEffect(() => {
    const profile = (profileData as any)?.data || profileData;
    if (profile) {
      const fullName = profile.legalName || profile.name || (user as any)?.name || '';
      const parts = fullName.split(' ');
      setAddress({
        name: fullName,
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || '',
        phone: profile.phone || (user as any)?.phone || (user as any)?.mobile || '',
        address: profile.address?.street1 || (typeof profile.address === 'string' ? profile.address : ''),
        city: profile.address?.city || profile.city || '',
        state: profile.address?.state || profile.state || 'West Bengal',
        pincode: profile.address?.pincode || profile.pincode || '',
        email: (user as any)?.email || '',
      });
    }
  }, [profileData, user]);

  const cart = (cartData as any)?.data || cartData || { items: [], total: 0 };
  const items = cart.items ?? [];
  const subtotal = Math.round(cart.total ?? 0);
  const shippingThreshold = platformConfig?.shipping_threshold ?? 5000;
  const shippingFee = platformConfig?.shipping_fee ?? 250;
  const gstRate = (platformConfig?.gst_rate ?? 12) / 100;
  const shipping = subtotal > shippingThreshold ? 0 : shippingFee;
  const gst = Math.round(subtotal * gstRate);
  const total = Math.round(subtotal + shipping + gst);

  const handlePlaceOrder = () => {
    const combinedName = address.firstName && address.lastName
      ? `${address.firstName} ${address.lastName}`
      : address.name;

    if (!combinedName.trim() || !address.phone || !address.address || !address.city || !address.state || !address.pincode) {
      toast('Please fill in all delivery details', 'error');
      return;
    }

    setSyncError(null);
    // Only send fields the backend DTO accepts — strip firstName, lastName, email
    const orderAddress = {
      name: combinedName,
      phone: address.phone.replace(/\D/g, '').slice(-10), // strip non-digits, keep last 10
      address: address.address,
      city: address.city,
      state: address.state,
      pincode: String(address.pincode).replace(/\D/g, '').slice(0, 6), // digits only, max 6
    };

    syncCart.mutate(undefined, {
      onSuccess: () => {
        createOrder.mutate(orderAddress, {
          onSuccess: (data: any) => {
            const orderId = data?.data?.id || data?.id;
            createPaymentMut.mutate(
              { orderId, amount: total, method: paymentMethod },
              {
                onSuccess: () => {
                  clearCart.mutate(undefined, {
                    onSuccess: () => { window.location.href = `/orders?drawer=${orderId}&success=true`; },
                    onError: () => { window.location.href = `/orders?drawer=${orderId}&success=true`; }
                  });
                },
                onError: () => {
                  clearCart.mutate(undefined, {
                    onSuccess: () => { window.location.href = `/orders?drawer=${orderId}`; },
                    onError: () => { window.location.href = `/orders?drawer=${orderId}`; }
                  });
                },
              }
            );
          },
          onError: (error: any) => {
            const status = error?.response?.status;
            const backendMsg = error?.response?.data?.message;
            if (status === 403) {
              toast(backendMsg || 'Please complete your KYC verification before placing orders.', 'error');
              router.push('/onboarding');
            } else {
              toast(backendMsg || error?.message || 'Failed to place order', 'error');
            }
          }
        });
      },
      onError: (error: any) => {
        const errorMsg = error?.message || 'Failed to synchronize your bag. Please try again.';
        setSyncError(errorMsg);
        toast(errorMsg, 'error');
      }
    });
  };

  if (isCartLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #0066cc', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <AuthGuard>
        <main style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 440, width: '100%', background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, padding: 36, textAlign: 'center' }}>
            <div style={{ margin: '0 auto 20px', width: 56, height: 56, background: '#fefce8', border: '1px solid #fde047', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={26} color="#ca8a04" />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>
              {isPending ? 'Verification Under Review' : isRejected ? 'Verification Rejected' : 'Complete Verification'}
            </h1>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 1.5 }}>
              {isPending
                ? 'Your documents are being reviewed. You can place orders once approved.'
                : isRejected
                ? 'We could not verify your business. Please contact support.'
                : 'Complete your KYC to start placing orders.'}
            </p>
            <Link
              href={isRejected ? '/support' : '/onboarding'}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 48, background: '#1a1a1a', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
            >
              {isPending ? 'Continue Browsing' : isRejected ? 'Contact Support' : 'Complete Verification'}
            </Link>
          </div>
        </main>
      </AuthGuard>
    );
  }

  const userName = address.firstName
    ? `${address.firstName} ${address.lastName}`.trim()
    : address.name || (user as any)?.name || '';

  return (
    <AuthGuard>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .co-input {
          width: 100%; height: 42px; padding: 0 12px;
          border: 1px solid #cccccc; border-radius: 6px;
          font-size: 14px; color: #1a1a1a; background: #ffffff;
          outline: none; transition: border-color 0.15s, box-shadow 0.15s;
          font-family: inherit;
        }
        .co-input:focus { border-color: #0066cc; box-shadow: 0 0 0 3px rgba(0,102,204,0.1); }
        .co-input::placeholder { color: #aaaaaa; }
        .co-select {
          width: 100%; height: 42px; padding: 0 32px 0 12px;
          border: 1px solid #cccccc; border-radius: 6px;
          font-size: 14px; color: #1a1a1a; background: #ffffff;
          appearance: none; outline: none; cursor: pointer;
          font-family: inherit;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 10px center;
        }
        .co-select:focus { border-color: #0066cc; box-shadow: 0 0 0 3px rgba(0,102,204,0.1); }
        .co-radio {
          width: 18px; height: 18px; border-radius: 50%;
          flex-shrink: 0; transition: border 0.15s;
        }
        .co-section { margin-bottom: 28px; }
        .co-section-title { font-size: 20px; font-weight: 700; color: #1a1a1a; }
        .co-hr { border: none; border-top: 1px solid #e8e8e8; margin: 20px 0; }
        @media (max-width: 1023px) {
          .co-layout { flex-direction: column-reverse !important; }
          .co-right-panel { width: 100% !important; position: static !important; top: auto !important; }
          .co-name-grid { grid-template-columns: 1fr !important; }
          .co-addr-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .co-main-wrapper { padding: 16px 12px 50px !important; gap: 20px !important; }
          .co-topbar-inner { padding: 0 12px !important; }
        }
      `}</style>

      <main style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

        {/* ── Top bar ────────────────────────────────────────────────────── */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8' }}>
          <div className="co-topbar-inner" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: 56, gap: 6 }}>
            <Link href="/" style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', textDecoration: 'none' }}>Yukizi</Link>
            <span style={{ color: '#ccc', fontSize: 18 }}>/</span>
            <Link href="/cart" style={{ fontSize: 13, color: '#0066cc', textDecoration: 'none' }}>Cart</Link>
            <span style={{ color: '#ccc' }}>&#8250;</span>
            <span style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>Information</span>
            <span style={{ color: '#ccc' }}>&#8250;</span>
            <span style={{ fontSize: 13, color: '#bbb' }}>Shipping</span>
            <span style={{ color: '#ccc' }}>&#8250;</span>
            <span style={{ fontSize: 13, color: '#bbb' }}>Payment</span>
          </div>
        </div>

        {/* ── Main layout ────────────────────────────────────────────────── */}
        <div
          className="co-layout co-main-wrapper"
          style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'flex-start', gap: 40, padding: '32px 24px 60px' }}
        >

          {/* ── LEFT: Form ─────────────────────────────────────────────── */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Greeting */}
            {userName && (
              <div style={{ marginBottom: 22 }}>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>{userName}</p>
              </div>
            )}

            {/* CONTACT */}
            <div className="co-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p className="co-section-title">Contact</p>
              </div>
              <input
                className="co-input"
                type="email"
                placeholder="Email or mobile phone number"
                value={address.email}
                onChange={(e) => setAddress({ ...address, email: e.target.value })}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={emailMe} onChange={(e) => setEmailMe(e.target.checked)}
                  style={{ width: 14, height: 14, accentColor: '#0066cc', cursor: 'pointer' }} />
                <span style={{ fontSize: 13, color: '#555' }}>Email me with news and offers</span>
              </label>
            </div>

            <hr className="co-hr" />

            {/* DELIVERY */}
            <div className="co-section">
              <p className="co-section-title" style={{ marginBottom: 14 }}>Delivery</p>

              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>Country/Region</label>
                <select className="co-select" defaultValue="India">
                  <option>India</option>
                </select>
              </div>

              <div className="co-name-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <input className="co-input" placeholder="First name (optional)" value={address.firstName}
                  onChange={(e) => setAddress({ ...address, firstName: e.target.value })} />
                <input className="co-input" placeholder="Last name" value={address.lastName}
                  onChange={(e) => setAddress({ ...address, lastName: e.target.value })} />
              </div>

              <div style={{ position: 'relative', marginBottom: 10 }}>
                <input className="co-input" style={{ paddingRight: 36 }} placeholder="Address"
                  value={address.address} onChange={(e) => setAddress({ ...address, address: e.target.value })} />
                <Search size={16} color="#aaa" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>

              <div className="co-addr-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 10, marginBottom: 10 }}>
                <input className="co-input" placeholder="City" value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                <div style={{ position: 'relative' }}>
                  <label style={{ position: 'absolute', top: 5, left: 12, fontSize: 10, color: '#888', pointerEvents: 'none', zIndex: 1 }}>State</label>
                  <select className="co-select" style={{ paddingTop: 16, height: 42, fontSize: 13 }}
                    value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })}>
                    {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <input className="co-input" placeholder="PIN code" value={address.pincode}
                  onChange={(e) => setAddress({ ...address, pincode: e.target.value })} />
              </div>

              <div style={{ position: 'relative' }}>
                <input className="co-input" style={{ paddingRight: 36 }} placeholder="Phone"
                  value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} />
                <HelpCircle size={16} color="#aaa" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={saveInfo} onChange={(e) => setSaveInfo(e.target.checked)}
                  style={{ width: 14, height: 14, accentColor: '#0066cc', cursor: 'pointer' }} />
                <span style={{ fontSize: 13, color: '#555' }}>Save this information for next time</span>
              </label>
            </div>

            <hr className="co-hr" />

            {/* SHIPPING METHOD */}
            <div className="co-section">
              <p className="co-section-title" style={{ marginBottom: 14 }}>Shipping method</p>
              <div style={{ background: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: 8, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Truck size={16} color="#666" />
                  <span style={{ fontSize: 14, color: '#444' }}>Delivered in 4 - 11 Business Days!</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>
                  {shipping === 0 ? 'FREE' : `₹${shipping}`}
                </span>
              </div>
            </div>

            <hr className="co-hr" />

            {/* PAYMENT */}
            <div className="co-section">
              <p className="co-section-title" style={{ marginBottom: 4 }}>Payment</p>
              <p style={{ fontSize: 13, color: '#777', marginBottom: 14 }}>All transactions are secure and encrypted.</p>

              <div style={{ border: '2px solid #0066cc', borderRadius: 8, overflow: 'hidden' }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#eef4fc', cursor: 'pointer' }}
                  onClick={() => setPaymentMethod('BANK_TRANSFER')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: paymentMethod === 'BANK_TRANSFER' ? '6px solid #0066cc' : '2px solid #ccc', flexShrink: 0, transition: 'border 0.15s' }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>Cashfree Payments (UPI, Cards, Int&apos;l cards, Wallets)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 4, padding: '2px 5px', fontSize: 10, fontWeight: 800, color: '#2563eb', letterSpacing: 0.3 }}>UPI</div>
                    <div style={{ background: '#1a1f71', borderRadius: 4, padding: '2px 5px', fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: 0.8 }}>VISA</div>
                    <div style={{ position: 'relative', width: 28, height: 18, flexShrink: 0 }}>
                      <div style={{ position: 'absolute', left: 0, width: 18, height: 18, borderRadius: '50%', background: '#eb001b' }} />
                      <div style={{ position: 'absolute', left: 9, width: 18, height: 18, borderRadius: '50%', background: '#f79e1b', opacity: 0.85 }} />
                    </div>
                    <span style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>+11</span>
                  </div>
                </div>
                {paymentMethod === 'BANK_TRANSFER' && (
                  <div style={{ padding: '14px 16px', background: '#fff', borderTop: '1px solid #dce8f5', textAlign: 'center' }}>
                    <p style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>
                      You&apos;ll be redirected to Cashfree Payments (UPI, Cards, Int&apos;l cards, Wallets) to complete your purchase.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <hr className="co-hr" />

            {/* BILLING ADDRESS */}
            <div className="co-section">
              <p className="co-section-title" style={{ marginBottom: 14 }}>Billing address</p>

              <div
                style={{ border: billingOption === 'same' ? '2px solid #0066cc' : '1px solid #cccccc', borderRadius: 8, padding: '14px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: billingOption === 'same' ? '#eef4fc' : '#fff', transition: 'all 0.15s' }}
                onClick={() => setBillingOption('same')}
              >
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: billingOption === 'same' ? '6px solid #0066cc' : '2px solid #ccc', flexShrink: 0, transition: 'border 0.15s' }} />
                <span style={{ fontSize: 14, color: '#1a1a1a' }}>Same as shipping address</span>
              </div>

              <div
                style={{ border: billingOption === 'different' ? '2px solid #0066cc' : '1px solid #cccccc', borderRadius: 8, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: '#fff', transition: 'all 0.15s' }}
                onClick={() => setBillingOption('different')}
              >
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: billingOption === 'different' ? '6px solid #0066cc' : '2px solid #ccc', flexShrink: 0, transition: 'border 0.15s' }} />
                <span style={{ fontSize: 14, color: '#1a1a1a' }}>Use a different billing address</span>
              </div>
            </div>

            {/* Sync Error */}
            {syncError && (
              <div style={{ background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: 8, padding: 14, marginBottom: 20, display: 'flex', gap: 10 }}>
                <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#7f1d1d', marginBottom: 4 }}>Cannot place order</p>
                  <p style={{ fontSize: 12, color: '#ef4444' }}>{syncError}</p>
                </div>
              </div>
            )}

            {/* PAY NOW */}
            <button
              onClick={handlePlaceOrder}
              disabled={createOrder.isPending || items.length === 0}
              style={{
                width: '100%', height: 52,
                background: (createOrder.isPending || items.length === 0) ? '#93c5fd' : '#0066cc',
                color: '#fff', border: 'none', borderRadius: 8,
                fontSize: 16, fontWeight: 700, cursor: (createOrder.isPending || items.length === 0) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.15s', fontFamily: 'inherit',
              }}
            >
              {createOrder.isPending
                ? <div style={{ width: 20, height: 20, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                : `Pay now`}
            </button>

            {/* Footer links */}
            <div style={{ marginTop: 28, display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>
              {['Refund policy', 'Shipping', 'Privacy policy', 'Terms of service', 'Contact'].map((link) => (
                <a key={link} href="#" style={{ fontSize: 12, color: '#0066cc', textDecoration: 'none' }}>{link}</a>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Order Summary ────────────────────────────────────── */}
          <div
            className="co-right-panel"
            style={{ width: 380, flexShrink: 0, background: '#f9f9f9', border: '1px solid #e4e4e4', borderRadius: 12, padding: 20, position: 'sticky', top: 24 }}
          >
            {/* Items list */}
            <div style={{ marginBottom: 16 }}>
              {items.length === 0 ? (
                <p style={{ fontSize: 14, color: '#888', textAlign: 'center', padding: '20px 0' }}>Your cart is empty</p>
              ) : (
                items.map((item: any) => {
                  const img = item.product?.images?.[0] || item.imageUrl || item.image || item.productImage;
                  const name = item.product?.name || item.productName || item.name || 'Product';
                  const price = item.price || item.unitPrice || 0;
                  const qty = item.quantity || 1;
                  return (
                    <div key={item.id} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{ width: 56, height: 56, background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {img
                            ? <Image src={img} alt={name} width={48} height={48} style={{ objectFit: 'contain' }} />
                            : <div style={{ width: 40, height: 40, background: '#f0f0f0', borderRadius: 4 }} />}
                        </div>
                        <div style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#555', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {qty}
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', lineHeight: 1.4, marginBottom: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{name}</p>
                        {item.variantName && <p style={{ fontSize: 12, color: '#888' }}>{item.variantName}</p>}
                      </div>
                      <span style={{ flexShrink: 0, fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>
                        ₹{(price * qty).toLocaleString('en-IN')}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e8e8e8', margin: '12px 0' }} />

            {/* Price rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: '#555' }}>Subtotal</span>
                <span style={{ fontSize: 14, color: '#1a1a1a', fontWeight: 500 }}>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 14, color: '#555' }}>Shipping</span>
                  <HelpCircle size={14} color="#aaa" />
                </div>
                <span style={{ fontSize: 14, color: address.address ? '#1a1a1a' : '#888' }}>
                  {address.address ? (shipping === 0 ? 'Free' : `₹${shipping}`) : 'Enter shipping address'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: '#555' }}>GST ({platformConfig?.gst_rate ?? 12}%)</span>
                <span style={{ fontSize: 14, color: '#1a1a1a', fontWeight: 500 }}>₹{gst.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e8e8e8', margin: '12px 0' }} />

            {/* Grand Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>Total</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 12, color: '#888' }}>INR</span>
                <span style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
              Including ₹{gst.toLocaleString('en-IN')} in taxes
            </p>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
