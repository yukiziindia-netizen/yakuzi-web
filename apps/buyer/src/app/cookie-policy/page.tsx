import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/seo/site';
import PolicyPage, { PolicySection } from '@/components/shared/PolicyPage';
import { COMPANY } from '@/config/company';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  alternates: { canonical: absoluteUrl('/cookie-policy') },
  description:
    'What cookies Yukizi uses, why, and how you can manage your cookie preferences.',
};

export default function CookiePolicyPage() {
  return (
    <PolicyPage
      title="Cookie Policy"
      intro={`This Cookie Policy explains what cookies are and how ${COMPANY.legalName} (“Yukizi”, “we”, “our”, or “us”) uses them on ${COMPANY.websiteUrl}. It should be read together with our Privacy Policy and Terms of Use. By continuing to use the site, you consent to the use of cookies as described below.`}
    >
      <PolicySection title="What Are Cookies">
        <p>
          Cookies are small text files placed on your device by your browser
          when you visit a website. They are widely used to make websites
          work, remember your preferences, and provide information to the
          website operator.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Session cookies</strong> are deleted automatically when
            you close your browser.
          </li>
          <li>
            <strong>Persistent cookies</strong> remain on your device for a
            set period, or until you delete them.
          </li>
          <li>
            <strong>First-party cookies</strong> are set by Yukizi.{' '}
            <strong>Third-party cookies</strong> are set by someone else (for
            example, our payment gateway) and are not controlled by us.
          </li>
        </ul>
      </PolicySection>

      <PolicySection title="Cookies We Use">
        <p>
          Unlike many websites, Yukizi does not run Google Analytics,
          advertising networks, or social media tracking pixels, so we do not
          set cookies for those purposes. The table below reflects what the
          site actually sets today.
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Cookie</th>
                <th className="px-4 py-2.5 font-semibold">Purpose</th>
                <th className="px-4 py-2.5 font-semibold">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-3 font-mono text-xs">yz_vid</td>
                <td className="px-4 py-3">
                  First-party visitor identifier used by our own analytics, so
                  we can tell how many people visit the site and which pages
                  are popular. Not shared with advertisers.
                </td>
                <td className="px-4 py-3">1 year</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          We do not use cookies to keep you signed in or to remember your
          cart — that information is stored in your browser’s local storage
          instead, which is covered by our Privacy Policy rather than this
          Cookie Policy.
        </p>
      </PolicySection>

      <PolicySection title="Third-Party Cookies">
        <p>
          Our payment partner (Razorpay) may set its own cookies during
          checkout to process your payment securely and prevent fraud. These
          are governed by Razorpay’s own privacy and cookie policies, which we
          do not control.
        </p>
        <p>
          If we add analytics, advertising, or social media integrations in
          the future that set additional cookies, we will update this Policy
          before doing so.
        </p>
      </PolicySection>

      <PolicySection title="Legal Basis">
        <p>
          India does not yet have standalone cookie-specific legislation.
          Our use of cookies is governed by the Information Technology Act
          2000 and the SPDI Rules 2011, which require us to disclose the
          personal information we collect (including through cookies) in our
          Privacy Policy. We will update our cookie practices as needed once
          the Digital Personal Data Protection Act 2023 rules are notified.
        </p>
      </PolicySection>

      <PolicySection title="Managing Cookies">
        <p>
          Most browsers let you view, delete, or block cookies through their
          settings:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Chrome: Settings → Privacy and security → Cookies and other site data</li>
          <li>Firefox: Settings → Privacy &amp; Security → Cookies and Site Data</li>
          <li>Safari: Preferences → Privacy → Manage Website Data</li>
          <li>Edge: Settings → Cookies and site permissions</li>
        </ul>
        <p>
          We don’t currently show an in-site cookie preference banner —
          browser settings are the way to manage cookies on Yukizi today. We
          also don’t currently respond to browser “Do Not Track” signals, as
          there is no legal requirement in India to do so yet.
        </p>
        <p>
          Blocking the <span className="font-mono text-xs">yz_vid</span>{' '}
          cookie will not stop you from using the site or making purchases —
          it only affects our ability to measure site traffic.
        </p>
      </PolicySection>

      <PolicySection title="Children">
        <p>
          Yukizi is not directed at children under eighteen. We do not
          knowingly use cookies to collect personal data from children.
        </p>
      </PolicySection>

      <PolicySection title="Changes to This Policy">
        <p>
          We may update this Cookie Policy from time to time, including as
          our use of cookies changes or as Indian law evolves. Changes will
          be posted on this page with an updated effective date.
        </p>
      </PolicySection>

      <PolicySection title="Contact Us">
        <p>
          Questions about this Cookie Policy or our data practices can be
          sent to:
        </p>
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
          Phone: {COMPANY.supportPhone}
          <br />
          Grievance Officer: {COMPANY.grievanceOfficer.name} —{' '}
          <a
            href={`mailto:${COMPANY.grievanceOfficer.email}`}
            className="text-[#562996] underline underline-offset-4"
          >
            {COMPANY.grievanceOfficer.email}
          </a>
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
