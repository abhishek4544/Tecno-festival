import type { Metadata, Viewport } from 'next';
import { Instrument_Sans } from 'next/font/google';

import Navbar from '@/components/layouts/navbar/Navbar';
import Footer from '@/components/layouts/footer/Footer';

import './globals.css';

const instrumentSans = Instrument_Sans({
  variable: '--instrument-sans',
  subsets: ['latin'],
});

const SITE_TITLE = 'TECNO Mobile Nepal - Official Website - TECNO Smartphones';
const SITE_ICON =
  'https://d13pvy8xd75yde.cloudfront.net/global/x_new/tecno_icon.svg';

export const metadata: Metadata = {
  title: SITE_TITLE,
  description:
    'Celebrate Dashain with TECNO Mobile Nepal. Register your TECNO smartphone IMEI to take part in the festive campaign.',
  keywords: [
    'TECNO',
    'TECNO Mobile phone',
    'TECNO Smartphone',
    'CAMON',
    'SPARK',
    'POP',
    'Pouvoir',
    'Phantom',
    'HiOS',
  ],
  applicationName: 'tecno mobile',
  icons: {
    icon: SITE_ICON,
    shortcut: SITE_ICON,
  },
  appleWebApp: {
    capable: true,
    title: 'tecno mobile',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    type: 'website',
    title: SITE_TITLE,
    siteName: 'Tecno',
    images: [SITE_ICON],
  },
  twitter: {
    card: 'summary',
    title: SITE_TITLE,
  },
};

export const viewport: Viewport = {
  themeColor: '#fff',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${instrumentSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
