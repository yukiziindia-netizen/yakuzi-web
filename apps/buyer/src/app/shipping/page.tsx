import type { Metadata } from 'next';
import PolicyPage, { PolicySection } from '@/components/shared/PolicyPage';
import { COMPANY } from '@/config/company';

export const metadata: Metadata = {
  title: 'Shipping Policy | Yukizi',
  description:
    'Yukizi delivery timelines, shipping charges, tracking, and what to do if a parcel arrives damaged or late.',
};

export default function ShippingPage() {
  return (
    <PolicyPage
      title="Shipping Policy"
      intro="How and when your order gets to you, what it costs, and what happens when something goes wrong in transit."
    >
      <PolicySection title="Where we deliver">
        <p>
          We deliver across India to any address our courier partners serve. Some PIN
          codes are not serviceable; where that is the case, checkout will tell you
          before you pay.
        </p>
      </PolicySection>

      <PolicySection title="Dispatch and delivery times">
        <p>
          Orders are usually dispatched within 1–2 business days of payment being
          confirmed. Delivery typically takes {COMPANY.deliveryWindow} from dispatch,
          depending on your location.
        </p>
        <p>
          These are estimates, not guarantees. Festive periods, weather, strikes and
          courier backlogs can add time, and pre-order or made-to-order items ship on
          the date shown on the product page rather than immediately.
        </p>
      </PolicySection>

      <PolicySection title="Shipping charges">
        <p>
          Shipping charges depend on the item and destination, and are shown on the
          product page and again at checkout before you confirm your order. What you
          see at checkout is what you pay — we do not add charges afterwards.
        </p>
      </PolicySection>

      <PolicySection title="Tracking your order">
        <p>
          Once your order ships we will share a tracking reference, and you can follow
          its progress from the{' '}
          <a href="/orders" className="text-[#562996] underline underline-offset-4">
            orders page
          </a>{' '}
          in your account. Tracking can take up to 24 hours to start updating after
          dispatch.
        </p>
      </PolicySection>

      <PolicySection title="Delivery attempts and address accuracy">
        <p>
          Please check your delivery address and phone number before confirming an
          order — couriers rely on both. If a parcel is returned to us because the
          address was wrong or nobody was available across the courier&apos;s delivery
          attempts, we will contact you to arrange redelivery, which may carry a
          further shipping charge.
        </p>
      </PolicySection>

      <PolicySection title="Damaged, missing or delayed parcels">
        <p>
          Please inspect your parcel on arrival. If it looks tampered with or crushed,
          refuse the delivery where you can, and photograph the packaging before
          opening it where you cannot.
        </p>
        <p>
          Report damage in transit, a missing item or a parcel marked delivered that
          you did not receive within {COMPANY.returnWindowDays} days of the delivery
          date, and we will investigate with the courier and put it right. Photographs
          of the packaging and contents help us resolve these quickly.
        </p>
      </PolicySection>

      <PolicySection title="Questions">
        <p>
          For anything about a shipment, contact{' '}
          <a
            href={`mailto:${COMPANY.supportEmail}`}
            className="text-[#562996] underline underline-offset-4"
          >
            {COMPANY.supportEmail}
          </a>{' '}
          with your order number, or raise a ticket from the{' '}
          <a href="/support" className="text-[#562996] underline underline-offset-4">
            support page
          </a>
          .
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
