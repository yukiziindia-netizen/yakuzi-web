import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/seo/site';
import { staticPageMetadata } from '@/lib/seo/overrides';
import PolicyPage, { PolicySection } from '@/components/shared/PolicyPage';
import { COMPANY } from '@/config/company';

const derivedMetadata: Metadata = {
  title: 'Contact Us',
  alternates: { canonical: absoluteUrl('/contact') },
  description:
    'Contact details for Yukizi customer support, including our grievance officer and registered office address.',
};

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata('/contact', derivedMetadata);
}

export default function ContactPage() {
  return (
    <PolicyPage
      title="Contact Us"
      showLastUpdated={false}
      intro="We would rather hear from you than have you guess. Here is how to reach us."
    >
      <PolicySection title="Customer support">
        <p>
          Email:{' '}
          <a
            href={`mailto:${COMPANY.supportEmail}`}
            className="text-[#562996] underline underline-offset-4"
          >
            {COMPANY.supportEmail}
          </a>
        </p>
        <p>Phone: {COMPANY.supportPhone}</p>
        <p>Hours: {COMPANY.supportHours}</p>
        <p>
          If your question is about an order you have already placed, please include
          the order number — it lets us answer in one reply instead of three.
        </p>
      </PolicySection>

      <PolicySection title="Raise a support ticket">
        <p>
          If you have a Yukizi account, you can raise a ticket from the{' '}
          <a href="/support" className="text-[#562996] underline underline-offset-4">
            support page
          </a>{' '}
          and track our replies against your order history.
        </p>
      </PolicySection>

      <PolicySection title="Grievance officer">
        <p>
          In line with the Consumer Protection (E-Commerce) Rules, 2020 and the
          Information Technology (Intermediary Guidelines and Digital Media Ethics
          Code) Rules, 2021, complaints that have not been resolved by customer
          support can be escalated to our grievance officer.
        </p>
        <p>Name: {COMPANY.grievanceOfficer.name}</p>
        <p>
          Email:{' '}
          <a
            href={`mailto:${COMPANY.grievanceOfficer.email}`}
            className="text-[#562996] underline underline-offset-4"
          >
            {COMPANY.grievanceOfficer.email}
          </a>
        </p>
        <p>
          We acknowledge grievances within 48 hours of receipt and aim to resolve
          them within one month.
        </p>
      </PolicySection>

      <PolicySection title="Registered office">
        <p>{COMPANY.legalName}</p>
        <p>{COMPANY.registeredAddress}</p>
        <p>
          Please note this is our registered office and not a returns address —
          returns are handled through the process on our{' '}
          <a href="/returns" className="text-[#562996] underline underline-offset-4">
            returns and refunds page
          </a>
          .
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
