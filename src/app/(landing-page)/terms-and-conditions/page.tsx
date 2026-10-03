import type { Metadata } from 'next';

import TermsSection from './_components/TermsSection';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Terms & Conditions for the TECNO Dashain Lucky Draw.',
};

export default function TermsAndConditionsPage() {
  return (
    <main>
      <TermsSection />
    </main>
  );
}
