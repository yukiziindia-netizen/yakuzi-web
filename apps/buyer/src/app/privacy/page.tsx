import type { Metadata } from 'next';
import PolicyPage, { PolicySection } from '@/components/shared/PolicyPage';
import { COMPANY } from '@/config/company';

export const metadata: Metadata = {
  title: 'Privacy Policy | Yukizi',
  description:
    'How Yukizi collects, uses, shares and protects your personal data, and the rights you have over it.',
};

export default function PrivacyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      intro={`This policy explains what personal data ${COMPANY.brandName} collects, why we collect it, who we share it with, and what you can ask us to do with it.`}
    >
      <PolicySection title="Who we are">
        <p>
          {COMPANY.brandName} is operated by {COMPANY.legalName}, registered at{' '}
          {COMPANY.registeredAddress}. For the purposes of this policy we are the
          entity that decides how and why your personal data is processed.
        </p>
      </PolicySection>

      <PolicySection title="What we collect">
        <p>
          <strong>Information you give us.</strong> Your name, email address, phone
          number, delivery and billing addresses, and the contents of any message or
          support ticket you send us.
        </p>
        <p>
          <strong>Order information.</strong> The products you order, order value,
          delivery status and payment status.
        </p>
        <p>
          <strong>Technical information.</strong> Device and browser type, IP address,
          and how you move through the site. This is used to keep the service working
          and secure.
        </p>
        <p>
          We do not ask for and do not want sensitive personal data beyond what is
          listed above.
        </p>
      </PolicySection>

      <PolicySection title="Why we use it">
        <p>
          To create and secure your account; to process, pack, deliver and invoice
          your orders; to handle returns, refunds and support requests; to detect and
          prevent fraud and abuse; and to meet our tax, accounting and other legal
          obligations.
        </p>
        <p>
          We send service messages about your orders because they are part of the
          service. Marketing messages are sent only if you opt in, and every one of
          them carries a way to opt back out.
        </p>
      </PolicySection>

      <PolicySection title="Who we share it with">
        <p>
          <strong>Sellers and logistics partners.</strong> The seller fulfilling your
          order and the courier delivering it receive the details needed to pack and
          deliver it — typically your name, delivery address and phone number.
        </p>
        <p>
          <strong>Service providers.</strong> Hosting, communications and analytics
          providers process data on our behalf under contract, and are not permitted
          to use it for their own purposes.
        </p>
        <p>
          <strong>Authorities.</strong> Where we are legally required to disclose
          information, or where disclosure is necessary to protect our rights or the
          safety of others.
        </p>
        <p>We do not sell your personal data.</p>
      </PolicySection>

      <PolicySection title="Payment information">
        <p>
          Where payment is made by bank transfer or UPI, we receive confirmation of
          the transaction and any reference or proof of payment you upload. Complete
          card numbers are not stored on our systems.
        </p>
      </PolicySection>

      <PolicySection title="Cookies">
        <p>
          We use cookies and similar storage to keep you signed in, remember your cart
          and understand how the site is used. Blocking cookies in your browser is
          your choice, but parts of the site — signing in and checkout in particular —
          will stop working properly.
        </p>
      </PolicySection>

      <PolicySection title="How long we keep it">
        <p>
          Account data is kept while your account is open. Order, invoice and tax
          records are kept for as long as the applicable tax and company law requires,
          even after an account is closed. Support correspondence is kept while it is
          needed to resolve the matter and for a reasonable period afterwards.
        </p>
      </PolicySection>

      <PolicySection title="How we protect it">
        <p>
          Data is transmitted over encrypted connections, access is limited to people
          who need it to do their job, and credentials are stored using one-way
          hashing. No system is perfectly secure, so we also commit to telling you and
          the relevant authority promptly if a breach affects your data.
        </p>
      </PolicySection>

      <PolicySection title="Your rights">
        <p>
          You can ask us to give you a copy of your data, correct anything inaccurate,
          delete data we no longer have a legal reason to keep, or stop sending you
          marketing. Write to{' '}
          <a
            href={`mailto:${COMPANY.supportEmail}`}
            className="text-[#562996] underline underline-offset-4"
          >
            {COMPANY.supportEmail}
          </a>{' '}
          and we will respond within a reasonable period.
        </p>
        <p>
          You can also close your account at any time from your profile. Closing an
          account does not delete records we are required by law to retain.
        </p>
      </PolicySection>

      <PolicySection title="Children">
        <p>
          Yukizi is not intended for children under 18. If you are under 18, please
          use the site only with the involvement of a parent or guardian.
        </p>
      </PolicySection>

      <PolicySection title="Changes and complaints">
        <p>
          If this policy changes materially we will update the date at the top of this
          page and, where the change affects you meaningfully, tell you directly.
        </p>
        <p>
          Complaints about how we handle personal data can be sent to our grievance
          officer, {COMPANY.grievanceOfficer.name}, at{' '}
          <a
            href={`mailto:${COMPANY.grievanceOfficer.email}`}
            className="text-[#562996] underline underline-offset-4"
          >
            {COMPANY.grievanceOfficer.email}
          </a>
          .
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
