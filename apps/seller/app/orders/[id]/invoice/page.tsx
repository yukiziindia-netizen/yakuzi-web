"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer, Loader2, ShieldCheck } from "lucide-react";
import { useSellerOrderInvoices } from "@/hooks/useSeller";

/**
 * Printable tax invoice for a seller's own order — a port of the buyer's
 * equivalent page (apps/buyer/src/app/orders/[orderId]/invoice/page.tsx),
 * minus the "email me this invoice" action: POST /orders/:id/invoice/email
 * always emails the order's buyer, not the caller, so it's buyer/admin-only
 * on the API side (see Task 4) — a seller only gets print/download here.
 *
 * One invoice per seller on the order; InvoiceService already scopes the
 * response to just this seller's items when the caller is a seller.
 *
 * Yukizi's own registered details in the footer are intentionally blank
 * until the real legal name, GSTIN, CIN and address are supplied.
 */

const money = (n: number) =>
  `₹${Number(n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function SellerInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const { data: invoices, isLoading, error } = useSellerOrderInvoices(id);

  useEffect(() => {
    if (invoices?.[0]) document.title = invoices[0].invoiceNumber;
  }, [invoices]);

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-3 bg-white px-6 text-center">
        <p className="text-muted-foreground">
          {(error as any)?.response?.data?.message || "We could not load the invoice for this order."}
        </p>
        <Link href={`/orders/${id}`} className="text-primary font-semibold underline underline-offset-2">
          Back to order
        </Link>
      </main>
    );
  }

  if (isLoading || !invoices) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </main>
    );
  }

  return (
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
          href={`/orders/${id}`}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-primary font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to order
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-white text-sm font-bold shadow hover:opacity-90 transition-opacity"
          >
            <Printer className="w-4 h-4" /> Download / Print
          </button>
        </div>
      </div>

      {invoices.length === 0 && (
        <p className="max-w-[900px] mx-auto text-center text-muted-foreground">
          There is nothing to invoice on this order.
        </p>
      )}

      {invoices.map((inv) => (
        <section
          key={inv.invoiceNumber}
          className="invoice-sheet max-w-[900px] mx-auto mb-6 bg-white border border-border rounded-xl overflow-hidden"
        >
          <div className="p-8">
            <div className="flex items-start justify-between gap-8">
              <span className="text-2xl font-bold tracking-tight text-primary">YUKIZI</span>
              <div className="text-right">
                <h1 className="text-2xl font-bold tracking-tight text-primary">TAX INVOICE</h1>
                <table className="mt-3 ml-auto text-sm">
                  <tbody>
                    <tr>
                      <td className="pr-6 text-muted-foreground text-left">Invoice No.</td>
                      <td className="font-semibold">{inv.invoiceNumber}</td>
                    </tr>
                    <tr>
                      <td className="pr-6 text-muted-foreground text-left">Invoice Date</td>
                      <td className="font-semibold">
                        {new Date(inv.invoiceDate).toLocaleDateString("en-IN", {
                          day: "2-digit", month: "long", year: "numeric",
                        })}
                      </td>
                    </tr>
                    <tr>
                      <td className="pr-6 text-muted-foreground text-left">Order ID</td>
                      <td className="font-semibold">{inv.orderReference}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 border-t-2 border-primary" />

            <div className="mt-6 flex gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-primary">Generated via Yukizi Marketplace</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  This invoice is generated on behalf of the seller for the supply of goods to the customer.
                </p>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-8">
              <SellerInvoiceParty title="SELLER" subtitle="(You, the supplier)" party={inv.seller} />
              <div className="border-l border-border pl-8">
                <SellerInvoiceParty title="BUYER" subtitle="(Customer)" party={inv.buyer} />
              </div>
            </div>

            <table className="w-full mt-8 text-xs border-collapse">
              <thead>
                <tr className="bg-primary text-white text-left">
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
                  <tr key={l.serial} className="border-b border-border">
                    <td className="py-3 px-3 text-muted-foreground">{l.serial}</td>
                    <td className="py-3 px-3 font-medium">{l.description}</td>
                    <td className="py-3 px-3 text-center text-muted-foreground">{l.quantity}</td>
                    <td className="py-3 px-3 text-right text-muted-foreground">{l.unitPrice.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right text-muted-foreground">{l.taxableValue.toFixed(2)}</td>
                    <td className="py-3 px-3 text-center text-muted-foreground">{l.gstRate}%</td>
                    <td className="py-3 px-3 text-right text-muted-foreground">{l.gstAmount.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-semibold">{l.totalAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-7 grid grid-cols-2 gap-8 items-start">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm font-bold text-primary mb-1.5">Note</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This is a tax invoice for the supply of goods sold by you (the seller) to the customer,
                  generated on your behalf by Yukizi Marketplace.
                </p>
              </div>

              <div className="text-sm">
                <SellerInvoiceRow label="Subtotal (Taxable Value)" value={money(inv.subtotal)} />
                {inv.taxBreakdown?.length ? (
                  inv.taxBreakdown.map((t) =>
                    inv.isIntraState ? (
                      <React.Fragment key={t.rate}>
                        <SellerInvoiceRow label={`CGST (${t.componentRate}%)`} value={money(t.cgst)} />
                        <SellerInvoiceRow label={`SGST (${t.componentRate}%)`} value={money(t.sgst)} />
                      </React.Fragment>
                    ) : (
                      <SellerInvoiceRow key={t.rate} label={`IGST (${t.componentRate}%)`} value={money(t.igst)} />
                    ),
                  )
                ) : inv.isIntraState ? (
                  <>
                    <SellerInvoiceRow label="CGST" value={money(inv.cgst)} />
                    <SellerInvoiceRow label="SGST" value={money(inv.sgst)} />
                  </>
                ) : (
                  <SellerInvoiceRow label="IGST" value={money(inv.igst)} />
                )}
                <div className="mt-3 flex items-center justify-between rounded-lg bg-primary/10 px-4 py-3">
                  <span className="font-bold text-primary">TOTAL AMOUNT PAYABLE (₹)</span>
                  <span className="text-xl font-bold text-primary">{money(inv.totalAmount)}</span>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Amount in Words:</p>
                <p className="text-xs">{inv.amountInWords}</p>
                {inv.placeOfSupply && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Place of supply: <span>{inv.placeOfSupply}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer — Yukizi's registered details. Only the support address is
              known; legal name, GSTIN, CIN and registered address are left
              blank rather than filled with placeholders on a tax document. */}
          <div className="bg-primary px-8 py-6 text-white">
            <p className="text-sm font-bold">&nbsp;</p>
            <p className="text-xs opacity-90 mt-1">GSTIN:&nbsp;</p>
            <p className="text-xs opacity-90">Address:&nbsp;</p>
            <p className="text-xs opacity-90">CIN:&nbsp;</p>
            <p className="text-xs opacity-90">
              Email: <a href="mailto:support@yukizi.com" className="underline">support@yukizi.com</a>
            </p>
            <p className="text-xs opacity-75 text-center mt-4">
              This is a system generated invoice and does not require signature.
            </p>
          </div>
        </section>
      ))}
    </main>
  );
}

function SellerInvoiceParty({ title, subtitle, party }: { title: string; subtitle: string; party: any }) {
  return (
    <div>
      <p className="text-base font-bold text-primary">
        {title} <span className="text-xs font-semibold text-muted-foreground">{subtitle}</span>
      </p>
      <p className="mt-2 text-sm font-bold">{party.name || "—"}</p>
      <p className="text-xs text-muted-foreground mt-1">GSTIN: {party.gstin || "—"}</p>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{party.address || "—"}</p>
      {party.phone && <p className="text-xs text-muted-foreground mt-1">Phone: {party.phone}</p>}
      {party.email && <p className="text-xs text-muted-foreground mt-1">Email: {party.email}</p>}
    </div>
  );
}

function SellerInvoiceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
