import type { Metadata } from 'next';
import { Open_Sans } from 'next/font/google';
import '../styles/globals.css';
import { Providers } from './providers';
import SiteFooter from '@/components/shared/SiteFooter';

const openSans = Open_Sans({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Yukizi',
  description: 'Stay updated with the latest trends and updates from Yukizi',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap" />
      </head>
      <body className={`${openSans.className} font-sans`}>
        <Providers>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <div style={{ flex: 1 }}>
              {children}
            </div>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
