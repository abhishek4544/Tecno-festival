import type { ReactNode } from 'react';

import { GoogleAnalytics } from '@next/third-parties/google';

import Navbar from '@/components/layouts/navbar/Navbar';
import Footer from '@/components/layouts/footer/Footer';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
      {GA_MEASUREMENT_ID && <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />}
    </>
  );
}
