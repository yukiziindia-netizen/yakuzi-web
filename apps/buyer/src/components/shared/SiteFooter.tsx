import Link from 'next/link';
import { Instagram, Facebook, Youtube, Linkedin, MessageCircle, Twitter, MessageSquare } from 'lucide-react';
import { COMPANY } from '@/config/company';
import { fetchSocialLinks } from '@/lib/seo/social';
import { COLLECTIONS } from '@/data/collections';
import { CookiePreferencesLink } from './CookiePreferencesLink';
import SiteLinkHub from '@/components/seo/SiteLinkHub';

const footerLinks = [
  { label: 'About', href: '/about' },
  { label: 'The Store', href: '/collectibles-store-india' },
  { label: 'Contact', href: '/contact' },
  { label: 'Shipping', href: '/shipping' },
  { label: 'Returns & Refunds', href: '/returns' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Use', href: '/terms' },
  { label: 'Cookie Policy', href: '/cookie-policy' },
  { label: 'Blog', href: '/blogs' },
];

export default async function SiteFooter() {
  const social = await fetchSocialLinks();
  const socialItems = [
    { href: social.instagram, label: "Instagram", Icon: Instagram },
    { href: social.facebook, label: "Facebook", Icon: Facebook },
    { href: social.youtube, label: "YouTube", Icon: Youtube },
    // X and WhatsApp are collected in admin and already emitted in the
    // Organization sameAs, but were absent here — two configured profiles
    // that rendered nowhere on the storefront.
    { href: social.x, label: "X (Twitter)", Icon: Twitter },
    { href: social.whatsapp, label: "WhatsApp", Icon: MessageSquare },
    { href: social.linkedin, label: "LinkedIn", Icon: Linkedin },
    { href: social.discord, label: "Discord", Icon: MessageCircle },
  ].filter((i) => !!i.href);
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Collapsed by default, so the footer looks unchanged. Ships every
            facet-hub link in the initial HTML — see SiteLinkHub for why the
            links matter more than the sitemap does. */}
        <SiteLinkHub />
        {/* Sitewide internal links to the collection hubs — these landing
            pages need inbound links from every page to rank, and the footer
            is the one server-rendered surface that appears everywhere. */}
        <nav aria-label="Collections">
          <ul className="mb-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-3 text-sm text-gray-600">
            {COLLECTIONS.map((c, index) => (
              <li key={c.slug} className="flex items-center gap-2">
                {index > 0 && (
                  <span aria-hidden="true" className="text-gray-300">
                    &bull;
                  </span>
                )}
                <Link
                  href={`/collections/${c.slug}`}
                  className="transition-colors hover:text-[#562996] hover:underline underline-offset-4"
                >
                  {c.name}
                </Link>
              </li>
            ))}
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="text-gray-300">
                &bull;
              </span>
              <Link
                href="/collections"
                className="transition-colors hover:text-[#562996] hover:underline underline-offset-4"
              >
                All collections
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3 text-sm text-gray-600">
            {footerLinks.map((link, index) => (
              <li key={link.href} className="flex items-center gap-2">
                {index > 0 && (
                  <span aria-hidden="true" className="text-gray-300">
                    &bull;
                  </span>
                )}
                <Link
                  href={link.href}
                  className="transition-colors hover:text-[#562996] hover:underline underline-offset-4"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {/* Reopens the consent bar so a visitor can change their cookie
                choices at any time — required for a working opt-in flow. */}
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="text-gray-300">
                &bull;
              </span>
              <CookiePreferencesLink />
            </li>
          </ul>
        </nav>

        {socialItems.length > 0 && (
          <div className="mt-6 flex items-center justify-center gap-5">
            {socialItems.map(({ href, label, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer me"
                aria-label={label} title={label}
                className="text-gray-400 transition-colors hover:text-[#562996]">
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} {COMPANY.legalName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
