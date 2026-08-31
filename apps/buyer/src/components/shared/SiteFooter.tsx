import Link from 'next/link';
import { Instagram, Facebook, Youtube, Linkedin, MessageCircle } from 'lucide-react';
import { COMPANY } from '@/config/company';
import { fetchSocialLinks } from '@/lib/seo/social';

const footerLinks = [
  { label: 'About', href: '/about' },
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
    { href: social.linkedin, label: "LinkedIn", Icon: Linkedin },
    { href: social.discord, label: "Discord", Icon: MessageCircle },
  ].filter((i) => !!i.href);
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
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
