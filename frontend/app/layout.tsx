import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'CommerceLead Finder',
    template: '%s | CommerceLead Finder',
  },
  description: 'Generate high-quality leads for Shopify and WordPress development, SEO, CRO, maintenance, and digital marketing services.',
  keywords: ['shopify leads', 'wordpress leads', 'ecommerce lead generation', 'seo leads', 'web development leads'],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'CommerceLead Finder',
    description: 'Lead generation tool for Shopify & WordPress agencies',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
