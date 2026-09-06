'use client';

/**
 * Light / dark switch.
 *
 * The theme is a single `dark` class on <html>, which is what the dark block in
 * globals.css keys off. The choice is stored in localStorage under
 * `yukizi-theme` and re-applied by an inline script in layout.tsx before first
 * paint, so a reload in dark mode never flashes white.
 *
 * Light is the default on purpose: a first-time visitor with no stored
 * preference gets the light site. System preference is deliberately NOT
 * followed — a shopper whose laptop happens to be in dark mode should still
 * land on the brand's default look unless they choose otherwise.
 */

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const STORAGE_KEY = 'yukizi-theme';

export function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // private mode / storage disabled — the toggle still works for this visit
  }
}

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Read from the DOM rather than storage: the inline script has already
  // resolved the theme, so the class is the single source of truth.
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = isDark ? 'light' : 'dark';
    applyTheme(next);
    setIsDark(!isDark);
  };

  // Render nothing until mounted, so the server-rendered markup can never
  // disagree with the client about which side the knob is on.
  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`group flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 transition-colors ${className}`}
    >
      <span className="flex items-center gap-3">
        <span className="relative flex h-5 w-5 items-center justify-center">
          <Sun
            className={`absolute h-5 w-5 text-[#f5a623] transition-all duration-300 ${
              isDark ? 'scale-50 opacity-0 rotate-90' : 'scale-100 opacity-100 rotate-0'
            }`}
          />
          <Moon
            className={`absolute h-5 w-5 text-[#a877ff] transition-all duration-300 ${
              isDark ? 'scale-100 opacity-100 rotate-0' : 'scale-50 opacity-0 -rotate-90'
            }`}
          />
        </span>
        <span className="text-sm font-semibold">{isDark ? 'Dark mode' : 'Light mode'}</span>
      </span>

      {/* the track */}
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-300 ${
          isDark
            ? 'border-white/20 bg-[#3b2170]'
            : 'border-black/10 bg-[#e6ddf5]'
        }`}
      >
        <span
          className={`absolute top-[2px] h-[18px] w-[18px] rounded-full shadow-sm transition-all duration-300 ${
            isDark ? 'left-[23px] bg-[#a877ff]' : 'left-[2px] bg-white'
          }`}
        />
      </span>
    </button>
  );
}
