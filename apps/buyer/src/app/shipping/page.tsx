import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/seo/site';
import { staticPageMetadata } from '@/lib/seo/overrides';
import PolicyPage, { PolicySection } from '@/components/shared/PolicyPage';
import { COMPANY } from '@/config/company';
import { fetchSupportContact } from '@/lib/seo/support-contact';

const derivedMetadata: Metadata = {
  title: 'Shipping Policy',
  alternates: { canonical: absoluteUrl('/shipping') },
  description:
    'Yukizi order processing times, shipping charges, delivery timelines, tracking and coverage.',
};

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata('/shipping', derivedMetadata);
}

export default async function ShippingPage() {
  const support = await fetchSupportContact();
  return (
    <PolicyPage
      title="Shipping Policy"
      intro={`Thank you for shopping with ${COMPANY.legalName}.`}
    >
      <PolicySection title="Order Processing">
        <p>
          Orders are processed within 24&ndash;48 hours after successful payment
          confirmation.
        </p>
        <p>
          Orders placed on weekends or public holidays will be processed on the next
          business day.
        </p>
      </PolicySection>

      <PolicySection title="Shipping Charges">
        <p>
          We offer FREE shipping on all eligible orders across India. No additional
          shipping charges are applied during checkout unless otherwise stated.
        </p>
      </PolicySection>

      <PolicySection title="Delivery Time">
        <p>
          Estimated delivery time is {COMPANY.deliveryWindow} from the date of
          dispatch.
        </p>
        <p>
          Delivery timelines may vary depending on your location and courier partner.
        </p>
      </PolicySection>

      <PolicySection title="Order Tracking">
        <p>
          Once your order has been dispatched, you will receive shipment tracking
          information through your registered email or phone number.
        </p>
      </PolicySection>

      <PolicySection title="Delivery Delays">
        <p>
          While we aim to deliver every order on time, delays may occur due to:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Weather conditions</li>
          <li>Natural disasters</li>
          <li>Public holidays</li>
          <li>Courier partner delays</li>
          <li>Remote delivery locations</li>
        </ul>
        <p>In such situations, we appreciate your patience and understanding.</p>
      </PolicySection>

      <PolicySection title="Shipping Coverage">
        <p>
          Currently, we deliver across India. International shipping may be introduced
          in the future.
        </p>
      </PolicySection>

      <PolicySection title="Contact">
        <p>For shipping-related questions, contact:</p>
        <p>
          Email:{' '}
          <a
            href={`mailto:${support.email}`}
            className="text-[#562996] underline underline-offset-4"
          >
            {support.email}
          </a>
          <br />
          Website:{' '}
          <a
            href={COMPANY.websiteUrl}
            className="text-[#562996] underline underline-offset-4"
          >
            {COMPANY.websiteUrl}
          </a>
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
