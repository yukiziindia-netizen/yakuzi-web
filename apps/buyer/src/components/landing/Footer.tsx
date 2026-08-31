'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Instagram, Facebook, Linkedin } from 'lucide-react';

export default function Footer({ social }: { social?: { instagram?: string; facebook?: string; linkedin?: string; whatsapp?: string } } = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Calculate document heights to check if user reached the bottom
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const isNearBottom = currentScrollY + clientHeight >= scrollHeight - 120;

      if (isNearBottom) {
        // Show footer when at the bottom of the page
        setIsVisible(true);
      } else if (currentScrollY <= 50) {
        // Hide footer when at the very top of the page
        setIsVisible(false);
      } else {
        // Show on scroll down, hide on scroll up
        if (currentScrollY > lastScrollY) {
          setIsVisible(true);
        } else if (currentScrollY < lastScrollY) {
          setIsVisible(false);
        }
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check on mount
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const hideFooter = true;
  if (hideFooter) return null;

  return (
    <footer
      className={`bg-black text-gray-400 border-t border-purple-950/40 transition-all duration-500 ease-out pb-36 sm:pb-40 pt-16 ${
        isVisible 
          ? 'opacity-100 translate-y-0 pointer-events-auto' 
          : 'opacity-0 translate-y-8 pointer-events-none'
      }`}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand/Logo Section */}
          <div className="flex flex-col gap-4 lg:col-span-1">
            <div className="flex items-center gap-2">
              <img
                src="/YukiziLogo.png"
                alt="YUKiZi"
                loading="lazy"
                decoding="async"
                className="h-[32px] w-auto object-contain"
              />
            </div>
            <p className="text-sm font-semibold text-gray-400 max-w-xs leading-relaxed mt-2">
              Delighting fans, one order at a time
            </p>
            <div className="w-16 h-1 bg-purple-600 rounded"></div>
          </div>

          {/* Contact Section */}
          <div className="flex flex-col gap-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-purple-500 mb-1">Contact</h4>
              <div className="w-8 h-[2px] bg-purple-600/45 rounded"></div>
            </div>
            <div className="flex flex-col gap-2 text-sm font-semibold leading-relaxed">
              <p>163/D, Maniktala Main Rd</p>
              <p>Kolkata, WB, India — 700054</p>
              <p className="hover:text-white transition-colors">
                <a href="tel:+919903319794">+91 99033 19794</a>
              </p>
              <p className="hover:text-white transition-colors">
                <a href="mailto:hello@yukizi.in">hello@yukizi.in</a>
              </p>
            </div>
            
            {/* Social Icons */}
            <div className="flex items-center gap-4 mt-2">
              {social?.instagram && (
                <a href={social.instagram} target="_blank" rel="noopener noreferrer me" className="text-gray-400 hover:text-purple-500 transition-colors" title="Instagram" aria-label="Instagram">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {social?.facebook && (
                <a href={social.facebook} target="_blank" rel="noopener noreferrer me" className="text-gray-400 hover:text-purple-500 transition-colors" title="Facebook" aria-label="Facebook">
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {social?.linkedin && (
                <a href={social.linkedin} target="_blank" rel="noopener noreferrer me" className="text-gray-400 hover:text-purple-500 transition-colors" title="LinkedIn" aria-label="LinkedIn">
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
              {/* WhatsApp Icon (Same as screenshot) */}
              {social?.whatsapp && (
                <a href={social!.whatsapp} className="text-gray-400 hover:text-purple-500 transition-colors" title="WhatsApp" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer me">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.528 2.025 14.07 1 11.5 1h-.008c-5.436 0-9.861 4.372-9.865 9.801-.002 1.953.51 3.856 1.484 5.567L2.122 21.84l5.525-1.451zM17.41 15.65c-.32-.16-1.89-.93-2.185-1.04-.294-.11-.51-.16-.723.16-.214.32-.83 1.04-1.018 1.25-.187.21-.375.24-.694.08-.32-.16-1.348-.5-2.568-1.59-.95-.85-1.59-1.89-1.776-2.21-.187-.32-.02-.49.14-.65.144-.144.32-.37.48-.56.16-.19.21-.32.32-.54.11-.22.05-.41-.03-.57-.08-.16-.72-1.74-.99-2.38-.262-.63-.53-.54-.73-.55-.19-.01-.41-.01-.62-.01-.21 0-.56.08-.85.4-.29.32-1.12 1.1-1.12 2.68 0 1.58 1.15 3.11 1.31 3.32.16.21 2.27 3.46 5.5 4.86.768.331 1.368.53 1.83.677.77.244 1.47.21 2.02.13.62-.09 1.89-.77 2.15-1.48.26-.71.26-1.32.19-1.45-.08-.13-.29-.21-.61-.37z"/>
                </svg>
              </a>
              )}
              {/* X Icon (Twitter) */}
              <a href="#" className="text-gray-400 hover:text-purple-500 transition-colors" title="X (Twitter)">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Explore Section */}
          <div className="flex flex-col gap-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-purple-500 mb-1">Explore</h4>
              <div className="w-8 h-[2px] bg-purple-600/45 rounded"></div>
            </div>
            <ul className="flex flex-col gap-2 text-sm font-semibold">
              <li>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('open-login'))}
                  className="hover:text-white transition-colors"
                >
                  Sign Up
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('open-login'))}
                  className="hover:text-white transition-colors"
                >
                  Login
                </button>
              </li>
              <li>
                <Link href="/" className="hover:text-white transition-colors">Browse</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">How it Works</Link>
              </li>
            </ul>
          </div>

          {/* Resources Section */}
          <div className="flex flex-col gap-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-purple-500 mb-1">Resources</h4>
              <div className="w-8 h-[2px] bg-purple-600/45 rounded"></div>
            </div>
            <ul className="flex flex-col gap-2 text-sm font-semibold">
              <li>
                <Link href="/support" className="hover:text-white transition-colors">FAQ</Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-white transition-colors">Contact</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">Join our Community</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">For Brands</Link>
              </li>
            </ul>
          </div>

          {/* Legal Section */}
          <div className="flex flex-col gap-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-purple-500 mb-1">Legal</h4>
              <div className="w-8 h-[2px] bg-purple-600/45 rounded"></div>
            </div>
            <ul className="flex flex-col gap-2 text-sm font-semibold">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">Terms of Use</Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-white transition-colors">Shipping Policy</Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-white transition-colors">Cancellation & Returns</Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
