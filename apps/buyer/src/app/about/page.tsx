import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/seo/site';
import PolicyPage, { PolicySection } from '@/components/shared/PolicyPage';
import { COMPANY } from '@/config/company';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbSchema, faqPageSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
  title: 'About Us',
  alternates: { canonical: absoluteUrl('/about') },
  description:
    'Yukizi is an online store for manga, anime figures, collectibles and accessories, shipping across India.',
};

// Rendered as the visible FAQ below AND as FAQPage JSON-LD — one source, so
// the structured data can never say something the page doesn't.
const FAQS = [
  {
    question: 'What is Yukizi?',
    answer: `Yukizi is an online marketplace for manga, anime figures, collectibles and accessories in India, operated by ${COMPANY.legalName}. Products are listed by sellers onboarded onto the platform; Yukizi handles ordering, payment and delivery coordination.`,
  },
  {
    question: 'What does Yukizi sell?',
    answer:
      'Manga volumes and box sets, scale and chibi anime figures, action figures, trading cards and licensed accessories across popular series such as One Piece, Naruto, Bleach and Demon Slayer.',
  },
  {
    question: 'Where does Yukizi deliver?',
    answer:
      'Yukizi ships across India. Every order can be tracked from your account once it is dispatched.',
  },
  {
    question: 'Who sells the products on Yukizi?',
    answer:
      'Each item is sold by a seller onboarded onto the Yukizi platform. The seller of record is shown on the product and order pages.',
  },
  {
    question: 'How can I contact Yukizi?',
    answer: `Email ${COMPANY.supportEmail} or call ${COMPANY.supportPhone} (${COMPANY.supportHours}). Full details are on the contact page at ${absoluteUrl('/contact')}.`,
  },
];

export default function AboutPage() {
  return (
    <PolicyPage
      title="About Yukizi"
      showLastUpdated={false}
      intro="Yukizi is an online store for manga, anime figures, collectibles and accessories — built for people who care about what they collect."
    >
      <PolicySection title="What we sell">
        <p>
          Our catalogue covers manga volumes and box sets, scale and chibi figures,
          and licensed accessories across the series our customers ask for most,
          including One Piece, Naruto, Bleach and Demon Slayer.
        </p>
        <p>
          Listings are fulfilled by sellers onboarded onto the Yukizi platform. Each
          product page shows the price, applicable taxes and delivery estimate before
          you commit to an order.
        </p>
      </PolicySection>

      <PolicySection title="How we work">
        <p>
          Yukizi operates as an online marketplace. We list products, take orders and
          coordinate delivery, while the seller of record for each item is shown on
          the product and order pages.
        </p>
        <p>
          Orders are packed and dispatched through our logistics partners, and every
          order can be tracked from your account once it ships.
        </p>
      </PolicySection>

      <PolicySection title="Company details">
        <p>
          {COMPANY.brandName} is operated by {COMPANY.legalName}.
        </p>
        <p>Registered office: {COMPANY.registeredAddress}</p>
        <p>CIN: {COMPANY.cin}</p>
        <p>GSTIN: {COMPANY.gstin}</p>
      </PolicySection>

      <PolicySection title="Talk to us">
        <p>
          Questions about an order, a product or the platform are welcome at{' '}
          <a
            href={`mailto:${COMPANY.supportEmail}`}
            className="text-[#562996] underline underline-offset-4"
          >
            {COMPANY.supportEmail}
          </a>
          . Our full contact details are on the{' '}
          <a href="/contact" className="text-[#562996] underline underline-offset-4">
            contact page
          </a>
          .
        </p>
      </PolicySection>

      <PolicySection title="Frequently asked questions">
        {FAQS.map((f) => (
          <div key={f.question}>
            <p className="font-semibold text-gray-900">{f.question}</p>
            <p>{f.answer}</p>
          </div>
        ))}
      </PolicySection>

      <JsonLd
        data={[
          breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'About Yukizi' }]),
          faqPageSchema(FAQS),
        ]}
      />
    </PolicyPage>
  );
}
