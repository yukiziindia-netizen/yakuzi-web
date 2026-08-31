import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/seo/site';
import { staticPageMetadata } from '@/lib/seo/overrides';
import PolicyPage, { PolicySection } from '@/components/shared/PolicyPage';
import { COMPANY } from '@/config/company';

const derivedMetadata: Metadata = {
  title: 'Privacy Policy',
  alternates: { canonical: absoluteUrl('/privacy') },
  description:
    'How Yukizi collects, uses, shares and protects your personal information, and the rights you have over it.',
};

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata('/privacy', derivedMetadata);
}

export default function PrivacyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      intro={`Welcome to ${COMPANY.legalName} (“Yukizi”, “we”, “our”, or “us”). Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your personal information when you visit our website and use our services.`}
    >
      <PolicySection title="Information We Collect">
        <p>When you use our website, we may collect the following information:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Full Name</li>
          <li>Email Address</li>
          <li>Phone Number</li>
          <li>Shipping Address</li>
          <li>Billing Information (if applicable)</li>
          <li>Cookies and browsing information</li>
          <li>Device and browser information</li>
        </ul>
        <p>
          Payment information is securely processed through our payment partners. We
          do not store your complete payment or card details.
        </p>
      </PolicySection>

      <PolicySection title="How We Use Your Information">
        <p>We use your information to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Process and deliver your orders</li>
          <li>Provide customer support</li>
          <li>Send order confirmations and shipping updates</li>
          <li>Improve our website and services</li>
          <li>Prevent fraud and unauthorized transactions</li>
          <li>Comply with legal obligations</li>
        </ul>
      </PolicySection>

      <PolicySection title="Cookies">
        <p>
          Our website uses cookies to improve your browsing experience. Cookies help
          us remember your preferences, analyze website traffic, and improve our
          services.
        </p>
        <p>
          You may disable cookies through your browser settings; however, some website
          features may not function properly.
        </p>
      </PolicySection>

      <PolicySection title="Sharing of Information">
        <p>We do not sell or rent your personal information.</p>
        <p>We may share your information only with:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Delivery partners</li>
          <li>Payment service providers</li>
          <li>Government authorities when legally required</li>
          <li>Service providers who help operate our website</li>
        </ul>
      </PolicySection>

      <PolicySection title="Data Security">
        <p>
          We implement appropriate technical and organizational measures to protect
          your personal information from unauthorized access, disclosure, alteration,
          or destruction.
        </p>
      </PolicySection>

      <PolicySection title="Your Rights">
        <p>You may request to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Access your personal information</li>
          <li>Correct inaccurate information</li>
          <li>Delete your information where legally permitted</li>
          <li>Withdraw marketing communications</li>
        </ul>
      </PolicySection>

      <PolicySection title="Third-Party Links">
        <p>
          Our website may contain links to third-party websites. We are not
          responsible for their privacy practices.
        </p>
      </PolicySection>

      <PolicySection title="Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. Any changes will be
          posted on this page with the updated effective date.
        </p>
      </PolicySection>

      <PolicySection title="Contact Us">
        <p>
          If you have any questions regarding this Privacy Policy, please contact us:
        </p>
        <p>
          {COMPANY.legalName}
          <br />
          Website:{' '}
          <a
            href={COMPANY.websiteUrl}
            className="text-[#562996] underline underline-offset-4"
          >
            {COMPANY.websiteUrl}
          </a>
          <br />
          Email:{' '}
          <a
            href={`mailto:${COMPANY.supportEmail}`}
            className="text-[#562996] underline underline-offset-4"
          >
            {COMPANY.supportEmail}
          </a>
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
