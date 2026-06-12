import type { Metadata } from 'next';
import { Open_Sans } from 'next/font/google';
// @ts-ignore
import '../styles/globals.css';
import { Providers } from './providers';

const openSans = Open_Sans({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Yukizi',
  description: 'India\'s Only Trusted B2B Pharma Platform for Wholesalers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={openSans.className}>
        <Providers>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <div style={{ flex: 1 }}>
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
