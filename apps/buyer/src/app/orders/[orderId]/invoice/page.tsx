'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Printer, Loader2, ShieldCheck, Package, Headphones, Lock } from 'lucide-react';
import { getOrderInvoices, type OrderInvoice } from '@yukizi/api-client';
import AuthGuard from '@/components/shared/AuthGuard';

/**
 * Printable tax invoice, laid out to the agreed design.
 *
 * One invoice per seller, because the seller is the supplier of record and
 * Yukizi generates the document on their behalf. Printing uses the browser,
 * so no PDF library is needed on the small API box.
 *
 * Yukizi's own registered details in the footer are intentionally blank until
 * the real legal name, GSTIN, CIN and address are supplied. Placeholder values
 * on a tax document are worse than empty ones.
 */

const money = (n: number) =>
  `₹${Number(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function InvoicePage({ params }: { params: { orderId: string } }) {
  const [invoices, setInvoices] = useState<OrderInvoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getOrderInvoices(params.orderId)
      .then((rows) => { if (!cancelled) setInvoices(rows); })
      .catch((e: any) => {
        if (cancelled) return;
        setError(
          e?.response?.data?.message ||
            'We could not load the invoice for this order.',
        );
      });
    return () => { cancelled = true; };
  }, [params.orderId]);

  useEffect(() => {
    if (invoices?.[0]) document.title = invoices[0].invoiceNumber;
  }, [invoices]);

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-3 bg-white px-6 text-center">
        <p className="text-[#64748b]">{error}</p>
        <Link href={`/orders/${params.orderId}`} className="text-[#593696] font-semibold underline underline-offset-2">
          Back to order
        </Link>
      </main>
    );
  }

  if (!invoices) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 animate-spin text-[#593696]" />
      </main>
    );
  }

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#f1f5f9] py-8 px-4 print:bg-white print:p-0">
        <style>{`
          @media print {
            .no-print { display: none !important; }
            .invoice-sheet { box-shadow: none !important; border: 0 !important; margin: 0 !important; }
            .invoice-sheet + .invoice-sheet { page-break-before: always; }
            @page { margin: 12mm; }
          }
        `}</style>

        <div className="max-w-[900px] mx-auto mb-4 flex items-center justify-between no-print">
          <Link
            href={`/orders/${params.orderId}`}
            className="flex items-center gap-1.5 text-[#64748b] hover:text-[#593696] font-semibold text-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Back to order
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-full bg-gradient-to-b from-[#a155e8] via-[#7b41b0] to-[#512384] px-5 py-2.5 text-white text-sm font-bold shadow-[0_8px_24px_rgba(89,54,150,0.28)] hover:opacity-90 transition-opacity"
          >
            <Printer className="w-4 h-4" /> Download / Print
          </button>
        </div>

        {invoices.length === 0 && (
          <p className="max-w-[900px] mx-auto text-center text-[#64748b]">
            There is nothing to invoice on this order.
          </p>
        )}

        {invoices.map((inv) => (
          <section
            key={inv.invoiceNumber}
            className="invoice-sheet max-w-[900px] mx-auto mb-6 bg-white border border-[#e2e8f0] rounded-xl overflow-hidden"
          >
            <div className="p-8">
              {/* Header */}
              <div className="flex items-start justify-between gap-8">
                <img src="/YukiziLogo.png" alt="Yukizi" className="h-10 w-auto object-contain" />
                <div className="text-right">
                  <h1 className="text-[26px] font-black tracking-tight text-[#593696]">TAX INVOICE</h1>
                  <table className="mt-3 ml-auto text-[13px]">
                    <tbody>
                      <tr>
                        <td className="pr-6 text-[#64748b] text-left">Invoice No.</td>
                        <td className="font-semibold text-[#0f172a]">{inv.invoiceNumber}</td>
                      </tr>
                      <tr>
                        <td className="pr-6 text-[#64748b] text-left">Invoice Date</td>
                        <td className="font-semibold text-[#0f172a]">
                          {new Date(inv.invoiceDate).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'long', year: 'numeric',
                          })}
                        </td>
                      </tr>
                      <tr>
                        <td className="pr-6 text-[#64748b] text-left">Order ID</td>
                        <td className="font-semibold text-[#0f172a]">{inv.orderReference}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6 border-t-2 border-[#593696]" />

              {/* On-behalf-of notice */}
              <div className="mt-6 flex gap-3 rounded-lg border border-[#e9dff5] bg-[#f7f4fc] p-4">
                <ShieldCheck className="w-5 h-5 text-[#593696] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-bold text-[#593696]">Generated via Yukizi Marketplace</p>
                  <p className="text-[12px] text-[#475569] mt-0.5">
                    This invoice is generated on behalf of the seller for the supply of goods to the customer.
                  </p>
                </div>
              </div>

              {/* Parties */}
              <div className="mt-7 grid grid-cols-2 gap-8">
                <Party title="SELLER" subtitle="(Supplier)" party={inv.seller} />
                <div className="border-l border-[#e2e8f0] pl-8">
                  <Party title="BUYER" subtitle="(Customer)" party={inv.buyer} />
                </div>
              </div>

              {/* Lines */}
              <table className="w-full mt-8 text-[12px] border-collapse">
                <thead>
                  <tr className="bg-[#593696] text-white text-left">
                    <th className="py-3 px-3 font-bold">#</th>
                    <th className="py-3 px-3 font-bold">Item Description</th>
                    <th className="py-3 px-3 font-bold text-center">Qty</th>
                    <th className="py-3 px-3 font-bold text-right">Unit Price (₹)</th>
                    <th className="py-3 px-3 font-bold text-right">Taxable Value (₹)</th>
                    <th className="py-3 px-3 font-bold text-center">GST Rate (%)</th>
                    <th className="py-3 px-3 font-bold text-right">GST Amount (₹)</th>
                    <th className="py-3 px-3 font-bold text-right">Total Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {inv.lines.map((l) => (
                    <tr key={l.serial} className="border-b border-[#e2e8f0]">
                      <td className="py-3 px-3 text-[#475569]">{l.serial}</td>
                      <td className="py-3 px-3 text-[#0f172a] font-medium">{l.description}</td>
                      <td className="py-3 px-3 text-center text-[#475569]">{l.quantity}</td>
                      <td className="py-3 px-3 text-right text-[#475569]">{l.unitPrice.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right text-[#475569]">{l.taxableValue.toFixed(2)}</td>
                      <td className="py-3 px-3 text-center text-[#475569]">{l.gstRate}%</td>
                      <td className="py-3 px-3 text-right text-[#475569]">{l.gstAmount.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-semibold text-[#0f172a]">{l.totalAmount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Note + totals */}
              <div className="mt-7 grid grid-cols-2 gap-8 items-start">
                <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4">
                  <p className="text-[13px] font-bold text-[#593696] mb-1.5">Note to Customer</p>
                  <p className="text-[12px] text-[#475569] leading-relaxed">
                    This is a tax invoice for the supply of goods. The products have been sold by the
                    seller (Supplier) and this invoice is generated on their behalf by Yukizi Marketplace.
                  </p>
                </div>

                <div className="text-[13px]">
                  <Row label="Subtotal (Taxable Value)" value={money(inv.subtotal)} />
                  {inv.isIntraState ? (
                    <>
                      <Row label="CGST" value={money(inv.cgst)} />
                      <Row label="SGST" value={money(inv.sgst)} />
                    </>
                  ) : (
                    <Row label="IGST" value={money(inv.igst)} />
                  )}
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-[#f3edfa] px-4 py-3">
                    <span className="font-bold text-[#593696]">TOTAL AMOUNT PAYABLE (₹)</span>
                    <span className="text-[20px] font-black text-[#593696]">{money(inv.totalAmount)}</span>
                  </div>
                  <p className="mt-3 text-[11px] text-[#94a3b8]">Amount in Words:</p>
                  <p className="text-[12px] text-[#0f172a]">{inv.amountInWords}</p>
                  {inv.placeOfSupply && (
                    <p className="mt-2 text-[11px] text-[#94a3b8]">
                      Place of supply: <span className="text-[#475569]">{inv.placeOfSupply}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Assurances */}
              <div className="mt-8 grid grid-cols-4 gap-4 rounded-lg border border-[#e2e8f0] p-4">
                <Assurance icon={<ShieldCheck className="w-4 h-4" />} title="100% Authentic Products" body="Sourced directly from trusted sellers." />
                <Assurance icon={<Package className="w-4 h-4" />} title="Hassle-free Returns" body="Easy returns & refunds as per Yukizi policy." />
                <Assurance icon={<Headphones className="w-4 h-4" />} title="Need Help?" body="Email support@yukizi.com" />
                <Assurance icon={<Lock className="w-4 h-4" />} title="Secure Payments" body="Your transactions are safe and secure." />
              </div>
            </div>

            {/* Footer — Yukizi's registered details. Only the support address is
                known; legal name, GSTIN, CIN and registered address are left
                blank rather than filled with placeholders on a tax document. */}
            <div className="bg-[#593696] px-8 py-6 text-white">
              <p className="text-[13px] font-bold">&nbsp;</p>
              <p className="text-[12px] opacity-90 mt-1">GSTIN:&nbsp;</p>
              <p className="text-[12px] opacity-90">Address:&nbsp;</p>
              <p className="text-[12px] opacity-90">CIN:&nbsp;</p>
              <p className="text-[12px] opacity-90">
                Email: <a href="mailto:support@yukizi.com" className="underline">support@yukizi.com</a> | Website:&nbsp;
              </p>
              <p className="text-[11px] opacity-75 text-center mt-4">
                This is a system generated invoice and does not require signature.
              </p>
            </div>
          </section>
        ))}
      </main>
    </AuthGuard>
  );
}

function Party({ title, subtitle, party }: { title: string; subtitle: string; party: any }) {
  return (
    <div>
      <p className="text-[15px] font-black text-[#593696]">
        {title} <span className="text-[12px] font-semibold text-[#64748b]">{subtitle}</span>
      </p>
      <p className="mt-2 text-[14px] font-bold text-[#0f172a]">{party.name || '—'}</p>
      <p className="text-[12px] text-[#475569] mt-1">GSTIN: {party.gstin || '—'}</p>
      <p className="text-[12px] text-[#475569] mt-1 leading-relaxed">{party.address || '—'}</p>
      {party.phone && <p className="text-[12px] text-[#475569] mt-1">Phone: {party.phone}</p>}
      {party.email && <p className="text-[12px] text-[#475569] mt-1">Email: {party.email}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[#f1f5f9]">
      <span className="text-[#475569]">{label}</span>
      <span className="font-semibold text-[#0f172a]">{value}</span>
    </div>
  );
}

function Assurance({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[#593696]">
        {icon}
        <p className="text-[11px] font-bold">{title}</p>
      </div>
      <p className="text-[10px] text-[#64748b] mt-1 leading-relaxed">{body}</p>
    </div>
  );
}
