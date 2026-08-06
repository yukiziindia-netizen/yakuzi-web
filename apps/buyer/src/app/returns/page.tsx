import type { Metadata } from 'next';
import PolicyPage, { PolicySection } from '@/components/shared/PolicyPage';
import { COMPANY } from '@/config/company';

export const metadata: Metadata = {
  title: 'Return & Refund Policy | Yukizi',
  description:
    'When Yukizi accepts a return, the proof required, how requests are verified and how refunds are processed.',
};

export default function ReturnsPage() {
  return (
    <PolicyPage
      title="Return & Refund Policy"
      intro={`At ${COMPANY.legalName}, customer satisfaction is important to us.`}
    >
      <PolicySection title="Eligible Returns">
        <p>We only accept returns if:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>The product received is damaged.</li>
          <li>The wrong product has been delivered.</li>
        </ul>
        <p>
          Returns for change of mind, incorrect orders placed by the customer, or
          products that have been used are not accepted.
        </p>
      </PolicySection>

      <PolicySection title="Return Request Period">
        <p>
          Customers must notify us within {COMPANY.returnWindowDays} days of receiving
          the product.
        </p>
        <p>
          Requests submitted after this period may not be eligible for return or
          refund.
        </p>
      </PolicySection>

      <PolicySection title="Proof Required">
        <p>To process a return request, customers must provide:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Clear photographs of the product</li>
          <li>Images of the package (if applicable)</li>
          <li>Order number</li>
        </ul>
        <p>
          Failure to provide sufficient evidence may result in rejection of the
          request.
        </p>
      </PolicySection>

      <PolicySection title="Verification">
        <p>
          Once the request is received, our team will review the submitted
          information. If approved, we will arrange a replacement or issue a refund,
          depending on the situation.
        </p>
      </PolicySection>

      <PolicySection title="Refund Process">
        <p>
          Approved refunds will be processed to the original payment method used for
          the purchase.
        </p>
        <p>
          Refund processing times may vary depending on the payment provider or bank.
        </p>
      </PolicySection>

      <PolicySection title="Non-Returnable Items">
        <p>Returns will not be accepted for:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Used products</li>
          <li>Products damaged after delivery due to customer misuse</li>
          <li>Products without proof of damage or incorrect delivery</li>
          <li>
            Requests made after the {COMPANY.returnWindowDays}-day return period
          </li>
        </ul>
      </PolicySection>

      <PolicySection title="Contact Us">
        <p>For return or refund assistance, please contact:</p>
        <p>
          {COMPANY.legalName}
          <br />
          Email:{' '}
          <a
            href={`mailto:${COMPANY.supportEmail}`}
            className="text-[#562996] underline underline-offset-4"
          >
            {COMPANY.supportEmail}
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
