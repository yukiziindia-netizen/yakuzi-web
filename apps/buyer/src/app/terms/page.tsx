import type { Metadata } from 'next';
import PolicyPage, { PolicySection } from '@/components/shared/PolicyPage';
import { COMPANY } from '@/config/company';

export const metadata: Metadata = {
  title: 'Terms of Use | Yukizi',
  description:
    'The terms that govern your use of the Yukizi platform, including orders, pricing, accounts and liability.',
};

export default function TermsPage() {
  return (
    <PolicyPage
      title="Terms of Use"
      intro={`These terms govern your use of ${COMPANY.brandName}. By creating an account or placing an order, you agree to them.`}
    >
      <PolicySection title="1. Who you are contracting with">
        <p>
          The {COMPANY.brandName} platform is operated by {COMPANY.legalName},
          registered at {COMPANY.registeredAddress}. In these terms, &ldquo;we&rdquo;
          and &ldquo;us&rdquo; mean that company, and &ldquo;you&rdquo; means the
          person using the platform.
        </p>
      </PolicySection>

      <PolicySection title="2. The platform's role">
        <p>
          Yukizi is an online marketplace. Products are listed and fulfilled by
          sellers onboarded onto the platform, and the contract of sale for an item is
          between you and the seller of that item. We provide the platform, take
          payment, and coordinate delivery and support.
        </p>
      </PolicySection>

      <PolicySection title="3. Your account">
        <p>
          You need an account to place an order. Keep your login details to yourself —
          activity under your account is treated as yours. Tell us promptly if you
          think someone else has access.
        </p>
        <p>
          The information you give us must be accurate. We may suspend or close
          accounts used for fraud, abuse of returns, resale in breach of these terms,
          or anything unlawful.
        </p>
      </PolicySection>

      <PolicySection title="4. Products and availability">
        <p>
          We work to describe and picture products accurately, but packaging, print
          runs and manufacturer revisions vary. Minor variation between the image and
          the item you receive is not a defect.
        </p>
        <p>
          Listings depend on seller stock. If an item becomes unavailable after you
          order it, we will tell you and refund that item in full.
        </p>
      </PolicySection>

      <PolicySection title="5. Prices and payment">
        <p>
          Prices are in Indian Rupees. The product page and checkout show the price,
          any applicable taxes and delivery charges before you confirm.
        </p>
        <p>
          If a price is listed in error, we are not obliged to fulfil the order at
          that price. Where this happens we will contact you before dispatch and you
          can confirm at the corrected price or cancel for a full refund.
        </p>
        <p>
          An order is accepted when we confirm payment against it. Until then it is an
          offer to buy, not a concluded sale.
        </p>
      </PolicySection>

      <PolicySection title="6. Delivery, returns and refunds">
        <p>
          Delivery timelines and charges are set out in our{' '}
          <a href="/shipping" className="text-[#562996] underline underline-offset-4">
            shipping policy
          </a>
          . Your rights to return an item and how refunds are processed are set out in
          our{' '}
          <a href="/returns" className="text-[#562996] underline underline-offset-4">
            returns and refunds policy
          </a>
          . Both form part of these terms.
        </p>
      </PolicySection>

      <PolicySection title="7. Acceptable use">
        <p>
          Do not interfere with the platform or attempt to access parts of it you have
          no right to; do not scrape, copy or resell our catalogue data; do not upload
          anything unlawful, misleading or infringing; and do not use the platform to
          place fraudulent or speculative orders.
        </p>
      </PolicySection>

      <PolicySection title="8. Intellectual property">
        <p>
          The Yukizi name, logo, site design and original content belong to us or our
          licensors. Product names, cover art, character artwork and trade marks
          belong to their respective owners and appear here to identify the goods
          offered for sale.
        </p>
      </PolicySection>

      <PolicySection title="9. Liability">
        <p>
          Nothing in these terms limits liability that cannot be limited by law,
          including liability for death or personal injury caused by negligence, or
          for fraud.
        </p>
        <p>
          Subject to that, our total liability arising from an order is limited to the
          amount you paid for that order, and we are not liable for indirect or
          consequential loss, or for loss of profit, revenue or opportunity.
        </p>
      </PolicySection>

      <PolicySection title="10. Changes to these terms">
        <p>
          We may update these terms. The version in force is the one published here
          when you place your order, and the date at the top of this page shows when
          it last changed.
        </p>
      </PolicySection>

      <PolicySection title="11. Governing law">
        <p>
          These terms are governed by the laws of India, and the courts at{' '}
          {COMPANY.jurisdictionCity} have exclusive jurisdiction over any dispute.
        </p>
      </PolicySection>

      <PolicySection title="12. Contact">
        <p>
          Questions about these terms can be sent to{' '}
          <a
            href={`mailto:${COMPANY.supportEmail}`}
            className="text-[#562996] underline underline-offset-4"
          >
            {COMPANY.supportEmail}
          </a>
          .
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
