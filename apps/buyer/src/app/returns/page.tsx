import type { Metadata } from 'next';
import PolicyPage, { PolicySection } from '@/components/shared/PolicyPage';
import { COMPANY } from '@/config/company';

export const metadata: Metadata = {
  title: 'Returns & Refunds | Yukizi',
  description:
    'When you can return an item to Yukizi, how to start a return, and how long refunds take.',
};

export default function ReturnsPage() {
  return (
    <PolicyPage
      title="Returns & Refunds"
      intro="If something arrives damaged, faulty or simply is not what you ordered, we will make it right."
    >
      <PolicySection title="The short version">
        <p>
          Tell us within {COMPANY.returnWindowDays} days of delivery, send us a photo,
          and we will arrange a replacement or a refund. Items need to come back
          unused and in their original packaging.
        </p>
      </PolicySection>

      <PolicySection title="What you can return">
        <p>
          You can return an item that arrived damaged or faulty, that is materially
          different from its description, or where you received the wrong item or a
          missing piece from a set.
        </p>
        <p>
          Requests must reach us within {COMPANY.returnWindowDays} days of delivery,
          with the item unused and in its original packaging, including any inserts,
          sleeves, tags and freebies that came with it.
        </p>
      </PolicySection>

      <PolicySection title="What we cannot accept">
        <p>
          We cannot accept returns of items damaged after delivery through use,
          storage or handling; items returned without their original packaging or with
          parts missing; items where the shrink wrap or seal on a collectible has been
          opened, unless the fault is inside; or items reported after the{' '}
          {COMPANY.returnWindowDays}-day window.
        </p>
        <p>
          Minor variation in print, colour or packaging between production runs is not
          a defect, and small creases to outer sleeves that occur in transit are not
          treated as damage unless they affect the item itself.
        </p>
      </PolicySection>

      <PolicySection title="How to start a return">
        <p>
          Contact{' '}
          <a
            href={`mailto:${COMPANY.supportEmail}`}
            className="text-[#562996] underline underline-offset-4"
          >
            {COMPANY.supportEmail}
          </a>{' '}
          or raise a ticket from the{' '}
          <a href="/support" className="text-[#562996] underline underline-offset-4">
            support page
          </a>{' '}
          with your order number, what is wrong, and photographs of the item and its
          packaging.
        </p>
        <p>
          We will confirm whether to arrange a pickup or ask you to send the item to{' '}
          {COMPANY.returnsAddress}. Please do not ship anything back before we confirm
          — unannounced returns are difficult to trace to an order.
        </p>
      </PolicySection>

      <PolicySection title="Return shipping costs">
        <p>
          Where the item is damaged, faulty or incorrect, we cover return shipping.
          Where a return is accepted as a goodwill exception, return shipping is at
          your cost.
        </p>
      </PolicySection>

      <PolicySection title="Refunds">
        <p>
          Once the returned item reaches us and passes inspection, we approve the
          refund and process it within {COMPANY.refundProcessingDays}. If the item
          never left our warehouse, we refund as soon as the cancellation is
          confirmed.
        </p>
        <p>
          Refunds go back to the payment method used for the order. Where that is not
          possible — for example an order paid by bank transfer, UPI or cash on
          delivery — we refund to a bank account you nominate, and we may ask you to
          confirm those details in writing before releasing the money.
        </p>
        <p>
          The original shipping charge is refunded when the return is our fault. Once
          your bank has the refund, the time it takes to appear on your statement is
          theirs, not ours.
        </p>
      </PolicySection>

      <PolicySection title="Cancellations">
        <p>
          You can cancel an order for a full refund at any point before it is
          dispatched. Once a parcel has left the warehouse it has to be handled as a
          return.
        </p>
      </PolicySection>

      <PolicySection title="Replacements">
        <p>
          Where you would rather have the item than the money, we will send a
          replacement if the same product is in stock. If it is not, we will offer an
          alternative or refund you in full — your choice.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
