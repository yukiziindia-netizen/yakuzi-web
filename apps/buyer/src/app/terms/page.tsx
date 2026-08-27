import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/seo/site';
import PolicyPage, { PolicySection } from '@/components/shared/PolicyPage';
import { COMPANY } from '@/config/company';

export const metadata: Metadata = {
  title: 'Terms of Use',
  alternates: { canonical: absoluteUrl('/terms') },
  description:
    'The terms you agree to when you access Yukizi, create an account or place an order.',
};

export default function TermsPage() {
  return (
    <PolicyPage
      title="Terms of Use"
      intro={`Welcome to ${COMPANY.legalName}. By accessing or using our website, you agree to comply with these Terms of Use.`}
    >
      <PolicySection title="Eligibility">
        <p>
          You must be at least 18 years of age or use this website under the
          supervision of a parent or legal guardian.
        </p>
      </PolicySection>

      <PolicySection title="User Accounts">
        <p>
          Customers may create an account to enjoy a better shopping experience. You
          are responsible for maintaining the confidentiality of your account
          credentials.
        </p>
      </PolicySection>

      <PolicySection title="Guest Checkout">
        <p>
          Guest checkout is currently not available. Customers must create an account
          to place an order.
        </p>
      </PolicySection>

      <PolicySection title="Cash on Delivery (COD)">
        <p>
          Cash on Delivery (COD) is available for eligible orders and serviceable
          locations.
        </p>
      </PolicySection>

      <PolicySection title="Product Information">
        <p>
          We strive to ensure that all product descriptions, pricing, and images are
          accurate. However, minor variations may occur.
        </p>
        <p>
          We reserve the right to modify pricing, discontinue products, or correct
          errors without prior notice.
        </p>
      </PolicySection>

      <PolicySection title="Orders">
        <p>
          We reserve the right to accept, reject, or cancel any order for reasons
          including:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Incorrect pricing</li>
          <li>Product unavailability</li>
          <li>Suspected fraudulent activity</li>
          <li>Violation of these Terms</li>
        </ul>
      </PolicySection>

      <PolicySection title="Intellectual Property">
        <p>
          All website content, including text, graphics, logos, images, icons, and
          designs, belongs to {COMPANY.legalName} and may not be copied, reproduced,
          or distributed without written permission.
        </p>
      </PolicySection>

      <PolicySection title="Prohibited Activities">
        <p>Users must not:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Misuse the website</li>
          <li>Attempt unauthorized access</li>
          <li>Upload malicious software</li>
          <li>Engage in fraudulent transactions</li>
          <li>Copy website content without permission</li>
        </ul>
      </PolicySection>

      <PolicySection title="Limitation of Liability">
        <p>
          {COMPANY.legalName} shall not be liable for indirect, incidental, or
          consequential damages arising from the use of this website.
        </p>
      </PolicySection>

      <PolicySection title="Governing Law">
        <p>These Terms shall be governed by the laws of India.</p>
      </PolicySection>

      <PolicySection title="Contact">
        <p>For questions regarding these Terms, please contact:</p>
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
