import Link from 'next/link';
import { COMPANY } from '@/config/company';

const footerLinks = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Shipping', href: '/shipping' },
  { label: 'Returns & Refunds', href: '/returns' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Use', href: '/terms' },
  { label: 'Blog', href: '/blogs' },
];

export default function SiteFooter() {
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

        <p className="mt-8 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} {COMPANY.legalName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
